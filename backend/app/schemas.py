from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models import LeadStatus, LeadScore

class LeadCreate(BaseModel):
    name: str
    company: str
    email: str
    message: str

class LeadUpdate(BaseModel):
    status: Optional[LeadStatus] = None
    score: Optional[LeadScore] = None

class LeadResponse(BaseModel):
    id: int
    name: str
    company: str
    email: str
    message: str
    status: LeadStatus
    score: LeadScore
    qualification_reasoning: Optional[str] = None
    followup_email: Optional[str] = None
    advisor_recommendation: Optional[str] = None
    advisor_reasoning: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

#Agent output schemas 

class QualificationResult(BaseModel):
    score: LeadScore
    reasoning: str
    confidence: float  # 0.0 to 1.0
    key_signals: list[str]

class FollowupResult(BaseModel):
    subject: str
    body: str
    tone: str
    personalization_notes: str

class AdvisorResult(BaseModel):
    recommendation: str # "schedule_call" | "send_demo" | "offer_discount" | "drop_lead"
    reasoning: str
    urgency: str # "high" | "medium" | "low"
    next_steps: list[str]

class AgentRunResponse(BaseModel):
    lead_id: int
    qualification: QualificationResult
    followup: FollowupResult
    advisor: AdvisorResult
    total_tokens_used: int