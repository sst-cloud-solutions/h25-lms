🛡️ CyberGuard AI - Adaptive LMS

An AI-powered cybersecurity training platform that adapts to your skill level in real-time.

Built for the SST "Conversational LMS" Challenge. This application uses Generative AI to act as a personal tutor, grading answers contextually and adjusting difficulty based on performance.

🚀 Key Features

1. 🧠 AI-Powered Conversational Engine

Context-Aware Tutor: Uses Google Gemini 1.5 Flash to generate questions and grade answers naturally.

Natural Language Understanding: Users can type answers in their own words (e.g., "It's a phishing attack"), and the AI understands the intent.

Real-Time Feedback: Instant explanations for every answer, helping users learn from mistakes immediately.

2. 📈 Adaptive Difficulty System

Dynamic Progression: The system tracks your "Streak".

2 Correct Answers: Level Up 🚀 (Questions get harder).

1 Wrong Answer: Level Down 📉 (Reinforces basics).

Personalized Learning: Ensures the user is always challenged but never overwhelmed.

3. 🔐 User Authentication & Role-Based Access

Secure Login Modal: Users must identify themselves before starting.

Role Separation:

Learner: Access to training and personal history.

Admin: Access to the "God Mode" analytics dashboard.

Topic Selection: Users can choose to focus on specific modules (e.g., Social Engineering, Phishing, Email Security).

4. 📊 Analytics & Progress Tracking

Live Dashboard: Real-time HUD showing Level, Score, and Accuracy %.

Session History: A scrollable log of every question attempted, result, and timestamp.

Admin Dashboard: A dedicated view for administrators to monitor all user sessions, scores, and engagement metrics.

5. 💾 Persistence & Reliability

Session Saving: User progress is saved to disk (user_sessions.json), so data survives container restarts.

Dockerized: Runs in a single container with all dependencies pre-packaged.

🛠️ Tech Stack

Backend: Python FastAPI (Async/Await)

AI Engine: Google Gemini 1.5 Flash

Frontend: HTML5, Vanilla JS, Tailwind CSS (Served via FastAPI)

Database: JSON-based Persistence (No external DB required for MVP)

Containerization: Docker & Docker Compose

⚡ Quick Start Guide

1. Clone the Repository

git clone [https://github.com/sst-cloud-solutions/h25-lms](https://github.com/sst-cloud-solutions/h25-lms)
cd h25-lms
git checkout gokulkrishnagk88-gmail-com


2. Configure Environment (Optional)

The system has a fallback key for judging, but for best performance, add your own:
Create a .env file in the source folder:

GEMINI_KEY=your_actual_api_key_here


3. Run with Docker

This command builds the image and starts the server.

cd source
docker-compose up --build


4. Access the App

Open your browser and go to:
👉 http://localhost:8001

🔐 Login Credentials (For Judges)

The system supports two modes. Use these credentials to test:

Role

Username

Password

Features

Learner

AnyName

(Leave Empty)

Chat, Personal Dashboard, History

Admin

admin

admin

All above + Admin Analytics Dashboard

📂 Project Structure

/h25-lms
├── /data
│   ├── cybersecurity_questions.json  # The Knowledge Base
│   └── user_sessions.json            # User Progress Data (Generated)
│
└── /source
    ├── main.py                       # Backend Logic (FastAPI)
    ├── Dockerfile                    # Container Config
    ├── docker-compose.yml            # Orchestration
    └── /static
        └── index.html                # Frontend UI


🔮 Future Roadmap

PostgreSQL Migration: Move from JSON persistence to a relational DB for enterprise scale.

Multi-Model Support: Allow switching between Gemini and other LLMs.

Certificate Generation: Auto-generate PDF certificates upon completing Level 10.

Voice Interface: Add Speech-to-Text for a fully verbal conversational experience.

Built with ❤️ for the H25 Hackathon.