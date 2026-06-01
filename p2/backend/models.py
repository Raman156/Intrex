from sqlalchemy import Column, Integer, Float, String, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


# -----------------------------
# USER MODEL
# -----------------------------

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)

    hashed_password = Column(String, nullable=False)
    full_name = Column(String)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Resume
    resume_filename = Column(String, nullable=True)
    resume_text = Column(Text, nullable=True)
    resume_uploaded_at = Column(DateTime, nullable=True)

    # Profile
    phone = Column(String, nullable=True)
    location = Column(String, nullable=True)

    is_active = Column(Boolean, default=True)

    # OAuth
    google_id = Column(String, unique=True, index=True, nullable=True)
    oauth_provider = Column(String, nullable=True)
    profile_picture = Column(String, nullable=True)

    # MFA
    mfa_enabled = Column(Boolean, default=False)
    mfa_secret = Column(String, nullable=True)

    # Relationships
    interviews = relationship("Interview", back_populates="user")
    ai_sessions = relationship("AIInterviewSession", back_populates="user")
    resume_drafts = relationship("ResumeDraft", back_populates="user")


# -----------------------------
# VIDEO INTERVIEW RESULT
# -----------------------------

class Interview(Base):
    __tablename__ = "interviews"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"))

    timestamp = Column(DateTime, default=datetime.utcnow)

    eye_contact_score = Column(Float)
    head_stability_score = Column(Float)
    smile_score = Column(Float)
    face_presence_percentage = Column(Float)

    speech_rate = Column(Float)
    filler_percentage = Column(Float)
    pitch_mean = Column(Float)
    pitch_variance = Column(Float)
    energy_stability = Column(Float)

    confidence_score = Column(Integer)

    strengths = Column(Text)
    improvements = Column(Text)

    video_duration = Column(Float)
    transcript = Column(Text)

    user = relationship("User", back_populates="interviews")


class ResumeDraft(Base):
    __tablename__ = "resume_drafts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    template_id = Column(String, nullable=False, default="modern")
    resume_data = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="resume_drafts")


# -----------------------------
# AI INTERVIEW SESSION
# -----------------------------

class AIInterviewSession(Base):
    __tablename__ = "ai_interview_sessions"

    id = Column(Integer, primary_key=True, index=True)

    session_id = Column(String, unique=True, index=True, nullable=False)

    user_id = Column(Integer, ForeignKey("users.id"))

    timestamp = Column(DateTime, default=datetime.utcnow)

    resume_text = Column(Text, nullable=False)
    job_description = Column(Text, nullable=False)

    questions = Column(Text, nullable=False)

    num_questions = Column(Integer, default=5)
    
    difficulty = Column(String, default="intermediate")  # beginner, intermediate, advanced

    status = Column(String, default="active")

    user = relationship("User", back_populates="ai_sessions")

    answers = relationship(
        "AIInterviewAnswer",
        back_populates="session",
        cascade="all, delete-orphan"
    )


# -----------------------------
# AI INTERVIEW ANSWERS
# -----------------------------

class AIInterviewAnswer(Base):
    __tablename__ = "ai_interview_answers"

    id = Column(Integer, primary_key=True, index=True)

    session_id = Column(String, ForeignKey("ai_interview_sessions.session_id"))

    question_index = Column(Integer, nullable=False)

    answer_text = Column(Text, nullable=False)
    answer_duration = Column(Float, nullable=False)

    score = Column(Integer)

    feedback = Column(Text)

    relevance_score = Column(Integer)
    completeness_score = Column(Integer)
    clarity_score = Column(Integer)

    word_count = Column(Integer)

    timestamp = Column(DateTime, default=datetime.utcnow)

    session = relationship("AIInterviewSession", back_populates="answers")