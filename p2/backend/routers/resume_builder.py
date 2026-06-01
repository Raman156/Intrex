"""Resume Builder API Router

Provides persistent draft storage, preview rendering, export endpoints, and job description matching.
"""

import json
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Body, Response
from sqlalchemy.orm import Session

from database import get_db
from models import ResumeDraft, User
from utils.auth import get_current_active_user
from services.resume_builder import ResumeBuilderService

router = APIRouter(prefix="/api/resume-builder", tags=["resume-builder"])


@router.get("/drafts")
async def list_resume_drafts(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    drafts = db.query(ResumeDraft).filter(ResumeDraft.user_id == current_user.id).order_by(ResumeDraft.updated_at.desc()).all()
    return {
        'status': 'success',
        'drafts': [
            {
                'id': draft.id,
                'title': draft.title,
                'template_id': draft.template_id,
                'resume_data': json.loads(draft.resume_data),
                'created_at': draft.created_at.isoformat() if draft.created_at else None,
                'updated_at': draft.updated_at.isoformat() if draft.updated_at else None,
            }
            for draft in drafts
        ]
    }


@router.post("/draft")
async def save_resume_draft(
    draft_id: Optional[int] = Body(None, description="Existing draft ID to update"),
    title: str = Body(..., description="Draft title"),
    template_id: str = Body('modern', description="Selected template ID"),
    resume_data: dict = Body(..., description="Structured resume JSON data"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if not title.strip():
        raise HTTPException(status_code=400, detail="Draft title is required")
    try:
        normalized = ResumeBuilderService.normalize_resume_data({
            'title': title,
            'template_id': template_id,
            **resume_data
        })
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid resume data: {str(e)}")

    if draft_id:
        draft = db.query(ResumeDraft).filter(ResumeDraft.id == draft_id, ResumeDraft.user_id == current_user.id).first()
        if not draft:
            raise HTTPException(status_code=404, detail="Draft not found")
        draft.title = normalized['title']
        draft.template_id = normalized['template_id']
        draft.resume_data = json.dumps(normalized)
        draft.updated_at = datetime.utcnow()
    else:
        draft = ResumeDraft(
            user_id=current_user.id,
            title=normalized['title'],
            template_id=normalized['template_id'],
            resume_data=json.dumps(normalized),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(draft)

    db.commit()
    db.refresh(draft)

    return {
        'status': 'success',
        'draft': {
            'id': draft.id,
            'title': draft.title,
            'template_id': draft.template_id,
            'resume_data': json.loads(draft.resume_data),
            'created_at': draft.created_at.isoformat() if draft.created_at else None,
            'updated_at': draft.updated_at.isoformat() if draft.updated_at else None,
        }
    }


@router.delete("/draft/{draft_id}")
async def delete_resume_draft(
    draft_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    draft = db.query(ResumeDraft).filter(ResumeDraft.id == draft_id, ResumeDraft.user_id == current_user.id).first()
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")
    db.delete(draft)
    db.commit()
    return {'status': 'success', 'message': 'Draft deleted successfully'}


@router.post("/render")
async def render_resume_preview(
    resume_data: dict = Body(..., description="Structured resume JSON data"),
):
    try:
        preview = ResumeBuilderService.render_preview(resume_data)
        return {'status': 'success', 'preview': preview}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Preview render error: {str(e)}")


@router.post("/export")
async def export_resume(
    resume_data: dict = Body(..., description="Structured resume JSON data"),
    template_id: str = Body('modern', description="Template ID"),
    format: str = Body('text', description="Export format: text, markdown, html, json"),
):
    normalized = ResumeBuilderService.normalize_resume_data({
        'template_id': template_id,
        **resume_data
    })

    format_lower = format.strip().lower()
    if format_lower == 'markdown':
        content = ResumeBuilderService.format_resume_markdown(normalized)
        media_type = 'text/markdown'
        extension = 'md'
    elif format_lower == 'html':
        content = ResumeBuilderService.format_resume_html(normalized, normalized['template_id'])
        media_type = 'text/html'
        extension = 'html'
    elif format_lower == 'pdf':
        content = ResumeBuilderService.format_resume_pdf(normalized)
        media_type = 'application/pdf'
        extension = 'pdf'
    elif format_lower == 'word':
        content = ResumeBuilderService.format_resume_word(normalized)
        media_type = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        extension = 'docx'
    elif format_lower == 'json':
        content = json.dumps(normalized, indent=2)
        media_type = 'application/json'
        extension = 'json'
    elif format_lower == 'text':
        content = ResumeBuilderService.format_resume_text(normalized)
        media_type = 'text/plain'
        extension = 'txt'
    else:
        raise HTTPException(status_code=400, detail='Unsupported export format')

    filename = f"{normalized['title'].replace(' ', '_') or 'resume'}.{extension}"
    headers = {
        'Content-Disposition': f'attachment; filename="{filename}"'
    }
    return Response(content=content, media_type=media_type, headers=headers)


@router.post("/match-job-description")
async def match_job_description(
    resume_data: Optional[dict] = Body(None, description="Structured resume JSON data"),
    resume_text: Optional[str] = Body(None, description="Raw resume text"),
    job_description: str = Body(..., description="Job description text"),
):
    if not job_description or not job_description.strip():
        raise HTTPException(status_code=400, detail='Job description is required')

    resume_payload = resume_text or ResumeBuilderService.format_resume_text(resume_data or {})
    if not resume_payload.strip():
        raise HTTPException(status_code=400, detail='Resume text or structured resume data is required')

    try:
        match_result = ResumeBuilderService.match_job_description(resume_payload, job_description)
        return {'status': 'success', 'match': match_result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Job description match error: {str(e)}")
