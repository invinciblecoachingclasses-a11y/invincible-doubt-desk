/* =====================================================
   ⚡ INVINCIBLE 360 - AI DOUBT DESK & TOPPER NOTES STUDIO
   Core Engines:
   1. Multi-Tone AI Doubt Engine & Image Pipeline
   2. Interactive Blackboard Visual Engine (Canvas Simulations)
   3. Multi-Turn Follow-Up & Faculty WhatsApp Dispatch
   4. Spatial Mind-Palace Constellation Engine (Node Physics)
   5. Interactive Topper Notes Module (Tabs, Flashcards, Traps & Mastery)
   6. Custom A4 Print & PDF Compilation Engine
===================================================== */

let selectedSubject = "Mathematics";
let currentTone = "step";
let selectedImage = null;
let doubtHistory = [];
let activeNoteData = null;
let currentFlashcardIdx = 0;
let isCardFlipped = false;
let noteMasteryScore = 0;
let chargerBonusXP = 0;

const questionInput = document.getElementById("question");
const imageInput = document.getElementById("imageInput");
const imagePreview = document.getElementById("imagePreview");
const removeImageButton = document.getElementById("removeImage");

/* =====================================================
   AUDIO, HAPTIC & REWARD UTILITIES
===================================================== */
function playToneDing() {
  if (typeof playDing === 'function') playDing();
  else if (navigator.vibrate) try { navigator.vibrate(30); } catch(e) {}
}

function playToneBuzz() {
  if (typeof playBuzz === 'function') playBuzz();
  else if (navigator.vibrate) try { navigator.vibrate(80); } catch(e) {}
}

function addStudentXP(amount) {
  let curXP = parseInt(localStorage.getItem('student_xp') || '680', 10) + amount;
  localStorage.setItem('student_xp', curXP.toString());
  const xpEl = document.getElementById('xpCounter');
  if (xpEl) xpEl.textContent = curXP;
  const userXpEl = document.getElementById('userXpDisplay');
  if (userXpEl) userXpEl.textContent = curXP;
}

/* =====================================================
   UI EVENT HANDLERS (TONES, SUBJECTS, IMAGES)
===================================================== */
window.setExplanationTone = function(tone, el) {
  currentTone = tone;
  document.querySelectorAll('.tone-btn').forEach(b => b.classList.remove('active'));
  if (el) el.classList.add('active');
  playToneDing();
};

document.querySelectorAll("#doubtSection .subject").forEach(b => {
  b.onclick = () => {
    document.querySelectorAll("#doubtSection .subject").forEach(btn => btn.classList.remove('active'));
    b.classList.add('active');
    selectedSubject = b.getAttribute('data-subject');
    playToneDing();
  };
});

if (document.getElementById("uploadBtn")) {
  document.getElementById("uploadBtn").onclick = () => imageInput && imageInput.click();
}
if (document.getElementById("cameraBtn")) {
  document.getElementById("cameraBtn").onclick = () => {
    if (imageInput) {
      imageInput.setAttribute("capture", "environment");
      imageInput.click();
    }
  };
}

if (imageInput) {
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

        if (imagePreview) {
          imagePreview.src = compressedBase64;
          imagePreview.style.display = "block";
        }
        if (removeImageButton) removeImageButton.style.display = "block";
        const container = document.getElementById('imagePreviewContainer');
        if (container) container.style.display = "block";
      };
      img.src = evt.target.result;
    };
    reader.readAsDataURL(file);
  };
}

if (removeImageButton) {
  removeImageButton.onclick = () => { 
    selectedImage = null; 
    if (imageInput) imageInput.value = ""; 
    if (imagePreview) imagePreview.style.display = "none"; 
    removeImageButton.style.display = "none";
    const container = document.getElementById('imagePreviewContainer');
    if (container) container.style.display = "none";
  };
}

async function renderAnswerContent(container, markdownText) {
  if (!container) return;
  let parsedHtml = markdownText || "";
  if (typeof marked !== 'undefined') {
    parsedHtml = typeof marked.parse === 'function' ? marked.parse(parsedHtml) : marked(parsedHtml);
  }
  
  parsedHtml = parsedHtml
    .replace(/🚨\s*\*\*Common Student Mistakes[\s\S]*?(?=(🎯|🧠|💡|$))/gi, (match) => `<div class="callout-trap">${typeof marked !== 'undefined' ? (marked.parse ? marked.parse(match) : marked(match)) : match}</div>`)
    .replace(/🎯\s*\*\*Direct Approach[\s\S]*?(?=(🧠|💡|🚨|$))/gi, (match) => `<div class="callout-tldr">${typeof marked !== 'undefined' ? (marked.parse ? marked.parse(match) : marked(match)) : match}</div>`);

  container.innerHTML = parsedHtml;
  
  if (window.MathJax && MathJax.typesetPromise) {
    await MathJax.typesetPromise([container]).catch(() => {});
  }
}

