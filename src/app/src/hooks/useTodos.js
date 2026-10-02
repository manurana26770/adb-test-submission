import { useCallback, useEffect, useReducer, useRef } from 'react';
import { createTodo, fetchTodos } from '../api/todos';

const initialState = {
  todos: [],
  isLoading: true,
  error: null,
};

function todosReducer(state, action) {
  switch (action.type) {
    case 'loading':
      return { ...state, isLoading: true, error: null };
    case 'loaded':
      return { todos: action.todos, isLoading: false, error: null };
    case 'failed':
      return { ...state, isLoading: false, error: action.error };
    default:
      throw new Error(`Unknown action: ${action.type}`);
  }
}

export function useTodos() {
  const [state, dispatch] = useReducer(todosReducer, initialState);
  const activeLoad = useRef(null);

  const refresh = useCallback(async () => {
    activeLoad.current?.abort();
    const controller = new AbortController();
    activeLoad.current = controller;

    dispatch({ type: 'loading' });
    try {
      const todos = await fetchTodos({ signal: controller.signal });
      if (!controller.signal.aborted) {
        dispatch({ type: 'loaded', todos });
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        dispatch({ type: 'failed', error });
      }
    }
  }, []);

  useEffect(() => {
    refresh();
    return () => activeLoad.current?.abort();
  }, [refresh]);

  const addTodo = useCallback(
    async (description) => {
      await createTodo(description);
      await refresh();
    },
    [refresh]
  );

  return { ...state, refresh, addTodo };
}
