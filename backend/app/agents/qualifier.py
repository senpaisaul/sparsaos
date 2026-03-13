from openai import AsyncOpenAI
from app.config import settings
from app.schemas import QualificationResult
from app.models import LeadScore
import json

client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

SYSTEM_PROMPT = """You are an expert B2B sales qualification agent for an enterprise AI platform.
Your job is to score inbound leads as HOT, WARM, or COLD based on buying signals.

Scoring criteria:
- HOT: Clear pain point, budget authority signals, urgency, large company, specific use case
- WARM: Some interest, unclear budget/authority, mid-size company, vague use case
- COLD: No clear pain point, small company, no urgency, generic inquiry

You must respond ONLY with valid JSON matching this exact schema:
{
  "score": "hot" | "warm" | "cold",
  "reasoning": "2-3 sentence explanation",
  "confidence": 0.0 to 1.0,
  "key_signals": ["signal1", "signal2", "signal3"]
}"""

# Few-shot examples to demonstrate scoring quality
FEW_SHOT_EXAMPLES = [
    {
        "role": "user",
        "content": "Lead: John Smith, CTO at MegaCorp (5000 employees). Message: We're spending $2M/year on manual procurement. Need to automate by Q1 or heads will roll."
    },
    {
        "role": "assistant",
        "content": json.dumps({
            "score": "hot",
            "reasoning": "CTO-level contact signals budget authority. Explicit $2M pain point and hard Q1 deadline indicate urgency. Large enterprise company is ideal ICP.",
            "confidence": 0.95,
            "key_signals": ["CTO title = budget authority", "$2M annual spend mentioned", "Hard Q1 deadline", "5000-person enterprise"]
        })
    },
    {
        "role": "user",
        "content": "Lead: Jane Doe, Marketing Manager at SmallBiz (12 employees). Message: Heard about AI, curious what you do."
    },
    {
        "role": "assistant",
        "content": json.dumps({
            "score": "cold",
            "reasoning": "No decision-making authority at marketing manager level. Company too small for enterprise product. No pain point or urgency expressed.",
            "confidence": 0.88,
            "key_signals": ["No budget authority", "12-person company too small", "No pain point", "Vague curiosity only"]
        })
    }
]


async def qualify_lead(name: str, company: str, message: str) -> tuple[QualificationResult, int]:
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        *FEW_SHOT_EXAMPLES,
        {
            "role": "user",
            "content": f"Lead: {name} at {company}. Message: {message}"
        }
    ]

    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=messages,
        temperature=0.2,  # Low temp for consistent scoring
        response_format={"type": "json_object"}
    )

    raw = json.loads(response.choices[0].message.content)
    tokens_used = response.usage.total_tokens

    result = QualificationResult(
        score=LeadScore(raw["score"]),
        reasoning=raw["reasoning"],
        confidence=raw["confidence"],
        key_signals=raw["key_signals"]
    )

    return result, tokens_used