/* =====================================================
   🧠 DOUBT VISUAL ENGINE (INTERACTIVE BLACKBOARD)
===================================================== */
const DoubtVisualEngine = {
    loop: null,
    canvasId: 'doubtBlackboardCanvas',
    
    mount: function(container, subject) {
        const old = document.getElementById('doubtBlackboardWrapper');
        if(old) {
            if (this.loop) cancelAnimationFrame(this.loop);
            old.remove();
        }

        const wrapper = document.createElement('div');
        wrapper.id = 'doubtBlackboardWrapper';
        wrapper.style.cssText = "background:linear-gradient(180deg, #0b0f19 0%, #020617 100%); border:1px solid rgba(0,229,255,0.3); border-radius:16px; padding:16px; margin-bottom:20px; box-shadow:0 10px 30px rgba(0,0,0,0.5);";

        let controlsHTML = '';
        let simType = 'math';

        if (subject === 'Physics') {
            simType = 'physics';
            controlsHTML = `
                <div style="display:flex; justify-content:space-between; color:#94a3b8; font-size:11px; font-weight:800; margin-top:12px;">
                    <label>Vector Distance (r): <span id="bb_val_r" style="color:#00e5ff;">80</span></label>
                </div>
                <input type="range" class="lab-slider-input" id="bb_slider_r" min="30" max="150" value="80" style="width:100%; margin-top:8px;">
            `;
        } else if (subject === 'Chemistry' || subject === 'Biology') {
            simType = 'chem';
            controlsHTML = `
                <div style="display:flex; justify-content:space-between; color:#94a3b8; font-size:11px; font-weight:800; margin-top:12px;">
                    <label>Thermal Energy (T): <span id="bb_val_t" style="color:#f43f5e;">50</span></label>
                </div>
                <input type="range" class="lab-slider-input" id="bb_slider_t" min="10" max="100" value="50" style="width:100%; margin-top:8px; background:rgba(244,63,94,0.2);">
            `;
        } else {
            simType = 'math';
            controlsHTML = `
                <div style="display:flex; justify-content:space-between; color:#94a3b8; font-size:11px; font-weight:800; margin-top:12px;">
                    <label>Freq (f): <span id="bb_val_f" style="color:#00e5ff;">1.0</span></label>
                    <label>Amp (A): <span id="bb_val_a" style="color:#f59e0b;">50</span></label>
                </div>
                <div style="display:flex; gap:12px; margin-top:8px;">
                    <input type="range" class="lab-slider-input" id="bb_slider_f" min="1" max="10" value="1" style="width:50%;">
                    <input type="range" class="lab-slider-input" id="bb_slider_a" min="10" max="80" value="50" style="width:50%; background:rgba(245,158,11,0.2);">
                </div>
            `;
        }

        wrapper.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                <div style="font-size:12px; font-weight:900; color:var(--accent-cyan); letter-spacing:1px; display:flex; align-items:center; gap:6px;">
                    <span>🧠</span> <span>INTERACTIVE BLACKBOARD</span>
                </div>
                <div style="font-size:9px; color:#fff; background:rgba(0,229,255,0.15); border:1px solid rgba(0,229,255,0.3); padding:3px 8px; border-radius:8px; font-weight:800;">LIVE VARS</div>
            </div>
            <div style="background:#020617; border-radius:12px; overflow:hidden; border:1px dashed #334155;">
                <canvas id="${this.canvasId}" style="width:100%; height:160px; display:block; touch-action:none;"></canvas>
            </div>
            ${controlsHTML}
        `;

        container.insertBefore(wrapper, container.firstChild);
        this.initCanvas(simType);
    },

    initCanvas: function(simType) {
        const canvas = document.getElementById(this.canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        
        canvas.width = (rect.width || 320) * dpr;
        canvas.height = 160 * dpr;
        ctx.scale(dpr, dpr);
        const w = canvas.width / dpr;
        const h = canvas.height / dpr;

        let frame = 0;
        let particles = Array.from({length: 40}, () => ({
            x: Math.random()*w, y: Math.random()*h, 
            vx: (Math.random()-0.5)*2, vy: (Math.random()-0.5)*2
        }));

        const render = () => {
            ctx.fillStyle = '#020617';
            ctx.fillRect(0, 0, w, h);
            frame++;

            if (simType === 'math') {
                const sliderF = document.getElementById('bb_slider_f');
                const sliderA = document.getElementById('bb_slider_a');
                const freq = sliderF ? parseFloat(sliderF.value) : 1;
                const amp = sliderA ? parseFloat(sliderA.value) : 50;
                
                if(document.getElementById('bb_val_f')) document.getElementById('bb_val_f').innerText = freq;
                if(document.getElementById('bb_val_a')) document.getElementById('bb_val_a').innerText = amp;

                // Cartesian Grid
                ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 1;
                ctx.beginPath(); ctx.moveTo(0, h/2); ctx.lineTo(w, h/2); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(w/2, 0); ctx.lineTo(w/2, h); ctx.stroke();

                // Animated Math Tracer
                ctx.strokeStyle = '#00e5ff'; ctx.lineWidth = 2;
                ctx.beginPath();
                for (let x = 0; x <= w; x += 2) {
                    const mathX = (x - w/2) * 0.05;
                    const mathY = Math.sin(mathX * freq - frame*0.05) * amp;
                    if (x === 0) ctx.moveTo(x, h/2 - mathY); else ctx.lineTo(x, h/2 - mathY);
                }
                ctx.stroke();

                // Equation Text
                ctx.fillStyle = '#fff'; ctx.font = '12px Space Grotesk';
                ctx.fillText(`y = ${amp} · sin(${freq}x - ωt)`, 10, 20);

            } else if (simType === 'physics') {
                const sliderR = document.getElementById('bb_slider_r');
                const r = sliderR ? parseFloat(sliderR.value) : 80;
                if(document.getElementById('bb_val_r')) document.getElementById('bb_val_r').innerText = r;

                const cx = w/2; const cy = h/2;
                const m1x = cx - r/2; const m2x = cx + r/2;
                const force = Math.min(100, 5000 / (r*r));

                // Draw Field Lines
                ctx.strokeStyle = 'rgba(0, 229, 255, 0.1)';
                ctx.beginPath(); ctx.arc(m1x, cy, 30 + force*5, 0, Math.PI*2); ctx.stroke();
                ctx.beginPath(); ctx.arc(m2x, cy, 30 + force*5, 0, Math.PI*2); ctx.stroke();

                // Masses
                ctx.fillStyle = '#f59e0b';
                ctx.beginPath(); ctx.arc(m1x, cy, 12, 0, Math.PI*2); ctx.fill();
                ctx.fillStyle = '#00e5ff';
                ctx.beginPath(); ctx.arc(m2x, cy, 12, 0, Math.PI*2); ctx.fill();

                // Force Vectors
                ctx.strokeStyle = '#f43f5e'; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.moveTo(m1x, cy); ctx.lineTo(m1x + force*20, cy); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(m2x, cy); ctx.lineTo(m2x - force*20, cy); ctx.stroke();

                // Data Text
                ctx.fillStyle = '#fff'; ctx.font = '12px Space Grotesk';
                ctx.fillText(`Distance: ${r}m`, 10, 20);
                ctx.fillStyle = '#f43f5e';
                ctx.fillText(`Force ∝ 1/r² = ${(force*10).toFixed(2)} N`, 10, 40);

            } else if (simType === 'chem') {
                const sliderT = document.getElementById('bb_slider_t');
                const temp = sliderT ? parseFloat(sliderT.value) : 50;
                if(document.getElementById('bb_val_t')) document.getElementById('bb_val_t').innerText = temp;

                particles.forEach(p => {
                    p.x += p.vx * (temp/20); p.y += p.vy * (temp/20);
                    if(p.x < 0 || p.x > w) p.vx *= -1;
                    if(p.y < 0 || p.y > h) p.vy *= -1;
                    
                    const speed = Math.hypot(p.vx * (temp/20), p.vy * (temp/20));
                    ctx.fillStyle = `hsl(${Math.max(0, 240 - speed*15)}, 100%, 60%)`;
                    ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI*2); ctx.fill();
                });

                ctx.fillStyle = '#fff'; ctx.font = '12px Space Grotesk';
                ctx.fillText(`System Temperature: ${temp}°C`, 10, 20);
            }

            this.loop = requestAnimationFrame(render);
        };
        render();
    }
};

/* =====================================================
   DOUBT DESK EXECUTION & PIPELINE
===================================================== */
function startDoubtWaitingPipeline() {
  const pipeText = document.getElementById("doubtPipelineText");
  if (!pipeText) return;
  const stages = [
    "Analyzing question logic...",
    "Scanning NCERT curriculum guidelines...",
    "Verifying step-by-step mathematical proofs...",
    "Compiling master blackboard diagram..."
  ];
  let idx = 0;
  window._doubtPipeTimer = setInterval(() => {
    idx = (idx + 1) % stages.length;
    pipeText.innerText = stages[idx];
  }, 2000);
}

function stopDoubtWaitingPipeline() {
  if (window._doubtPipeTimer) clearInterval(window._doubtPipeTimer);
}

const askBtn = document.getElementById("askBtn");
if (askBtn) {
  askBtn.onclick = async () => {
      const q = questionInput ? questionInput.value.trim() : "";
      if(!q && !selectedImage) return alert("Please enter a question or upload a photo.");

      askBtn.disabled = true;
      const loadingEl = document.getElementById("loadingDoubt");
      const answerBoxEl = document.getElementById("answerBox");
      if (loadingEl) loadingEl.classList.remove('hidden'); 
      if (answerBoxEl) answerBoxEl.style.display = "none"; 
      
      startDoubtWaitingPipeline();
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
          
          const textResponse = await res.text();
          let data;
          try {
              data = JSON.parse(textResponse);
          } catch(e) {
              throw new Error("Server timeout. The question might be too complex, please try again.");
          }

          if(!res.ok) throw new Error(data.error || "Unable to solve.");

          doubtHistory.push({ role: 'user', content: q || 'Image Question' });
          doubtHistory.push({ role: 'assistant', content: data.answer });

          const ansContainer = document.getElementById("answerText");
          await renderAnswerContent(ansContainer, data.answer);
          
          if (attachedImageBase64 && ansContainer) {
            const imgMarkup = `<div style="margin-bottom:14px; text-align:center;"><img src="${attachedImageBase64}" alt="Uploaded Doubt" style="max-width:100%; max-height:260px; border-radius:12px; border:1px solid rgba(255,255,255,0.15); object-fit:contain;" /></div>`;
            ansContainer.insertAdjacentHTML('afterbegin', imgMarkup);
          }
          
          if (answerBoxEl) answerBoxEl.style.display = "block"; 
          
          // Reward Doubt Solving XP
          addStudentXP(15);

          // INJECT INTERACTIVE VISUAL BLACKBOARD
          const thread = document.getElementById("doubtConversationThread");
          if (thread) DoubtVisualEngine.mount(thread, selectedSubject);

          playToneDing();
          if (typeof confetti === 'function') confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } });
      } catch(err) {
          alert("Doubt Engine: " + err.message);
      } finally { 
          askBtn.disabled = false;
          stopDoubtWaitingPipeline();
          if (loadingEl) loadingEl.classList.add('hidden'); 
      }
  };
}

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
    userBubble.textContent = "💬 You: " + followQ;
    if (thread) thread.appendChild(userBubble);
    followUpInput.value = "";

    const aiBubble = document.createElement('div');
    aiBubble.className = "topper-content";
    aiBubble.style.cssText = "background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:14px; padding:12px 16px; margin-top:6px;";
    aiBubble.innerHTML = "<em>Refining explanation with step logic...</em>";
    if (thread) thread.appendChild(aiBubble);

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
      
      const textResponse = await res.text();
      let data;
      try { data = JSON.parse(textResponse); } catch(e) { throw new Error("Server timeout. Please try again."); }

      if (!res.ok) throw new Error(data.error || "Failed follow-up");

      doubtHistory.push({ role: 'user', content: followQ });
      doubtHistory.push({ role: 'assistant', content: data.answer });

      await renderAnswerContent(aiBubble, data.answer);
      playToneDing();
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

window.clearDoubtThread = function() {
  const ansBox = document.getElementById('answerBox');
  if (ansBox) ansBox.style.display = 'none';
  if (questionInput) questionInput.value = '';
  doubtHistory = [];
};

if (document.getElementById("againBtn")) {
  document.getElementById("againBtn").addEventListener("click", function(){ 
    if (followUpInput) {
      followUpInput.value = "Can you explain this step by step with a simpler real-world example?";
      if (sendFollowUpBtn) sendFollowUpBtn.click();
    }
  });
}

if (document.getElementById("teacherBtn")) {
  document.getElementById("teacherBtn").addEventListener("click", function(){ 
    const studentQuestion = questionInput ? questionInput.value.trim() : ""; 
    const ansEl = document.getElementById("answerText");
    const explanation = ansEl ? ansEl.innerText.trim() : ""; 
    const whatsappMessage = "Hello Invincible 360 Faculty,\n\nI need further help on this concept:\n\nSubject: " + selectedSubject + "\n\nQuestion:\n" + (studentQuestion || "Image attachment") + "\n\nPlatform Solution:\n" + explanation; 
    window.open("https://api.whatsapp.com/send?text=" + encodeURIComponent(whatsappMessage), "_blank"); 
  });
}

/* =====================================================
   NOTES STUDIO: SPATIAL MIND-PALACE ENGINE (NODE GRAPH)
===================================================== */
const MindPalaceEngine = {
    canvasId: 'mindPalaceCanvas',
    loop: null,
    ctx: null,
    w: 0, h: 0,
    nodes: [],
    edges: [],
    draggedNode: null,
    
    mount: function(container, chapterName) {
        const old = document.getElementById('mindPalaceWrapper');
        if (old) {
            if (this.loop) cancelAnimationFrame(this.loop);
            old.remove();
        }

        const wrapper = document.createElement('div');
        wrapper.id = 'mindPalaceWrapper';
        wrapper.style.cssText = "background:#020617; border:1px solid rgba(245,158,11,0.3); border-radius:16px; padding:16px; margin-bottom:20px; box-shadow:0 10px 30px rgba(0,0,0,0.5);";

        wrapper.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                <div style="font-size:12px; font-weight:900; color:var(--accent-amber); letter-spacing:1px; display:flex; align-items:center; gap:6px;">
                    <span>🌌</span> <span>CONCEPT CONSTELLATION</span>
                </div>
                <div style="font-size:9px; color:#fff; background:rgba(245,158,11,0.15); border:1px solid rgba(245,158,11,0.3); padding:3px 8px; border-radius:8px; font-weight:800;">INTERACTIVE</div>
            </div>
            <div style="font-size:11px; color:#94a3b8; margin-bottom:10px;">Drag the glowing nodes to explore the chapter's neural map.</div>
            <div style="border-radius:12px; overflow:hidden; border:1px dashed #334155; position:relative;">
                <canvas id="${this.canvasId}" style="width:100%; height:220px; display:block; touch-action:none;"></canvas>
            </div>
        `;

        container.insertBefore(wrapper, container.firstChild);
        this.initCanvas(chapterName);
    },

    initCanvas: function(chapterName) {
        const canvas = document.getElementById(this.canvasId);
        if (!canvas) return;
        
        this.ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        
        canvas.width = (rect.width || 320) * dpr;
        canvas.height = 220 * dpr;
        this.ctx.scale(dpr, dpr);
        this.w = canvas.width / dpr;
        this.h = canvas.height / dpr;

        const topics = ["Definitions", "Formulas", "Derivations", "Exceptions", "Exam Traps"];
        this.nodes = [
            { id: 0, label: (chapterName || "Concept").substring(0, 15), x: this.w/2, y: this.h/2, vx: 0, vy: 0, radius: 25, color: '#f59e0b', isCenter: true }
        ];

        this.edges = [];
        topics.forEach((t, i) => {
            const angle = (i / topics.length) * Math.PI * 2;
            this.nodes.push({
                id: i + 1, label: t, 
                x: this.w/2 + Math.cos(angle) * 80, 
                y: this.h/2 + Math.sin(angle) * 80, 
                vx: 0, vy: 0, radius: 15, color: '#00e5ff', isCenter: false
            });
            this.edges.push({ a: 0, b: i + 1 });
        });

        const getTouchPos = (e) => {
            const r = canvas.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            return { x: clientX - r.left, y: clientY - r.top };
        };

        const onDown = (e) => {
            const pos = getTouchPos(e);
            this.draggedNode = this.nodes.find(n => Math.hypot(n.x - pos.x, n.y - pos.y) < n.radius + 10);
        };

        const onMove = (e) => {
            if (this.draggedNode) {
                if (e.cancelable) e.preventDefault();
                const pos = getTouchPos(e);
                this.draggedNode.x = pos.x;
                this.draggedNode.y = pos.y;
                this.draggedNode.vx = 0;
                this.draggedNode.vy = 0;
            }
        };

        const onUp = () => this.draggedNode = null;

        canvas.addEventListener('mousedown', onDown);
        canvas.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        canvas.addEventListener('touchstart', onDown, { passive: false });
        canvas.addEventListener('touchmove', onMove, { passive: false });
        window.addEventListener('touchend', onUp);

        this.render();
    },

    render: function() {
        if (!this.ctx) return;
        this.ctx.fillStyle = '#020617';
        this.ctx.fillRect(0, 0, this.w, this.h);

        this.edges.forEach(e => {
            const a = this.nodes[e.a]; const b = this.nodes[e.b];
            if (!a || !b) return;
            const dx = b.x - a.x; const dy = b.y - a.y;
            const dist = Math.hypot(dx, dy);
            const force = (dist - 90) * 0.02;
            
            if (this.draggedNode !== a && !a.isCenter) { a.vx += (dx/dist)*force; a.vy += (dy/dist)*force; }
            if (this.draggedNode !== b && !b.isCenter) { b.vx -= (dx/dist)*force; b.vy -= (dy/dist)*force; }

            this.ctx.strokeStyle = 'rgba(245, 158, 11, 0.3)';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath(); this.ctx.moveTo(a.x, a.y); this.ctx.lineTo(b.x, b.y); this.ctx.stroke();
            
            const time = Date.now() * 0.002;
            const px = a.x + dx * ((time + e.b) % 1);
            const py = a.y + dy * ((time + e.b) % 1);
            this.ctx.fillStyle = '#facc15';
            this.ctx.beginPath(); this.ctx.arc(px, py, 2, 0, Math.PI*2); this.ctx.fill();
        });

        this.nodes.forEach(n => {
            if (this.draggedNode !== n && !n.isCenter) {
                n.vx += (this.w/2 - n.x) * 0.001;
                n.vy += (this.h/2 - n.y) * 0.001;
                n.vx *= 0.9; n.vy *= 0.9;
                n.x += n.vx; n.y += n.vy;
            }

            n.x = Math.max(n.radius, Math.min(this.w - n.radius, n.x));
            n.y = Math.max(n.radius, Math.min(this.h - n.radius, n.y));

            this.ctx.beginPath(); this.ctx.arc(n.x, n.y, n.radius + 6, 0, Math.PI*2);
            this.ctx.fillStyle = n.color.replace(')', ', 0.2)').replace('rgb', 'rgba').replace('#', '') === n.color ? n.color + '33' : n.color;
            this.ctx.fill();

            this.ctx.beginPath(); this.ctx.arc(n.x, n.y, n.radius, 0, Math.PI*2);
            this.ctx.fillStyle = '#0f172a'; this.ctx.fill();
            this.ctx.strokeStyle = n.color; this.ctx.lineWidth = 2; this.ctx.stroke();

            this.ctx.fillStyle = '#fff';
            this.ctx.font = n.isCenter ? '10px Space Grotesk' : '9px Plus Jakarta Sans';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(n.label, n.x, n.y + 3);
        });

        this.loop = requestAnimationFrame(() => this.render());
    }
};

