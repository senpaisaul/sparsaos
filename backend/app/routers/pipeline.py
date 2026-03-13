from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Lead
from app.schemas import AgentRunResponse
from app.agents.orchestrator import run_pipeline
import json
import asyncio

router = APIRouter(prefix="/pipeline", tags=["pipeline"])


async def stream_agent_events(lead: Lead, db: Session):
    """
    Server-Sent Events generator.
    Streams agent progress to the frontend in real-time.
    """
    try:
        # Event 1: Pipeline started
        yield f"data: {json.dumps({'event': 'started', 'lead_id': lead.id, 'message': 'Agent pipeline initiated'})}\n\n"
        await asyncio.sleep(0.1)

        # Event 2: Qualification starting
        yield f"data: {json.dumps({'event': 'agent_start', 'agent': 'qualifier', 'message': f'Qualifying {lead.name} from {lead.company}...'})}\n\n"
        await asyncio.sleep(0.1)

        # Run full pipeline
        result = await run_pipeline(lead=lead, db=db)

        # Event 3: Qualification done
        yield f"data: {json.dumps({'event': 'agent_done', 'agent': 'qualifier', 'data': {'score': result.qualification.score.value, 'reasoning': result.qualification.reasoning, 'confidence': result.qualification.confidence, 'key_signals': result.qualification.key_signals}})}\n\n"
        await asyncio.sleep(0.2)

        # Event 4: Drafter done
        yield f"data: {json.dumps({'event': 'agent_done', 'agent': 'drafter', 'data': {'subject': result.followup.subject, 'body': result.followup.body, 'tone': result.followup.tone}})}\n\n"
        await asyncio.sleep(0.2)

        # Event 5: Advisor done
        yield f"data: {json.dumps({'event': 'agent_done', 'agent': 'advisor', 'data': {'recommendation': result.advisor.recommendation, 'reasoning': result.advisor.reasoning, 'urgency': result.advisor.urgency, 'next_steps': result.advisor.next_steps}})}\n\n"
        await asyncio.sleep(0.1)

        # Event 6: Pipeline complete
        yield f"data: {json.dumps({'event': 'complete', 'lead_id': lead.id, 'total_tokens': result.total_tokens_used})}\n\n"

    except Exception as e:
        yield f"data: {json.dumps({'event': 'error', 'message': str(e)})}\n\n"


@router.get("/run/{lead_id}")
async def run_agent_pipeline(lead_id: int, db: Session = Depends(get_db)):
    """Trigger the full 3-agent pipeline for a lead. Streams progress via SSE."""
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    return StreamingResponse(
        stream_agent_events(lead=lead, db=db),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no"
        }
    )


@router.post("/run-all")
async def run_all_unprocessed(db: Session = Depends(get_db)):
    """Run agents on all unqualified leads. Returns summary."""
    from app.models import LeadStatus
    unqualified = db.query(Lead).filter(Lead.status == LeadStatus.NEW).all()

    if not unqualified:
        return {"message": "No new leads to process", "processed": 0}

    results = []
    for lead in unqualified:
        result = await run_pipeline(lead=lead, db=db)
        results.append({"lead_id": lead.id, "score": result.qualification.score.value})

    return {"processed": len(results), "results": results}