import json
import os
import aiosqlite
import random
import hashlib
import base64
import io
from fastapi import FastAPI, WebSocket, Request, Form, Cookie, HTTPException
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from google import genai
from PIL import Image

# --- CONFIGURATION ---
API_KEY = "AIzaSyCEqWSbtCTRLe1Hbw67kL5Ybjr4idTq6yA"  # <--- PASTE KEY HERE
client = genai.Client(api_key=API_KEY)

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

DB_NAME = "lms_data.db"

# --- LOAD DATA ---
with open("cybersecurity_questions.json", "r") as f:
    QUESTIONS_DATA = json.load(f)
    CATEGORY_MAP = {cat["id"]: cat for cat in QUESTIONS_DATA["categories"]}

# Define the Learning Path (Order matters for locking!)
MODULE_ORDER = ["basic-phishing", "advanced-phishing", "social-engineering", "email-security"]

# --- CONTENT DATA (Detailed) ---
SYLLABUS_DATA = {
    "basic-phishing": [
        "Definition and mechanics of phishing attacks",
        "Identifying suspicious URLs and subdomains",
        "Recognizing urgency and emotional manipulation",
        "Safe handling of email attachments (.exe, .scr)",
        "Verifying sender identity (Header analysis)"
    ],
    "advanced-phishing": [
        "Spear Phishing vs. Whaling vs. Clone Phishing",
        "Technical defenses: SPF, DKIM, and DMARC",
        "Homograph attacks (ASCII/Cyrillic spoofing)",
        "Man-in-the-Middle (MitM) phishing proxies",
        "Bypassing 2FA using real-time phishing kits"
    ],
    "social-engineering": [
        "The psychology of manipulation (Cialdini’s principles)",
        "Pretexting: Creating a fabricated scenario",
        "Baiting and Quid Pro Quo attacks",
        "Physical social engineering (Tailgating)",
        "Vishing (Voice) and Smishing (SMS) techniques"
    ],
    "email-security": [
        "Password hygiene and entropy",
        "Multi-Factor Authentication (MFA/2FA) types",
        "End-to-End Encryption (PGP/GPG, S/MIME)",
        "Recognizing Business Email Compromise (BEC)",
        "Secure email gateway configurations"
    ]
}

CYBER_NOTES_CACHE = {}  # In-memory cache for generated notes

# --- SECURITY HELPER ---
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

async def get_module_status(user_id):
    status_map = {}
    async with aiosqlite.connect(DB_NAME) as db:
        async with db.execute("SELECT module_id, difficulty_level, questions_at_current_level, total_questions_answered FROM module_progress WHERE user_id = ?", (user_id,)) as cursor:
            rows = await cursor.fetchall()
            progress = {r[0]: {"level": r[1], "at_level": r[2], "total": r[3]} for r in rows}

    previous_completed = True
    for mod_id in MODULE_ORDER:
        user_data = progress.get(mod_id, {"level": 1, "at_level": 0, "total": 0})
        is_locked = not previous_completed
        is_complete = user_data["level"] > 5
        
        status_map[mod_id] = {
            "id": mod_id, "locked": is_locked, "level": user_data["level"],
            "answered": user_data["total"], "complete": is_complete
        }
        previous_completed = is_complete
    return status_map

async def generate_module_notes(module_id: str, module_name: str) -> str:
    if module_id in CYBER_NOTES_CACHE: 
        return CYBER_NOTES_CACHE[module_id]
    
    prompt = f"""
    You are an expert Cybersecurity Author. Write a detailed study guide chapter for: "{module_name}".
    Output ONLY structured HTML (no ```html tags).
    Structure:
    1. <h1>Module Syllabus</h1>: Bullet points of what is covered.
    2. <h1>Introduction</h1>: Deep dive into the concept.
    3. <h2>[Topic Headers]</h2>: Detailed explanation sections with examples.
    4. <h1>Key Takeaways</h1>: Summary.
    Make it detailed, educational, and formatted beautifully.
    """
    try:
        response = client.models.generate_content(model="gemini-2.0-flash", contents=prompt)
        notes_html = response.text
        CYBER_NOTES_CACHE[module_id] = notes_html
        return notes_html
    except: 
        return "<h3>Error generating notes. Please try again.</h3>"

