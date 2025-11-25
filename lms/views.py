import google.generativeai as genai
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.contrib.auth import login
from django.contrib.auth.forms import UserCreationForm
from .models import Student, QuizSession
from django.contrib.auth.models import User

# Configure Gemini
genai.configure(api_key="AIzaSyCHOkaA0wM4cngB3CJ8khAcM6iORp2L1C8")
model = genai.GenerativeModel('gemini-2.0-flash')

def register(request):
    if request.method == 'POST':
        form = UserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            Student.objects.create(user=user)
            login(request, user)
            return redirect('dashboard')
    else:
        form = UserCreationForm()
    return render(request, 'register.html', {'form': form})

@login_required
def dashboard(request):
    student, _ = Student.objects.get_or_create(user=request.user)
    return render(request, 'dashboard.html', {'student': student})

@csrf_exempt
@login_required
def chat(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            user_msg = data.get('message', '')

            # Persona prompt
            system_prompt = "You are CyberGuard, an expert cybersecurity tutor. Be concise, helpful, and encouraging."
            full_prompt = f"{system_prompt}\nUser: {user_msg}"

            response = model.generate_content(full_prompt)
            return JsonResponse({'response': response.text})
        except Exception as e:
            return JsonResponse({'response': "Error: " + str(e)})
    return JsonResponse({'error': 'Invalid request'}, status=400)

@csrf_exempt
@login_required
def get_question(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            topic = data.get('topic', 'phishing')
            student, _ = Student.objects.get_or_create(user=request.user)

            prompt = f"Create a cybersecurity multiple-choice question about {topic} for difficulty level {student.level}. Format as JSON: {{'question': '...', 'options': ['A', 'B', 'C', 'D'], 'answer': 'Option text'}}."

            response = model.generate_content(prompt)
            text = response.text.replace('```json', '').replace('```', '').strip()

            # Basic fallback parsing if JSON fails, but Gemini 2.0 is usually good
            try:
                parsed = json.loads(text)
                question = parsed.get('question', 'What is phishing?')
                answer = parsed.get('answer', 'Fake emails')
            except:
                question = "What is phishing?"
                answer = "Fake emails"

            # Log session
            session = QuizSession.objects.create(
                student=student,
                topic=topic,
                question=question,
                correct_answer=answer
            )

            return JsonResponse({
                'question_id': session.id,
                'question': question,
                'level': student.level
            })
        except Exception as e:
            return JsonResponse({'error': str(e)})
    return JsonResponse({'error': 'Invalid request'}, status=400)

@csrf_exempt
@login_required
def submit_answer(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            q_id = data.get('question_id')
            ans = data.get('answer', '')

            session = QuizSession.objects.get(id=q_id)
            student = session.student

            # AI Grading
            prompt = f"Question: {session.question}\nCorrect Answer: {session.correct_answer}\nStudent Answer: {ans}\nGrade this answer on a scale of 0-100 based on correctness. Return ONLY the number."
            response = model.generate_content(prompt)

            try:
                score = int(''.join(filter(str.isdigit, response.text)))
            except:
                score = 0

            is_correct = score >= 70
            session.user_answer = ans
            session.is_correct = is_correct
            session.save()

            feedback = "Correct!" if is_correct else f"Incorrect. The better answer is: {session.correct_answer}"

            if is_correct:
                student.score += 10
                student.streak += 1
                if student.streak % 3 == 0:
                    student.level += 1
            else:
                student.streak = 0
            student.save()

            return JsonResponse({
                'correct': is_correct,
                'score': score,
                'feedback': feedback,
                'new_score': student.score,
                'new_streak': student.streak,
                'new_level': student.level
            })
        except Exception as e:
            return JsonResponse({'error': str(e)})
    return JsonResponse({'error': 'Invalid request'}, status=400)



from django.contrib.auth import logout
from django.shortcuts import redirect

def custom_logout(request):
    logout(request)
    return redirect('login')
