#!/usr/bin/env python3
import asyncio
import json
import aiosqlite
from google import genai

API_KEY = "AIzaSyCEqWSbtCTRLe1Hbw67kL5Ybjr4idTq6yA"
client = genai.Client(api_key=API_KEY)

DB_NAME = "lms_data.db"

with open("cybersecurity_questions.json", "r") as f:
    QUESTIONS_DATA = json.load(f)
    CATEGORY_MAP = {cat["id"]: cat for cat in QUESTIONS_DATA["categories"]}

MODULE_ORDER = ["basic-phishing", "advanced-phishing", "social-engineering", "email-security"]

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
        "The psychology of manipulation (Cialdini's principles)",
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

async def generate_module_notes(module_id: str, module_name: str) -> str:
    """Generate notes using Gemini API"""
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
        print(f"⏳ Generating notes for {module_name}...")
        response = client.models.generate_content(model="gemini-2.0-flash", contents=prompt)
        notes_html = response.text
        print(f"✅ Generated notes for {module_name}")
        return notes_html
    except Exception as e:
        print(f"❌ Error generating notes for {module_name}: {e}")
        return f"<h3>Error generating notes for {module_name}</h3>"

async def main():
    # Create tables
    async with aiosqlite.connect(DB_NAME) as db:
        await db.execute("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE, password TEXT)")
        await db.execute("CREATE TABLE IF NOT EXISTS module_progress (user_id INTEGER, module_id TEXT, difficulty_level INTEGER DEFAULT 1, questions_at_current_level INTEGER DEFAULT 0, total_questions_answered INTEGER DEFAULT 0, PRIMARY KEY (user_id, module_id))")
        await db.execute("CREATE TABLE IF NOT EXISTS module_notes (module_id TEXT PRIMARY KEY, notes_content TEXT)")
        await db.commit()
        print("✅ Database tables created/verified")
        
        # Generate and cache notes for all modules
        for mod_id in MODULE_ORDER:
            async with db.execute("SELECT notes_content FROM module_notes WHERE module_id = ?", (mod_id,)) as cursor:
                result = await cursor.fetchone()
                if result:
                    print(f"📌 Notes already cached for {mod_id}")
                else:
                    module_name = CATEGORY_MAP[mod_id]["name"]
                    content = await generate_module_notes(mod_id, module_name)
                    await db.execute("INSERT INTO module_notes (module_id, notes_content) VALUES (?, ?)", (mod_id, content))
                    await db.commit()
                    print(f"💾 Saved notes for {mod_id}")
        
        print("\n✨ All module notes generated and cached successfully!")

if __name__ == "__main__":
    asyncio.run(main())
