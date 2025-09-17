from fastapi import APIRouter, Request
from pydantic import BaseModel
from app.utils.supabase_client import get_supabase
from app.services.chat_assistant import get_ai_response

router = APIRouter()

class ChatRequest(BaseModel):
    question: str
    thread_id: str | None = None
    context: dict | None = None

@router.post("/chat")
async def chat_endpoint(request: Request, payload: ChatRequest):
    
    auth = request.headers.get("authorization") or request.headers.get("Authorization")
    token = ""
    if auth and auth.lower().startswith("bearer "):
        token = auth.split(" ", 1)[1]

    
    supabase = get_supabase()
    if token:
        supabase.postgrest.auth(token)   

    
    reply = get_ai_response(payload.question, context=payload.context)

    
    try:
        if token:
            supabase.table("chat_messages").insert({
                "user_id": None,  
                "thread_id": payload.thread_id or "default",
                "role": "assistant",
                "content": reply,
            }).execute()
    except Exception as e:
        
        print("log insert failed:", e)

    return {"reply": reply}
