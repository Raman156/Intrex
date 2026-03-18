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
from typing import List, Dict

from database import get_db
from models import AIInterviewSession, AIInterviewAnswer
from services.ai_interviewer import ai_interviewer
from services.audio_processing import transcribe_audio
import os
import tempfile

router = APIRouter()

# Store active WebSocket connections for real-time interview
active_connections: Dict[str, WebSocket] = {}


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
    db: Session = Depends(get_db)
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
        
        # Generate questions with difficulty level
        questions = ai_interviewer.generate_questions(
            resume_text, 
            job_description, 
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


@router.post("/ai-interview/submit-answer")
async def submit_answer(
    session_id: str = Form(...),
    question_index: int = Form(...),
    answer_audio: UploadFile = File(None),
    answer_text: str = Form(None),
    answer_duration: float = Form(...),
    db: Session = Depends(get_db)
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
            # Transcribe audio
            temp_audio_path = None
            try:
                # Save audio temporarily
                with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as temp_file:
                    content = await answer_audio.read()
                    temp_file.write(content)
                    temp_audio_path = temp_file.name
                
                # Transcribe
                transcript_data = transcribe_audio(temp_audio_path)
                answer_text = transcript_data["text"]
                
            finally:
                if temp_audio_path and os.path.exists(temp_audio_path):
                    os.remove(temp_audio_path)
        
        if not answer_text:
            raise HTTPException(status_code=400, detail="No answer provided")
        
        # Analyze answer
        analysis = ai_interviewer.analyze_answer(question, answer_text, answer_duration)
        
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
