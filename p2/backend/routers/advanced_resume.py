"""
Advanced Resume Analysis Router
Exposes advanced resume analysis features via API
"""

from fastapi import APIRouter, HTTPException, Depends, Body
from sqlalchemy.orm import Session
from typing import Optional
import os

from database import get_db
from models import User
from utils.auth import get_current_active_user
from utils.rate_limiter import rate_limit
from services.advanced_resume_analyzer import AdvancedResumeAnalyzer, VoiceFeedbackFormatter

router = APIRouter(prefix="/api/resume", tags=["resume-analysis"])


@router.post("/analyze-advanced")
async def analyze_resume_advanced(
    resume_text: str = Body(..., description="Resume text to analyze"),
    job_profile: Optional[str] = Body(None, description="Target job profile (optional)"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    _rl: None = Depends(rate_limit(auth_rpm=30, anon_rpm=5, endpoint_tag="resume-analyze")),
):
    """
    Advanced resume analysis with multiple scoring dimensions
    
    - ATS score simulation
    - Section-wise scoring
    - Grammar and language quality
    - Multi-role comparison
    - Improvement suggestions
    - Voice feedback summary
    """
    if not resume_text or len(resume_text.strip()) < 50:
        raise HTTPException(status_code=400, detail="Resume text must be at least 50 characters")
    
    try:
        analysis = AdvancedResumeAnalyzer.analyze_resume_advanced(resume_text, job_profile)
        
        return {
            "status": "success",
            "analysis": analysis,
            "user_id": current_user.id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis error: {str(e)}")


@router.post("/ats-score")
async def calculate_ats_score(
    resume_text: str = Body(..., description="Resume text"),
    job_profile: Optional[str] = Body(None, description="Job profile for comparison"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Calculate ATS (Applicant Tracking System) score for a resume
    
    Returns detailed ATS metrics:
    - Contact information score
    - Education score
    - Experience score
    - Skills score
    - Keywords matching
    - Formatting score
    - Metrics/quantifiable achievements
    """
    if not resume_text or len(resume_text.strip()) < 50:
        raise HTTPException(status_code=400, detail="Resume text required")
    
    try:
        ats_score, ats_details = AdvancedResumeAnalyzer._calculate_ats_score(
            resume_text,
            resume_text.lower(),
            job_profile
        )
        
        return {
            "status": "success",
            "overall_ats_score": ats_score,
            "breakdown": ats_details,
            "recommendation": (
                "Excellent ATS compatibility" if ats_score >= 80 else
                "Good ATS compatibility" if ats_score >= 60 else
                "Needs ATS optimization"
            )
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ATS calculation error: {str(e)}")


@router.post("/section-analysis")
async def analyze_sections(
    resume_text: str = Body(..., description="Resume text"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Detailed section-by-section analysis
    
    Analyzes:
    - Experience section
    - Skills section
    - Projects section
    - Education section
    """
    if not resume_text or len(resume_text.strip()) < 50:
        raise HTTPException(status_code=400, detail="Resume text required")
    
    try:
        sections = AdvancedResumeAnalyzer._analyze_sections(resume_text, resume_text.lower())
        
        # Calculate section average
        section_scores = [s['score'] for s in sections.values()]
        avg_section_score = sum(section_scores) / len(section_scores) if section_scores else 0
        
        return {
            "status": "success",
            "sections": sections,
            "average_section_score": int(avg_section_score),
            "recommendations": {
                section: data['feedback'] for section, data in sections.items()
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Section analysis error: {str(e)}")


@router.post("/job-profile-match")
async def compare_job_profiles(
    resume_text: str = Body(..., description="Resume text"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Compare resume against all available job profiles
    
    Returns match percentages for:
    - Software Engineer
    - Data Scientist
    - Product Manager
    - Business Analyst
    - Frontend Developer
    - DevOps Engineer
    """
    if not resume_text or len(resume_text.strip()) < 50:
        raise HTTPException(status_code=400, detail="Resume text required")
    
    try:
        comparisons = AdvancedResumeAnalyzer._compare_all_job_profiles(
            resume_text,
            resume_text.lower()
        )
        
        # Get top 3 matches
        top_matches = dict(list(comparisons.items())[:3])
        
        return {
            "status": "success",
            "all_profiles": comparisons,
            "top_matches": top_matches,
            "best_fit": list(top_matches.keys())[0] if top_matches else None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Profile comparison error: {str(e)}")


@router.post("/grammar-check")
async def check_grammar(
    resume_text: str = Body(..., description="Resume text"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Check grammar, spelling, and language quality
    
    Detects:
    - Passive voice
    - Weak words
    - Capitalization issues
    - Punctuation problems
    - Common misspellings
    """
    if not resume_text or len(resume_text.strip()) < 50:
        raise HTTPException(status_code=400, detail="Resume text required")
    
    try:
        grammar_result = AdvancedResumeAnalyzer._check_grammar_and_language(
            resume_text,
            resume_text.lower()
        )
        language_result = AdvancedResumeAnalyzer._analyze_language_quality(
            resume_text,
            resume_text.lower()
        )
        
        return {
            "status": "success",
            "grammar_quality": grammar_result,
            "language_quality": language_result,
            "overall_quality_score": (
                (grammar_result['overall_score'] + language_result['overall_score']) / 2
            ),
            "issues": grammar_result['issues'] + language_result['issues'][:2]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Grammar check error: {str(e)}")


@router.post("/voice-feedback")
async def generate_voice_feedback(
    resume_text: str = Body(..., description="Resume text"),
    job_profile: Optional[str] = Body(None, description="Job profile"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Generate voice-friendly feedback summary for the resume
    
    Returns TTS-ready text that can be converted to speech
    """
    if not resume_text or len(resume_text.strip()) < 50:
        raise HTTPException(status_code=400, detail="Resume text required")
    
    try:
        analysis = AdvancedResumeAnalyzer.analyze_resume_advanced(resume_text, job_profile)
        voice_feedback = VoiceFeedbackFormatter.format_for_voice(analysis)
        
        return {
            "status": "success",
            "voice_feedback": voice_feedback,
            "can_text_to_speech": True
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Voice feedback error: {str(e)}")


@router.post("/compare-with-job")
async def compare_with_job_description(
    resume_text: str = Body(..., description="Resume text"),
    job_description: str = Body(..., description="Job description"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Compare resume with a specific job description
    
    Performs gap analysis and suggests improvements
    """
    if not resume_text or len(resume_text.strip()) < 50:
        raise HTTPException(status_code=400, detail="Resume text required")
    if not job_description or len(job_description.strip()) < 50:
        raise HTTPException(status_code=400, detail="Job description required")
    
    try:
        comparison = AdvancedResumeAnalyzer.compare_resume_with_job_description(
            resume_text,
            job_description
        )
        
        return {
            "status": "success",
            "comparison": comparison,
            "tailor_needed": comparison['match_percentage'] < 75
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Job comparison error: {str(e)}")


@router.get("/available-profiles")
async def list_available_profiles(
    current_user: User = Depends(get_current_active_user)
):
    """List all available job profiles for analysis"""
    profiles = []
    
    for profile_key, profile_data in AdvancedResumeAnalyzer.JOB_PROFILES.items():
        profiles.append({
            "id": profile_key,
            "title": profile_data['title'],
            "required_skills": profile_data['required_skills'],
            "preferred_skills": profile_data['preferred_skills'][:5],  # Top 5
            "min_years": profile_data['min_years']
        })
    
    return {
        "status": "success",
        "profiles": profiles,
        "total": len(profiles)
    }
