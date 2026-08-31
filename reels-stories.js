/* =====================================================
   ⚡ INVINCIBLE 360 - STUDY REELS MASTER ENGINE
   Core Mandate: "SCROLL. SOLVE. LEVEL UP."
   - Strict Grade/Class Curriculums (Classes 9, 10, 11, 12)
   - Subject-Aware Ambient Visuals & Diagrams
   - Interactive Simulations (Canvas 2D + Micro-Engines)
   - Formula Builder & Ray Optics Sketchpads
   - Two-Stage State Machine (Challenge -> Master Reveal)
   - Resilient Mobile Touch Swiper Viewport (Infinite Loop & 3D Physics)
   - Stories & Community Broadcast Engine
===================================================== */

const defaultReelDeck = [
    // --- CLASS 9 INTERACTIVE SUITE ---
    { 
      id: 901, 
      class_name: "9", 
      type: "mcq", 
      hook: "⚡ 5 SECOND CHALLENGE", 
      title: "Inertia of Motion", 
      subject: "Physics", 
      topic: "Laws of Motion", 
      q_en: "When a moving bus stops suddenly, passengers fall forward due to:", 
      options: ["Inertia of Rest", "Inertia of Motion", "Inertia of Direction"], 
      answer: 1, 
      time: 5, 
      trap: "The upper body continues in its state of motion while feet stop with the bus.", 
      difficulty: "easy" 
    },
    { 
      id: 902, 
      class_name: "9", 
      type: "build", 
      hook: "🧩 BUILD IT", 
      title: "Newton's Second Law", 
      subject: "Physics", 
      topic: "Force & Momentum", 
      q_en: "Assemble the equation for Net Force in terms of Mass and Acceleration.", 
      template: ["slot", "=", "slot", "×", "slot"], 
      choices: ["F", "m", "a", "v", "p", "t"], 
      answer: ["F", "m", "a"], 
      time: 20, 
      trap: "Force equals the rate of change of momentum: F = ma.", 
      difficulty: "medium" 
    },
    { 
      id: 903, 
      class_name: "9", 
      type: "mcq", 
      hook: "💀 BOSS QUESTION", 
      title: "Universal Gravitation", 
      subject: "Physics", 
      topic: "Gravitation", 
      q_en: "If the distance between two masses is halved, the gravitational force becomes:", 
      options: ["2 Times", "4 Times", "1/4th", "Half"], 
      answer: 1, 
      time: 15, 
      trap: "Inverse-Square Law: F ∝ 1/r². Halving r multiplies F by 4.", 
      difficulty: "boss" 
    },
    { 
      id: 904, 
      class_name: "9", 
      type: "sim", 
      sim_id: "chem_rutherford", 
      hook: "🔬 ATOMIC LAB", 
      title: "Rutherford Alpha Scattering", 
      subject: "Chemistry", 
      topic: "Structure of the Atom", 
      q_en: "Observe positive alpha particles repelling off the heavy Gold Nucleus (+Ze).", 
      controls: [
        { id: "ctrl_z", label: "Nucleus Charge (+Z)", min: 20, max: 120, step: 1, val: 79, unit: "e" }
      ], 
      time: 25, 
      trap: "Most alpha particles pass undeflected, proving most atomic volume is empty space.", 
      difficulty: "medium" 
    },
    { 
      id: 905, 
      class_name: "9", 
      type: "sim", 
      sim_id: "math_algebra_drag", 
      hook: "⚖️ BALANCE THE EQUATION", 
      title: "Algebraic Step Balancing", 
      subject: "Mathematics", 
      topic: "Linear Equations", 
      q_en: "Tap operations in sequence to isolate x in: 2x + 6 = 18.", 
      controls: [], 
      time: 25, 
      trap: "Whatever operation you apply to one side, you must apply equally to the other side to keep the beam balanced.", 
      difficulty: "medium" 
    },

    // --- CLASS 10 INTERACTIVE SUITE ---
    { 
      id: 101, 
      class_name: "10", 
      type: "mcq", 
      hook: "⚡ 5 SECOND CHALLENGE", 
      title: "Spherical Mirrors", 
      subject: "Physics", 
      topic: "Light - Reflection", 
      q_en: "If linear magnification m = -1 for a concave mirror, where is the object?", 
      options: ["At Infinity", "At Principal Focus (F)", "At Centre of Curvature (C)"], 
      answer: 2, 
      time: 5, 
      trap: "Negative sign = Real/Inverted. Magnitude 1 = Same size. Only occurs at C.", 
      difficulty: "easy" 
    },
    { 
      id: 501, 
      class_name: "10", 
      type: "draw", 
      sim_id: "phy_ray_draw", 
      hook: "✏️ SKETCH THE RAY", 
      title: "Law of Reflection", 
      subject: "Physics", 
      topic: "Light - Optics", 
      q_en: "Touch and drag on the sketchpad to aim the reflected ray for θ_i = 45°.", 
      time: 20, 
      trap: "First Law: Angle of incidence strictly equals angle of reflection (θ_i = θ_r).", 
      difficulty: "medium" 
    },
    { 
      id: 502, 
      class_name: "10", 
      type: "sim", 
      sim_id: "bio_heart", 
      hook: "🫀 ANATOMY TAP", 
      title: "Double Circulation", 
      subject: "Biology", 
      topic: "Life Processes", 
      q_en: "Tap the Left Ventricle (the thickest chamber pumping oxygenated blood to the body).", 
      controls: [], 
      time: 20, 
      trap: "The Left Ventricle has the thickest muscular walls to pump blood at high pressure throughout systemic circulation.", 
      difficulty: "medium" 
    },
    { 
      id: 201, 
      class_name: "10", 
      type: "build", 
      hook: "🧩 BUILD IT", 
      title: "Ohm's Law", 
      subject: "Physics", 
      topic: "Electricity", 
      q_en: "Drag or tap the tokens to construct the formula for Potential Difference.", 
      template: ["slot", "=", "slot", "×", "slot"], 
      choices: ["V", "I", "R", "P", "W", "Q"], 
      answer: ["V", "I", "R"], 
      time: 20, 
      trap: "Voltage is the product of Current (I) and Resistance (R) at constant temperature.", 
      difficulty: "medium" 
    },
    { 
      id: 102, 
      class_name: "10", 
      type: "trap", 
      subject: "Physics", 
      topic: "Current Electricity", 
      title: "🚨 The Temperature Trap", 
      content: "V = IR is NOT universally true for all conductors. It fails completely if conductor temperature changes due to Joule heating!", 
      rule: "Always write 'At constant temperature' in CBSE Board answers to secure full marks." 
    },
    { 
      id: 103, 
      class_name: "10", 
      type: "mcq", 
      hook: "💀 BOSS QUESTION", 
      title: "Thermal Decomposition", 
      subject: "Chemistry", 
      topic: "Chemical Reactions", 
      q_en: "Heating dry lead nitrate powder yields brown pungent fumes of which gas?", 
      options: ["Nitrogen Monoxide (NO)", "Nitrogen Dioxide (NO₂)", "Dinitrogen Oxide (N₂O)"], 
      answer: 1, 
      time: 15, 
      trap: "2Pb(NO₃)₂ → 2PbO + 4NO₂↑ + O₂. The brown fumes are strictly NO₂.", 
      difficulty: "boss" 
    },
    { 
      id: 104, 
      class_name: "10", 
      type: "sim", 
      sim_id: "phy_circuits", 
      hook: "⚡ CLOSE THE LOOP", 
      title: "DC Circuit & Ohm's Law", 
      subject: "Physics", 
      topic: "Electricity", 
      q_en: "Toggle the knife switch to close the circuit and power the filament load.", 
      controls: [], 
      time: 20, 
      trap: "Current flows only in a closed conductive loop: I = V/R = 12V / 4Ω = 3.0A.", 
      difficulty: "easy" 
    },
    { 
      id: 105, 
      class_name: "10", 
      type: "sim", 
      sim_id: "bio_dna", 
      hook: "🧬 DNA REPLICATION", 
      title: "Base-Pairing Match", 
      subject: "Biology", 
      topic: "Heredity", 
      q_en: "Tap complementary nucleotide bases in sequence to replicate: A-T-G-C.", 
      controls: [], 
      time: 25, 
      trap: "Chargaff's Rule: Adenine pairs with Thymine (A=T), and Guanine pairs with Cytosine (G≡C).", 
      difficulty: "medium" 
    },
    { 
      id: 106, 
      class_name: "10", 
      type: "sim", 
      sim_id: "chem_titration", 
      hook: "🧪 ACID-BASE TITRATION", 
      title: "Phenolphthalein Endpoint", 
      subject: "Chemistry", 
      topic: "Acids, Bases & Salts", 
      q_en: "Dispense drops of 0.1M NaOH into HCl until the flask turns faint pink at exact neutralization (pH 7.0).", 
      controls: [], 
      time: 25, 
      trap: "At equivalence (pH 7), moles of H⁺ equal moles of OH⁻. Excess NaOH turns phenolphthalein deep magenta.", 
      difficulty: "medium" 
    },

    // --- CLASS 11 & 12 ADVANCED SUITE ---
    { 
      id: 1101, 
      class_name: "11", 
      type: "sim", 
      sim_id: "math_trig_circle", 
      hook: "📐 UNIT CIRCLE SNAP", 
      title: "Trigonometric Phase Angle", 
      subject: "Mathematics", 
      topic: "Trigonometric Functions", 
      q_en: "Drag the radial coordinate vector to lock onto θ = 45° (π/4 rad).", 
      controls: [], 
      time: 20, 
      trap: "At 45° (π/4 rad), both sin(45°) and cos(45°) equal 1/√2 ≈ 0.71.", 
      difficulty: "easy" 
    },
    { 
      id: 401, 
      class_name: "12", 
      type: "sim", 
      sim_id: "phy_wave_optics", 
      hook: "🔬 INTERACTIVE LAB", 
      title: "Young's Double-Slit", 
      subject: "Physics", 
      topic: "Wave Optics", 
      q_en: "Scrub Slit Gap (d) and Wavelength (λ) to observe interference fringe spacing.", 
      controls: [
        { id: "ctrl_wl", label: "Wavelength (λ)", min: 380, max: 750, step: 1, val: 532, unit: "nm" },
        { id: "ctrl_d", label: "Slit Gap (d)", min: 0.1, max: 0.8, step: 0.01, val: 0.25, unit: "mm" },
        { id: "ctrl_bigD", label: "Screen Dist (D)", min: 0.5, max: 2.5, step: 0.1, val: 1.2, unit: "m" }
      ], 
      time: 30, 
      trap: "Fringe Width β = λD/d. Narrowing slit distance d spreads fringe spacing wider!", 
      difficulty: "medium" 
    },
    { 
      id: 301, 
      class_name: "12", 
      type: "build", 
      hook: "🧩 BUILD IT", 
      title: "Joule's Heating Law", 
      subject: "Physics", 
      topic: "Current Electricity", 
      q_en: "Construct the expression for heat dissipated across a series resistor.", 
      template: ["slot", "=", "slot", "²", "×", "slot", "×", "slot"], 
      choices: ["H", "I", "R", "t", "V", "P"], 
      answer: ["H", "I", "R", "t"], 
      time: 25, 
      trap: "Heat produced in time t is H = I²Rt.", 
      difficulty: "medium" 
    }
];

