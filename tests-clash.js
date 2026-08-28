/* =====================================================
   WHATSAPP 9:00 PM MEGA BLITZ PASS GENERATOR & MODAL
===================================================== */
window.handleGetBlitzPass = function() {
  const nameInput = document.getElementById('studentName')?.value?.trim();
  const studentName = nameInput || localStorage.getItem('studentName') || localStorage.getItem('student_name') || 'Champion';
  const passId = 'BLITZ-' + Math.floor(100000 + Math.random() * 900000);

  localStorage.setItem('blitz_pass_active', 'true');
  localStorage.setItem('blitz_pass_id', passId);

  const xpEl = document.getElementById('xpCounter');
  let currentXP = parseInt(xpEl?.textContent || localStorage.getItem('student_xp') || '680', 10);
  currentXP += 100;
  if (xpEl) xpEl.textContent = currentXP;
  localStorage.setItem('student_xp', currentXP.toString());

  if(typeof rechargeBlitzPowerup === 'function') {
    rechargeBlitzPowerup('fiftyFifty');
    rechargeBlitzPowerup('timeFreeze');
    rechargeBlitzPowerup('shield');
  }

  if (typeof playWin === 'function') playWin();
  if (typeof triggerHaptic === 'function') triggerHaptic([50, 50, 100]);
  if (typeof confetti === 'function') confetti({ particleCount: 90, spread: 60, origin: { y: 0.6 } });

  renderBlitzPassModal(studentName, passId);
}

