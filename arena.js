/* =====================================================
   ⚡ INVINCIBLE 360 - 1v1 BATTLE ARENA MASTER ENGINE
   - Cinematic Matchmaking & VS Match Cards
   - 3-2-1 Countdown Sequence
   - Combo Multipliers (x1.2 to x2.5 GODLIKE)
   - Neon Beam-Clash Tug-of-War Canvas Engine
   - Tactical Weapons (50:50 Laser Slice & Cryo-Freeze)
   - Real-Time P2P WebRTC Voice Chat Engine
   - 🧠 TELEMETRY HOOKED: Time-Pressure Tracking
===================================================== */

let arena = { 
  code: null, 
  playerNum: 1, 
  name: '', 
  score: 0, 
  questions: [], 
  currentQ: 0,
  correctAnswerIndex: -1, 
  timer: 15, 
  timeLimit: 15,
  streak: 0,
  highestStreak: 0,
  comboMultiplier: 1.0,
  interval: null, 
  pollInterval: null, 
  isBotMatch: false, 
  botScore: 0,
  botFrozenUntil: 0
};

/* =====================================================
   VISUAL ENGINE: CANVAS BEAM CLASH
===================================================== */
const ArenaVisualEngine = {
    canvas: null,
    ctx: null,
    w: 0, h: 0,
    tugPos: 0.5,
    targetTug: 0.5,
    particles: [],
    shockwaves: [],
    loop: null,
    
    init: function() {
        const wrap = document.querySelector('.vs-progress-bar-wrap');
        if (!wrap) return;
        
        if (!this.canvas) {
            this.canvas = document.createElement('canvas');
            this.canvas.style.position = 'absolute';
            this.canvas.style.inset = '0';
            this.canvas.style.width = '100%';
            this.canvas.style.height = '100%';
            this.canvas.style.borderRadius = '8px';
            this.canvas.style.pointerEvents = 'none';
            this.canvas.style.zIndex = '10';
            wrap.style.position = 'relative';
            wrap.appendChild(this.canvas);
        }

        const cssFills = wrap.querySelectorAll('div');
        cssFills.forEach(d => { if (d !== this.canvas) d.style.display = 'none'; });

        const dpr = window.devicePixelRatio || 1;
        const rect = wrap.getBoundingClientRect();
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.w = this.canvas.width;
        this.h = this.canvas.height;
        this.ctx = this.canvas.getContext('2d');
        this.ctx.scale(dpr, dpr);
        this.w /= dpr;
        this.h /= dpr;

        this.particles = [];
        this.shockwaves = [];
        this.tugPos = 0.5;
        this.targetTug = 0.5;

        if (!this.loop) this.render();
    },

    setTug: function(p1, p2) {
        const total = p1 + p2;
        if (total === 0) {
            this.targetTug = 0.5;
        } else {
            let ratio = p1 / total;
            this.targetTug = Math.max(0.10, Math.min(0.90, ratio));
        }
    },

    triggerShockwave: function(playerNum, intensity = 1) {
        this.shockwaves.push({
            x: playerNum === 1 ? 0 : this.w,
            radius: 5 * intensity,
            color: playerNum === 1 ? '#00e5ff' : '#f43f5e',
            dir: playerNum === 1 ? 1 : -1,
            life: 1.0,
            intensity: intensity
        });
    },

    triggerGlitch: function(playerNum) {
        const clashX = this.tugPos * this.w;
        for(let i=0; i<12; i++) {
            this.particles.push({
                x: clashX,
                y: this.h / 2,
                vx: (Math.random() * 8) * (playerNum === 1 ? -1 : 1),
                vy: (Math.random() - 0.5) * 8,
                life: 1.0,
                color: playerNum === 1 ? '#00e5ff' : '#f43f5e'
            });
        }
    },

    render: function() {
        if (!this.ctx) return;
        this.ctx.clearRect(0, 0, this.w, this.h);

        this.tugPos += (this.targetTug - this.tugPos) * 0.08;
        const clashX = this.tugPos * this.w;

        // Player 1 Beam
        this.ctx.fillStyle = 'rgba(0, 229, 255, 0.25)';
        this.ctx.fillRect(0, 0, clashX, this.h);
        this.ctx.fillStyle = '#00e5ff';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = '#00e5ff';
        this.ctx.fillRect(0, this.h/2 - 2, clashX, 4);

        // Player 2 Beam
        this.ctx.fillStyle = 'rgba(244, 63, 94, 0.25)';
        this.ctx.shadowBlur = 0;
        this.ctx.fillRect(clashX, 0, this.w - clashX, this.h);
        this.ctx.fillStyle = '#f43f5e';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = '#f43f5e';
        this.ctx.fillRect(clashX, this.h/2 - 2, this.w - clashX, 4);

        this.ctx.shadowBlur = 0;

        for (let i = this.shockwaves.length - 1; i >= 0; i--) {
            let sw = this.shockwaves[i];
            sw.x += sw.dir * (16 + (sw.intensity * 2)); 
            sw.radius += 1.2;
            sw.life -= 0.04;

            if (sw.life <= 0 || (sw.dir === 1 && sw.x >= clashX) || (sw.dir === -1 && sw.x <= clashX)) {
                this.shockwaves.splice(i, 1);
                for(let p = 0; p < (10 * sw.intensity); p++) {
                    this.particles.push({
                        x: clashX, 
                        y: this.h / 2,
                        vx: (Math.random() - 0.5) * 12 + (sw.dir * 4), 
                        vy: (Math.random() - 0.5) * 12,
                        life: 1.0, 
                        color: sw.color
                    });
                }
                continue;
            }

            this.ctx.beginPath();
            this.ctx.arc(sw.x, this.h / 2, sw.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(${sw.color === '#00e5ff' ? '0,229,255' : '244,63,94'}, ${sw.life})`;
            this.ctx.fill();
        }

        for (let i = this.particles.length - 1; i >= 0; i--) {
            let p = this.particles[i];
            p.x += p.vx; p.y += p.vy;
            p.life -= 0.05;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = p.life;
            this.ctx.fill();
            this.ctx.globalAlpha = 1.0;
        }

        this.ctx.beginPath();
        this.ctx.arc(clashX, this.h / 2, 8 + Math.random() * 4, 0, Math.PI * 2);
        this.ctx.fillStyle = '#fff';
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = '#fff';
        this.ctx.fill();
        this.ctx.shadowBlur = 0;

        this.loop = requestAnimationFrame(() => this.render());
    },

    stop: function() {
        if (this.loop) cancelAnimationFrame(this.loop);
        this.loop = null;
    }
};

/* =====================================================
   CINEMATIC MATCHMAKING & 3-2-1 INTRO SEQUENCE
===================================================== */
function triggerArenaMatchIntro(p1Name, p2Name, onComplete) {
    const existing = document.getElementById('arenaCinematicOverlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'arenaCinematicOverlay';
    overlay.style.cssText = "position:fixed; inset:0; z-index:99999; background:rgba(3,7,18,0.95); backdrop-filter:blur(16px); display:flex; flex-direction:column; align-items:center; justify-content:center; padding:20px; text-align:center;";

    overlay.innerHTML = `
      <div id="introMatchmakingStage" style="display:flex; flex-direction:column; align-items:center;">
        <div style="position:relative; width:80px; height:80px; margin-bottom:16px; display:flex; align-items:center; justify-content:center;">
           <div style="position:absolute; inset:0; border-radius:50%; border:2px solid #00e5ff; animation:ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite; opacity:0.6;"></div>
           <div style="width:56px; height:56px; border-radius:50%; background:linear-gradient(135deg, #00e5ff, #0284c7); display:flex; align-items:center; justify-content:center; font-size:24px; box-shadow:0 0 25px rgba(0,229,255,0.6);">⚡</div>
        </div>
        <div style="font-family:'Space Grotesk',sans-serif; font-size:18px; font-weight:900; color:#fff; letter-spacing:1px; margin-bottom:4px;">CONNECTING TO ARENA...</div>
        <div style="font-size:11px; color:#94a3b8; font-weight:700;">Matching syllabus difficulty & ping</div>
      </div>

      <div id="introVsStage" style="display:none; width:100%; max-width:340px; flex-direction:column; align-items:center; animation:popIn 0.3s cubic-bezier(0.175,0.885,0.32,1.275);">
        <div style="font-size:11px; font-weight:900; color:var(--accent-cyan); letter-spacing:2px; text-transform:uppercase; margin-bottom:16px;">⚔️ OPPONENT FOUND</div>
        
        <div style="display:flex; align-items:center; justify-content:space-between; width:100%; margin-bottom:24px;">
          <!-- Player 1 Card -->
          <div style="flex:1; background:rgba(0,229,255,0.06); border:1px solid rgba(0,229,255,0.3); border-radius:16px; padding:12px; text-align:center;">
            <div style="width:44px; height:44px; border-radius:50%; background:#00e5ff; color:#000; font-weight:900; font-size:18px; display:flex; align-items:center; justify-content:center; margin:0 auto 6px auto; box-shadow:0 0 15px rgba(0,229,255,0.4);">${p1Name.charAt(0).toUpperCase()}</div>
            <div style="font-size:12px; font-weight:900; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${p1Name}</div>
            <div style="font-size:9px; font-weight:800; color:#00e5ff;">RANK #1</div>
          </div>

          <div style="font-family:'Space Grotesk',sans-serif; font-size:22px; font-weight:900; color:#f43f5e; padding:0 12px; text-shadow:0 0 15px rgba(244,63,94,0.6);">VS</div>

          <!-- Player 2 Card -->
          <div style="flex:1; background:rgba(244,63,94,0.06); border:1px solid rgba(244,63,94,0.3); border-radius:16px; padding:12px; text-align:center;">
            <div style="width:44px; height:44px; border-radius:50%; background:#f43f5e; color:#fff; font-weight:900; font-size:18px; display:flex; align-items:center; justify-content:center; margin:0 auto 6px auto; box-shadow:0 0 15px rgba(244,63,94,0.4);">${p2Name.charAt(0).toUpperCase()}</div>
            <div style="font-size:12px; font-weight:900; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${p2Name}</div>
            <div style="font-size:9px; font-weight:800; color:#f43f5e;">CHALLENGER</div>
          </div>
        </div>

        <div id="introCountdownNum" style="font-family:'Space Grotesk',sans-serif; font-size:54px; font-weight:900; color:#fbbf24; text-shadow:0 0 30px rgba(251,191,36,0.6);">3</div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Sequence timing
    setTimeout(() => {
        const mmStage = document.getElementById('introMatchmakingStage');
        const vsStage = document.getElementById('introVsStage');
        if (mmStage) mmStage.style.display = 'none';
        if (vsStage) vsStage.style.display = 'flex';
        if (typeof playDing === 'function') playDing();

        let count = 3;
        const countNum = document.getElementById('introCountdownNum');

        const cdInterval = setInterval(() => {
            count--;
            if (count > 0) {
                if (countNum) {
                    countNum.textContent = count;
                    countNum.style.transform = 'scale(1.2)';
                    setTimeout(() => { if (countNum) countNum.style.transform = 'scale(1)'; }, 150);
                }
                if (typeof playTick === 'function') playTick();
            } else if (count === 0) {
                if (countNum) {
                    countNum.textContent = "BATTLE!";
                    countNum.style.color = "#10b981";
                    countNum.style.fontSize = "40px";
                }
                if (typeof playWin === 'function') playWin();
                if (typeof triggerHaptic === 'function') triggerHaptic([50, 50]);
            } else {
                clearInterval(cdInterval);
                overlay.style.opacity = '0';
                overlay.style.transition = 'opacity 0.25s ease';
                setTimeout(() => {
                    overlay.remove();
                    if (typeof onComplete === 'function') onComplete();
                }, 250);
            }
        }, 750);

    }, 800);
}

/* =====================================================
   CORE ARENA GAMEPLAY LOGIC
===================================================== */
function startBotMatch() {
    const name = document.getElementById('arenaPlayerName')?.value.trim() || localStorage.getItem('studentName') || 'Player 1';
    const timerSec = parseInt(document.getElementById('arenaTimePerQ')?.value, 10) || 15;
    const qCount = parseInt(document.getElementById('arenaQuestionCount')?.value, 10) || 5;

    arena.isBotMatch = true; 
    arena.name = name; 
    arena.playerNum = 1; 
    arena.score = 0; 
    arena.botScore = 0;
    arena.timeLimit = timerSec;
    arena.streak = 0;
    arena.highestStreak = 0;
    arena.comboMultiplier = 1.0;
    arena.botFrozenUntil = 0;

    const samplePool = [
        { question_text: "What is the SI unit of force? / बल का SI मात्रक क्या है?", options: ["Newton (न्यूटन)", "Joule (जूल)", "Pascal (पास्कल)", "Watt (वाट)"], correct_option: 0, explanation: "Force = mass × acceleration, measured in Newtons." },
        { question_text: "Which particle carries a negative charge? / कौन सा कण ऋणात्मक आवेश वहन करता है?", options: ["Proton (प्रोटॉन)", "Neutron (न्यूट्रॉन)", "Electron (इलेक्ट्रॉन)", "Positron (पॉज़िट्रॉन)"], correct_option: 2, explanation: "Electrons have a charge of -1.6 × 10⁻¹⁹ C." },
        { question_text: "Formula for kinetic energy: / गतिज ऊर्जा का सूत्र है:", options: ["1/2 mv²", "mgh", "F×d", "mv"], correct_option: 0, explanation: "KE = 1/2 m v²." },
        { question_text: "Which gas is released during photosynthesis? / प्रकाश संश्लेषण में कौन सी गैस निकलती है?", options: ["CO2", "Oxygen (ऑक्सीजन)", "Nitrogen", "Hydrogen"], correct_option: 1, explanation: "Plants split water molecules to release Oxygen (O2)." },
        { question_text: "Value of acceleration due to gravity (g) on Earth:", options: ["9.8 m/s²", "8.9 m/s²", "10.8 m/s²", "12 m/s²"], correct_option: 0, explanation: "Standard gravity at sea level is ~9.8 m/s²." }
    ];

    arena.questions = samplePool.slice(0, qCount);
    
    triggerArenaMatchIntro(name, "Invincible AI 🤖", () => {
        const p1 = document.getElementById('uiP1Name'); if(p1) p1.textContent = name;
        const p2 = document.getElementById('uiP2Name'); if(p2) p2.textContent = "Invincible AI 🤖";
        const s1 = document.getElementById('uiP1Score'); if(s1) s1.textContent = "0";
        const s2 = document.getElementById('uiP2Score'); if(s2) s2.textContent = "0";
        
        updateClashBar(0, 0);
        startArenaGame();
    });
}

const btnCreate = document.getElementById('btnCreateRoom');
if (btnCreate) {
  btnCreate.onclick = async () => {
    const name = document.getElementById('arenaPlayerName')?.value.trim() || localStorage.getItem('studentName');
    const className = document.getElementById('arenaClass')?.value || '10';
    const subject = document.getElementById('arenaSubject')?.value || 'Physics';
    const chapter = document.getElementById('arenaChapter')?.value.trim() || 'General Syllabus';
    const timePerQ = document.getElementById('arenaTimePerQ')?.value || '15';
    const qCount = document.getElementById('arenaQuestionCount')?.value || '5';

    if(!name) return alert("Please enter your battle tag name.");

    const originalText = btnCreate.textContent;
    btnCreate.disabled = true;
    btnCreate.textContent = "⚡ GENERATING BATTLE...";

    try {
        const res = await fetch('/api/arena', { 
            method: 'POST', 
            headers: {'Content-Type': 'application/json'}, 
            body: JSON.stringify({ action: 'create', player_name: name, class_name: className, subject: subject, chapter: chapter, time_per_question: timePerQ, question_count: qCount }) 
        });
        const data = await res.json();
        if(data.error) throw new Error(data.error);

        arena.isBotMatch = false; 
        arena.code = data.room_code; 
        arena.questions = data.questions; 
        arena.name = name; 
        arena.playerNum = 1;
        arena.timeLimit = parseInt(data.time_per_question, 10) || parseInt(timePerQ, 10) || 15;
        arena.streak = 0;
        arena.highestStreak = 0;

        document.getElementById('arenaSetup').classList.add('hidden');
        document.getElementById('arenaWaiting').classList.remove('hidden');
        document.getElementById('displayRoomCode').textContent = arena.code;
        
        startArenaVoiceChat(arena.code);
        arena.pollInterval = setInterval(pollRoomState, 2000);
    } catch(err) { alert("Arena Error: " + err.message); } 
    finally { btnCreate.disabled = false; btnCreate.textContent = originalText; }
  };
}

const btnJoin = document.getElementById('btnJoinRoom');
if (btnJoin) {
  btnJoin.onclick = async () => {
    const name = document.getElementById('arenaPlayerName')?.value.trim() || localStorage.getItem('studentName');
    const code = document.getElementById('arenaJoinCode')?.value.trim();
    if(!name || !code) return alert("Enter your name and the 4-digit room code.");

    try {
        const res = await fetch('/api/arena', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ action: 'join', room_code: code, player_name: name }) });
        const data = await res.json();
        if(data.error) throw new Error(data.error);

        arena.isBotMatch = false; 
        arena.code = code; 
        arena.questions = data.questions; 
        arena.name = name; 
        arena.playerNum = 2;
        arena.timeLimit = 15;
        arena.streak = 0;
        arena.highestStreak = 0;

        triggerArenaMatchIntro(data.room.player1_name, name, () => {
            document.getElementById('uiP1Name').textContent = data.room.player1_name;
            document.getElementById('uiP2Name').textContent = name;
            startArenaVoiceChat(code);
            startArenaGame();
            arena.pollInterval = setInterval(pollRoomState, 2000);
        });
    } catch(err) { alert("Join Error: " + err.message); }
  };
}

