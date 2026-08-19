/* --- ALPHABET DICTIONARY FOR KIDS --- */
const alphabetData = {
  A: { word: "Algorithm", desc: "A set of step-by-step instructions for a computer to follow!" },
  B: { word: "Bug", desc: "A tiny mistake in computer code that needs to be fixed." },
  C: { word: "Computer", desc: "An electronic machine that helps us learn, play, and calculate!" },
  D: { word: "Data", desc: "Information like pictures, numbers, and words saved on a computer." },
  E: { word: "Emoji", desc: "Fun little picture icons used to express feelings! 😊" },
  F: { word: "Function", desc: "A mini magic recipe inside code that performs a specific job." },
  G: { word: "Game", desc: "Fun interactive software built with code!" },
  H: { word: "HTML", desc: "The building blocks used to create web pages on the internet." },
  I: { word: "Internet", desc: "A giant global network connecting computers around the world." },
  J: { word: "JavaScript", desc: "The programming language that makes websites interactive and fun!" },
  K: { word: "Keyboard", desc: "The tool with keys used to type words and code into computers." },
  L: { word: "Laptop", desc: "A portable computer you can carry anywhere!" },
  M: { word: "Mouse", desc: "A device used to click and point at things on your screen." },
  N: { word: "Network", desc: "When two or more computers connect to share information." },
  O: { word: "Output", desc: "The result shown on the screen after a computer processes instructions." },
  P: { word: "Program", desc: "A set of coded instructions that tells a computer what to do." },
  Q: { word: "Quiz", desc: "A fun way to test what you have learned!" },
  R: { word: "Robot", desc: "A machine programmed to carry out tasks automatically." },
  S: { word: "Software", desc: "The programs and apps running inside a computer." },
  T: { word: "Terminal", desc: "A text screen where coders type direct commands to the computer." },
  U: { word: "User", desc: "YOU! The person interacting with a computer program." },
  V: { word: "Variable", desc: "A labeled container inside code that stores information." },
  W: { word: "Website", desc: "A collection of pages connected together on the internet." },
  X: { word: "XML", desc: "A structured way computers use to format and store data." },
  Y: { word: "YouTube", desc: "A platform where millions of learning videos are hosted!" },
  Z: { word: "Zip", desc: "Compressing big files into smaller sizes so they transfer faster." }
};

// Generate Alphabet Buttons Dynamically
const alphabetGrid = document.getElementById("alphabet-grid");
const cardLetter = document.getElementById("card-letter");
const cardWord = document.getElementById("card-word");
const cardDesc = document.getElementById("card-desc");

for (let i = 65; i <= 90; i++) {
  const char = String.fromCharCode(i);
  const btn = document.createElement("button");
  btn.classList.add("letter-btn");
  btn.textContent = char;
  btn.onclick = () => selectLetter(char);
  alphabetGrid.appendChild(btn);
}

function selectLetter(char) {
  const item = alphabetData[char];
  if (item) {
    cardLetter.textContent = char;
    cardWord.textContent = item.word;
    cardDesc.textContent = item.desc;
  }
}

// Smooth Scroll Function for Buttons
function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' });
  }
}

/* --- INTERACTIVE QUIZ LOGIC --- */
let allQuestions = [];
let questions = [];
let currentQIndex = 0;
let score = 0;
let userAnswers = [];

const qNumEl = document.getElementById("q-num");
const scoreNumEl = document.getElementById("score-num");
const qTextEl = document.getElementById("q-text");
const optionsGridEl = document.getElementById("options-grid");
const nextBtn = document.getElementById("next-btn");
const quizPlayable = document.getElementById("quiz-playable") || document.getElementById("quiz-active");
const quizFinished = document.getElementById("quiz-finished") || document.getElementById("quiz-end");
const finalScoreText = document.getElementById("final-score-text") || document.getElementById("final-score");
const categorySelect = document.getElementById("category-select");

async function loadQuestionsFile() {
  try {
    const res = await fetch('questions.json');
    const data = await res.json();
    allQuestions = data;
  } catch (e) {
    allQuestions = [];
    console.error('Failed to load questions.json', e);
  }
}

function populateCategorySelect() {
  if (!categorySelect) return;
  const cats = new Set(allQuestions.map(q => q.category || 'Uncategorized'));
  categorySelect.innerHTML = '<option>All</option>' + [...cats].map(c => `<option>${c}</option>`).join('');
  categorySelect.addEventListener('change', () => {
    setQuestionsForCategory(categorySelect.value);
    resetQuiz();
  });
}

function setQuestionsForCategory(category) {
  if (!category || category === 'All') {
    questions = allQuestions.slice();
  } else {
    questions = allQuestions.filter(q => (q.category || '') === category);
  }
  // Keep questions manageable in demo (limit to 12)
  if (questions.length > 12) questions = questions.slice(0, 12);
}

