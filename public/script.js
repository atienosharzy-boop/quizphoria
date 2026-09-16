/* ==========================================================================
   Quizphoria Client Engine
   - Resilient DOM handling
   - Safe API integration (server-side grading)
   - Dynamic option shuffling
   - Detailed post-quiz feedback & achievement export
   ========================================================================== */

/* --- Optional Alphabet Explorer Guard --- */
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

const alphabetGrid = document.getElementById("alphabet-grid");
const cardLetter = document.getElementById("card-letter");
const cardWord = document.getElementById("card-word");
const cardDesc = document.getElementById("card-desc");

if (alphabetGrid) {
  for (let i = 65; i <= 90; i++) {
    const char = String.fromCharCode(i);
    const btn = document.createElement("button");
    btn.classList.add("letter-btn");
    btn.textContent = char;
    btn.onclick = () => selectLetter(char);
    alphabetGrid.appendChild(btn);
  }
  selectLetter('A');
}

function selectLetter(char) {
  const item = alphabetData[char];
  if (item && cardLetter && cardWord && cardDesc) {
    cardLetter.textContent = char;
    cardWord.textContent = item.word;
    cardDesc.textContent = item.desc;
  }
}

/* --- Core Interactive Quiz Engine --- */
let allQuestions = [];
let questions = [];
let currentQIndex = 0;
let userResponses = []; // Array of { questionId, answer }

// DOM Element References with safe lookups
const qNumEl = document.getElementById("q-num");
const scoreNumEl = document.getElementById("score-num");
const qTextEl = document.getElementById("q-text");
const optionsGridEl = document.getElementById("options-grid");
const nextBtn = document.getElementById("next-btn");
const quizActive = document.getElementById("quiz-active");
const quizEnd = document.getElementById("quiz-end");
const finalScoreEl = document.getElementById("final-score");
const categorySelect = document.getElementById("category-select");
const progressFill = document.getElementById("progress-fill");
const progressBar = document.querySelector(".progress-bar");

// Helper: Fisher-Yates array shuffling
function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Fetch questions securely from server API (answers are stripped on backend)
async function loadQuestions(category = "All") {
  try {
    const url = category && category !== "All"
      ? `/api/questions?category=${encodeURIComponent(category)}`
      : '/api/questions';
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (e) {
    console.warn("API questions fetch failed, falling back to local file if available:", e);
    try {
      const fallback = await fetch('questions.json');
      return await fallback.json();
    } catch {
      return [];
    }
  }
}

async function populateCategorySelect() {
  if (!categorySelect) return;
  
  // Load full catalog once to find available subjects
  const fullCatalog = await loadQuestions("All");
  allQuestions = fullCatalog;
  
  const categories = Array.from(new Set(fullCatalog.map(q => q.category).filter(Boolean))).sort();
  
  categorySelect.innerHTML = '<option value="All">All Subjects</option>' +
    categories.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');

  categorySelect.addEventListener('change', async () => {
    await startQuizForCategory(categorySelect.value);
  });
}

async function startQuizForCategory(category) {
  const loaded = await loadQuestions(category);
  questions = shuffleArray(loaded);
  // Cap at 10 questions per run for smooth interactive flow
  if (questions.length > 10) {
    questions = questions.slice(0, 10);
  }
  resetQuiz();
}

function updateProgressBar() {
  if (!progressFill || questions.length === 0) return;
  const pct = Math.round((currentQIndex / questions.length) * 100);
  progressFill.style.width = pct + '%';
  if (progressBar) {
    progressBar.setAttribute('aria-valuenow', pct);
  }
}

function loadQuizQuestion() {
  if (!optionsGridEl || !qTextEl || !qNumEl) return;

  if (questions.length === 0) {
    qNumEl.textContent = "No questions available";
    qTextEl.textContent = "Please select a different category or verify questions data.";
    optionsGridEl.innerHTML = "";
    if (nextBtn) nextBtn.style.display = "none";
    return;
  }

  const q = questions[currentQIndex];
  qNumEl.textContent = `Question ${currentQIndex + 1} of ${questions.length}`;
  if (scoreNumEl) {
    scoreNumEl.textContent = `Category: ${q.category || 'General'}`;
  }
  qTextEl.textContent = q.question || "Untitled Question";

  // Optional hint box
  let hintBox = document.getElementById("quiz-hint");
  if (!hintBox) {
    hintBox = document.createElement("div");
    hintBox.id = "quiz-hint";
    hintBox.className = "hint-box";
    qTextEl.insertAdjacentElement("afterend", hintBox);
  }
  if (q.hint) {
    hintBox.style.display = "block";
    hintBox.innerHTML = `💡 <strong>Hint:</strong> ${escapeHtml(q.hint)}`;
  } else {
    hintBox.style.display = "none";
  }

  optionsGridEl.innerHTML = "";
  if (nextBtn) {
    nextBtn.style.display = "none";
    nextBtn.textContent = (currentQIndex === questions.length - 1) ? "Finish & Grade Quiz ➔" : "Next Question ➔";
  }

  updateProgressBar();

  // Retrieve or create realistic shuffled options
  let opts = Array.isArray(q.options) && q.options.length > 0
    ? shuffleArray(q.options)
    : [q.answer || "Option A", "Option B", "Option C", "Option D"];

  opts.forEach(opt => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "opt-btn";
    btn.textContent = opt;

    btn.onclick = () => {
      // Highlight selected option
      optionsGridEl.querySelectorAll(".opt-btn").forEach(b => {
        b.classList.remove("selected");
        b.disabled = true;
      });
      btn.classList.add("selected");

      // Record answer
      userResponses[currentQIndex] = {
        questionId: q.id || (currentQIndex + 1),
        answer: opt
      };

      if (nextBtn) nextBtn.style.display = "inline-block";
    };

    optionsGridEl.appendChild(btn);
  });
}

