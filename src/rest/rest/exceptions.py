from rest_framework import status
from rest_framework.exceptions import APIException


class InvalidTodo(APIException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'Invalid todo.'
    default_code = 'invalid_todo'


class DatabaseUnavailable(APIException):
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    default_detail = 'Database is unavailable. Try again later.'
    default_code = 'database_unavailable'
