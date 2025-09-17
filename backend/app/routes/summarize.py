from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
from app.utils.supabase_client import supabase
from openai import OpenAI
import os
from typing import List, Dict, Any

router = APIRouter()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def mood_to_wellness(mood_value: int) -> int:
    """Convert mood values to wellness scale for meaningful analysis"""
    wellness_map = {
        1: 1,  
        2: 2,  
        3: 3,  
        4: 4, 
        5: 5,  
        6: 6,  
        7: 7,  
        8: 8,  
    }
    return wellness_map.get(mood_value, 3)

def get_mood_description(mood_value: int) -> str:
    """Get human-readable mood description"""
    descriptions = {
        1: 'Very Sad', 2: 'Sad', 3: 'Neutral', 4: 'Happy',
        5: 'Very Happy', 6: 'Excited', 7: 'Stressed', 8: 'Angry'
    }
    return descriptions.get(mood_value, 'Unknown')

def generate_mood_summary(entries: List[Dict[str, Any]]) -> str:
    """
    Generate AI-powered mood summary from mood entries
    """
    if not entries:
        return "No mood entries available for analysis."

    
    formatted_entries = []
    wellness_scores = []
    
    for entry in entries:
        mood_value = entry.get('mood', 3)
        emoji = entry.get('emoji', '')
        reflection = entry.get('reflection', '')
        created_at = entry.get('created_at', '')
        
        mood_desc = get_mood_description(mood_value)
        wellness_level = mood_to_wellness(mood_value)
        wellness_scores.append(wellness_level)
        
        date_str = created_at[:10] if created_at else 'Unknown date'
        
        formatted_entries.append(
            f"{date_str} {emoji} {mood_desc} (Wellness: {wellness_level}/8): {reflection}"
        )
    
    
    avg_wellness = sum(wellness_scores) / len(wellness_scores) if wellness_scores else 3
    min_wellness = min(wellness_scores) if wellness_scores else 3
    max_wellness = max(wellness_scores) if wellness_scores else 3
    
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
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {
                    "role": "system", 
                    "content": "You are a compassionate mental wellness assistant who provides supportive, evidence-based guidance. You focus on emotional wellbeing, self-compassion, and practical wellness strategies. You avoid being clinical or diagnostic, instead offering warm, encouraging support."
                },
                {
                    "role": "user", 
                    "content": prompt
                }
            ],
            temperature=0.7,
            max_tokens=350
        )
        
        return response.choices[0].message.content or "Unable to generate summary at this time."
        
    except Exception as e:
        print(f"Error generating mood summary: {e}")
        return f"I'm having trouble analyzing your mood data right now. Your entries show an average wellness level of {avg_wellness:.1f}/5 over {len(entries)} days. Keep tracking your moods - this data helps build valuable insights over time."