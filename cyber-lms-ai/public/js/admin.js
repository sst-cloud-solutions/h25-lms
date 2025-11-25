// public/js/admin.js

// Ensure only admin can view this page
function guardAdmin() {
  const user = getUser();
  if (!user) {
    window.location.href = '/index.html#login';
    return false;
  }
  if (user.role !== 'admin') {
    alert('You must be an admin to view this page.');
    window.location.href = '/index.html';
    return false;
  }
  return true;
}

// Global state
let currentTab = 'analytics';
let allCategories = [];

// Switch tabs
function switchTab(tab) {
  currentTab = tab;
  
  // Update tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.classList.add('active');
  
  // Update tab content
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });
  document.getElementById(`${tab}-tab`).classList.add('active');
  
  // Load data for the tab
  switch(tab) {
    case 'analytics':
      loadOverview();
      break;
    case 'users':
      loadUsers();
      break;
    case 'courses':
      loadCourses();
      break;
    case 'questions':
      loadQuestions();
      loadCategories();
      break;
  }
}

// ============================================
// ANALYTICS
// ============================================

async function loadOverview() {
  try {
    const data = await apiRequest('/analytics/overview');
    
    document.getElementById('ov-total-users').textContent = data.totalUsers ?? '-';
    document.getElementById('ov-total-learners').textContent = data.totalLearners ?? '-';
    document.getElementById('ov-total-sessions').textContent = data.totalSessions ?? '-';
    document.getElementById('ov-active-sessions').textContent = data.activeSessions ?? '-';
    document.getElementById('ov-total-questions').textContent = data.totalQuestions ?? '-';
    document.getElementById('ov-accuracy').textContent = (data.accuracy ?? 0) + '%';
  } catch (err) {
    console.error('Overview load error:', err);
  }
}

// ============================================
// USER MANAGEMENT
// ============================================

async function loadUsers() {
  try {
    const roleFilter = document.getElementById('user-role-filter').value;
    const url = roleFilter ? `/admin/users?role=${roleFilter}` : '/admin/users';
    const data = await apiRequest(url);
    
    const usersList = document.getElementById('users-list');
    if (!data.users || data.users.length === 0) {
      usersList.innerHTML = '<p>No users found.</p>';
      return;
    }
    
    let html = '<table class="data-table"><thead><tr>';
    html += '<th>Name</th><th>Email</th><th>Role</th><th>Created</th><th>Actions</th>';
    html += '</tr></thead><tbody>';
    
    data.users.forEach(user => {
      const date = new Date(user.createdAt).toLocaleDateString();
      html += `<tr>
        <td>${user.name}</td>
        <td>${user.email}</td>
        <td><span style="text-transform:capitalize;">${user.role}</span></td>
        <td>${date}</td>
        <td>
          <div class="action-btns">
            <button class="btn-small btn-delete" onclick="deleteUser('${user._id}', '${user.name}')">Delete</button>
          </div>
        </td>
      </tr>`;
    });
    
    html += '</tbody></table>';
    usersList.innerHTML = html;
  } catch (err) {
    console.error('Load users error:', err);
  }
}

function openUserModal() {
  document.getElementById('user-modal-title').textContent = 'Add User';
  document.getElementById('user-form').reset();
  document.getElementById('user-form-error').textContent = '';
  document.getElementById('user-modal').classList.add('active');
}

function closeUserModal() {
  document.getElementById('user-modal').classList.remove('active');
}

async function deleteUser(userId, userName) {
  if (!confirm(`Are you sure you want to delete user "${userName}"? This will also delete their sessions.`)) {
    return;
  }
  
  try {
    await apiRequest(`/admin/users/${userId}`, { method: 'DELETE' });
    loadUsers();
    alert('User deleted successfully!');
  } catch (err) {
    alert('Error deleting user: ' + err.message);
  }
}

// ============================================
// COURSE MANAGEMENT
// ============================================

async function loadCourses() {
  try {
    const data = await apiRequest('/admin/courses');
    
    const coursesList = document.getElementById('courses-list');
    if (!data.courses || data.courses.length === 0) {
      coursesList.innerHTML = '<p>No courses found.</p>';
      return;
    }
    
    let html = '<table class="data-table"><thead><tr>';
    html += '<th>Name</th><th>Category ID</th><th>Questions</th><th>Actions</th>';
    html += '</tr></thead><tbody>';
    
    data.courses.forEach(course => {
      html += `<tr>
        <td><strong>${course.name}</strong><br><small style="color:#6b7280;">${course.description || 'No description'}</small></td>
        <td>${course.categoryId}</td>
        <td>${course.questionCount}</td>
        <td>
          <div class="action-btns">
            <button class="btn-small btn-delete" onclick="deleteCourse('${course.id}', '${course.name}')">Delete</button>
          </div>
        </td>
      </tr>`;
    });
    
    html += '</tbody></table>';
    coursesList.innerHTML = html;
  } catch (err) {
    console.error('Load courses error:', err);
  }
}