# --- DB INIT ---
async def init_db_and_generate_notes():
    async with aiosqlite.connect(DB_NAME) as db:
        await db.execute("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE, password TEXT)")
        await db.execute("CREATE TABLE IF NOT EXISTS module_progress (user_id INTEGER, module_id TEXT, difficulty_level INTEGER DEFAULT 1, questions_at_current_level INTEGER DEFAULT 0, total_questions_answered INTEGER DEFAULT 0, PRIMARY KEY (user_id, module_id))")
        await db.execute("CREATE TABLE IF NOT EXISTS module_notes (module_id TEXT PRIMARY KEY, notes_content TEXT)")
        await db.commit()
        
        # Pre-generate notes for all modules if not already cached
        for mod_id in MODULE_ORDER:
            async with db.execute("SELECT notes_content FROM module_notes WHERE module_id = ?", (mod_id,)) as cursor:
                result = await cursor.fetchone()
                if not result:
                    print(f"📚 Generating notes for {mod_id}...")
                    module_name = CATEGORY_MAP[mod_id]["name"]
                    content = await generate_module_notes(mod_id, module_name)
                    await db.execute("INSERT INTO module_notes (module_id, notes_content) VALUES (?, ?)", (mod_id, content))
                    print(f"✅ Saved notes for {mod_id}")
        await db.commit()

@app.on_event("startup")
async def startup():
    # Just create tables on startup, generate notes in background
    async with aiosqlite.connect(DB_NAME) as db:
        await db.execute("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE, password TEXT)")
        await db.execute("CREATE TABLE IF NOT EXISTS module_progress (user_id INTEGER, module_id TEXT, difficulty_level INTEGER DEFAULT 1, questions_at_current_level INTEGER DEFAULT 0, total_questions_answered INTEGER DEFAULT 0, PRIMARY KEY (user_id, module_id))")
        await db.execute("CREATE TABLE IF NOT EXISTS module_notes (module_id TEXT PRIMARY KEY, notes_content TEXT)")
        await db.commit()

# --- ROUTES ---
@app.get("/init-notes")
async def initialize_notes():
    """Endpoint to trigger note generation - call this after startup"""
    await init_db_and_generate_notes()
    return {"status": "Notes generated and cached successfully"}

@app.get("/", response_class=HTMLResponse)
async def login_page(request: Request, msg: str = None, error: str = None):
    return templates.TemplateResponse("login.html", {"request": request, "msg": msg, "error": error})

@app.get("/register", response_class=HTMLResponse)
async def register_page(request: Request, error: str = None):
    return templates.TemplateResponse("register.html", {"request": request, "error": error})

@app.get("/dashboard", response_class=HTMLResponse)
async def dashboard_page(request: Request):
    user_id = request.cookies.get("user_id")
    if not user_id: return RedirectResponse("/")

    status_map = await get_module_status(user_id)
    
    # Get raw progress data for calculating progress bars
    async with aiosqlite.connect(DB_NAME) as db:
        async with db.execute("SELECT module_id, difficulty_level, questions_at_current_level, total_questions_answered FROM module_progress WHERE user_id = ?", (user_id,)) as cursor:
            rows = await cursor.fetchall()
            progress_detail = {r[0]: {"level": r[1], "at_level": r[2], "total": r[3]} for r in rows}

    modules_display = []
    for mid in MODULE_ORDER:
        cat = CATEGORY_MAP[mid]
        stat = status_map[mid]
        current_level_data = progress_detail.get(mid, {"level": 1, "at_level": 0, "total": 0})
        # Progress bar shows progress within the current level (0-25 questions = 0-100%)
        progress_percent = (current_level_data["at_level"] / 25) * 100
        modules_display.append({
            "id": mid,
            "name": cat["name"],
            "desc": cat["description"],
            "level": stat["level"],
            "answered": stat["answered"],
            "locked": stat["locked"],
            "progress_percent": min(progress_percent, 100),
            "syllabus": SYLLABUS_DATA.get(mid, [])
        })

    return templates.TemplateResponse("dashboard.html", {
        "request": request, 
        "modules": modules_display
    })

