/* =====================================================
   PORTAL SWIPE & TRACK GATEWAY CONTROLLER
===================================================== */
function openTrackPortal(track) {
  if(typeof playDing === 'function') playDing();
  document.getElementById('mainPortalRoot').classList.add('hidden');
  document.querySelector('.mission-card').classList.add('hidden');
  document.getElementById('storiesTray').classList.add('hidden');
  document.querySelector('.bento-grid').classList.add('hidden');
  
  if (track === 'study') {
    document.getElementById('studySubView').classList.remove('hidden');
    document.getElementById('battleSubView').classList.add('hidden');
  } else {
    document.getElementById('battleSubView').classList.remove('hidden');
    document.getElementById('studySubView').classList.add('hidden');
  }
}

function closeTrackPortals() {
  if(typeof playDing === 'function') playDing();
  document.getElementById('studySubView').classList.add('hidden');
  document.getElementById('battleSubView').classList.add('hidden');
  document.getElementById('mainPortalRoot').classList.remove('hidden');
  document.querySelector('.mission-card').classList.remove('hidden');
  document.getElementById('storiesTray').classList.remove('hidden');
  document.querySelector('.bento-grid').classList.remove('hidden');
}

/* =====================================================
   INTERACTIVE WAITING PIPELINES
===================================================== */
let doubtTimerInterval = null;
const doubtFacts = [
  "💡 Total Internal Reflection happens only when light travels from denser to rarer medium.",
  "💡 In lens formula, focal length of convex lens is ALWAYS positive (+f).",
  "💡 Ohm's law is NOT universal—it fails for diodes and semiconductors!",
  "💡 In redox reactions, oxidation is Loss of electrons (OIL) and reduction is Gain (RIG)."
];
let factIdx = 0;

function startDoubtWaitingPipeline() {
  const steps = [
    "🔍 Scanning question tokens...",
    "📐 Mapping CBSE marking scheme...",
    "🚨 Checking examiner traps & edge cases...",
    "✨ Compiling step-by-step breakdown..."
  ];
  let sIdx = 0;
  let progress = 10;
  
  const label = document.getElementById('doubtPipelineText');
  const bar = document.getElementById('doubtProgressFill');
  const fact = document.getElementById('doubtFactTicker');
  
  clearInterval(doubtTimerInterval);
  doubtTimerInterval = setInterval(() => {
    sIdx = (sIdx + 1) % steps.length;
    factIdx = (factIdx + 1) % doubtFacts.length;
    progress = Math.min(progress + 22, 92);
    
    if (label) label.textContent = steps[sIdx];
    if (bar) bar.style.width = progress + '%';
    if (fact) fact.textContent = doubtFacts[factIdx];
  }, 2200);
}

function stopDoubtWaitingPipeline() {
  clearInterval(doubtTimerInterval);
}

let chargedBonusXP = 0;
function chargeSupercharger() {
  chargedBonusXP += 1;
  if(typeof playSound === 'function') playSound('sine', 600 + (chargedBonusXP * 20), 0.08, 0.12);
  const display = document.getElementById('chargeBonusDisplay');
  if (display) display.textContent = `+${chargedBonusXP} Bonus XP Charged! ⚡`;
  
  const xpEl = document.getElementById('xpCounter');
  if (xpEl) {
    let cur = parseInt(xpEl.textContent || '680', 10);
    xpEl.textContent = cur + 1;
  }
}

function answerWarmup(btn, isCorrect) {
  const fb = document.getElementById('warmupFeedback');
  if (isCorrect) {
    if(typeof playDing === 'function') playDing();
    btn.style.borderColor = 'var(--accent-emerald)';
    btn.style.background = 'rgba(16, 185, 129, 0.2)';
    if (fb) fb.innerHTML = '<span style="color:var(--accent-emerald); font-weight:800;">✓ Correct! +10 XP</span>';
  } else {
    if(typeof playBuzz === 'function') playBuzz();
    btn.style.borderColor = 'var(--accent-rose)';
    if (fb) fb.innerHTML = '<span style="color:var(--accent-rose); font-weight:800;">Incorrect! Correct: Volt (V)</span>';
  }
}

function animateXP() {
    let xp = 0;
    const target = 680;
    const el = document.getElementById('xpCounter');
    if (!el) return;
    const timer = setInterval(() => {
        xp += 15;
        if(xp >= target) { xp = target; clearInterval(timer); }
        el.textContent = xp;
    }, 20);
}
setTimeout(animateXP, 500);

/* DAILY STREAK ENGINE */
function checkDailyStreak() {
    const today = new Date().toDateString();
    const lastVisit = localStorage.getItem('invincible_last_visit');
    let streak = parseInt(localStorage.getItem('invincible_streak') || '1', 10);

    if (lastVisit) {
        const lastDate = new Date(lastVisit);
        const diffDays = Math.floor((new Date(today) - lastDate) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            streak += 1;
            localStorage.setItem('invincible_streak', streak);
        } else if (diffDays > 1) {
            streak = 1;
            localStorage.setItem('invincible_streak', streak);
        }
    }
    localStorage.setItem('invincible_last_visit', today);
    const el = document.getElementById('streakCounter');
    if (el) el.textContent = streak;
}
window.addEventListener('DOMContentLoaded', checkDailyStreak);

