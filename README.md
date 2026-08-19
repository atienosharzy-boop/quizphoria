# Quizphoria

Lightweight interactive quiz web app (frontend + Go backend) intended for learning and demos.

Quick start

1. Install Go (if not installed):

```bash
sudo apt update
sudo apt install -y golang-go
```

2. Run the backend (from project root):

```bash
go run main.go
# open http://localhost:8080/demo.html in your browser
```

Project structure

- `main.go` — Go backend, serves static files and provides API endpoints under `/api/`
- `questions.json` — Quiz data used by the frontend/backend
- `highscores.json` — Leaderboard persisted by the backend
- `demo.html`, `index.html`, `script.js`, `style.css` — Frontend UI

Endpoints

See `API.md` for details on available API endpoints and example requests/responses.

How to contribute

- Add more questions to `questions.json` following the existing format.
- Improve the frontend in `script.js` or split components into separate files.

License

Personal project — add a license if you plan to share publicly.
