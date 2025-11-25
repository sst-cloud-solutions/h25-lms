// public/js/chat.js

let sessionId = null;
let currentQuestion = null;
let selectedIndex = null;

const chatBox = document.getElementById('chat-box');
const optionsContainer = document.getElementById('options-container');
const answerInput = document.getElementById('answer-input');
const sendBtn = document.getElementById('send-btn');
const statsDiv = document.getElementById('stats');

/**
 * Append a message to the chat box
 * type: 'user' | 'ai'
 */
function addMessage(text, type) {
  if (!chatBox) return;
  const div = document.createElement('div');
  div.classList.add('chat-message');

  if (type === 'user') {
    div.classList.add('chat-user');
  } else {
    div.classList.add('chat-ai');
  }

  div.textContent = text;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

/**
 * Render the multiple-choice question & options
 */
function renderQuestion(q) {
  currentQuestion = q;
  selectedIndex = null;
  optionsContainer.innerHTML = '';

  if (!q) return;

  addMessage(`Q: ${q.text} (Difficulty: ${q.difficulty})`, 'ai');

  q.options.forEach((opt, idx) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.textContent = `${idx + 1}. ${opt}`;
    btn.onclick = () => {
      selectedIndex = idx;

      // highlight selected
      Array.from(optionsContainer.children).forEach((b) => {
        b.style.opacity = '0.7';
        b.style.borderColor = '#c7d2fe';
      });
      btn.style.opacity = '1';
      btn.style.borderColor = '#2563eb';
    };

    optionsContainer.appendChild(btn);
  });
}

/**
 * Render stats block
 */
function renderStats(stats) {
  if (!statsDiv || !stats) return;

  const accuracy =
    stats.accuracy !== undefined
      ? stats.accuracy
      : stats.totalAsked
      ? Math.round((stats.totalCorrect / stats.totalAsked) * 100)
      : 0;

  statsDiv.textContent = `Questions: ${stats.totalAsked} | Correct: ${stats.totalCorrect} | Accuracy: ${accuracy}% | Difficulty: ${stats.currentDifficulty} | Streak: ${stats.correctStreak}`;
}

/**
 * Load available categories
 */
async function loadCategories() {
  try {
    const data = await apiRequest('/chat/categories');
    const select = document.getElementById('category-select');
    if (!select) return;

    // Clear existing options except "All Categories"
    select.innerHTML = '<option value="">All Categories (Mixed)</option>';

    if (data.categories && data.categories.length > 0) {
      data.categories.forEach((cat) => {
        const option = document.createElement('option');
        option.value = cat.id;
        option.textContent = cat.name;
        select.appendChild(option);
      });
    }
  } catch (err) {
    console.error('Error loading categories:', err);
  }
}

/**
 * Start or resume a session
 */
async function startSession() {
  try {
    const categorySelect = document.getElementById('category-select');
    const categoryId = categorySelect ? categorySelect.value : null;

    const data = await apiRequest('/chat/start', {
      method: 'POST',
      body: {
        categoryId: categoryId || undefined
      }
    });

    sessionId = data.sessionId;
    
    // Hide category selector once session starts
    const selector = document.getElementById('category-selector');
    if (selector) {
      selector.style.display = 'none';
    }

    addMessage(data.message, 'ai');
    renderQuestion(data.question);
    renderStats(data.stats);
  } catch (err) {
    console.error(err);
    addMessage('Error starting session: ' + err.message, 'ai');
  }
}

/**
 * Submit answer to backend, get feedback + next question
 */
async function sendAnswer() {
  if (!currentQuestion) {
    alert('No question loaded yet.');
    return;
  }
  if (selectedIndex === null) {
    alert('Please select an option first.');
    return;
  }

  const freeText = answerInput.value.trim();
  answerInput.value = '';

  // Show user's answer message
  const answerText = `My answer: ${selectedIndex + 1}. ${
    currentQuestion.options[selectedIndex]
  }${freeText ? ' | Reason: ' + freeText : ''}`;
  addMessage(answerText, 'user');

  try {
    const data = await apiRequest('/chat/answer', {
      method: 'POST',
      body: {
        sessionId,
        questionId: currentQuestion.id,
        selectedIndex,
        freeText
      }
    });

    if (data.currentQuestionResult) {
      const prefix = data.currentQuestionResult.correct
        ? '✅ Correct.'
        : '❌ Incorrect.';

      // Static explanation from dataset
      addMessage(
        `${prefix} ${data.currentQuestionResult.explanation}`,
        'ai'
      );

      // AI feedback from Gemini
      if (data.currentQuestionResult.aiFeedback) {
        addMessage(data.currentQuestionResult.aiFeedback, 'ai');
      }

      // Free-text evaluation feedback
      if (data.currentQuestionResult.freeTextEvaluation) {
        const eval = data.currentQuestionResult.freeTextEvaluation;
        if (eval.feedback) {
          addMessage(`💭 Reasoning Quality: ${eval.feedback} (Score: ${(eval.score * 100).toFixed(0)}%)`, 'ai');
        }
      }
    }

    // Training finished
    if (data.done) {
      if (data.feedback) {
        addMessage(data.feedback, 'ai');
      }
      renderStats(data.stats);
      optionsContainer.innerHTML = '';
      currentQuestion = null;
      return;
    }

    // Continue with next question
    if (data.nextQuestion) {
      renderQuestion(data.nextQuestion);
    }
    renderStats(data.stats);
  } catch (err) {
    console.error(err);
    addMessage('Error submitting answer: ' + err.message, 'ai');
  }
}

// Init
document.addEventListener('DOMContentLoaded', async () => {
  const user = getUser();
  if (!user) {
    // Not logged in – redirect to login section on index
    window.location.href = '/index.html#login';
    return;
  }

  // Load categories first
  await loadCategories();

  // Check if there's an active session - if yes, resume it; if no, show category selector
  try {
    const checkSession = await apiRequest('/chat/start', { method: 'POST' });
    // If we get here, there's an active session - start it
    sessionId = checkSession.sessionId;
    const selector = document.getElementById('category-selector');
    if (selector) {
      selector.style.display = 'none';
    }
    addMessage(checkSession.message, 'ai');
    renderQuestion(checkSession.question);
    renderStats(checkSession.stats);
  } catch (err) {
    // No active session or error - show category selector and wait for user to start
    console.log('No active session, showing category selector');
  }

  if (sendBtn) {
    sendBtn.addEventListener('click', sendAnswer);
  }

  // Add button to start new session with selected category
  const categorySelect = document.getElementById('category-select');
  if (categorySelect) {
    const startBtn = document.createElement('button');
    startBtn.className = 'btn-primary';
    startBtn.textContent = 'Start Training Session';
    startBtn.style.marginTop = '8px';
    startBtn.onclick = startSession;
    categorySelect.parentElement.appendChild(startBtn);
  }
});
