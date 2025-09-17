from openai import OpenAI
import os
from dotenv import load_dotenv

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def generate_mood_summary(entries):
    content = "\n".join(
        [f"{e['created_at'][:10]}: Mood {e['mood']} - {e['reflection']}" for e in entries]
    )

    prompt = f"""
You're a mental health assistant. Analyze the following mood journal entries and summarize the user's emotional state this week.

Entries:
{content}

Summary:"""

    response = client.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7,
    )

    return response.choices[0].message.content.strip()
