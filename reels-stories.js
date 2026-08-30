/* =====================================================
   ⚡ ZERO-TOKEN STUDY REELS ENGINE (CLEAN TACTILE UI)
===================================================== */
const defaultReelDeck = [
    { id: 101, class_name: "10", type: "mcq", subject: "Physics", topic: "Light & Optics", q_en: "If magnification m = -1 for a spherical mirror, where is the object placed?", q_hi: "यदि किसी गोलीय दर्पण के लिए m = -1 है, तो वस्तु कहाँ स्थित है?", options: ["At Infinity", "At Focus (F)", "At Centre of Curvature (C)", "Between F and P"], answer: 2, trap: "Negative magnification signifies a real and inverted image of identical size, which only happens at C." },
    { id: 102, class_name: "10", type: "trap", subject: "Physics", topic: "Electricity", title: "🚨 Ohm's Law Trap", content: "V = IR is ONLY valid when physical conditions like temperature remain constant. If the wire heats up, resistance changes!", rule: "Always state 'at constant temperature' in CBSE board questions to get full marks." },
    { id: 103, class_name: "10", type: "formula", subject: "Physics", topic: "Electricity", title: "🧠 Power Vault", formula: "P = VI = I^2R = \\frac{V^2}{R}", tip: "In series circuits use P = I²R. In parallel household circuits use P = V²/R." },
    { id: 104, class_name: "10", type: "mcq", subject: "Chemistry", topic: "Chemical Reactions", q_en: "When lead nitrate powder is heated in a boiling tube, brown fumes are emitted. The gas is:", q_hi: "लेड नाइट्रेट को गर्म करने पर भूरे रंग का धुआँ निकलता है। वह गैस कौन सी है?", options: ["NO", "NO₂ (Nitrogen Dioxide)", "N₂O", "O₂"], answer: 1, trap: "2Pb(NO₃)₂ → 2PbO + 4NO₂↑ + O₂. Brown fumes are strictly NO₂." },
    { id: 105, class_name: "10", type: "trap", subject: "Chemistry", topic: "Acids & Bases", title: "🚨 Acid Dilution Danger", content: "NEVER add water to concentrated acid! It causes violent exothermic splashing.", rule: "Always add Acid to Water drop by drop with continuous stirring." },
    { id: 106, class_name: "10", type: "mcq", subject: "Mathematics", topic: "Trigonometry", q_en: "If sin θ + sin² θ = 1, then the value of cos² θ + cos⁴ θ is:", q_hi: "यदि sin θ + sin² θ = 1 है, तो cos² θ + cos⁴ θ का मान क्या होगा?", options: ["0", "1", "2", "-1"], answer: 1, trap: "sin θ = 1 - sin² θ = cos² θ. Squaring both sides: sin² θ = cos⁴ θ. So cos² θ + cos⁴ θ = sin θ + sin² θ = 1." },
    { id: 901, class_name: "9", type: "mcq", subject: "Physics", topic: "Gravitation", q_en: "The value of acceleration due to gravity (g) at the center of the Earth is:", q_hi: "पृथ्वी के केंद्र पर गुरुत्वीय त्वरण (g) का मान कितना होता है?", options: ["9.8 m/s²", "Zero (0)", "Infinite", "4.9 m/s²"], answer: 1, trap: "At Earth's center, mass attracts equally in all directions, so net gravitational force is zero." },
    { id: 902, class_name: "9", type: "trap", subject: "Physics", topic: "Work & Energy", title: "🚨 Centripetal Work Trap", content: "Work done by centripetal force is ALWAYS ZERO because force is perpendicular to displacement (θ = 90°, cos 90° = 0).", rule: "Satellites orbiting Earth do zero net work." },
    { id: 1101, class_name: "11", type: "mcq", subject: "Physics", topic: "Kinematics", q_en: "For a projectile, the angle of projection for maximum horizontal range is:", q_hi: "प्रक्षेप्य के लिए अधिकतम क्षैतिज परास का प्रक्षेपण कोण क्या है?", options: ["30°", "45°", "60°", "90°"], answer: 1, trap: "Range R = (u² sin 2θ)/g. Maximum when sin 2θ = 1 ⇒ θ = 45°." },
    { id: 1201, class_name: "12", type: "mcq", subject: "Physics", topic: "Electrostatics", q_en: "Electric flux through a closed Gaussian surface enclosing an electric dipole is:", q_hi: "किसी बंद गॉसियन सतह के भीतर विद्युत द्विध्रुव होने पर कुल विद्युत फ्लक्स क्या होगा?", options: ["q / ε₀", "2q / ε₀", "Zero (0)", "Infinite"], answer: 2, trap: "Net enclosed charge inside a dipole is (+q - q) = 0. By Gauss's Law, flux = 0." }
];

