export function TodoList({ todos, isLoading, error, onRetry }) {
  const isEmpty = todos.length === 0;

  return (
    <div>
      {error && (
        <div role="alert" className="error">
          Couldn't load todos. {error.message}{' '}
          <button type="button" onClick={onRetry}>
            Retry
          </button>
        </div>
      )}
      {isEmpty && isLoading && <p>Loading todos...</p>}
      {isEmpty && !isLoading && !error && <p>No todos yet.</p>}
      {!isEmpty && (
        <ul className="TodoList">
          {todos.map((todo) => (
            <li key={todo.id}>{todo.description}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
