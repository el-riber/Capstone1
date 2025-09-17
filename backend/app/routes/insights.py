from fastapi import APIRouter, HTTPException, Query
from supabase import create_client, Client
from app.services.summarizer import generate_mood_summary
import os
from datetime import datetime, timedelta
from dotenv import load_dotenv


load_dotenv()

router = APIRouter()


SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")


if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in environment variables")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

@router.get("/insights/summary")
async def get_summary(user_id: str = Query(...)):
    try:
       
        one_week_ago = (datetime.utcnow() - timedelta(days=7)).isoformat()

        
        response = supabase \
            .from_("mood_entries") \
            .select("*") \
            .eq("user_id", user_id) \
            .gte("created_at", one_week_ago) \
            .execute()

        entries = response.data
        if not entries:
            return {"summary": "No mood entries found for the past week. Start tracking your mood daily to get personalized insights!"}

        
        summary_text = generate_mood_summary(entries)

        
        try:
            insert_response = supabase \
                .from_("ai_insights") \
                .insert({
                    "user_id": user_id,
                    "summary_text": summary_text,
                    "type": "weekly_summary",
                    "created_at": datetime.utcnow().isoformat()
                }) \
                .execute()
            
           
            if hasattr(insert_response, 'data') and insert_response.data is None:
                print("Warning: Could not save insight to database")
                
        except Exception as insert_error:
            
            print(f"Warning: Failed to save insight: {insert_error}")

        return {"summary": summary_text}

    except HTTPException:
        
        raise
    except Exception as e:
        print(f"Error in insights endpoint: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate summary: {str(e)}")