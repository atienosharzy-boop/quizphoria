package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"sort"
	"strings"
	"sync"
	"syscall"
	"time"
)

// --- Domain Models ---

type Question struct {
	ID          int      `json:"id"`
	Category    string   `json:"category"`
	Question    string   `json:"question"`
	Options     []string `json:"options"`
	Answer      string   `json:"answer"`
	Hint        string   `json:"hint"`
	Explanation string   `json:"explanation"`
}

// PublicQuestion hides answer and explanation to prevent answer leakage
type PublicQuestion struct {
	ID       int      `json:"id"`
	Category string   `json:"category"`
	Question string   `json:"question"`
	Options  []string `json:"options"`
	Hint     string   `json:"hint"`
}

type ScoreEntry struct {
	Name  string `json:"name"`
	Score int    `json:"score"`
	Total int    `json:"total"`
	Date  string `json:"date"`
}

type AnswerSubmission struct {
	QuestionID int    `json:"questionId"`
	Answer     string `json:"answer"`
}

type SubmitRequest struct {
	PlayerName string             `json:"playerName"`
	Category   string             `json:"category"`
	Responses  []AnswerSubmission `json:"responses,omitempty"`
	Answers    []string           `json:"answers,omitempty"` // Legacy backwards compatibility
}

type QuestionResult struct {
	QuestionID  int    `json:"questionId"`
	Question    string `json:"question"`
	UserAnswer  string `json:"userAnswer"`
	Correct     string `json:"correct"`
	IsCorrect   bool   `json:"isCorrect"`
	Explanation string `json:"explanation"`
}

type SubmitResponse struct {
	Score       int              `json:"score"`
	Total       int              `json:"total"`
	Percentage  float64          `json:"percentage"`
	Prize       string           `json:"prize"`
	Results     []QuestionResult `json:"results"`
	Leaderboard []ScoreEntry     `json:"leaderboard"`
}

// --- Thread-Safe Store ---

type Store struct {
	mu              sync.RWMutex
	questions       []Question
	questionsByID   map[int]Question
	leaderboard     []ScoreEntry
	questionsFile   string
	leaderboardFile string
	maxLeaderboard  int
}

func NewStore(questionsFile, leaderboardFile string) (*Store, error) {
	s := &Store{
		questionsFile:   questionsFile,
		leaderboardFile: leaderboardFile,
		maxLeaderboard:  10,
		questionsByID:   make(map[int]Question),
	}

	if err := s.loadQuestions(); err != nil {
		return nil, fmt.Errorf("failed to load questions: %w", err)
	}

	if err := s.loadLeaderboard(); err != nil {
		log.Printf("Warning: highscores initialization (%v). Starting with empty leaderboard.", err)
		s.leaderboard = []ScoreEntry{}
	}

	return s, nil
}

