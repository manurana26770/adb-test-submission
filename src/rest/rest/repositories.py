from datetime import datetime, timezone

from pymongo import ASCENDING


class TodoRepository:
    def __init__(self, collection):
        self._collection = collection

    def list_todos(self):
        documents = self._collection.find().sort('_id', ASCENDING)
        return [self._to_todo(document) for document in documents]

    def create_todo(self, description):
        document = {
            'description': description,
            'created_at': datetime.now(timezone.utc),
        }
        result = self._collection.insert_one(document)
        return self._to_todo({**document, '_id': result.inserted_id})

    @staticmethod
    def _to_todo(document):
        return {
            'id': str(document['_id']),
            'description': document['description'],
            'created_at': document['created_at'].isoformat(timespec='milliseconds'),
        }
