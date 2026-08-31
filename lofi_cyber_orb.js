/**
 * =====================================================
 * MODULE: KINETIC CYBER-ORB & BINAURAL LO-FI SYNTHESIZER
 * Architecture: Web Audio Synth + Generative 3D Wireframe Mesh
 * Modes: 40Hz Gamma Focus, 432Hz Alpha Calm, Deep Cosmic Brown
 * =====================================================
 */

(function() {
  // 1. Inject Visualizer Modal & Floating Orb Styles
  const styleEl = document.createElement('style');
  styleEl.id = 'cyberOrbStyles';
  styleEl.innerHTML = `
    .cyber-orb-modal {
      position: fixed;
      inset: 0;
      z-index: 100005;
      background: rgba(3, 7, 18, 0.88);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      padding: 24px;
      box-sizing: border-box;
    }
    .cyber-orb-modal.active {
      opacity: 1;
      pointer-events: auto;
    }
    .cyber-orb-card {
      position: relative;
      width: min(380px, 92vw);
      background: rgba(15, 23, 42, 0.7);
      border: 1px solid rgba(0, 243, 255, 0.25);
      border-radius: 28px;
      padding: 24px 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      box-shadow: 0 24px 80px rgba(0, 0, 0, 0.8), 0 0 40px rgba(0, 243, 255, 0.1);
    }
    .cyber-orb-btn-active {
      animation: lofiPulseGlow 2s infinite ease-in-out;
      color: var(--accent-cyan, #00f3ff) !important;
    }
    @keyframes lofiPulseGlow {
      0%, 100% { text-shadow: 0 0 4px #00f3ff; transform: scale(1); }
      50% { text-shadow: 0 0 14px #00f3ff; transform: scale(1.15); }
    }
  `;
  document.head.appendChild(styleEl);

  class CyberOrbEngine {
    constructor() {
      this.audioCtx = null;
      this.isPlaying = false;
      this.currentMode = 0; // 0: 40Hz Gamma Focus, 1: 432Hz Alpha, 2: Cosmic Brown
      this.modes = [
        { name: "⚡ 40Hz Gamma Focus", baseFreq: 196, beatFreq: 40, color: "#00f3ff", desc: "High-Cognition Problem Solving" },
        { name: "✨ 432Hz Alpha Calm", baseFreq: 216, beatFreq: 10, color: "#c084fc", desc: "Long-Term Memory Retention" },
        { name: "🌌 Deep Cosmic Sub", baseFreq: 110, beatFreq: 4, color: "#f59e0b", desc: "Exam Anxiety Calming Field" }
      ];

      this.nodes = { leftOsc: null, rightOsc: null, merger: null, filter: null, masterGain: null };
      this.rotation = 0;
      this.orbCanvas = null;
      this.orbCtx = null;
      this.rafId = null;

      this.init();
    }

    init() {
      this.buildModalDOM();
      this.bindHUDTrigger();
    }

    buildModalDOM() {
      const modal = document.createElement('div');
      modal.id = 'cyberOrbModal';
      modal.className = 'cyber-orb-modal';
      modal.innerHTML = `
        <div class="cyber-orb-card" onclick="event.stopPropagation()">
          <div style="display:flex; justify-content:space-between; width:100%; align-items:center; margin-bottom:12px;">
            <div style="font-family:'Space Grotesk',sans-serif; font-size:16px; font-weight:900; color:#fff;">🎧 NEURAL LO-FI ENGINE</div>
            <button type="button" id="closeCyberOrbBtn" style="background:rgba(255,255,255,0.08); border:none; color:#94a3b8; border-radius:50%; width:28px; height:28px; cursor:pointer;">✕</button>
          </div>

          <div style="position:relative; width:220px; height:220px; margin-bottom:16px; display:flex; align-items:center; justify-content:center;">
            <canvas id="cyberOrbCanvas" width="220" height="220" style="width:220px; height:220px; border-radius:50%;"></canvas>
          </div>

          <div id="orbModeTitle" style="font-family:'Space Grotesk',sans-serif; font-size:16px; font-weight:800; color:#00f3ff; margin-bottom:4px;">⚡ 40Hz Gamma Focus</div>
          <div id="orbModeDesc" style="font-size:11px; color:#94a3b8; font-weight:700; margin-bottom:20px; text-align:center;">High-Cognition Problem Solving</div>

          <div style="display:flex; gap:8px; width:100%; margin-bottom:14px;">
            <button type="button" id="btnCycleOrbMode" style="flex:1; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:#fff; font-size:12px; font-weight:800; padding:12px; border-radius:14px; cursor:pointer;">🔄 Switch Neural Wave</button>
            <button type="button" id="btnToggleOrbSound" class="solid-cta" style="flex:1; padding:12px !important;">START BEATS ▶</button>
          </div>
          
          <div style="font-size:10px; color:#64748b; font-weight:700;">Use headphones for full stereo binaural pulse</div>
        </div>
      `;

      document.body.appendChild(modal);

      this.orbCanvas = document.getElementById('cyberOrbCanvas');
      this.orbCtx = this.orbCanvas.getContext('2d');

      // Bind Modal Buttons
      document.getElementById('closeCyberOrbBtn').onclick = () => this.toggleModal(false);
      modal.onclick = (e) => { if (e.target === modal) this.toggleModal(false); };
      document.getElementById('btnToggleOrbSound').onclick = () => this.toggleAudioPlayback();
      document.getElementById('btnCycleOrbMode').onclick = () => this.cycleMode();
    }

    bindHUDTrigger() {
      const hudBtn = document.getElementById('lofiToggleBtn');
      if (hudBtn) {
        hudBtn.onclick = (e) => {
          e.preventDefault();
          this.toggleModal(true);
        };
      }
    }

    toggleModal(show) {
      const modal = document.getElementById('cyberOrbModal');
      if (!modal) return;
      if (show) {
        modal.classList.add('active');
        if (!this.rafId) this.startVisualizer();
      } else {
        modal.classList.remove('active');
        if (!this.isPlaying && this.rafId) {
          cancelAnimationFrame(this.rafId);
          this.rafId = null;
        }
      }
    }

      initAudioContext() {
    if (!window._sharedAudioCtx) {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) {
        window._sharedAudioCtx = new AudioCtxClass();
      }
    }
    this.audioCtx = window._sharedAudioCtx;
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }


    startBinauralSynth() {
      this.initAudioContext();
      const ctx = this.audioCtx;
      const mode = this.modes[this.currentMode];

      // Left Channel Osc
      const leftOsc = ctx.createOscillator();
      leftOsc.type = 'sine';
      leftOsc.frequency.setValueAtTime(mode.baseFreq, ctx.currentTime);

      // Right Channel Osc (Shifted by Beat Frequency)
      const rightOsc = ctx.createOscillator();
      rightOsc.type = 'sine';
      rightOsc.frequency.setValueAtTime(mode.baseFreq + mode.beatFreq, ctx.currentTime);

      // Stereo Panners
      const leftPanner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      const rightPanner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      if (leftPanner) leftPanner.pan.value = -1;
      if (rightPanner) rightPanner.pan.value = 1;

      // Warm Lofi Lowpass Filter
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, ctx.currentTime);

      // Master Gain Soft Fade-in
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.001, ctx.currentTime);
      masterGain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 1.2);

      // Routing
      if (leftPanner && rightPanner) {
        leftOsc.connect(leftPanner).connect(filter);
        rightOsc.connect(rightPanner).connect(filter);
      } else {
        leftOsc.connect(filter);
        rightOsc.connect(filter);
      }
      filter.connect(masterGain).connect(ctx.destination);

      leftOsc.start();
      rightOsc.start();

      this.nodes = { leftOsc, rightOsc, filter, masterGain };
      this.isPlaying = true;
      this.updateHUDIcon(true);
    }

    stopBinauralSynth() {
      if (!this.isPlaying || !this.nodes.masterGain) return;
      const ctx = this.audioCtx;
      this.nodes.masterGain.gain.setValueAtTime(this.nodes.masterGain.gain.value, ctx.currentTime);
      this.nodes.masterGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

      setTimeout(() => {
        try {
          if (this.nodes.leftOsc) this.nodes.leftOsc.stop();
          if (this.nodes.rightOsc) this.nodes.rightOsc.stop();
        } catch(e) {}
        this.isPlaying = false;
        this.updateHUDIcon(false);
      }, 500);
    }

    toggleAudioPlayback() {
      const btn = document.getElementById('btnToggleOrbSound');
      if (this.isPlaying) {
        this.stopBinauralSynth();
        if (btn) {
          btn.innerText = "START BEATS ▶";
          btn.style.background = "var(--accent-cyan)";
          btn.style.color = "#000";
        }
      } else {
        this.startBinauralSynth();
        if (btn) {
          btn.innerText = "PAUSE BEATS ⏸";
          btn.style.background = "rgba(244,63,94,0.15)";
          btn.style.color = "#f43f5e";
          btn.style.border = "1px solid #f43f5e";
        }
      }
    }

    cycleMode() {
      this.currentMode = (this.currentMode + 1) % this.modes.length;
      const mode = this.modes[this.currentMode];

      document.getElementById('orbModeTitle').innerText = mode.name;
      document.getElementById('orbModeTitle').style.color = mode.color;
      document.getElementById('orbModeDesc').innerText = mode.desc;

      if (this.isPlaying) {
        this.stopBinauralSynth();
        setTimeout(() => this.startBinauralSynth(), 300);
      }
    }

    updateHUDIcon(isActive) {
      const hudBtn = document.getElementById('lofiToggleBtn');
      if (!hudBtn) return;
      if (isActive) {
        hudBtn.classList.add('cyber-orb-btn-active');
      } else {
        hudBtn.classList.remove('cyber-orb-btn-active');
      }
    }

    startVisualizer() {
      const render = () => {
        const ctx = this.orbCtx;
        if (!ctx) return;

        ctx.clearRect(0, 0, 220, 220);

        const mode = this.modes[this.currentMode];
        const cx = 110, cy = 110;
        const baseRadius = 75;
        this.rotation += this.isPlaying ? 0.022 : 0.008;

        // Draw Multi-Axis Rotating Neon Wireframe Latitudes
        ctx.strokeStyle = mode.color;
        ctx.lineWidth = 1.4;
        ctx.shadowColor = mode.color;
        ctx.shadowBlur = this.isPlaying ? 14 : 4;

        for (let i = -3; i <= 3; i++) {
          const latRadius = Math.sqrt(Math.max(0, 1 - Math.pow(i / 3.5, 2))) * baseRadius;
          const yOffset = (i / 3.5) * baseRadius * Math.cos(this.rotation * 0.4);

          ctx.beginPath();
          ctx.ellipse(cx, cy + yOffset, latRadius, latRadius * 0.35 * Math.sin(this.rotation + i), this.rotation * 0.5, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Draw Core Energy Flare
        ctx.beginPath();
        ctx.arc(cx, cy, this.isPlaying ? (14 + Math.sin(this.rotation * 4) * 4) : 8, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.shadowBlur = 20;
        ctx.fill();
        ctx.shadowBlur = 0;

        this.rafId = requestAnimationFrame(render);
      };
      render();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.CyberOrb = new CyberOrbEngine(); });
  } else {
    window.CyberOrb = new CyberOrbEngine();
  }
})();