let cachedReelDeck = defaultReelDeck;
let currentReelsClass = localStorage.getItem('invincible_user_class') || "10";
let reelStreak = 0;

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
    
    const container = document.getElementById('studyReelsDeck');
    if (container) {
        container.scrollTop = 0;
    }
}

async function renderReelsDeck() {
    const container = document.getElementById('studyReelsDeck');
    if (!container) return;

    let deck = [];
    try {
        const res = await fetch(`/api/get-questions?target_class=${currentReelsClass}`);
        const data = await res.json();
        if (data && Array.isArray(data.reelDeck) && data.reelDeck.length > 0) {
            deck = data.reelDeck;
        }
    } catch(e) {}

    if (!deck || deck.length === 0) {
        deck = defaultReelDeck.filter(item => String(item.class_name) === String(currentReelsClass));
        if (deck.length === 0) deck = defaultReelDeck;
    }

    container.innerHTML = deck.map((card, idx) => {
        const rawTitle = String(card.q_en || card.title || '');
        const rawSub = String(card.subject || 'Science');
        const rawFormula = String(card.formula || '');
        
        const qJS = rawTitle.replace(/'/g, "\\'").replace(/"/g, "&quot;");
        const subJS = rawSub.replace(/'/g, "\\'").replace(/"/g, "&quot;");
        const formulaJS = rawFormula.replace(/'/g, "\\'").replace(/"/g, "&quot;");
        
        const sub = card.subject || 'Science';
        const hook = card.topic || 'NCERT Concept';
        const author = card.author_name || 'Faculty Topper';
        const school = card.school_name || 'Invincible 360';
        const creatorBadge = `<span style="font-size:9.5px; font-weight:800; color:var(--accent-cyan); background:rgba(0,229,255,0.08); border:1px solid rgba(0,229,255,0.2); padding:3px 8px; border-radius:8px;">⚡ By ${safeEscapeHTML(author)}</span>`;
        
        const safeCardId = String(card.id || idx);

        const dockStyle = `position:absolute; right:10px; bottom:20px; display:flex; flex-direction:column; gap:14px; align-items:center; z-index:10;`;
        const dockBtnStyle = `width:42px; height:42px; border-radius:50%; background:rgba(15,23,42,0.85); border:1px solid rgba(0,229,255,0.25); display:flex; align-items:center; justify-content:center; font-size:18px; cursor:pointer; backdrop-filter:blur(8px); box-shadow:0 4px 14px rgba(0,0,0,0.6); transition:transform 0.2s;`;
        const dockLabelStyle = `font-size:9.5px; color:#cbd5e1; font-weight:800; margin-top:3px; text-shadow:0 1px 3px #000;`;

        if (card.type === 'mcq') {
            let opts = card.options;
            if (typeof opts === 'string') {
                try { opts = JSON.parse(opts); } catch(e) { opts = []; }
            }
            if (!Array.isArray(opts)) opts = [];

            return `
              <div class="reel-card" id="reelCard_${safeCardId}" style="position:relative; padding-right:65px; background:linear-gradient(180deg, #0b0f19 0%, #030712 100%); border:1px solid rgba(255,255,255,0.08); border-radius:20px; padding:20px 65px 20px 20px; margin-bottom:16px;">
                <div class="reel-tag-bar" style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:8px; margin-bottom:12px;">
                  <span class="reel-hook-badge" style="background:rgba(0,229,255,0.12); color:var(--accent-cyan); border:1px solid rgba(0,229,255,0.3); font-size:10px; font-weight:900; padding:4px 8px; border-radius:8px;">${sub.toUpperCase()} • ${hook.toUpperCase()}</span>
                  ${creatorBadge}
                </div>
                
                <div class="reel-content-box">
                  <div class="reel-q-title" style="font-size:16px; font-weight:800; color:#ffffff; margin:0 0 8px 0; line-height:1.5;">${safeFormatMath(card.q_en || '')}</div>
                  ${card.q_hi ? `<div class="reel-q-sub" style="font-size:13px; color:#94a3b8; margin-bottom:16px; line-height:1.4;">${card.q_hi}</div>` : ''}

                  <div class="reel-options-grid" style="display:flex; flex-direction:column; gap:10px;">
                    ${opts.map((opt, oIdx) => `
                      <button type="button" class="reel-opt-btn" onclick="handleReelAnswer('${safeCardId}', ${oIdx}, ${card.answer}, this)" style="display:flex; justify-content:space-between; align-items:center; background:#0f172a; border:1px solid rgba(255,255,255,0.1); color:#f1f5f9; padding:14px 16px; border-radius:12px; font-size:14px; font-weight:700; text-align:left; cursor:pointer; transition:all 0.2s;">
                        <span>${safeFormatMath(String(opt))}</span>
                        <span style="font-size:14px; opacity:0.4; border: 2px solid rgba(255,255,255,0.2); border-radius: 50%; width: 18px; height: 18px; display: inline-block;"></span>
                      </button>
                    `).join('')}
                  </div>
                  <div id="reelFeedback_${safeCardId}" style="font-size:13px; margin-top:12px; display:none; padding:12px; border-radius:12px; background:rgba(0,0,0,0.4);"></div>
                </div>

                <div style="${dockStyle}">
                  <div style="text-align:center;">
                    <div style="${dockBtnStyle} border-color:var(--accent-cyan); box-shadow:0 0 15px rgba(0,229,255,0.3);" onclick="sendReelToDoubtSolver('${qJS}', '${subJS}')">🧠</div>
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

                <div class="reel-footer-status" style="margin-top:16px; font-size:11px; color:#64748b; font-weight:800;">
                  <span>⚡ Swipe up for next challenge</span>
                </div>
              </div>
            `;
        } else if (card.type === 'trap' || card.type === 'hack') {
            return `
              <div class="reel-card" style="position:relative; background:linear-gradient(180deg, #0b0f19 0%, #030712 100%); border:1px solid rgba(255,255,255,0.08); border-left: 4px solid ${card.type === 'trap' ? 'var(--accent-rose)' : 'var(--accent-cyan)'}; border-radius:20px; padding:20px 65px 20px 20px; margin-bottom:16px;">
                <div class="reel-tag-bar" style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:8px; margin-bottom:12px;">
                  <span class="reel-hook-badge" style="color:#fda4af; border:1px solid rgba(244,63,94,0.4); background:rgba(244,63,94,0.15); font-size:10px; font-weight:900; padding:4px 8px; border-radius:8px;">${card.type === 'trap' ? '🚨 EXAMINER TRAP' : '💡 TOPPER HACK'} • ${sub.toUpperCase()}</span>
                  ${creatorBadge}
                </div>
                
                <div class="reel-content-box">
                  <div class="reel-q-title" style="font-size:17px; font-weight:900; color:${card.type === 'trap' ? '#f43f5e' : 'var(--accent-cyan)'}; margin:0 0 10px 0;">${card.title || hook}</div>
                  <div style="font-size:14px; color:#f1f5f9; line-height:1.6; background:rgba(255,255,255,0.03); padding:16px; border-radius:12px; border:1px solid rgba(255,255,255,0.08);">${card.content || ''}</div>
                  
                  ${card.rule ? `<div style="font-size:13px; color:var(--accent-emerald); font-weight:800; margin-top:12px; background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.25); padding:12px; border-radius:12px;">✅ GOLDEN RULE: ${card.rule}</div>` : ''}
                </div>

                <div style="${dockStyle}">
                  <div style="text-align:center;">
                    <div style="${dockBtnStyle} border-color:var(--accent-cyan); box-shadow:0 0 15px rgba(0,229,255,0.3);" onclick="sendReelToDoubtSolver('${qJS}', '${subJS}')">🧠</div>
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

                <div class="reel-footer-status" style="margin-top:16px; font-size:11px; color:#64748b; font-weight:800;">
                  <span>⚡ Swipe up for next hack</span>
                </div>
              </div>
            `;
        } else {
            return `
              <div class="reel-card" style="position:relative; background:linear-gradient(180deg, #0b0f19 0%, #030712 100%); border:1px solid rgba(255,255,255,0.08); border-left: 4px solid var(--accent-cyan); border-radius:20px; padding:20px 65px 20px 20px; margin-bottom:16px;">
                <div class="reel-tag-bar" style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:8px; margin-bottom:12px;">
                  <span class="reel-hook-badge" style="color:#bae6fd; border:1px solid rgba(0,229,255,0.4); background:rgba(0,229,255,0.12); font-size:10px; font-weight:900; padding:4px 8px; border-radius:8px;">🧠 FORMULA VAULT • ${sub.toUpperCase()}</span>
                  ${creatorBadge}
                </div>
                
                <div class="reel-content-box" style="text-align:center;">
                  <div class="reel-q-title" style="font-size:17px; font-weight:900; color:var(--accent-cyan); margin:0 0 10px 0;">${card.title || 'Core Formula'}</div>
                  <div class="reel-formula-box" style="background:#020617; border:1px solid rgba(0,229,255,0.3); border-radius:12px; padding:16px; font-size:18px; margin:12px 0;">$$${card.formula || ''}$$</div>
                  
                  <div style="font-size:13px; color:#cbd5e1; line-height:1.5; margin-top:10px; text-align:left; background:rgba(255,255,255,0.03); padding:12px; border-radius:12px;">💡 ${card.tip || ''}</div>
                </div>

                <div style="${dockStyle}">
                  <div style="text-align:center;">
                    <div style="${dockBtnStyle} border-color:var(--accent-cyan); box-shadow:0 0 15px rgba(0,229,255,0.3);" onclick="sendReelToDoubtSolver('Derive formula: ${formulaJS}', '${subJS}')">🧠</div>
                    <div style="${dockLabelStyle}">Derive</div>
                  </div>
                  <div style="text-align:center;">
                    <div style="${dockBtnStyle}" onclick="reactStory('100')">💯</div>
                    <div style="${dockLabelStyle}">Save</div>
                  </div>
                  <div style="text-align:center;">
                    <div style="${dockBtnStyle}" onclick="shareReel('${qJS}')">🚀</div>
                    <div style="${dockLabelStyle}">Share</div>
                  </div>
                </div>

                <div class="reel-footer-status" style="margin-top:16px; font-size:11px; color:#64748b; font-weight:800; text-align:left;">
                  <span>⚡ Swipe up for next hack</span>
                </div>
              </div>
            `;
        }
    }).join('');

    container.scrollTop = 0;

    try {
        if (window.MathJax && MathJax.typesetPromise) {
            MathJax.typesetPromise([container]).catch(() => {});
        }
    } catch(e) {}
}