if (nextBtn) {
  nextBtn.addEventListener("click", () => {
    if (currentQIndex < questions.length - 1) {
      currentQIndex++;
      loadQuizQuestion();
    } else {
      finishAndSubmitQuiz();
    }
  });
}

function resetQuiz() {
  currentQIndex = 0;
  userResponses = [];
  if (quizEnd) quizEnd.style.display = "none";
  if (quizActive) quizActive.style.display = "block";
  loadQuizQuestion();
}

async function finishAndSubmitQuiz() {
  if (quizActive) quizActive.style.display = "none";
  if (quizEnd) quizEnd.style.display = "block";
  if (progressFill) progressFill.style.width = "100%";
  if (progressBar) progressBar.setAttribute('aria-valuenow', 100);

  if (finalScoreEl) {
    finalScoreEl.textContent = "Grading your responses with the server...";
  }

  const nameInput = document.getElementById("player-name");
  const playerName = (nameInput && nameInput.value.trim()) ? nameInput.value.trim() : "Anonymous Student";
  const category = (categorySelect && categorySelect.value) ? categorySelect.value : "All";

  const payload = {
    playerName: playerName,
    category: category,
    responses: userResponses,
    answers: userResponses.map(r => r.answer) // Backwards compatible array
  };

  try {
    const res = await fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error(`Submission failed (${res.status})`);
    const data = await res.json();
    renderQuizResults(data, playerName);
  } catch (err) {
    console.error("Grading error:", err);
    if (finalScoreEl) {
      finalScoreEl.textContent = "Quiz finished! (Server grading unavailable)";
    }
    // Fallback highscores fetch
    fetchHighscores();
  }
}

