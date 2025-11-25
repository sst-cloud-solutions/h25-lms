// public/js/api.js

// Base path for all backend APIs
const API_BASE = '/api';

/**
 * Get JWT token from localStorage
 */
function getToken() {
  return localStorage.getItem('token');
}

/**
 * Generic API request helper
 *
 * Usage example:
 *   const data = await apiRequest('/auth/login', {
 *     method: 'POST',
 *     body: { email, password }
 *   });
 */
async function apiRequest(path, options = {}) {
  const token = getToken();
  const headers = options.headers || {};

  // Handle JSON body (we're not dealing with file uploads here)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  // Attach auth header if token exists
  if (token) {
    headers['Authorization'] = 'Bearer ' + token;
  }

  const response = await fetch(API_BASE + path, {
    ...options,
    headers,
    body:
      options.body instanceof FormData
        ? options.body
        : options.body
        ? JSON.stringify(options.body)
        : undefined
  });

  // Try to parse JSON even on errors
  let data;
  try {
    data = await response.json();
  } catch (e) {
    data = null;
  }

  if (!response.ok) {
    const message = (data && data.message) || 'Request failed';
    throw new Error(message);
  }

  return data;
}