@app.get("/chat/{module_id}", response_class=HTMLResponse)
async def chat_page(request: Request, module_id: str):
    user_id = request.cookies.get("user_id")
    if not user_id: return RedirectResponse("/")
    
    # Security Check: Is module locked?
    status_map = await get_module_status(user_id)
    if status_map.get(module_id, {}).get("locked", True):
        return RedirectResponse("/dashboard") # Kick back if locked

    return templates.TemplateResponse("chat.html", {
        "request": request, 
        "module_id": module_id, 
        "module_name": CATEGORY_MAP[module_id]["name"]
    })

@app.get("/notes", response_class=HTMLResponse)
async def notes_hub_page(request: Request):
    user_id = request.cookies.get("user_id")
    if not user_id: 
        return RedirectResponse("/")
    
    modules_list = [CATEGORY_MAP[mid] for mid in MODULE_ORDER]
    return templates.TemplateResponse("notes_hub.html", {"request": request, "modules": modules_list})

@app.get("/notes/{module_id}", response_class=HTMLResponse)
async def single_module_notes_page(request: Request, module_id: str):
    user_id = request.cookies.get("user_id")
    if not user_id: 
        return RedirectResponse("/")
    
    if module_id not in CATEGORY_MAP: 
        return RedirectResponse("/notes")
    
    # Fetch from database
    async with aiosqlite.connect(DB_NAME) as db:
        async with db.execute("SELECT notes_content FROM module_notes WHERE module_id = ?", (module_id,)) as cursor:
            result = await cursor.fetchone()
            content = result[0] if result else "<h3>Notes not available yet. Please refresh the page.</h3>"
    
    return templates.TemplateResponse("module_notes.html", {
        "request": request, 
        "module_name": CATEGORY_MAP[module_id]["name"], 
        "notes_content": content
    })

# --- AUTH POSTS ---
@app.post("/register")
async def register_user(request: Request, username: str = Form(...), password: str = Form(...)):
    async with aiosqlite.connect(DB_NAME) as db:
        cursor = await db.execute("SELECT id FROM users WHERE username = ?", (username,))
        if await cursor.fetchone():
            return templates.TemplateResponse("register.html", {"request": request, "error": "Username taken!"})
        await db.execute("INSERT INTO users (username, password) VALUES (?, ?)", (username, hash_password(password)))
        await db.commit()
    return RedirectResponse(url="/?msg=Account Created!", status_code=303)

@app.post("/login")
async def login(request: Request, username: str = Form(...), password: str = Form(...)):
    async with aiosqlite.connect(DB_NAME) as db:
        cursor = await db.execute("SELECT id FROM users WHERE username = ? AND password = ?", (username, hash_password(password)))
        user = await cursor.fetchone()
        if not user:
            return templates.TemplateResponse("login.html", {"request": request, "error": "Invalid Credentials"})
        response = RedirectResponse(url="/dashboard", status_code=303)
        response.set_cookie(key="user_id", value=str(user[0]))
        return response

# --- WEBSOCKET ---
def get_adaptive_question(module_id, difficulty):
    category = CATEGORY_MAP.get(module_id)
    candidates = [q for q in category["questions"] if q["difficulty"] == difficulty]
    if not candidates: candidates = category["questions"]
    return random.choice(candidates)