let currentReelsClass = localStorage.getItem('invincible_user_class') || "10";
let reelStreak = 0;

/* --- ENGINE STATE --- */
let activeReelDeck = [];
let currentReelIndex = 0;
let activeReelTimers = {};
let activeNodes = { prev: null, current: null, next: null };
let activeSimInstances = {};
let isTransitioning = false;
let isDraggingReel = false;
let isTokenDragging = false;
let touchStartY = 0;
let currentDeltaY = 0;

/* =====================================================
   MATH UTILS & WRAPPERS (FOR INFINITE SCROLL)
===================================================== */
function getWrappedIndex(idx, total) {
  if (total <= 0) return 0;
  return ((idx % total) + total) % total;
}

/* =====================================================
   SYNTHESIZED AUDIO & HAPTIC FALLBACK ENGINE
===================================================== */
function getAudioCtx() {
  if (!window._sharedAudioCtx) {
    const AudioCtxConstructor = window.AudioContext || window.webkitAudioContext;
    if (AudioCtxConstructor) {
      window._sharedAudioCtx = new AudioCtxConstructor();
    }
  }
  return window._sharedAudioCtx;
}

function playDing() {
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch(e) {}
}

function playBuzz() {
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(130.81, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(85, ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.22);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.22);
  } catch(e) {}
}

function triggerHaptic(pattern = [30]) {
  if (navigator.vibrate) {
    try { navigator.vibrate(pattern); } catch(e) {}
  }
}

