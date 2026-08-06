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
const questions = [
  {
    question: "Which device do you use to type words on a computer?",
    options: ["🖥️ Screen", "⌨️ Keyboard", "🎧 Headphones", "🖱️ Mouse Pad"],
    answer: 1
  },
  {
    question: "What is a 'Bug' in coding?",
    options: ["An actual insect", "A mistake in code", "A computer game", "A shiny screen"],
    answer: 1
  },
  {
    question: "What language helps make websites interactive and exciting?",
    options: ["CSS", "JavaScript", "HTML", "Python"],
    answer: 1
  }
];

let currentQIndex = 0;
let score = 0;

const qNumEl = document.getElementById("q-num");
const scoreNumEl = document.getElementById("score-num");
const qTextEl = document.getElementById("q-text");
const optionsGridEl = document.getElementById("options-grid");
const nextBtn = document.getElementById("next-btn");
const quizPlayable = document.getElementById("quiz-playable");
const quizFinished = document.getElementById("quiz-finished");
const finalScoreText = document.getElementById("final-score-text");

function loadQuizQuestion() {
  const q = questions[currentQIndex];
  qNumEl.textContent = `Question ${currentQIndex + 1} of ${questions.length}`;
  scoreNumEl.textContent = `Score: ${score} ⭐`;
  qTextEl.textContent = q.question;
  
  optionsGridEl.innerHTML = "";
  nextBtn.style.display = "none";

  q.options.forEach((opt, idx) => {
    const btn = document.createElement("button");
    btn.classList.add("opt-btn");
    btn.textContent = opt;
    btn.onclick = () => evaluateOption(idx, q.answer);
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

  if (selected === correct) {
    score++;
    scoreNumEl.textContent = `Score: ${score} ⭐`;
  }

  if (currentQIndex < questions.length - 1) {
    nextBtn.style.display = "inline-block";
  } else {
    setTimeout(showQuizResults, 1200);
  }
}

nextBtn.addEventListener("click", () => {
  currentQIndex++;
  loadQuizQuestion();
});

function showQuizResults() {
  quizPlayable.style.display = "none";
  quizFinished.style.display = "block";
  finalScoreText.textContent = `You earned ${score} out of ${questions.length} Stars! ⭐`;
}

function resetQuiz() {
  currentQIndex = 0;
  score = 0;
  quizFinished.style.display = "none";
  quizPlayable.style.display = "block";
  loadQuizQuestion();
}

// Initial Call
loadQuizQuestion();
selectLetter('A');
