"""
AI Interview Router
Handles AI-powered interview question generation and answer analysis
"""
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from fastapi import Depends
import json
import uuid
import os
import shutil
import subprocess
import tempfile
from typing import List, Dict

from database import get_db
from models import AIInterviewSession, AIInterviewAnswer
from services.ai_interviewer import ai_interviewer
from services.audio_processing import transcribe_audio
from utils.rate_limiter import rate_limit

router = APIRouter()

# Store active WebSocket connections for real-time interview
active_connections: Dict[str, WebSocket] = {}

# Template/form field patterns that indicate non-job-description content
_TEMPLATE_FIELD_PATTERNS = [
    r"^description\s*$", r"^impacted services", r"^primary configuration item",
    r"^steps to reproduce", r"^workaround", r"^solution\s*$",
    r"^provide a detailed explanation", r"^list the services",
    r"^describe the main configuration", r"^summarize the steps",
    r"^describe how your team", r"^describe how the known error",
]

def sanitize_job_description(raw: str) -> str:
    """
    Strip Jira/template/form-field content from job description.
    Returns a clean role-context string safe to pass to Gemini.
    """
    import re
    lines = raw.strip().splitlines()
    clean_lines = []
    for line in lines:
        stripped = line.strip().lower()
        is_template = any(re.match(p, stripped) for p in _TEMPLATE_FIELD_PATTERNS)
        if not is_template and len(stripped) > 2:
            clean_lines.append(line.strip())

    cleaned = " ".join(clean_lines).strip()

    # If nothing useful remains, fall back to a generic prompt
    if len(cleaned) < 20:
        cleaned = f"Generate relevant technical and behavioral interview questions for this role."

    return cleaned


@router.get("/ai-interview/status")
async def ai_interview_status():
    """Return AI interview backend readiness and Gemini availability."""
    return {
        "success": True,
        "api_connected": True,
        "gemini_active": bool(getattr(ai_interviewer, "use_gemini", False)),
        "model": getattr(ai_interviewer, "model", None).__class__.__name__ if getattr(ai_interviewer, "model", None) else None,
    }