async function pollRoomState() {
    if (arena.isBotMatch) return;
    try {
        const res = await fetch('/api/arena', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ action: 'sync', room_code: arena.code }) });
        const data = await res.json();
        if(!data.room) return;
        const room = data.room;

        if (arena.playerNum === 1 && room.player2_name && !document.getElementById('arenaWaiting').classList.contains('hidden')) {
            triggerArenaMatchIntro(arena.name, room.player2_name, () => {
                document.getElementById('uiP1Name').textContent = arena.name;
                document.getElementById('uiP2Name').textContent = room.player2_name;
                startArenaGame();
            });
        }
        if (document.getElementById('uiP1Score')) document.getElementById('uiP1Score').textContent = room.player1_score || 0;
        if (document.getElementById('uiP2Score')) document.getElementById('uiP2Score').textContent = room.player2_score || 0;
        
        updateClashBar(room.player1_score || 0, room.player2_score || 0);

        if (room.player1_finished && room.player2_finished) { 
            clearInterval(arena.pollInterval); 
            showArenaResult(room); 
        }
    } catch(e){}
}

function updateClashBar(p1Score, p2Score) {
    ArenaVisualEngine.setTug(p1Score, p2Score);
}

// INJECT TACTICAL POWER-UP DOCK INTO THE UI
function injectPowerupDock() {
    let dock = document.getElementById('arenaPowerupDock');
    if (!dock) {
        dock = document.createElement('div');
        dock.id = 'arenaPowerupDock';
        dock.style.cssText = "position:absolute; bottom:120px; right:16px; display:flex; flex-direction:column; gap:16px; z-index:50;";
        
        const battleArea = document.getElementById('arenaBattle');
        if (battleArea) {
            battleArea.style.position = "relative";
            battleArea.appendChild(dock);
        }
    }

    const count50 = parseInt(localStorage.getItem('blitz_pup_fiftyFifty') || '1', 10);
    const countFreeze = parseInt(localStorage.getItem('blitz_pup_timeFreeze') || '1', 10);

    dock.innerHTML = `
        <button onclick="activateArena5050()" style="position:relative; width:48px; height:48px; border-radius:50%; background:rgba(244,63,94,0.15); border:2px solid var(--accent-rose); font-size:22px; box-shadow:0 0 15px rgba(244,63,94,0.4); display:flex; justify-content:center; align-items:center; cursor:pointer; backdrop-filter:blur(8px);">
            ✂️
            <span id="badge50" style="position:absolute; top:-6px; right:-6px; background:var(--accent-rose); color:#fff; font-size:11px; font-weight:900; width:20px; height:20px; border-radius:50%; display:flex; justify-content:center; align-items:center;">${count50}</span>
        </button>
        <button onclick="activateArenaTimeFreeze()" style="position:relative; width:48px; height:48px; border-radius:50%; background:rgba(0,229,255,0.15); border:2px solid var(--accent-cyan); font-size:22px; box-shadow:0 0 15px rgba(0,229,255,0.4); display:flex; justify-content:center; align-items:center; cursor:pointer; backdrop-filter:blur(8px);">
            ❄️
            <span id="badgeFreeze" style="position:absolute; top:-6px; right:-6px; background:var(--accent-cyan); color:#000; font-size:11px; font-weight:900; width:20px; height:20px; border-radius:50%; display:flex; justify-content:center; align-items:center;">${countFreeze}</span>
        </button>
    `;
}

