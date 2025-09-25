
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Dict, Any
from datetime import datetime, timedelta, timezone
import os

from app.utils.supabase_client import supabase 
from openai import OpenAI

router = APIRouter()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


MOOD_LABELS = {
    1: "Angry",
    2: "Stressed",
    3: "Very Sad",
    4: "Sad",
    5: "Neutral",
    6: "Happy",
    7: "Very Happy",
    8: "Excited",
}

def mood_to_wellness(mood_value: int) -> int:
    """Identity mapping on a 1–8 scale (bounded)."""
    try:
        m = int(mood_value)
    except Exception:
        return 5
    return max(1, min(8, m))

def get_mood_description(mood_value: int) -> str:
    return MOOD_LABELS.get(mood_value, "Unknown")


def generate_mood_summary(entries: List[Dict[str, Any]]) -> str:
    if not entries:
        return "No mood entries available for analysis."

    formatted_entries: List[str] = []
    wellness_scores: List[int] = []

    for entry in entries:
        mood_value = int(entry.get("mood", 5))
        emoji = entry.get("emoji") or entry.get("mood_emoji") or ""
        reflection = entry.get("reflection", "") or ""
        created_at = entry.get("created_at", "")

        mood_desc = get_mood_description(mood_value)
        wellness_level = mood_to_wellness(mood_value)
        wellness_scores.append(wellness_level)

        date_str = (created_at[:10] if isinstance(created_at, str)
                    else getattr(created_at, "date", lambda: "")() or "Unknown date")

        formatted_entries.append(
            f"{date_str} {emoji} {mood_desc} (Wellness: {wellness_level}/8): {reflection}"
        )

    avg_wellness = sum(wellness_scores) / len(wellness_scores) if wellness_scores else 5
    min_wellness = min(wellness_scores) if wellness_scores else 5
    max_wellness = max(wellness_scores) if wellness_scores else 5

    reflections_text = "\n\n".join(formatted_entries)

    prompt = f"""As a compassionate mental wellness assistant, analyze these mood entries and provide supportive insights:

Recent Entries ({len(entries)} days):
{reflections_text}

Wellness Statistics:
- Average: {avg_wellness:.1f}/8
- Range: {min_wellness} to {max_wellness}

Please provide:
1. A brief, warm summary of their emotional patterns
2. Positive observations and strengths you notice
3. 2-3 gentle, actionable wellness suggestions
4. Encouraging words for their mental health journey

Keep the response supportive, non-judgmental, and focused on growth. Limit to 250 words."""

    try:
       
        resp = client.chat.completions.create(
            model=os.getenv("OPENAI_MODEL", "gpt-4"),
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a compassionate mental wellness assistant who provides supportive, "
                        "evidence-based guidance. You focus on emotional wellbeing, self-compassion, "
                        "and practical wellness strategies. Avoid diagnostic language."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.7,
            max_tokens=350,
        )
        return (resp.choices[0].message.content or "").strip() or \
               "Unable to generate summary at this time."
    except Exception as e:
        print(f"Error generating mood summary: {e}")
        return (
            f"I'm having trouble analyzing your mood data right now. "
            f"Your entries show an average wellness level of {avg_wellness:.1f}/8 over {len(entries)} days. "
            "Keep tracking your moods—this data helps build valuable insights over time."
        )


class EntriesIn(BaseModel):
    entries: List[Dict[str, Any]]

class SummaryOut(BaseModel):
    summary: str


async def fetch_last_7_days_entries(user_id: str) -> List[Dict[str, Any]]:
    """
    Prefer enhanced_mood_entries; if empty, fall back to mood_entries.
    Returns normalized dicts with keys: mood, emoji, reflection, created_at.
    """
    since = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()

 
    enh = supabase.table("enhanced_mood_entries") \
        .select("mood,mood_emoji,reflection,created_at") \
        .eq("user_id", user_id) \
        .gte("created_at", since) \
        .order("created_at", desc=False) \
        .execute()

    data = (enh.data or []) if enh else []

    if not data:
        
        legacy = supabase.table("mood_entries") \
            .select("mood,emoji,reflection,created_at") \
            .eq("user_id", user_id) \
            .gte("created_at", since) \
            .order("created_at", desc=False) \
            .execute()
        data = (legacy.data or []) if legacy else []

    
    normalized = []
    for r in data:
        normalized.append({
            "mood": r.get("mood"),
            "emoji": r.get("mood_emoji") or r.get("emoji"),
            "reflection": r.get("reflection"),
            "created_at": r.get("created_at"),
        })
    return normalized



@router.get("/insights/summary", response_model=SummaryOut)
async def insights_summary(user_id: str = Query(..., description="Supabase user id")):
    """
    GET /insights/summary?user_id=...
    Used by fetchWeeklySummary(user_id) on the frontend.
    """
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id is required")

    try:
        entries = await fetch_last_7_days_entries(user_id)
        summary = generate_mood_summary(entries)
        return SummaryOut(summary=summary)
    except Exception as e:
        print("insights_summary error:", e)
        raise HTTPException(status_code=500, detail="Failed to generate weekly summary")

@router.post("/weekly-summary", response_model=SummaryOut)
async def weekly_summary(body: EntriesIn):
    """
    POST /weekly-summary  { entries: [...] }
    Used by fetchWeeklySummaryFromEntries(entries) on the frontend.
    """
    try:
        summary = generate_mood_summary(body.entries or [])
        return SummaryOut(summary=summary)
    except Exception as e:
        print("weekly_summary error:", e)
        raise HTTPException(status_code=500, detail="Failed to generate weekly summary")
