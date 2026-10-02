from django.http import QueryDict
from django.test import SimpleTestCase

from rest.exceptions import InvalidTodo
from rest.validators import MAX_DESCRIPTION_LENGTH, validate_todo_payload


class ValidateTodoPayloadTests(SimpleTestCase):

    def test_returns_trimmed_description(self):
        self.assertEqual(validate_todo_payload({'description': '  Buy milk  '}), 'Buy milk')

    def test_accepts_form_data(self):
        self.assertEqual(validate_todo_payload(QueryDict('description=Buy+milk')), 'Buy milk')

    def test_ignores_unknown_fields(self):
        self.assertEqual(validate_todo_payload({'description': 'Buy milk', 'done': True}), 'Buy milk')

    def test_checks_length_after_trimming(self):
        description = 'x' * MAX_DESCRIPTION_LENGTH
        self.assertEqual(validate_todo_payload({'description': f'  {description}  '}), description)

    def test_rejects_invalid_payloads(self):
        too_long = 'x' * (MAX_DESCRIPTION_LENGTH + 1)
        cases = [
            (['Buy milk'], 'Request body must be a JSON object.'),
            ('Buy milk', 'Request body must be a JSON object.'),
            ({}, 'Description is required.'),
            ({'description': None}, 'Description is required.'),
            ({'description': 42}, 'Description must be a string.'),
            ({'description': ['Buy milk']}, 'Description must be a string.'),
            ({'description': ''}, 'Description cannot be empty.'),
            ({'description': '   '}, 'Description cannot be empty.'),
            ({'description': too_long}, f'Description cannot be longer than {MAX_DESCRIPTION_LENGTH} characters.'),
        ]
        for payload, message in cases:
            with self.subTest(payload=payload):
                with self.assertRaises(InvalidTodo) as context:
                    validate_todo_payload(payload)
                self.assertEqual(str(context.exception.detail), message)