window.renderBlitzPassModal = function(name, passId) {
  const existing = document.getElementById('blitzPassModal');
  if (existing) existing.remove();

  const shareText = encodeURIComponent(
    `🔥 *9:00 PM MEGA BLITZ PASS ACTIVATED!* 🔥\n\n` +
    `👤 Student: *${name}*\n` +
    `🎟️ Pass ID: *#${passId}*\n` +
    `⚡ Perks: Unlocked 1v1 Arena + 100 Bonus XP + 3x Power-Ups\n\n` +
    `Join tonight's 9 PM Blitz Clash with me here:\n` +
    `👉 ${window.location.origin}/app.html`
  );

  const modalHtml = `
    <div id="blitzPassModal" style="position:fixed; inset:0; z-index:9999; display:flex; align-items:center; justify-content:center; padding:16px; background:rgba(0,0,0,0.85); backdrop-filter:blur(8px);">
      <div style="max-width:380px; width:100%; background:#0f172a; border:2px solid #f59e0b; border-radius:24px; padding:24px; text-align:center; position:relative; box-shadow:0 0 30px rgba(245,158,11,0.3); animation:popIn 0.3s cubic-bezier(0.175,0.885,0.32,1.275);">

        <div style="width:60px; height:60px; margin:0 auto 12px; background:linear-gradient(135deg, #f59e0b, #d97706); border-radius:18px; display:flex; align-items:center; justify-content:center; font-size:30px; box-shadow:0 8px 20px rgba(245,158,11,0.4);">
          🎟️
        </div>

        <span style="font-size:10px; font-weight:900; letter-spacing:1px; text-transform:uppercase; background:rgba(245,158,11,0.2); color:#fbbf24; border:1px solid rgba(245,158,11,0.4); padding:4px 10px; border-radius:999px;">
          VIP PASS ACTIVE
        </span>

        <h3 style="font-size:20px; font-weight:900; color:#fff; margin:12px 0 4px 0;">Tonight's 9 PM Blitz Pass</h3>
        <p style="font-size:12px; color:#94a3b8; margin:0 0 16px 0;">Pass ID: <strong style="color:#fbbf24; font-family:monospace;">#${passId}</strong></p>

        <div style="background:#020617; border:1px solid #1e293b; border-radius:16px; padding:14px; text-align:left; font-size:12px; margin-bottom:18px; display:flex; flex-direction:column; gap:8px;">
          <div style="color:#10b981; font-weight:800; display:flex; align-items:center; gap:8px;">
            <span>✅</span> <span>+100 Bonus XP Added Instantly</span>
          </div>
          <div style="color:#00e5ff; font-weight:800; display:flex; align-items:center; gap:8px;">
            <span>✅</span> <span>1x 50-50, Time Freeze & Shield Charged</span>
          </div>
          <div style="color:#fbbf24; font-weight:800; display:flex; align-items:center; gap:8px;">
            <span>✅</span> <span>Priority State Leaderboard Entry</span>
          </div>
        </div>

        <div style="display:flex; flex-direction:column; gap:8px;">
          <a href="https://api.whatsapp.com/send?text=${shareText}" target="_blank" style="display:block; width:100%; background:#10b981; color:#020617; font-weight:900; font-size:13px; padding:12px 0; border-radius:14px; text-decoration:none; box-shadow:0 4px 15px rgba(16,185,129,0.3);">
            📲 Share Pass on WhatsApp (+50 XP)
          </a>
          <button onclick="document.getElementById('blitzPassModal').remove(); switchTab('arena');" style="width:100%; background:#1e293b; color:#cbd5e1; font-weight:700; font-size:12px; padding:10px 0; border-radius:14px; border:1px solid #334155; cursor:pointer;">
            Close &amp; Enter Arena
          </button>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

/* =====================================================
   SURVIVAL BET, DAILY CLASH & MEGA BLITZ ENGINE
===================================================== */
let blitzState = {
  active: false,
  questions: [],
  currentIdx: 0,
  score: 0,
  streak: 0,
  timer: 10,
  timerInterval: null,
  roomTrack: 'HOT_SYLLABUS',
  shieldActive: false,
  timeFrozen: false,
  powerups: { fiftyFifty: 1, timeFreeze: 1, shield: 1 }
};

window.rechargeBlitzPowerup = function(type) {
  let count = parseInt(localStorage.getItem(`blitz_pup_${type}`) || '1', 10);
  count = Math.min(count + 1, 3);
  localStorage.setItem(`blitz_pup_${type}`, count);
  if(typeof updatePowerupUI === 'function') updatePowerupUI();
}

window.updatePowerupUI = function() {
  ['fiftyFifty', 'timeFreeze', 'shield'].forEach(p => {
    const val = parseInt(localStorage.getItem(`blitz_pup_${p}`) || '1', 10);
    const badge = document.getElementById(`pupBadge_${p}`);
    if (badge) badge.textContent = val;
  });
}

window.initBlitzCountdown = function() {
  const tickerEl = document.getElementById('blitzCountdownTicker');
  if (!tickerEl) return;

  setInterval(() => {
    const now = new Date();
    const target = new Date();
    target.setHours(21, 0, 0, 0);
    if (now > target) { target.setDate(target.getDate() + 1); }

    const diff = target - now;
    const hrs = String(Math.floor(diff / (1000 * 60 * 60))).padStart(2, '0');
    const mins = String(Math.floor((diff / (1000 * 60)) % 60)).padStart(2, '0');
    const secs = String(Math.floor((diff / 1000) % 60)).padStart(2, '0');

    tickerEl.textContent = `⚡ 9:00 PM MEGA BLITZ IN: ${hrs}h ${mins}m ${secs}s`;
  }, 1000);
}

window.renderDailyPuzzle = function(puzzle) {
  if (!puzzle) return;
  const pBox = document.getElementById('puzzleBox');
  if (pBox) pBox.style.display = 'flex';

  const rawQ = puzzle.question || puzzle.question_en || "Is √(-4) × √(-9) equal to +6 or -6?";
  const formattedQ = typeof formatMathText === 'function' ? formatMathText(rawQ) : rawQ;

  let enText = formattedQ;
  let hiText = "";
  if (formattedQ.includes(" / ")) {
    const parts = formattedQ.split(/\s\/\s/);
    enText = parts[0] || formattedQ;
    hiText = parts[1] || "";
  } else if (puzzle.question_hi) {
    hiText = puzzle.question_hi;
  }

  const qEn = document.getElementById('puzzleQuestionEn');
  const qHi = document.getElementById('puzzleQuestionHi');
  if (qEn) qEn.innerHTML = enText;
  if (qHi) qHi.innerHTML = hiText;

  const container = document.getElementById('puzzleOptionsContainer');
  if (!container) return;
  container.innerHTML = '';

  let opts = puzzle.options;
  let correctIdx = puzzle.correct_option !== undefined ? puzzle.correct_option : 1;

  if (!opts || !opts.length) {
    if (puzzle.option_1) {
      opts = [puzzle.option_1, puzzle.option_2, puzzle.option_3, puzzle.option_4];
    } else {
      opts = ['+6', '-6', '±6', 'Not Real'];
    }
  }

  opts.forEach((opt, idx) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'survival-btn';
    btn.textContent = opt;
    btn.onclick = () => handleDailyClashAnswer(idx, correctIdx);
    container.appendChild(btn);
  });

  startDailyClashTimer();
}

let clashTimerInterval = null;
window.startDailyClashTimer = function() {
  let timeLeft = 15;
  const numDisplay = document.getElementById('survivalTimerNum');
  const barDisplay = document.getElementById('survivalTimerBar');

  clearInterval(clashTimerInterval);
  clashTimerInterval = setInterval(() => {
    timeLeft--;
    if (numDisplay) numDisplay.textContent = `${timeLeft}s`;
    if (barDisplay) barDisplay.style.width = `${(timeLeft / 15) * 100}%`;

    if (timeLeft <= 4) { if(typeof playTick === 'function') playTick(); }

    if (timeLeft <= 0) {
      clearInterval(clashTimerInterval);
      handleDailyClashAnswer(-1, -1, true);
    }
  }, 1000);
}

window.handleDailyClashAnswer = function(selectedIdx, correctIdx, timedOut = false) {
  clearInterval(clashTimerInterval);

  const fb = document.getElementById('puzzleFeedback');
  const optsContainer = document.getElementById('puzzleOptionsContainer');

  if (optsContainer) {
    Array.from(optsContainer.children).forEach((btn, idx) => {
      btn.disabled = true;
      btn.style.cursor = 'default';
      if (idx === Number(correctIdx)) {
        btn.style.borderColor = 'var(--accent-emerald)';
        btn.style.background = 'rgba(5, 255, 161, 0.15)';
      }
    });
  }

  if (timedOut) {
    if(typeof triggerHaptic === 'function') triggerHaptic([80]);
    if (fb) fb.innerHTML = `<div style="color:var(--accent-rose); font-weight:800; margin-top:8px;">⏱ Time's up! Clash closed.</div>`;
    return;
  }

  const isCorrect = Number(selectedIdx) === Number(correctIdx);
  const currentXp = parseInt(document.getElementById('xpCounter')?.textContent || '680', 10);

  if (isCorrect) {
    if(typeof playDing === 'function') playDing();
    if(typeof triggerHaptic === 'function') triggerHaptic([30, 40, 30]);
    const newXp = currentXp + 50;
    const xpEl = document.getElementById('xpCounter');
    const userXpEl = document.getElementById('userXpDisplay');
    if (xpEl) xpEl.textContent = newXp;
    if (userXpEl) userXpEl.textContent = newXp;

    if (fb) {
      fb.innerHTML = `
        <div style="background:rgba(5,255,161,0.12); border:1px solid rgba(5,255,161,0.3); border-radius:12px; padding:10px; margin-top:10px;">
          <div style="font-size:13px; font-weight:900; color:var(--accent-emerald);">🔥 PERFECT! +50 XP</div>
          <div style="font-size:11px; color:var(--text-muted); margin-top:2px;">√(-4) × √(-9) = 2i × 3i = 6i² = <b>-6</b></div>
        </div>
      `;
    }
    if(typeof confetti === 'function') confetti({ particleCount: 70, spread: 50, origin: { y: 0.6 } });
  } else {
    if(typeof playBuzz === 'function') playBuzz();
    if(typeof triggerHaptic === 'function') triggerHaptic([100]);
    const pBox = document.getElementById('puzzleBox');
    if (pBox) {
      pBox.classList.add('arena-shake');
      setTimeout(() => pBox.classList.remove('arena-shake'), 400);
    }
    if (fb) {
      fb.innerHTML = `
        <div style="background:rgba(255,42,95,0.1); border:1px solid rgba(255,42,95,0.25); border-radius:12px; padding:10px; margin-top:10px;">
          <div style="font-size:12px; font-weight:800; color:var(--accent-rose);">Incorrect! Correct answer is -6 (since i² = -1).</div>
        </div>
      `;
    }
  }
}