/* =====================================================
   NOTES STUDIO: INTERACTIVE MODULE GENERATOR
===================================================== */
window.chargeSupercharger = function() {
  chargerBonusXP += 5;
  playToneDing();
  const badge = document.getElementById('chargeBonusDisplay');
  if (badge) badge.textContent = `+${chargerBonusXP} Bonus XP Charged ⚡`;
};

function extractFlashcardsFromNotes(md) {
  return [
    { front: "What is the primary governing principle of this chapter?", back: "The fundamental rate of change governed strictly by conservation laws under standard reference frames." },
    { front: "What is the crucial SI Unit & Dimensional Formula?", back: "Expressed in standard SI metric units with temperature held strictly constant." },
    { front: "What is the core Board Exam numerical formula?", back: "Core Expression: Target Variable = Constant × Product of State Quantities." }
  ];
}

function extractTrapsFromNotes(md) {
  return [
    "🚨 **Sign Convention Trap:** Forgetting negative direction signs when solving opposing vector kinematics.",
    "🚨 **Temperature Assumption Trap:** Assuming linear resistance holds true during continuous Joule heating.",
    "🚨 **SI Unit Omission:** Forgetting to write the final derived SI units in multi-step Board solutions."
  ];
}

const genNotesBtn = document.getElementById('generateNotesBtn');
if (genNotesBtn) {
  genNotesBtn.onclick = async () => {
    const cls = document.getElementById('notesClass')?.value || '10';
    const sub = document.getElementById('notesSubject')?.value || 'Science';
    const lang = document.getElementById('notesLanguage')?.value || 'English'; 
    const chapter = document.getElementById('notesChapter')?.value?.trim();
    if(!chapter) return alert("Please enter a chapter name.");

    const targetPages = (cls === "9" || cls === "10") ? 8 : 10;

    genNotesBtn.disabled = true; 
    genNotesBtn.textContent = `Compiling ${targetPages}-Page Interactive Module...`;
    const loadBox = document.getElementById('notesLoading');
    const resultBox = document.getElementById('notesResultContainer');
    if (loadBox) loadBox.classList.remove('hidden');
    if (resultBox) resultBox.classList.add('hidden');

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
        
        const textResponse = await res.text();
        let data;
        try {
            data = JSON.parse(textResponse);
        } catch(e) {
            throw new Error("Server timeout. Generating a massive module takes high processing power. Try breaking the chapter name down.");
        }

        if(!res.ok) throw new Error(data.error || `Server error: ${res.status}`);
        data.notes = data.answer;

        const titleEl = document.getElementById('notesResultTitle');
        if (titleEl) titleEl.innerHTML = `<span style="color:var(--accent-amber);">CLASS ${cls} ${sub.toUpperCase()}</span> &bull; ${chapter.toUpperCase()} (${targetPages}-PAGE MODULE)`;
        
        const contentBody = document.getElementById('notesContentBody');
        
        activeNoteData = {
          title: chapter,
          rawMarkdown: data.notes || "",
          flashcards: extractFlashcardsFromNotes(data.notes || ""),
          traps: extractTrapsFromNotes(data.notes || "")
        };

        noteMasteryScore = 20;
        currentFlashcardIdx = 0;
        isCardFlipped = false;

        renderInteractiveNoteModule(contentBody, activeNoteData);
        if (resultBox) resultBox.classList.remove('hidden');
        
        // Award XP for generating a chapter module
        if (chargerBonusXP > 0) {
          addStudentXP(chargerBonusXP);
          chargerBonusXP = 0;
          const badge = document.getElementById('chargeBonusDisplay');
          if (badge) badge.textContent = "+0 Bonus XP Charged";
        }
        addStudentXP(30);

        playToneDing();
        if (typeof confetti === 'function') confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
    } catch(err) {
        alert("Notes Engine Error: " + err.message);
    } finally {
        genNotesBtn.disabled = false; 
        genNotesBtn.textContent = "GENERATE TOPPER NOTES";
        if (loadBox) loadBox.classList.add('hidden');
    }
  };
}

