
import os
from typing import Any, Dict, Optional, List
from datetime import datetime


try:
    from openai import OpenAI
    _openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    _use_openai = True
except Exception:
   
    _openai_client = None
    _use_openai = False

DEFAULT_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

SYSTEM_PROMPT = (
    "You are SymptoCare—an empathetic wellness companion and a careful, evidence-informed AI assistant. "
    "Be warm, validating, and practical. Offer supportive reflections and simple, actionable suggestions. "
    "If potential risk is mentioned (e.g., self-harm), encourage contacting crisis resources and seeking professional help. "
    "Do not diagnose; you can discuss patterns and general guidance. Keep answers concise unless the user asks for more."
    "talk to the user like a friend to fill the loneliness. ask questions, make jokes, ask questions related to past information."
)

def _summarize_mood_context(ctx: Dict[str, Any]) -> Optional[str]:
    """Turn recent mood entries into a compact, readable summary for the model."""
    moods: List[Dict[str, Any]] = (ctx or {}).get("recent_moods") or []
    if not moods:
        return None

    lines = []
    for m in moods[:5]:
     
        created = m.get("created_at")
        try:
            ts = datetime.fromisoformat(created.replace("Z","")) if created else None
        except Exception:
            ts = None
        when = ts.strftime("%b %d, %H:%M") if ts else "recent"

        mood_num = m.get("mood")
        emoji = m.get("mood_emoji") or m.get("emoji") or ""
        sleep = m.get("sleep_hours")
        energy = m.get("energy_level")
        social = m.get("social_interaction")
        meds = m.get("medication_taken")
        refl = (m.get("reflection") or "")[:120].replace("\n"," ").strip()

        parts = [f"{when}: mood {mood_num}{' ' + emoji if emoji else ''}"]
        if sleep is not None: parts.append(f"sleep {sleep}h")
        if energy is not None: parts.append(f"energy {energy}/5")
        if social is not None: parts.append(f"social {social}/5")
        if meds is not None: parts.append(f"meds {'✅' if meds else '❌'}")
        if refl: parts.append(f'“{refl}…”')
        lines.append(" · ".join(parts))

    return "Recent check-ins:\n" + "\n".join(lines)

def get_ai_response(question: str, context: Optional[Dict[str, Any]] = None) -> str:
    """
    Generate an assistant reply. `context` may include:
      - recent_moods: list of recent mood entries (enhanced or simple)
      - any other keys you want to surface to the model
    """
    user_context = _summarize_mood_context(context or {})
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    if user_context:
        messages.append({
            "role": "system",
            "content": user_context
        })

    messages.append({"role": "user", "content": question})

    
    if not _use_openai:
        return (
            "Thanks for sharing. Based on your recent check-ins, I’ll keep an eye on sleep, energy, "
            "and any stressors you’ve mentioned. How are you feeling right now, and is there one small "
            "thing we could try today to help you feel a bit better?"
        )

    try:
        resp = _openai_client.chat.completions.create(
            model=DEFAULT_MODEL,
            messages=messages,
            temperature=0.7,
            max_tokens=500,
        )
        return resp.choices[0].message.content.strip()
    except Exception as e:
       
        print("OpenAI error:", e)
        return (
            "I’m here with you. I had trouble generating a response just now, but I’m listening—"
            "could you tell me a bit more about what’s on your mind?"
        )