function shareReel(text) {
    if (navigator.share) {
        navigator.share({ title: 'Invincible 360 Reel', text: `Can you solve this? ${text} 🔥 Join the clash on Invincible 360!`, url: window.location.href });
    } else {
        navigator.clipboard.writeText(`${text} - Solve on Invincible 360: ${window.location.href}`);
        alert('📋 Reel link copied to clipboard!');
    }
}

function handleReelAnswer(cardId, selectedIdx, correctIdx, btnEl) {
    const card = document.getElementById(`reelCard_${cardId}`);
    if (!card) return;

    const buttons = card.querySelectorAll('.reel-opt-btn');
    buttons.forEach(b => { b.disabled = true; b.style.cursor = 'default'; });

    const fb = document.getElementById(`reelFeedback_${cardId}`);
    const comboBadge = document.getElementById('reelsComboBadge');
    const isCorrect = Number(selectedIdx) === Number(correctIdx);

    if (isCorrect) {
        if (typeof playDing === 'function') playDing();
        if (typeof triggerHaptic === 'function') triggerHaptic([30, 40, 30]);
        btnEl.style.background = 'linear-gradient(135deg, rgba(16,185,129,0.3), rgba(5,150,105,0.4))';
        btnEl.style.borderColor = 'var(--accent-emerald)';
        btnEl.innerHTML = btnEl.innerHTML.replace('</span>', '</span><span style="font-weight:900; color:var(--accent-emerald);">✓</span>');
        
        reelStreak++;

        if (comboBadge) {
            comboBadge.classList.remove('hidden');
            comboBadge.textContent = `🔥 x${reelStreak} STREAK`;
        }

        if (fb) {
            fb.style.display = 'block';
            fb.innerHTML = `<span style="color:var(--accent-emerald); font-weight:900;">✓ Correct! +15 XP</span>`;
        }

        const xpEl = document.getElementById('xpCounter');
        if (xpEl) {
            const currentXp = parseInt(xpEl.textContent || '680', 10);
            xpEl.textContent = currentXp + (reelStreak >= 3 ? 25 : 15);
        }

        if (typeof rechargeBlitzPowerup === 'function') rechargeBlitzPowerup('fiftyFifty');

        if (reelStreak >= 3) {
            if (typeof confetti === 'function') confetti({ particleCount: 35, spread: 45, origin: { y: 0.8 } });
        }
    } else {
        if (typeof playBuzz === 'function') playBuzz();
        if (typeof triggerHaptic === 'function') triggerHaptic([80]);
        btnEl.style.background = 'linear-gradient(135deg, rgba(244,63,94,0.3), rgba(225,29,72,0.4))';
        btnEl.style.borderColor = 'var(--accent-rose)';
        btnEl.innerHTML = btnEl.innerHTML.replace('</span>', '</span><span style="font-weight:900; color:var(--accent-rose);">✗</span>');
        
        if (buttons[correctIdx]) {
            buttons[correctIdx].style.background = 'rgba(16,185,129,0.2)';
            buttons[correctIdx].style.borderColor = 'var(--accent-emerald)';
        }
        reelStreak = 0;

        if (comboBadge) comboBadge.classList.add('hidden');

        if (fb) {
            fb.style.display = 'block';
            fb.innerHTML = `<span style="color:var(--accent-rose); font-weight:800;">✗ Incorrect. Check concepts in Study Notes!</span>`;
        }
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
    } else {
      alert("Story modal not found in HTML.");
    }
  });
}