func (s *Store) loadQuestions() error {
	data, err := os.ReadFile(s.questionsFile)
	if err != nil {
		return err
	}

	var questions []Question
	if err := json.Unmarshal(data, &questions); err != nil {
		return err
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	s.questions = questions
	s.questionsByID = make(map[int]Question, len(questions))
	for _, q := range questions {
		s.questionsByID[q.ID] = q
	}

	return nil
}

func (s *Store) loadLeaderboard() error {
	data, err := os.ReadFile(s.leaderboardFile)
	if err != nil {
		if os.IsNotExist(err) {
			s.mu.Lock()
			s.leaderboard = []ScoreEntry{}
			s.mu.Unlock()
			return nil
		}
		return err
	}

	var scores []ScoreEntry
	if err := json.Unmarshal(data, &scores); err != nil {
		s.mu.Lock()
		s.leaderboard = []ScoreEntry{}
		s.mu.Unlock()
		return err
	}

	s.mu.Lock()
	s.leaderboard = scores
	s.mu.Unlock()
	return nil
}

func (s *Store) GetPublicQuestions(category string) []PublicQuestion {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var result []PublicQuestion
	for _, q := range s.questions {
		if category == "" || strings.EqualFold(category, "All") || strings.EqualFold(q.Category, category) {
			result = append(result, PublicQuestion{
				ID:       q.ID,
				Category: q.Category,
				Question: q.Question,
				Options:  q.Options,
				Hint:     q.Hint,
			})
		}
	}
	return result
}

func (s *Store) GetLeaderboard() []ScoreEntry {
	s.mu.RLock()
	defer s.mu.RUnlock()

	// Return a copy to avoid external mutation
	result := make([]ScoreEntry, len(s.leaderboard))
	copy(result, s.leaderboard)
	return result
}

func (s *Store) SubmitAnswers(req SubmitRequest) (SubmitResponse, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	// Sanitize player name (max 50 chars)
	name := strings.TrimSpace(req.PlayerName)
	if name == "" {
		name = "Anonymous Student"
	}
	if len([]rune(name)) > 50 {
		name = string([]rune(name)[:50])
	}

	var results []QuestionResult
	score := 0

	// Preferred modern format: Structured Responses [{ questionId, answer }]
	if len(req.Responses) > 0 {
		for _, resp := range req.Responses {
			q, exists := s.questionsByID[resp.QuestionID]
			if !exists {
				continue
			}

			userAns := strings.TrimSpace(resp.Answer)
			isCorrect := strings.EqualFold(userAns, strings.TrimSpace(q.Answer))
			if isCorrect {
				score++
			}

			results = append(results, QuestionResult{
				QuestionID:  q.ID,
				Question:    q.Question,
				UserAnswer:  userAns,
				Correct:     q.Answer,
				IsCorrect:   isCorrect,
				Explanation: q.Explanation,
			})
		}
	} else if len(req.Answers) > 0 {
		// Legacy fallback: match sequentially by category
		var targetQuestions []Question
		for _, q := range s.questions {
			if req.Category == "" || strings.EqualFold(req.Category, "All") || strings.EqualFold(q.Category, req.Category) {
				targetQuestions = append(targetQuestions, q)
			}
		}

		limit := len(req.Answers)
		if limit > len(targetQuestions) {
			limit = len(targetQuestions)
		}

		for i := 0; i < limit; i++ {
			q := targetQuestions[i]
			userAns := strings.TrimSpace(req.Answers[i])
			isCorrect := strings.EqualFold(userAns, strings.TrimSpace(q.Answer))
			if isCorrect {
				score++
			}

			results = append(results, QuestionResult{
				QuestionID:  q.ID,
				Question:    q.Question,
				UserAnswer:  userAns,
				Correct:     q.Answer,
				IsCorrect:   isCorrect,
				Explanation: q.Explanation,
			})
		}
	}

	total := len(results)
	percentage := 0.0
	if total > 0 {
		percentage = (float64(score) / float64(total)) * 100
	}

	prize := "🌟 Participation Ribbon"
	if percentage == 100 {
		prize = "🏆 GOLD CHAMPION TROPHY!"
	} else if percentage >= 80 {
		prize = "🥈 SILVER MEDALIST!"
	} else if percentage >= 60 {
		prize = "🥉 BRONZE STAR!"
	}

	// Update Leaderboard if there were graded questions
	if total > 0 {
		newEntry := ScoreEntry{
			Name:  name,
			Score: score,
			Total: total,
			Date:  time.Now().Format("2006-01-02 15:04"),
		}

		s.leaderboard = append(s.leaderboard, newEntry)
		sort.Slice(s.leaderboard, func(i, j int) bool {
			if s.leaderboard[i].Score == s.leaderboard[j].Score {
				return s.leaderboard[i].Total < s.leaderboard[j].Total
			}
			return s.leaderboard[i].Score > s.leaderboard[j].Score
		})

		if len(s.leaderboard) > s.maxLeaderboard {
			s.leaderboard = s.leaderboard[:s.maxLeaderboard]
		}

		// Persist leaderboard
		if updatedJSON, err := json.MarshalIndent(s.leaderboard, "", "  "); err == nil {
			_ = os.WriteFile(s.leaderboardFile, updatedJSON, 0644)
		}
	}

	lbCopy := make([]ScoreEntry, len(s.leaderboard))
	copy(lbCopy, s.leaderboard)

	return SubmitResponse{
		Score:       score,
		Total:       total,
		Percentage:  percentage,
		Prize:       prize,
		Results:     results,
		Leaderboard: lbCopy,
	}, nil
}

// --- HTTP Handlers & Middlewares ---

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

// Safe Static File Handler: prevents directory traversal and restricts sensitive files
func safeFileServer(publicDir string) http.Handler {
	fileServer := http.FileServer(http.Dir(publicDir))

	forbiddenExtensions := map[string]bool{
		".go":   true,
		".json": true,
		".mod":  true,
		".sum":  true,
		".md":   true,
		".yml":  true,
		".yaml": true,
		".sh":   true,
		".git":  true,
	}

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		cleanedPath := filepath.Clean(r.URL.Path)

		// Deny dotfile and hidden directory access (e.g., /.git, /.env)
		parts := strings.Split(cleanedPath, "/")
		for _, part := range parts {
			if strings.HasPrefix(part, ".") && part != "." && part != ".." {
				http.NotFound(w, r)
				return
			}
		}

		// Deny access to sensitive extensions
		ext := strings.ToLower(filepath.Ext(cleanedPath))
		if forbiddenExtensions[ext] {
			http.NotFound(w, r)
			return
		}

		fileServer.ServeHTTP(w, r)
	})
}

