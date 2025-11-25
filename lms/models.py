from django.db import models
from django.contrib.auth.models import User

class Student(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    score = models.IntegerField(default=0)
    streak = models.IntegerField(default=0)
    level = models.IntegerField(default=1)

    def __str__(self):
        return self.user.username

class QuizSession(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    topic = models.CharField(max_length=100, default="general")
    question = models.TextField()
    correct_answer = models.TextField()
    user_answer = models.TextField(blank=True, null=True)
    is_correct = models.BooleanField(default=False)
    timestamp = models.DateTimeField(auto_now_add=True)