/* =====================================================
   CLEAN SEPARATION NAVIGATION ENGINE
===================================================== */
function switchTab(tab) {
    document.querySelectorAll('.dock-btn').forEach(b => b.classList.remove('active'));
    
    const dockButtons = document.querySelectorAll('.dock-btn');
    if(tab === 'home' && dockButtons[0]) dockButtons[0].classList.add('active');
    if(tab === 'doubt' && dockButtons[1]) dockButtons[1].classList.add('active');
    if(tab === 'test' && dockButtons[2]) dockButtons[2].classList.add('active');
    if(tab === 'arena' && dockButtons[3]) dockButtons[3].classList.add('active');
    if(tab === 'feed' && dockButtons[4]) dockButtons[4].classList.add('active');
    if(tab === 'notes' && dockButtons[5]) dockButtons[5].classList.add('active');

    const sections = ['home', 'doubt', 'test', 'arena', 'feed', 'notes'];
    sections.forEach(s => {
        const el = document.getElementById(s + 'Section');
        if (el) el.classList.add('hidden');
    });

    const targetId = (tab === 'feed' && document.getElementById('campusHubSection')) ? 'campusHubSection' : tab + 'Section';
    const target = document.getElementById(targetId);
    if (target) target.classList.remove('hidden');
    
    if(tab === 'feed' && typeof fetchSchoolPosts === 'function') fetchSchoolPosts();

    if (typeof playDing === 'function') playDing();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function selectStartingQuest(quest) {
    localStorage.setItem('invincible_onboarded', 'true');
    const modal = document.getElementById('onboardingModal');
    if (modal) modal.style.display = 'none';
    switchTab(quest);
}
setTimeout(() => { if (!localStorage.getItem('invincible_onboarded')) { const m = document.getElementById('onboardingModal'); if(m) m.style.display = 'flex'; } }, 800);

/* =====================================================
AUDIO SYNTHESIS ENGINE & SOUNDSCAPES
===================================================== */
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx;
let currentLofiMode = 0; 
let activeLofiNodes = [];

function initAudio() { 
    if(!audioCtx) audioCtx = new AudioContext(); 
    if(audioCtx.state === 'suspended') audioCtx.resume(); 
}

function playSound(type, freq, duration, vol=0.1) {
    try {
        initAudio();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type; osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gain.gain.setValueAtTime(vol, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(); osc.stop(audioCtx.currentTime + duration);
    } catch(e){}
}

function playDing() { playSound('sine', 880, 0.1); setTimeout(()=>playSound('sine', 1760, 0.25), 90); }
function playBuzz() { playSound('sawtooth', 140, 0.25, 0.2); }
function playWin() { playSound('square', 440, 0.15); setTimeout(()=>playSound('square', 554, 0.15), 150); setTimeout(()=>playSound('square', 659, 0.35), 300); }

function stopLofiAudio() {
    activeLofiNodes.forEach(n => { try { n.stop(); n.disconnect(); } catch(e){} });
    activeLofiNodes = [];
}

function toggleLofiAudio() {
    initAudio(); stopLofiAudio();
    currentLofiMode = (currentLofiMode + 1) % 9;
    const label = document.getElementById('lofiLabel');

    if (currentLofiMode === 0) { 
        if (label) label.textContent = 'Sound: Off'; 
        return; 
    }
    
    let gainNode = audioCtx.createGain(); 
    gainNode.connect(audioCtx.destination);

    const soundNames = [
        "", "Alpha 108Hz", "Theta 432Hz", "Brown Noise",
        "Pink Noise", "Rain Ambiance", "Pulse 528Hz",
        "Deep Drone", "Spark Wave"
    ];
    if (label) label.textContent = soundNames[currentLofiMode];

    if (currentLofiMode === 1) {
        let o1 = audioCtx.createOscillator(); o1.type = 'sine'; o1.frequency.value = 108;
        let o2 = audioCtx.createOscillator(); o2.type = 'sine'; o2.frequency.value = 112;
        gainNode.gain.value = 0.05; o1.connect(gainNode); o2.connect(gainNode); o1.start(); o2.start();
        activeLofiNodes.push(o1, o2);
    } else if (currentLofiMode === 2) {
        let osc = audioCtx.createOscillator(); osc.type = 'triangle'; osc.frequency.value = 432;
        gainNode.gain.value = 0.03; osc.connect(gainNode); osc.start(); activeLofiNodes.push(osc);
    } else if (currentLofiMode === 3 || currentLofiMode === 4 || currentLofiMode === 5) {
        let bufferSize = audioCtx.sampleRate * 2; let buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        let output = buffer.getChannelData(0); let lastOut = 0;
        for (let i = 0; i < bufferSize; i++) {
            let white = Math.random() * 2 - 1;
            if(currentLofiMode === 3) { output[i] = (lastOut + (0.02 * white)) / 1.02; lastOut = output[i]; output[i] *= 3.5; }
            else if(currentLofiMode === 4) { output[i] = (lastOut + (0.05 * white)) / 1.05; lastOut = output[i]; output[i] *= 2; }
            else { output[i] = white * 0.15; }
        }
        let noise = audioCtx.createBufferSource(); noise.buffer = buffer; noise.loop = true;
        if(currentLofiMode === 5) {
            let filter = audioCtx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 800;
            gainNode.gain.value = 0.06; noise.connect(filter); filter.connect(gainNode);
        } else {
            gainNode.gain.value = 0.06; noise.connect(gainNode);
        }
        noise.start(); activeLofiNodes.push(noise);
    } else if (currentLofiMode === 6) {
        let o1 = audioCtx.createOscillator(); o1.type = 'sine'; o1.frequency.value = 528;
        let o2 = audioCtx.createOscillator(); o2.type = 'sine'; o2.frequency.value = 534;
        gainNode.gain.value = 0.03; o1.connect(gainNode); o2.connect(gainNode); o1.start(); o2.start();
        activeLofiNodes.push(o1, o2);
    } else if (currentLofiMode === 7) {
        let osc = audioCtx.createOscillator(); osc.type = 'sawtooth'; osc.frequency.value = 60;
        let filter = audioCtx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 140;
        gainNode.gain.value = 0.06; osc.connect(filter); filter.connect(gainNode); osc.start(); activeLofiNodes.push(osc);
    } else if (currentLofiMode === 8) {
        let osc = audioCtx.createOscillator(); osc.type = 'sine'; osc.frequency.value = 10000;
        gainNode.gain.value = 0.008; osc.connect(gainNode); osc.start(); activeLofiNodes.push(osc);
    }
}

/* =====================================================
NOTES STUDIO GENERATOR & PDF ENGINE
===================================================== */
const genNotesBtn = document.getElementById('generateNotesBtn');
if (genNotesBtn) {
  genNotesBtn.onclick = async () => {
    const cls = document.getElementById('notesClass').value;
    const sub = document.getElementById('notesSubject').value;
    const lang = document.getElementById('notesLanguage').value; 
    const chapter = document.getElementById('notesChapter').value.trim();
    if(!chapter) return alert("Please enter a chapter name.");

    const targetPages = (cls === "9" || cls === "10") ? 8 : 10;

    genNotesBtn.disabled = true; 
    genNotesBtn.textContent = `Compiling ${targetPages}-Page Study Module...`;
    document.getElementById('notesLoading')?.classList.remove('hidden');
    document.getElementById('notesResultContainer')?.classList.add('hidden');

    const strictPrompt = `
      Create a comprehensive, highly-structured ${targetPages}-page CBSE Study Module for Chapter: "${chapter}".
      Target Audience: Class ${cls} (${sub}).
      Language: ${lang}. (If Hindi or Hinglish, keep scientific terms in English brackets).

      STRICT DESIGN & STRUCTURE REQUIREMENTS:
      1. MUST BE VERY THOROUGH AND DETAILED TO FILL APPROXIMATELY ${targetPages} STANDARD PRINT PAGES.
      2. Divide the chapter into 5 to 7 logical major sections.
      3. For EVERY section include:
         - ⚡ 1-Minute TL;DR Box: High-yield summary bullets.
         - Core Concepts: Clear 1-2 line concept trigger bullets (NO long dense paragraphs).
         - 🧠 FORMULA VAULT: Display all mathematical equations centered using standard LaTeX math ($ or $$).
         - Derivations / Step-by-Step Logic: Clear numbered sequences with justifications in brackets.
         - Comparison Tables: Fully formatted Markdown tables comparing definitions, devices, or wave types.
         - 🚨 EXAMINER TRAP Callout: Highlight standard student calculation or conceptual mistakes (e.g. ❌ Wrong vs ✅ Right).
      4. DO NOT add standalone multiple-choice question sets or practice quizzes at the end.
      5. Output ONLY valid Markdown with clean standard tables and LaTeX math.
    `;

    try {
        const res = await fetch('/api/ask', {
            method: 'POST', 
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ 
              subject: sub, 
              question: strictPrompt
            }) 
        });
        const data = await res.json();
        if(!res.ok) throw new Error(data.error || `Server error: ${res.status}`);
        data.notes = data.answer;

        document.getElementById('notesResultTitle').textContent = `CLASS ${cls} ${sub.toUpperCase()} • ${chapter.toUpperCase()} (${targetPages}-PAGE MODULE)`;
        
        const contentBody = document.getElementById('notesContentBody');
        
        let rawHtml = marked.parse(data.notes || "");

        rawHtml = rawHtml
          .replace(/<blockquote>\s*<p>.*?EXAMINER TRAP[\s\S]*?<\/blockquote>/gi, (match) => `<div class="callout-trap">${match.replace(/<\/?blockquote>/g, '')}</div>`)
          .replace(/<blockquote>\s*<p>.*?TL;DR[\s\S]*?<\/blockquote>/gi, (match) => `<div class="callout-tldr">${match.replace(/<\/?blockquote>/g, '')}</div>`)
          .replace(/<blockquote>\s*<p>.*?FORMULA VAULT[\s\S]*?<\/blockquote>/gi, (match) => `<div class="callout-formula">${match.replace(/<\/?blockquote>/g, '')}</div>`);

        contentBody.innerHTML = rawHtml;
        
        if (window.MathJax) {
            await MathJax.typesetPromise([contentBody]);
        }

        document.getElementById('notesResultContainer')?.classList.remove('hidden');
        if (typeof playWin === 'function') playWin();
    } catch(err) {
        alert("Notes Engine Error: " + err.message);
    } finally {
        genNotesBtn.disabled = false; 
        genNotesBtn.textContent = "GENERATE TOPPER NOTES";
        document.getElementById('notesLoading')?.classList.add('hidden');
    }
  };
}