function safeEscapeHTML(str) {
    if (typeof escapeHTML === 'function') return escapeHTML(str);
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function safeFormatMath(str) {
    if (typeof formatMathText === 'function') return formatMathText(str);
    return String(str || '');
}

async function setReelsClass(cls, btn) {
    currentReelsClass = String(cls);
    localStorage.setItem('invincible_user_class', currentReelsClass);
    document.querySelectorAll('.reel-class-btn').forEach(b => b.classList.remove('active'));
    if (btn) {
        btn.classList.add('active');
    } else {
        const matchingBtn = document.querySelector(`.reel-class-btn[data-class="${cls}"]`);
        if (matchingBtn) matchingBtn.classList.add('active');
    }
    await renderReelsDeck();
}

/* =====================================================
   ROADMAP PHASE 3: SUBJECT-AWARE PROGRAMMATIC VISUALS
===================================================== */
function generateSubjectVisual(subject, topic) {
    const s = String(subject || '').toLowerCase();
    const t = String(topic || '').toLowerCase();

    // 1. Physics: Mechanics / Motion / Vectors
    if (s.includes('phys') && (t.includes('motion') || t.includes('force') || t.includes('grav') || t.includes('law'))) {
        return `
          <div class="subject-ambient-visual physics-mechanics" style="width:100%; height:52px; background:radial-gradient(circle at 50% 50%, rgba(0,243,255,0.06) 0%, transparent 75%); border:1px solid rgba(0,243,255,0.12); border-radius:12px; margin-bottom:8px; display:flex; align-items:center; justify-content:center; overflow:hidden; position:relative;">
             <svg width="100%" height="100%" viewBox="0 0 300 52" preserveAspectRatio="none" style="opacity:0.85;">
               <line x1="20" y1="42" x2="280" y2="42" stroke="rgba(255,255,255,0.15)" stroke-width="1.5" stroke-dasharray="4 4" />
               <path d="M 30 42 Q 140 6, 250 42" stroke="#00f3ff" stroke-width="2" fill="none" stroke-linecap="round" />
               <line x1="140" y1="24" x2="180" y2="10" stroke="#ff007f" stroke-width="2" marker-end="url(#arrow)" />
               <circle cx="140" cy="24" r="3.5" fill="#00f3ff" style="filter:drop-shadow(0 0 5px #00f3ff);" />
               <text x="185" y="14" fill="#ff007f" font-size="9" font-family="monospace" font-weight="bold">v⃗</text>
             </svg>
          </div>
        `;
    }

    // 2. Physics: Light / Optics
    if (s.includes('phys') && (t.includes('light') || t.includes('optics') || t.includes('reflect') || t.includes('refract'))) {
        return `
          <div class="subject-ambient-visual physics-optics" style="width:100%; height:52px; background:radial-gradient(circle at 50% 50%, rgba(255,0,127,0.06) 0%, transparent 75%); border:1px solid rgba(255,0,127,0.15); border-radius:12px; margin-bottom:8px; display:flex; align-items:center; justify-content:center; overflow:hidden; position:relative;">
             <svg width="100%" height="100%" viewBox="0 0 300 52" preserveAspectRatio="none" style="opacity:0.85;">
               <line x1="150" y1="6" x2="150" y2="46" stroke="rgba(255,255,255,0.2)" stroke-width="1" stroke-dasharray="3 3" />
               <line x1="60" y1="46" x2="240" y2="46" stroke="rgba(255,255,255,0.4)" stroke-width="2" />
               <line x1="80" y1="12" x2="150" y2="46" stroke="#ff007f" stroke-width="2" />
               <line x1="150" y1="46" x2="220" y2="12" stroke="#00f3ff" stroke-width="2" />
               <circle cx="150" cy="46" r="3" fill="#fff" style="filter:drop-shadow(0 0 5px #fff);" />
             </svg>
          </div>
        `;
    }

    // 3. Chemistry: Atoms, Bonding & Reactions
    if (s.includes('chem')) {
        return `
          <div class="subject-ambient-visual chem-bonds" style="width:100%; height:52px; background:radial-gradient(circle at 50% 50%, rgba(16,185,129,0.06) 0%, transparent 75%); border:1px solid rgba(16,185,129,0.15); border-radius:12px; margin-bottom:8px; display:flex; align-items:center; justify-content:center; overflow:hidden; position:relative;">
             <svg width="100%" height="100%" viewBox="0 0 300 52" preserveAspectRatio="none" style="opacity:0.85;">
               <polygon points="120,26 135,10 165,10 180,26 165,42 135,42" stroke="#10b981" stroke-width="1.5" fill="rgba(16,185,129,0.05)" />
               <circle cx="120" cy="26" r="2.5" fill="#10b981" />
               <circle cx="150" cy="26" r="3.5" fill="#00f3ff" style="filter:drop-shadow(0 0 4px #00f3ff);" />
               <circle cx="180" cy="26" r="2.5" fill="#10b981" />
             </svg>
          </div>
        `;
    }

    // 4. Biology: Cells, Genetics & Anatomy
    if (s.includes('bio')) {
        return `
          <div class="subject-ambient-visual bio-helix" style="width:100%; height:52px; background:radial-gradient(circle at 50% 50%, rgba(245,158,11,0.06) 0%, transparent 75%); border:1px solid rgba(245,158,11,0.15); border-radius:12px; margin-bottom:8px; display:flex; align-items:center; justify-content:center; overflow:hidden; position:relative;">
             <svg width="100%" height="100%" viewBox="0 0 300 52" preserveAspectRatio="none" style="opacity:0.85;">
               <path d="M 50 14 Q 90 42, 130 14 T 210 14 T 290 14" stroke="#f59e0b" stroke-width="1.8" fill="none" />
               <path d="M 50 40 Q 90 12, 130 40 T 210 40 T 290 40" stroke="#00f3ff" stroke-width="1.8" fill="none" />
             </svg>
          </div>
        `;
    }

    // 5. Mathematics & Coordinate Geometry Default
    return `
      <div class="subject-ambient-visual math-grid" style="width:100%; height:52px; background:radial-gradient(circle at 50% 50%, rgba(192,132,252,0.06) 0%, transparent 75%); border:1px solid rgba(192,132,252,0.15); border-radius:12px; margin-bottom:8px; display:flex; align-items:center; justify-content:center; overflow:hidden; position:relative;">
         <svg width="100%" height="100%" viewBox="0 0 300 52" preserveAspectRatio="none" style="opacity:0.85;">
           <line x1="30" y1="26" x2="270" y2="26" stroke="rgba(255,255,255,0.2)" stroke-width="1" />
           <line x1="150" y1="6" x2="150" y2="46" stroke="rgba(255,255,255,0.2)" stroke-width="1" />
           <path d="M 70 42 Q 150 8, 230 42" stroke="#c084fc" stroke-width="1.8" fill="none" />
         </svg>
      </div>
    `;
}

function generateDynamicHook(card) {
    if (card.hook && card.hook !== "⚡ QUICK CHECK") return card.hook;

    const diff = String(card.difficulty || '').toLowerCase();
    const time = parseInt(card.time || 15, 10);

    if (diff === 'boss') return "💀 BOSS QUESTION";
    if (time <= 5) return "⚡ 5 SECOND CHALLENGE";
    if (card.type === 'build') return "🧩 BUILD IT";
    if (card.type === 'draw') return "✏️ SKETCH THE VECTOR";
    if (card.type === 'sim') return "🔬 INTERACTIVE LAB";

    const hookPool = [
        "🧠 THINK BEFORE YOU TAP",
        "⚠️ TOPPER TRAP",
        "🎯 ONLY 22% GET THIS",
        "⚡ SPEED CHECK",
        "🔍 SPOT THE CORE RULE"
    ];
    const hash = String(card.q_en || card.id || '0').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return hookPool[hash % hookPool.length];
}

function generateDynamicTitle(card) {
    if (card.title && card.title !== "Can you solve this?" && !card.title.toLowerCase().includes("beat the clock")) {
        return card.title;
    }
    const topic = card.topic || card.subject || 'Core Concept';
    return `${topic} Matrix`;
}

/* =====================================================
   VIRTUALIZED 3-NODE SWIPER VIEWPORT (SAFE 3D ENGINE)
===================================================== */
async function renderReelsDeck() {
    const container = document.getElementById('studyReelsDeck');
    if (!container) return;

    let apiDeck = [];
    try {
        const res = await fetch(`/api/get-questions?target_class=${currentReelsClass}`);
        const data = await res.json();
        if (data && Array.isArray(data.reelDeck) && data.reelDeck.length > 0) {
            apiDeck = data.reelDeck;
        }
    } catch(e) {}

    const interactiveCards = defaultReelDeck.filter(c => 
        (String(c.class_name) === String(currentReelsClass) || c.type === 'build' || c.type === 'sim' || c.type === 'draw')
    );

    let finalDeck = [];

    if (apiDeck.length > 0) {
        let interIdx = 0;
        for (let i = 0; i < apiDeck.length; i++) {
            finalDeck.push(apiDeck[i]);
            if ((i + 1) % 2 === 0 && interIdx < interactiveCards.length) {
                finalDeck.push(interactiveCards[interIdx]);
                interIdx++;
            }
        }
    } else {
        const classDeck = defaultReelDeck.filter(item => String(item.class_name) === String(currentReelsClass));
        finalDeck = classDeck.length > 0 ? classDeck : defaultReelDeck;
    }

    if (window.ReelPersistence && typeof window.ReelPersistence.filterUnsolvedDeck === 'function') {
        finalDeck = window.ReelPersistence.filterUnsolvedDeck(finalDeck);
    }

    activeReelDeck = finalDeck.length > 0 ? finalDeck : defaultReelDeck;
    currentReelIndex = 0;

    setupSwiperEngine(container);
}

function createReelNode(index, initialOffsetPct) {
    const node = document.createElement('div');
    node.className = 'virtual-reel-slot';
    node.style.position = 'absolute';
    node.style.inset = '0';
    node.style.width = '100%';
    node.style.height = '100%';
    node.style.willChange = 'transform';
    
    // SAFE 3D INITIALIZATION
    let initScale = 1;
    let initRot = 0;
    if (initialOffsetPct < 0) { initScale = 0.9; initRot = 12; }
    else if (initialOffsetPct > 0) { initScale = 0.9; initRot = -12; }
    
    node.style.transform = `translate3d(0, ${initialOffsetPct}%, 0) scale(${initScale}) rotateX(${initRot}deg)`;
    node.style.transformOrigin = 'center center';
    node.style.backfaceVisibility = 'hidden'; 
    node.style.transformStyle = 'flat'; // Crucial to prevent canvas freeze
    node.style.transition = 'none';
    node.dataset.index = index;

    if (activeReelDeck.length > 0) {
        const wrappedIdx = getWrappedIndex(index, activeReelDeck.length);
        const card = activeReelDeck[wrappedIdx];
        
        node.innerHTML = generateReelHTML(card, wrappedIdx);

        if (card.type === 'sim' || card.type === 'draw') {
          setTimeout(() => mountReelSimulation(card.id || wrappedIdx, card.sim_id), 50);
        }

        try {
            if (window.MathJax && MathJax.typesetPromise) {
                MathJax.typesetPromise([node]).catch(() => {});
            }
        } catch(e) {}
    } else {
        node.innerHTML = '';
        node.style.visibility = 'hidden';
    }
    return node;
}

function destroyReelNodeSim(node) {
  if (!node) return;
  const canvas = node.querySelector('canvas[data-sim-card-id]');
  if (canvas) {
    const cardId = canvas.getAttribute('data-sim-card-id');
    unmountReelSimulation(cardId);
  }
}

function setupSwiperEngine(container) {
    Object.keys(activeSimInstances).forEach(k => unmountReelSimulation(k));
    Object.keys(activeReelTimers).forEach(id => stopReelTimer(id));

    container.innerHTML = '';
    container.style.position = 'relative';
    container.style.overflow = 'hidden';
    container.style.touchAction = 'none';
    container.style.userSelect = 'none';
    container.style.webkitUserSelect = 'none';
    
    // Core fix: Adaptive height with lower minimum to prevent overflow pushing the dock away
    container.style.height = 'calc(100vh - 180px)';
    container.style.minHeight = '420px';
    
    // SAFE 3D CAMERA DEPTH
    container.style.perspective = '1200px';

    activeNodes.prev = createReelNode(currentReelIndex - 1, -100);
    activeNodes.current = createReelNode(currentReelIndex, 0);
    activeNodes.next = createReelNode(currentReelIndex + 1, 100);

    container.appendChild(activeNodes.prev);
    container.appendChild(activeNodes.current);
    container.appendChild(activeNodes.next);

    const currentCard = activeReelDeck[getWrappedIndex(currentReelIndex, activeReelDeck.length)];
    if (currentCard) {
        setTimeout(() => startReelTimer(currentCard.id || currentReelIndex), 400);
    }

    attachGestureListeners(container);
    attachTokenDragEngine(container);
}

function attachGestureListeners(container) {
    const onStart = (clientY, target) => {
        if (isTransitioning || isTokenDragging || (target && target.closest('.build-choice-btn, .build-slot, .reel-opt-btn, .sim-slider, .reel-dock-action-btn, .draw-canvas-container, canvas, input[type="range"]'))) {
            return;
        }
        isDraggingReel = true;
        touchStartY = clientY;
        currentDeltaY = 0;

        ['prev', 'current', 'next'].forEach(k => {
            if (activeNodes[k]) activeNodes[k].style.transition = 'none';
        });
    };

    const onMove = (clientY, e) => {
        if (!isDraggingReel || isTransitioning || isTokenDragging) return;
        currentDeltaY = clientY - touchStartY;
        if (e && e.cancelable) e.preventDefault();

        const height = container.clientHeight || 600;
        let progress = currentDeltaY / height; // Returns -1 to 1

        // SAFE 3D MATH ENGINE
        if (activeNodes.prev) {
            const p = Math.max(0, progress);
            const scale = 0.9 + (0.1 * p);
            const rotX = 12 - (12 * p);
            activeNodes.prev.style.transform = `translate3d(0, calc(-100% + ${currentDeltaY}px), 0) scale(${scale}) rotateX(${rotX}deg)`;
        }
        
        if (activeNodes.current) {
            const p = Math.abs(progress);
            const scale = 1 - (0.1 * p);
            const rotX = progress * -12; // Tilts backwards as you swipe
            activeNodes.current.style.transform = `translate3d(0, ${currentDeltaY}px, 0) scale(${scale}) rotateX(${rotX}deg)`;
        }
        
        if (activeNodes.next) {
            const p = Math.max(0, -progress);
            const scale = 0.9 + (0.1 * p);
            const rotX = -12 + (12 * p);
            activeNodes.next.style.transform = `translate3d(0, calc(100% + ${currentDeltaY}px), 0) scale(${scale}) rotateX(${rotX}deg)`;
        }
    };

    const onEnd = () => {
        if (!isDraggingReel) return;
        isDraggingReel = false;

        const threshold = 50;
        if (currentDeltaY < -threshold) {
            snapToNode('next');
        } else if (currentDeltaY > threshold) {
            snapToNode('prev');
        } else {
            snapToNode('center');
        }
        currentDeltaY = 0;
    };

    container.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) onStart(e.touches[0].clientY, e.target);
    }, { passive: false });

    container.addEventListener('touchmove', (e) => {
        if (e.touches.length === 1) onMove(e.touches[0].clientY, e);
    }, { passive: false });

    container.addEventListener('touchend', onEnd);
    container.addEventListener('touchcancel', onEnd);

    container.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        onStart(e.clientY, e.target);
        
        const onMouseMove = (ev) => onMove(ev.clientY, ev);
        const onMouseUp = () => {
            onEnd();
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    });

    container.onwheel = (e) => {
        if (isTransitioning || isTokenDragging) return;
        if (Math.abs(e.deltaY) > 35) {
            if (e.deltaY > 0) snapToNode('next');
            else if (e.deltaY < 0) snapToNode('prev');
        }
    };
}

function snapToNode(direction) {
    if (isTransitioning) return;
    isTransitioning = true;

    // ULTIMATE FAILSAFE: Forces swipes to unlock even if JavaScript lags
    setTimeout(() => { isTransitioning = false; }, 350);

    const transitionCSS = 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)';
    ['prev', 'current', 'next'].forEach(k => {
        if (activeNodes[k]) activeNodes[k].style.transition = transitionCSS;
    });

    if (direction === 'next') {
        activeNodes.prev.style.transform = 'translate3d(0, -200%, 0) scale(0.9) rotateX(12deg)';
        activeNodes.current.style.transform = 'translate3d(0, -100%, 0) scale(0.9) rotateX(12deg)';
        activeNodes.next.style.transform = 'translate3d(0, 0%, 0) scale(1) rotateX(0deg)';

        const oldCard = activeReelDeck[getWrappedIndex(currentReelIndex, activeReelDeck.length)];
        if (oldCard) stopReelTimer(oldCard.id || currentReelIndex);

        setTimeout(() => {
            currentReelIndex++;
            recycleForward();
            isTransitioning = false;
        }, 300);

    } else if (direction === 'prev') {
        activeNodes.prev.style.transform = 'translate3d(0, 0%, 0) scale(1) rotateX(0deg)';
        activeNodes.current.style.transform = 'translate3d(0, 100%, 0) scale(0.9) rotateX(-12deg)';
        activeNodes.next.style.transform = 'translate3d(0, 200%, 0) scale(0.9) rotateX(-12deg)';

        const oldCard = activeReelDeck[getWrappedIndex(currentReelIndex, activeReelDeck.length)];
        if (oldCard) stopReelTimer(oldCard.id || currentReelIndex);

        setTimeout(() => {
            currentReelIndex--;
            recycleBackward();
            isTransitioning = false;
        }, 300);

    } else {
        activeNodes.prev.style.transform = 'translate3d(0, -100%, 0) scale(0.9) rotateX(12deg)';
        activeNodes.current.style.transform = 'translate3d(0, 0%, 0) scale(1) rotateX(0deg)';
        activeNodes.next.style.transform = 'translate3d(0, 100%, 0) scale(0.9) rotateX(-12deg)';

        setTimeout(() => {
            isTransitioning = false;
        }, 300);
    }
}