@app.websocket("/ws/{module_id}")
async def websocket_endpoint(websocket: WebSocket, module_id: str):
    await websocket.accept()
    user_id = websocket.cookies.get("user_id")
    if not user_id: 
        await websocket.close()
        return

    async with aiosqlite.connect(DB_NAME) as db:
        await db.execute("INSERT OR IGNORE INTO module_progress (user_id, module_id) VALUES (?, ?)", (user_id, module_id))
        await db.commit()
        async with db.execute("SELECT difficulty_level, questions_at_current_level, total_questions_answered FROM module_progress WHERE user_id = ? AND module_id = ?", (user_id, module_id)) as cursor:
            row = await cursor.fetchone()
            difficulty, questions_at_level, total_answered = row

    current_q = None
    await websocket.send_text(json.dumps({"text": f"AI: Welcome to <b>{CATEGORY_MAP[module_id]['name']}</b> (Level {difficulty}/10).<br><b>Progress: {questions_at_level}/25 questions at this level</b><br>Type 'start' for quiz or upload a doubt!"}))

    while True:
        try:
            raw = await websocket.receive_text()
            payload = json.loads(raw)
            mtype = payload.get("type", "answer")
            text = payload.get("text", "").strip()
            img = payload.get("image")

            if mtype == "doubt":
                prompt = ["You are a Cyber Security Tutor. Answer this doubt: " + text]
                if img: 
                    prompt.append(Image.open(io.BytesIO(base64.b64decode(img.split(",")[1]))))
                try:
                    resp = client.models.generate_content(model="gemini-2.0-flash", contents=prompt)
                    ans = resp.text
                except: 
                    ans = "Error processing doubt."
                await websocket.send_text(json.dumps({"text": f"🤖 <b>Doubt Solver:</b> {ans}"}))
                continue

            if current_q is None:
                if "start" in text.lower():
                    current_q = get_adaptive_question(module_id, difficulty)
                    opts = "<br>".join([f"{i+1}. {opt}" for i, opt in enumerate(current_q["options"])])
                    await websocket.send_text(json.dumps({"text": f"AI: <b>Question {questions_at_level+1}/25 (Level {difficulty}):</b><br>{current_q['question']}<br><br>{opts}"}))
                else: 
                    await websocket.send_text(json.dumps({"text": "AI: Type 'start' to begin."}))
                continue

            correct_idx = current_q["correct_answer"]
            correct_txt = current_q["options"][correct_idx]
            
            # Handle option number input (e.g., "1", "2", "3", "4")
            user_answer = text
            try:
                option_num = int(text.strip())
                if 1 <= option_num <= len(current_q["options"]):
                    user_answer = current_q["options"][option_num - 1]
            except ValueError:
                pass  # Not a number, use text as-is
            
            eval_prompt = f"""
            Context: Cyber Quiz. Q: "{current_q['question']}" Correct: "{correct_txt}" User Answer: "{user_answer}"
            Task: 1. Is user correct? 2. Explain WHY in detail (educational).
            Output: STATUS|EXPLANATION (STATUS=CORRECT/INCORRECT).
            """
            try:
                resp = client.models.generate_content(model="gemini-2.0-flash", contents=eval_prompt)
                parts = resp.text.split("|", 1)
                status = parts[0].strip().upper()
                expl = parts[1].strip()
            except: 
                status, expl = "INCORRECT", "Error."

            if "CORRECT" in status:
                feedback = "✅ Correct!"
            else:
                feedback = "❌ Incorrect."

            total_answered += 1
            questions_at_level += 1

            # Check if user completed 25 questions at this level
            level_complete = False
            if questions_at_level >= 25:
                if difficulty < 10:
                    difficulty += 1
                    questions_at_level = 0
                    level_complete = True

            async with aiosqlite.connect(DB_NAME) as db:
                await db.execute("UPDATE module_progress SET difficulty_level=?, questions_at_current_level=?, total_questions_answered=? WHERE user_id=? AND module_id=?", (difficulty, questions_at_level, total_answered, user_id, module_id))
                await db.commit()

            level_msg = f" <br><b>🎉 Level Complete! Moving to Level {difficulty}</b>" if level_complete else ""
            await websocket.send_text(json.dumps({"text": f"AI: {feedback}{level_msg}<br><br>{expl}"}))
            current_q = get_adaptive_question(module_id, difficulty)
            opts = "<br>".join([f"{i+1}. {opt}" for i, opt in enumerate(current_q["options"])])
            await websocket.send_text(json.dumps({"text": f"AI: <b>Question {questions_at_level+1}/25 (Level {difficulty}):</b><br>{current_q['question']}<br><br>{opts}"}))

        except Exception: 
            break