function downloadPDF() {
  const content = document.getElementById('notesContentBody')?.innerHTML;
  const title = document.getElementById('notesResultTitle')?.textContent || "CBSE Study Module";
  const cls = document.getElementById('notesClass')?.value || "10";
  const chapter = document.getElementById('notesChapter')?.value.trim() || 'Notes';

  if (!content) {
    alert("Please generate notes first.");
    return;
  }

  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Invincible_Class_${cls}_${chapter.replace(/\\s+/g, '_')}_Notes</title>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=Space+Grotesk:wght@700;900&display=swap" rel="stylesheet">
        <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"><\/script>
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          body {
            font-family: 'Plus Jakarta Sans', Arial, sans-serif;
            color: #0f172a;
            background: #ffffff;
            margin: 0;
            padding: 10px;
            font-size: 13px;
            line-height: 1.65;
          }
          .header {
            border-bottom: 2px solid #0f172a;
            padding-bottom: 8px;
            margin-bottom: 18px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          .title { font-family: 'Space Grotesk', sans-serif; font-size: 17px; font-weight: 900; color: #0f172a; }
          .sub { font-size: 9px; font-weight: 800; color: #0284c7; letter-spacing: 1px; text-transform: uppercase; }
          h1, h2, h3 { font-family: 'Space Grotesk', sans-serif; color: #0f172a; margin-top: 22px; margin-bottom: 10px; break-after: avoid; }
          p, li { color: #1e293b; }
          .callout-trap { background: #fff1f2; border-left: 4px solid #e11d48; border-radius: 8px; padding: 12px 16px; margin: 14px 0; color: #881337; break-inside: avoid; }
          .callout-tldr { background: #f0fdf4; border-left: 4px solid #16a34a; border-radius: 8px; padding: 12px 16px; margin: 14px 0; color: #14532d; break-inside: avoid; }
          .callout-formula { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 14px; margin: 14px 0; text-align: center; color: #0f172a; break-inside: avoid; }
          table { width: 100%; border-collapse: collapse; margin: 14px 0; break-inside: avoid; }
          th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; font-size: 12px; }
          th { background-color: #0f172a; color: #ffffff; }
          tr:nth-child(even) { background-color: #f8fafc; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="sub">Invincible 360 • Topper Study Module</div>
            <div class="title">${title}</div>
          </div>
          <div style="font-size: 9px; font-weight: 700; color: #64748b;">CBSE CURRICULUM</div>
        </div>
        <div>${content}</div>
        <script>
          window.onload = function() {
            if (window.MathJax) {
              MathJax.typesetPromise().then(() => {
                setTimeout(() => { window.print(); window.close(); }, 500);
              });
            } else {
              setTimeout(() => { window.print(); window.close(); }, 500);
            }
          };
        <\/script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

/* =====================================================
SURVIVAL BET & CLOUT LEADERBOARD SYNC
===================================================== */
async function loadPlatformData(){
    try{
        const response = await fetch('/api/get-questions');
        const data = await response.json();

        if (data && data.dailyPuzzle) {
          renderDailyPuzzle(data.dailyPuzzle);
        }

        if(data && Array.isArray(data.leaderboard) && data.leaderboard.length > 0){
            const top3 = data.leaderboard.slice(0, 3);
            const rest = data.leaderboard.slice(3, 7);

            const getSchool = (item) => item.organization || item.school_name || item.school || item.institution || `Class ${item.student_class || '10'}`;

            const podiumEl = document.getElementById("podiumContainer");
            if (podiumEl) {
              podiumEl.innerHTML = top3.map((item, idx) => `
                  <div class="podium-item podium-${idx+1}">
                      <div class="podium-avatar">${idx === 0 ? '👑' : (idx === 1 ? '🥈' : '🥉')}</div>
                      <div class="podium-name">${escapeHTML(item.student_name)}</div>
                      <div style="font-size:8px; color:var(--accent-cyan); max-width:70px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHTML(getSchool(item))}</div>
                      <div class="podium-score">${item.percentage}%</div>
                  </div>
              `).join('');
            }

            const listEl = document.getElementById("leaderboardList");
            if (listEl) {
              listEl.innerHTML = rest.map((item, idx) => `
                  <div class="clout-row">
                      <span>#${idx+4} ${escapeHTML(item.student_name)} <span style="color:var(--accent-cyan); font-size:10px;">(${escapeHTML(getSchool(item))})</span></span>
                      <span style="color:var(--accent-emerald);">${item.percentage}%</span>
                  </div>
              `).join('');
            }

            const lb = document.getElementById("leaderboardBox");
            if (lb) lb.style.display = "block";
        }
    }catch(error){ console.error(error); }
}


window.addEventListener('DOMContentLoaded', () => { setTimeout(loadPlatformData, 300); });

function renderDailyPuzzle(puzzle) {
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
function startDailyClashTimer() {
  let timeLeft = 15;
  const numDisplay = document.getElementById('survivalTimerNum');
  const barDisplay = document.getElementById('survivalTimerBar');
  
  clearInterval(clashTimerInterval);
  clashTimerInterval = setInterval(() => {
    timeLeft--;
    if (numDisplay) numDisplay.textContent = `${timeLeft}s`;
    if (barDisplay) barDisplay.style.width = `${(timeLeft / 15) * 100}%`;

    if (timeLeft <= 0) {
      clearInterval(clashTimerInterval);
      handleDailyClashAnswer(-1, -1, true);
    }
  }, 1000);
}

function handleDailyClashAnswer(selectedIdx, correctIdx, timedOut = false) {
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
    if (fb) fb.innerHTML = `<div style="color:var(--accent-rose); font-weight:800; margin-top:8px;">⏱ Time's up! Clash closed.</div>`;
    return;
  }

  const isCorrect = Number(selectedIdx) === Number(correctIdx);
  const currentXp = parseInt(document.getElementById('xpCounter')?.textContent || '680', 10);

  if (isCorrect) {
    playDing();
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
    confetti({ particleCount: 70, spread: 50, origin: { y: 0.6 } });
  } else {
    playBuzz();
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
   CAMPUS HUB / SCHOOL DISPATCH CONTROLLER
===================================================== */
let currentCategoryFilter = 'ALL';
let allSchoolPosts = [];

async function fetchSchoolPosts() {
  const selectedSchool = document.getElementById('hubSchoolSelect')?.value || 'ALL';
  
  try {
    if (typeof supabase !== 'undefined') {
      let query = supabase.from('school_posts').select('*').order('created_at', { ascending: false });
      if (selectedSchool !== 'ALL') query = query.eq('school_name', selectedSchool);
      const { data, error } = await query;
      if (error) throw error;
      allSchoolPosts = data || [];
    } else {
      const res = await fetch(`/api/feed?school=${encodeURIComponent(selectedSchool)}`);
      if (res.ok) {
        const resData = await res.json();
        allSchoolPosts = resData.posts || [];
      } else {
        allSchoolPosts = getSamplePosts();
      }
    }
  } catch (err) {
    allSchoolPosts = getSamplePosts();
  }
  renderSchoolFeed();
}

function getSamplePosts() {
  return [
    { id: 1, school_name: "Bharat Public School", category: "teacher_intel", title: "Chemistry Viva Important Topics", content: "External teacher is focusing heavily on Titration equations and Organic functional group tests. Be prepared!", author_name: "Anonymous Backbencher", batch_tag: "Class 12th", is_anonymous: true, upvotes: 14 },
    { id: 2, school_name: "DVM Public School", category: "syllabus_notes", title: "Physics Ch 9 Ray Optics Notes", content: "Diagrams for telescope and compound microscope derivations will definitely come in 5 marks.", author_name: "Rohan K.", batch_tag: "Class 12th Sci", is_anonymous: false, upvotes: 22 }
  ];
}

function formatCategoryName(cat) {
  const map = {
    'teacher_intel': '👨‍🏫 Teacher Update',
    'syllabus_notes': '📚 Notes / Syllabus',
    'ask_seniors': '❓ Seniors se Sawal',
    'news': '🎉 School Update'
  };
  return map[cat] || 'Charcha';
}

function renderSchoolFeed() {
  const container = document.getElementById('schoolPostsFeed');
  if (!container) return;

  const filtered = allSchoolPosts.filter(p => {
    return currentCategoryFilter === 'ALL' || p.category === currentCategoryFilter;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:24px 14px; background:#111827; border-radius:14px; border:1px dashed rgba(255,255,255,0.12);">
        <div style="font-size:24px;">💬</div>
        <div style="color:#e5e7eb; font-weight:700; font-size:13px; margin-top:4px;">Is school ka abhi koi post nahi hai</div>
        <div style="color:#9ca3af; font-size:11px; margin-top:2px;">Pehle student bano aur upar "+ Post Karo" daba kar shuru karo!</div>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(post => `
    <div class="post-card">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
        <span class="post-tag tag-${post.category}">${formatCategoryName(post.category)}</span>
        <span style="font-size:10px; color:#9ca3af; font-weight:700;">🏫 ${escapeHTML(post.school_name)}</span>
      </div>

      <h4 style="font-size:14px; font-weight:800; color:#ffffff; margin:0 0 4px 0; line-height:1.3;">${escapeHTML(post.title)}</h4>
      <p style="font-size:12px; color:#d1d5db; line-height:1.4; margin:0 0 10px 0; white-space: pre-line;">${escapeHTML(post.content)}</p>

      <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid rgba(255,255,255,0.06); padding-top:8px;">
        <div style="font-size:11px; color:#9ca3af; display:flex; align-items:center; gap:6px;">
          <span style="font-weight:700; color:#e5e7eb;">${post.is_anonymous ? '🤫 Koi Dost (Anonymous)' : '👤 ' + (post.author_name || 'Student')}</span>
          <span>•</span>
          <span style="color:#9ca3af; font-size:10px;">${post.batch_tag || 'Student'}</span>
        </div>
        <button onclick="upvotePost(${post.id}, this)" style="background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); color:#fff; border-radius:6px; padding:3px 8px; font-size:11px; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:4px;">
          🔥 Sahi Hai <span>${post.upvotes || 0}</span>
        </button>
      </div>
    </div>
  `).join('');
}

function filterSchoolPosts() { fetchSchoolPosts(); }

function setCategoryFilter(cat, btn) {
  currentCategoryFilter = cat;
  document.querySelectorAll('#hubCategoryPills .hub-pill').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderSchoolFeed();
}

async function upvotePost(postId, btnEl) {
  const span = btnEl.querySelector('span');
  let currentVal = parseInt(span.textContent, 10) || 0;
  span.textContent = currentVal + 1;
  btnEl.style.borderColor = '#05ffa1';
  btnEl.disabled = true;

  try {
    if (typeof supabase !== 'undefined') {
      await supabase.from('school_posts').update({ upvotes: currentVal + 1 }).eq('id', postId);
    }
  } catch (err) {}
}

function openCreatePostModal() {
  const selSchool = document.getElementById('hubSchoolSelect')?.value || 'ALL';
  if (selSchool !== 'ALL') {
    const mSel = document.getElementById('modalSchoolSelect');
    if (mSel) mSel.value = selSchool;
  }
  const modal = document.getElementById('createPostModal');
  if (modal) modal.style.display = 'flex';
}

function closeCreatePostModal() {
  const modal = document.getElementById('createPostModal');
  if (modal) modal.style.display = 'none';
}

async function handleCreatePost(e) {
  e.preventDefault();
  const school_name = document.getElementById('modalSchoolSelect')?.value;
  const category = document.getElementById('modalCategorySelect')?.value;
  const batch_tag = document.getElementById('modalBatchInput')?.value;
  const title = document.getElementById('modalTitleInput')?.value;
  const content = document.getElementById('modalContentInput')?.value;
  const is_anonymous = document.getElementById('modalAnonCheckbox')?.checked ?? true;

  const newPost = {
    id: Date.now(),
    school_name,
    category,
    batch_tag,
    title,
    content,
    is_anonymous,
    upvotes: 0,
    author_name: is_anonymous ? 'Anonymous Backbencher' : (localStorage.getItem('userName') || 'Student')
  };

  try {
    if (typeof supabase !== 'undefined') {
      const { error } = await supabase.from('school_posts').insert([newPost]);
      if (error) throw error;
    }
    allSchoolPosts.unshift(newPost);
    closeCreatePostModal();
    document.getElementById('createPostForm')?.reset();
    renderSchoolFeed();
  } catch (err) {
    alert('Failed to publish post: ' + err.message);
  }
}

function escapeHTML(str) {

  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function formatMathText(text) {
  if (!text) return "";
  const superscripts = { '0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹','+':'⁺','-':'⁻','=':'⁼','(':'⁽',')':'⁾','n':'ⁿ','x':'ˣ' };
  return String(text)
    .replace(/\\text\{([^}]*)\}/g, "$1")
    .replace(/\\mathrm\{([^}]*)\}/g, "$1")
    .replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, "$1/$2")
    .replace(/\\implies/g, " ➔ ")
    .replace(/\\rightarrow/g, " ➔ ")
    .replace(/\\times/g, " × ")
    .replace(/\\div/g, " ÷ ")
    .replace(/\\cdot/g, " · ")
    .replace(/\\sqrt\{([^}]*)\}/g, "√($1)")
    .replace(/\\left/g, "")
    .replace(/\\right/g, "")
    .replace(/\\\[/g, "")
    .replace(/\\\]/g, "")
    .replace(/\$\$/g, "")
    .replace(/\$/g, "")
    .replace(/\^\{([^}]+)\}/g, (_, p1) => p1.split('').map(c => superscripts[c] || c).join(''))
    .replace(/\^([0-9nx+-])/g, (_, p1) => superscripts[p1] || p1)
    .trim();
}


/* =====================================================
DOUBT DESK LOGIC
===================================================== */
let selectedSubject = "Mathematics";
let currentTone = "step";
let selectedImage = null;
const questionInput = document.getElementById("question");
const imageInput = document.getElementById("imageInput");
const imagePreview = document.getElementById("imagePreview");
const removeImageButton = document.getElementById("removeImage");

function setExplanationTone(tone, el) {
    currentTone = tone; document.querySelectorAll('.tone-btn').forEach(b => b.classList.remove('active')); el.classList.add('active');
}
document.querySelectorAll("#doubtSection .subject").forEach(b => {
    b.onclick = () => { document.querySelectorAll("#doubtSection .subject").forEach(btn => btn.classList.remove('active')); b.classList.add('active'); selectedSubject = b.getAttribute('data-subject'); };
});
document.getElementById("uploadBtn").onclick = () => imageInput.click();
document.getElementById("cameraBtn").onclick = () => { imageInput.setAttribute("capture", "environment"); imageInput.click(); };

imageInput.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_SIZE = 1200;
            let width = img.width;
            let height = img.height;

            if (width > height && width > MAX_SIZE) {
                height *= MAX_SIZE / width;
                width = MAX_SIZE;
            } else if (height > MAX_SIZE) {
                width *= MAX_SIZE / height;
                height = MAX_SIZE;
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
            selectedImage = {
                data: compressedBase64.split(',')[1],
                mimeType: 'image/jpeg'
            };

            imagePreview.src = compressedBase64;
            imagePreview.style.display = "block";
            removeImageButton.style.display = "block";
        };
        img.src = evt.target.result;
    };
    reader.readAsDataURL(file);
};

removeImageButton.onclick = () => { selectedImage = null; imageInput.value = ""; imagePreview.style.display = "none"; removeImageButton.style.display = "none"; };
async function renderAnswerContent(container, markdownText) {
  let parsedHtml = typeof marked !== 'undefined' ? marked.parse(markdownText || "") : markdownText;
  
  parsedHtml = parsedHtml
    .replace(/🚨\s*\*\*Common Student Mistakes[\s\S]*?(?=(🎯|🧠|💡|$))/gi, (match) => `<div class="callout-trap">${typeof marked !== 'undefined' ? marked.parse(match) : match}</div>`)
    .replace(/🎯\s*\*\*Direct Approach[\s\S]*?(?=(🧠|💡|🚨|$))/gi, (match) => `<div class="callout-tldr">${typeof marked !== 'undefined' ? marked.parse(match) : match}</div>`);

  container.innerHTML = parsedHtml;
  
  if (window.MathJax && MathJax.typesetPromise) {
    await MathJax.typesetPromise([container]);
  }
}

document.getElementById("askBtn").onclick = async () => {
    const q = questionInput.value.trim();
    if(!q && !selectedImage) return alert("Please enter a question or upload a photo.");

    const askBtn = document.getElementById("askBtn");
    askBtn.disabled = true;
    document.getElementById("loadingDoubt").classList.remove('hidden'); 
    document.getElementById("answerBox").style.display = "none"; 
    
    startDoubtWaitingPipeline();

    // 1. Capture the image preview source if an image was uploaded
    const attachedImageBase64 = selectedImage ? `data:${selectedImage.mimeType};base64,${selectedImage.data}` : null;

    doubtHistory = [];

    try {
        const res = await fetch("/api/ask", {
            method: "POST", 
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ 
              subject: selectedSubject, 
              question: q, 
              image: selectedImage, 
              tone: currentTone,
              history: []
            })
        });
        const data = await res.json();
        if(!res.ok) throw new Error(data.error || "Unable to solve.");

        doubtHistory.push({ role: 'user', content: q || 'Image Question' });
        doubtHistory.push({ role: 'assistant', content: data.answer });

        const ansContainer = document.getElementById("answerText");
        
        // 2. Render markdown/math solution first
        await renderAnswerContent(ansContainer, data.answer);
        
        // 3. Inject the uploaded picture at the top of the answer card
        if (attachedImageBase64) {
          const imgMarkup = `<div style="margin-bottom:14px; text-align:center;"><img src="${attachedImageBase64}" alt="Uploaded Doubt" style="max-width:100%; max-height:260px; border-radius:12px; border:1px solid rgba(255,255,255,0.15); object-fit:contain;" /></div>`;
          ansContainer.insertAdjacentHTML('afterbegin', imgMarkup);
        }
        
        document.getElementById("answerBox").style.display = "block"; 
        if (typeof playDing === 'function') playDing();
    } catch(err) {
        alert("Doubt Engine: " + err.message);
    } finally { 
        askBtn.disabled = false;
        stopDoubtWaitingPipeline();
        document.getElementById("loadingDoubt").classList.add('hidden'); 
    }
};


const sendFollowUpBtn = document.getElementById('sendFollowUpBtn');
const followUpInput = document.getElementById('followUpInput');

if (sendFollowUpBtn && followUpInput) {
  const submitFollowUp = async () => {
    const followQ = followUpInput.value.trim();
    if (!followQ) return;

    sendFollowUpBtn.disabled = true;
    sendFollowUpBtn.textContent = "...";

    const thread = document.getElementById('doubtConversationThread');

    const userBubble = document.createElement('div');
    userBubble.style.cssText = "background:rgba(0, 229, 255, 0.1); border:1px solid rgba(0, 229, 255, 0.25); border-radius:12px; padding:10px 14px; font-size:13px; font-weight:700; color:#fff; align-self:flex-end;";
    userBubble.textContent = "🙋 " + followQ;
    thread.appendChild(userBubble);
    followUpInput.value = "";

    const aiBubble = document.createElement('div');
    aiBubble.className = "topper-content";
    aiBubble.style.cssText = "background:rgba(255,255,255,0.03); border:1px solid var(--border-subtle); border-radius:14px; padding:12px 16px; margin-top:6px;";
    aiBubble.innerHTML = "<em>Refining explanation with step logic...</em>";
    thread.appendChild(aiBubble);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          subject: selectedSubject,
          question: followQ,
          tone: currentTone,
          history: doubtHistory
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed follow-up");

      doubtHistory.push({ role: 'user', content: followQ });
      doubtHistory.push({ role: 'assistant', content: data.answer });

      await renderAnswerContent(aiBubble, data.answer);
      if (typeof playDing === 'function') playDing();
    } catch (err) {
      aiBubble.innerHTML = `<span style="color:var(--accent-rose);">Error: ${err.message}</span>`;
    } finally {
      sendFollowUpBtn.disabled = false;
      sendFollowUpBtn.textContent = "Ask";
    }
  };

  sendFollowUpBtn.onclick = submitFollowUp;
  followUpInput.onkeydown = (e) => { if (e.key === 'Enter') submitFollowUp(); };
}

document.getElementById("againBtn").addEventListener("click", function(){ 
  followUpInput.value = "Can you explain this step by step with a simpler real-world example?";
  sendFollowUpBtn.click();
});

document.getElementById("teacherBtn").addEventListener("click", function(){ 
  const studentQuestion = questionInput.value.trim(); 
  const explanation = document.getElementById("answerText").innerText.trim(); 
  const whatsappMessage = "Hello Invincible 360 Faculty,\n\nI need further help on this concept:\n\nSubject: " + selectedSubject + "\n\nQuestion:\n" + (studentQuestion || "Image attachment") + "\n\nPlatform Solution:\n" + explanation; 
  window.open("https://api.whatsapp.com/send?text=" + encodeURIComponent(whatsappMessage), "_blank"); 
});


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
    const name = document.getElementById("studentName").value.trim();
    const mobile = document.getElementById("studentMobile").value.trim();
    const org = testOrg.value;
    const cls = testClass.value; 
    const subject = testSubject.value; 
    const chapter = testChapter.value.trim() || "Full Syllabus Overview";

    if(!name || !mobile || !org || !cls || !subject){ return alert("Please fill your Name, Mobile Number, School, Class, and Subject."); }
    if(!/^[0-9]{10}$/.test(mobile)){ return alert("Please enter a valid 10-digit mobile number."); }

    const originalText = startTestBtn.textContent;
    startTestBtn.disabled = true; startTestBtn.textContent = "⚙️ Compiling Assessment... (10s)";
    document.getElementById('testWarmupBox')?.classList.remove('hidden');

    try {
        const response = await fetch("/api/generate-test", {
            method: "POST", headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ className: cls, subject: subject, chapter: chapter, numberOfQuestions: 20, difficulty: "Easy", questionType: "MCQ", language: "English and Pure Devanagari Hindi" })
        });
        const data = await response.json();
        if(!response.ok) throw new Error(data.error || "Preparation error.");
        
        const generated = extractQuestions(data);
        if(!generated || !generated.length) throw new Error("Unable to load questions.");

        activeTestClass = cls; activeTestSubject = subject;
        activeTestTitle = `${subject}:${chapter}`;
        startQuestions(generated, `Class ${cls} ${subject}`, chapter);
    } catch(error) { alert("Assessment System: " + error.message); }
    finally { 
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
    if (percentage >= 80) { playWin(); confetti({ particleCount: 100, spread: 60, origin: { y: 0.6 } }); }

    finalScoreData = { percentage: percentage, scoreString: correct + "/" + questions.length, testName: activeTestTitle };
    scoreText.textContent = correct + "/" + questions.length;
    resultDetail.innerHTML = `<strong>${percentage}% Accuracy</strong> &bull; Correct: ${correct} | Incorrect: ${attempted - correct}`;
    reviewContainer.innerHTML = reviewHTML;
    testArea.classList.add("hidden"); testResult.style.display = "block";
    testResult.scrollIntoView({ behavior: "smooth", block: "start" });

    const studentName = document.getElementById("studentName").value.trim();
    const studentMobile = document.getElementById("studentMobile").value.trim();
    const org = document.getElementById("testOrg").value || "Other School";
    const chapterName = testChapter.value.trim() || "Chapter Assessment";

    try {
        await fetch("/api/save-test-attempt", {
            method: "POST", headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ studentName: studentName, studentMobile: studentMobile, organization: org, studentClass: activeTestClass || testClass.value, subject: activeTestSubject || testSubject.value, chapter: chapterName, testTitle: activeTestTitle, testType: "Algorithmic Generation", totalQuestions: questions.length, attempted: attempted, correct: correct, wrong: attempted - correct, unanswered: questions.length - attempted, percentage: percentage, answers: answers })
        });
        loadPlatformData();
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
    const name = document.getElementById('arenaPlayerName').value.trim() || 'Player 1';
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
    document.getElementById('uiP1Name').textContent = name;
    document.getElementById('uiP2Name').textContent = "Invincible AI 🤖";
    document.getElementById('uiP1Score').textContent = "0";
    document.getElementById('uiP2Score').textContent = "0";
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
    
    // Streak indicator badge
    let streakEmoji = '';
    if (arena.streak >= 5) streakEmoji = ' 🔥 GODLIKE STREAK x' + arena.streak;
    else if (arena.streak >= 3) streakEmoji = ' ⚡ ON FIRE x' + arena.streak;

    document.getElementById('arenaQNum').innerHTML = `QUESTION ${arena.currentQ + 1}/${arena.questions.length} <span style="color:var(--accent-amber); font-weight:900;">${streakEmoji}</span>`;
    document.getElementById('arenaQText').textContent = q.question_text || q.question;
    
    let optsHTML = '';
    const opts = q.options || [q.option_1, q.option_2, q.option_3, q.option_4];
    opts.forEach((opt, idx) => {
        const correctIdx = q.correct_option !== undefined ? q.correct_option : q.answer;
        optsHTML += `<div class="arena-option" onclick="handleArenaAnswer(this, ${idx}, ${correctIdx})">${opt}</div>`;
    });
    document.getElementById('arenaOptions').innerHTML = optsHTML;
    
    arena.timer = arena.timeLimit;
    const timerDisplay = document.getElementById('arenaTimerDisplay');
    timerDisplay.textContent = `⏱ ${arena.timer}s`;
    timerDisplay.classList.remove('panic');
    
    clearInterval(arena.interval);
    arena.interval = setInterval(() => {
        arena.timer--; 
        timerDisplay.textContent = `⏱ ${arena.timer}s`;
        if (arena.timer <= 3) {
            timerDisplay.classList.add('panic');
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
        playDing(); 
        arena.streak++;
        
        // Speed bonus: Answering with >50% time left grants extra points
        const speedBonus = arena.timer > (arena.timeLimit / 2) ? 5 : 0;
        arena.score += (10 + arena.timer + speedBonus);

        if (arena.streak >= 3) {
          confetti({ particleCount: 25, spread: 35, origin: { y: 0.7 } });
        }
    } else {
        playBuzz();
        arena.streak = 0;
        const card = document.getElementById('arenaCardContainer');
        if (card) {
          card.classList.add('arena-shake');
          setTimeout(() => card.classList.remove('arena-shake'), 400);
        }
    }

    if (arena.isBotMatch) {
        if (Math.random() > 0.35) arena.botScore += (10 + Math.floor(Math.random() * 8));
        document.getElementById('uiP1Score').textContent = arena.score;
        document.getElementById('uiP2Score').textContent = arena.botScore;
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
        document.getElementById('arenaResultText').innerHTML = `<div style="color:var(--accent-cyan); font-weight:800; font-size:18px;">⚡ Match Complete! Awaiting Final Verdict...</div>`;
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

    document.getElementById('finalP1').textContent = `${p1} PTS`;
    document.getElementById('finalP2').textContent = `${p2} PTS`;
    document.getElementById('arenaResult').classList.remove('hidden');

    if (myScore > opScore) {
        playWin();
        document.getElementById('arenaResultText').innerHTML = `
            <div style="font-size:42px; margin-bottom:4px;">👑</div>
            <div style="font-size:26px; font-weight:900; color:var(--accent-emerald); letter-spacing:1px;">DOMINANT VICTORY</div>
            <div style="color:var(--text-muted); font-size:13px; margin-top:4px;">You crushed the arena duel! +100 Clout XP 🔥</div>
        `;
        confetti({ particleCount: 140, spread: 80, origin: { y: 0.5 } });
    } else if(myScore === opScore) {
        document.getElementById('arenaResultText').innerHTML = `
            <div style="font-size:42px; margin-bottom:4px;">🤝</div>
            <div style="font-size:24px; font-weight:900; color:var(--accent-amber); letter-spacing:1px;">STALEMATE TIE</div>
            <div style="color:var(--text-muted); font-size:13px; margin-top:4px;">Evenly matched gladiators. +50 XP</div>
        `;
    } else {
        document.getElementById('arenaResultText').innerHTML = `
            <div style="font-size:42px; margin-bottom:4px;">💥</div>
            <div style="font-size:24px; font-weight:900; color:var(--accent-rose); letter-spacing:1px;">DEFEATED</div>
            <div style="color:var(--text-muted); font-size:13px; margin-top:4px;">Review formulas and seek redemption.</div>
        `;
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

let currentTtsAudio = null;

async function playAudioExplanation(textToRead, btnElement) {
  try {
    if (currentTtsAudio) {
      currentTtsAudio.pause();
      currentTtsAudio = null;
      if (btnElement) btnElement.innerHTML = "🔊 Listen";
      return;
    }

    if (btnElement) btnElement.innerHTML = "⏳ Generating...";

    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: textToRead,
        languageCode: "hi-IN",
        speakingRate: 1.05
      })
    });

    const data = await res.json();
    if (!data.success || !data.audioBase64) {
      throw new Error(data.error || "Audio generation failed");
    }

    currentTtsAudio = new Audio(data.audioBase64);
    if (btnElement) btnElement.innerHTML = "⏹️ Stop";

    currentTtsAudio.play();
    currentTtsAudio.onended = () => {
      if (btnElement) btnElement.innerHTML = "🔊 Listen";
      currentTtsAudio = null;
    };
  } catch (err) {
    alert("Audio error: " + err.message);
    if (btnElement) btnElement.innerHTML = "🔊 Listen";
  }
}

/* =====================================================
   📸 STORIES & INSTA-FILTER STUDIO ENGINE
===================================================== */
let activeStories = [];
let currentStoryIdx = 0;
let storyTimer = null;
let currentStoryImageBase64 = null;
let selectedFilterCSS = "none";

const storyFilters = [
  { name: "Original", css: "none", color: "#94a3b8" },
  { name: "Topper Glow", css: "contrast(1.2) saturate(1.3)", color: "#f59e0b" },
  { name: "Midnight", css: "brightness(0.8) sepia(0.3) hue-rotate(180deg) saturate(1.5)", color: "#3b82f6" },
  { name: "Backbencher", css: "grayscale(1) contrast(1.2)", color: "#64748b" },
  { name: "Exam Blur", css: "blur(1px) contrast(1.1)", color: "#14b8a6" },
  { name: "Vintage", css: "sepia(0.8) contrast(1.1)", color: "#d97706" },
  { name: "Neon Physics", css: "hue-rotate(280deg) saturate(2) contrast(1.1)", color: "#d946ef" },
  { name: "X-Ray Vision", css: "invert(1) hue-rotate(180deg)", color: "#06b6d4" },
  { name: "Focus Mode", css: "brightness(0.9) contrast(1.3)", color: "#ef4444" },
  { name: "Cyberpunk", css: "hue-rotate(90deg) saturate(2) brightness(0.9)", color: "#10b981" },
  { name: "Late Night", css: "brightness(0.7) contrast(1.4)", color: "#1e293b" },
  { name: "Golden Hour", css: "sepia(0.4) saturate(1.5) hue-rotate(-15deg)", color: "#fbbf24" },
  { name: "Cool Blue", css: "hue-rotate(45deg) saturate(1.2)", color: "#38bdf8" },
  { name: "Dramatic", css: "contrast(1.5) grayscale(0.5)", color: "#475569" },
  { name: "Vivid", css: "saturate(2) contrast(1.1)", color: "#f43f5e" }
];

function renderFilters() {
  const tray = document.getElementById('filterTray');
  if(!tray) return;
  tray.innerHTML = storyFilters.map((f, idx) => `
    <button type="button" class="filter-btn ${idx === 0 ? 'active' : ''}" onclick="applyFilter(${idx}, this)">
      <div class="filter-preview-box" style="background-color:${f.color}; filter:${f.css};"></div>
      <div class="filter-name">${f.name}</div>
    </button>
  `).join('');
}

function applyFilter(idx, btnEl) {
  if(typeof playDing === 'function') playDing();
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btnEl.classList.add('active');
  selectedFilterCSS = storyFilters[idx].css;
  const preview = document.getElementById('storyImagePreview');
  if(preview) preview.style.filter = selectedFilterCSS;
}

function handleStoryImage(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (evt) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_SIZE = 1080;
      let width = img.width;
      let height = img.height;
      
      if (width > height && width > MAX_SIZE) {
        height *= MAX_SIZE / width;
        width = MAX_SIZE;
      } else if (height > MAX_SIZE) {
        width *= MAX_SIZE / height;
        height = MAX_SIZE;
      }
      
      canvas.width = width; 
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      currentStoryImageBase64 = canvas.toDataURL('image/jpeg', 0.6); 
      
      const preview = document.getElementById('storyImagePreview');
      if (preview) { 
        preview.src = currentStoryImageBase64; 
        preview.style.display = 'block'; 
      }
      const placeholder = document.getElementById('storyPlaceholderText');
      if (placeholder) placeholder.style.display = 'none';
    };
    img.src = evt.target.result;
  };
  reader.readAsDataURL(file);
}

const addStoryBtn = document.getElementById('btnAddStory');
if (addStoryBtn) {
  addStoryBtn.onclick = () => { 
    const m = document.getElementById('storyModal');
    if (m) { m.style.display = 'flex'; renderFilters(); }
  };
}

async function loadActiveStories() {
    const container = document.getElementById('dynamicStoryCircles');
    if (!container) return;
    try {
        const res = await fetch('/api/stories');
        const data = await res.json();
        const dbStories = Array.isArray(data.stories) ? data.stories : (Array.isArray(data) ? data : []);

        activeStories = [...dbStories];

        container.innerHTML = activeStories.map((s, idx) => {
            const author = String(s.author_name || s.author || s.name || "Student");
            const initial = author.charAt(0).toUpperCase() || "S";
            return `
            <div class="story-circle-item" onclick="openStoryViewer(${idx})">
                <div class="story-avatar-wrap">
                    <div class="story-avatar-inner">${initial}</div>
                </div>
                <div class="story-username">${escapeHTML(author)}</div>
            </div>
            `;
        }).join('');
    } catch(e) { container.innerHTML = ''; }
}
loadActiveStories();

async function bakeImageWithFilter(base64Image, cssFilter) {
  return new Promise((resolve) => {
    if (!base64Image || cssFilter === "none") return resolve(base64Image);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width; canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.filter = cssFilter;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = () => resolve(base64Image); 
    img.src = base64Image;
  });
}

const pubStoryBtn = document.getElementById('btnPublishStory');
if (pubStoryBtn) {
  pubStoryBtn.onclick = async () => {
    const name = document.getElementById('storyAuthorName').value.trim();
    const age = document.getElementById('storyAuthorAge').value.trim();
    const stuClass = document.getElementById('storyAuthorClass').value.trim();
    const inst = document.getElementById('storyInstitution').value.trim();
    const caption = document.getElementById('storyCaption').value.trim();

    if (!name || !caption) return alert("Please provide at least your Name and a Caption.");
    
    pubStoryBtn.disabled = true;
    pubStoryBtn.textContent = "BAKING IMAGE... ⏳";

    try {
        const finalImage = await bakeImageWithFilter(currentStoryImageBase64, selectedFilterCSS);
        
        pubStoryBtn.textContent = "UPLOADING... 🚀";
        const res = await fetch('/api/stories', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ 
              action: 'create_story', 
              author_name: name, 
              age: age,
              class_name: stuClass,
              institution: inst || 'CBSE School', 
              caption: caption,
              image_data: finalImage 
            })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        document.getElementById('storyModal').style.display = 'none';
        
        currentStoryImageBase64 = null;
        selectedFilterCSS = "none";
        const preview = document.getElementById('storyImagePreview');
        if (preview) { preview.style.display = 'none'; preview.style.filter = "none"; preview.src = ""; }
        const placeholder = document.getElementById('storyPlaceholderText');
        if (placeholder) placeholder.style.display = 'block';
        document.getElementById('storyCaption').value = '';
        
        loadActiveStories();
        if(typeof playWin === 'function') playWin();
        alert("🎉 Story Posted Successfully!");
    } catch(err) { 
        alert("Upload failed: " + err.message); 
    } finally {
        pubStoryBtn.disabled = false;
        pubStoryBtn.textContent = "🚀 POST STORY";
    }
  };
}
function openStoryViewer(idx) {
  currentStoryIdx = idx;
  const viewer = document.getElementById('storyViewer');
  if (viewer) {
    viewer.style.display = 'flex';
    renderStorySlide();
  }
}