function recycleForward() {
    const container = document.getElementById('studyReelsDeck');
    if (!container) return;

    if (activeNodes.prev) {
      destroyReelNodeSim(activeNodes.prev);
      activeNodes.prev.remove();
    }

    activeNodes.prev = activeNodes.current;
    activeNodes.current = activeNodes.next;

    activeNodes.next = createReelNode(currentReelIndex + 1, 100);
    container.appendChild(activeNodes.next);

    ['prev', 'current', 'next'].forEach(k => {
        if (activeNodes[k]) activeNodes[k].style.transition = 'none';
    });
    activeNodes.prev.style.transform = 'translate3d(0, -100%, 0) scale(0.9) rotateX(12deg)';
    activeNodes.current.style.transform = 'translate3d(0, 0%, 0) scale(1) rotateX(0deg)';
    activeNodes.next.style.transform = 'translate3d(0, 100%, 0) scale(0.9) rotateX(-12deg)';

    const newCard = activeReelDeck[getWrappedIndex(currentReelIndex, activeReelDeck.length)];
    if (newCard) startReelTimer(newCard.id || currentReelIndex);
}

function recycleBackward() {
    const container = document.getElementById('studyReelsDeck');
    if (!container) return;

    if (activeNodes.next) {
      destroyReelNodeSim(activeNodes.next);
      activeNodes.next.remove();
    }

    activeNodes.next = activeNodes.current;
    activeNodes.current = activeNodes.prev;

    activeNodes.prev = createReelNode(currentReelIndex - 1, -100);
    container.insertBefore(activeNodes.prev, activeNodes.current);

    ['prev', 'current', 'next'].forEach(k => {
        if (activeNodes[k]) activeNodes[k].style.transition = 'none';
    });
    activeNodes.prev.style.transform = 'translate3d(0, -100%, 0) scale(0.9) rotateX(12deg)';
    activeNodes.current.style.transform = 'translate3d(0, 0%, 0) scale(1) rotateX(0deg)';
    activeNodes.next.style.transform = 'translate3d(0, 100%, 0) scale(0.9) rotateX(-12deg)';

    const newCard = activeReelDeck[getWrappedIndex(currentReelIndex, activeReelDeck.length)];
    if (newCard) startReelTimer(newCard.id || currentReelIndex);
}

/* =====================================================
   ROADMAP PHASE 4: SIMULATION LIFECYCLE & TELEMETRY
===================================================== */
function mountReelSimulation(cardId, simId) {
  const canvas = document.querySelector(`canvas[data-sim-card-id="${cardId}"]`);
  if (!canvas) return;

  const EngineClass = window.ReelSimRegistry ? window.ReelSimRegistry[simId] : null;
  if (!EngineClass) {
    console.warn(`[Invincible 360] Sim Engine "${simId}" not found in ReelSimRegistry.`);
    return;
  }

  if (activeSimInstances[cardId]) {
    activeSimInstances[cardId].destroy();
  }

  const instance = new EngineClass(canvas);
  activeSimInstances[cardId] = instance;

  updateSimTelemetryHUD(cardId, instance);
}

function unmountReelSimulation(cardId) {
  if (activeSimInstances[cardId]) {
    activeSimInstances[cardId].destroy();
    delete activeSimInstances[cardId];
  }
}

window.updateReelSimParam = function(cardId, paramId, value, unit) {
  const instance = activeSimInstances[cardId];
  if (instance) {
    instance.update(paramId, value);
    updateSimTelemetryHUD(cardId, instance);
  }
  const valBadge = document.getElementById(`valBadge_${cardId}_${paramId}`);
  if (valBadge) {
    valBadge.innerText = `${value} ${unit || ''}`;
  }
};

function updateSimTelemetryHUD(cardId, instance) {
  const telemetry = instance.getTelemetry ? instance.getTelemetry() : null;
  if (!telemetry) return;

  const hudEl = document.getElementById(`telemetryVal_${cardId}`);
  if (hudEl && telemetry.fringeWidthMM !== undefined) {
    hudEl.innerText = `${telemetry.fringeWidthMM.toFixed(2)} mm`;
  }
}

