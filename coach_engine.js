/* =====================================================
   ⚡ INVINCIBLE 360 - AI LEARNING COACH & VISUAL EXPLAINER
   - Pedagogical Modes: Socratic, Hint, Exam Fix, Deep Dive
   - Real-time Canvas Ray Optics & Graph Visualization
   - Context-Aware Prompt Enhancement with Mistake History
===================================================== */

(function(window) {
  'use strict';

  let currentCoachMode = 'quick';

  const COACH_MODES = {
  quick: {
    name: 'Quick Answer',
    icon: '⚡',
    tagline: 'Gives the answer immediately, then explains only what is needed.',
    promptPrefix: 'Give the student the direct answer immediately. Do NOT ask prerequisite questions or use Socratic questioning. Keep the explanation concise and easy.'
  },

  hint: {
    name: 'Key Hint',
    icon: '💡',
    tagline: 'Gives the key formula or idea without the full solution.',
    promptPrefix: 'Give only the key governing concept, formula, rule, or hint needed to solve the problem. Do not ask prerequisite questions.'
  },

  exam: {
    name: 'Exam Fix',
    icon: '📝',
    tagline: 'Shows the cleanest board-exam method.',
    promptPrefix: 'Give a clean CBSE board-exam-ready solution with the necessary steps, formula, units and relevant examiner trap. Do not unnecessarily delay the answer.'
  },

  deepdive: {
    name: 'Deep Dive',
    icon: '🔬',
    tagline: 'For students who want complete conceptual understanding.',
    promptPrefix: 'Give a deeper conceptual explanation with intuition, reasoning and derivation where useful. Teach progressively, but still state the main answer first.'
  }
};

  class CoachEngine {
    constructor() {
      this.initCoachUI();
    }

    setMode(modeKey) {
      if (!COACH_MODES[modeKey]) return;
      currentCoachMode = modeKey;
      
      document.querySelectorAll('.coach-mode-pill').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === modeKey);
      });

      const modeInfo = document.getElementById('coachModeDescription');
      if (modeInfo) {
        modeInfo.textContent = COACH_MODES[modeKey].tagline;
      }

      if (typeof playDing === 'function') playDing();
    }

    getModePrompt() {
      return COACH_MODES[currentCoachMode]?.promptPrefix || COACH_MODES.socratic.promptPrefix;
    }

    /* --------------------------------------------------
       VISUAL ENGINE: DYNAMIC RAY TRACER
    -------------------------------------------------- */
    renderRayOpticsCanvas(mountContainer, lensType = 'convex', objDist = 120) {
      const oldCanvas = document.getElementById('coachRayCanvas');
      if (oldCanvas) oldCanvas.remove();

      const canvasWrapper = document.createElement('div');
      canvasWrapper.id = 'coachRayWrapper';
      canvasWrapper.style.cssText = "background:#020617; border:1px solid rgba(0,229,255,0.3); border-radius:16px; padding:12px; margin:14px 0; text-align:center;";

      canvasWrapper.innerHTML = `
        <div style="display:flex; justify-content:space-between; font-size:11px; font-weight:800; color:var(--accent-cyan); margin-bottom:8px;">
          <span>📐 RAY DIAGRAM VISUALIZER</span>
          <span style="color:#94a3b8;">${lensType.toUpperCase()} LENS</span>
        </div>
        <canvas id="coachRayCanvas" width="340" height="150" style="width:100%; height:150px; background:#050811; border-radius:12px; border:1px dashed rgba(255,255,255,0.1);"></canvas>
      `;

      mountContainer.insertBefore(canvasWrapper, mountContainer.firstChild);

      const canvas = document.getElementById('coachRayCanvas');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;
      const f = 50;

      // Principal Axis
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, cy);
      ctx.lineTo(w, cy);
      ctx.stroke();

      // Optical Center & Lens Plane
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, 15);
      ctx.lineTo(cx, h - 15);
      ctx.stroke();

      // Focus Points
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath(); ctx.arc(cx - f, cy, 3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx + f, cy, 3, 0, Math.PI * 2); ctx.fill();
      ctx.font = '9px Space Grotesk';
      ctx.fillText('F1', cx - f - 4, cy + 12);
      ctx.fillText('F2', cx + f - 4, cy + 12);

      // Object (Arrow)
      const objX = cx - objDist;
      const objH = 40;
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(objX, cy);
      ctx.lineTo(objX, cy - objH);
      ctx.stroke();

      // Parallel Ray -> Through F2
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(objX, cy - objH);
      ctx.lineTo(cx, cy - objH);
      ctx.lineTo(cx + f * 2, cy + objH);
      ctx.stroke();

      // Central Ray -> Undeviated through Optical Center
      ctx.strokeStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(objX, cy - objH);
      ctx.lineTo(cx, cy);
      ctx.lineTo(cx + objDist, cy + objH);
      ctx.stroke();
    }

    initCoachUI() {
      const mount = document.getElementById('coachModeSelectorMount');
      if (!mount) return;

      mount.innerHTML = `
        <div style="margin-bottom:12px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <label style="margin:0; font-size:10px;">AI COACHING MODE</label>
            <span id="coachModeDescription" style="font-size:10px; color:var(--accent-cyan); font-weight:700;">Instant answer with just enough explanation.</span>
          </div>
          <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:6px;">
          <button type="button" class="coach-mode-pill active" data-mode="quick" onclick="window.InvincibleCoach.setMode('quick')">
  ⚡ Quick
</button>

<button type="button" class="coach-mode-pill" data-mode="hint" onclick="window.InvincibleCoach.setMode('hint')">
  💡 Hint
</button>

<button type="button" class="coach-mode-pill" data-mode="exam" onclick="window.InvincibleCoach.setMode('exam')">
  📝 Exam
</button>

<button type="button" class="coach-mode-pill" data-mode="deepdive" onclick="window.InvincibleCoach.setMode('deepdive')">
  🔬 Deep Dive
</button>
          </div>
        </div>
      `;
    }
  }

  window.InvincibleCoach = new CoachEngine();

})(window);