function prevStorySlide() {
  if (currentStoryIdx > 0) {
    currentStoryIdx--;
    renderStorySlide();
  }
}

function nextStorySlide() {
  if (currentStoryIdx < activeStories.length - 1) {
    currentStoryIdx++;
    renderStorySlide();
  } else {
    closeStoryViewer();
  }
}

function renderStorySlide() {
  clearTimeout(storyTimer);
  const story = activeStories[currentStoryIdx];
  if (!story) {
    closeStoryViewer();
    return;
  }

  const authorDetailsEl = document.getElementById('viewerAuthorDetails');
  const schoolDetailsEl = document.getElementById('viewerSchoolDetails');
  const avatarEl = document.getElementById('viewerAvatar');
  const capEl = document.getElementById('viewerCaption');
  const bgImg = document.getElementById('viewerImageBg');

  const authorName = String(story.author_name || story.author || story.name || "Student");
  const ageText = story.age ? `, ${story.age}` : '';
  const classText = story.class_name ? ` • ${story.class_name}` : '';

  if (authorDetailsEl) authorDetailsEl.textContent = `${authorName}${ageText}${classText}`;
  if (schoolDetailsEl) schoolDetailsEl.textContent = `📍 ${story.institution || 'Platform'}`;
  if (avatarEl) avatarEl.textContent = authorName.charAt(0).toUpperCase() || 'S';

  if (capEl) capEl.innerHTML = String(story.caption || '').replace(/\n/g, '<br>');

  const imageUrl = story.image_data || story.image_url || story.image;
  if (bgImg) {
    if (imageUrl && imageUrl.length > 50) {
      bgImg.src = imageUrl;
      bgImg.style.display = 'block';
    } else {
      bgImg.style.display = 'none';
    }
  }

  const pContainer = document.getElementById('storyProgressContainer');
  if (pContainer) {
    pContainer.innerHTML = activeStories.map((_, i) => `
      <div class="story-progress-seg">
        <div class="story-progress-fill" style="width: ${i < currentStoryIdx ? '100%' : (i === currentStoryIdx ? '100%' : '0%')}; transition: width 6s linear;"></div>
      </div>
    `).join('');
  }

  storyTimer = setTimeout(nextStorySlide, 6000);
}

function closeStoryViewer() {
  clearTimeout(storyTimer);
  const v = document.getElementById('storyViewer');
  if (v) v.style.display = 'none';
}

function reactStory(type) {
  if (typeof playDing === 'function') playDing();
  if (typeof confetti === 'function') confetti({ particleCount: 30, spread: 40, origin: { y: 0.8 } });
}

function saveStoryToVault() {
  if (typeof playWin === 'function') playWin();
  alert("💾 Saved to Gallery!");
}
