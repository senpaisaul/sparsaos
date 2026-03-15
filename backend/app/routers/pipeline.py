from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.database import get_db, SessionLocal
from app.models import Lead, LeadStatus
from app.agents.qualifier import qualify_lead
from app.agents.drafter import draft_followup
from app.agents.advisor import advise_deal
import json
import asyncio
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/pipeline", tags=["pipeline"])


async def stream_agent_events(lead_id: int):
    db: Session = SessionLocal()
    try:
        lead = db.query(Lead).filter(Lead.id == lead_id).first()
        if not lead:
            yield f"data: {json.dumps({'event': 'error', 'message': 'Lead not found'})}\n\n"
            return

        yield f"data: {json.dumps({'event': 'started', 'lead_id': lead.id})}\n\n"
        await asyncio.sleep(0.05)

        yield f"data: {json.dumps({'event': 'agent_start', 'agent': 'qualifier'})}\n\n"
        await asyncio.sleep(0.05)

        qualification, tokens_1 = await qualify_lead(
            name=lead.name,
            company=lead.company,
            message=lead.message
        )

        yield f"data: {json.dumps({'event': 'agent_done', 'agent': 'qualifier', 'data': {'score': qualification.score.value, 'reasoning': qualification.reasoning, 'confidence': qualification.confidence, 'key_signals': qualification.key_signals}})}\n\n"
        await asyncio.sleep(0.05)

        yield f"data: {json.dumps({'event': 'agent_start', 'agent': 'drafter'})}\n\n"
        await asyncio.sleep(0.05)
        yield f"data: {json.dumps({'event': 'agent_start', 'agent': 'advisor'})}\n\n"
        await asyncio.sleep(0.05)

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

        yield f"data: {json.dumps({'event': 'agent_done', 'agent': 'drafter', 'data': {'subject': followup.subject, 'body': followup.body, 'tone': followup.tone}})}\n\n"
        await asyncio.sleep(0.05)

        yield f"data: {json.dumps({'event': 'agent_done', 'agent': 'advisor', 'data': {'recommendation': advisor.recommendation, 'reasoning': advisor.reasoning, 'urgency': advisor.urgency, 'next_steps': advisor.next_steps}})}\n\n"
        await asyncio.sleep(0.05)

        try:
            lead.score                    = qualification.score.value
            lead.qualification_reasoning  = f"{qualification.reasoning} | Signals: {', '.join(qualification.key_signals)}"
            lead.followup_email           = followup.body
            lead.followup_subject         = followup.subject
            lead.advisor_recommendation   = str(advisor.recommendation)
            lead.advisor_reasoning        = str(advisor.reasoning)
            lead.status                   = LeadStatus.QUALIFIED.value
            db.commit()
            db.refresh(lead)
            logger.info(f"✅ Lead {lead_id} saved — score={lead.score}, rec={lead.advisor_recommendation}")
        except Exception as e:
            db.rollback()
            logger.error(f"❌ DB commit failed for lead {lead_id}: {str(e)}")
            yield f"data: {json.dumps({'event': 'error', 'message': f'DB save failed: {str(e)}'})}\n\n"
            return

        total_tokens = tokens_1 + tokens_2 + tokens_3
        yield f"data: {json.dumps({'event': 'complete', 'lead_id': lead.id, 'total_tokens': total_tokens})}\n\n"

    except Exception as e:
        logger.error(f"❌ Pipeline error for lead {lead_id}: {str(e)}")
        yield f"data: {json.dumps({'event': 'error', 'message': str(e)})}\n\n"
    finally:
        db.close()


@router.get("/run/{lead_id}")
async def run_agent_pipeline(lead_id: int, db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    return StreamingResponse(
        stream_agent_events(lead_id=lead_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        }
    )


@router.post("/run-all")
async def run_all_unprocessed(db: Session = Depends(get_db)):
    unqualified = db.query(Lead).filter(Lead.status == LeadStatus.NEW).all()
    if not unqualified:
        return {"message": "No new leads to process", "processed": 0}
    results = []
    for lead in unqualified:
        qualification, _ = await qualify_lead(
            name=lead.name, company=lead.company, message=lead.message
        )
        results.append({"lead_id": lead.id, "score": qualification.score.value})
    return {"processed": len(results), "results": results}