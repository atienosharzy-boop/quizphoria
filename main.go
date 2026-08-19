package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"sort"
	"strings"
	"sync"
	"time"
)

type Question struct {
	ID          int    `json:"id"`
	Category    string `json:"category"`
	Question    string `json:"question"`
	Answer      string `json:"answer"`
	Hint        string `json:"hint"`
	Explanation string `json:"explanation"`
}

type ScoreEntry struct {
	Name  string `json:"name"`
	Score int    `json:"score"`
	Total int    `json:"total"`
	Date  string `json:"date"`
}

type SubmitRequest struct {
	PlayerName string   `json:"playerName"`
	Answers    []string `json:"answers"`
	Category   string   `json:"category"`
}

type QuestionResult struct {
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

const (
	questionsFile   = "questions.json"
	leaderboardFile = "highscores.json"
)

const maxLeaderboard = 5

var leaderboardMu sync.Mutex

func loadQuestions() ([]Question, error) {
	fileData, err := os.ReadFile(questionsFile)
	if err != nil {
		return nil, err
	}
	var questions []Question
	err = json.Unmarshal(fileData, &questions)
	return questions, err
}

func loadLeaderboard() ([]ScoreEntry, error) {
	fileData, err := os.ReadFile(leaderboardFile)
	if err != nil {
		if os.IsNotExist(err) {
			return []ScoreEntry{}, nil
		}
		return nil, err
	}
	var scores []ScoreEntry
	if err := json.Unmarshal(fileData, &scores); err != nil {
		return []ScoreEntry{}, nil
	}
	return scores, nil
}

func saveScore(name string, score int, total int) ([]ScoreEntry, error) {
	leaderboardMu.Lock()
	defer leaderboardMu.Unlock()

	scores, err := loadLeaderboard()
	if err != nil {
		scores = []ScoreEntry{}
	}

	if strings.TrimSpace(name) == "" {
		name = "Anonymous Student"
	}

	newEntry := ScoreEntry{
		Name:  name,
		Score: score,
		Total: total,
		Date:  time.Now().Format("2006-01-02 15:04"),
	}

	scores = append(scores, newEntry)

	sort.Slice(scores, func(i, j int) bool {
		return scores[i].Score > scores[j].Score
	})

	if len(scores) > maxLeaderboard {
		scores = scores[:maxLeaderboard]
	}

	updatedJSON, err := json.MarshalIndent(scores, "", "  ")
	if err == nil {
		_ = os.WriteFile(leaderboardFile, updatedJSON, 0644)
	}

	return scores, err
}

func highscoresHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	if r.Method == http.MethodOptions {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		w.WriteHeader(http.StatusOK)
		return
	}

	w.Header().Set("Access-Control-Allow-Origin", "*")

	scores, err := loadLeaderboard()
	if err != nil {
		http.Error(w, "Failed to load highscores", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(scores)
}

func questionsHandler(w http.ResponseWriter, r *http.Request) {
	questions, err := loadQuestions()
	if err != nil {
		http.Error(w, "Failed to load questions", http.StatusInternalServerError)
		return
	}

	category := r.URL.Query().Get("category")
	if category != "" && category != "All" {
		var filtered []Question
		for _, q := range questions {
			if strings.EqualFold(q.Category, category) {
				filtered = append(filtered, q)
			}
		}
		questions = filtered
	}

	json.NewEncoder(w).Encode(questions)
}

func submitHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	var req SubmitRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON body", http.StatusBadRequest)
		return
	}

	allQuestions, _ := loadQuestions()
	var questions []Question

	if req.Category != "" && req.Category != "All" {
		for _, q := range allQuestions {
			if strings.EqualFold(q.Category, req.Category) {
				questions = append(questions, q)
			}
		}
	} else {
		questions = allQuestions
	}

	score := 0
	var results []QuestionResult

	for i, q := range questions {
		userAns := ""
		if i < len(req.Answers) {
			userAns = strings.TrimSpace(req.Answers[i])
		}

		isCorrect := strings.EqualFold(userAns, strings.TrimSpace(q.Answer))
		if isCorrect {
			score++
		}

		results = append(results, QuestionResult{
			Question:    q.Question,
			UserAnswer:  userAns,
			Correct:     q.Answer,
			IsCorrect:   isCorrect,
			Explanation: q.Explanation,
		})
	}

	total := len(questions)
	percentage := 0.0
	if total > 0 {
		percentage = (float64(score) / float64(total)) * 100
	}

	prize := "💩 Participation Sticker"
	if percentage == 100 {
		prize = "🏆 GOLD TROPHY & $100 GIFT CARD!"
	} else if percentage >= 66 {
		prize = "🥈 SILVER MEDAL & FREE COFFEE!"
	} else if percentage >= 33 {
		prize = "🥉 BRONZE MEDAL!"
	}

	leaderboard, _ := saveScore(req.PlayerName, score, total)

	json.NewEncoder(w).Encode(SubmitResponse{
		Score:       score,
		Total:       total,
		Percentage:  percentage,
		Prize:       prize,
		Results:     results,
		Leaderboard: leaderboard,
	})
}

func main() {
	// Serve static files
	http.Handle("/", http.FileServer(http.Dir(".")))

	// API routes with basic CORS handling
	cors := func(next http.HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusOK)
				return
			}
			next(w, r)
		}
	}

	http.HandleFunc("/api/questions", cors(questionsHandler))
	http.HandleFunc("/api/submit", cors(submitHandler))
	http.HandleFunc("/api/highscores", cors(highscoresHandler))

	port := ":8080"
	fmt.Printf("🚀 Quizphoria Learning Hub running at http://localhost%s\n", port)
	log.Fatal(http.ListenAndServe(port, nil))
}