window.updateArenaPowerupBadges = function() {
    const badge50 = document.getElementById('badge50');
    const badgeFreeze = document.getElementById('badgeFreeze');
    if (badge50) badge50.textContent = localStorage.getItem('blitz_pup_fiftyFifty') || '0';
    if (badgeFreeze) badgeFreeze.textContent = localStorage.getItem('blitz_pup_timeFreeze') || '0';
}

function startArenaGame() {
    document.getElementById('arenaSetup').classList.add('hidden');
    document.getElementById('arenaWaiting').classList.add('hidden');
    document.getElementById('arenaBattle').classList.remove('hidden');
    
    ArenaVisualEngine.init();
    injectPowerupDock();

    arena.currentQ = 0; 
    loadArenaQuestion();
}

function showFloatingCombatText(text, color = '#10b981') {
    const battleArea = document.getElementById('arenaBattle');
    if (!battleArea) return;

    const floatEl = document.createElement('div');
    floatEl.style.cssText = `position:absolute; top:40%; left:50%; transform:translate(-50%, -50%) scale(0.8); color:${color}; font-family:'Space Grotesk',sans-serif; font-size:24px; font-weight:900; text-shadow:0 0 20px ${color}; pointer-events:none; z-index:90; transition:all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); opacity:1;`;
    floatEl.innerHTML = text;
    battleArea.appendChild(floatEl);

    setTimeout(() => {
        floatEl.style.transform = 'translate(-50%, -100%) scale(1.1)';
        floatEl.style.opacity = '0';
    }, 50);

    setTimeout(() => floatEl.remove(), 550);
}