function openCourseModal() {
  document.getElementById('course-modal-title').textContent = 'Add Course';
  document.getElementById('course-form').reset();
  document.getElementById('course-form-error').textContent = '';
  document.getElementById('course-modal').classList.add('active');
}

function closeCourseModal() {
  document.getElementById('course-modal').classList.remove('active');
}

async function deleteCourse(courseId, courseName) {
  if (!confirm(`Are you sure you want to delete course "${courseName}"?`)) {
    return;
  }
  
  try {
    await apiRequest(`/admin/courses/${courseId}`, { method: 'DELETE' });
    loadCourses();
    alert('Course deleted successfully!');
  } catch (err) {
    alert('Error deleting course: ' + err.message);
  }
}

// ============================================
// QUESTION MANAGEMENT
// ============================================

async function loadCategories() {
  try {
    const data = await apiRequest('/admin/categories');
    allCategories = data.categories || [];
    
    const select = document.getElementById('question-category-filter');
    select.innerHTML = '<option value="">All Categories</option>';
    
    allCategories.forEach(cat => {
      const option = document.createElement('option');
      option.value = cat.id;
      option.textContent = `${cat.name} (${cat.questionCount} questions)`;
      select.appendChild(option);
    });
  } catch (err) {
    console.error('Load categories error:', err);
  }
}

async function loadQuestions() {
  try {
    const categoryFilter = document.getElementById('question-category-filter').value;
    const difficultyFilter = document.getElementById('question-difficulty-filter').value;
    
    let url = '/admin/questions?';
    if (categoryFilter) url += `categoryId=${categoryFilter}&`;
    if (difficultyFilter) url += `difficulty=${difficultyFilter}&`;
    
    const data = await apiRequest(url);
    
    const questionsList = document.getElementById('questions-list');
    if (!data.questions || data.questions.length === 0) {
      questionsList.innerHTML = '<p>No questions found.</p>';
      return;
    }
    
    let html = `<p style="margin-bottom:10px;"><strong>${data.count} questions found</strong></p>`;
    html += '<table class="data-table"><thead><tr>';
    html += '<th>Question</th><th>Category</th><th>Difficulty</th><th>Options</th><th>Actions</th>';
    html += '</tr></thead><tbody>';
    
    data.questions.forEach(q => {
      const correctAnswer = q.options[q.correctIndex];
      html += `<tr>
        <td style="max-width:300px;"><strong>${q.question}</strong><br><small style="color:#059669;">Correct: ${correctAnswer}</small></td>
        <td>${q.categoryName}</td>
        <td>${q.difficulty}</td>
        <td><small>${q.options.length} options</small></td>
        <td>
          <div class="action-btns">
            <button class="btn-small btn-delete" onclick="deleteQuestion('${q._id}')">Delete</button>
          </div>
        </td>
      </tr>`;
    });
    
    html += '</tbody></table>';
    questionsList.innerHTML = html;
  } catch (err) {
    console.error('Load questions error:', err);
  }
}

async function deleteQuestion(questionId) {
  if (!confirm('Are you sure you want to delete this question?')) {
    return;
  }
  
  try {
    await apiRequest(`/admin/questions/${questionId}`, { method: 'DELETE' });
    loadQuestions();
    alert('Question deleted successfully!');
  } catch (err) {
    alert('Error deleting question: ' + err.message);
  }
}

// ============================================
// FORM SUBMISSIONS
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  if (!guardAdmin()) return;
  
  loadOverview();
  
  // User form
  const userForm = document.getElementById('user-form');
  if (userForm) {
    userForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const name = document.getElementById('user-name').value.trim();
      const email = document.getElementById('user-email').value.trim();
      const password = document.getElementById('user-password').value.trim();
      const role = document.getElementById('user-role').value;
      const errorEl = document.getElementById('user-form-error');
      
      errorEl.textContent = '';
      
      try {
        await apiRequest('/admin/users', {
          method: 'POST',
          body: { name, email, password, role }
        });
        
        closeUserModal();
        loadUsers();
        alert('User created successfully!');
      } catch (err) {
        errorEl.textContent = err.message;
      }
    });
  }
  
  // Course form
  const courseForm = document.getElementById('course-form');
  if (courseForm) {
    courseForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const name = document.getElementById('course-name').value.trim();
      const description = document.getElementById('course-description').value.trim();
      const categoryId = document.getElementById('course-category').value.trim();
      const errorEl = document.getElementById('course-form-error');
      
      errorEl.textContent = '';
      
      
      try {
        await apiRequest('/admin/courses', {
          method: 'POST',
          body: { name, description, categoryId }
        });
        
        closeCourseModal();
        loadCourses();
        alert('Course created successfully!');
      } catch (err) {
        errorEl.textContent = err.message;
      }
    });
  }
});