@router.post("/ai-interview/test-upload")
async def test_upload(
    resume: UploadFile = File(...)
):
    """Test endpoint to check if file upload and text extraction works"""
    try:
        content = await resume.read()
        print(f"File received: {resume.filename}, size: {len(content)} bytes")
        
        text = ai_interviewer.extract_text_from_file(content, resume.filename)
        
        return {
            "success": True,
            "filename": resume.filename,
            "file_size": len(content),
            "extracted_length": len(text),
            "preview": text[:500] if text else "No text extracted"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@router.post("/ai-interview/start")
async def start_ai_interview(
    resume: UploadFile = File(...),
    job_description: str = Form(...),
    num_questions: int = Form(5),
    difficulty: str = Form("intermediate"),
    db: Session = Depends(get_db),
    _rl: None = Depends(rate_limit(auth_rpm=20, anon_rpm=5, endpoint_tag="ai-interview-start")),
):
    """
    Start a new AI interview session
    Upload resume and job description to generate questions
    """
    try:
        # Validate difficulty level
        valid_difficulties = ["beginner", "intermediate", "advanced"]
        if difficulty not in valid_difficulties:
            difficulty = "intermediate"
        
        # Validate file type
        if not resume.filename.lower().endswith(('.pdf', '.docx', '.doc', '.txt')):
            raise HTTPException(
                status_code=400,
                detail="Invalid file format. Please upload PDF, DOCX, or TXT file"
            )
        
        # Read resume content
        resume_content = await resume.read()
        
        # Extract text from resume
        try:
            resume_text = ai_interviewer.extract_text_from_file(resume_content, resume.filename)
            print(f"✓ Extracted {len(resume_text)} characters from {resume.filename}")
            print(f"Preview: {resume_text[:200]}...")
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        
        if not resume_text or len(resume_text.strip()) < 10:
            raise HTTPException(
                status_code=400,
                detail=f"Resume text is too short ({len(resume_text.strip()) if resume_text else 0} characters). Please ensure the file contains readable text."
            )
        
        # Sanitize job description - strip any template/form-like content
        # and ensure it's treated as role context, not literal content
        sanitized_jd = sanitize_job_description(job_description)
        print(f"✓ Sanitized job description ({len(sanitized_jd)} chars): {sanitized_jd[:100]}...")
        
        # Generate questions with difficulty level
        questions = await ai_interviewer.generate_questions(
            resume_text, 
            sanitized_jd, 
            num_questions,
            difficulty
        )
        
        # Create session
        session_id = f"ai_session_{uuid.uuid4().hex[:12]}"
        
        session = AIInterviewSession(
            session_id=session_id,
            resume_text=resume_text[:5000],  # Store first 5000 chars
            job_description=job_description[:2000],
            questions=json.dumps(questions),
            num_questions=len(questions),
            difficulty=difficulty,
            status="active"
        )
        
        db.add(session)
        db.commit()
        db.refresh(session)
        
        return {
            "success": True,
            "session_id": session_id,
            "questions": questions,
            "num_questions": len(questions),
            "difficulty": difficulty
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start interview: {str(e)}")


@router.post("/ai-interview/start-role")
async def start_ai_interview_role(
    role: str = Form(...),
    num_questions: int = Form(5),
    years_of_experience: int = Form(3),
    db: Session = Depends(get_db),
    _rl: None = Depends(rate_limit(auth_rpm=20, anon_rpm=5, endpoint_tag="ai-interview-role")),
):
    """Start a free interview flow with pre-generated questions for a role"""
    try:
        valid_roles = [
            "frontend developer",
            "backend developer",
            "software developer",
            "ai/ml engineer"
        ]

        raw_role = role.strip().lower()
        if raw_role not in valid_roles and raw_role.replace(' ', '') not in [r.replace(' ', '') for r in valid_roles]:
            raise HTTPException(status_code=400, detail=f"Invalid role. Choose from: {', '.join(valid_roles)}")

        questions = ai_interviewer.generate_questions_for_role(
            role,
            num_questions,
            years_of_experience
        )

        if not questions:
            raise HTTPException(status_code=500, detail=f"No questions generated for role: {role}")

        session_id = f"ai_session_{uuid.uuid4().hex[:12]}"
        session = AIInterviewSession(
            session_id=session_id,
            resume_text="",
            job_description=f"Free role interview for {role} ({years_of_experience} yrs)",
            questions=json.dumps(questions),
            num_questions=len(questions),
            difficulty="beginner" if years_of_experience <=1 else "intermediate" if years_of_experience <=4 else "advanced",
            status="active"
        )

        db.add(session)
        db.commit()
        db.refresh(session)

        return {
            "success": True,
            "session_id": session_id,
            "questions": questions,
            "num_questions": len(questions),
            "role": role,
            "years_of_experience": years_of_experience
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start role-based interview: {str(e)}")


@router.post("/ai-interview/submit-answer")
async def submit_answer(
    session_id: str = Form(...),
    question_index: int = Form(...),
    answer_audio: UploadFile = File(None),
    answer_text: str = Form(None),
    answer_duration: float = Form(...),
    db: Session = Depends(get_db),
    _rl: None = Depends(rate_limit(auth_rpm=30, anon_rpm=5, endpoint_tag="submit-answer")),
):
    """
    Submit an answer for a specific question
    Can include audio file (will be transcribed) or direct text
    """
    try:
        # Get session
        session = db.query(AIInterviewSession).filter(
            AIInterviewSession.session_id == session_id
        ).first()
        
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Get question
        questions = json.loads(session.questions)
        if question_index >= len(questions):
            raise HTTPException(status_code=400, detail="Invalid question index")
        
        question = questions[question_index]
        
        # Get answer text
        if answer_audio:
            print(f"Received audio file: {answer_audio.filename}, size: {answer_audio.file.tell() if hasattr(answer_audio, 'file') else 'unknown'}")
            temp_webm_path = None
            temp_wav_path = None
            try:
                # Save raw browser audio (.webm) temporarily
                with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as temp_file:
                    content = await answer_audio.read()
                    print(f"Audio content size: {len(content)} bytes")
                    temp_file.write(content)
                    temp_webm_path = temp_file.name

                # Ensure bundled ffmpeg alias is on PATH
                from services.audio_processing import _ensure_ffmpeg_on_path
                _ensure_ffmpeg_on_path()

                # Convert .webm → .wav so Whisper can decode it
                temp_wav_path = temp_webm_path.replace(".webm", ".wav")
                ffmpeg_cmd = shutil.which("ffmpeg")
                if not ffmpeg_cmd:
                    try:
                        import imageio_ffmpeg
                        ffmpeg_cmd = imageio_ffmpeg.get_ffmpeg_exe()
                    except Exception:
                        pass

                if ffmpeg_cmd:
                    conv = subprocess.run(
                        [ffmpeg_cmd, "-y", "-i", temp_webm_path,
                         "-ar", "16000", "-ac", "1", "-f", "wav", temp_wav_path],
                        stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                        creationflags=subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0,
                    )
                    if conv.returncode == 0:
                        transcribe_path = temp_wav_path
                        print(f"Converted webm→wav: {temp_wav_path}")
                    else:
                        print(f"FFmpeg conversion failed: {conv.stderr.decode(errors='replace')[-200:]}")
                        transcribe_path = temp_webm_path
                else:
                    print("FFmpeg not found — passing webm directly to Whisper")
                    transcribe_path = temp_webm_path

                print(f"Starting transcription for file: {transcribe_path}")
                transcript_data = transcribe_audio(transcribe_path)
                transcribed_text = transcript_data["text"]
                print(f"Transcription result: '{transcribed_text}'")

                if transcribed_text and transcribed_text.strip():
                    answer_text = transcribed_text
                elif answer_text:
                    print("Using provided answer_text as fallback")
                else:
                    print("Transcription returned empty text, using fallback")
                    answer_text = "[Audio transcription failed - unable to process audio]"

            finally:
                for p in [temp_webm_path, temp_wav_path]:
                    if p and os.path.exists(p):
                        os.remove(p)
        
        if not answer_text:
            raise HTTPException(status_code=400, detail="No answer provided")
        
        # Analyze answer
        analysis = await ai_interviewer.analyze_answer(question, answer_text, answer_duration)
        
        # Save answer
        answer = AIInterviewAnswer(
            session_id=session_id,
            question_index=question_index,
            answer_text=answer_text,
            answer_duration=answer_duration,
            score=analysis["score"],
            feedback=analysis["feedback"],
            relevance_score=analysis["metrics"]["relevance"],
            completeness_score=analysis["metrics"]["completeness"],
            clarity_score=analysis["metrics"]["clarity"],
            word_count=analysis.get("word_count", 0)
        )
        
        db.add(answer)
        db.commit()
        
        return {
            "success": True,
            "answer_text": answer_text,
            "analysis": analysis
        }
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to submit answer: {str(e)}")


@router.post("/ai-interview/complete")
async def complete_interview(
    request: dict,
    db: Session = Depends(get_db)
):
    """
    Complete the interview and get overall results
    """
    try:
        session_id = request.get('session_id')
        if not session_id:
            raise HTTPException(status_code=400, detail="session_id is required")
            
        print(f"📊 Completing interview for session: {session_id}")
        
        # Get session
        session = db.query(AIInterviewSession).filter(
            AIInterviewSession.session_id == session_id
        ).first()
        
        if not session:
            print(f"❌ Session not found: {session_id}")
            raise HTTPException(status_code=404, detail="Session not found")
        
        print(f"✓ Session found: {session.session_id}")
        
        # Get all answers
        answers = db.query(AIInterviewAnswer).filter(
            AIInterviewAnswer.session_id == session_id
        ).all()
        
        print(f"✓ Found {len(answers)} answers")
        
        if not answers:
            raise HTTPException(status_code=400, detail="No answers submitted")
        
        # Prepare answer results
        questions = json.loads(session.questions)
        answer_results = []
        
        for answer in answers:
            if answer.question_index < len(questions):
                answer_results.append({
                    "score": answer.score,
                    "type": questions[answer.question_index].get("type", "general"),
                    "feedback": answer.feedback
                })
        
        print(f"✓ Prepared {len(answer_results)} answer results")
        
        # Calculate overall score
        overall_results = ai_interviewer.calculate_overall_knowledge_score(answer_results)
        
        print(f"✓ Overall score: {overall_results['overall_score']}")
        
        # Update session status
        session.status = "completed"
        db.commit()
        
        # Prepare detailed results
        detailed_answers = []
        for answer in answers:
            if answer.question_index < len(questions):
                detailed_answers.append({
                    "question": questions[answer.question_index]["question"],
                    "answer": answer.answer_text,
                    "score": answer.score,
                    "feedback": answer.feedback,
                    "metrics": {
                        "relevance": answer.relevance_score,
                        "completeness": answer.completeness_score,
                        "clarity": answer.clarity_score
                    }
                })
        
        return {
            "success": True,
            "session_id": session_id,
            "overall_results": overall_results,
            "detailed_answers": detailed_answers
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to complete interview: {str(e)}")


@router.get("/ai-interview/session/{session_id}")
async def get_session(session_id: str, db: Session = Depends(get_db)):
    """Get session details"""
    session = db.query(AIInterviewSession).filter(
        AIInterviewSession.session_id == session_id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    questions = json.loads(session.questions)
    
    # Get answered questions
    answers = db.query(AIInterviewAnswer).filter(
        AIInterviewAnswer.session_id == session_id
    ).all()
    
    answered_indices = [a.question_index for a in answers]
    
    return {
        "session_id": session.session_id,
        "questions": questions,
        "num_questions": session.num_questions,
        "status": session.status,
        "answered_questions": answered_indices,
        "timestamp": session.timestamp.isoformat()
    }


@router.get("/ai-interview/history")
async def get_interview_history(db: Session = Depends(get_db)):
    """Get list of all AI interview sessions"""
    sessions = db.query(AIInterviewSession).order_by(
        AIInterviewSession.timestamp.desc()
    ).limit(50).all()
    
    results = []
    for session in sessions:
        # Get answer count and average score
        answers = db.query(AIInterviewAnswer).filter(
            AIInterviewAnswer.session_id == session.session_id
        ).all()
        
        avg_score = sum(a.score for a in answers) / len(answers) if answers else 0
        
        results.append({
            "session_id": session.session_id,
            "timestamp": session.timestamp.isoformat(),
            "num_questions": session.num_questions,
            "answered_questions": len(answers),
            "average_score": int(avg_score),
            "status": session.status
        })
    
    return {"sessions": results}


@router.post("/transcribe")
async def transcribe_audio_endpoint(
    audio: UploadFile = File(...)
):
    """
    Transcribe an audio blob using local Whisper model.
    Accepts any audio format (webm, mp4, ogg, wav).
    """
    temp_path = None
    try:
        suffix = os.path.splitext(audio.filename or "audio.webm")[1] or ".webm"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(await audio.read())
            temp_path = tmp.name

        result = transcribe_audio(temp_path)
        transcript = result.get("text", "").strip()

        return {"transcript": transcript, "success": True}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")

    finally:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)