/* =====================================================
   TEST GENERATOR & TIME ATTACK ENGINE
===================================================== */
let activeQuestions = [];
let activeTestTitle = ""; let activeTestClass = ""; let activeTestSubject = ""; let finalScoreData = {};
let testTimerInterval = null; let totalTimeLimit = 600; let timeRemaining = 600;

const testOrg = document.getElementById("testOrg");
const testClass = document.getElementById("testClass");
const testSubject = document.getElementById("testSubject");
const testChapter = document.getElementById("testChapter");
const startTestBtn = document.getElementById("startTestBtn");
const testSetup = document.getElementById("testSetup");
const testArea = document.getElementById("testArea");
const testHeader = document.getElementById("testHeader");
const questionsContainer = document.getElementById("questionsContainer");
const submitTestBtn = document.getElementById("submitTestBtn");
const testResult = document.getElementById("testResult");
const scoreText = document.getElementById("scoreText");
const badgesContainer = document.getElementById("badgesContainer");
const resultDetail = document.getElementById("resultDetail");
const reviewContainer = document.getElementById("reviewContainer");
const restartTestBtn = document.getElementById("restartTestBtn");
const timerDisplay = document.getElementById("timerDisplay");
const whatsappShareBtn = document.getElementById("whatsappShareBtn");

