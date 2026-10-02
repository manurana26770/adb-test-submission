import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

const TODOS_URL = 'http://localhost:8000/todos/';

function makeTodo(id, description) {
  return { id, description, created_at: '2026-10-02T10:00:00.000+00:00' };
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function startFakeServer(initialTodos = []) {
  const todos = [...initialTodos];
  window.fetch.mockImplementation(async (url, options = {}) => {
    if (options.method === 'POST') {
      const { description } = JSON.parse(options.body);
      const todo = makeTodo(String(todos.length + 1), description);
      todos.push(todo);
      return jsonResponse(todo, 201);
    }
    return jsonResponse(todos);
  });
}

function requestsMade() {
  return window.fetch.mock.calls.map(([url, options = {}]) => [options.method || 'GET', url]);
}

function addTodo(text) {
  userEvent.type(screen.getByLabelText(/todo/i), text);
  userEvent.click(screen.getByRole('button', { name: /add todo/i }));
}

beforeEach(() => {
  jest.spyOn(window, 'fetch');
});

afterEach(() => {
  jest.restoreAllMocks();
});

test('shows the todos from the API', async () => {
  startFakeServer([makeTodo('1', 'Learn Docker'), makeTodo('2', 'Learn React')]);

  render(<App />);

  expect(screen.getByText('Loading todos...')).toBeInTheDocument();
  expect(await screen.findByText('Learn Docker')).toBeInTheDocument();
  expect(screen.getByText('Learn React')).toBeInTheDocument();
  expect(requestsMade()).toEqual([['GET', TODOS_URL]]);
});

test('says so when there are no todos yet', async () => {
  startFakeServer();

  render(<App />);

  expect(await screen.findByText('No todos yet.')).toBeInTheDocument();
});

test('shows an error when the list cannot be loaded and retries on request', async () => {
  window.fetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

  render(<App />);

  expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't load todos. Can't reach the server.");

  startFakeServer([makeTodo('1', 'Learn Docker')]);
  userEvent.click(screen.getByRole('button', { name: /retry/i }));

  expect(await screen.findByText('Learn Docker')).toBeInTheDocument();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

test('adds a todo and then fetches the latest list from the API', async () => {
  startFakeServer([makeTodo('1', 'Learn Docker')]);
  render(<App />);
  await screen.findByText('Learn Docker');

  addTodo('  Learn Mongo  ');

  expect(await screen.findByText('Learn Mongo')).toBeInTheDocument();
  expect(requestsMade()).toEqual([
    ['GET', TODOS_URL],
    ['POST', TODOS_URL],
    ['GET', TODOS_URL],
  ]);
  expect(JSON.parse(window.fetch.mock.calls[1][1].body)).toEqual({ description: 'Learn Mongo' });
  await waitFor(() => expect(screen.getByLabelText(/todo/i)).toHaveValue(''));
});

test('does not send an empty todo', async () => {
  startFakeServer();
  render(<App />);
  await screen.findByText('No todos yet.');

  addTodo('   ');

  expect(screen.getByRole('alert')).toHaveTextContent('Please enter a todo.');
  expect(requestsMade()).toEqual([['GET', TODOS_URL]]);
});

test('shows the server error and keeps the text when adding fails', async () => {
  startFakeServer();
  render(<App />);
  await screen.findByText('No todos yet.');
  window.fetch.mockResolvedValueOnce(
    jsonResponse({ detail: 'Database is unavailable. Try again later.' }, 503)
  );

  addTodo('Learn Mongo');

  expect(await screen.findByRole('alert')).toHaveTextContent('Database is unavailable. Try again later.');
  expect(screen.getByLabelText(/todo/i)).toHaveValue('Learn Mongo');
  expect(screen.getByRole('button', { name: /add todo/i })).toBeEnabled();
});

test('disables the button while the todo is being saved', async () => {
  startFakeServer();
  render(<App />);
  await screen.findByText('No todos yet.');
  let finishSaving;
  window.fetch.mockImplementationOnce(
    () => new Promise((resolve) => {
      finishSaving = () => resolve(jsonResponse(makeTodo('1', 'Learn Mongo'), 201));
    })
  );

  addTodo('Learn Mongo');

  expect(screen.getByRole('button', { name: /adding/i })).toBeDisabled();

  finishSaving();

  await waitFor(() => expect(screen.getByRole('button', { name: /add todo/i })).toBeEnabled());
});