/* =====================================================
   ROADMAP PHASE 4: TACTILE DRAG-AND-DROP BUILDER ENGINE
===================================================== */
function attachTokenDragEngine(container) {
    let dragGhost = null;
    let sourceBtn = null;
    let cardId = null;
    let choiceVal = null;
    let choiceIdx = null;
    let startX = 0, startY = 0;
    let currentHoveredSlot = null;
    let hasMovedSignificantly = false;

    container.addEventListener('pointerdown', (e) => {
        const btn = e.target.closest('.build-choice-btn');
        if (!btn || btn.classList.contains('is-docked-ghost')) return;

        e.stopPropagation();
        isTokenDragging = true;
        hasMovedSignificantly = false;

        sourceBtn = btn;
        cardId = btn.getAttribute('data-card-id');
        choiceVal = btn.getAttribute('data-choice');
        choiceIdx = btn.getAttribute('data-choice-idx');

        startX = e.clientX;
        startY = e.clientY;

        const rect = sourceBtn.getBoundingClientRect();
        
        dragGhost = sourceBtn.cloneNode(true);
        dragGhost.classList.add('is-dragging');
        dragGhost.style.width = `${rect.width}px`;
        dragGhost.style.height = `${rect.height}px`;
        dragGhost.style.left = `${rect.left}px`;
        dragGhost.style.top = `${rect.top}px`;
        document.body.appendChild(dragGhost);

        sourceBtn.classList.add('is-docked-ghost');

        const onPointerMove = (ev) => {
            if (!dragGhost) return;
            ev.preventDefault();

            const deltaX = ev.clientX - startX;
            const deltaY = ev.clientY - startY;

            if (Math.hypot(deltaX, deltaY) > 6) {
                hasMovedSignificantly = true;
            }

            dragGhost.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0) scale(1.15)`;

            const elBelow = document.elementFromPoint(ev.clientX, ev.clientY);
            const slot = elBelow ? elBelow.closest('.build-slot') : null;

            if (slot && !slot.getAttribute('data-filled')) {
                if (currentHoveredSlot !== slot) {
                    clearSlotHover();
                    currentHoveredSlot = slot;
                    currentHoveredSlot.classList.add('slot-hover');
                    if (typeof triggerHaptic === 'function') triggerHaptic([15]);
                }
            } else {
                clearSlotHover();
            }
        };

        const onPointerUp = (ev) => {
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
            window.removeEventListener('pointercancel', onPointerUp);

            if (!dragGhost) return;

            const elBelow = document.elementFromPoint(ev.clientX, ev.clientY);
            const targetSlot = elBelow ? elBelow.closest('.build-slot') : null;

            if (targetSlot && !targetSlot.getAttribute('data-filled')) {
                dropTokenIntoSlot(cardId, targetSlot, choiceVal, choiceIdx);
            } else if (!hasMovedSignificantly) {
                autoFillNextSlot(cardId, choiceVal, choiceIdx, sourceBtn);
            } else {
                sourceBtn.classList.remove('is-docked-ghost');
                if (typeof triggerHaptic === 'function') triggerHaptic([30]);
            }

            clearSlotHover();
            if (dragGhost) dragGhost.remove();
            dragGhost = null;
            sourceBtn = null;
            isTokenDragging = false;
        };

        window.addEventListener('pointermove', onPointerMove, { passive: false });
        window.addEventListener('pointerup', onPointerUp);
        window.addEventListener('pointercancel', onPointerUp);
    });

    function clearSlotHover() {
        if (currentHoveredSlot) {
            currentHoveredSlot.classList.remove('slot-hover');
            currentHoveredSlot = null;
        }
    }
}

function dropTokenIntoSlot(cardId, slotEl, choiceStr, choiceIdx) {
    if (typeof playDing === 'function') playDing();
    if (typeof triggerHaptic === 'function') triggerHaptic([30, 40]);

    slotEl.innerHTML = choiceStr;
    slotEl.setAttribute('data-filled', choiceStr);
    slotEl.setAttribute('data-source', choiceIdx);
    slotEl.classList.add('slot-filled');

    const card = document.getElementById(`reelCard_${cardId}`);
    if (!card) return;

    const slots = card.querySelectorAll('.build-slot');
    const allFilled = Array.from(slots).every(s => s.getAttribute('data-filled'));
    if (allFilled) {
        window.checkBuildAnswer(cardId);
    }
}

function autoFillNextSlot(cardId, choiceStr, choiceIdx, btnEl) {
    const card = document.getElementById(`reelCard_${cardId}`);
    if (!card) {
        if (btnEl) btnEl.classList.remove('is-docked-ghost');
        return;
    }

    const slots = card.querySelectorAll('.build-slot');
    let emptySlot = null;
    for (let slot of slots) {
        if (!slot.getAttribute('data-filled')) {
            emptySlot = slot;
            break;
        }
    }

    if (emptySlot) {
        dropTokenIntoSlot(cardId, emptySlot, choiceStr, choiceIdx);
    } else {
        if (btnEl) btnEl.classList.remove('is-docked-ghost');
    }
}

window.removeBuildTap = function(cardId, slotEl) {
    const sourceIdx = slotEl.getAttribute('data-source');
    if (sourceIdx !== null) {
        const card = document.getElementById(`reelCard_${cardId}`);
        if (card) {
            const btn = card.querySelector(`.build-choice-btn[data-choice-idx="${sourceIdx}"]`);
            if (btn) btn.classList.remove('is-docked-ghost');
        }
        slotEl.innerHTML = '';
        slotEl.removeAttribute('data-filled');
        slotEl.removeAttribute('data-source');
        slotEl.classList.remove('slot-filled', 'slot-hover');
    }
};

window.checkBuildAnswer = function(cardId) {
    stopReelTimer(cardId);
    const card = document.getElementById(`reelCard_${cardId}`);
    if (!card) return;

    const matrix = card.querySelector('.build-matrix');
    const correctAnswer = JSON.parse(matrix.getAttribute('data-answer'));
    const isBoss = matrix.getAttribute('data-boss') === 'true';

    const slots = card.querySelectorAll('.build-slot');
    const currentAnswer = Array.from(slots).map(s => s.getAttribute('data-filled'));
    const isCorrect = JSON.stringify(currentAnswer) === JSON.stringify(correctAnswer);

    slots.forEach(s => s.onclick = null);
    card.querySelectorAll('.build-choice-btn').forEach(b => b.style.pointerEvents = 'none');

    const reveal = document.getElementById(`revealState_${cardId}`);
    const revealTitle = document.getElementById(`revealResultTitle_${cardId}`);
    const xpBadge = document.getElementById(`revealXpBadge_${cardId}`);
    const streakBadge = document.getElementById(`revealStreakBadge_${cardId}`);

    if (isCorrect) {
        slots.forEach(s => s.classList.add('slot-correct'));
        if (typeof playDing === 'function') playDing();
        if (typeof triggerHaptic === 'function') triggerHaptic([30, 50]);
        if (typeof confetti === 'function') confetti({ particleCount: 50, spread: 60, origin:{ y: 0.6 } });
        
        let totalXP = isBoss ? 50 : 20;
        let streakCount = 1;
        if (window.ReelPersistence && typeof window.ReelPersistence.recordSuccess === 'function') {
            const res = window.ReelPersistence.recordSuccess(cardId, isBoss ? 50 : 20, isBoss);
            totalXP = res.totalEarnedXP;
            streakCount = res.currentStreak;
        }

        revealTitle.innerHTML = `<span style="color:var(--accent-emerald, #10b981);">✓ PERFECT BUILD</span>`;
        xpBadge.innerText = `+${totalXP} XP`;
        
        if (streakCount > 2) {
            streakBadge.style.display = 'inline-block';
            streakBadge.innerText = `🔥 x${streakCount} STREAK`;
        }
    } else {
        slots.forEach(s => s.classList.add('slot-wrong'));
        if (typeof playBuzz === 'function') playBuzz();
        if (typeof triggerHaptic === 'function') triggerHaptic([80]);
        
        if (window.ReelPersistence && typeof window.ReelPersistence.recordFailure === 'function') {
            window.ReelPersistence.recordFailure(cardId);
        }

        revealTitle.innerHTML = `<span style="color:var(--accent-rose, #f43f5e);">✕ CIRCUIT BROKEN</span>`;
        xpBadge.innerText = `+0 XP`;
        xpBadge.style.background = 'rgba(255,255,255,0.05)';
        xpBadge.style.color = '#94a3b8';
    }

    setTimeout(() => { if (reveal) reveal.style.transform = 'translateY(0)'; }, 400);
};

/* =====================================================
   ROADMAP PHASE 4: VECTOR & RAY DRAWING EVALUATOR
===================================================== */
window.handleDrawReelAnswer = function(cardId, isCorrect, drawnAngle, expectedAngle) {
  stopReelTimer(cardId);
  const reveal = document.getElementById(`revealState_${cardId}`);
  const revealTitle = document.getElementById(`revealResultTitle_${cardId}`);
  const xpBadge = document.getElementById(`revealXpBadge_${cardId}`);
  const streakBadge = document.getElementById(`revealStreakBadge_${cardId}`);
  if (!reveal) return;

  if (isCorrect) {
    if (typeof playDing === 'function') playDing();
    if (typeof triggerHaptic === 'function') triggerHaptic([30, 50]);
    if (typeof confetti === 'function') confetti({ particleCount: 50, spread: 60, origin:{ y: 0.6 } });

    let totalXP = 25;
    let streakCount = 1;
    if (window.ReelPersistence && typeof window.ReelPersistence.recordSuccess === 'function') {
        const res = window.ReelPersistence.recordSuccess(cardId, 25, false);
        totalXP = res.totalEarnedXP;
        streakCount = res.currentStreak;
    }

    revealTitle.innerHTML = `<span style="color:var(--accent-emerald, #10b981);">✓ LOCKED (${drawnAngle})</span>`;
    xpBadge.innerText = `+${totalXP} XP`;
    if (streakCount > 2) {
      streakBadge.style.display = 'inline-block';
      streakBadge.innerText = `🔥 x${streakCount} STREAK`;
    }
  } else {
    if (typeof playBuzz === 'function') playBuzz();
    if (typeof triggerHaptic === 'function') triggerHaptic([80]);

    if (window.ReelPersistence && typeof window.ReelPersistence.recordFailure === 'function') {
        window.ReelPersistence.recordFailure(cardId);
    }

    revealTitle.innerHTML = `<span style="color:var(--accent-rose, #f43f5e);">✕ MISSED (${drawnAngle} vs ${expectedAngle})</span>`;
    xpBadge.innerText = `+0 XP`;
    xpBadge.style.background = 'rgba(255,255,255,0.05)';
    xpBadge.style.color = '#94a3b8';
  }

  setTimeout(() => { 
    reveal.style.transform = 'translateY(0)'; 
  }, 400);
};

/* =====================================================
   ROADMAP PHASE 1 & 2: FULL-VIEWPORT REEL RENDERER
===================================================== */
function generateReelHTML(card, idx) {
    const sub = card.subject || 'Science';
    const hook = generateDynamicHook(card);
    const dynamicTitle = generateDynamicTitle(card);
    const safeCardId = String(card.id || idx);
    const timeLimit = card.time || 15;
    const isBoss = card.difficulty === 'boss';
    const hookColor = isBoss ? 'var(--accent-rose, #ff007f)' : 'var(--accent-cyan, #00f3ff)';
    
    let contentHTML = '';

    const rawTitle = String(card.q_en || card.title || '');
    const rawSub = String(card.subject || 'Science');
    const qJS = rawTitle.replace(/'/g, "\\'").replace(/"/g, "&quot;");
    const subJS = rawSub.replace(/'/g, "\\'").replace(/"/g, "&quot;");

    // Core fix: Vertical centered positioning prevents buttons from spilling out of bounds
    const dockStyle = `position:absolute; right:8px; top:50%; transform:translateY(-50%); display:flex; flex-direction:column; gap:12px; align-items:center; z-index:25;`;
    const dockBtnStyle = `width:36px; height:36px; border-radius:50%; background:rgba(15,23,42,0.75); border:1px solid rgba(255,255,255,0.15); display:flex; align-items:center; justify-content:center; font-size:14px; cursor:pointer; backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px); box-shadow:0 6px 18px rgba(0,0,0,0.5); transition:transform 0.2s;`;
    const dockLabelStyle = `font-size:8.5px; color:#cbd5e1; font-weight:800; margin-top:2px; text-shadow:0 1px 3px #000;`;

    // 1. STANDARD MCQ 
    if (card.type === 'mcq') {
        let opts = Array.isArray(card.options) ? card.options : [];
        if (typeof card.options === 'string') {
            try { opts = JSON.parse(card.options); } catch(e) { opts = []; }
        }
        
        const ambientVisualHTML = generateSubjectVisual(card.subject, card.topic);

        contentHTML = `
          ${ambientVisualHTML}
          <div class="reel-q-title" style="font-size:13.5px; font-weight:800; color:#ffffff; margin:0 0 8px 0; line-height:1.4;">${safeFormatMath(card.q_en || '')}</div>
          <div class="reel-options-grid" style="display:flex; flex-direction:column; gap:7px; margin-top:6px;">
            ${opts.map((opt, oIdx) => `
              <button type="button" class="reel-opt-btn" onclick="handleReelAnswer('${safeCardId}', ${oIdx}, ${card.answer}, ${isBoss}, this)">
                  <span>${safeFormatMath(String(opt))}</span>
                  <span class="opt-indicator" style="width:12px; height:12px; border-radius:50%; border:2px solid rgba(255,255,255,0.3);"></span>
              </button>
            `).join('')}
          </div>
        `;
    } 
    // 2. TACTILE FORMULA BUILDER
    else if (card.type === 'build') {
        const templateArray = Array.isArray(card.template) ? card.template : [];
        const choicesArray = Array.isArray(card.choices) ? card.choices : [];
        
        const builderSlotsHTML = templateArray.map((item) => {
            if (item === 'slot') {
                return `<div class="build-slot" onclick="window.removeBuildTap('${safeCardId}', this)" data-filled=""></div>`;
            } else {
                return `<div style="font-family:'Space Grotesk',sans-serif; font-size:18px; font-weight:900; color:#cbd5e1; display:flex; align-items:center;">${item}</div>`;
            }
        }).join('');

        const choicesHTML = choicesArray.map((choice, cIdx) => `
            <button type="button" class="build-choice-btn" data-card-id="${safeCardId}" data-choice="${choice}" data-choice-idx="${cIdx}">${choice}</button>
        `).join('');

        contentHTML = `
          <div class="reel-q-title" style="font-size:13.5px; font-weight:800; color:#ffffff; margin:0 0 8px 0; line-height:1.4;">${safeFormatMath(card.q_en || '')}</div>
          
          <div class="build-matrix" data-answer='${JSON.stringify(card.answer)}' data-boss='${isBoss}'>
              <div class="build-slots-tray" style="margin-bottom:14px;">
                  ${builderSlotsHTML}
              </div>
              <div class="build-choices-tray">
                  ${choicesHTML}
              </div>
          </div>
        `;
    }
    // 3. INTERACTIVE SIMULATION REEL
    else if (card.type === 'sim') {
        const controls = Array.isArray(card.controls) ? card.controls : [];
        const isAlgebra = card.sim_id === 'math_algebra_drag';
        const isDna = card.sim_id === 'bio_dna';
        const isCircuit = card.sim_id === 'phy_circuits';
        const isTitration = card.sim_id === 'chem_titration';
        const isTrigCircle = card.sim_id === 'math_trig_circle';
        
        const slidersHTML = controls.map(ctrl => `
          <div style="margin-bottom:4px;">
            <div style="display:flex; justify-content:space-between; font-size:10px; font-weight:800; color:#cbd5e1; margin-bottom:1px;">
              <span>${ctrl.label}</span>
              <span id="valBadge_${safeCardId}_${ctrl.id}" style="color:var(--accent-cyan); font-family:monospace;">${ctrl.val} ${ctrl.unit}</span>
            </div>
            <input type="range" class="sim-slider" min="${ctrl.min}" max="${ctrl.max}" step="${ctrl.step}" value="${ctrl.val}" 
              oninput="window.updateReelSimParam('${safeCardId}', '${ctrl.id}', this.value, '${ctrl.unit}')"
              style="width:100%; height:4px; accent-color:var(--accent-cyan); cursor:pointer;">
          </div>
        `).join('');

        const algebraControlsHTML = `
          <div style="display:flex; gap:6px; justify-content:center; flex-wrap:wrap; margin-top:6px;">
            <button type="button" class="reel-opt-btn" style="flex:1; justify-content:center; padding:8px 10px; font-size:11px;" onclick="window.triggerAlgebraStep('${safeCardId}', '-6')">-6 Both Sides</button>
            <button type="button" class="reel-opt-btn" style="flex:1; justify-content:center; padding:8px 10px; font-size:11px;" onclick="window.triggerAlgebraStep('${safeCardId}', '÷2')">÷2 Both Sides</button>
            <button type="button" class="reel-opt-btn" style="flex:1; justify-content:center; padding:8px 10px; font-size:11px;" onclick="window.triggerAlgebraStep('${safeCardId}', '+6')">+6 Both Sides</button>
          </div>
        `;

        const dnaControlsHTML = `
          <div style="display:flex; gap:8px; justify-content:center; margin-top:6px;">
            <button type="button" class="reel-opt-btn" style="flex:1; justify-content:center; font-size:13px; font-weight:900;" onclick="window.slotDnaBase('${safeCardId}', 'A')">A</button>
            <button type="button" class="reel-opt-btn" style="flex:1; justify-content:center; font-size:13px; font-weight:900;" onclick="window.slotDnaBase('${safeCardId}', 'T')">T</button>
            <button type="button" class="reel-opt-btn" style="flex:1; justify-content:center; font-size:13px; font-weight:900;" onclick="window.slotDnaBase('${safeCardId}', 'G')">G</button>
            <button type="button" class="reel-opt-btn" style="flex:1; justify-content:center; font-size:13px; font-weight:900;" onclick="window.slotDnaBase('${safeCardId}', 'C')">C</button>
          </div>
        `;

        const circuitControlsHTML = `
          <div style="display:flex; justify-content:center; margin-top:6px;">
            <button type="button" class="reel-opt-btn" style="width:100%; justify-content:center; padding:9px 12px; font-size:11px; font-weight:800; background:rgba(0,229,255,0.08); border-color:var(--accent-cyan);" onclick="window.toggleCircuitSwitch('${safeCardId}')">🔌 TOGGLE KNIFE SWITCH</button>
          </div>
        `;

        const titrationControlsHTML = `
          <div style="display:flex; justify-content:center; margin-top:6px;">
            <button type="button" class="reel-opt-btn" style="width:100%; justify-content:center; padding:9px 12px; font-size:11px; font-weight:800; background:rgba(244,114,182,0.12); border-color:#f472b6; color:#f472b6;" onclick="window.dispenseTitrationDrop('${safeCardId}')">💧 DISPENSE NaOH DROP</button>
          </div>
        `;

        const trigControlsHTML = `
          <div style="font-size:10px; color:#64748b; font-weight:700; text-align:center; margin-top:6px;">👆 Touch and drag radial handle around circle</div>
        `;

        let activeSimControlsHTML = '';
        if (isAlgebra) activeSimControlsHTML = algebraControlsHTML;
        else if (isDna) activeSimControlsHTML = dnaControlsHTML;
        else if (isCircuit) activeSimControlsHTML = circuitControlsHTML;
        else if (isTitration) activeSimControlsHTML = titrationControlsHTML;
        else if (isTrigCircle) activeSimControlsHTML = trigControlsHTML;
        else if (controls.length > 0) activeSimControlsHTML = `<div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:6px 10px;">${slidersHTML}</div>`;

        contentHTML = `
          <div class="reel-q-title" style="font-size:13.5px; font-weight:800; color:#ffffff; margin:0 0 6px 0; line-height:1.35;">${safeFormatMath(card.q_en || '')}</div>
          
          <div style="position:relative; width:100%; height:130px; background:#020617; border:1px solid rgba(0,229,255,0.25); border-radius:14px; overflow:hidden; margin-bottom:8px; box-shadow:inset 0 0 20px rgba(0,0,0,0.8);">
             <canvas data-sim-card-id="${safeCardId}" style="width:100%; height:100%; display:block;"></canvas>
             
             <div style="position:absolute; top:6px; right:6px; background:rgba(8,13,26,0.85); border:1px solid rgba(0,229,255,0.3); border-radius:6px; padding:2px 6px; font-size:9px; font-family:monospace; font-weight:900; color:var(--accent-cyan); backdrop-filter:blur(8px);">
               <span id="angleReadout_${safeCardId}">β = <span id="telemetryVal_${safeCardId}">-- mm</span></span>
             </div>
          </div>

          ${activeSimControlsHTML}
        `;
    }
    // 4. PREDICTION & TOUCH DRAWING ENGINE
    else if (card.type === 'draw') {
        contentHTML = `
          <div class="reel-q-title" style="font-size:13.5px; font-weight:800; color:#ffffff; margin:0 0 6px 0; line-height:1.35;">${safeFormatMath(card.q_en || '')}</div>
          
          <div class="draw-canvas-container" style="position:relative; width:100%; height:135px; background:#020617; border:1px solid rgba(0,243,255,0.25); border-radius:14px; overflow:hidden; margin-bottom:8px;">
             <canvas data-sim-card-id="${safeCardId}" style="width:100%; height:100%; display:block; cursor:crosshair;"></canvas>
             <div style="position:absolute; top:6px; left:8px; background:rgba(8,13,26,0.85); border:1px solid rgba(255,255,255,0.12); border-radius:6px; padding:2px 6px; font-size:9px; font-weight:800; color:#cbd5e1;">👆 Drag reflected ray</div>
             <div style="position:absolute; top:6px; right:8px; background:rgba(8,13,26,0.85); border:1px solid rgba(0,229,255,0.35); border-radius:6px; padding:2px 6px; font-size:9.5px; font-family:monospace; font-weight:900; color:var(--accent-cyan);" id="angleReadout_${safeCardId}">θ_drawn = --°</div>
          </div>
          
          <div style="font-size:10px; color:#64748b; font-weight:700; text-align:center;">Release finger to lock prediction</div>
        `;
    }
    // 5. TOPPER TRAP / HACK
    else if (card.type === 'trap' || card.type === 'hack') {
        const isTrap = card.type === 'trap';
        return `
          <div class="reel-card-inner" style="position:relative; width:100%; height:100%; background:linear-gradient(180deg, rgba(15,23,42,0.92) 0%, rgba(3,7,18,0.96) 100%); backdrop-filter:blur(16px); -webkit-backdrop-filter:blur(16px); border:1px solid rgba(255,255,255,0.08); border-left:4px solid ${isTrap ? 'var(--accent-rose, #ff007f)' : 'var(--accent-cyan, #00f3ff)'}; border-radius:24px; padding:20px; box-sizing:border-box; display:flex; flex-direction:column; justify-content:center; box-shadow:0 24px 60px rgba(0,0,0,0.85);">
            <div class="reel-q-title" style="font-size:18px; font-weight:900; color:${isTrap ? '#ff007f' : 'var(--accent-cyan, #00f3ff)'}; margin:0 0 10px 0;">${dynamicTitle}</div>
            <div style="font-size:13.5px; color:#f1f5f9; line-height:1.55; background:rgba(255,255,255,0.04); padding:14px; border-radius:14px; border:1px solid rgba(255,255,255,0.08);">${card.content || ''}</div>
            ${card.rule ? `<div style="font-size:12px; color:#10b981; font-weight:800; margin-top:10px; background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.25); padding:10px; border-radius:10px;">✅ NCERT RULE: ${card.rule}</div>` : ''}
            
            <div style="${dockStyle}">
              <div style="text-align:center;">
                <div style="${dockBtnStyle} border-color:var(--accent-cyan, #00f3ff);" onclick="sendReelToDoubtSolver('${qJS}', '${subJS}')">🧠</div>
                <div style="${dockLabelStyle}">Explain</div>
              </div>
              <div style="text-align:center;">
                <div style="${dockBtnStyle}" onclick="reactStory('mind')">🤯</div>
                <div style="${dockLabelStyle}">Clout</div>
              </div>
              <div style="text-align:center;">
                <div style="${dockBtnStyle}" onclick="shareReel('${qJS}')">🚀</div>
                <div style="${dockLabelStyle}">Share</div>
              </div>
            </div>

            <div style="position:absolute; bottom:14px; left:16px; font-size:10px; color:#64748b; font-weight:800;">⚡ Swipe up for next</div>
          </div>
        `;
    }

    return `
      <div class="reel-card-inner" id="reelCard_${safeCardId}" data-time="${timeLimit}" data-id="${safeCardId}" style="position:relative; width:100%; height:100%; background:#0B1120 !important; border:1px solid rgba(255,255,255,0.08) !important; border-radius:20px; display:flex; flex-direction:column; padding:0; margin:0; box-sizing:border-box; overflow:hidden;">
        
        <!-- STATE A: Linear Urgency Timer -->
        <div style="width:100%; height:3px; background:rgba(255,255,255,0.05); flex-shrink:0;">
            <div id="timerFill_${safeCardId}" style="height:100%; width:100%; background:${hookColor}; box-shadow:0 0 10px ${hookColor}; transition:width 0.1s linear;"></div>
        </div>

        <div style="padding:14px 14px 10px; flex:1; display:flex; flex-direction:column; justify-content:flex-start; overflow-y:auto; overflow-x:hidden; box-sizing:border-box;">
            <div style="margin-bottom:8px; flex-shrink:0;">
                <div style="font-size:9px; font-weight:900; letter-spacing:0.8px; color:${hookColor}; background:rgba(255,255,255,0.05); border:1px solid ${hookColor}; display:inline-block; padding:3px 7px; border-radius:6px; margin-bottom:4px;">
                    ${hook}
                </div>
                <div style="font-family:'Space Grotesk', system-ui, sans-serif; font-size:17px; font-weight:900; color:#fff; line-height:1.2; margin-bottom:2px;">${dynamicTitle}</div>
                <div style="font-size:10px; color:rgba(203,213,225,0.7); font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">${sub} • ${card.topic || 'Syllabus'} | CLASS ${card.class_name || currentReelsClass}</div>
            </div>
            
            <div style="position:relative; z-index:10; padding-right:52px;">
                ${contentHTML}
            </div>
        </div>

        <!-- STATE B: TWO-STAGE GLASS REVEAL DRAWER -->
        <div id="revealState_${safeCardId}" style="position:absolute; bottom:0; left:0; right:0; background:rgba(11,17,32,0.96); backdrop-filter:blur(24px); -webkit-backdrop-filter:blur(24px); border-top:1px solid rgba(255,255,255,0.12); padding:16px 14px; transform:translateY(100%); transition:transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); z-index:30; border-radius:20px 20px 0 0;">
            <div id="revealResultTitle_${safeCardId}" style="font-family:'Space Grotesk', system-ui, sans-serif; font-size:18px; font-weight:900; margin-bottom:4px;"></div>
            <div style="font-size:12px; color:#cbd5e1; line-height:1.45; margin-bottom:10px; padding:8px 10px; background:rgba(255,255,255,0.04); border-radius:10px; border:1px solid rgba(255,255,255,0.06);">
                ${card.trap || 'Master the core NCERT definitions in the Science Lab.'}
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <div style="display:flex; gap:6px;">
                    <span id="revealXpBadge_${safeCardId}" style="background:rgba(245,158,11,0.15); color:#fbbf24; font-weight:900; font-size:10px; padding:4px 8px; border-radius:6px; border:1px solid rgba(245,158,11,0.3);">+0 XP</span>
                    <span id="revealStreakBadge_${safeCardId}" style="display:none; background:rgba(244,63,94,0.15); color:#f43f5e; font-weight:900; font-size:10px; padding:4px 8px; border-radius:6px; border:1px solid rgba(244,63,94,0.3);">🔥 STREAK</span>
                </div>
                <div style="font-size:9.5px; color:#64748b; font-weight:700;">68% Students Solved</div>
            </div>
            <div style="text-align:center; font-size:9.5px; font-weight:800; color:#64748b; letter-spacing:1px;">↑ SWIPE FOR NEXT</div>
        </div>

        <div style="${dockStyle}">
          <div style="text-align:center;">
            <div style="${dockBtnStyle} border-color:var(--accent-cyan, #00f3ff); box-shadow:0 0 12px rgba(0,243,255,0.3);" onclick="sendReelToDoubtSolver('${qJS}', '${subJS}')">🧠</div>
            <div style="${dockLabelStyle}">Doubt</div>
          </div>
          <div style="text-align:center;">
            <div style="${dockBtnStyle}" onclick="reactStory('fire')">🔥</div>
            <div style="${dockLabelStyle}">Clout</div>
          </div>
          <div style="text-align:center;">
            <div style="${dockBtnStyle}" onclick="shareReel('${qJS}')">🚀</div>
            <div style="${dockLabelStyle}">Share</div>
          </div>
        </div>
      </div>
    `;
}

// ---------------------------------------------------
// TIMERS & GAMEPLAY CONTROLS
// ---------------------------------------------------
function startReelTimer(cardId) {
    if (activeReelTimers[cardId]) return; 
    const card = document.getElementById(`reelCard_${cardId}`);
    const fill = document.getElementById(`timerFill_${cardId}`);
    if (!card || !fill) return;

    const timeLimit = parseInt(card.getAttribute('data-time'), 10) * 1000;
    let timeLeft = timeLimit;
    
    activeReelTimers[cardId] = setInterval(() => {
        timeLeft -= 100;
        const percentage = Math.max(0, (timeLeft / timeLimit) * 100);
        fill.style.width = `${percentage}%`;

        if (timeLeft <= 0) {
            stopReelTimer(cardId);
            const grid = card.querySelector('.reel-options-grid');
            if (grid) handleReelAnswer(cardId, -1, -1, false, null);
            const matrix = card.querySelector('.build-matrix');
            if (matrix) window.checkBuildAnswer(cardId);
        }
    }, 100);
}

function stopReelTimer(cardId) {
    if (activeReelTimers[cardId]) {
        clearInterval(activeReelTimers[cardId]);
        delete activeReelTimers[cardId];
    }
}

// ---------------------------------------------------
// TWO-STAGE MCQ REVEAL EVALUATOR
// ---------------------------------------------------
function handleReelAnswer(cardId, selectedIdx, correctIdx, isBoss, btnEl) {
    stopReelTimer(cardId);
    const card = document.getElementById(`reelCard_${cardId}`);
    const reveal = document.getElementById(`revealState_${cardId}`);
    const revealTitle = document.getElementById(`revealResultTitle_${cardId}`);
    const xpBadge = document.getElementById(`revealXpBadge_${cardId}`);
    const streakBadge = document.getElementById(`revealStreakBadge_${cardId}`);
    
    if (!card || !reveal) return;

    const buttons = card.querySelectorAll('.reel-opt-btn');
    buttons.forEach((btn, idx) => {
        btn.disabled = true;
        btn.style.opacity = '0.45';
        if (idx === correctIdx) {
            btn.style.opacity = '1';
            btn.classList.add('correct');
        }
    });

    const isCorrect = Number(selectedIdx) === Number(correctIdx);

if (window.InvincibleTelemetry) {
  window.InvincibleTelemetry.emit('REEL_RESOLVED', {
    subject: 'Science',
    topic: 'General Concept',
    isCorrect: isCorrect,
    timeTaken: 5,
    isBoss: false
  });
}



    if (isCorrect) {
        if (typeof playDing === 'function') playDing();
        if (typeof triggerHaptic === 'function') triggerHaptic([30, 50]);
        if (typeof confetti === 'function') confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } });

        if (selectedIdx >= 0 && btnEl) {
            btnEl.classList.add('correct');
            const indicator = btnEl.querySelector('.opt-indicator');
            if (indicator) {
                indicator.style.background = '#10b981';
                indicator.style.borderColor = '#10b981';
            }
        }

        let totalXP = isBoss ? 50 : 20;
        let streakCount = 1;
        if (window.ReelPersistence && typeof window.ReelPersistence.recordSuccess === 'function') {
            const res = window.ReelPersistence.recordSuccess(cardId, isBoss ? 50 : 20, isBoss);
            totalXP = res.totalEarnedXP;
            streakCount = res.currentStreak;
        }

        revealTitle.innerHTML = `<span style="color:#10b981;">✓ CORRECT</span>`;
        xpBadge.innerText = `+${totalXP} XP`;
        if (streakCount > 2) {
            streakBadge.style.display = 'inline-block';
            streakBadge.innerText = `🔥 x${streakCount} STREAK`;
        }
    } else {
        if (typeof playBuzz === 'function') playBuzz();
        if (typeof triggerHaptic === 'function') triggerHaptic([80]);

        if (selectedIdx >= 0 && btnEl) {
            btnEl.classList.add('wrong');
            const indicator = btnEl.querySelector('.opt-indicator');
            if (indicator) {
                indicator.style.background = '#ff007f';
                indicator.style.borderColor = '#ff007f';
            }
        }

        if (window.ReelPersistence && typeof window.ReelPersistence.recordFailure === 'function') {
            window.ReelPersistence.recordFailure(cardId);
        }

        revealTitle.innerHTML = `<span style="color:#ff007f;">✕ NOT THIS TIME</span>`;
        xpBadge.innerText = `+0 XP`;
        xpBadge.style.background = 'rgba(255,255,255,0.05)';
        xpBadge.style.color = '#94a3b8';
    }

    setTimeout(() => { reveal.style.transform = 'translateY(0)'; }, 350);
}