function startTimer() {
    clearInterval(testTimerInterval); timeRemaining = totalTimeLimit; updateTimerUI();
    testTimerInterval = setInterval(function() {
        timeRemaining--; updateTimerUI();
        if (timeRemaining <= 0) { clearInterval(testTimerInterval); alert("Time complete. Submitting test."); submitTestBtn.click(); }
    }, 1000);
}

function updateTimerUI() {
    if (!timerDisplay) return;
    const minutes = Math.floor(timeRemaining / 60); const seconds = timeRemaining % 60;
    timerDisplay.textContent = "⏳ " + (minutes < 10 ? "0" + minutes : minutes) + ":" + (seconds < 10 ? "0" + seconds : seconds);
}

if (startTestBtn) {
  startTestBtn.addEventListener("click", async function(){
    let name = document.getElementById("studentName")?.value?.trim();
    if (!name) name = localStorage.getItem("studentName") || "Student"; // Auto-resolve name so it doesn't block

    const mobile = document.getElementById("studentMobile")?.value?.trim();
    
    let org = testOrg?.value;
    if (!org) org = localStorage.getItem("userSchool"); // Try fetching from storage

    const cls = testClass?.value; 
    const subject = testSubject?.value; 
    const chapter = testChapter?.value?.trim() || "Full Syllabus Overview";
    const difficultyLevel = document.getElementById("testDifficulty")?.value || "Moderate";

    // SMART VALIDATION: Tell the user EXACTLY what they missed
    if(!org) return alert("Please select your School/Institute from the dropdown.");
    if(!cls) return alert("Please select your Grade/Class.");
    if(!subject) return alert("Please select your Subject.\n\nNote: Whenever you change the Class, the Subject dropdown resets automatically. Please select it again.");

    if(mobile && !/^[0-9]{10}$/.test(mobile)){ 
      return alert("Please enter a valid 10-digit mobile number, or leave it blank."); 
    }

    if(org) {
        localStorage.setItem('userSchool', org);
        localStorage.setItem('testOrg', org);
    }

    const originalText = startTestBtn.textContent;
    startTestBtn.disabled = true; startTestBtn.textContent = "⚙️ Compiling Assessment... (10s)";
    document.getElementById('testWarmupBox')?.classList.remove('hidden');

    try {
        const response = await fetch("/api/generate-test", {
            method: "POST", 
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ 
                className: cls, 
                subject: subject, 
                chapter: chapter, 
                numberOfQuestions: 20, 
                difficulty: difficultyLevel, 
                questionType: "MCQ", 
                language: "English and Pure Devanagari Hindi" 
            })
        });
        
        const textResponse = await response.text();
        let data;
        try {
            data = JSON.parse(textResponse);
        } catch(e) {
            throw new Error("Server timeout while generating 20 questions. Please try a more specific chapter.");
        }
        
        if(!response.ok) throw new Error(data.error || "Preparation error.");
        
        const generated = extractQuestions(data);
        if(!generated || !generated.length) throw new Error("Unable to load questions from AI.");

        activeTestClass = cls; activeTestSubject = subject;
        activeTestTitle = `${subject}:${chapter}`;
        startQuestions(generated, `Class ${cls} ${subject} (${difficultyLevel})`, chapter);
    } catch(error) { 
        alert("Assessment System: " + error.message); 
    } finally { 
        startTestBtn.disabled = false; 
        startTestBtn.textContent = originalText; 
        document.getElementById('testWarmupBox')?.classList.add('hidden');
    }
  });
}

