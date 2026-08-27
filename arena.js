/* =====================================================
   ARENA 1v1 LOGIC (ANIMATED, MULTI-TOPIC & DYNAMIC TIMER)
===================================================== */
let arena = { 
  code: null, 
  playerNum: 1, 
  name: '', 
  score: 0, 
  questions: [], 
  currentQ: 0, 
  timer: 15, 
  timeLimit: 15,
  streak: 0,
  interval: null, 
  pollInterval: null, 
  isBotMatch: false, 
  botScore: 0 
};

function startBotMatch() {
    const name = document.getElementById('arenaPlayerName')?.value.trim() || 'Player 1';
    const timerSec = parseInt(document.getElementById('arenaTimePerQ')?.value, 10) || 15;
    const qCount = parseInt(document.getElementById('arenaQuestionCount')?.value, 10) || 5;

    arena.isBotMatch = true; 
    arena.name = name; 
    arena.playerNum = 1; 
    arena.score = 0; 
    arena.botScore = 0;
    arena.timeLimit = timerSec;
    arena.streak = 0;

    const samplePool = [
        { question_text: "What is the SI unit of force? / बल का SI मात्रक क्या है?", options: ["Newton (न्यूटन)", "Joule (जूल)", "Pascal (पास्कल)", "Watt (वाट)"], correct_option: 0, explanation: "Force = mass × acceleration, measured in Newtons." },
        { question_text: "Which particle carries a negative charge? / कौन सा कण ऋणात्मक आवेश वहन करता है?", options: ["Proton (प्रोटॉन)", "Neutron (न्यूट्रॉन)", "Electron (इलेक्ट्रॉन)", "Positron (पॉज़िट्रॉन)"], correct_option: 2, explanation: "Electrons have a charge of -1.6 × 10⁻¹⁹ C." },
        { question_text: "Formula for kinetic energy: / गतिज ऊर्जा का सूत्र है:", options: ["1/2 mv²", "mgh", "F×d", "mv"], correct_option: 0, explanation: "KE = 1/2 m v²." },
        { question_text: "Which gas is released during photosynthesis? / प्रकाश संश्लेषण में कौन सी गैस निकलती है?", options: ["CO2", "Oxygen (ऑक्सीजन)", "Nitrogen", "Hydrogen"], correct_option: 1, explanation: "Plants split water molecules to release Oxygen (O2)." },
        { question_text: "Value of acceleration due to gravity (g) on Earth:", options: ["9.8 m/s²", "8.9 m/s²", "10.8 m/s²", "12 m/s²"], correct_option: 0, explanation: "Standard standard gravity at sea level is ~9.8 m/s²." }
    ];

    arena.questions = samplePool.slice(0, qCount);
    const p1 = document.getElementById('uiP1Name'); if(p1) p1.textContent = name;
    const p2 = document.getElementById('uiP2Name'); if(p2) p2.textContent = "Invincible AI 🤖";
    const s1 = document.getElementById('uiP1Score'); if(s1) s1.textContent = "0";
    const s2 = document.getElementById('uiP2Score'); if(s2) s2.textContent = "0";
    updateClashBar(0, 0);
    startArenaGame();
}

