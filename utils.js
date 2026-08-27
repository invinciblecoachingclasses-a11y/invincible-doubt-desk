/* =====================================================
   UTILITY HELPERS & GLOBAL ANIMATIONS
===================================================== */
function escapeHTML(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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

function triggerHaptic(pattern = [40]) {
  if ('vibrate' in navigator) {
    try { navigator.vibrate(pattern); } catch(e){}
  }
}

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