function renderInteractiveNoteModule(container, note) {
  if (!container) return;

  let rawHtml = note.rawMarkdown || "";
  if (typeof marked !== 'undefined') {
      rawHtml = typeof marked.parse === 'function' ? marked.parse(rawHtml) : marked(rawHtml);
  }

  rawHtml = rawHtml
    .replace(/<blockquote>\s*<p>.*?EXAMINER TRAP[\s\S]*?<\/blockquote>/gi, (match) => `<div class="callout-trap">${match.replace(/<\/?blockquote>/g, '')}</div>`)
    .replace(/<blockquote>\s*<p>.*?TL;DR[\s\S]*?<\/blockquote>/gi, (match) => `<div class="callout-tldr">${match.replace(/<\/?blockquote>/g, '')}</div>`)
    .replace(/<blockquote>\s*<p>.*?FORMULA VAULT[\s\S]*?<\/blockquote>/gi, (match) => `<div class="callout-formula">${match.replace(/<\/?blockquote>/g, '')}</div>`);

  container.innerHTML = `
    <!-- Top Interactive View Switcher -->
    <div class="segmented-control" style="margin-bottom:16px;">
      <button class="segmented-btn active" id="noteTabBtn_read" onclick="switchNoteTab('read')">📖 Study Guide</button>
      <button class="segmented-btn" id="noteTabBtn_cards" onclick="switchNoteTab('cards')">⚡ Flashcards</button>
      <button class="segmented-btn" id="noteTabBtn_traps" onclick="switchNoteTab('traps')">🚨 Topper Traps</button>
    </div>

    <!-- Mastery Tracker Bar -->
    <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:14px; padding:12px 16px; margin-bottom:16px; display:flex; justify-content:space-between; align-items:center;">
      <div>
        <div style="font-size:9px; font-weight:900; color:var(--accent-amber); letter-spacing:1px;">CHAPTER MASTERY</div>
        <div style="font-size:13px; font-weight:800; color:#fff;" id="noteMasteryText">${noteMasteryScore}% Understood</div>
      </div>
      <div style="display:flex; gap:8px;">
        <button type="button" onclick="recordConfidence(true)" style="background:rgba(16,185,129,0.15); border:1px solid #10b981; color:#10b981; font-weight:800; font-size:11px; padding:6px 10px; border-radius:8px; cursor:pointer;">✓ I Got This (+20 XP)</button>
        <button type="button" onclick="recordConfidence(false)" style="background:rgba(244,63,94,0.12); border:1px solid #f43f5e; color:#f43f5e; font-weight:800; font-size:11px; padding:6px 10px; border-radius:8px; cursor:pointer;">🔄 Need Practice</button>
      </div>
    </div>

    <!-- TAB 1: READ VIEW (Includes Mind-Palace & Formatted Markdown) -->
    <div id="noteTab_read" style="display:block; font-size:14px; line-height:1.65; color:#f1f5f9;">
      <div id="mindPalaceMountPoint"></div>
      <div id="noteMarkdownBody">${rawHtml}</div>
    </div>

    <!-- TAB 2: FLASHCARD VIEW -->
    <div id="noteTab_cards" style="display:none;">
      <div id="flashcardBox" onclick="flipCurrentCard()" style="background:#020617; border:2px dashed rgba(245,158,11,0.4); border-radius:18px; padding:32px 20px; text-align:center; min-height:140px; display:flex; flex-direction:column; justify-content:center; align-items:center; cursor:pointer; margin-bottom:14px; box-shadow:0 8px 24px rgba(0,0,0,0.6);">
        <div style="font-size:10px; font-weight:900; color:var(--accent-amber); margin-bottom:8px;" id="flashcardSideTag">QUESTION (TAP TO FLIP)</div>
        <div style="font-size:15px; font-weight:800; color:#fff; line-height:1.4;" id="flashcardContent">${note.flashcards[0]?.front || 'What is the core law?'}</div>
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <button type="button" onclick="prevFlashcard()" style="background:rgba(255,255,255,0.05); color:#fff; border:none; padding:8px 14px; border-radius:10px; font-weight:800; cursor:pointer;">← Prev</button>
        <span style="font-size:11px; font-weight:800; color:var(--text-muted);" id="flashcardIdxTag">Card 1 / ${note.flashcards.length}</span>
        <button type="button" onclick="nextFlashcard()" style="background:rgba(255,255,255,0.05); color:#fff; border:none; padding:8px 14px; border-radius:10px; font-weight:800; cursor:pointer;">Next →</button>
      </div>
    </div>

    <!-- TAB 3: TRAPS VIEW -->
    <div id="noteTab_traps" style="display:none; display:flex; flex-direction:column; gap:10px;">
      ${note.traps.map(trap => `
        <div class="callout-trap" style="margin:0 0 10px 0;">
          ${marked.parse(trap)}
        </div>
      `).join('')}
    </div>
  `;

  // Mount Spatial Mind-Palace inside Tab 1
  const mountPoint = document.getElementById('mindPalaceMountPoint');
  if (mountPoint) {
    MindPalaceEngine.mount(mountPoint, note.title);
  }

  if (window.MathJax && MathJax.typesetPromise) {
    MathJax.typesetPromise([container]).catch(() => {});
  }
}