async function loadActiveStories() {
    const container = document.getElementById('dynamicStoryCircles');
    if (!container) return;
    
    let studentSchool = localStorage.getItem('userSchool') || localStorage.getItem('testOrg') || 'ALL';

    try {
        const res = await fetch(`/api/stories?school_id=${encodeURIComponent(studentSchool)}`);
        const data = await res.json();
        const dbStories = Array.isArray(data.stories) ? data.stories : (Array.isArray(data) ? data : []);

        activeStories = dbStories.filter(s => studentSchool === 'ALL' || s.institution === studentSchool || !s.institution);

        container.innerHTML = activeStories.map((s, idx) => {
            const author = String(s.author_name || s.author || s.name || "Student");
            const initial = author.charAt(0).toUpperCase() || "S";
            return `
            <div class="story-circle-item" onclick="openStoryViewer(${idx})" style="cursor:pointer;">
                <div class="story-avatar-wrap" style="width:60px; height:60px; border-radius:50%; background:linear-gradient(135deg, var(--accent-cyan), #0284c7); padding:2px; margin-bottom:4px;">
                    <div class="story-avatar-inner" style="width:100%; height:100%; border-radius:50%; background:#020617; display:flex; align-items:center; justify-content:center; font-size:24px; font-weight:900; color:#fff;">${initial}</div>
                </div>
                <div class="story-username" style="font-size:10px; color:#94a3b8; text-align:center; max-width:60px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${safeEscapeHTML(author)}</div>
            </div>
            `;
        }).join('');
    } catch(e) { container.innerHTML = ''; }
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
    const name = document.getElementById('storyAuthorName').value.trim();
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
        const res = await fetch('/api/stories', {
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
        });
        const data = await res.json();
        if (!res.ok || data.error) throw new Error(data.error || "Upload failed");

        if (data.story && data.story.id) {
          let myStoryIds = JSON.parse(localStorage.getItem('my_created_stories') || '[]');
          myStoryIds.push(data.story.id);
          localStorage.setItem('my_created_stories', JSON.stringify(myStoryIds));
        }

        document.getElementById('storyModal').style.display = 'none';
        
        currentStoryImageBase64 = null;
        selectedFilterCSS = "none";
        const preview = document.getElementById('storyImagePreview');
        if (preview) { preview.style.display = 'none'; preview.style.filter = "none"; preview.src = ""; }
        const placeholder = document.getElementById('storyPlaceholderText');
        if (placeholder) placeholder.style.display = 'block';
        if (document.getElementById('storyCaption')) document.getElementById('storyCaption').value = '';
        
        await loadActiveStories();
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
}