function loadQuizQuestion() {
  if (questions.length === 0) {
    qNumEl.textContent = 'No questions available';
    qTextEl.textContent = 'Please add questions to questions.json or select a different subject.';
    optionsGridEl.innerHTML = '';
    return;
  }

  const q = questions[currentQIndex];
  // ensure userAnswers length matches
  if (userAnswers.length < questions.length) {
    userAnswers = Array(questions.length).fill("");
  }
  qNumEl.textContent = `Question ${currentQIndex + 1} of ${questions.length}`;
  scoreNumEl.textContent = `Score: ${score} ⭐`;
  qTextEl.textContent = q.question || q.Question || 'Question text missing';
  
  optionsGridEl.innerHTML = "";
  nextBtn.style.display = "none";

  // Accept options as an array, or build simple multiple choice from answer
  let opts = q.options;
  if (!opts || !Array.isArray(opts)) {
    // Build basic options: correct answer + 3 dummy answers (if available)
    const correct = q.answer || q.Answer || '';
    opts = [correct];
    while (opts.length < 4) opts.push('Option ' + (opts.length + 1));
  }

  opts.forEach((opt, idx) => {
    const btn = document.createElement("button");
    btn.classList.add("opt-btn");
    btn.textContent = opt;
    btn.onclick = () => evaluateOption(idx, opts.indexOf(q.answer || q.Answer || opts[0]), opt);
    optionsGridEl.appendChild(btn);
  });
}

function evaluateOption(selected, correct) {
  const btns = optionsGridEl.querySelectorAll(".opt-btn");
  btns.forEach((btn, idx) => {
    btn.disabled = true;
    if (idx === correct) {
      btn.classList.add("correct");
    } else if (idx === selected) {
      btn.classList.add("incorrect");
    }
  });

  // record the selected answer text
  const chosenBtn = optionsGridEl.querySelectorAll('.opt-btn')[selected];
  const chosenText = chosenBtn ? chosenBtn.textContent : '';
  userAnswers[currentQIndex] = chosenText;

  if (selected === correct) {
    score++;
    scoreNumEl.textContent = `Score: ${score} ⭐`;
  }

  if (currentQIndex < questions.length - 1) {
    nextBtn.style.display = "inline-block";
  } else {
    setTimeout(showQuizResults, 800);
  }
}

nextBtn.addEventListener("click", () => {
  currentQIndex++;
  loadQuizQuestion();
});

function showQuizResults() {
  if (quizPlayable) quizPlayable.style.display = "none";
  if (quizFinished) quizFinished.style.display = "block";
  if (finalScoreText) finalScoreText.textContent = `You earned ${score} out of ${questions.length} Stars! ⭐`;
  // submit results to backend and populate leaderboard
  submitResults();
}

function resetQuiz() {
  currentQIndex = 0;
  score = 0;
  userAnswers = [];
  if (quizFinished) quizFinished.style.display = "none";
  if (quizPlayable) quizPlayable.style.display = "block";
  loadQuizQuestion();
}

async function initQuiz() {
  await loadQuestionsFile();
  populateCategorySelect();
  setQuestionsForCategory('All');
  resetQuiz();
}

async function submitResults() {
  const playerName = (document.getElementById('player-name') || {}).value || '';
  const category = (categorySelect && categorySelect.value) ? categorySelect.value : 'All';

  const payload = {
    playerName: playerName,
    answers: userAnswers,
    category: category
  };

  // try backend first; fallback to local processing if request fails
  try {
    const res = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      const data = await res.json();
      renderLeaderboard(data.Leaderboard || data.leaderboard || []);
      // show prize if provided
      if (data.Prize || data.prize) {
        const prize = data.Prize || data.prize;
        const finalEl = document.getElementById('final-score');
        if (finalEl) finalEl.textContent += ` — ${prize}`;
      }
      return;
    }
  } catch (e) {
    console.warn('Backend submit failed, falling back to local save', e);
  }

  // Fallback: build a simple leaderboard from highscores.json if available
  try {
    const res2 = await fetch('/api/highscores');
    if (res2.ok) {
      const lb = await res2.json();
      renderLeaderboard(lb);
      return;
    }
  } catch (e) {
    console.warn('Failed to fetch highscores', e);
  }
}

function renderLeaderboard(list) {
  const container = document.getElementById('leaderboard');
  if (!container) return;
  container.innerHTML = '<h3 style="text-align:center;">Top Scores</h3>' +
    '<ol style="padding-left:1.2rem;">' +
    list.map(s => `<li style="margin:0.6rem 0;"><strong>${escapeHtml(s.name || s.Name || 'Anonymous')}</strong> — ${s.score || s.Score}/${s.total || s.Total} <span style="color:var(--text-muted); font-size:0.9rem;">${s.date || s.Date || ''}</span></li>`).join('') +
    '</ol>';
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"]/g, function (m) { return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[m]; });
}

// Initial Call
initQuiz();
selectLetter('A');
