# Cybersecurity Learning Management System

This directory contains mock data for the AI-powered Learning Management System focused on cybersecurity training, specifically phishing awareness and prevention.

## Data Structure

The `cybersecurity_questions.json` file contains 400 cybersecurity training questions organized into 4 categories:

### Categories

1. **Basic Phishing Recognition** (100 questions)
   - Fundamental concepts of identifying phishing attempts
   - Difficulty levels: 1-10

2. **Advanced Phishing Techniques** (100 questions)
   - Sophisticated phishing methods and evasion techniques
   - Difficulty levels: 1-10

3. **Social Engineering** (100 questions)
   - Human-focused attack techniques and psychology
   - Difficulty levels: 1-10

4. **Email Security Best Practices** (100 questions)
   - Email security protocols, tools, and preventive measures
   - Difficulty levels: 1-10

## Question Format

Each question follows this JSON structure:

```json
{
  "id": "category-001",
  "difficulty": 1,
  "question": "Question text here?",
  "options": [
    "Option A",
    "Option B",
    "Option C",
    "Option D"
  ],
  "correct_answer": 0,
  "explanation": "Explanation of why the answer is correct"
}
```

### Field Descriptions

- `id`: Unique identifier for the question (format: category-XXX)
- `difficulty`: Difficulty level from 1 (easiest) to 10 (hardest)
- `question`: The question text
- `options`: Array of 4 multiple-choice options
- `correct_answer`: Index of the correct option (0-3)
- `explanation`: Detailed explanation of the correct answer

## Contact

This dataset was created for the H25 Cybersecurity LMS Hackathon. For questions or contributions, please refer to the main project documentation.
