# Frontend Notes

Files to look at

- `demo.html` — Interactive quiz UI. Contains the quiz area and now a subject selector.
- `script.js` — Main frontend logic: loads `questions.json`, populates categories, and runs the quiz.
- `style.css` — Visual styles.

New interactive bits

- `demo.html` includes a progress bar, animated orb, confetti celebration and leaderboard display.
- `docs.html` now has an API tester so you can try `/api/questions` and `/api/submit` from the browser.
 - Languages are now separated into `English` and `Kiswahili` features with dedicated illustrations.
 - Languages are now separated into `English`, `Kiswahili`, `Français`, and `Deutsch` features with dedicated illustrations.
 - Each language card includes guided prompts; we can add audio pronunciation and extra language question packs on request.

Customizing questions

- Edit `questions.json` to add or modify quiz items. Each entry should include `question`, `answer`, and `category` (optional `hint`).
- The demo limits questions to 12 per session for readability.

Switching to backend API

- Currently `script.js` fetches `questions.json` directly. To use the backend API instead, change the fetch URL to `/api/questions` and optionally pass a category as `?category=Science`.
