# Job Board - Saved Jobs Feature

A small Node.js job board application with a JSON API and a web interface. This work sample adds the ability to save jobs, view saved jobs, and remove them.

## Features

- Save a job from the jobs list.
- View all saved jobs on the same page.
- Remove jobs from the saved list.
- Prevent duplicate saved job entries.
- Return a clear error when an unknown job ID is submitted.
- Persist saved jobs across browser refreshes and server restarts.
- Display a helpful message when no jobs have been saved.

## Technology

- Node.js 20 or newer
- Built-in Node.js HTTP server
- HTML, CSS and JavaScript
- JSON file storage
- Node.js built-in test runner

No external packages are required.

## Run the application

Make sure Node.js 20 or newer is installed.

Start the server:

```bash
npm start
```

Open the application:

http://localhost:3000

## Run the tests

```bash
npm test
```

The tests use Node.js's built-in test runner.

They cover job loading, searching, finding jobs, and saved-jobs API behaviour, including duplicate saves, unknown job IDs, invalid JSON, missing job IDs, and removal.

The API tests use temporary JSON storage so they do not modify the application's actual saved-jobs file.

## API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/jobs` | List and search jobs |
| POST | `/api/saved` | Save a job |
| GET | `/api/saved` | List saved jobs |
| DELETE | `/api/saved/:jobId` | Remove a saved job |

Example request body:

```json
{
  "jobId": "j1"
}
```

## Engineering decision

Saved jobs are stored as job IDs in a JSON file instead of copying complete job objects.

This keeps the saved list small and ensures that the application uses the latest job details when displaying saved jobs. A database was unnecessary for this small work sample.

## What I would improve next

With more time, I would add stronger frontend network-error handling, more automated edge-case tests, and improved accessibility.

## AI assistance disclosure

AI assistance was used to implement, review, and improve parts of the saved-jobs feature, frontend, and tests. The implementation was manually reviewed and tested, and the author is continuing to understand the code and its design decisions.
