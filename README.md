# 🎯 Quizphoria

[![Build & Test](https://github.com/atienosharzy-boop/quizphoria/actions/workflows/ci.yml/badge.svg)](https://github.com/atienosharzy-boop/quizphoria/actions/workflows/ci.yml)
[![Go Version](https://img.shields.io/badge/Go-1.22+-00ADD8?style=flat&logo=go)](https://golang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Security: Hardened](https://img.shields.io/badge/Security-Hardened-success)](https://github.com/atienosharzy-boop/quizphoria)

> **Quizphoria** is a high-performance, interactive educational web platform engineered for students. It gamifies STEM, Programming, and Language learning with dynamic quizzes, real-time server-side grading, celebratory achievements, and responsive light/dark themes.

---

## 🌟 Key Features

- **🛡️ Server-Side Grading & Anti-Cheat Engine:** Public question endpoints strip correct answers and explanations. Grading occurs strictly on the Go backend upon submission.
- **⚡ Concurrent Thread-Safe Persistence:** Uses `sync.RWMutex` with in-memory caching to eliminate file-access race conditions under high concurrent traffic.
- **🔒 Hardened Static File Routing:** Web assets are safely isolated inside `public/`. Sensitive internal files (`.git/`, `.env`, `*.go`, `*.json`) are blocked from HTTP routing.
- **🎨 Accessible, Kid-Friendly UI:** Designed with playful typography (`Fredoka`, `Outfit`), vibrant gradients, confetti celebrations, and a dynamic progress bar conforming to ARIA standards.
- **🌓 Cohesive Light & Dark Mode:** Smooth theme switching with contrast ratios that comply with WCAG accessibility guidelines.
- **🏆 Hall of Fame & Social Achievements:** Dynamic leaderboard tracking with custom canvas certificate generation (`generateResultImage`) and web sharing.
- **🧪 Comprehensive Test Suite:** Unit, integration, security, and race condition tests verifying 100% route coverage and concurrency safety.

---

## 🏗️ Architecture & Project Structure

```
quizphoria/
├── .github/
│   └── workflows/
│       └── ci.yml             # Automated CI pipeline (Go vet, race test, build)
├── public/                    # Sandboxed public client assets
│   ├── images/                # Custom 3D Pixar-style illustrations
│   │   ├── hero_mascot.jpg
│   │   ├── math_challenge.jpg
│   │   ├── programming_adventure.jpg
│   │   ├── science_discovery.jpg
│   │   └── world_languages.jpg
│   ├── index.html             # Landing & portal hub
│   ├── demo.html              # Interactive quiz runner & results review
│   ├── features.html          # Subject catalog (STEM, Languages, Code)
│   ├── docs.html              # Interactive developer API tester
│   ├── style.css              # Theme tokens, dark mode, animations
│   ├── script.js              # Client quiz engine, shuffling, state machine
│   └── ui.js                  # Theme toggle & HTML5 canvas image export
├── go.mod                     # Go module definition
├── main.go                    # Go HTTP server, thread-safe store, safe routing
├── main_test.go               # Full test suite (routes, scoring, security, race)
├── questions.json             # Master question bank with options & explanations
├── highscores.json            # Atomic leaderboard state
├── API.md                     # Complete REST API specification
├── FRONTEND.md                # Frontend architecture and component notes
└── README.md                  # Project documentation
```

---

## 🚀 Quick Start

### Prerequisites
- [Go 1.22+](https://golang.org/dl/) installed.

### 1. Run the Server
From the repository root:

```bash
go run main.go
```

By default, the server listens at **`http://localhost:8080`**.

Open your browser to:
- **Landing Page:** [http://localhost:8080](http://localhost:8080)
- **Interactive Quiz:** [http://localhost:8080/demo.html](http://localhost:8080/demo.html)
- **Features Catalog:** [http://localhost:8080/features.html](http://localhost:8080/features.html)
- **API Documentation & Tester:** [http://localhost:8080/docs.html](http://localhost:8080/docs.html)

### 2. Environment Variables

| Variable | Default | Description |
| :--- | :--- | :--- |
| `PORT` | `8080` | Port for the HTTP server |
| `QUESTIONS_FILE` | `questions.json` | Path to master questions JSON |
| `HIGHSCORES_FILE` | `highscores.json` | Path to highscores persistence JSON |
| `PUBLIC_DIR` | `public` | Directory containing static web assets |

Example with custom port:
```bash
PORT=3000 go run main.go
```

---

## 🧪 Testing & Quality Assurance

The project includes an automated test suite verifying security restrictions, HTTP methods, grading accuracy, and concurrency race conditions.

### Run All Tests with Race Detector:
```bash
go test -v -race ./...
```

### Run Static Analysis / Vet:
```bash
go vet ./...
```

### Build Production Binary:
```bash
go build -v -o quizphoria .
./quizphoria
```

---

## 📡 REST API Reference

See [**`API.md`**](API.md) for full request/response schemas and curl examples.

| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/api/questions` | `GET` | Retrieve sanitized questions (answers stripped). Supports `?category=` filter. |
| `/api/submit` | `POST` | Submit player responses for server-side grading and leaderboard entry. |
| `/api/highscores` | `GET` | Retrieve the top leaderboard entries. |

---

## 🔒 Security Guarantees

1. **Information Disclosure Prevention:** The static file server strictly serves from the sandboxed `public/` directory and explicitly blocks any hidden dotfiles (e.g. `/.git/`) or backend files (`*.go`, `*.json`, `*.mod`).
2. **Cheat Prevention:** Answers are evaluated purely on the server. The client never receives correct answers prior to completing the quiz.
3. **Payload Protection:** Submission bodies are bounded with a 1 MB `http.MaxBytesReader` limit to prevent memory exhaustion attacks.
4. **Input Sanitization:** Player names are limited to 50 characters, trimmed, and sanitized against injection/XSS.
5. **Race Condition Immunity:** All shared state operations are guarded by `sync.RWMutex`.

---

## 🤝 Contributing & License

Contributions are welcome! Feel free to open issues or submit pull requests.

Released under the [MIT License](LICENSE). Created with ❤️ by **Sharleen Atieno**.