function shareReel(text) {
    if (navigator.share) {
        navigator.share({ title: 'Invincible 360 Reel', text: `Can you solve this? ${text} 🔥 Join the clash on Invincible 360!`, url: window.location.href });
    } else {
        navigator.clipboard.writeText(`${text} - Solve on Invincible 360: ${window.location.href}`);
        alert('📋 Reel link copied to clipboard!');
    }
}

function sendReelToDoubtSolver(questionText, subject) {
    if (typeof switchTab === 'function') switchTab('doubt');
    const qInput = document.getElementById('question');
    if (qInput) qInput.value = questionText;
    
    if (subject) {
        document.querySelectorAll("#doubtSection .subject").forEach(b => {
            if (b.getAttribute('data-subject') && b.getAttribute('data-subject').toLowerCase() === subject.toLowerCase()) {
                b.click();
            }
        });
    }
}

/* =====================================================
   STORIES & COMMUNITY BROADCAST ENGINE
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
  { name: "Exam Blur", css: "blur(1px) contrast(1.1)", color: "#14b8a6" }
];

function renderFilters() {
  const tray = document.getElementById('filterTray');
  if(!tray) return;
  tray.innerHTML = storyFilters.map((f, idx) => `
    <button type="button" class="filter-btn ${idx === 0 ? 'active' : ''}" onclick="applyFilter(${idx}, this)" style="border:none; background:none; cursor:pointer;">
      <div class="filter-preview-box" style="width:50px; height:50px; border-radius:12px; background-color:${f.color}; filter:${f.css};"></div>
      <div class="filter-name" style="color:#fff; font-size:10px; text-align:center; margin-top:4px;">${f.name}</div>
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
      const MAX_SIZE = 900;
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
      currentStoryImageBase64 = canvas.toDataURL('image/jpeg', 0.65); 
      
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
  addStoryBtn.addEventListener('click', () => { 
    const m = document.getElementById('storyModal');
    if (m) { 
      m.style.display = 'flex'; 
      renderFilters(); 
    }
  });
}

async function loadActiveStories() {
    const container = document.getElementById('dynamicStoryCircles');
    if (!container) return;
    
    let studentSchool = localStorage.getItem('userSchool') || localStorage.getItem('testOrg') || 'ALL';

    try {
        const res = await fetch(`/api/stories?school_id=${encodeURIComponent(studentSchool)}&t=${Date.now()}`);
        const data = await res.json();
        const dbStories = Array.isArray(data.stories) ? data.stories : (Array.isArray(data) ? data : []);

        activeStories = dbStories.filter(s => studentSchool === 'ALL' || s.institution === studentSchool || !s.institution);
        renderStoryCircles();
    } catch(e) { 
        console.error("Story load error:", e); 
    }
}

function renderStoryCircles() {
    const container = document.getElementById('dynamicStoryCircles');
    if (!container) return;

    container.innerHTML = activeStories.map((s, idx) => {
        const author = String(s.author_name || s.author || s.name || "Student");
        const initial = author.charAt(0).toUpperCase() || "S";
        return `
        <div class="story-circle-item" onclick="openStoryViewer(${idx})" style="cursor:pointer;">
            <div class="story-avatar-wrap" style="width:52px; height:52px; border-radius:50%; background:linear-gradient(135deg, var(--accent-cyan, #00f3ff), #0284c7); padding:2px; margin-bottom:4px; border:1px solid rgba(0,243,255,0.3);">
                <div class="story-avatar-inner" style="width:100%; height:100%; border-radius:50%; background:#05070D; display:flex; align-items:center; justify-content:center; font-size:18px; font-weight:900; color:#fff;">${initial}</div>
            </div>
            <div class="story-username" style="font-size:10px; color:#94a3b8; text-align:center; max-width:56px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${safeEscapeHTML(author)}</div>
        </div>
        `;
    }).join('');
}

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
      resolve(canvas.toDataURL('image/jpeg', 0.65));
    };
    img.onerror = () => resolve(base64Image); 
    img.src = base64Image;
  });
}

const pubStoryBtn = document.getElementById('btnPublishStory');
if (pubStoryBtn) {
  pubStoryBtn.onclick = async () => {
    const name = document.getElementById('storyAuthorName')?.value.trim();
    const age = document.getElementById('storyAuthorAge')?.value.trim();
    const stuClass = document.getElementById('storyAuthorClass')?.value.trim();
    const inst = document.getElementById('storyInstitution')?.value.trim();
    const caption = document.getElementById('storyCaption')?.value.trim();

    if (!name) return alert("Please enter your Name.");
    
    pubStoryBtn.disabled = true;
    pubStoryBtn.textContent = "PROCESSING... ⏳";

    try {
        const finalImage = await bakeImageWithFilter(currentStoryImageBase64, selectedFilterCSS);
        pubStoryBtn.textContent = "UPLOADING... 🚀";

        const optimisticStory = {
            id: Date.now(),
            author_name: name,
            institution: inst || 'Invincible Coaching',
            caption: caption || '',
            media_url: finalImage || null,
            age: age,
            class_name: stuClass
        };
        activeStories.unshift(optimisticStory);
        renderStoryCircles(); 
        
        const storyModal = document.getElementById('storyModal');
        if (storyModal) storyModal.style.display = 'none';

        fetch('/api/stories', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ 
              action: 'create_story', 
              author_name: name, 
              institution: inst || 'Invincible Coaching',
              student_class: stuClass || '10',
              caption: caption || '',
              media_url: finalImage || null
            })
        }).then(async (res) => {
            const data = await res.json();
            if (data.story && data.story.id) {
              let myStoryIds = JSON.parse(localStorage.getItem('my_created_stories') || '[]');
              myStoryIds.push(data.story.id);
              localStorage.setItem('my_created_stories', JSON.stringify(myStoryIds));
            }
            loadActiveStories(); 
        }).catch(err => console.error(err));

        currentStoryImageBase64 = null;
        selectedFilterCSS = "none";
        const preview = document.getElementById('storyImagePreview');
        if (preview) { preview.style.display = 'none'; preview.style.filter = "none"; preview.src = ""; }
        const placeholder = document.getElementById('storyPlaceholderText');
        if (placeholder) placeholder.style.display = 'block';
        if (document.getElementById('storyCaption')) document.getElementById('storyCaption').value = '';
        
        if (typeof playWin === 'function') playWin();
        alert("🎉 Story Posted Successfully!");
    } catch(err) { 
        alert("Upload failed: " + err.message); 
    } finally {
        pubStoryBtn.disabled = false;
        pubStoryBtn.textContent = "🚀 POST STORY";
    }
  };
}

function getViewerIdentity() {
  let name = localStorage.getItem('studentName') || localStorage.getItem('userName');
  let school = localStorage.getItem('userSchool') || localStorage.getItem('testOrg');

  if (!name) {
    let guestId = localStorage.getItem('invincible_guest_id');
    if (!guestId) {
      guestId = Math.floor(1000 + Math.random() * 9000);
      localStorage.setItem('invincible_guest_id', guestId);
    }
    name = `Student #${guestId}`;
  }
  if (!school) school = 'Invincible Explorer';
  return { name, school };
}

async function recordStoryView(storyId) {
  if (!storyId) return;
  const { name, school } = getViewerIdentity();
  try {
    await fetch('/api/stories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'record_view', story_id: storyId, viewer_name: name, viewer_institution: school })
    });
  } catch (e) {}
}

async function fetchStoryViewers(storyId) {
  if (!storyId) return [];
  try {
    const res = await fetch(`/api/stories?action=get_viewers&story_id=${storyId}`);
    const data = await res.json();
    return Array.isArray(data.viewers) ? data.viewers : [];
  } catch (e) { return []; }
}

window.openStoryViewer = function(idx) {
  currentStoryIdx = idx;
  const viewer = document.getElementById('storyViewer');
  if (viewer) {
    viewer.style.display = 'flex';
    renderStorySlide();
  }
};

window.prevStorySlide = function() {
  if (currentStoryIdx > 0) {
    currentStoryIdx--;
    renderStorySlide();
  }
};

window.nextStorySlide = function() {
  if (currentStoryIdx < activeStories.length - 1) {
    currentStoryIdx++;
    renderStorySlide();
  } else {
    closeStoryViewer();
  }
};

function renderStorySlide() {
  clearTimeout(storyTimer);
  const story = activeStories[currentStoryIdx];
  if (!story) {
    closeStoryViewer();
    return;
  }

  if (story.id) recordStoryView(story.id);

  const authorDetailsEl = document.getElementById('viewerAuthorDetails');
  const schoolDetailsEl = document.getElementById('viewerSchoolDetails');
  const avatarEl = document.getElementById('viewerAvatar');
  const capEl = document.getElementById('viewerCaption');
  const bgImg = document.getElementById('viewerImageBg');

  const authorName = String(story.author_name || story.author || story.name || "Student");
  const ageText = story.age ? `, ${story.age}` : '';
  const classText = story.class_name ? ` • ${story.class_name}` : '';

  if (authorDetailsEl) authorDetailsEl.textContent = `${authorName}${ageText}${classText}`;
  if (schoolDetailsEl) schoolDetailsEl.textContent = `📍 ${story.institution || 'Invincible Coaching'}`;
  if (avatarEl) avatarEl.textContent = authorName.charAt(0).toUpperCase() || 'S';

  if (capEl) capEl.innerHTML = String(story.caption || '').replace(/\n/g, '<br>');

  const imageUrl = story.media_url || story.image_data || story.image_url || story.image;

  if (bgImg) {
    if (imageUrl && imageUrl.length > 50) {
      bgImg.src = imageUrl;
      bgImg.style.display = 'block';
    } else {
      bgImg.style.display = 'none';
    }
  }

  const rFire = document.getElementById('reactCountFire');
  const rMind = document.getElementById('reactCountMind');
  const r100 = document.getElementById('reactCount100');
  if (rFire) rFire.textContent = story.reactions_fire ? `(${story.reactions_fire})` : '';
  if (rMind) rMind.textContent = story.reactions_mind ? `(${story.reactions_mind})` : '';
  if (r100) r100.textContent = story.reactions_100 ? `(${story.reactions_100})` : '';

  const viewCountEl = document.getElementById('storyViewCount');
  if (viewCountEl && story.id) {
    fetchStoryViewers(story.id).then(viewers => {
      if (viewCountEl) viewCountEl.textContent = viewers.length;
    });
  }

  const pContainer = document.getElementById('storyProgressContainer');
  if (pContainer) {
    pContainer.innerHTML = activeStories.map((_, i) => `
      <div class="story-progress-seg" style="flex:1; height:3px; background:rgba(255,255,255,0.3); border-radius:3px; overflow:hidden;">
        <div class="story-progress-fill" style="height:100%; background:#fff; width: ${i < currentStoryIdx ? '100%' : (i === currentStoryIdx ? '100%' : '0%')}; transition: width 6s linear;"></div>
      </div>
    `).join('');
  }

  storyTimer = setTimeout(nextStorySlide, 6000);
}

window.closeStoryViewer = function() {
  clearTimeout(storyTimer);
  const v = document.getElementById('storyViewer');
  if (v) v.style.display = 'none';
};

window.reactStory = async function(type) {
  if (typeof playDing === 'function') playDing();
  if (typeof confetti === 'function') confetti({ particleCount: 30, spread: 40, origin: { y: 0.8 } });

  const story = activeStories[currentStoryIdx];
  if (!story || !story.id) return;
  const { name, school } = getViewerIdentity();

  try {
    await fetch('/api/stories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'react', story_id: story.id, reaction_type: type, viewer_name: name, viewer_institution: school })
    });
  } catch (e) {}
};

// ---------------------------------------------------
// BOOTSTRAP INITIALIZER
// ---------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    loadActiveStories();
    renderReelsDeck();
});