function loadArenaQuestion() {
    if (arena.currentQ >= arena.questions.length) { 
        stopArenaVoiceChat();
        finishArenaGame(); 
        return; 
    }

    const q = arena.questions[arena.currentQ];
    
    let streakEmoji = '';
    if (arena.streak >= 5) streakEmoji = ' 🔥 GODLIKE x' + arena.streak + ' (2.5x)';
    else if (arena.streak >= 3) streakEmoji = ' ⚡ COMBO x' + arena.streak + ' (1.5x)';
    else if (arena.streak >= 2) streakEmoji = ' 🎯 STREAK x' + arena.streak + ' (1.2x)';

    const qNumEl = document.getElementById('arenaQNum');
    if (qNumEl) qNumEl.innerHTML = `QUESTION ${arena.currentQ + 1}/${arena.questions.length} <span style="color:var(--accent-amber); font-weight:900;">${streakEmoji}</span>`;
    
    const qTextEl = document.getElementById('arenaQText');
    if (qTextEl) qTextEl.textContent = q.question_text || q.question;
    
    arena.correctAnswerIndex = q.correct_option !== undefined ? q.correct_option : q.answer;

    let optsHTML = '';
    const opts = q.options || [q.option_1, q.option_2, q.option_3, q.option_4];
    opts.forEach((opt, idx) => {
        optsHTML += `<div class="arena-option" id="arenaOpt_${idx}" onclick="handleArenaAnswer(this, ${idx}, ${arena.correctAnswerIndex})">${opt}</div>`;
    });
    const optsEl = document.getElementById('arenaOptions');
    if (optsEl) optsEl.innerHTML = optsHTML;
    
    arena.timer = arena.timeLimit;
    const timerDisplay = document.getElementById('arenaTimerDisplay');
    if (timerDisplay) {
      timerDisplay.textContent = `⏱ ${arena.timer}s`;
      timerDisplay.classList.remove('panic');
    }
    
    clearInterval(arena.interval);
    arena.interval = setInterval(() => {
        arena.timer--; 
        if (timerDisplay) {
          timerDisplay.textContent = `⏱ ${arena.timer}s`;
          if (arena.timer <= 3) {
              timerDisplay.classList.add('panic');
              if (typeof playTick === 'function') playTick();
          }
        }
        if (arena.timer <= 0) {
            handleArenaAnswer(null, -1, arena.correctAnswerIndex);
        }
    }, 1000);
}

