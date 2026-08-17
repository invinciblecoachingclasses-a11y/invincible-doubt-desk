<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Invincible 360 | Complete Academic Ecosystem</title>
<meta name="description" content="Prepare for CBSE Board exams with Invincible 360. Access free AI doubt solving, weekly tests, and 1v1 Arena Battles.">

<script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js"></script>

<style>
*{ box-sizing:border-box; transition: all 0.2s ease-in-out; }
body{ margin:0; font-family: 'Inter', system-ui, sans-serif; background:#0f172a; color:#f8fafc; }
.container{ width:min(760px, 94%); margin:25px auto; }

/* BRAND BANNER */
.brand-banner{ background: linear-gradient(135deg, #1e293b, #0f172a); color:white; border-radius:24px; padding:28px 20px; text-align:center; margin-bottom:20px; box-shadow:0 20px 40px rgba(0,0,0,.4); border: 1px solid rgba(56, 189, 248, 0.2); position: relative; overflow: hidden; }
.brand-banner::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, #38bdf8, #6366f1, #ec4899); }
.brand-name{ font-size:28px; font-weight:900; letter-spacing:1px; margin:0; background: linear-gradient(90deg, #38bdf8, #818cf8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.brand-tagline{ font-size:14px; font-style:italic; margin-top:6px; color:#94a3b8; }
.brand-line{ height:1px; background:rgba(255,255,255,.1); margin:16px auto; width:80%; }
.brand-subjects{ font-size:13px; font-weight:700; letter-spacing:.5px; color:#cbd5e1; }

/* DAILY PUZZLE & LEADERBOARD */
.puzzle-banner { background: linear-gradient(145deg, #1e293b, #111827); border: 2px solid #f59e0b; border-radius: 20px; padding: 20px; margin-bottom: 20px; }
.puzzle-tag { color: #f59e0b; font-weight: 900; font-size: 12px; text-transform: uppercase; margin-bottom: 8px; }
.puzzle-q { font-size: 17px; font-weight: 700; margin-bottom: 14px; }
.puzzle-toggle-btn { background: #f59e0b; color: #0f172a; border: none; padding: 8px 16px; border-radius: 10px; font-weight: 800; cursor: pointer; }
.puzzle-solution { display: none; margin-top: 14px; padding: 14px; background: rgba(15, 23, 42, 0.6); border-radius: 12px; border: 1px dashed #f59e0b; font-size: 14px; line-height: 1.6; }
.leaderboard-card { background: #1e293b; border: 2px solid #334155; border-radius: 20px; padding: 20px; margin-bottom: 20px; }
.leaderboard-title { font-size: 18px; font-weight: 900; color: #38bdf8; margin-bottom: 14px; text-align: center; }
.leaderboard-item { display: flex; justify-content: space-between; align-items: center; padding: 11px 14px; background: #0f172a; border-radius: 12px; margin-bottom: 8px; font-size: 14px; font-weight: 700; border: 1px solid rgba(255,255,255,0.05); }
.leaderboard-rank { background: #334155; border-radius: 50%; width: 26px; height: 26px; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; margin-right: 10px; }
.leaderboard-rank.first { background: #eab308; color: #0f172a; }
.leaderboard-score { color: #34d399; font-weight: 900; }

/* HEADER & MODE SWITCH */
.header{ text-align:center; margin-bottom:20px; }
.header h1{ margin:0; font-size:32px; font-weight:900; }
.header p{ margin-top:8px; color:#94a3b8; font-size:15px; }
.mode-switch{ display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; margin-bottom:20px; }
.mode-btn{ padding:14px 5px; border:2px solid #334155; border-radius:14px; background:#1e293b; color:#38bdf8; font-size:14px; font-weight:800; cursor:pointer; }
.mode-btn.active{ background: linear-gradient(135deg, #0284c7, #0369a1); color:white; border-color:#38bdf8; box-shadow: 0 6px 20px rgba(2, 132, 199, 0.4); }
.mode-btn.arena-btn { color: #f43f5e; border-color: #9f1239; }
.mode-btn.arena-btn.active { background: linear-gradient(135deg, #e11d48, #9f1239); border-color: #fb7185; color: white; box-shadow: 0 6px 20px rgba(225, 29, 72, 0.4); }

/* CARDS & INPUTS */
.card{ background:#1e293b; padding:28px; border-radius:24px; box-shadow:0 15px 35px rgba(0,0,0,.4); border: 1px solid rgba(255,255,255,0.05); }
label{ display:block; font-size:16px; font-weight:700; margin-bottom:12px; color:#e2e8f0; }
.subjects{ display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-bottom:25px; }
.subject{ padding:16px 8px; border:2px solid #334155; border-radius:14px; background:#0f172a; color:#38bdf8; font-size:15px; font-weight:700; cursor:pointer; }
.subject.active{ background:#38bdf8; color:#0f172a; font-weight: 900; }
textarea, input, select { width:100%; padding:16px; border:2px solid #334155; border-radius:14px; font-size:16px; background:#0f172a; color:white; outline:none; margin-bottom: 14px; }
textarea:focus, input:focus, select:focus{ border-color:#38bdf8; box-shadow: 0 0 0 3px rgba(56,189,248,0.2); }
.ask-btn, .submit-btn { width:100%; margin-top:10px; padding:18px; border:none; border-radius:16px; background: linear-gradient(135deg, #f97316, #ea580c); color:white; font-size:18px; font-weight:900; cursor:pointer; box-shadow: 0 8px 20px rgba(249, 115, 22, 0.3); }
.ask-btn:disabled, .submit-btn:disabled{ opacity:.5; cursor:not-allowed; }
.hidden{ display:none!important; }

/* ARENA STYLING */
.arena-header { text-align: center; margin-bottom: 20px; }
.arena-title { font-size: 26px; font-weight: 900; color: #fb7185; }
.arena-subtitle { font-size: 14px; color: #94a3b8; margin-top: 5px; }
.arena-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 20px; padding-top: 20px; border-top: 2px solid #334155; }
.arena-btn-create { background: linear-gradient(135deg, #8b5cf6, #6d28d9); color: white; padding: 16px; border: none; border-radius: 14px; font-weight: 800; cursor: pointer; width: 100%; }
.arena-btn-join { background: linear-gradient(135deg, #10b981, #047857); color: white; padding: 16px; border: none; border-radius: 14px; font-weight: 800; cursor: pointer; width: 100%; }

.lobby-box { text-align: center; padding: 30px 15px; background: #0f172a; border-radius: 16px; border: 2px dashed #fb7185; }
.room-code-display { font-size: 42px; font-weight: 900; color: #fb7185; letter-spacing: 4px; margin: 15px 0; }
.pulse-text { animation: pulse 1.5s infinite; color: #38bdf8; font-weight: 700; }
@keyframes pulse { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }

.vs-header { display: flex; justify-content: space-between; align-items: center; background: #0f172a; padding: 15px; border-radius: 14px; border: 2px solid #334155; margin-bottom: 20px; }
.player-tag { font-size: 16px; font-weight: 800; display: flex; flex-direction: column; align-items: center; }
.player-tag span { font-size: 22px; color: #38bdf8; }
.vs-badge { background: #e11d48; color: white; font-weight: 900; padding: 5px 10px; border-radius: 8px; font-style: italic; }

.arena-timer { font-size: 24px; font-weight: 900; color: #fb7185; text-align: center; margin-bottom: 15px; }
.option { display:block; padding:16px; border:2px solid #334155; border-radius:12px; margin:10px 0; cursor:pointer; font-size:16px; font-weight: 700; background:#1e293b; color:#e2e8f0; text-align: center; }
.option:hover { background:#283548; border-color:#38bdf8; }

.result-box { text-align: center; padding: 20px; }
.winner-text { font-size: 32px; font-weight: 900; color: #34d399; margin-bottom: 10px; }
.loser-text { font-size: 32px; font-weight: 900; color: #fb7185; margin-bottom: 10px; }

/* DOUBT / TEST SPECIFIC (Simplified for brevity) */
.photo-buttons{ display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:15px; margin-bottom:15px;}
.photo-btn{ padding:16px 10px; border:2px solid #334155; border-radius:14px; background:#0f172a; color:#e2e8f0; font-weight:700; cursor:pointer; }
.answer-box{ display:none; margin-top:25px; padding:24px; background:#0f172a; border-radius:20px; border:2px solid #334155; }
.logic-title{ font-size:24px; font-weight:900; color:#38bdf8; margin-bottom:15px; }
.answer-text{ white-space:pre-wrap; font-size:17px; line-height:1.7; color:#cbd5e1; }
.timer-box { font-size: 22px; font-weight: 900; color: #ef4444; text-align: center; padding: 12px; border: 2px solid #ef4444; border-radius: 14px; margin-bottom: 18px; background: rgba(239, 68, 68, 0.1); }
.question-card{ border:2px solid #334155; border-radius:16px; padding:18px; margin:16px 0; background:#0f172a; }
.question-number{ color:#38bdf8; font-weight:800; font-size:13px; margin-bottom:6px; }
.question-text{ font-size:17px; font-weight:700; margin-bottom:14px; }
.test-radio { display:flex; align-items:flex-start; gap:10px; padding:14px; border:2px solid #334155; border-radius:12px; margin:8px 0; cursor:pointer; background:#1e293b; }
.test-result{ display:none; padding:25px 15px; margin-top:20px; background:#0f172a; border:2px solid #334155; border-radius:20px; text-align: center;}
.badges-container { display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; margin: 15px 0; }
.badge { padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 800; box-shadow: 0 4px 10px rgba(0,0,0,0.3); }
</style>
</head>

<body>

<div class="container">

<!-- BRAND BANNER -->
<div class="brand-banner">
    <div class="brand-name">INVINCIBLE 360</div>
    <div class="brand-tagline">Complete Academic & Competitive Intelligence Ecosystem</div>
    <div class="brand-line"></div>
    <div class="brand-subjects">PHYSICS &nbsp;•&nbsp; CHEMISTRY &nbsp;•&nbsp; MATHEMATICS &nbsp;•&nbsp; SCIENCE</div>
</div>

<div class="header">
    <h1>Student Hub</h1>
    <p>Ask doubts, take timed exams, or battle a friend live.</p>
</div>

<div class="mode-switch">
    <button type="button" class="mode-btn active" id="doubtModeBtn">DOUBT DESK</button>
    <button type="button" class="mode-btn" id="testModeBtn">TAKE A TEST</button>
    <button type="button" class="mode-btn arena-btn" id="arenaModeBtn">ARENA (1v1)</button>
</div>

<!-- =====================================================
1. DOUBT SECTION
===================================================== -->
<div class="card" id="doubtSection">
    <label>Select Subject</label>
    <div class="subjects">
        <button type="button" class="subject active" data-subject="Mathematics">Mathematics</button>
        <button type="button" class="subject" data-subject="Physics">Physics</button>
        <button type="button" class="subject" data-subject="Chemistry">Chemistry</button>
    </div>
    <label>Your Question</label>
    <textarea id="question" placeholder="Type your question here..."></textarea>
    <button type="button" class="ask-btn" id="askBtn">ASK AI</button>
    <div id="loadingDoubt" class="hidden" style="text-align:center; color:#38bdf8; margin-top:15px; font-weight:bold;">Thinking...</div>
    <div class="answer-box" id="answerBox">
        <div class="logic-title">Aao Logic Samjhate Hain</div>
        <div class="answer-text" id="answerText"></div>
    </div>
</div>

<!-- =====================================================
2. TEST SECTION
===================================================== -->
<div class="card hidden" id="testSection">
    <div id="testSetup">
        <label>Take an Automated Test</label>
        <input id="testName" type="text" placeholder="Student Name">
        <select id="testClass">
            <option value="">Select Class</option>
            <option value="9">Class 9</option>
            <option value="10">Class 10</option>
            <option value="11">Class 11</option>
            <option value="12">Class 12</option>
        </select>
        <select id="testSubject">
            <option value="">Select Subject</option>
            <option value="Science">Science (9-10)</option>
            <option value="Physics">Physics</option>
            <option value="Chemistry">Chemistry</option>
            <option value="Mathematics">Mathematics</option>
        </select>
        <select id="testSelect"><option value="">Select Test</option></select>
        <button type="button" class="submit-btn" id="startTestBtn">START TEST</button>
    </div>

    <div id="testArea" class="hidden">
        <div class="timer-box" id="timerDisplay">⏳ 20:00</div>
        <div id="questionsContainer"></div>
        <button type="button" class="submit-btn" id="submitTestBtn">SUBMIT TEST</button>
    </div>

    <div class="test-result" id="testResult">
        <div style="font-size:42px; font-weight:900; color:#38bdf8;" id="scoreText">0/0</div>
        <div id="badgesContainer" class="badges-container"></div>
        <button type="button" class="submit-btn" onclick="location.reload()">HOME</button>
    </div>
</div>

<!-- =====================================================
3. ARENA SECTION (MULTIPLAYER)
===================================================== -->
<div class="card hidden" id="arenaSection">
    
    <!-- Lobby Setup -->
    <div id="arenaSetup">
        <div class="arena-header">
            <div class="arena-title">⚔️ INVINCIBLE ARENA</div>
            <div class="arena-subtitle">Battle your friends in a live rapid-fire quiz!</div>
        </div>
        <input type="text" id="arenaPlayerName" placeholder="Enter Your Name (e.g. Rahul)">
        
        <div class="arena-grid">
            <div>
                <select id="arenaSubject">
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Science">Science (9-10)</option>
                </select>
                <button type="button" class="arena-btn-create" id="btnCreateRoom">Create Match</button>
            </div>
            <div>
                <input type="text" id="arenaJoinCode" placeholder="Enter 4-Digit Code" maxlength="4" style="text-align:center; font-weight:bold; letter-spacing:2px;">
                <button type="button" class="arena-btn-join" id="btnJoinRoom">Join Match</button>
            </div>
        </div>
    </div>

    <!-- Waiting Room -->
    <div id="arenaWaiting" class="hidden lobby-box">
        <div style="font-size: 18px; color:#cbd5e1;">Your Room Code</div>
        <div class="room-code-display" id="displayRoomCode">0000</div>
        <div style="font-size: 14px; color:#94a3b8; margin-bottom:20px;">Send this code to your friend!</div>
        <div class="pulse-text">Waiting for opponent to join...</div>
    </div>

    <!-- Active Battle -->
    <div id="arenaBattle" class="hidden">
        <div class="vs-header">
            <div class="player-tag" id="uiP1Name">Player 1 <span id="uiP1Score">0</span></div>
            <div class="vs-badge">VS</div>
            <div class="player-tag" id="uiP2Name">Player 2 <span id="uiP2Score">0</span></div>
        </div>

        <div class="arena-timer" id="arenaTimerDisplay">⏱ 10</div>
        
        <div class="question-card">
            <div class="question-number" id="arenaQNum">QUESTION 1/5</div>
            <div class="question-text" id="arenaQText">Loading...</div>
            <div id="arenaOptions"></div>
        </div>
    </div>

    <!-- Battle Result -->
    <div id="arenaResult" class="hidden result-box">
        <div id="arenaResultText"></div>
        <div style="margin-top: 20px; color:#cbd5e1;">
            <span id="finalP1"></span> <br> <span id="finalP2"></span>
        </div>
        <button type="button" class="submit-btn" onclick="location.reload()" style="margin-top:20px;">LEAVE ARENA</button>
    </div>

</div>

</div>

<script>
// Tab Switching
document.getElementById('doubtModeBtn').onclick = () => switchTab('doubt');
document.getElementById('testModeBtn').onclick = () => switchTab('test');
document.getElementById('arenaModeBtn').onclick = () => switchTab('arena');

function switchTab(tab) {
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(tab + 'ModeBtn').classList.add('active');
    document.getElementById('doubtSection').classList.add('hidden');
    document.getElementById('testSection').classList.add('hidden');
    document.getElementById('arenaSection').classList.add('hidden');
    document.getElementById(tab + 'Section').classList.remove('hidden');
}

// Audio logic
function playDing() {
    try { const ctx = new (window.AudioContext || window.webkitAudioContext)(); const osc = ctx.createOscillator(); osc.type = 'sine'; osc.frequency.setValueAtTime(880, ctx.currentTime); osc.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + 0.1); } catch(e){}
}

/* =====================================================
TEST DB LOAD (Simplified for Code Length)
===================================================== */
let testBank = {};
fetch('/api/get-questions').then(r=>r.json()).then(data => {
    if(data.questions) {
        data.questions.forEach(q => {
            const key = q.class_name + "|" + q.subject;
            if(!testBank[key]) testBank[key] = {};
            if(!testBank[key][q.test_title]) testBank[key][q.test_title] = [];
            testBank[key][q.test_title].push({ q: q.question_text, opts: [q.option_1, q.option_2, q.option_3, q.option_4], ans: q.correct_option });
        });
    }
});

document.getElementById('testClass').onchange = updateTestList;
document.getElementById('testSubject').onchange = updateTestList;
function updateTestList() {
    const sel = document.getElementById('testSelect');
    sel.innerHTML = '<option value="">Select Test</option>';
    const key = document.getElementById('testClass').value + "|" + document.getElementById('testSubject').value;
    if(testBank[key]) Object.keys(testBank[key]).forEach(t => sel.innerHTML += `<option value="${t}">${t}</option>`);
}

/* =====================================================
ARENA MULTIPLAYER LOGIC
===================================================== */
let arena = {
    code: null,
    playerNum: 1,
    name: '',
    score: 0,
    questions: [],
    currentQ: 0,
    timer: 10,
    interval: null,
    pollInterval: null
};

// 1. Create Room
document.getElementById('btnCreateRoom').onclick = async () => {
    const name = document.getElementById('arenaPlayerName').value.trim();
    if(!name) return alert("Enter your name first!");
    
    document.getElementById('btnCreateRoom').textContent = "Creating...";
    const res = await fetch('/api/arena', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ action: 'create', player_name: name, subject: document.getElementById('arenaSubject').value })
    });
    const data = await res.json();
    
    arena.code = data.room_code;
    arena.questions = data.questions;
    arena.name = name;
    arena.playerNum = 1;

    document.getElementById('arenaSetup').classList.add('hidden');
    document.getElementById('arenaWaiting').classList.remove('hidden');
    document.getElementById('displayRoomCode').textContent = arena.code;

    // Start polling to see if player 2 joined
    arena.pollInterval = setInterval(pollRoomState, 2000);
};

// 2. Join Room
document.getElementById('btnJoinRoom').onclick = async () => {
    const name = document.getElementById('arenaPlayerName').value.trim();
    const code = document.getElementById('arenaJoinCode').value.trim();
    if(!name || !code) return alert("Enter name and code!");

    document.getElementById('btnJoinRoom').textContent = "Joining...";
    const res = await fetch('/api/arena', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ action: 'join', room_code: code, player_name: name })
    });
    const data = await res.json();
    if(data.error) {
        document.getElementById('btnJoinRoom').textContent = "Join Match";
        return alert(data.error);
    }

    arena.code = code;
    arena.questions = data.questions;
    arena.name = name;
    arena.playerNum = 2;
    
    document.getElementById('uiP1Name').innerHTML = `${data.room.player1_name} <span id="uiP1Score">0</span>`;
    document.getElementById('uiP2Name').innerHTML = `${name} (You) <span id="uiP2Score">0</span>`;

    startArenaGame();
    arena.pollInterval = setInterval(pollRoomState, 2000);
};

// 3. Poll Room State Live
async function pollRoomState() {
    const res = await fetch('/api/arena', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ action: 'sync', room_code: arena.code })
    });
    const data = await res.json();
    const room = data.room;

    // If P1 is waiting and P2 joined, start game!
    if (arena.playerNum === 1 && room.status === 'playing' && document.getElementById('arenaWaiting').classList.contains('hidden') === false) {
        document.getElementById('uiP1Name').innerHTML = `${arena.name} (You) <span id="uiP1Score">0</span>`;
        document.getElementById('uiP2Name').innerHTML = `${room.player2_name} <span id="uiP2Score">0</span>`;
        startArenaGame();
    }

    // Update live scores
    if (document.getElementById('arenaBattle').classList.contains('hidden') === false || document.getElementById('arenaResult').classList.contains('hidden') === false) {
        document.getElementById('uiP1Score').textContent = room.player1_score;
        document.getElementById('uiP2Score').textContent = room.player2_score;
    }

    // If both finished, show result
    if (room.player1_finished && room.player2_finished) {
        clearInterval(arena.pollInterval);
        showArenaResult(room);
    }
}

// 4. Start Game Loop
function startArenaGame() {
    document.getElementById('arenaSetup').classList.add('hidden');
    document.getElementById('arenaWaiting').classList.add('hidden');
    document.getElementById('arenaBattle').classList.remove('hidden');
    loadArenaQuestion();
}

function loadArenaQuestion() {
    if (arena.currentQ >= 5) {
        finishArenaGame();
        return;
    }

    const q = arena.questions[arena.currentQ];
    document.getElementById('arenaQNum').textContent = `QUESTION ${arena.currentQ + 1}/5`;
    document.getElementById('arenaQText').textContent = q.question_text || q.question;
    
    let optsHTML = '';
    const opts = q.options ? q.options : [q.option_1, q.option_2, q.option_3, q.option_4];
    opts.forEach((opt, idx) => {
        optsHTML += `<div class="option" onclick="handleArenaAnswer(${idx}, ${q.correct_option !== undefined ? q.correct_option : q.answer})">${opt}</div>`;
    });
    document.getElementById('arenaOptions').innerHTML = optsHTML;

    arena.timer = 10;
    document.getElementById('arenaTimerDisplay').textContent = `⏱ ${arena.timer}`;
    clearInterval(arena.interval);
    arena.interval = setInterval(() => {
        arena.timer--;
        document.getElementById('arenaTimerDisplay').textContent = `⏱ ${arena.timer}`;
        if (arena.timer <= 0) handleArenaAnswer(-1, -1); // Auto wrong
    }, 1000);
}

// 5. Handle Answer
async function handleArenaAnswer(selectedIdx, correctIdx) {
    clearInterval(arena.interval);
    
    // Rapid Fire Logic: Base 10 pts + 1 pt per second remaining
    if (selectedIdx === Number(correctIdx)) {
        playDing();
        arena.score += (10 + arena.timer);
    }

    // Sync score immediately
    await fetch('/api/arena', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ action: 'sync', room_code: arena.code, player_num: arena.playerNum, total_score: arena.score })
    });

    arena.currentQ++;
    loadArenaQuestion();
}

// 6. Finish & Wait for Opponent
async function finishArenaGame() {
    document.getElementById('arenaBattle').classList.add('hidden');
    document.getElementById('arenaResultText').innerHTML = `<div class="pulse-text" style="font-size:20px;">Waiting for opponent to finish...</div>`;
    document.getElementById('arenaResult').classList.remove('hidden');

    // Send finished flag
    await fetch('/api/arena', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ action: 'sync', room_code: arena.code, player_num: arena.playerNum, total_score: arena.score, is_finished: true })
    });
}

// 7. Show Final Winner
function showArenaResult(room) {
    const myScore = arena.playerNum === 1 ? room.player1_score : room.player2_score;
    const opScore = arena.playerNum === 1 ? room.player2_score : room.player1_score;

    document.getElementById('finalP1').innerHTML = `<strong>${room.player1_name}:</strong> ${room.player1_score} pts`;
    document.getElementById('finalP2').innerHTML = `<strong>${room.player2_name}:</strong> ${room.player2_score} pts`;

    if (myScore > opScore) {
        document.getElementById('arenaResultText').innerHTML = `<div class="winner-text">🏆 YOU WIN!</div>`;
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    } else if (myScore < opScore) {
        document.getElementById('arenaResultText').innerHTML = `<div class="loser-text">☠️ YOU LOST!</div>`;
    } else {
        document.getElementById('arenaResultText').innerHTML = `<div class="winner-text" style="color:#facc15;">🤝 IT'S A TIE!</div>`;
    }
}
</script>

</body>
</html>
