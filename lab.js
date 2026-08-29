/**
 * INVINCIBLE 360 - INTERACTIVE SCIENCE LAB ENGINE
 * "Don't just learn it. Make it happen."
 */

// --- ULTRA-SAFE STATE INITIALIZATION (Prevents Memory Crashes) ---
function safeLoadArray(key) {
  try {
    const data = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(data) ? data : [];
  } catch(e) {
    return [];
  }
}

window.labState = {
  selectedClass: '10',
  selectedSubject: 'all',
  activeSim: null,
  animFrameId: null,
  audioCtx: null,
  completedSims: safeLoadArray('invincible_lab_completed'),
  notebook: safeLoadArray('invincible_lab_notebook'),
  predictionMade: false
};

// --- AUDIO & HAPTIC ENGINE ---
function getAudioCtx() {
  if (!window.labState.audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) window.labState.audioCtx = new AudioContext();
  }
  if (window.labState.audioCtx && window.labState.audioCtx.state === 'suspended') {
    window.labState.audioCtx.resume();
  }
  return window.labState.audioCtx;
}

function playTone(freq, type = 'sine', duration = 0.15, gainVal = 0.1) {
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(gainVal, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch(e) {}
}

function triggerLabHaptic(pattern = [40]) {
  try {
    if (typeof triggerHaptic === 'function') triggerHaptic(pattern);
    else if (navigator.vibrate) navigator.vibrate(pattern);
  } catch(e) {}
}

// --- FULL 5-SIMULATION DATABASE ---
const SIMULATIONS = {
  'ohms_law': {
    id: 'ohms_law',
    title: "Ohm's Law & Circuit Overload",
    subject: 'physics',
    class: ['9', '10', '11', '12'],
    badge: '⚡ Physics Core',
    desc: 'Manipulate Voltage (V) and Resistance (R). Observe current flow, bulb brightness, and avoid circuit burnout.',
    realLife: 'Automobile headlights, household dimmers, CPU power rails.',
    viva: [
      { q: "Why is an ammeter always connected in series?", a: "To measure total circuit current without altering resistance." },
      { q: "What does the slope of a V-I graph represent?", a: "The electrical resistance (R = ΔV / ΔI) of the conductor." }
    ],
    prediction: {
      prompt: "If Voltage is quadrupled (4×) while Resistance remains constant, what happens to Current?",
      options: [
        { text: "Current becomes 4× higher", correct: true, exp: "By Ohm's law, I = V / R. Current is directly proportional to voltage." },
        { text: "Current drops to 1/4th", correct: false, exp: "Current increases linearly with applied voltage." },
        { text: "Current remains unchanged", correct: false, exp: "Current always scales with voltage across fixed ohmic resistors." }
      ]
    },
    params: { v: 6, r: 10, blown: false },
    controls: [
      { id: 'ctrl_v', label: 'Voltage (V)', min: 1, max: 24, step: 0.5, default: 6, unit: 'V' },
      { id: 'ctrl_r', label: 'Resistance (R)', min: 1, max: 50, step: 1, default: 10, unit: 'Ω' }
    ],
    init: function(canvas, ctx) { this.params.v = 6; this.params.r = 10; this.params.blown = false; },
    update: function(paramId, value) {
      if (paramId === 'ctrl_v') this.params.v = parseFloat(value);
      if (paramId === 'ctrl_r') this.params.r = parseFloat(value);
      const i = this.params.v / this.params.r;
      if (i > 3.5 && !this.params.blown) {
        this.params.blown = true;
        playTone(180, 'sawtooth', 0.4, 0.3);
        triggerLabHaptic([120, 80, 200]);
      } else if (i <= 3.5 && this.params.blown) {
        this.params.blown = false;
      } else {
        playTone(200 + (this.params.v * 30), 'sine', 0.08, 0.05);
      }
    },
    render: function(canvas, ctx) {
      const w = canvas.width; const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      const v = this.params.v; const r = this.params.r;
      const current = this.params.blown ? 0 : (v / r);
      const power = current * v;

      ctx.lineWidth = 4;
      ctx.strokeStyle = this.params.blown ? '#ef4444' : (current > 0 ? '#00e5ff' : '#334155');
      ctx.shadowColor = this.params.blown ? '#ef4444' : '#00e5ff';
      ctx.shadowBlur = this.params.blown ? 15 : Math.min(25, current * 8);

      const padX = w * 0.15; const padY = h * 0.2; const cW = w * 0.7; const cH = h * 0.6;
      ctx.strokeRect(padX, padY, cW, cH);
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#0f172a'; ctx.fillRect(padX - 25, padY + cH / 2 - 30, 50, 60);
      ctx.strokeStyle = '#f59e0b'; ctx.strokeRect(padX - 25, padY + cH / 2 - 30, 50, 60);
      ctx.fillStyle = '#fbbf24'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(`+ ${v.toFixed(1)}V -`, padX, padY + cH / 2 + 4);

      ctx.fillStyle = '#0f172a'; ctx.fillRect(padX + cW / 2 - 45, padY + cH - 18, 90, 36);
      ctx.strokeStyle = '#05ffa1'; ctx.strokeRect(padX + cW / 2 - 45, padY + cH - 18, 90, 36);
      ctx.fillStyle = '#05ffa1'; ctx.fillText(`R = ${r.toFixed(0)} Ω`, padX + cW / 2, padY + cH + 5);

      const bulbX = padX + cW / 2; const bulbY = padY;
      ctx.fillStyle = '#0f172a'; ctx.beginPath(); ctx.arc(bulbX, bulbY, 26, 0, Math.PI * 2); ctx.fill();

      if (this.params.blown) {
        ctx.strokeStyle = '#ef4444'; ctx.stroke(); ctx.fillStyle = '#ef4444';
        ctx.font = '900 16px sans-serif'; ctx.fillText('💥 FUSE BLOWN!', bulbX, bulbY - 35);
      } else {
        const glowAlpha = Math.min(1, current / 2.5);
        ctx.fillStyle = `rgba(251, 191, 36, ${glowAlpha})`; ctx.shadowColor = '#f59e0b'; ctx.shadowBlur = glowAlpha * 40;
        ctx.beginPath(); ctx.arc(bulbX, bulbY, 20, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0; ctx.strokeStyle = '#fbbf24'; ctx.stroke();
        ctx.fillStyle = '#060913'; ctx.font = 'bold 11px sans-serif'; ctx.fillText('💡 BULB', bulbX, bulbY + 4);
      }

      ctx.fillStyle = 'rgba(2, 6, 23, 0.85)'; ctx.strokeStyle = 'rgba(0, 229, 255, 0.3)'; ctx.lineWidth = 1;
      ctx.fillRect(w - 210, 16, 195, 100); ctx.strokeRect(w - 210, 16, 195, 100);
      ctx.textAlign = 'left'; ctx.fillStyle = '#94a3b8'; ctx.font = '10px monospace';
      ctx.fillText('MULTIMETER READOUT:', w - 198, 34);
      ctx.fillStyle = '#00e5ff'; ctx.font = 'bold 13px monospace';
      ctx.fillText(`CURRENT (I): ${current.toFixed(2)} A`, w - 198, 56);
      ctx.fillStyle = '#fbbf24'; ctx.fillText(`POWER (P):   ${power.toFixed(1)} W`, w - 198, 76);
      ctx.fillStyle = '#05ffa1'; ctx.fillText(`STATUS:      ${this.params.blown ? 'TRIPPED' : 'NOMINAL'}`, w - 198, 96);
    }
  },

  'ray_optics': {
    id: 'ray_optics',
    title: "Ray Optics & Focal Bench",
    subject: 'physics',
    class: ['10', '12'],
    badge: '🔬 CBSE Practical #1',
    desc: 'Move an object along the optical bench to visualize real-time ray tracing, image inversion, and focal points.',
    realLife: 'Car headlights (concave), rear-view mirrors (convex), astronomical telescopes.',
    viva: [
      { q: "What is the mirror formula?", a: "1/f = 1/v + 1/u, following Cartesian sign conventions." },
      { q: "Why is a convex mirror used as a rear-view mirror?", a: "It always produces an erect, diminished image and provides a wide field of view." }
    ],
    prediction: {
      prompt: "For a concave mirror with focal length f = 15 cm, if an object is placed at u = 30 cm, where will the image form?",
      options: [
        { text: "At C (v = 30 cm), same size & inverted", correct: true, exp: "When u = 2f, image forms at 2f with magnification m = -1." },
        { text: "Between F and C, magnified", correct: false, exp: "Image only forms between F and C when object is beyond C." },
        { text: "At Infinity", correct: false, exp: "Image only forms at infinity when object is precisely at Focus." }
      ]
    },
    params: { u: 35, f: 15 },
    controls: [
      { id: 'ctrl_u', label: 'Object Distance (u)', min: 5, max: 60, step: 1, default: 35, unit: 'cm' },
      { id: 'ctrl_f', label: 'Focal Length (f)', min: 10, max: 25, step: 1, default: 15, unit: 'cm' }
    ],
    init: function() { this.params.u = 35; this.params.f = 15; },
    update: function(paramId, value) {
      if (paramId === 'ctrl_u') this.params.u = parseFloat(value);
      if (paramId === 'ctrl_f') this.params.f = parseFloat(value);
      playTone(300 + (this.params.u * 8), 'sine', 0.05, 0.03);
    },
    render: function(canvas, ctx) {
      const w = canvas.width; const h = canvas.height; ctx.clearRect(0, 0, w, h);
      const centerY = h / 2; const mirrorX = w * 0.75; const scale = 6;

      ctx.strokeStyle = '#334155'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, centerY); ctx.lineTo(w, centerY); ctx.stroke();
      ctx.strokeStyle = '#00e5ff'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(mirrorX + 250, centerY, 250, Math.PI * 0.85, Math.PI * 1.15); ctx.stroke();

      const fX = mirrorX - (this.params.f * scale); const cX = mirrorX - (this.params.f * 2 * scale);
      ctx.fillStyle = '#fbbf24'; ctx.beginPath(); ctx.arc(fX, centerY, 4, 0, Math.PI * 2); ctx.fill();
      ctx.font = 'bold 11px sans-serif'; ctx.fillText('F', fX - 4, centerY + 18);
      ctx.fillStyle = '#05ffa1'; ctx.beginPath(); ctx.arc(cX, centerY, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillText('C (2F)', cX - 10, centerY + 18);

      const uX = mirrorX - (this.params.u * scale); const objHeight = 50;
      ctx.strokeStyle = '#05ffa1'; ctx.lineWidth = 3; ctx.beginPath();
      ctx.moveTo(uX, centerY); ctx.lineTo(uX, centerY - objHeight); ctx.stroke();
      ctx.fillStyle = '#05ffa1'; ctx.fillText('Object (AB)', uX - 25, centerY - objHeight - 8);

      const u = this.params.u; const f = this.params.f;
      let v = 0, m = 0, isVirtual = false;
      if (Math.abs(u - f) < 0.1) { v = Infinity; } 
      else if (u > f) { v = (u * f) / (u - f); m = -v / u; } 
      else { v = (u * f) / (f - u); m = v / u; isVirtual = true; }

      ctx.strokeStyle = 'rgba(255, 42, 95, 0.7)'; ctx.lineWidth = 2; ctx.beginPath();
      ctx.moveTo(uX, centerY - objHeight); ctx.lineTo(mirrorX, centerY - objHeight); ctx.lineTo(fX, centerY);
      ctx.lineTo(0, centerY + ((centerY - (centerY - objHeight)) / (mirrorX - fX)) * (fX)); ctx.stroke();

      ctx.strokeStyle = 'rgba(0, 229, 255, 0.7)'; ctx.beginPath();
      ctx.moveTo(uX, centerY - objHeight); ctx.lineTo(fX, centerY); ctx.lineTo(mirrorX, centerY + objHeight); ctx.lineTo(0, centerY + objHeight); ctx.stroke();

      if (Number.isFinite(v)) {
        const imgX = isVirtual ? mirrorX + (v * scale) : mirrorX - (v * scale);
        const imgHeight = objHeight * m;
        ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 3; ctx.beginPath();
        ctx.moveTo(imgX, centerY); ctx.lineTo(imgX, centerY - imgHeight); ctx.stroke();
        ctx.fillStyle = '#f59e0b'; ctx.fillText(`Image (A'B')`, imgX - 25, centerY - imgHeight + (m < 0 ? 15 : -8));
      }

      ctx.fillStyle = 'rgba(2, 6, 23, 0.9)'; ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'; ctx.fillRect(16, 16, 210, 96); ctx.strokeRect(16, 16, 210, 96);
      ctx.fillStyle = '#94a3b8'; ctx.font = '10px monospace'; ctx.fillText('OPTICAL COMPUTATION:', 26, 34);
      ctx.fillStyle = '#00e5ff'; ctx.font = 'bold 12px monospace';
      ctx.fillText(`IMAGE (v): ${Number.isFinite(v) ? v.toFixed(1) + ' cm' : '∞'}`, 26, 54);
      ctx.fillStyle = '#fbbf24'; ctx.fillText(`MAG (m):   ${Number.isFinite(m) ? m.toFixed(2) + '×' : 'N/A'}`, 26, 72);
      ctx.fillStyle = isVirtual ? '#f43f5e' : '#05ffa1'; ctx.fillText(`NATURE:    ${isVirtual ? 'Virtual & Erect' : 'Real & Inverted'}`, 26, 90);
    }
  },

  'projectile_motion': {
    id: 'projectile_motion',
    title: "Kinematics & Projectile Arc",
    subject: 'physics',
    class: ['9', '11'],
    badge: '🚀 Mechanics Lab',
    desc: 'Launch a projectile by varying velocity (v₀), launch angle (θ), and gravitational acceleration (g).',
    realLife: 'Rocket launches, football trajectory, satellite orbit injection.',
    viva: [
      { q: "At what angle is the horizontal range of a projectile maximum?", a: "At θ = 45°." },
      { q: "What happens to the vertical velocity at the highest point?", a: "Vertical component becomes zero." }
    ],
    prediction: {
      prompt: "If launched at θ = 45° versus θ = 60°, which achieves maximum horizontal range?",
      options: [
        { text: "θ = 45° achieves maximum range", correct: true, exp: "R = (v₀² sin 2θ) / g. sin(90°) = 1 gives absolute maximum." },
        { text: "θ = 60° achieves maximum range", correct: false, exp: "60° gives higher altitude, but lower horizontal range." },
        { text: "Both achieve identical range", correct: false, exp: "Complementary angles have equal range, but 45° is greater." }
      ]
    },
    params: { v0: 25, theta: 45, g: 9.8 },
    controls: [
      { id: 'ctrl_v0', label: 'Initial Velocity (v₀)', min: 10, max: 40, step: 1, default: 25, unit: 'm/s' },
      { id: 'ctrl_theta', label: 'Launch Angle (θ)', min: 15, max: 80, step: 5, default: 45, unit: '°' },
      { id: 'ctrl_g', label: 'Gravity (g)', min: 3.7, max: 15, step: 0.1, default: 9.8, unit: 'm/s²' }
    ],
    init: function() { this.params.v0 = 25; this.params.theta = 45; this.params.g = 9.8; },
    update: function(paramId, value) {
      if (paramId === 'ctrl_v0') this.params.v0 = parseFloat(value);
      if (paramId === 'ctrl_theta') this.params.theta = parseFloat(value);
      if (paramId === 'ctrl_g') this.params.g = parseFloat(value);
      playTone(250 + (this.params.theta * 5), 'sine', 0.05, 0.03);
    },
    render: function(canvas, ctx) {
      const w = canvas.width; const h = canvas.height; ctx.clearRect(0, 0, w, h);
      const groundY = h - 50; const startX = 60;

      ctx.strokeStyle = '#334155'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(w, groundY); ctx.stroke();

      const v0 = this.params.v0; const rad = (this.params.theta * Math.PI) / 180; const g = this.params.g;
      const tFlight = (2 * v0 * Math.sin(rad)) / g;
      const hMax = (v0 * v0 * Math.sin(rad) * Math.sin(rad)) / (2 * g);
      const range = (v0 * v0 * Math.sin(2 * rad)) / g;
      const scaleX = (w - 140) / Math.max(100, range);
      const scaleY = (h - 140) / Math.max(40, hMax);

      ctx.strokeStyle = '#00e5ff'; ctx.lineWidth = 3; ctx.beginPath();
      ctx.moveTo(startX, groundY);
      const steps = 60;
      for (let i = 0; i <= steps; i++) {
        const t = (i / steps) * tFlight;
        const x = v0 * Math.cos(rad) * t;
        const y = (v0 * Math.sin(rad) * t) - (0.5 * g * t * t);
        ctx.lineTo(startX + (x * scaleX), groundY - (y * scaleY));
      }
      ctx.stroke();

      ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 5; ctx.beginPath();
      ctx.moveTo(startX, groundY); ctx.lineTo(startX + (25 * Math.cos(rad)), groundY - (25 * Math.sin(rad))); ctx.stroke();

      ctx.fillStyle = 'rgba(2, 6, 23, 0.9)'; ctx.strokeStyle = 'rgba(0, 229, 255, 0.3)'; ctx.lineWidth = 1;
      ctx.fillRect(w - 220, 16, 205, 100); ctx.strokeRect(w - 220, 16, 205, 100);
      ctx.textAlign = 'left'; ctx.fillStyle = '#94a3b8'; ctx.font = '10px monospace';
      ctx.fillText('FLIGHT KINEMATICS:', w - 208, 34);
      ctx.fillStyle = '#00e5ff'; ctx.font = 'bold 12px monospace';
      ctx.fillText(`MAX RANGE: ${range.toFixed(1)} m`, w - 208, 54);
      ctx.fillStyle = '#fbbf24'; ctx.fillText(`MAX HEIGHT: ${hMax.toFixed(1)} m`, w - 208, 72);
      ctx.fillStyle = '#05ffa1'; ctx.fillText(`FLIGHT TIME: ${tFlight.toFixed(2)} s`, w - 208, 90);
    }
  },

  'titration_ph': {
    id: 'titration_ph',
    title: "Acid-Base Titration & pH Curve",
    subject: 'chemistry',
    class: ['10', '11', '12'],
    badge: '🧪 Chemistry Practical',
    desc: 'Add 0.1M NaOH dropwise into 0.1M HCl. Watch pH jump at equivalence point and observe indicator color change.',
    realLife: 'Soil acidity treatment, swimming pool balance, antacid formulation.',
    viva: [
      { q: "What is the pH at equivalence point?", a: "Precisely pH 7.0 at 25°C because complete neutralization forms neutral salt and water." },
      { q: "Color change of Phenolphthalein?", a: "Colorless in acidic medium, shifts to pink at pH 8.2 - 10.0." }
    ],
    prediction: {
      prompt: "When 25 mL of 0.1M NaOH is added to 25 mL of 0.1M HCl, what will be the solution pH?",
      options: [
        { text: "pH = 7.0 (Neutral)", correct: true, exp: "Equal moles of strong acid (H+) and base (OH-) neutralize completely to pH 7.0." },
        { text: "pH = 1.0 (Strongly Acidic)", correct: false, exp: "All acid is neutralized." },
        { text: "pH = 14.0 (Strongly Basic)", correct: false, exp: "Excess base is required to reach pH 14." }
      ]
    },
    params: { addedVol: 0 },
    controls: [{ id: 'ctrl_vol', label: 'Added 0.1M NaOH (mL)', min: 0, max: 50, step: 0.5, default: 0, unit: 'mL' }],
    init: function() { this.params.addedVol = 0; },
    update: function(paramId, value) {
      if (paramId === 'ctrl_vol') this.params.addedVol = parseFloat(value);
      playTone(400 + (this.params.addedVol * 15), 'triangle', 0.06, 0.05);
    },
    render: function(canvas, ctx) {
      const w = canvas.width; const h = canvas.height; ctx.clearRect(0, 0, w, h);
      const vol = this.params.addedVol;
      let ph = 1.0;
      if (vol < 24.8) {
        const remMoles = 0.0025 - (vol * 0.001 * 0.1);
        ph = -Math.log10(Math.max(0.0000001, remMoles / ((25 + vol) * 0.001)));
      } else if (vol >= 24.8 && vol <= 25.2) {
        ph = 7.0;
      } else {
        ph = 14 + Math.log10(((vol - 25) * 0.001 * 0.1) / ((25 + vol) * 0.001));
      }
      let liquidColor = 'rgba(240, 249, 255, 0.3)';
      if (ph >= 8.2) liquidColor = `rgba(244, 63, 94, ${Math.min(0.85, (ph - 8.2) / 3)})`;

      const bX = w * 0.35;
      ctx.fillStyle = '#1e293b'; ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2;
      ctx.fillRect(bX - 12, 30, 24, 180); ctx.strokeRect(bX - 12, 30, 24, 180);

      const fillH = Math.max(0, 170 - (vol * 3.4));
      ctx.fillStyle = 'rgba(0, 229, 255, 0.3)'; ctx.fillRect(bX - 10, 35 + (170 - fillH), 20, fillH);

      const fX = bX; const fY = 270;
      ctx.fillStyle = liquidColor; ctx.strokeStyle = '#00e5ff'; ctx.beginPath();
      ctx.moveTo(fX - 15, fY - 50); ctx.lineTo(fX + 15, fY - 50); ctx.lineTo(fX + 60, fY + 60); ctx.lineTo(fX - 60, fY + 60);
      ctx.closePath(); ctx.fill(); ctx.stroke();

      const mX = w * 0.65; const mY = 50;
      ctx.fillStyle = '#0f172a'; ctx.strokeStyle = '#05ffa1'; ctx.lineWidth = 2;
      ctx.fillRect(mX, mY, 180, 100); ctx.strokeRect(mX, mY, 180, 100);

      ctx.fillStyle = '#94a3b8'; ctx.font = 'bold 11px sans-serif'; ctx.fillText('DIGITAL pH PROBE', mX + 25, mY + 24);
      ctx.fillStyle = ph < 7 ? '#ef4444' : (ph === 7 ? '#05ffa1' : '#f43f5e');
      ctx.font = '900 32px monospace'; ctx.fillText(`pH ${ph.toFixed(2)}`, mX + 25, mY + 68);
      ctx.font = '10px sans-serif'; ctx.fillStyle = '#cbd5e1'; ctx.fillText(ph < 7 ? 'Acidic Medium' : (ph === 7 ? 'Neutralized' : 'Basic Medium'), mX + 25, mY + 88);
    }
  },

  'osmosis_cell': {
    id: 'osmosis_cell',
    title: "Osmosis & Cell Plasmolysis",
    subject: 'biology',
    class: ['9', '10', '11', '12'],
    badge: '🧬 Cellular Bio',
    desc: 'Change the surrounding solution molarity to observe Endosmosis, Equilibrium, or Plasmolysis.',
    realLife: 'Kidney dialysis, plant root water uptake, pickling preservation.',
    viva: [
      { q: "What is plasmolysis?", a: "The shrinkage of cytoplasm away from the cell wall in a hypertonic solution." },
      { q: "Why do plant cells not burst in a hypotonic medium?", a: "The rigid cellulose cell wall exerts counter turgor pressure." }
    ],
    prediction: {
      prompt: "When placed in a concentrated 20% NaCl solution, what will occur?",
      options: [
        { text: "Exosmosis (Plasmolysis)", correct: true, exp: "Water moves out of the cell toward the higher solute concentration." },
        { text: "Endosmosis (Cell Swells)", correct: false, exp: "Endosmosis occurs only in hypotonic (dilute) solutions." },
        { text: "No movement of water", correct: false, exp: "Water always moves down its chemical potential gradient." }
      ]
    },
    params: { soluteConc: 0.9 },
    controls: [{ id: 'ctrl_solute', label: 'Solution Concentration (NaCl %)', min: 0.1, max: 5.0, step: 0.1, default: 0.9, unit: '%' }],
    init: function() { this.params.soluteConc = 0.9; },
    update: function(paramId, value) {
      if (paramId === 'ctrl_solute') this.params.soluteConc = parseFloat(value);
      playTone(320 + (this.params.soluteConc * 40), 'sine', 0.05, 0.03);
    },
    render: function(canvas, ctx) {
      const w = canvas.width; const h = canvas.height; ctx.clearRect(0, 0, w, h);
      const conc = this.params.soluteConc; const cX = w * 0.4; const cY = h / 2;
      let shrinkFactor = 1.0; let stateLabel = "Isotonic (Equilibrium)"; let stateColor = "#05ffa1";

      if (conc < 0.8) { shrinkFactor = 1.15; stateLabel = "Hypotonic (Endosmosis)"; stateColor = "#00e5ff"; } 
      else if (conc > 1.2) { shrinkFactor = Math.max(0.6, 1.0 - ((conc - 1.2) * 0.1)); stateLabel = "Hypertonic (Exosmosis)"; stateColor = "#ef4444"; }

      ctx.strokeStyle = '#10b981'; ctx.lineWidth = 6; ctx.strokeRect(cX - 110, cY - 110, 220, 220);

      const memW = 200 * shrinkFactor; const memH = 200 * shrinkFactor;
      ctx.fillStyle = 'rgba(16, 185, 129, 0.2)'; ctx.strokeStyle = stateColor; ctx.lineWidth = 3;
      ctx.fillRect(cX - (memW / 2), cY - (memH / 2), memW, memH); ctx.strokeRect(cX - (memW / 2), cY - (memH / 2), memW, memH);

      const vacW = 90 * shrinkFactor; const vacH = 90 * shrinkFactor;
      ctx.fillStyle = 'rgba(0, 229, 255, 0.35)'; ctx.strokeStyle = '#00e5ff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(cX, cY, vacW / 2, vacH / 2, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

      ctx.fillStyle = '#fbbf24'; ctx.beginPath(); ctx.arc(cX + (40 * shrinkFactor), cY - (40 * shrinkFactor), 16 * shrinkFactor, 0, Math.PI * 2); ctx.fill();

      ctx.fillStyle = 'rgba(2, 6, 23, 0.9)'; ctx.strokeStyle = 'rgba(16, 185, 129, 0.3)'; ctx.lineWidth = 1;
      ctx.fillRect(w - 230, 16, 215, 100); ctx.strokeRect(w - 230, 16, 215, 100);
      ctx.textAlign = 'left'; ctx.fillStyle = '#94a3b8'; ctx.font = '10px monospace';
      ctx.fillText('CELLULAR OSMOMETER:', w - 218, 34);
      ctx.fillStyle = stateColor; ctx.font = 'bold 12px monospace';
      ctx.fillText(`STATE: ${stateLabel.split(' ')[0]}`, w - 218, 54);
      ctx.fillStyle = '#fbbf24'; ctx.fillText(`MEDIUM CONC: ${conc.toFixed(1)}% NaCl`, w - 218, 72);
    }
  }
};

// --- CORE CONTROLLER FUNCTIONS WITH CRASH ALERTS ---
window.renderLabHome = function() {
  try {
    const matrixGrid = document.getElementById('matrixGrid');
    if (!matrixGrid) return;

    const currentClass = window.labState.selectedClass || '10';
    const currentSubj = window.labState.selectedSubject || 'all';

    const available = Object.values(SIMULATIONS).filter(s => 
      s.class.includes(currentClass) && 
      (currentSubj === 'all' || s.subject === currentSubj)
    );

    let html = '';
    available.forEach(sim => {
      const isCompleted = window.labState.completedSims.includes(sim.id);
      html += `
        <div class="lab-card" onclick="launchSimulation('${sim.id}')" style="background:rgba(15,23,42,0.8); border:1px solid ${isCompleted ? 'var(--accent-emerald)' : 'rgba(0,229,255,0.2)'}; border-radius:18px; padding:18px; cursor:pointer; position:relative; box-shadow:0 4px 20px rgba(0,0,0,0.3);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
            <span style="font-size:10px; font-weight:900; color:var(--accent-cyan); background:rgba(0,229,255,0.1); padding:4px 8px; border-radius:8px;">${sim.badge}</span>
            <span style="font-size:11px; font-weight:900; color:${isCompleted ? 'var(--accent-emerald)' : 'var(--accent-amber)'};">${isCompleted ? '✓ MASTERED' : '+XP LOOT'}</span>
          </div>
          <h3 style="font-size:15px; font-weight:900; color:#fff; margin:0 0 6px 0;">${sim.title}</h3>
          <p style="font-size:12px; color:#94a3b8; margin:0 0 14px 0; line-height:1.4;">${sim.desc}</p>
          <div style="display:flex; align-items:center; justify-content:space-between;">
            <span style="font-size:10px; color:#64748b; font-weight:700;">Class ${currentClass} Syllabus</span>
            <button style="background:linear-gradient(135deg, var(--accent-cyan), #0284c7); color:#060913; border:none; border-radius:10px; padding:6px 12px; font-size:11px; font-weight:900; cursor:pointer;">▶ Launch</button>
          </div>
        </div>
      `;
    });

    matrixGrid.innerHTML = html || `<div style="color:#94a3b8; font-size:13px; text-align:center; grid-column: 1/-1; padding:30px;">No simulations found for this filter.</div>`;
  } catch (err) {
    alert("Lab Interface Error: " + err.message);
  }
};

window.filterLabClass = function(cls, btn) {
  try {
    window.labState.selectedClass = String(cls);
    document.querySelectorAll('#labSection .curr-tab').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    window.renderLabHome();
  } catch(err) { alert("Filter Error: " + err.message); }
};

window.filterLabSubject = function(subj, btn) {
  try {
    window.labState.selectedSubject = subj;
    document.querySelectorAll('#labSection .lab-subj-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    window.renderLabHome();
  } catch(err) { alert("Filter Error: " + err.message); }
};

window.launchSimulation = function(simId) {
  try {
    const sim = SIMULATIONS[simId];
    if (!sim) return;

    window.labState.activeSim = sim;
    window.labState.predictionMade = false;

    document.getElementById('labSkillTree')?.classList.add('hidden');
    document.getElementById('activeLabPlayer')?.classList.remove('hidden');
    
    const titleEl = document.getElementById('labTitle');
    if (titleEl) {
      titleEl.innerHTML = `🔬 ${sim.title} <span style="font-size:12px; color:var(--accent-cyan); font-weight:700;">[Class ${window.labState.selectedClass} Lab]</span>`;
    }

    const ctrlBox = document.getElementById('labControls');
    if (ctrlBox) {
      let controlsHTML = '<div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:14px;">';
      sim.controls.forEach(ctrl => {
        controlsHTML += `
          <div>
            <div style="display:flex; justify-content:space-between; margin-bottom:6px; font-size:12px; font-weight:800; color:#cbd5e1;">
              <span>${ctrl.label}</span>
              <span id="val_${ctrl.id}" style="color:var(--accent-cyan); font-family:monospace;">${ctrl.default} ${ctrl.unit}</span>
            </div>
            <input type="range" id="${ctrl.id}" min="${ctrl.min}" max="${ctrl.max}" step="${ctrl.step}" value="${ctrl.default}" 
                   style="width:100%; accent-color:var(--accent-cyan); cursor:pointer;"
                   oninput="handleParamChange('${ctrl.id}', this.value, '${ctrl.unit}')">
          </div>
        `;
      });
      controlsHTML += '</div>';
      controlsHTML += `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:14px; padding-top:12px; border-top:1px solid rgba(255,255,255,0.06); flex-wrap:wrap; gap:8px;">
          <div style="font-size:11px; color:#94a3b8;"><strong style="color:#fbbf24;">🌍 Real World:</strong> ${sim.realLife}</div>
          <div style="display:flex; gap:8px;">
            <button onclick="logDataPoint()" style="background:rgba(5,255,161,0.15); border:1px solid var(--accent-emerald); color:var(--accent-emerald); padding:6px 12px; border-radius:10px; font-weight:800; font-size:11px; cursor:pointer;">📊 Log Data</button>
            <button onclick="openVivaModal()" style="background:rgba(245,158,11,0.15); border:1px solid var(--accent-amber); color:var(--accent-amber); padding:6px 12px; border-radius:10px; font-weight:800; font-size:11px; cursor:pointer;">🎓 Viva-Voce</button>
          </div>
        </div>
      `;
      ctrlBox.innerHTML = controlsHTML;
    }

    renderPredictionUI(sim);

    const canvas = document.getElementById('invincibleEngine');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      sim.init(canvas, ctx);
      if (window.labState.animFrameId) cancelAnimationFrame(window.labState.animFrameId);
      function loop() {
        sim.render(canvas, ctx);
        window.labState.animFrameId = requestAnimationFrame(loop);
      }
      loop();
    }
  } catch (err) {
    alert("Simulation Engine Crash: " + err.message);
  }
};

window.handleParamChange = function(paramId, value, unit) {
  const label = document.getElementById(`val_${paramId}`);
  if (label) label.textContent = `${value} ${unit}`;
  if (window.labState.activeSim) window.labState.activeSim.update(paramId, value);
};

// --- VARIABLE REWARD ENGINE ---
function triggerLootDrop() {
  const randomXP = Math.floor(Math.random() * (150 - 30 + 1)) + 30; 
  const xpEl = document.getElementById('xpCounter');
  let currentXP = parseInt(xpEl?.textContent || localStorage.getItem('student_xp') || '680', 10);
  currentXP += randomXP;
  if (xpEl) xpEl.textContent = currentXP;
  localStorage.setItem('student_xp', currentXP.toString());

  if (window.labState.activeSim && !window.labState.completedSims.includes(window.labState.activeSim.id)) {
    window.labState.completedSims.push(window.labState.activeSim.id);
    localStorage.setItem('invincible_lab_completed', JSON.stringify(window.labState.completedSims));
  }
  alert(`🎁 QUANTUM CRATE UNLOCKED!\n\nYou earned +${randomXP} XP for your mastery!`);
}

function renderPredictionUI(sim) {
  const predBox = document.getElementById('labPredictionBox');
  if (!sim.prediction) { if (predBox) predBox.style.display = 'none'; return; }
  
  if (predBox) predBox.style.display = 'block';
  const qText = document.getElementById('labQuestionText');
  if (qText) qText.textContent = sim.prediction.prompt;
  
  const grid = document.getElementById('labOptionsGrid');
  if (!grid) return;
  grid.innerHTML = '';

  sim.prediction.options.forEach(opt => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.style.cssText = 'background:#0f172a; border:1px solid #1e293b; color:#fff; text-align:left; padding:10px 14px; border-radius:10px; font-size:12px; font-weight:700; cursor:pointer; width:100%;';
    btn.textContent = opt.text;
    btn.onclick = () => {
      if (window.labState.predictionMade) return;
      window.labState.predictionMade = true;
      Array.from(grid.children).forEach(b => b.disabled = true);

      if (opt.correct) {
        btn.style.borderColor = 'var(--accent-emerald)'; btn.style.background = 'rgba(5, 255, 161, 0.15)';
        triggerLabHaptic([40, 50, 40]);
        triggerLootDrop();
      } else {
        btn.style.borderColor = 'var(--accent-rose)'; btn.style.background = 'rgba(244, 63, 94, 0.15)';
        triggerLabHaptic([100]);
      }

      const expDiv = document.createElement('div');
      expDiv.style.cssText = 'margin-top:10px; font-size:12px; color:#cbd5e1; background:rgba(255,255,255,0.03); padding:8px 12px; border-radius:8px; border-left:3px solid var(--accent-cyan);';
      expDiv.innerHTML = `<strong>${opt.correct ? '🎯 Correct!' : '💡 Master Explanation:'}</strong> ${opt.exp}`;
      grid.appendChild(expDiv);
    };
    grid.appendChild(btn);
  });
}

window.logDataPoint = function() {
  if (!window.labState.activeSim) return;
  const p = window.labState.activeSim.params;
  const entry = { timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'}), ...p };
  window.labState.notebook.push({ experiment: window.labState.activeSim.title, data: entry });
  localStorage.setItem('invincible_lab_notebook', JSON.stringify(window.labState.notebook));
  triggerLabHaptic([30]);
  alert('📝 Observation point logged successfully!');
};

window.openVivaModal = function() {
  if (!window.labState.activeSim) return;
  const viva = window.labState.activeSim.viva;
  let vivaHTML = `
    <div id="vivaModal" style="position:fixed; inset:0; z-index:99999; background:rgba(0,0,0,0.85); backdrop-filter:blur(8px); display:flex; align-items:center; justify-content:center; padding:16px;">
      <div style="background:#0f172a; border:2px solid var(--accent-amber); border-radius:24px; padding:24px; max-width:420px; width:100%;">
        <div style="font-size:14px; font-weight:900; color:var(--accent-amber); margin-bottom:12px;">🎓 CBSE Practical Viva-Voce</div>
        <div style="display:flex; flex-direction:column; gap:12px; margin-bottom:18px;">
  `;
  viva.forEach((v, i) => {
    vivaHTML += `
      <div style="background:#020617; padding:12px; border-radius:12px; border:1px solid #1e293b;">
        <div style="font-size:12px; font-weight:800; color:#fff; margin-bottom:4px;">Q${i+1}: ${v.q}</div>
        <div style="font-size:11px; color:var(--accent-cyan); font-weight:700;">Ans: ${v.a}</div>
      </div>
    `;
  });
  vivaHTML += `
        </div>
        <button onclick="document.getElementById('vivaModal').remove(); triggerLootDrop();" style="width:100%; background:var(--accent-amber); color:#000; border:none; padding:12px; border-radius:12px; font-weight:900; cursor:pointer;">
          Claim XP Reward &amp; Close
        </button>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', vivaHTML);
};

window.closeLabSim = function() {
  if (window.labState.animFrameId) cancelAnimationFrame(window.labState.animFrameId);
  window.labState.activeSim = null;
  document.getElementById('activeLabPlayer')?.classList.add('hidden');
  document.getElementById('labSkillTree')?.classList.remove('hidden');
  window.renderLabHome();
};

// Immediate Self-Execution on Load with Boot Alert
try {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.renderLabHome());
  } else {
    window.renderLabHome();
  }
} catch(err) {
  alert("Lab Boot Sequence Failed: " + err.message);
}
