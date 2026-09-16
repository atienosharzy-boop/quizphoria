package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"sync"
	"testing"
)

// setupTestEnvironment sets up a temp directory with mock questions and highscores
func setupTestEnvironment(t *testing.T) (string, *Store, http.Handler) {
	t.Helper()

	tempDir := t.TempDir()
	questionsFile := filepath.Join(tempDir, "questions.json")
	highscoresFile := filepath.Join(tempDir, "highscores.json")
	publicDir := filepath.Join(tempDir, "public")

	if err := os.MkdirAll(publicDir, 0755); err != nil {
		t.Fatalf("failed to create public dir: %v", err)
	}

	// Create dummy index.html and style.css in publicDir
	if err := os.WriteFile(filepath.Join(publicDir, "index.html"), []byte("<html><body>Quizphoria Test Landing</body></html>"), 0644); err != nil {
		t.Fatalf("failed to write dummy index.html: %v", err)
	}
	if err := os.WriteFile(filepath.Join(publicDir, "demo.html"), []byte("<html><body>Quizphoria Test Demo</body></html>"), 0644); err != nil {
		t.Fatalf("failed to write dummy demo.html: %v", err)
	}

	// Create test questions
	testQuestions := []Question{
		{
			ID:          1,
			Category:    "Science",
			Question:    "What is H2O?",
			Options:     []string{"Water", "Helium", "Hydrogen", "Oxygen"},
			Answer:      "Water",
			Hint:        "Common liquid",
			Explanation: "H2O is the chemical formula for water.",
		},
		{
			ID:          2,
			Category:    "Math",
			Question:    "What is 2 + 2?",
			Options:     []string{"3", "4", "5", "6"},
			Answer:      "4",
			Hint:        "Even number",
			Explanation: "2 + 2 equals 4.",
		},
		{
			ID:          3,
			Category:    "Science",
			Question:    "What planet is closest to the Sun?",
			Options:     []string{"Mercury", "Venus", "Earth", "Mars"},
			Answer:      "Mercury",
			Hint:        "Small planet",
			Explanation: "Mercury is closest to the Sun.",
		},
	}

	qBytes, err := json.Marshal(testQuestions)
	if err != nil {
		t.Fatalf("failed to marshal test questions: %v", err)
	}
	if err := os.WriteFile(questionsFile, qBytes, 0644); err != nil {
		t.Fatalf("failed to write test questions: %v", err)
	}

	store, err := NewStore(questionsFile, highscoresFile)
	if err != nil {
		t.Fatalf("failed to create store: %v", err)
	}

	handler := NewRouter(store, publicDir)
	return tempDir, store, handler
}

func TestStaticFileServer_SecurityRestrictions(t *testing.T) {
	_, _, handler := setupTestEnvironment(t)

	testCases := []struct {
		name           string
		path           string
		expectedStatus int
	}{
		{"Root index.html", "/", http.StatusOK},
		{"Explicit index.html", "/index.html", http.StatusMovedPermanently},
		{"Demo page", "/demo.html", http.StatusOK},
		{"Non-existent file", "/missing.html", http.StatusNotFound},
		{"Sensitive dotfile access", "/.git/config", http.StatusNotFound},
		{"Sensitive dotfile nested", "/static/.env", http.StatusNotFound},
		{"Sensitive Go source code", "/main.go", http.StatusNotFound},
		{"Sensitive JSON file", "/questions.json", http.StatusNotFound},
		{"Sensitive highscores JSON", "/highscores.json", http.StatusNotFound},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, tc.path, nil)
			rr := httptest.NewRecorder()
			handler.ServeHTTP(rr, req)

			if rr.Code != tc.expectedStatus {
				t.Errorf("Path %s: expected status %d, got %d", tc.path, tc.expectedStatus, rr.Code)
			}
		})
	}
}

