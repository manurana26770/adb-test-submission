import logging

from pymongo.errors import PyMongoError
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .exceptions import DatabaseUnavailable
from .mongo import db
from .repositories import TodoRepository
from .validators import validate_todo_payload

logger = logging.getLogger(__name__)


class TodoListView(APIView):

    def get_repository(self):
        return TodoRepository(db['todos'])

    def get(self, request):
        todos = self.get_repository().list_todos()
        return Response(todos, status=status.HTTP_200_OK)

    def post(self, request):
        description = validate_todo_payload(request.data)
        todo = self.get_repository().create_todo(description)
        return Response(todo, status=status.HTTP_201_CREATED)

    def handle_exception(self, exc):
        if isinstance(exc, PyMongoError):
            logger.exception('Database error on %s %s', self.request.method, self.request.path)
            exc = DatabaseUnavailable()
        return super().handle_exception(exc)
