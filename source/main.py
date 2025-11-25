import os
import json
import random
import time
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, constr
import google.generativeai as genai

# --- CONFIG ---
class ChatRequest(BaseModel):
    user_id: str
    message: constr(max_length=500)
    topic: str = "All Topics"  # Supports the new topic dropdown

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")

# SETUP AI
GENAI_KEY = os.getenv("GEMINI_KEY")
if not GENAI_KEY:
    print("⚠️ WARNING: GEMINI_KEY not found.")
else:
    genai.configure(api_key=GENAI_KEY)
    model = genai.GenerativeModel('gemini-2.5-flash') 

# --- LOAD DATA ---
DATA_PATH = "/data/cybersecurity_questions.json" 
SESSIONS_PATH = "/data/user_sessions.json" # File to save progress
QUESTIONS_DB = []

try:
    print(f"Loading data from {DATA_PATH}...")
    with open(DATA_PATH, "r") as f:
        raw_data = json.load(f)
        if isinstance(raw_data, dict) and "categories" in raw_data:
            for category in raw_data["categories"]:
                cat_name = category.get("name", "General")
                for q in category.get("questions", []):
                    q["category"] = cat_name
                    QUESTIONS_DB.append(q)
        else:
            QUESTIONS_DB = raw_data
    print(f"✅ Loaded {len(QUESTIONS_DB)} questions.")
except Exception as e:
    print(f"❌ ERROR loading data: {str(e)}")
    QUESTIONS_DB = []

# --- PERSISTENCE LAYER ---
user_sessions = {}

def load_sessions():
    global user_sessions
    if os.path.exists(SESSIONS_PATH):
        try:
            with open(SESSIONS_PATH, "r") as f:
                user_sessions = json.load(f)
            print(f"✅ Restored {len(user_sessions)} user sessions.")
        except:
            print("⚠️ Could not load sessions.")

def save_sessions():
    try:
        with open(SESSIONS_PATH, "w") as f:
            json.dump(user_sessions, f)
    except Exception as e:
        print(f"❌ Save failed: {e}")

# Load previous progress on startup
load_sessions()

# --- HELPERS ---
def get_categories():
    # Unique list of categories for the dropdown
    return sorted(list(set([q.get("category", "General") for q in QUESTIONS_DB])))

def get_question(difficulty, topic):
    # 1. Filter by Difficulty
    candidates = [q for q in QUESTIONS_DB if q.get('difficulty') == difficulty]
    
    # 2. Filter by Topic (if selected)
    if topic and topic != "All Topics" and topic != "Loading topics...":
        topic_candidates = [q for q in candidates if q.get('category') == topic]
        if topic_candidates:
            candidates = topic_candidates
    
    if not candidates: candidates = QUESTIONS_DB
    return random.choice(candidates) if candidates else None

def calculate_accuracy(state):
    if state.get("total_attempts", 0) == 0: return 0
    return int((state["correct_attempts"] / state["total_attempts"]) * 100)

# --- NEW ENDPOINTS FOR FRONTEND ---

@app.get("/api/topics")
def get_topics_endpoint():
    # This prevents the "Unexpected end of JSON" error on load
    return {"topics": ["All Topics"] + get_categories()}

@app.get("/api/admin/stats")
def get_admin_stats(key: str):
    # Used by the Admin Dashboard
    if key != "admin_secret_123": 
        raise HTTPException(status_code=403, detail="Unauthorized")
    return user_sessions

@app.post("/api/chat")
async def chat_endpoint(req: ChatRequest):
    start_time = time.time()
    
    # Init User if new
    if req.user_id not in user_sessions:
        user_sessions[req.user_id] = {
            "difficulty": 1, 
            "score": 0, 
            "streak": 0, 
            "current_q_id": None,
            "total_attempts": 0,
            "correct_attempts": 0,
            "history": [] 
        }
    
    state = user_sessions[req.user_id]
    user_msg = req.message.lower()
    
    # START / NEW QUESTION
    if "start" in user_msg or state["current_q_id"] is None:
        new_q = get_question(state["difficulty"], req.topic)
        if not new_q: return {"reply": "System Error: No questions loaded.", "state": state}
        
        state["current_q_id"] = new_q["id"]
        save_sessions()
        
        prompt = f"Act as a Tutor. Ask this question:\n{new_q['question']}\nOptions: {new_q['options']}"
        try:
            ai_res = model.generate_content(prompt)
            reply = ai_res.text
        except:
            reply = f"**Question:** {new_q['question']}\n\nOptions: {new_q['options']}"

        return {"reply": reply, "state": state, "accuracy": calculate_accuracy(state)}

    # EVALUATE ANSWER
    current_q = next((q for q in QUESTIONS_DB if q["id"] == state["current_q_id"]), None)
    
    if current_q:
        system_prompt = f"""
        Question: "{current_q['question']}"
        Correct Answer: "{current_q['options'][current_q['correct_answer']]}"
        Explanation: "{current_q['explanation']}"
        User Input: "{req.message}"
        
        Task: Grade the input.
        If Correct: Start with 'CORRECT'.
        If Wrong: Start with 'WRONG'.
        """
        
        try:
            ai_res = model.generate_content(system_prompt)
            ai_text = ai_res.text
        except:
            ai_text = "CORRECT (AI Offline fallback)"

        feedback_type = "neutral"
        state["total_attempts"] += 1
        
        if "CORRECT" in ai_text.upper():
            state["streak"] += 1
            state["correct_attempts"] += 1
            state["score"] += 10 * state["difficulty"]
            feedback_type = "correct"
            if state["streak"] >= 2:
                state["difficulty"] = min(10, state["difficulty"] + 1)
                ai_text += f"\n\n🚀 **Level Up!**"
                state["streak"] = 0
        elif "WRONG" in ai_text.upper():
            state["streak"] = 0
            state["difficulty"] = max(1, state["difficulty"] - 1)
            feedback_type = "wrong"
            ai_text += f"\n\n📉 **Adaptive:** Difficulty lowered."

        # Log to History
        state["history"].append({
            "question": current_q["question"],
            "result": "✅" if feedback_type == "correct" else "❌",
            "timestamp": time.strftime("%H:%M")
        })

        # Get Next Question
        next_q = get_question(state["difficulty"], req.topic)
        if next_q:
            state["current_q_id"] = next_q["id"]
            ai_text += f"\n\n---\n\n**Next Question ({req.topic}):**\n{next_q['question']}\n"
            for i, opt in enumerate(next_q['options']):
                ai_text += f"- {opt}\n"
        
        save_sessions()
        
        return {
            "reply": ai_text, 
            "state": state, 
            "accuracy": calculate_accuracy(state),
            "feedback": feedback_type,
            "latency_ms": int((time.time() - start_time) * 1000)
        }

    return {"reply": "Session error.", "state": state}

@app.get("/")
async def read_index():
    return FileResponse('static/index.html')