window.prevStorySlide = function() {
  if (currentStoryIdx > 0) {
    currentStoryIdx--;
    renderStorySlide();
  }
}

window.nextStorySlide = function() {
  if (currentStoryIdx < activeStories.length - 1) {
    currentStoryIdx++;
    renderStorySlide();
  } else {
    closeStoryViewer();
  }
}

async function deleteCurrentStory() {
  const story = activeStories[currentStoryIdx];
  if (!story) return;

  const myStoryIds = JSON.parse(localStorage.getItem('my_created_stories') || '[]').map(Number);
  const isMyStory = story.id && myStoryIds.includes(Number(story.id));
  const savedAdminPin = localStorage.getItem('story_admin_pin');

  let adminPin = savedAdminPin || null;

  if (!isMyStory && !adminPin) {
    adminPin = prompt("Enter Admin PIN to delete this story:");
    if (!adminPin) return;
  } else {
    if (!confirm("Are you sure you want to delete this story?")) return;
  }

  try {
    const res = await fetch('/api/stories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'delete_story',
        story_id: story.id,
        admin_key: adminPin || undefined
      })
    });

    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error || "Failed to delete");

    if (adminPin) {
      localStorage.setItem('story_admin_pin', adminPin);
    }

    alert("Story deleted successfully!");
    closeStoryViewer();
    loadActiveStories();
  } catch (err) {
    alert("Delete failed: " + err.message);
  }
}

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

  const deleteBtn = document.getElementById('viewerDeleteBtn');
  if (deleteBtn) {
    deleteBtn.style.display = 'inline-flex';
    deleteBtn.onclick = (e) => {
      e.stopPropagation();
      deleteCurrentStory();
    };
  }

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

