from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv


load_dotenv()


from app.routes import summarize
from app.routes import chat
from app.routes import insights

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "SymptoCare API is running."}


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(summarize.router)
app.include_router(chat.router)
app.include_router(insights.router)