async function handleArenaAnswer(element, selectedIdx, correctIdx) {
    clearInterval(arena.interval);

    // =====================================================
    // 🧠 INJECTED TELEMETRY HOOK: Time-Pressure Tracking
    // =====================================================
    if (window.InvincibleTelemetry && arena.questions[arena.currentQ]) {
        const currentQ = arena.questions[arena.currentQ];
        const isCorrect = (selectedIdx === Number(correctIdx));
        const isPanic = (arena.timer <= 4); // Answered with 4 or fewer seconds left
        
        // Grab subject info from DOM if available
        const subjectEl = document.getElementById('arenaSubject');
        const topicEl = document.getElementById('arenaChapter');
        const subject = subjectEl ? subjectEl.value : 'Arena Battle';
        const topic = topicEl ? topicEl.value : 'Time Pressure Match';

        // 1. If wrong under pressure, send a specific Panic Mistake to the Vault
        if (!isCorrect && selectedIdx !== -1) {
            window.InvincibleTelemetry.emit('MISTAKE_LOGGED', {
                subject: subject,
                topic: topic,
                mistakeType: isPanic ? "TIME_PRESSURE_PANIC" : "CONCEPTUAL_ERROR",
                originalQuestion: currentQ.question_text || currentQ.question,
                studentAnswer: "Option " + (selectedIdx + 1),
                correctAnswer: "Option " + (correctIdx + 1)
            });
        }
        
        // 2. Adjust overall global mastery based on high-pressure performance
        const masteryDelta = isCorrect ? (isPanic ? 3 : 1) : -2; // High reward for clutch answers
        window.InvincibleTelemetry.updateMastery(topic, masteryDelta);
    }
    // =====================================================
    
    if (selectedIdx === Number(correctIdx)) {
        if(element) element.classList.add('hit-correct');
        if(typeof playDing === 'function') playDing(); 
        
        arena.streak++;
        if (arena.streak > arena.highestStreak) arena.highestStreak = arena.streak;

        // Dynamic Combo Multipliers
        let multiplier = 1.0;
        let comboTag = "CRITICAL HIT!";
        if (arena.streak >= 5) { multiplier = 2.5; comboTag = "🔥 GODLIKE COMBO!"; }
        else if (arena.streak >= 3) { multiplier = 1.5; comboTag = "⚡ COMBO x" + arena.streak; }
        else if (arena.streak >= 2) { multiplier = 1.2; comboTag = "🎯 2x HIT"; }

        const speedBonus = arena.timer > (arena.timeLimit / 2) ? 8 : 0;
        const earnedPoints = Math.round((10 + arena.timer + speedBonus) * multiplier);
        arena.score += earnedPoints;

        showFloatingCombatText(`+${earnedPoints} PTS<br><span style="font-size:14px;">${comboTag}</span>`, '#10b981');
        ArenaVisualEngine.triggerShockwave(arena.playerNum, multiplier);

        if (arena.streak >= 3) {
          if(typeof playComboDrop === 'function') playComboDrop(arena.streak);
          if(typeof confetti === 'function') confetti({ particleCount: 30, spread: 45, origin: { y: 0.7 } });
        }
    } else {
        if(typeof playBuzz === 'function') playBuzz();
        if(typeof triggerHaptic === 'function') triggerHaptic([90]);
        
        if (arena.streak >= 2) {
            showFloatingCombatText("✕ COMBO BROKEN", '#f43f5e');
        }
        arena.streak = 0;
        
        const card = document.getElementById('arenaCardContainer');
        if (card) {
          card.classList.add('arena-shake');
          setTimeout(() => card.classList.remove('arena-shake'), 400);
        }

        ArenaVisualEngine.triggerGlitch(arena.playerNum);
    }

    if (arena.isBotMatch) {
        // Apply Ice Freeze logic to Bot
        const isBotFrozen = arena.botFrozenUntil && Date.now() < arena.botFrozenUntil;
        if (!isBotFrozen && Math.random() > 0.35) {
            arena.botScore += (10 + Math.floor(Math.random() * 8));
        }

        const p1s = document.getElementById('uiP1Score'); if (p1s) p1s.textContent = arena.score;
        const p2s = document.getElementById('uiP2Score'); if (p2s) p2s.textContent = arena.botScore;
        updateClashBar(arena.score, arena.botScore);
    } else {
        fetch('/api/arena', { 
            method: 'POST', 
            headers: {'Content-Type': 'application/json'}, 
            body: JSON.stringify({ action: 'sync', room_code: arena.code, player_num: arena.playerNum, total_score: arena.score }) 
        });
    }

    setTimeout(() => {
        arena.currentQ++; 
        loadArenaQuestion();
    }, 450);
}

