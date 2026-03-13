from sqlalchemy import Column, Integer, String, DateTime, Text, Enum
from sqlalchemy.sql import func
from app.database import Base
import enum

class LeadStatus(str, enum.Enum):
    NEW = "new"
    QUALIFIED = "qualified"
    CONTACTED = "contacted"
    CLOSED = "closed"
    DROPPED = "dropped"

class LeadScore(str, enum.Enum):
    HOT = "hot"
    WARM = "warm"
    COLD = "cold"
    UNSCORED = "unscored"

class Lead(Base):
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    company = Column(String(100), nullable=False)
    email = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)

    status = Column(String(20), default=LeadStatus.NEW)
    score = Column(String(20), default=LeadScore.UNSCORED)

    qualification_reasoning = Column(Text, nullable=True)
    followup_email = Column(Text, nullable=True)
    advisor_recommendation = Column(Text, nullable=True)
    advisor_reasoning = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())