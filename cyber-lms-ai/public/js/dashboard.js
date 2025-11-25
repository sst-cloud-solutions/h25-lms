// public/js/dashboard.js

let categoryChart = null;
let difficultyChart = null;

/**
 * Load and display admin dashboard
 */
async function loadAdminDashboard() {
  try {
    const data = await apiRequest('/analytics/admin-dashboard');

    // Overall stats
    document.getElementById('admin-total-courses').textContent = data.totalCourses || 0;

    // Render courses list
    renderCoursesList(data.courses || []);
  } catch (err) {
    console.error('Admin dashboard load error:', err);
    const errorEl = document.getElementById('courses-error');
    if (errorEl) {
      errorEl.textContent = 'Error loading admin dashboard: ' + err.message;
    }
  }
}

/**
 * Render courses list (AI-generated courses)
 */
function renderCoursesList(courses) {
  const container = document.getElementById('courses-list');
  if (!container) return;

  if (courses.length === 0) {
    container.innerHTML = '<div class="card"><p style="color:#9ca3af;">No courses available yet.</p></div>';
    return;
  }

  let html = '<div style="display:grid;gap:12px;">';
  courses.forEach((course) => {
    html += `
      <div class="card" style="border-left:4px solid #0ea5e9;">
        <div style="display:flex;justify-content:space-between;align-items:start;flex-wrap:wrap;">
          <div style="flex:1;min-width:200px;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
              <span style="font-size:20px;">🤖</span>
              <h4 style="margin:0;color:#0ea5e9;">${course.name}</h4>
            </div>
            ${course.description ? `<p style="font-size:14px;color:#6b7280;margin-top:6px;line-height:1.6;">${course.description}</p>` : ''}
            <div style="display:flex;gap:20px;flex-wrap:wrap;margin-top:12px;padding-top:12px;border-top:1px solid #e5e7eb;">
              <span style="font-size:13px;color:#6b7280;">
                📚 Category: <strong style="color:#0ea5e9;">${course.categoryId}</strong>
              </span>
              <span style="font-size:13px;color:#6b7280;">
                ❓ Questions: <strong style="color:#0ea5e9;">${course.questionCount || 0}</strong>
              </span>
              <span style="font-size:13px;color:#6b7280;">
                📅 Created: <strong style="color:#0ea5e9;">${new Date(course.createdAt).toLocaleDateString()}</strong>
              </span>
            </div>
          </div>
        </div>
      </div>
    `;
  });
  html += '</div>';

  container.innerHTML = html;
}

/**
 * Load and display user dashboard stats
 */