const btnCreate = document.getElementById('btnCreateRoom');
if (btnCreate) {
  btnCreate.onclick = async () => {
    const name = document.getElementById('arenaPlayerName').value.trim();
    const className = document.getElementById('arenaClass').value;
    const subject = document.getElementById('arenaSubject').value;
    const chapter = document.getElementById('arenaChapter').value.trim();
    const timePerQ = document.getElementById('arenaTimePerQ').value;
    const qCount = document.getElementById('arenaQuestionCount').value;

    if(!name) return alert("Please enter your battle tag name.");

    const originalText = btnCreate.textContent;
    btnCreate.disabled = true;
    btnCreate.textContent = "⚡ GENERATING BATTLE...";

    try {
        const res = await fetch('/api/arena', { 
            method: 'POST', 
            headers: {'Content-Type': 'application/json'}, 
            body: JSON.stringify({ 
                action: 'create', 
                player_name: name, 
                class_name: className,
                subject: subject,
                chapter: chapter,
                time_per_question: timePerQ,
                question_count: qCount
            }) 
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

        document.getElementById('arenaSetup').classList.add('hidden');
        document.getElementById('arenaWaiting').classList.remove('hidden');
        document.getElementById('displayRoomCode').textContent = arena.code;
        
        startArenaVoiceChat(arena.code);
        arena.pollInterval = setInterval(pollRoomState, 2000);
    } catch(err) { 
        alert("Arena Error: " + err.message); 
    } finally {
        btnCreate.disabled = false;
        btnCreate.textContent = originalText;
    }
  };
}

const btnJoin = document.getElementById('btnJoinRoom');
if (btnJoin) {
  btnJoin.onclick = async () => {
    const name = document.getElementById('arenaPlayerName').value.trim();
    const code = document.getElementById('arenaJoinCode').value.trim();
    if(!name || !code) return alert("Enter your name and the 4-digit code.");

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

        document.getElementById('uiP1Name').textContent = data.room.player1_name;
        document.getElementById('uiP2Name').textContent = name;
        
        startArenaVoiceChat(code);
        startArenaGame();
        arena.pollInterval = setInterval(pollRoomState, 2000);
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
            document.getElementById('uiP1Name').textContent = arena.name;
            document.getElementById('uiP2Name').textContent = room.player2_name;
            startArenaGame();
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
    const total = p1Score + p2Score;
    let p1Percent = 50;
    if (total > 0) {
        p1Percent = Math.min(Math.max((p1Score / total) * 100, 15), 85);
    }
    const fill1 = document.getElementById('vsFillP1');
    const fill2 = document.getElementById('vsFillP2');
    if (fill1) fill1.style.width = p1Percent + '%';
    if (fill2) fill2.style.width = (100 - p1Percent) + '%';
}

function startArenaGame() {
    document.getElementById('arenaSetup').classList.add('hidden');
    document.getElementById('arenaWaiting').classList.add('hidden');
    document.getElementById('arenaBattle').classList.remove('hidden');
    arena.currentQ = 0; 
    loadArenaQuestion();
}

function loadArenaQuestion() {
    if (arena.currentQ >= arena.questions.length) { 
        stopArenaVoiceChat();
        finishArenaGame(); 
        return; 
    }

    const q = arena.questions[arena.currentQ];
    
    let streakEmoji = '';
    if (arena.streak >= 5) streakEmoji = ' 🔥 GODLIKE STREAK x' + arena.streak;
    else if (arena.streak >= 3) streakEmoji = ' ⚡ ON FIRE x' + arena.streak;

    const qNumEl = document.getElementById('arenaQNum');
    if (qNumEl) qNumEl.innerHTML = `QUESTION ${arena.currentQ + 1}/${arena.questions.length} <span style="color:var(--accent-amber); font-weight:900;">${streakEmoji}</span>`;
    
    const qTextEl = document.getElementById('arenaQText');
    if (qTextEl) qTextEl.textContent = q.question_text || q.question;
    
    let optsHTML = '';
    const opts = q.options || [q.option_1, q.option_2, q.option_3, q.option_4];
    opts.forEach((opt, idx) => {
        const correctIdx = q.correct_option !== undefined ? q.correct_option : q.answer;
        optsHTML += `<div class="arena-option" onclick="handleArenaAnswer(this, ${idx}, ${correctIdx})">${opt}</div>`;
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
            handleArenaAnswer(null, -1, -1);
        }
    }, 1000);
}

async function handleArenaAnswer(element, selectedIdx, correctIdx) {
    clearInterval(arena.interval);
    
    if (selectedIdx === Number(correctIdx)) {
        if(element) element.classList.add('hit-correct');
        if(typeof playDing === 'function') playDing(); 
        arena.streak++;
        
        const speedBonus = arena.timer > (arena.timeLimit / 2) ? 5 : 0;
        arena.score += (10 + arena.timer + speedBonus);

        if (arena.streak >= 3) {
          if(typeof playComboDrop === 'function') playComboDrop(arena.streak);
          if(typeof confetti === 'function') confetti({ particleCount: 25, spread: 35, origin: { y: 0.7 } });
        }
    } else {
        if(typeof playBuzz === 'function') playBuzz();
        if(typeof triggerHaptic === 'function') triggerHaptic([90]);
        arena.streak = 0;
        const card = document.getElementById('arenaCardContainer');
        if (card) {
          card.classList.add('arena-shake');
          setTimeout(() => card.classList.remove('arena-shake'), 400);
        }
    }

    if (arena.isBotMatch) {
        if (Math.random() > 0.35) arena.botScore += (10 + Math.floor(Math.random() * 8));
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
    if (myScore > opScore) {
        if(typeof playWin === 'function') playWin();
        if(typeof triggerHaptic === 'function') triggerHaptic([40, 60, 80]);
        if (resultTextEl) {
          resultTextEl.innerHTML = `
              <div style="font-size:42px; margin-bottom:4px;">👑</div>
              <div style="font-size:26px; font-weight:900; color:var(--accent-emerald); letter-spacing:1px;">DOMINANT VICTORY</div>
              <div style="color:var(--text-muted); font-size:13px; margin-top:4px;">You crushed the arena duel! +100 Clout XP 🔥</div>
          `;
        }
        if(typeof confetti === 'function') confetti({ particleCount: 140, spread: 80, origin: { y: 0.5 } });
    } else if(myScore === opScore) {
        if (resultTextEl) {
          resultTextEl.innerHTML = `
              <div style="font-size:42px; margin-bottom:4px;">🤝</div>
              <div style="font-size:24px; font-weight:900; color:var(--accent-amber); letter-spacing:1px;">STALEMATE TIE</div>
              <div style="color:var(--text-muted); font-size:13px; margin-top:4px;">Evenly matched gladiators. +50 XP</div>
          `;
        }
    } else {
        if (resultTextEl) {
          resultTextEl.innerHTML = `
              <div style="font-size:42px; margin-bottom:4px;">💥</div>
              <div style="font-size:24px; font-weight:900; color:var(--accent-rose); letter-spacing:1px;">DEFEATED</div>
              <div style="color:var(--text-muted); font-size:13px; margin-top:4px;">Review formulas and seek redemption.</div>
          `;
        }
    }
}

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