window.openStoryViewersDrawer = async function() {
  clearTimeout(storyTimer);
  const story = activeStories[currentStoryIdx];
  if (!story || !story.id) return;

  const drawer = document.getElementById('storyViewersDrawer');
  const list = document.getElementById('storyViewersList');
  if (drawer) drawer.style.display = 'flex';
  if (list) list.innerHTML = '<div style="color:#94a3b8; font-size:12px; text-align:center; padding:16px 0;">Fetching live watchers...</div>';

  const viewers = await fetchStoryViewers(story.id);
  if (!viewers || viewers.length === 0) {
    list.innerHTML = `
      <div style="text-align:center; padding:24px 10px; color:#94a3b8;">
        <div style="font-size:24px; margin-bottom:4px;">👀</div>
        <div style="font-weight:700; font-size:13px; color:#fff;">No views yet</div>
        <div style="font-size:11px;">Be the first to share this story with classmates!</div>
      </div>
    `;
    return;
  }

  const reactionEmojiMap = { fire: '🔥', mind: '🤯', '100': '💯' };
  list.innerHTML = viewers.map(v => `
    <div class="viewer-row-item" style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.03); padding:10px; border-radius:12px;">
      <div style="display:flex; align-items:center; gap:8px;">
        <div style="width:28px; height:28px; border-radius:50%; background:rgba(0,229,255,0.15); border:1px solid var(--accent-cyan); color:var(--accent-cyan); font-size:11px; font-weight:800; display:flex; align-items:center; justify-content:center;">
          ${(v.viewer_name || 'S').charAt(0).toUpperCase()}
        </div>
        <div>
          <div style="font-size:12px; font-weight:800; color:#fff;">${safeEscapeHTML(v.viewer_name || 'Student')}</div>
          <div style="font-size:10px; color:#94a3b8;">${safeEscapeHTML(v.viewer_institution || 'Invincible Coaching')}</div>
        </div>
      </div>
      <div>${v.reaction ? `<span style="font-size:14px;">${reactionEmojiMap[v.reaction] || '🔥'}</span>` : '<span style="font-size:10px; color:#64748b;">Watched</span>'}</div>
    </div>
  `).join('');
}

window.closeStoryViewersDrawer = function() {
  const drawer = document.getElementById('storyViewersDrawer');
  if (drawer) drawer.style.display = 'none';
  storyTimer = setTimeout(nextStorySlide, 3500);
}

window.closeStoryViewer = function() {
  clearTimeout(storyTimer);
  const v = document.getElementById('storyViewer');
  if (v) v.style.display = 'none';
  closeStoryViewersDrawer();
}

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
}

function saveStoryToVault() {
  if (typeof playWin === 'function') playWin();
  alert("💾 Saved to Gallery!");
}

/* =====================================================
   MULTI-FORMAT CREATOR STUDIO LOGIC
===================================================== */
let activeCreatorFormat = 'hack';