async function loadDashboard() {
  const user = getUser();
  if (!user) {
    window.location.href = '/index.html#login';
    return;
  }

  // If admin, load admin dashboard
  if (user.role === 'admin') {
    document.getElementById('admin-dashboard').style.display = 'block';
    document.getElementById('learner-dashboard').style.display = 'none';
    await loadAdminDashboard();
    return;
  }

  // Otherwise, load learner dashboard
  document.getElementById('admin-dashboard').style.display = 'none';
  document.getElementById('learner-dashboard').style.display = 'block';

  try {
    const data = await apiRequest('/analytics/my-stats');

    // Overall stats
    document.getElementById('stat-total-sessions').textContent = data.overall.totalSessions || 0;
    document.getElementById('stat-total-questions').textContent = data.overall.totalQuestions || 0;
    document.getElementById('stat-total-correct').textContent = data.overall.totalCorrect || 0;
    document.getElementById('stat-accuracy').textContent = (data.overall.accuracy || 0) + '%';
    document.getElementById('stat-active-sessions').textContent = data.overall.activeSessions || 0;

    // Current session
    if (data.currentSession) {
      document.getElementById('current-session-section').style.display = 'block';
      document.getElementById('current-session-asked').textContent = data.currentSession.totalAsked || 0;
      document.getElementById('current-session-correct').textContent = data.currentSession.totalCorrect || 0;
      document.getElementById('current-session-accuracy').textContent = data.currentSession.accuracy || 0;
      document.getElementById('current-session-difficulty').textContent = data.currentSession.currentDifficulty || 1;
      document.getElementById('current-session-streak').textContent = data.currentSession.correctStreak || 0;
    }

    // Category performance chart
    if (data.categoryPerformance && data.categoryPerformance.length > 0) {
      renderCategoryChart(data.categoryPerformance);
      renderCategoryList(data.categoryPerformance);
    }

    // Difficulty progression chart
    if (data.difficultyProgression && data.difficultyProgression.length > 0) {
      renderDifficultyChart(data.difficultyProgression);
    }

    // Weak areas
    if (data.weakAreas && data.weakAreas.length > 0) {
      document.getElementById('weak-areas-section').style.display = 'block';
      renderWeakAreas(data.weakAreas);
    }

    // Recent sessions
    if (data.recentSessions && data.recentSessions.length > 0) {
      renderRecentSessions(data.recentSessions);
    } else {
      document.getElementById('recent-sessions').innerHTML = '<p style="color:#9ca3af;">No training sessions yet. <a href="/chat.html">Start your first session!</a></p>';
    }
  } catch (err) {
    console.error('Dashboard load error:', err);
    document.getElementById('category-error').textContent = 'Error loading dashboard: ' + err.message;
  }
}

/**
 * Render category performance chart
 */
function renderCategoryChart(categoryData) {
  const ctx = document.getElementById('category-chart');
  if (!ctx) return;

  // Destroy existing chart if it exists
  if (categoryChart) {
    categoryChart.destroy();
  }

  const labels = categoryData.map((cat) => cat.category);
  const accuracies = categoryData.map((cat) => cat.accuracy);
  const colors = accuracies.map((acc) => {
    if (acc >= 80) return '#4ade80'; // green
    if (acc >= 60) return '#fbbf24'; // yellow
    return '#f87171'; // red
  });

  categoryChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Accuracy %',
        data: accuracies,
        backgroundColor: colors,
        borderColor: colors,
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            callback: function(value) {
              return value + '%';
            }
          }
        },
        x: {
          ticks: {
            maxRotation: 45,
            minRotation: 45
          }
        }
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const cat = categoryData[context.dataIndex];
              return `Accuracy: ${cat.accuracy}% (${cat.correct}/${cat.asked} correct)`;
            }
          }
        }
      }
    }
  });
}

/**
 * Render difficulty progression chart
 */
function renderDifficultyChart(progressionData) {
  const ctx = document.getElementById('difficulty-chart');
  if (!ctx) return;

  // Destroy existing chart if it exists
  if (difficultyChart) {
    difficultyChart.destroy();
  }

  const labels = progressionData.map((d, i) => {
    const date = new Date(d.date);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });
  const difficulties = progressionData.map((d) => d.difficulty);
  const accuracies = progressionData.map((d) => d.accuracy);

  difficultyChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Difficulty Level',
          data: difficulties,
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37, 99, 235, 0.1)',
          yAxisID: 'y',
          tension: 0.4
        },
        {
          label: 'Accuracy %',
          data: accuracies,
          borderColor: '#4ade80',
          backgroundColor: 'rgba(74, 222, 128, 0.1)',
          yAxisID: 'y1',
          tension: 0.4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      interaction: {
        mode: 'index',
        intersect: false
      },
      scales: {
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          title: {
            display: true,
            text: 'Difficulty Level'
          },
          min: 1,
          max: 5
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          title: {
            display: true,
            text: 'Accuracy %'
          },
          min: 0,
          max: 100,
          grid: {
            drawOnChartArea: false
          }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: function(context) {
              if (context.datasetIndex === 0) {
                return `Difficulty: ${context.parsed.y}`;
              } else {
                return `Accuracy: ${context.parsed.y}%`;
              }
            }
          }
        }
      }
    }
  });
}

