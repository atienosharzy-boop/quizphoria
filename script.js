const sampleQuestions = [
  {
    question: "What is the primary keyword used to declare a package in Go?",
    options: ["module", "package", "import", "main"],
    answer: 1
  },
  {
    question: "Which HTML5 element is used to include executable JavaScript code?",
    options: ["<script>", "<js>", "<code">, "<javascript>"],
    answer: 0
  },
  {
    question: "What Git command is used to record changes to the repository?",
    options: ["git push", "git save", "git commit", "git stage"],
    answer: 2
  }
];

let currentQuestionIndex = 0;
let score = 0;

const questionNumberEl = document.getElementById("question-number");
const scoreDisplayEl = document.getElementById("score-display");
const questionTextEl = document.getElementById("question-text");
const optionsContainerEl = document.getElementById("options-container");
const nextBtn = document.getElementById("next-btn");
const quizBox = document.getElementById("quiz-box");
const resultBox = document.getElementById("result-box");
const finalScoreEl = document.getElementById("final-score");

function loadQuestion() {
  const currentQ = sampleQuestions[currentQuestionIndex];
  questionNumberEl.textContent = `Question ${currentQuestionIndex + 1} of ${sampleQuestions.length}`;
  scoreDisplayEl.textContent = `Score: ${score}`;
  questionTextEl.textContent = currentQ.question;
  
  optionsContainerEl.innerHTML = "";
  nextBtn.style.display = "none";

  currentQ.options.forEach((opt, idx) => {
    const btn = document.createElement("button");
    btn.classList.add("option-btn");
    btn.textContent = opt;
    btn.onclick = () => selectOption(idx, currentQ.answer);
    optionsContainerEl.appendChild(btn);
  });
}

function selectOption(selectedIndex, correctIndex) {
  const buttons = optionsContainerEl.querySelectorAll(".option-btn");
  buttons.forEach((btn, idx) => {
    btn.disabled = true;
    if (idx === correctIndex) {
      btn.classList.add("correct");
    } else if (idx === selectedIndex) {
      btn.classList.add("incorrect");
    }
  });

  if (selectedIndex === correctIndex) {
    score++;
    scoreDisplayEl.textContent = `Score: ${score}`;
  }

  if (currentQuestionIndex < sampleQuestions.length - 1) {
    nextBtn.style.display = "inline-block";
  } else {
    setTimeout(showResults, 1200);
  }
}

nextBtn.addEventListener("click", () => {
  currentQuestionIndex++;
  loadQuestion();
});

function showResults() {
  quizBox.style.display = "none";
  resultBox.style.display = "block";
  finalScoreEl.textContent = `You scored ${score} out of ${sampleQuestions.length}!`;
}

function restartQuiz() {
  currentQuestionIndex = 0;
  score = 0;
  resultBox.style.display = "none";
  quizBox.style.display = "block";
  loadQuestion();
}

// Initialize on page load
loadQuestion();
