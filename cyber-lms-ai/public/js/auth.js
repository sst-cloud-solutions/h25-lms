// public/js/auth.js

/**
 * Save auth data (token + user) to localStorage
 * Called after successful login.
 */
function saveAuth(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  }
  
  /**
   * Get current user object from localStorage
   */
  function getUser() {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
  
    try {
      return JSON.parse(raw);
    } catch (e) {
      console.error('Failed to parse user from storage', e);
      return null;
    }
  }
  
  /**
   * Log out current user
   */
  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/index.html';
  }
  
  /**
   * Render navbar based on user role.
   * Expects the HTML to have:
   *  - <div id="nav-links"></div>
   *  - <div id="nav-user"></div>
   */
  function renderNavbar() {
    const user = getUser();
    const navLinks = document.getElementById('nav-links');
    const navUser = document.getElementById('nav-user');
  
    if (!navLinks || !navUser) return; // page without navbar
  
    if (!user) {
      // Not logged in
      navUser.textContent = 'Guest';
      navLinks.innerHTML = `
        <a href="/index.html#login">Login</a>
      `;
    } else {
    // Logged in
    navUser.textContent = `${user.name} (${user.role})`;

    let linksHtml = `
      <a href="/dashboard.html">Dashboard</a>
    `;
    
    // Only show Training link for non-admin users
    if (user.role !== 'admin') {
      linksHtml += `<a href="/chat.html">Training</a>`;
    }
    
    if (user.role === 'admin') {
      linksHtml += `<a href="/admin.html">Admin</a>`;
    }
  
    linksHtml += `<button onclick="logout()">Logout</button>`;
  
    navLinks.innerHTML = linksHtml;
    }
  }
  
  // Auto-render navbar on page load
  document.addEventListener('DOMContentLoaded', renderNavbar);
  