function finishArenaGame() {
    document.getElementById('arenaBattle').classList.add('hidden');
    ArenaVisualEngine.stop(); 

    const oldIce = document.getElementById('iceOverlayEffect');
    if (oldIce) oldIce.remove();

    if (arena.isBotMatch) {
        showArenaResult({ player1_name: arena.name, player1_score: arena.score, player2_name: "Invincible AI", player2_score: arena.botScore });
    } else {
        const resText = document.getElementById('arenaResultText');
        if (resText) resText.innerHTML = `<div style="color:var(--accent-cyan); font-weight:800; font-size:18px;">⚡ Match Complete! Awaiting Final Verdict...</div>`;
        document.getElementById('arenaResult').classList.remove('hidden');
        fetch('/api/arena', { 
            method: 'POST', 
            headers: {'Content-Type': 'application/json'}, 
            body: JSON.stringify({ action: 'sync', room_code: arena.code, player_num: arena.playerNum, total_score: arena.score, is_finished: true }) 
        });
    }
}

function showArenaResult(room) {
    const p1 = room.player1_score || 0;
    const p2 = room.player2_score || 0;
    const isP1 = arena.playerNum === 1;
    const myScore = isP1 ? p1 : p2;
    const opScore = isP1 ? p2 : p1;

    const fp1 = document.getElementById('finalP1'); if (fp1) fp1.textContent = `${p1} PTS`;
    const fp2 = document.getElementById('finalP2'); if (fp2) fp2.textContent = `${p2} PTS`;
    document.getElementById('arenaResult').classList.remove('hidden');

    const resultTextEl = document.getElementById('arenaResultText');
    const isWin = myScore > opScore;
    const isTie = myScore === opScore;

    // Calculate XP Rewards
    let earnedXP = isWin ? 100 : (isTie ? 40 : 20);
    earnedXP += (arena.highestStreak * 10);

    // Update global student XP
    const xpEl = document.getElementById('xpCounter');
    let currentXP = parseInt(xpEl?.textContent || localStorage.getItem('student_xp') || '680', 10);
    currentXP += earnedXP;
    if (xpEl) xpEl.textContent = currentXP;
    localStorage.setItem('student_xp', currentXP.toString());

    if (isWin) {
        if(typeof playWin === 'function') playWin();
        if(typeof triggerHaptic === 'function') triggerHaptic([40, 60, 80]);
        if (resultTextEl) {
          resultTextEl.innerHTML = `
            <div style="font-size:42px; margin-bottom:4px;">👑</div>
            <div style="font-size:26px; font-weight:900; color:var(--accent-emerald);">DOMINANT VICTORY</div>
            <div style="display:inline-block; margin-top:8px; background:rgba(16,185,129,0.15); border:1px solid #10b981; color:#10b981; font-weight:900; font-size:12px; padding:4px 12px; border-radius:8px;">+${earnedXP} XP EARNED (Max Combo: x${arena.highestStreak})</div>
          `;
        }
        if(typeof confetti === 'function') confetti({ particleCount: 140, spread: 80, origin: { y: 0.5 } });
    } else if(isTie) {
        if (resultTextEl) {
          resultTextEl.innerHTML = `
            <div style="font-size:42px; margin-bottom:4px;">🤝</div>
            <div style="font-size:24px; font-weight:900; color:var(--accent-amber);">STALEMATE TIE</div>
            <div style="display:inline-block; margin-top:8px; background:rgba(251,191,36,0.15); border:1px solid #fbbf24; color:#fbbf24; font-weight:900; font-size:12px; padding:4px 12px; border-radius:8px;">+${earnedXP} XP EARNED</div>
          `;
        }
    } else {
        if (resultTextEl) {
          resultTextEl.innerHTML = `
            <div style="font-size:42px; margin-bottom:4px;">💥</div>
            <div style="font-size:24px; font-weight:900; color:var(--accent-rose);">DEFEATED</div>
            <div style="display:inline-block; margin-top:8px; background:rgba(244,63,94,0.15); border:1px solid #f43f5e; color:#f43f5e; font-weight:900; font-size:12px; padding:4px 12px; border-radius:8px;">+${earnedXP} XP FOR EFFORT</div>
          `;
        }
    }

    // Add Rematch Button
    let rematchBtn = document.getElementById('arenaRematchBtn');
    if (!rematchBtn) {
        rematchBtn = document.createElement('button');
        rematchBtn.id = 'arenaRematchBtn';
        rematchBtn.className = 'btn-primary';
        rematchBtn.style.cssText = "margin-top:16px; width:100%; background:linear-gradient(135deg, #00e5ff, #0284c7); font-weight:900; font-size:14px; padding:12px 0; border-radius:12px; cursor:pointer;";
        rematchBtn.textContent = "🔄 REMATCH OPPONENT";
        rematchBtn.onclick = () => {
            document.getElementById('arenaResult').classList.add('hidden');
            if (arena.isBotMatch) startBotMatch();
            else {
                document.getElementById('arenaSetup').classList.remove('hidden');
            }
        };
        const resBox = document.getElementById('arenaResult');
        if (resBox) resBox.appendChild(rematchBtn);
    }
}

