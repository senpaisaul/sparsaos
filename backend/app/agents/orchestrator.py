import asyncio
from app.agents.qualifier import qualify_lead
from app.agents.drafter import draft_followup
from app.agents.advisor import advise_deal
from app.schemas import AgentRunResponse
from app.models import Lead, LeadStatus
from sqlalchemy.orm import Session


async def run_pipeline(lead: Lead, db: Session) -> AgentRunResponse:
    """
    Orchestrates all 3 agents for a given lead.
    Agents 1 runs first (qualification needed by agents 2 & 3).
    Agents 2 and 3 run in parallel after agent 1 completes.
    """

    # Agent 1: Qualify the lead first
    qualification, tokens_1 = await qualify_lead(
        name=lead.name,
        company=lead.company,
        message=lead.message
    )

    # Agents 2 & 3 run concurrently — they both depend on qualification
    (followup, tokens_2), (advisor, tokens_3) = await asyncio.gather(
        draft_followup(
            name=lead.name,
            company=lead.company,
            original_message=lead.message,
            qualification=qualification
        ),
        advise_deal(
            name=lead.name,
            company=lead.company,
            original_message=lead.message,
            qualification=qualification
        )
    )

    # Persist results back to DB
    lead.score = qualification.score
    lead.qualification_reasoning = f"{qualification.reasoning} | Signals: {', '.join(qualification.key_signals)}"
    lead.followup_email = f"Subject: {followup.subject}\n\n{followup.body}"
    lead.advisor_recommendation = advisor.recommendation
    lead.advisor_reasoning = advisor.reasoning
    lead.status = LeadStatus.QUALIFIED

    db.commit()
    db.refresh(lead)

    return AgentRunResponse(
        lead_id=lead.id,
        qualification=qualification,
        followup=followup,
        advisor=advisor,
        total_tokens_used=tokens_1 + tokens_2 + tokens_3
    )