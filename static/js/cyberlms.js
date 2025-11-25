
let currentQuestionId = null;

function handleEnter(e) {
    if (e.key === 'Enter') sendMessage();
}

async function sendMessage() {
    const input = document.getElementById('user-input');
    const message = input.value.trim();
    if (!message) return;

    // Add user message to UI
    addMessage(message, 'user');
    input.value = '';

    // If in quiz mode (waiting for answer)
    if (currentQuestionId) {
        submitAnswer(message);
    } else {
        // Normal chat
        try {
            const response = await fetch('/api/chat/', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({message: message})
            });
            const data = await response.json();
            addMessage(data.response, 'bot');
        } catch (error) {
            addMessage("Error connecting to CyberGuard AI.", 'bot');
        }
    }
}

async function startModule(topic) {
    addMessage(`Starting ${topic} training module...`, 'bot');

    try {
        const response = await fetch('/api/question/', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({topic: topic})
        });
        const data = await response.json();

        if (data.error) {
            addMessage("Error starting quiz.", 'bot');
            return;
        }

        currentQuestionId = data.question_id;
        addMessage(`QUESTION: ${data.question}`, 'bot');
    } catch (error) {
        addMessage("Network error starting module.", 'bot');
    }
}

async function submitAnswer(answer) {
    try {
        // Show thinking state
        const loadingMsg = addMessage("Analyzing...", 'bot');

        const response = await fetch('/api/answer/', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                question_id: currentQuestionId,
                answer: answer
            })
        });
        const data = await response.json();

        // Remove loading message (simple implementation removes last child)
        document.getElementById('chat-messages').removeChild(document.getElementById('chat-messages').lastChild);

        addMessage(data.feedback, 'bot');
        addMessage(`Score: ${data.score}/100`, 'bot');

        // Update Stats UI
        document.getElementById('score-display').textContent = data.new_score;
        document.getElementById('streak-display').textContent = data.new_streak;
        document.getElementById('level-display').textContent = data.new_level;

        currentQuestionId = null; // Reset quiz state

        // Optional: Prompt for next
        setTimeout(() => {
            addMessage("Ready for another question? Select a module or ask me something.", 'bot');
        }, 1000);

    } catch (error) {
        addMessage("Error submitting answer.", 'bot');
        currentQuestionId = null;
    }
}

function addMessage(text, sender) {
    const container = document.getElementById('chat-messages');
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${sender}`;

    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.textContent = text;

    msgDiv.appendChild(bubble);
    container.appendChild(msgDiv);
    container.scrollTop = container.scrollHeight;
    return msgDiv;
}
