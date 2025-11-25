# Cyber LMS AI - Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Variables

Create a `.env` file in the `backend` directory:

```env
MONGO_URI=mongodb://localhost:27017/cyber-lms
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
GEMINI_API_KEY=your-google-gemini-api-key
PORT=3000
```

### 3. Load Questions into Database

Make sure MongoDB is running, then:

```bash
cd backend
npm run load-questions
```

This will:
- Read questions from `h25-lms/data/cybersecurity_questions.json`
- Scale difficulty from 1-10 to 1-5
- Load all questions into MongoDB

### 4. Start the Server

```bash
cd backend
npm run dev
```

The server will start on `http://localhost:3000`

## Features Implemented

✅ **Conversational UI** - Chat-like interface for training  
✅ **Adaptive Difficulty** - Automatically adjusts based on performance  
✅ **AI Question Generation** - Dynamic question generation using Gemini  
✅ **Free-Text Evaluation** - AI evaluates reasoning quality  
✅ **Learner Dashboard** - Visual progress tracking with charts  
✅ **Category/Module Selection** - Focus on specific cybersecurity topics  
✅ **Real-Time Feedback** - Immediate AI-powered feedback  
✅ **Analytics** - Detailed performance metrics for learners and admins  

## API Endpoints

### Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/make-admin/:userId` - Promote user to admin (admin only)

### Chat/Training
- `GET /api/chat/categories` - Get available categories
- `POST /api/chat/start` - Start/resume training session
- `POST /api/chat/answer` - Submit answer and get next question

### Analytics
- `GET /api/analytics/my-stats` - Get current user's detailed stats
- `GET /api/analytics/overview` - Admin overview (admin only)
- `GET /api/analytics/user/:userId` - Get specific user stats (admin only)

## File Structure

```
cyber-lms-ai/
├── backend/
│   ├── config/
│   │   └── db.js              # MongoDB connection
│   ├── data/
│   │   └── questions.cyber.json
│   ├── lib/
│   │   ├── aiClient.js        # Gemini AI wrapper
│   │   ├── adaptiveEngine.js # Difficulty adaptation
│   │   └── questionGenerator.js # AI question generation
│   ├── middleware/
│   │   └── auth.js            # JWT authentication
│   ├── models/
│   │   ├── User.js
│   │   ├── Question.js
│   │   └── Session.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── chatRoutes.js
│   │   └── analyticsRoutes.js
│   ├── scripts/
│   │   └── loadQuestions.js  # Question loader script
│   ├── server.js
│   └── package.json
└── public/
    ├── index.html             # Landing/login page
    ├── chat.html              # Training interface
    ├── dashboard.html         # Learner dashboard
    ├── admin.html             # Admin analytics
    ├── css/
    │   └── styles.css
    └── js/
        ├── api.js
        ├── auth.js
        ├── chat.js
        ├── dashboard.js
        └── admin.js
```

## Testing the Application

1. **Register a user**: Go to `http://localhost:3000` and register
2. **Login**: Use your credentials to login
3. **Start Training**: Click "Training" in navbar or go to `/chat.html`
4. **Select Category** (optional): Choose a cybersecurity module
5. **Answer Questions**: Select answers and optionally provide reasoning
6. **View Dashboard**: Check `/dashboard.html` for progress charts
7. **Admin Access**: Promote a user to admin to access `/admin.html`

## Notes

- Questions are loaded from `h25-lms/data/cybersecurity_questions.json`
- Difficulty is scaled from 1-10 (JSON) to 1-5 (Model)
- Free-text evaluation provides additional feedback on reasoning quality
- AI question generation can create new questions on-the-fly
- All features are integrated and working together

## Troubleshooting

**Questions not loading?**
- Check MongoDB connection
- Verify JSON file path in `loadQuestions.js`
- Run `npm run load-questions` again

**AI features not working?**
- Verify `GEMINI_API_KEY` in `.env`
- Check API key is valid and has quota

**Dashboard not showing data?**
- Make sure you've completed at least one training session
- Check browser console for errors

