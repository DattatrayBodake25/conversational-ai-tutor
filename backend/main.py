#importing all libraries
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
import uuid
from textblob import TextBlob
from backend.rag_pipeline import rag_graph

app = FastAPI(title="AI Tutor Mascot API")

# Enable CORS so frontend can call backend
origins = ["http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root endpoint: simple status check
@app.get("/")
def root():
    return {"status": "AI Tutor Backend Running!"}

# Request models
class QueryRequest(BaseModel):
    question: str

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    history: List[Dict[str, str]] = []

# Helper: Dynamic emotion detection
def get_emotion(answer: str) -> str:
    """
    Determine mascot emotion based on answer text:
    - Sentiment polarity: positive → happy, negative → sad
    - Advice/Recommendation keywords → thinking
    - Short answers → neutral
    - Long factual/explaining answers → explaining
    - Surprise/uncertainty keywords → surprised
    """
    if not answer:
        return "neutral"

    lower_answer = answer.lower()
    words = lower_answer.split()
    num_words = len(words)

    # Sentiment polarity
    analysis = TextBlob(answer)
    polarity = analysis.sentiment.polarity

    # Keyword-based overrides
    if any(word in lower_answer for word in ["suggest", "recommend", "should", "consider", "advice"]):
        return "thinking"
    if any(word in lower_answer for word in ["wow", "amazing", "incredible", "surprising"]):
        return "surprised"

    # Polarity overrides
    if polarity > 0.3:
        return "happy"
    elif polarity < -0.3:
        return "sad"

    # Length-based reasoning
    if num_words < 5:
        return "neutral"
    if num_words > 20:
        return "explaining"

    # Default
    return "explaining"

# Single-turn query endpoint
@app.post("/query")
def query_endpoint(request: QueryRequest):
    try:
        result = rag_graph.invoke({"question": request.question})
        answer_text = result.get("answer", "Sorry, I couldn't find relevant information.")
        emotion = get_emotion(answer_text)
        return {
            "text": answer_text,
            "emotion": emotion
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Multi-user session-based chat memory
chat_sessions: Dict[str, List[Dict[str, str]]] = {}

@app.post("/chat")
def chat_endpoint(request: ChatRequest):
    try:
        # Determine session
        session_id = request.session_id or str(uuid.uuid4())
        if session_id not in chat_sessions:
            chat_sessions[session_id] = []

        # Build state with current message
        state = {
            "question": request.message,
            "context": [],
            "answer": ""
        }
        result = rag_graph.invoke(state)
        answer_text = result.get("answer", "Sorry, I couldn't find relevant information.")
        emotion = get_emotion(answer_text)

        # Append to session memory
        chat_sessions[session_id].append({
            "question": request.message,
            "answer": answer_text
        })

        return {
            "session_id": session_id,
            "text": answer_text,
            "emotion": emotion,
            "chat_history": chat_sessions[session_id]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
