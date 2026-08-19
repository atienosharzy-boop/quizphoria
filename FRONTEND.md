# Frontend Notes

Files to look at

- `demo.html` — Interactive quiz UI. Contains the quiz area and now a subject selector.
- `script.js` — Main frontend logic: loads `questions.json`, populates categories, and runs the quiz.
- `style.css` — Visual styles.

Customizing questions

- Edit `questions.json` to add or modify quiz items. Each entry should include `question`, `answer`, and `category` (optional `hint`).
- The demo limits questions to 12 per session for readability.

Switching to backend API

- Currently `script.js` fetches `questions.json` directly. To use the backend API instead, change the fetch URL to `/api/questions` and optionally pass a category as `?category=Science`.
