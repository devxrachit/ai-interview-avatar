from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Text, Boolean, JSON
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid
from db.database import Base


def gen_uuid():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=gen_uuid)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String)
    avatar_url = Column(String)
    github_id = Column(String, unique=True, nullable=True)
    google_id = Column(String, unique=True, nullable=True)
    hashed_password = Column(String, nullable=True)
    role = Column(String, default="candidate")
    preferred_track = Column(String, default="fullstack")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    sessions = relationship("InterviewSession", back_populates="user")


class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    track = Column(String, nullable=False)  # dsa | system_design | behavioral
    difficulty = Column(String, default="medium")  # easy | medium | hard
    company_tier = Column(String, default="mid")  # startup | mid | faang
    status = Column(String, default="setup")  # setup | intro | active | analysis | done
    total_score = Column(Float, nullable=True)
    started_at = Column(DateTime, nullable=True)
    ended_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="sessions")
    questions = relationship("Question", back_populates="session")
    report = relationship("SessionReport", back_populates="session", uselist=False)


class Question(Base):
    __tablename__ = "questions"

    id = Column(String, primary_key=True, default=gen_uuid)
    session_id = Column(String, ForeignKey("interview_sessions.id"), nullable=False)
    question_text = Column(Text, nullable=False)
    question_type = Column(String)  # dsa | system_design | behavioral
    order_index = Column(Integer, default=0)
    candidate_answer = Column(Text, nullable=True)
    code_submission = Column(Text, nullable=True)
    score_correctness = Column(Float, nullable=True)
    score_communication = Column(Float, nullable=True)
    score_edge_cases = Column(Float, nullable=True)
    score_complexity = Column(Float, nullable=True)
    score_overall = Column(Float, nullable=True)
    feedback = Column(Text, nullable=True)
    follow_up_topics = Column(JSON, nullable=True)
    asked_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    answered_at = Column(DateTime, nullable=True)

    session = relationship("InterviewSession", back_populates="questions")


class SessionReport(Base):
    __tablename__ = "session_reports"

    id = Column(String, primary_key=True, default=gen_uuid)
    session_id = Column(String, ForeignKey("interview_sessions.id"), nullable=False)
    overall_score = Column(Float)
    strengths = Column(Text)
    weaknesses = Column(Text)
    recommendations = Column(Text)
    category_scores = Column(JSON)
    full_transcript = Column(JSON)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    session = relationship("InterviewSession", back_populates="report")