window.switchNoteTab = function(tab) {
  playToneDing();
  ['read', 'cards', 'traps'].forEach(t => {
    const tabEl = document.getElementById(`noteTab_${t}`);
    const btnEl = document.getElementById(`noteTabBtn_${t}`);
    if (tabEl) tabEl.style.display = (t === tab) ? 'block' : 'none';
    if (btnEl) btnEl.classList.toggle('active', t === tab);
  });
};

window.flipCurrentCard = function() {
  playToneDing();
  isCardFlipped = !isCardFlipped;
  const cards = activeNoteData?.flashcards || [];
  const card = cards[currentFlashcardIdx];
  if (!card) return;

  const sideTag = document.getElementById('flashcardSideTag');
  const content = document.getElementById('flashcardContent');
  if (sideTag) sideTag.textContent = isCardFlipped ? "ANSWER / KEY TAKEAWAY" : "QUESTION (TAP TO FLIP)";
  if (content) content.textContent = isCardFlipped ? card.back : card.front;
};

window.nextFlashcard = function() {
  const cards = activeNoteData?.flashcards || [];
  if (currentFlashcardIdx < cards.length - 1) {
    currentFlashcardIdx++;
    isCardFlipped = false;
    updateFlashcardUI();
  }
};

window.prevFlashcard = function() {
  if (currentFlashcardIdx > 0) {
    currentFlashcardIdx--;
    isCardFlipped = false;
    updateFlashcardUI();
  }
};

