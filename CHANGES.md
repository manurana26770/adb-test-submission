# Changes

## Docker

- Fixed the build: MongoDB 4.4 doesn't install on the current base image (Debian 12), so it's replaced with MongoDB 7.0.
- Fixed the build: the `easy_install pip` step no longer works in the base image, so it's removed. The image already ships with pip.
- Fixed the React container crashing on Node 18: it now uses Node 16, which works with react-scripts 4.
- Added a local `.env` with the codebase path, so `docker compose` works on Windows without extra setup.
- Turned on file polling for the React container, so hot reload works on Windows.
- Turned off Python output buffering for the API container, so its logs show up in `docker logs`.
- Added ignore rules for generated files: Mongo data, `tmp`, `.env`, Python bytecode, `.eslintcache`.

## Backend

- `GET /todos` returns all todos from MongoDB, oldest first.
- `POST /todos` validates the description and saves it to MongoDB, returning the created todo (201).
- Validation: the description is required, must be text, is trimmed, can't be empty, and is limited to 255 characters.
- The API accepts URLs with or without the trailing slash. `POST /todos` previously returned a 500.
- Errors use one consistent format with clear messages (400, 405, 415).
- If MongoDB is down, the API returns 503 after 3 s instead of hanging for 30 s, and logs the error. It recovers on its own when MongoDB is back.
- Removed SQLite and the unused Django apps (admin, auth, sessions). Startup no longer creates a database file or warns about migrations.
- Code is split into connection, data access, validation and HTTP layers.
- Added 19 tests.

## Frontend

- The list loads from the API instead of being hardcoded.
- The form saves todos through the API, then reloads the list from the backend.
- Loading, empty-list and error states, with a Retry button.
- Empty input is blocked. The button is disabled while saving. Server error messages are shown, and the typed text is kept on failure.
- Outdated or cancelled requests can't overwrite a newer list.
- Fixed the label so it links to its input, and the page no longer reloads on submit.
- Removed unused template leftovers (logo, styles).
- Built with hooks only. API calls, state and UI are kept separate.
- Added 13 tests. The old test only passed because of the hardcoded list.

## Performance

| | Before | After |
| --- | --- | --- |
| Image size | 2.35 GB | 1.92 GB |
| Python packages | 83 | 7 |
| First React start | ~530 s | 78 s |
| React restart | 204 s | 9 s |
| Frontend tests | ~150 s | 5 s |

- `node_modules` moved into a Docker volume instead of the Windows folder.
- Unused Python packages and unused system packages (nginx, nano) removed. Package caches cleaned from the image.
