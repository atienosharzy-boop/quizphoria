# 📡 Quizphoria REST API Specification

This document details the backend REST API provided by the Go server in [`main.go`](main.go).

All endpoints accept and produce `application/json` (UTF-8). CORS is enabled with `Access-Control-Allow-Origin: *`.

---

## Endpoints Summary

| Method | Path | Description | Supported Headers |
| :---: | :--- | :--- | :--- |
| `GET` | `/api/questions` | Retrieve public sanitized questions | `Accept: application/json` |
| `POST` | `/api/submit` | Submit answers for server grading | `Content-Type: application/json` |
| `GET` | `/api/highscores` | Retrieve top leaderboard records | `Accept: application/json` |
| `OPTIONS` | Any | CORS preflight handling | |

---

## 1. GET `/api/questions`

Fetches the question catalog with answer keys stripped out for security.

### Query Parameters
- `category` *(optional, string)*: Filter by subject category (e.g. `Science`, `Math`, `Computer Science`, `Programming`, `Kiswahili`, `Français`, `Deutsch`, or `All`). Case-insensitive.

### Success Response (`200 OK`)
```json
[
  {
    "id": 1,
    "category": "Science",
    "question": "Which planet in our solar system has the most confirmed moons?",
    "options": ["Saturn", "Jupiter", "Uranus", "Neptune"],
    "hint": "It is famous for its bright, prominent ring system."
  }
]
```

> **Security Note:** Neither the `answer` nor the `explanation` field is ever returned on this endpoint.

### Error Responses
- `405 Method Not Allowed`: When called with any HTTP method other than `GET` or `OPTIONS`.

---

## 2. POST `/api/submit`

Submits player answers for server-side evaluation, score calculation, explanation generation, and leaderboard entry.

### Request Headers
```http
Content-Type: application/json
```

### Request Body Schema
```json
{
  "playerName": "Curious Learner",
  "category": "Science",
  "responses": [
    {
      "questionId": 1,
      "answer": "Saturn"
    }
  ]
}
```

*Note: For backwards compatibility, the legacy format `"answers": ["Saturn", ...]` is also accepted.*

### Success Response (`200 OK`)
```json
{
  "score": 1,
  "total": 1,
  "percentage": 100.0,
  "prize": "🏆 GOLD CHAMPION TROPHY!",
  "results": [
    {
      "questionId": 1,
      "question": "Which planet in our solar system has the most confirmed moons?",
      "userAnswer": "Saturn",
      "correct": "Saturn",
      "isCorrect": true,
      "explanation": "Saturn currently has over 140 confirmed moons, officially surpassing Jupiter."
    }
  ],
  "leaderboard": [
    {
      "name": "Curious Learner",
      "score": 1,
      "total": 1,
      "date": "2026-09-15 18:30"
    }
  ]
}
```

### Error Responses
- `400 Bad Request`: When the JSON body is malformed or exceeds the 1 MB size limit.
- `405 Method Not Allowed`: When invoked with a method other than `POST` or `OPTIONS`.

---

## 3. GET `/api/highscores`

Returns the top 10 highest player scores sorted descending.

### Success Response (`200 OK`)
```json
[
  {
    "name": "Curious Learner",
    "score": 10,
    "total": 10,
    "date": "2026-09-15 18:30"
  }
]
```

### Error Responses
- `405 Method Not Allowed`: When invoked with a method other than `GET` or `OPTIONS`.
