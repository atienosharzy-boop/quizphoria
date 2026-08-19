# API Reference

This document describes the backend API provided by the Go server in `main.go`.

GET /api/questions
- Query params: `category` (optional) — filter questions by category (case-insensitive). Use `All` to get all questions.
- Response: JSON array of question objects (same shape as `questions.json`).

POST /api/submit
- Body: JSON with fields `{ "playerName": string, "answers": [string], "category": string }
- Response: JSON containing `score`, `total`, `percentage`, `prize`, `results`, and `leaderboard` (top entries).

GET /api/highscores
- Returns the current leaderboard (top entries).

Notes
- The server serves static files from the project root; open `demo.html` to view the interactive demo.
- CORS is enabled for local testing (allows `Access-Control-Allow-Origin: *`).
