from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any
from datetime import datetime


class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    email: str
    name: Optional[str]
    avatar_url: Optional[str]
    preferred_track: str
    created_at: datetime

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class SessionCreate(BaseModel):
    track: str
    difficulty: str = "medium"
    company_tier: str = "mid"


class SessionOut(BaseModel):
    id: str
    user_id: str
    track: str
    difficulty: str
    company_tier: str
    status: str
    total_score: Optional[float]
    started_at: Optional[datetime]
    ended_at: Optional[datetime]
    created_at: datetime

    model_config = {"from_attributes": True}


class QuestionOut(BaseModel):
    id: str
    session_id: str
    question_text: str
    question_type: str
    order_index: int
    candidate_answer: Optional[str]
    score_overall: Optional[float]
    feedback: Optional[str]
    asked_at: datetime

    model_config = {"from_attributes": True}


class AnswerSubmit(BaseModel):
    question_id: str
    answer_text: str
    code_submission: Optional[str] = None


class CodeRunRequest(BaseModel):
    code: str
    language: str
    stdin: Optional[str] = ""


class CodeRunResult(BaseModel):
    stdout: str
    stderr: str
    exit_code: int
    execution_time: float


class ReportOut(BaseModel):
    id: str
    session_id: str
    overall_score: float
    strengths: str
    weaknesses: str
    recommendations: str
    category_scores: dict
    full_transcript: List[Any]
    created_at: datetime

    model_config = {"from_attributes": True}