/**
 * Render category list
 */
function renderCategoryList(categoryData) {
  const container = document.getElementById('category-list');
  if (!container) return;

  if (categoryData.length === 0) {
    container.innerHTML = '<p style="color:#9ca3af;">No category data available yet.</p>';
    return;
  }

  let html = '<div style="display:grid;gap:10px;">';
  categoryData.forEach((cat) => {
    const accuracyColor = cat.accuracy >= 80 ? '#4ade80' : cat.accuracy >= 60 ? '#fbbf24' : '#f87171';
    html += `
      <div class="card" style="display:flex;justify-content:space-between;align-items:center;">
        <div>
          <strong>${cat.category}</strong>
          <p style="font-size:14px;color:#9ca3af;margin-top:4px;">
            ${cat.correct} correct out of ${cat.asked} questions
          </p>
        </div>
        <div style="text-align:right;">
          <div style="font-size:24px;font-weight:bold;color:${accuracyColor};">
            ${cat.accuracy}%
          </div>
          <div style="width:100px;height:8px;background:#e5e7eb;border-radius:4px;margin-top:4px;">
            <div style="width:${cat.accuracy}%;height:100%;background:${accuracyColor};border-radius:4px;"></div>
          </div>
        </div>
      </div>
    `;
  });
  html += '</div>';

  container.innerHTML = html;
}

/**
 * Render weak areas
 */
function renderWeakAreas(weakAreas) {
  const container = document.getElementById('weak-areas-list');
  if (!container) return;

  let html = '<ul style="list-style:none;padding:0;">';
  weakAreas.forEach((area) => {
    html += `
      <li style="padding:8px 0;border-bottom:1px solid #fee2e2;">
        <strong>${area.category}</strong>
        <span style="color:#dc2626;margin-left:8px;">${area.accuracy}% accuracy</span>
        <p style="font-size:13px;color:#991b1b;margin-top:4px;">
          ${area.correct}/${area.asked} correct. Consider focusing more training on this area.
        </p>
      </li>
    `;
  });
  html += '</ul>';

  container.innerHTML = html;
}

/**
 * Render recent sessions
 */
function renderRecentSessions(sessions) {
  const container = document.getElementById('recent-sessions');
  if (!container) return;

  if (sessions.length === 0) {
    container.innerHTML = '<p style="color:#9ca3af;">No sessions yet.</p>';
    return;
  }

  let html = '<div style="display:grid;gap:10px;">';
  sessions.forEach((session) => {
    const date = new Date(session.updatedAt);
    const accuracyColor = session.accuracy >= 80 ? '#4ade80' : session.accuracy >= 60 ? '#fbbf24' : '#f87171';
    const statusBadge = session.active
      ? '<span style="background:#4ade80;color:white;padding:2px 8px;border-radius:4px;font-size:12px;">Active</span>'
      : '<span style="background:#9ca3af;color:white;padding:2px 8px;border-radius:4px;font-size:12px;">Completed</span>';

    html += `
      <div class="card" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;">
        <div>
          <div style="display:flex;gap:8px;align-items:center;margin-bottom:4px;">
            <strong>Session ${date.toLocaleDateString()}</strong>
            ${statusBadge}
          </div>
          <p style="font-size:14px;color:#9ca3af;margin-top:4px;">
            ${session.totalAsked} questions • ${session.totalCorrect} correct • 
            Difficulty: ${session.currentDifficulty} • Streak: ${session.correctStreak}
          </p>
        </div>
        <div style="text-align:right;">
          <div style="font-size:20px;font-weight:bold;color:${accuracyColor};">
            ${session.accuracy}%
          </div>
        </div>
      </div>
    `;
  });
  html += '</div>';

  container.innerHTML = html;
}

// Initialize dashboard on page load
document.addEventListener('DOMContentLoaded', () => {
  const user = getUser();
  if (!user) {
    window.location.href = '/index.html#login';
    return;
  }

  loadDashboard();
});

