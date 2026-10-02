from collections.abc import Mapping

from .exceptions import InvalidTodo

MAX_DESCRIPTION_LENGTH = 255


def validate_todo_payload(data):
    if not isinstance(data, Mapping):
        raise InvalidTodo('Request body must be a JSON object.')

    description = data.get('description')
    if description is None:
        raise InvalidTodo('Description is required.')
    if not isinstance(description, str):
        raise InvalidTodo('Description must be a string.')

    description = description.strip()
    if not description:
        raise InvalidTodo('Description cannot be empty.')
    if len(description) > MAX_DESCRIPTION_LENGTH:
        raise InvalidTodo(f'Description cannot be longer than {MAX_DESCRIPTION_LENGTH} characters.')

    return description