/* =====================================================
   TACTICAL VISUAL WEAPONS (POWER-UPS)
===================================================== */
window.activateArena5050 = function() {
    let count = parseInt(localStorage.getItem('blitz_pup_fiftyFifty') || '0', 10);
    if (count <= 0) return alert("No 50:50 power-ups left! Win matches to recharge.");
    
    localStorage.setItem('blitz_pup_fiftyFifty', count - 1);
    updateArenaPowerupBadges();

    const opts = document.querySelectorAll('.arena-option');
    if (!opts || opts.length < 4 || arena.correctAnswerIndex < 0) return;
    
    if(typeof playDing === 'function') playDing(); 
    if(typeof triggerHaptic === 'function') triggerHaptic([50, 100]);

    let removed = 0;
    opts.forEach((opt, idx) => {
        if (idx !== arena.correctAnswerIndex && removed < 2) {
            opt.style.position = 'relative';
            opt.style.overflow = 'hidden';
            opt.style.pointerEvents = 'none';
            
            const laser = document.createElement('div');
            laser.style.cssText = "position:absolute; top:50%; left:-10%; width:0%; height:3px; background:#f43f5e; box-shadow:0 0 15px #f43f5e, 0 0 30px #f43f5e; z-index:10; transition:width 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);";
            opt.appendChild(laser);

            setTimeout(() => { laser.style.width = '120%'; }, 50);

            setTimeout(() => {
                opt.style.transition = 'all 0.4s ease';
                opt.style.transform = 'scale(0.95) rotate(-2deg)';
                opt.style.opacity = '0.3';
                opt.innerHTML = `<span style="text-decoration: line-through; color: #f43f5e;">${opt.innerText}</span>`;
            }, 350);

            removed++;
        }
    });
};

window.activateArenaTimeFreeze = function() {
    let count = parseInt(localStorage.getItem('blitz_pup_timeFreeze') || '0', 10);
    if (count <= 0) return alert("No Time Freeze power-ups left! Win matches to recharge.");
    
    localStorage.setItem('blitz_pup_timeFreeze', count - 1);
    updateArenaPowerupBadges();

    if(typeof playWin === 'function') playWin(); 
    if(typeof triggerHaptic === 'function') triggerHaptic([100, 50, 100]);

    arena.timer += 10;
    arena.botFrozenUntil = Date.now() + 5000; 

    const battleArea = document.getElementById('arenaBattle');
    if (battleArea) {
        const oldIce = document.getElementById('iceOverlayEffect');
        if (oldIce) oldIce.remove();

        const ice = document.createElement('div');
        ice.id = 'iceOverlayEffect';
        ice.style.cssText = "position:fixed; inset:0; pointer-events:none; z-index:9999; box-shadow:inset 0 0 120px 40px rgba(0, 229, 255, 0.4); border:12px solid rgba(0,229,255,0.5); background:rgba(0, 229, 255, 0.05); backdrop-filter:blur(3px); transition:opacity 0.5s ease;";
        document.body.appendChild(ice);

        const timerDisplay = document.getElementById('arenaTimerDisplay');
        if (timerDisplay) {
            timerDisplay.classList.remove('panic');
            timerDisplay.classList.add('frozen');
            timerDisplay.style.color = '#00e5ff';
            timerDisplay.style.textShadow = '0 0 20px #00e5ff';
        }

        setTimeout(() => {
            ice.style.opacity = '0';
            if (timerDisplay) {
                timerDisplay.classList.remove('frozen');
                timerDisplay.style.color = '';
                timerDisplay.style.textShadow = '';
            }
            setTimeout(() => ice.remove(), 500);
        }, 5000);
    }
};