function renderQuizResults(data, playerName) {
  const score = data.score ?? 0;
  const total = data.total ?? questions.length;
  const percentage = data.percentage ?? (total > 0 ? Math.round((score / total) * 100) : 0);
  const prize = data.prize || "Participation Ribbon 🌟";

  if (finalScoreEl) {
    finalScoreEl.innerHTML = `You earned <strong>${score}</strong> out of <strong>${total}</strong> points (${percentage.toFixed(1)}%)!<br><span style="font-size:1.15rem; color:var(--primary-purple);">${escapeHtml(prize)}</span>`;
  }

  // Render review of each question and explanation
  const reviewContainer = document.getElementById("results-review");
  if (reviewContainer && Array.isArray(data.results)) {
    reviewContainer.innerHTML = '<h3>📝 Question Breakdown & Explanations</h3>' +
      data.results.map((r, i) => `
        <div class="review-item ${r.isCorrect ? 'pass' : 'fail'}">
          <h4>${i + 1}. ${escapeHtml(r.question)}</h4>
          <p><strong>Your Answer:</strong> ${escapeHtml(r.userAnswer || 'No answer')}</p>
          ${!r.isCorrect ? `<p style="color:var(--primary-green);"><strong>Correct Answer:</strong> ${escapeHtml(r.correct)}</p>` : ''}
          ${r.explanation ? `<p><strong>Explanation:</strong> ${escapeHtml(r.explanation)}</p>` : ''}
        </div>
      `).join('');
  }

  // Render updated leaderboard
  if (Array.isArray(data.leaderboard)) {
    renderLeaderboard(data.leaderboard);
  } else {
    fetchHighscores();
  }

  // Confetti celebration
  startConfetti(3000);
}

async function fetchHighscores() {
  try {
    const res = await fetch("/api/highscores");
    if (res.ok) {
      const list = await res.json();
      renderLeaderboard(list);
    }
  } catch (e) {
    console.warn("Could not load highscores", e);
  }
}

function renderLeaderboard(list) {
  const container = document.getElementById("leaderboard");
  if (!container) return;
  if (!Array.isArray(list) || list.length === 0) {
    container.innerHTML = '<h3 style="text-align:center; margin-bottom:0.6rem;">🏆 Hall of Fame</h3><p style="text-align:center; color:var(--text-muted);">No high scores recorded yet. Be the first!</p>';
    return;
  }
  container.innerHTML = '<h3 style="text-align:center; margin-bottom:0.8rem;">🏆 Hall of Fame</h3>' +
    '<ol style="padding-left:1.4rem;">' +
    list.map(s => `
      <li style="margin:0.5rem 0;">
        <strong>${escapeHtml(s.name || 'Anonymous')}</strong> — ${s.score}/${s.total}
        <span style="color:var(--text-muted); font-size:0.85rem; margin-left:0.5rem;">${escapeHtml(s.date || '')}</span>
      </li>
    `).join('') +
    '</ol>';
}

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[m]);
}

// Confetti animation
function startConfetti(duration = 2500) {
  const canvas = document.getElementById("confetti-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const dpi = window.devicePixelRatio || 1;
  
  function resize() {
    canvas.width = window.innerWidth * dpi;
    canvas.height = window.innerHeight * dpi;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    ctx.scale(dpi, dpi);
  }
  resize();

  const colors = ["#ff6b6b", "#f59e0b", "#06b6d4", "#8b5cf6", "#10b981"];
  const pieces = [];
  for (let i = 0; i < 100; i++) {
    pieces.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * -window.innerHeight,
      vx: (Math.random() - 0.5) * 5,
      vy: Math.random() * 5 + 2,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rot: Math.random() * 360
    });
  }

  const start = performance.now();
  function frame(now) {
    const t = now - start;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of pieces) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.07;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rot + t / 50) * Math.PI / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    }
    if (t < duration) {
      requestAnimationFrame(frame);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }
  requestAnimationFrame(frame);
}

// Share score listener
document.addEventListener("click", (e) => {
  if (e.target && e.target.id === "share-score") {
    const scoreText = finalScoreEl ? finalScoreEl.innerText : "Completed Quizphoria Quiz!";
    const shareData = {
      title: "Quizphoria Achievement",
      text: `🎯 Quizphoria: ${scoreText}`
    };
    if (navigator.share) {
      navigator.share(shareData).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(shareData.text).then(() => {
        alert("Result copied to clipboard!");
      });
    } else {
      alert(shareData.text);
    }
  }
});

// Initialize on DOM load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    populateCategorySelect().then(() => startQuizForCategory("All"));
  });
} else {
  populateCategorySelect().then(() => startQuizForCategory("All"));
}
