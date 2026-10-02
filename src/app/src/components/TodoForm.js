import { useState } from 'react';
import { MAX_DESCRIPTION_LENGTH } from '../api/todos';

export function TodoForm({ onAdd }) {
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (event) => {
    setDescription(event.target.value);
    setError(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedDescription = description.trim();
    if (!trimmedDescription) {
      setError('Please enter a todo.');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await onAdd(trimmedDescription);
      setDescription('');
    } catch (addError) {
      setError(addError.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="todo">ToDo: </label>
        <input
          id="todo"
          type="text"
          value={description}
          onChange={handleChange}
          maxLength={MAX_DESCRIPTION_LENGTH}
          readOnly={isSaving}
        />
      </div>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <div style={{ marginTop: '5px' }}>
        <button type="submit" disabled={isSaving}>
          {isSaving ? 'Adding...' : 'Add ToDo!'}
        </button>
      </div>
    </form>
  );
}