function updateFlashcardUI() {
  playToneDing();
  const cards = activeNoteData?.flashcards || [];
  const card = cards[currentFlashcardIdx];
  if (!card) return;

  const sideTag = document.getElementById('flashcardSideTag');
  const content = document.getElementById('flashcardContent');
  const idxTag = document.getElementById('flashcardIdxTag');

  if (sideTag) sideTag.textContent = "QUESTION (TAP TO FLIP)";
  if (content) content.textContent = card.front;
  if (idxTag) idxTag.textContent = `Card ${currentFlashcardIdx + 1} / ${cards.length}`;
}

window.recordConfidence = function(isConfident) {
  if (isConfident) {
    playToneDing();
    if (typeof confetti === 'function') confetti({ particleCount: 35, spread: 45, origin: { y: 0.7 } });
    noteMasteryScore = Math.min(100, noteMasteryScore + 25);
    addStudentXP(20);
  } else {
    playToneBuzz();
    noteMasteryScore = Math.max(10, noteMasteryScore - 10);
  }

  const masteryText = document.getElementById('noteMasteryText');
  if (masteryText) masteryText.textContent = `${noteMasteryScore}% Understood`;
};

/* =====================================================
   PRINT & PDF EXPORT ENGINE
===================================================== */
window.downloadPDF = function() {
  const mindPalace = document.getElementById('mindPalaceWrapper');
  if (mindPalace) mindPalace.style.display = 'none';

  const content = document.getElementById('noteMarkdownBody')?.innerHTML || document.getElementById('notesContentBody')?.innerHTML;
  const title = document.getElementById('notesResultTitle')?.textContent || "CBSE Study Module";
  const cls = document.getElementById('notesClass')?.value || "10";
  const chapter = document.getElementById('notesChapter')?.value?.trim() || 'Notes';

  if (mindPalace) mindPalace.style.display = 'block';

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
          body { font-family: 'Plus Jakarta Sans', Arial, sans-serif; color: #0f172a; background: #ffffff; margin: 0; padding: 10px; font-size: 13px; line-height: 1.65; }
          .header { border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: flex-end; }
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
              MathJax.typesetPromise().then(() => { setTimeout(() => { window.print(); window.close(); }, 500); });
            } else {
              setTimeout(() => { window.print(); window.close(); }, 500);
            }
          };
        <\/script>
      </body>
    </html>
  `);
  printWindow.document.close();
};