/* =====================================================
   1v1 ARENA PEER-TO-PEER LIVE VOICE CHAT ENGINE
===================================================== */
let localVoiceStream = null;
let peerVoiceInstance = null;
let currentVoiceCall = null;
let isMicMuted = false;
let isSpeakerMuted = false;

async function startArenaVoiceChat(roomCode = 'default_arena') {
  const statusText = document.getElementById('voiceStatusText');
  const statusDot = document.getElementById('voiceStatusDot');

  try {
    if (statusText) statusText.textContent = "Requesting Mic...";

    if (!localVoiceStream) {
      localVoiceStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
        video: false
      });
    }

    const hostPeerId = `invincible_host_${roomCode}`;
    const guestPeerId = `invincible_guest_${roomCode}_${Math.floor(Math.random() * 10000)}`;

    if (peerVoiceInstance) {
      peerVoiceInstance.destroy();
      peerVoiceInstance = null;
    }

    peerVoiceInstance = new Peer(hostPeerId);

    peerVoiceInstance.on('open', () => {
      if (statusText) statusText.textContent = "Voice: Host Ready (Waiting)";
    });

    peerVoiceInstance.on('call', (incomingCall) => {
      incomingCall.answer(localVoiceStream);
      handleIncomingVoiceStream(incomingCall);
    });

    peerVoiceInstance.on('error', (err) => {
      if (err.type === 'unavailable-id') {
        peerVoiceInstance.destroy();
        peerVoiceInstance = new Peer(guestPeerId);

        peerVoiceInstance.on('open', () => {
          if (statusText) statusText.textContent = "Voice: Calling Host...";
          setTimeout(() => {
            callOpponentVoice(hostPeerId);
          }, 800);
        });

        peerVoiceInstance.on('call', (incomingCall) => {
          incomingCall.answer(localVoiceStream);
          handleIncomingVoiceStream(incomingCall);
        });
      } else {
        if (statusText) statusText.textContent = `Voice: ${err.type || 'Error'}`;
      }
    });
  } catch (err) {
    if (statusText) {
      statusText.textContent = `Mic Error: ${err.name === 'NotAllowedError' ? 'Permission Denied' : err.name}`;
    }
  }
}

function callOpponentVoice(targetPeerId) {
  if (!peerVoiceInstance || !localVoiceStream) return;
  const outgoingCall = peerVoiceInstance.call(targetPeerId, localVoiceStream);
  handleIncomingVoiceStream(outgoingCall);
}

function handleIncomingVoiceStream(call) {
  currentVoiceCall = call;
  const statusText = document.getElementById('voiceStatusText');
  const statusDot = document.getElementById('voiceStatusDot');

  call.on('stream', (remoteStream) => {
    let remoteAudio = document.getElementById('remoteArenaAudio');
    if (!remoteAudio) {
      remoteAudio = new Audio();
      remoteAudio.id = 'remoteArenaAudio';
      document.body.appendChild(remoteAudio);
    }
    
    remoteAudio.srcObject = remoteStream;
    remoteAudio.muted = false;
    remoteAudio.volume = 1.0;

    const playPromise = remoteAudio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        document.addEventListener('click', () => {
          remoteAudio.play();
        }, { once: true });
      });
    }

    if (statusText) statusText.textContent = "Voice: Connected 🟢";
    if (statusDot) statusDot.classList.add('connected');
  });

  call.on('close', () => stopArenaVoiceChat());
  call.on('error', (err) => console.error("Call error:", err));
}

function toggleArenaVoiceMute() {
  if (!localVoiceStream) return;
  isMicMuted = !isMicMuted;
  localVoiceStream.getAudioTracks().forEach(track => track.enabled = !isMicMuted);
  
  const btn = document.getElementById('voiceToggleMicBtn');
  if (btn) {
    btn.classList.toggle('muted', isMicMuted);
    btn.textContent = isMicMuted ? '🔇' : '🎙️';
  }
}

function toggleArenaSpeaker() {
  const remoteAudio = document.getElementById('remoteArenaAudio');
  if (!remoteAudio) return;
  isSpeakerMuted = !isSpeakerMuted;
  remoteAudio.muted = isSpeakerMuted;
  
  const btn = document.getElementById('voiceToggleSpeakerBtn');
  if (btn) {
    btn.classList.toggle('muted', isSpeakerMuted);
    btn.textContent = isSpeakerMuted ? '🔈' : '🔊';
  }
}

function stopArenaVoiceChat() {
  if (localVoiceStream) {
    localVoiceStream.getTracks().forEach(track => track.stop());
    localVoiceStream = null;
  }
  if (currentVoiceCall) {
    currentVoiceCall.close();
    currentVoiceCall = null;
  }
  if (peerVoiceInstance) {
    peerVoiceInstance.destroy();
    peerVoiceInstance = null;
  }
  
  const statusText = document.getElementById('voiceStatusText');
  const statusDot = document.getElementById('voiceStatusDot');
  if (statusText) statusText.textContent = "Voice: Disconnected";
  if (statusDot) statusDot.classList.remove('connected');
}
