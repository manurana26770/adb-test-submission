from datetime import datetime, timedelta

from bson import ObjectId
from django.conf import settings
from django.test import SimpleTestCase

from rest.mongo import client
from rest.repositories import TodoRepository

TEST_DB_NAME = f'{settings.MONGO_DB_NAME}_repository_tests'


class TodoRepositoryTests(SimpleTestCase):

    def setUp(self):
        self.collection = client[TEST_DB_NAME]['todos']
        self.repository = TodoRepository(self.collection)
        self.addCleanup(client.drop_database, TEST_DB_NAME)

    def test_create_todo_saves_and_returns_the_todo(self):
        todo = self.repository.create_todo('Buy milk')

        self.assertEqual(todo['description'], 'Buy milk')
        self.assertEqual(self.collection.count_documents({'_id': ObjectId(todo['id'])}), 1)

    def test_created_at_is_returned_as_utc_iso_timestamp(self):
        todo = self.repository.create_todo('Buy milk')

        created_at = datetime.fromisoformat(todo['created_at'])
        self.assertEqual(created_at.utcoffset(), timedelta(0))

    def test_list_todos_returns_what_create_todo_returned(self):
        created = self.repository.create_todo('Buy milk')

        self.assertEqual(self.repository.list_todos(), [created])

    def test_list_todos_returns_oldest_first(self):
        for description in ['First', 'Second', 'Third']:
            self.repository.create_todo(description)

        descriptions = [todo['description'] for todo in self.repository.list_todos()]
        self.assertEqual(descriptions, ['First', 'Second', 'Third'])

    def test_list_todos_is_empty_when_collection_is_empty(self):
        self.assertEqual(self.repository.list_todos(), [])
