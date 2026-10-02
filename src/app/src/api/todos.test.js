import { ApiError, createTodo, fetchTodos } from './todos';

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

beforeEach(() => {
  jest.spyOn(window, 'fetch');
});

afterEach(() => {
  jest.restoreAllMocks();
});

test('fetchTodos returns the todos and passes the abort signal along', async () => {
  const todos = [{ id: '1', description: 'Learn Docker', created_at: '2026-10-02T10:00:00.000+00:00' }];
  window.fetch.mockResolvedValue(jsonResponse(todos));
  const controller = new AbortController();

  await expect(fetchTodos({ signal: controller.signal })).resolves.toEqual(todos);
  expect(window.fetch).toHaveBeenCalledWith('http://localhost:8000/todos/', { signal: controller.signal });
});

test('createTodo posts the description as JSON', async () => {
  const todo = { id: '1', description: 'Learn Docker', created_at: '2026-10-02T10:00:00.000+00:00' };
  window.fetch.mockResolvedValue(jsonResponse(todo, 201));

  await expect(createTodo('Learn Docker')).resolves.toEqual(todo);
  expect(window.fetch).toHaveBeenCalledWith('http://localhost:8000/todos/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ description: 'Learn Docker' }),
  });
});

test('uses the error message sent by the server', async () => {
  window.fetch.mockResolvedValue(jsonResponse({ detail: 'Description cannot be empty.' }, 400));

  const error = await createTodo(' ').catch((caught) => caught);

  expect(error).toBeInstanceOf(ApiError);
  expect(error.message).toBe('Description cannot be empty.');
  expect(error.status).toBe(400);
});

test('falls back to a generic message when the error response is not JSON', async () => {
  window.fetch.mockResolvedValue(new Response('<h1>Server Error</h1>', { status: 500 }));

  await expect(fetchTodos()).rejects.toThrow('Request failed with status 500.');
});

test('explains when the server cannot be reached', async () => {
  window.fetch.mockRejectedValue(new TypeError('Failed to fetch'));

  await expect(fetchTodos()).rejects.toThrow("Can't reach the server. Please try again.");
});

test('lets an aborted request fail as an abort', async () => {
  const abortError = new DOMException('The user aborted a request.', 'AbortError');
  window.fetch.mockRejectedValue(abortError);

  await expect(fetchTodos()).rejects.toBe(abortError);
});