func questionsHandler(store *Store) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			w.Header().Set("Allow", "GET, OPTIONS")
			http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
			return
		}

		category := r.URL.Query().Get("category")
		questions := store.GetPublicQuestions(category)

		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		_ = json.NewEncoder(w).Encode(questions)
	}
}

func submitHandler(store *Store) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			w.Header().Set("Allow", "POST, OPTIONS")
			http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
			return
		}

		// Enforce max payload size 1MB to prevent memory exhaustion attacks
		r.Body = http.MaxBytesReader(w, r.Body, 1048576)

		var req SubmitRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid JSON payload", http.StatusBadRequest)
			return
		}

		resp, err := store.SubmitAnswers(req)
		if err != nil {
			http.Error(w, "Failed to evaluate answers", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		_ = json.NewEncoder(w).Encode(resp)
	}
}

func highscoresHandler(store *Store) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			w.Header().Set("Allow", "GET, OPTIONS")
			http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
			return
		}

		leaderboard := store.GetLeaderboard()

		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		_ = json.NewEncoder(w).Encode(leaderboard)
	}
}

func NewRouter(store *Store, publicDir string) http.Handler {
	mux := http.NewServeMux()

	// API Endpoints
	mux.HandleFunc("/api/questions", questionsHandler(store))
	mux.HandleFunc("/api/submit", submitHandler(store))
	mux.HandleFunc("/api/highscores", highscoresHandler(store))

	// Static Web Assets
	mux.Handle("/", safeFileServer(publicDir))

	return corsMiddleware(mux)
}

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	if !strings.HasPrefix(port, ":") {
		port = ":" + port
	}

	questionsPath := os.Getenv("QUESTIONS_FILE")
	if questionsPath == "" {
		questionsPath = "questions.json"
	}

	highscoresPath := os.Getenv("HIGHSCORES_FILE")
	if highscoresPath == "" {
		highscoresPath = "highscores.json"
	}

	publicDir := os.Getenv("PUBLIC_DIR")
	if publicDir == "" {
		publicDir = "public"
	}

	store, err := NewStore(questionsPath, highscoresPath)
	if err != nil {
		log.Fatalf("Fatal: Store initialization failed: %v", err)
	}

	router := NewRouter(store, publicDir)

	server := &http.Server{
		Addr:         port,
		Handler:      router,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Server shutdown channel
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)

	go func() {
		fmt.Printf("🚀 Quizphoria Learning Hub listening on http://localhost%s\n", port)
		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("Server error: %v", err)
		}
	}()

	<-stop
	fmt.Println("\nGracefully shutting down Quizphoria server...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		log.Printf("Server forced shutdown error: %v", err)
	}
	fmt.Println("Server gracefully stopped.")
}
