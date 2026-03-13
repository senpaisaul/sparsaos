from openai import AsyncOpenAI
from app.config import settings
from app.schemas import FollowupResult, QualificationResult
import json
 
client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
 
SYSTEM_PROMPT = """You are an elite B2B sales email writer for Sparsa AI, an Agentic Operating System for enterprises.
 
Sparsa AI helps companies automate complex workflows across CRM, ERP, and internal systems using AI agents.
 
Write personalized outreach emails based on lead score:
- HOT leads: Direct, ROI-focused, reference their specific pain, propose a call this week
- WARM leads: Educate + intrigue, share a relevant case study angle, soft CTA
- COLD leads: Short, curiosity-driven, no hard sell, just open a door
 
Rules:
- Never use generic openers like "I hope this email finds you well"
- Always reference something specific from their message
- Keep under 150 words
- Sound human, not like a template
 
Respond ONLY with valid JSON:
{
  "subject": "email subject line",
  "body": "full email body",
  "tone": "direct|consultative|curious",
  "personalization_notes": "what specific details you used"
}"""

async def draft_followup(
    name: str,
    company: str,
    original_message: str,
    qualification: QualificationResult
) -> tuple[FollowupResult, int]:
 
    prompt = f"""
Lead name: {name}
Company: {company}
Their message: {original_message}
Lead score: {qualification.score.value.upper()}
Key signals identified: {', '.join(qualification.key_signals)}
Qualification reasoning: {qualification.reasoning}
 
Write a personalized follow-up email for this lead.
"""
 
    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt}
        ],
        temperature=0.7,  # Higher temp for creative, human-sounding copy
        response_format={"type": "json_object"}
    )
 
    raw = json.loads(response.choices[0].message.content)
    tokens_used = response.usage.total_tokens
 
    result = FollowupResult(
        subject=raw["subject"],
        body=raw["body"],
        tone=raw["tone"],
        personalization_notes=raw["personalization_notes"]
    )
 
    return result, tokens_used