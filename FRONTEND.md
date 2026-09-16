# 🎨 Frontend Architecture & Developer Guide

This document outlines the architecture, components, and state management of the Quizphoria client applications located inside [`public/`](public/).

---

## Directory Overview

- [`public/index.html`](public/index.html) — Landing page, navigation bar, hero card, and quick start links.
- [`public/demo.html`](public/demo.html) — Interactive quiz runner, live progress bar, floating visual avatar, results breakdown, and hall-of-fame leaderboard.
- [`public/features.html`](public/features.html) — Subject catalog highlighting Science, Mathematics, Computer Science, Programming (Python, JavaScript, Java), and Languages (English, Kiswahili, French, German).
- [`public/docs.html`](public/docs.html) — Developer setup guide and interactive API tester for `/api/questions` and `/api/submit`.
- [`public/style.css`](public/style.css) — CSS design tokens, dark mode overrides, animations, flexbox & grid layouts.
- [`public/script.js`](public/script.js) — Client quiz engine, dynamic option shuffling, safe server communication, results evaluation, and confetti canvas.
- [`public/ui.js`](public/ui.js) — Light/dark theme toggler with `localStorage` persistence, playful mascot wiggles, and HTML5 canvas image export (`generateResultImage`).

---

## Key Features & Security Design

### 1. Server-Side Grading Flow
1. [`script.js`](public/script.js) calls `GET /api/questions?category=<selected>`.
2. The server returns questions with options, hints, and category. Answers are withheld.
3. [`script.js`](public/script.js) shuffles options with the Fisher-Yates algorithm so the correct answer is randomized.
4. As the student answers questions, responses are recorded with question IDs:
   ```json
   { "questionId": 1, "answer": "Saturn" }
   ```
5. On quiz completion, answers are sent to `POST /api/submit`.
6. The backend evaluates the answers and returns full performance metrics, educational explanations, and updated leaderboard rankings.

### 2. Dark Mode Theming
- The UI uses CSS variables (`--bg-gradient`, `--card-bg`, `--text-main`, `--surface-muted`, etc.).
- Adding the `.dark` class to `<body>` smoothly transitions the background and all card surfaces while ensuring accessible contrast compliant with WCAG AA standards.
- Preference is remembered across visits via `localStorage.getItem('quizphoria-theme')`.

### 3. Shareable Achievement Cards
- Clicking **"Save Result Image"** uses HTML5 Canvas in [`ui.js`](public/ui.js) to render a personalized graphic displaying the student's name and score against a modern gradient, triggering an immediate PNG download.
- Clicking **"Share Result"** leverages the Web Share API (`navigator.share`) with automatic clipboard fallback.
