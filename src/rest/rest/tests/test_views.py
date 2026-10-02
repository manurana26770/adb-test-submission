from unittest import mock

from django.test import SimpleTestCase
from pymongo.errors import ServerSelectionTimeoutError
from rest_framework.test import APIClient

from rest.views import TodoListView


class FakeTodoRepository:

    def __init__(self, todos=None):
        self.todos = list(todos or [])
        self.error = None

    def list_todos(self):
        self._fail_if_broken()
        return self.todos

    def create_todo(self, description):
        self._fail_if_broken()
        todo = {
            'id': str(len(self.todos) + 1),
            'description': description,
            'created_at': '2026-10-02T10:00:00.000+00:00',
        }
        self.todos.append(todo)
        return todo

    def _fail_if_broken(self):
        if self.error:
            raise self.error


class TodoListViewTests(SimpleTestCase):
    client_class = APIClient

    def setUp(self):
        self.repository = FakeTodoRepository()
        patcher = mock.patch.object(TodoListView, 'get_repository', return_value=self.repository)
        patcher.start()
        self.addCleanup(patcher.stop)

    def test_get_returns_all_todos(self):
        self.repository.todos = [
            {'id': '1', 'description': 'Learn Docker', 'created_at': '2026-10-02T10:00:00.000+00:00'},
            {'id': '2', 'description': 'Learn React', 'created_at': '2026-10-02T10:05:00.000+00:00'},
        ]

        response = self.client.get('/todos/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), self.repository.todos)

    def test_get_returns_empty_list_when_there_are_no_todos(self):
        response = self.client.get('/todos/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [])

    def test_post_creates_todo_with_trimmed_description(self):
        response = self.client.post('/todos/', {'description': '  Buy milk  '}, format='json')

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()['description'], 'Buy milk')
        self.assertEqual([todo['description'] for todo in self.repository.todos], ['Buy milk'])

    def test_works_without_trailing_slash(self):
        self.assertEqual(self.client.get('/todos').status_code, 200)
        self.assertEqual(self.client.post('/todos', {'description': 'Buy milk'}, format='json').status_code, 201)

    def test_post_rejects_invalid_description(self):
        response = self.client.post('/todos/', {'description': '   '}, format='json')

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json(), {'detail': 'Description cannot be empty.'})
        self.assertEqual(self.repository.todos, [])

    def test_post_rejects_malformed_json(self):
        response = self.client.post('/todos/', '{"description": ', content_type='application/json')

        self.assertEqual(response.status_code, 400)
        self.assertEqual(self.repository.todos, [])

    def test_post_rejects_unsupported_media_type(self):
        response = self.client.post('/todos/', 'Buy milk', content_type='text/plain')

        self.assertEqual(response.status_code, 415)
        self.assertEqual(self.repository.todos, [])

    def test_returns_503_when_database_is_unavailable(self):
        self.repository.error = ServerSelectionTimeoutError('mongo:27017: timed out')
        requests = {
            'GET': lambda: self.client.get('/todos/'),
            'POST': lambda: self.client.post('/todos/', {'description': 'Buy milk'}, format='json'),
        }

        for method, send in requests.items():
            with self.subTest(method=method):
                with self.assertLogs('rest.views', level='ERROR') as logs:
                    response = send()

                self.assertEqual(response.status_code, 503)
                self.assertEqual(response.json(), {'detail': 'Database is unavailable. Try again later.'})
                self.assertIn(f'Database error on {method} /todos/', logs.output[0])

    def test_rejects_unsupported_methods(self):
        self.assertEqual(self.client.delete('/todos/').status_code, 405)