function switchReelFormat(format) {
  activeCreatorFormat = format;
  const formats = ['hack', 'mcq', 'trap', 'formula'];
  
  formats.forEach(f => {
    const tabBtn = document.getElementById(`tabFormat_${f}`);
    if (tabBtn) {
      if (f === format) {
        tabBtn.style.background = 'rgba(0,229,255,0.18)';
        tabBtn.style.borderColor = 'var(--accent-cyan)';
        tabBtn.style.color = 'var(--accent-cyan)';
      } else {
        tabBtn.style.background = '#020617';
        tabBtn.style.borderColor = '#1e293b';
        tabBtn.style.color = '#94a3b8';
      }
    }
  });

  const hEl = document.getElementById('formatFields_hack');
  const mEl = document.getElementById('formatFields_mcq');
  const fEl = document.getElementById('formatFields_formula');

  if (hEl) hEl.style.display = (format === 'hack' || format === 'trap') ? 'flex' : 'none';
  if (mEl) mEl.style.display = format === 'mcq' ? 'flex' : 'none';
  if (fEl) fEl.style.display = format === 'formula' ? 'flex' : 'none';
}

async function handleMultiFormatReelSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById('btnPublishReel');
  const originalText = btn ? btn.innerText : "PUBLISH";
  if (btn) {
    btn.innerText = "PUBLISHING... ⏳";
    btn.disabled = true;
  }

  const subject = document.getElementById('creatorSubject')?.value || 'Science';
  const grade = document.getElementById('creatorGrade')?.value || '10';
  const topic = document.getElementById('creatorTopic')?.value?.trim() || 'Concept';
  const author = localStorage.getItem('studentName') || 'Topper Creator';
  const school = localStorage.getItem('userSchool') || 'Invincible Coaching';

  let payload = {
    class_name: grade,
    type: activeCreatorFormat,
    subject: subject,
    topic: topic,
    author_name: author,
    school_name: school,
    views_count: 1,
    likes_count: 0
  };

  if (activeCreatorFormat === 'mcq') {
    const qText = document.getElementById('creatorMcqQuestion')?.value?.trim();
    const optA = document.getElementById('creatorOptA')?.value?.trim();
    const optB = document.getElementById('creatorOptB')?.value?.trim();
    const optC = document.getElementById('creatorOptC')?.value?.trim();
    const optD = document.getElementById('creatorOptD')?.value?.trim();

    if (!qText || !optA || !optB) {
      alert("Please provide the question and options.");
      if (btn) { btn.innerText = originalText; btn.disabled = false; }
      return;
    }

    payload.q_en = qText;
    payload.options = JSON.stringify([optA, optB, optC, optD]);
    payload.answer = 0;
  } else if (activeCreatorFormat === 'formula') {
    payload.title = topic;
    payload.formula = document.getElementById('creatorFormulaLatex')?.value?.trim() || '';
    payload.tip = document.getElementById('creatorFormulaTip')?.value?.trim() || '';
  } else {
    payload.title = document.getElementById('creatorHackTitle')?.value?.trim() || topic;
    payload.content = document.getElementById('creatorHackContent')?.value?.trim() || '';
    payload.rule = document.getElementById('creatorHackRule')?.value?.trim() || 'Focus on NCERT definitions.';
  }

  try {
    if (window.supabase) {
      const sbClient = window.supabase.createClient(
        'https://cbgwbzidkmcefoithipp.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiZ3diemlka21jZWZvaXRoaXBwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyMDgyNTQsImV4cCI6MjEwMTc4NDI1NH0.gJq3-0tU-8fxdF0Y_1_qcet_VYp7gysv5yWfl_o8T0g'
      );

      const { error } = await sbClient.from('study_reels').insert([payload]);
      if (error) throw error;
    }

    const xpEl = document.getElementById('xpCounter');
    if (xpEl) {
      const cur = parseInt(xpEl.textContent || '680', 10);
      xpEl.textContent = cur + 75;
    }

    const modal = document.getElementById('reelCreatorModal');
    if (modal) modal.style.display = 'none';

    if (typeof playWin === 'function') playWin();
    if (typeof confetti === 'function') confetti({ particleCount: 70, spread: 60 });
    
    alert(`🎉 Published globally! You earned +75 XP as a Topper Creator.`);
    await renderReelsDeck();
  } catch (err) {
    alert("Publishing notice: " + err.message);
  } finally {
    if (btn) {
      btn.innerText = originalText;
      btn.disabled = false;
    }
  }
}