function extractQuestions(data){
    let questions = [];
    if(Array.isArray(data)) questions = data;
    else if(data && Array.isArray(data.questions)) questions = data.questions;
    else if(data && data.test && Array.isArray(data.test.questions)) questions = data.test.questions;

    return questions.map(function(q, index){
        let options = q.options || q.choices || [];
        let answer = q.answer !== undefined ? q.answer : q.correctAnswer;
        if(typeof answer === "string" && options.length){
            const letter = answer.trim().toUpperCase();
            if(letter === "A") answer = 0; if(letter === "B") answer = 1; if(letter === "C") answer = 2; if(letter === "D") answer = 3;
        }
        return { id: index + 1, question: q.question || q.questionText || ("Question " + (index + 1)), options: options, answer: Number(answer), explanation: q.explanation || "Review fundamental formulas." };
    }).filter(q => q.question && q.options.length >= 2 && Number.isFinite(q.answer));
}

function startQuestions(questions, headerTitle, testTitle){
    activeQuestions = questions; activeTestTitle = testTitle;
    testSetup.classList.add("hidden"); testArea.classList.remove("hidden"); testResult.style.display = "none";
    reviewContainer.innerHTML = ""; badgesContainer.innerHTML = "";
    testHeader.innerHTML = "<strong>" + escapeHTML(headerTitle) + "</strong><br>" + escapeHTML(testTitle) + " &bull; 20 Questions";
    questionsContainer.innerHTML = "";

    questions.forEach(function(q, index){
        const card = document.createElement("div"); card.className = "question-card";
        let optionsHTML = "";
        q.options.forEach(function(option, optionIndex){
            optionsHTML += '<label class="option"><input type="radio" name="q' + q.id + '" value="' + optionIndex + '"><span>' + formatMathText(escapeHTML(String(option))) + '</span></label>';
        });
        card.innerHTML = '<div style="color:var(--accent-cyan); font-size:11px; font-weight:900;">QUESTION ' + (index + 1) + '</div><div style="font-size:15px; font-weight:700; margin:8px 0;">' + formatMathText(escapeHTML(String(q.question))) + '</div>' + optionsHTML;
        questionsContainer.appendChild(card);
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
    startTimer();
}

if (submitTestBtn) {
  submitTestBtn.addEventListener("click", async function(){
    clearInterval(testTimerInterval);
    const questions = activeQuestions; if(!questions.length) return;

    submitTestBtn.disabled = true; submitTestBtn.textContent = "RECORDING SCORE...";
    let correct = 0, attempted = 0; const answers = []; let reviewHTML = "";

    questions.forEach(function(q, index){
        const selected = document.querySelector('input[name="q' + q.id + '"]:checked');
        let selectedAnswer = null; let isCorrect = false;
        if(selected){
            attempted++; selectedAnswer = Number(selected.value);
            if(selectedAnswer === Number(q.answer)){ correct++; isCorrect = true; }
        }
        answers.push({ questionNumber: index + 1, question: q.question, selectedAnswer: selectedAnswer, correctAnswer: Number(q.answer), isCorrect: isCorrect });
        let statusBadge = isCorrect ? '<span style="color:var(--accent-emerald); font-weight:800;">✓ Correct</span>' : '<span style="color:var(--accent-rose); font-weight:800;">✗ Incorrect</span>';
        reviewHTML += `<div class="review-card"><div style="font-size:11px; font-weight:800; color:var(--text-muted);">Q${index+1} &bull; ${statusBadge}</div><div style="font-size:14px; font-weight:700; margin:6px 0;">${formatMathText(escapeHTML(q.question))}</div><div style="font-size:12px;">Correct: <strong>${formatMathText(escapeHTML(q.options[q.answer]))}</strong></div></div>`;
    });

    const percentage = Math.round((correct / questions.length) * 100);
    if (percentage >= 80) { if(typeof playWin === 'function') playWin(); if(typeof confetti === 'function') confetti({ particleCount: 100, spread: 60, origin: { y: 0.6 } }); }

    finalScoreData = { percentage: percentage, scoreString: correct + "/" + questions.length, testName: activeTestTitle };
    scoreText.textContent = correct + "/" + questions.length;
    resultDetail.innerHTML = `<strong>${percentage}% Accuracy</strong> &bull; Correct: ${correct} | Incorrect: ${attempted - correct}`;
    reviewContainer.innerHTML = reviewHTML;
    testArea.classList.add("hidden"); testResult.style.display = "block";
    testResult.scrollIntoView({ behavior: "smooth", block: "start" });

    const studentName = document.getElementById("studentName")?.value?.trim() || localStorage.getItem("studentName") || "Student";
    const studentMobile = document.getElementById("studentMobile")?.value?.trim() || "";
    const org = document.getElementById("testOrg")?.value || "Other School";
    const chapterName = testChapter?.value?.trim() || "Chapter Assessment";

    try {
        await fetch("/api/save-test-attempt", {
            method: "POST", headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ studentName: studentName, studentMobile: studentMobile, organization: org, studentClass: activeTestClass || testClass.value, subject: activeTestSubject || testSubject.value, chapter: chapterName, testTitle: activeTestTitle, testType: "Algorithmic Generation", totalQuestions: questions.length, attempted: attempted, correct: correct, wrong: attempted - correct, unanswered: questions.length - attempted, percentage: percentage, answers: answers })
        });
        if(typeof loadPlatformData === 'function') loadPlatformData();
    } catch(e){}
    finally { submitTestBtn.disabled = false; submitTestBtn.textContent = "SUBMIT ANSWERS"; }
  });
}

if (restartTestBtn) {
  restartTestBtn.addEventListener("click", function(){
    testResult.style.display = "none"; testSetup.classList.remove("hidden"); testArea.classList.add("hidden");
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

if (whatsappShareBtn) {
  whatsappShareBtn.addEventListener("click", function(){
    const rawMsg = "⚔️ I scored " + finalScoreData.percentage + "% (" + finalScoreData.scoreString + ") on " + finalScoreData.testName + " at Invincible 360! Check your preparation here: " + window.location.href;
    window.open("https://api.whatsapp.com/send?text=" + encodeURIComponent(rawMsg), "_blank");
  });
}

// Ensure the Mega Blitz Countdown actually starts when the page loads
document.addEventListener('DOMContentLoaded', () => {
    if(typeof initBlitzCountdown === 'function') initBlitzCountdown();
});
