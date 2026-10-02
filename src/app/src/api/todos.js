const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export const MAX_DESCRIPTION_LENGTH = 255;

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, options);
  } catch (error) {
    if (error.name === 'AbortError') {
      throw error;
    }
    throw new ApiError("Can't reach the server. Please try again.", 0);
  }

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message = body?.detail || `Request failed with status ${response.status}.`;
    throw new ApiError(message, response.status);
  }
  return body;
}

export function fetchTodos({ signal } = {}) {
  return request('/todos/', { signal });
}

export function createTodo(description) {
  return request('/todos/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ description }),
  });
}