func TestQuestionsAPI(t *testing.T) {
	_, _, handler := setupTestEnvironment(t)

	t.Run("GET /api/questions - sanitized payload without answers", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/questions", nil)
		rr := httptest.NewRecorder()
		handler.ServeHTTP(rr, req)

		if rr.Code != http.StatusOK {
			t.Fatalf("expected 200 OK, got %d", rr.Code)
		}

		var questions []map[string]interface{}
		if err := json.Unmarshal(rr.Body.Bytes(), &questions); err != nil {
			t.Fatalf("failed to unmarshal response: %v", err)
		}

		if len(questions) != 3 {
			t.Fatalf("expected 3 questions, got %d", len(questions))
		}

		// Verify answer and explanation are not exposed
		for _, q := range questions {
			if _, exists := q["answer"]; exists {
				t.Errorf("CRITICAL LEAK: 'answer' found in public question payload: %v", q)
			}
			if _, exists := q["explanation"]; exists {
				t.Errorf("LEAK: 'explanation' found in public question payload: %v", q)
			}
			if _, exists := q["options"]; !exists {
				t.Errorf("MISSING: 'options' expected in public question payload: %v", q)
			}
		}
	})

	t.Run("GET /api/questions?category=Math - filter category", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/questions?category=Math", nil)
		rr := httptest.NewRecorder()
		handler.ServeHTTP(rr, req)

		if rr.Code != http.StatusOK {
			t.Fatalf("expected 200 OK, got %d", rr.Code)
		}

		var questions []PublicQuestion
		if err := json.Unmarshal(rr.Body.Bytes(), &questions); err != nil {
			t.Fatalf("failed to unmarshal: %v", err)
		}

		if len(questions) != 1 {
			t.Fatalf("expected 1 question for Math, got %d", len(questions))
		}
		if questions[0].Category != "Math" {
			t.Errorf("expected Category Math, got %s", questions[0].Category)
		}
	})

	t.Run("POST /api/questions - Method Not Allowed", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/api/questions", nil)
		rr := httptest.NewRecorder()
		handler.ServeHTTP(rr, req)

		if rr.Code != http.StatusMethodNotAllowed {
			t.Errorf("expected 405 Method Not Allowed, got %d", rr.Code)
		}
	})
}

func TestSubmitAPI(t *testing.T) {
	_, _, handler := setupTestEnvironment(t)

	t.Run("POST /api/submit - 100% correct score and gold trophy", func(t *testing.T) {
		payload := SubmitRequest{
			PlayerName: "Super Student",
			Category:   "All",
			Responses: []AnswerSubmission{
				{QuestionID: 1, Answer: "Water"},
				{QuestionID: 2, Answer: "4"},
			},
		}
		body, _ := json.Marshal(payload)

		req := httptest.NewRequest(http.MethodPost, "/api/submit", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		rr := httptest.NewRecorder()
		handler.ServeHTTP(rr, req)

		if rr.Code != http.StatusOK {
			t.Fatalf("expected 200 OK, got %d: %s", rr.Code, rr.Body.String())
		}

		var resp SubmitResponse
		if err := json.Unmarshal(rr.Body.Bytes(), &resp); err != nil {
			t.Fatalf("failed to unmarshal response: %v", err)
		}

		if resp.Score != 2 || resp.Total != 2 {
			t.Errorf("expected score 2/2, got %d/%d", resp.Score, resp.Total)
		}
		if resp.Percentage != 100.0 {
			t.Errorf("expected percentage 100.0, got %f", resp.Percentage)
		}
		if resp.Prize != "🏆 GOLD CHAMPION TROPHY!" {
			t.Errorf("expected Gold Trophy, got %s", resp.Prize)
		}
		if len(resp.Leaderboard) == 0 || resp.Leaderboard[0].Name != "Super Student" {
			t.Errorf("expected Super Student in leaderboard, got %v", resp.Leaderboard)
		}
	})

	t.Run("POST /api/submit - partial correct score", func(t *testing.T) {
		payload := SubmitRequest{
			PlayerName: "Alice",
			Category:   "All",
			Responses: []AnswerSubmission{
				{QuestionID: 1, Answer: "Water"},   // Correct
				{QuestionID: 2, Answer: "Wrong 99"}, // Incorrect
			},
		}
		body, _ := json.Marshal(payload)

		req := httptest.NewRequest(http.MethodPost, "/api/submit", bytes.NewReader(body))
		rr := httptest.NewRecorder()
		handler.ServeHTTP(rr, req)

		if rr.Code != http.StatusOK {
			t.Fatalf("expected 200 OK, got %d", rr.Code)
		}

		var resp SubmitResponse
		_ = json.Unmarshal(rr.Body.Bytes(), &resp)

		if resp.Score != 1 || resp.Total != 2 {
			t.Errorf("expected score 1/2, got %d/%d", resp.Score, resp.Total)
		}
		if resp.Percentage != 50.0 {
			t.Errorf("expected 50.0 percent, got %f", resp.Percentage)
		}
	})

	t.Run("POST /api/submit - invalid JSON body", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/api/submit", bytes.NewReader([]byte("{invalid-json")))
		rr := httptest.NewRecorder()
		handler.ServeHTTP(rr, req)

		if rr.Code != http.StatusBadRequest {
			t.Errorf("expected 400 Bad Request, got %d", rr.Code)
		}
	})

	t.Run("GET /api/submit - Method Not Allowed", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/submit", nil)
		rr := httptest.NewRecorder()
		handler.ServeHTTP(rr, req)

		if rr.Code != http.StatusMethodNotAllowed {
			t.Errorf("expected 405 Method Not Allowed, got %d", rr.Code)
		}
	})
}

