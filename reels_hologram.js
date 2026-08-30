/**
 * =====================================================
 * MODULE: 3D HOLOGRAPHIC TILT & SPECULAR GLARE ENGINE
 * Architecture: iOS Safari Safe Non-Clipping 3D Foil Engine
 * =====================================================
 */

(function() {
  // 1. Inject Holographic Foil & Glare CSS Styles (iOS Safe)
  const styleEl = document.createElement('style');
  styleEl.id = 'holoEngineStyles';
  styleEl.innerHTML = `
    .study-reels-container {
      perspective: 1000px !important;
    }
    .virtual-reel-slot {
      perspective: 1000px !important;
    }
    .reel-card-inner {
      position: relative;
      will-change: transform;
      transition: transform 0.15s cubic-bezier(0.2, 0.8, 0.2, 1);
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7), 0 0 30px rgba(0, 243, 255, 0.08) !important;
    }
    .holo-glare-surface {
      position: absolute;
      inset: 0;
      border-radius: inherit;
      pointer-events: none;
      z-index: 15;
      mix-blend-mode: overlay;
      opacity: 0;
      transition: opacity 0.3s ease;
      background: radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.45) 0%, rgba(0, 243, 255, 0.2) 35%, transparent 70%);
    }
    .holo-prism-foil {
      position: absolute;
      inset: 0;
      border-radius: inherit;
      pointer-events: none;
      z-index: 14;
      mix-blend-mode: color-dodge;
      opacity: 0.35;
      background: linear-gradient(
        125deg,
        rgba(255, 0, 128, 0) 0%,
        rgba(0, 243, 255, 0.15) 30%,
        rgba(255, 220, 0, 0.18) 50%,
        rgba(255, 0, 128, 0.15) 70%,
        rgba(0, 243, 255, 0) 100%
      );
      background-size: 250% 250%;
      background-position: 50% 50%;
      transition: background-position 0.15s ease, opacity 0.3s ease;
    }
    /* Fake parallax using scale instead of translateZ to avoid iOS Safari black screen */
    .holo-depth-content {
      transform: scale(1.02);
      transition: transform 0.2s ease;
    }
  `;
  document.head.appendChild(styleEl);

  class HolographicTiltEngine {
    constructor() {
      this.maxTiltDeg = 11;
      this.currentCard = null;
      this.glareEl = null;
      this.foilEl = null;
      this.isGyroActive = false;
      this.rafId = null;

      this.targetRx = 0;
      this.targetRy = 0;
      this.currentRx = 0;
      this.currentRy = 0;
      this.targetPx = 50;
      this.targetPy = 50;
      this.currentPx = 50;
      this.currentPy = 50;

      this.init();
    }

    init() {
      this.bindTouchPhysics();
      this.bindGyroscope();
      this.startRenderLoop();
    }

    attachToCard(cardEl) {
      if (!cardEl || cardEl.querySelector('.holo-glare-surface')) return;

      const glare = document.createElement('div');
      glare.className = 'holo-glare-surface';

      const foil = document.createElement('div');
      foil.className = 'holo-prism-foil';

      cardEl.appendChild(glare);
      cardEl.appendChild(foil);

      // Elevate text title and interactive HUD with safe 2D scaling
      const innerContainers = cardEl.querySelectorAll('.reel-q-title, .reel-options-grid, .build-matrix, canvas, .subject-ambient-visual');
      innerContainers.forEach(el => el.classList.add('holo-depth-content'));
    }

    bindTouchPhysics() {
      const container = document.getElementById('studyReelsDeck');
      if (!container) return;

      const onPointerMove = (e) => {
        const card = container.querySelector('.virtual-reel-slot[data-index] .reel-card-inner');
        if (!card) return;

        this.attachToCard(card);
        this.currentCard = card;
        this.glareEl = card.querySelector('.holo-glare-surface');
        this.foilEl = card.querySelector('.holo-prism-foil');

        const rect = card.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
          this.resetTilt();
          return;
        }

        const normX = ((clientX - rect.left) / rect.width - 0.5) * 2;
        const normY = ((clientY - rect.top) / rect.height - 0.5) * 2;

        this.targetRy = normX * this.maxTiltDeg;
        this.targetRx = -normY * this.maxTiltDeg;

        this.targetPx = ((clientX - rect.left) / rect.width) * 100;
        this.targetPy = ((clientY - rect.top) / rect.height) * 100;

        if (this.glareEl) this.glareEl.style.opacity = '1';
        if (this.foilEl) this.foilEl.style.opacity = '0.7';
      };

      const onPointerEnd = () => {
        this.resetTilt();
      };

      container.addEventListener('mousemove', onPointerMove, { passive: true });
      container.addEventListener('touchmove', onPointerMove, { passive: true });
      container.addEventListener('mouseleave', onPointerEnd);
      container.addEventListener('touchend', onPointerEnd);
    }

    bindGyroscope() {
      if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission !== 'function') {
        window.addEventListener('deviceorientation', (e) => {
          if (!e.gamma || !e.beta) return;
          this.isGyroActive = true;

          const card = document.querySelector('.virtual-reel-slot[data-index] .reel-card-inner');
          if (!card) return;

          this.attachToCard(card);
          this.currentCard = card;
          this.glareEl = card.querySelector('.holo-glare-surface');
          this.foilEl = card.querySelector('.holo-prism-foil');

          // Gamma is left/right [-90, 90], Beta is front/back [-180, 180]
          const normGamma = Math.max(-1, Math.min(1, e.gamma / 30));
          const normBeta = Math.max(-1, Math.min(1, (e.beta - 45) / 30));

          this.targetRy = normGamma * this.maxTiltDeg;
          this.targetRx = -normBeta * this.maxTiltDeg;

          this.targetPx = 50 + normGamma * 40;
          this.targetPy = 50 + normBeta * 40;

          if (this.glareEl) this.glareEl.style.opacity = '0.85';
          if (this.foilEl) this.foilEl.style.opacity = '0.55';
        }, { passive: true });
      }
    }

    resetTilt() {
      this.targetRx = 0;
      this.targetRy = 0;
      this.targetPx = 50;
      this.targetPy = 50;

      if (this.glareEl) this.glareEl.style.opacity = '0';
      if (this.foilEl) this.foilEl.style.opacity = '0.35';
    }

    startRenderLoop() {
      const render = () => {
        // Interpolation smoothing (LERP)
        this.currentRx += (this.targetRx - this.currentRx) * 0.14;
        this.currentRy += (this.targetRy - this.currentRy) * 0.14;
        this.currentPx += (this.targetPx - this.currentPx) * 0.14;
        this.currentPy += (this.targetPy - this.currentPy) * 0.14;

        if (this.currentCard) {
          // iOS Safe Rotation (No Z-Translation on the card inner)
          this.currentCard.style.transform = `rotateX(${this.currentRx.toFixed(2)}deg) rotateY(${this.currentRy.toFixed(2)}deg)`;

          if (this.glareEl) {
            this.glareEl.style.background = `radial-gradient(circle at ${this.currentPx.toFixed(1)}% ${this.currentPy.toFixed(1)}%, rgba(255, 255, 255, 0.45) 0%, rgba(0, 243, 255, 0.22) 30%, transparent 70%)`;
          }

          if (this.foilEl) {
            this.foilEl.style.backgroundPosition = `${(this.currentPx * 1.5).toFixed(1)}% ${(this.currentPy * 1.5).toFixed(1)}%`;
          }
        }

        this.rafId = requestAnimationFrame(render);
      };
      render();
    }
  }

  // Initialize once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.HoloTiltEngine = new HolographicTiltEngine(); });
  } else {
    window.HoloTiltEngine = new HolographicTiltEngine();
  }
})();
