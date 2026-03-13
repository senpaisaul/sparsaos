from openai import AsyncOpenAI
from app.config import settings
from app.schemas import AdvisorResult, QualificationResult
import json

client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

# Chain-of-thought system prompt — this is what impresses interviewers
SYSTEM_PROMPT = """You are a senior enterprise sales advisor at Sparsa AI.

Your job is to analyze a lead and recommend the single best next action.

Think step by step before deciding:
1. What is their seniority and buying authority?
2. What is the size and type of their company?
3. What pain have they expressed?
4. What score did they receive and why?
5. Given all of the above, what is the highest-leverage next action?

Available recommendations:
- "schedule_call": Book a discovery call immediately
- "send_demo": Send a personalized async demo video
- "offer_discount": Use pricing incentive to unlock stalled deal
- "drop_lead": Not worth pursuing now, mark inactive

Respond ONLY with valid JSON:
{
  "recommendation": "schedule_call|send_demo|offer_discount|drop_lead",
  "reasoning": "Your full chain-of-thought reasoning (3-5 sentences)",
  "urgency": "high|medium|low",
  "next_steps": ["specific action 1", "specific action 2", "specific action 3"]
}"""


async def advise_deal(
    name: str,
    company: str,
    original_message: str,
    qualification: QualificationResult
) -> tuple[AdvisorResult, int]:

    # Build rich context for chain-of-thought reasoning
    prompt = f"""
Analyze this lead and recommend the best next action:

Lead: {name} at {company}
Message: {original_message}

Qualification result:
- Score: {qualification.score.value.upper()}
- Confidence: {qualification.confidence * 100:.0f}%
- Reasoning: {qualification.reasoning}
- Key signals: {', '.join(qualification.key_signals)}

Think through each step carefully before recommending.
"""

    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt}
        ],
        temperature=0.3,
        response_format={"type": "json_object"}
    )

    raw = json.loads(response.choices[0].message.content)
    tokens_used = response.usage.total_tokens

    result = AdvisorResult(
        recommendation=raw["recommendation"],
        reasoning=raw["reasoning"],
        urgency=raw["urgency"],
        next_steps=raw["next_steps"]
    )

    return result, tokens_used