func TestHighscoresAPI(t *testing.T) {
	_, _, handler := setupTestEnvironment(t)

	t.Run("GET /api/highscores returns 200 OK", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/highscores", nil)
		rr := httptest.NewRecorder()
		handler.ServeHTTP(rr, req)

		if rr.Code != http.StatusOK {
			t.Fatalf("expected 200 OK, got %d", rr.Code)
		}

		var scores []ScoreEntry
		if err := json.Unmarshal(rr.Body.Bytes(), &scores); err != nil {
			t.Fatalf("failed to unmarshal: %v", err)
		}
	})

	t.Run("POST /api/highscores - Method Not Allowed", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/api/highscores", nil)
		rr := httptest.NewRecorder()
		handler.ServeHTTP(rr, req)

		if rr.Code != http.StatusMethodNotAllowed {
			t.Errorf("expected 405 Method Not Allowed, got %d", rr.Code)
		}
	})
}

func TestCORS_Preflight(t *testing.T) {
	_, _, handler := setupTestEnvironment(t)

	req := httptest.NewRequest(http.MethodOptions, "/api/submit", nil)
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusNoContent {
		t.Errorf("expected 204 No Content for OPTIONS, got %d", rr.Code)
	}

	allowOrigin := rr.Header().Get("Access-Control-Allow-Origin")
	if allowOrigin != "*" {
		t.Errorf("expected Access-Control-Allow-Origin: *, got %s", allowOrigin)
	}
}

func TestConcurrentSubmissions_RaceConditionDetector(t *testing.T) {
	_, _, handler := setupTestEnvironment(t)

	var wg sync.WaitGroup
	numRoutines := 30

	for i := 0; i < numRoutines; i++ {
		wg.Add(3)

		// Concurrent question read
		go func() {
			defer wg.Done()
			req := httptest.NewRequest(http.MethodGet, "/api/questions", nil)
			rr := httptest.NewRecorder()
			handler.ServeHTTP(rr, req)
			if rr.Code != http.StatusOK {
				t.Errorf("concurrent GET /api/questions failed with %d", rr.Code)
			}
		}()

		// Concurrent score submission
		workerID := i
		go func(id int) {
			defer wg.Done()
			payload := SubmitRequest{
				PlayerName: fmt.Sprintf("Worker-%d", id),
				Responses: []AnswerSubmission{
					{QuestionID: 1, Answer: "Water"},
				},
			}
			b, _ := json.Marshal(payload)
			req := httptest.NewRequest(http.MethodPost, "/api/submit", bytes.NewReader(b))
			rr := httptest.NewRecorder()
			handler.ServeHTTP(rr, req)
			if rr.Code != http.StatusOK {
				t.Errorf("concurrent POST /api/submit failed with %d", rr.Code)
			}
		}(workerID)

		// Concurrent highscores read
		go func() {
			defer wg.Done()
			req := httptest.NewRequest(http.MethodGet, "/api/highscores", nil)
			rr := httptest.NewRecorder()
			handler.ServeHTTP(rr, req)
			if rr.Code != http.StatusOK {
				t.Errorf("concurrent GET /api/highscores failed with %d", rr.Code)
			}
		}()
	}

	wg.Wait()
}

func TestQuestionsJSON_DataIntegrity(t *testing.T) {
	data, err := os.ReadFile("questions.json")
	if err != nil {
		t.Fatalf("failed to read questions.json: %v", err)
	}

	var questions []Question
	if err := json.Unmarshal(data, &questions); err != nil {
		t.Fatalf("failed to unmarshal questions.json: %v", err)
	}

	if len(questions) == 0 {
		t.Fatalf("questions.json is empty")
	}

	seenIDs := make(map[int]bool)
	for idx, q := range questions {
		if q.ID <= 0 {
			t.Errorf("Question at index %d has invalid ID: %d", idx, q.ID)
		}
		if seenIDs[q.ID] {
			t.Errorf("Duplicate ID detected: %d at index %d", q.ID, idx)
		}
		seenIDs[q.ID] = true

		if q.Question == "" {
			t.Errorf("Question ID %d has empty question text", q.ID)
		}
		if q.Category == "" {
			t.Errorf("Question ID %d has empty category", q.ID)
		}
		if q.Answer == "" {
			t.Errorf("Question ID %d has empty answer", q.ID)
		}
		if len(q.Options) < 2 {
			t.Errorf("Question ID %d has fewer than 2 options: %v", q.ID, q.Options)
		}

		// Verify answer is present in options
		hasAnswer := false
		for _, opt := range q.Options {
			if opt == q.Answer {
				hasAnswer = true
				break
			}
		}
		if !hasAnswer {
			t.Errorf("Question ID %d: answer %q is not present in options %v", q.ID, q.Answer, q.Options)
		}
	}
}

