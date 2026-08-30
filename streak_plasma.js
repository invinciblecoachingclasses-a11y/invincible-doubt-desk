/**
 * =====================================================
 * MODULE: STREAK SUPERNOVA & EVOLVING PLASMA FLAME
 * Architecture: Standalone Canvas 2D Particle Synthesis
 * Tiers: Ember Glow (1-3d) -> Arc Reactor (4-7d) -> Supernova (8d+)
 * =====================================================
 */

(function() {
  class StreakPlasmaEngine {
    constructor() {
      this.canvas = null;
      this.ctx = null;
      this.particles = [];
      this.streakCount = parseInt(localStorage.getItem('invincible_reel_streak') || '2', 10);
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.width = 44;
      this.height = 24;

      this.init();
    }

    init() {
      const streakWrapper = document.querySelector('.premium-hud .stats span[style*="accent-rose"]');
      if (!streakWrapper) return;

      streakWrapper.style.position = 'relative';
      streakWrapper.style.display = 'inline-flex';
      streakWrapper.style.alignItems = 'center';
      streakWrapper.style.cursor = 'pointer';

      // Create Canvas Overlay
      this.canvas = document.createElement('canvas');
      this.canvas.style.position = 'absolute';
      this.canvas.style.left = '-12px';
      this.canvas.style.top = '-6px';
      this.canvas.style.width = `${this.width}px`;
      this.canvas.style.height = `${this.height}px`;
      this.canvas.style.pointerEvents = 'none';
      this.canvas.style.zIndex = '1';

      this.canvas.width = this.width * this.dpr;
      this.canvas.height = this.height * this.dpr;

      this.ctx = this.canvas.getContext('2d');
      this.ctx.scale(this.dpr, this.dpr);

      streakWrapper.prepend(this.canvas);

      // Interactive Tap Flare
      streakWrapper.addEventListener('click', () => {
        this.burstParticles(18);
        if (typeof playDing === 'function') playDing();
        if (typeof triggerHaptic === 'function') triggerHaptic([20, 30]);
      });

      // Listen for streak updates
      window.addEventListener('invincible_xp_updated', () => {
        this.streakCount = parseInt(localStorage.getItem('invincible_reel_streak') || '1', 10);
      });

      this.loop();
    }

    getTheme() {
      if (this.streakCount >= 8) {
        return {
          primary: '#c084fc',
          secondary: '#ec4899',
          glow: 'rgba(192, 132, 252, 0.4)',
          spawnRate: 3,
          speed: 1.8
        };
      } else if (this.streakCount >= 4) {
        return {
          primary: '#00f3ff',
          secondary: '#38bdf8',
          glow: 'rgba(0, 243, 255, 0.35)',
          spawnRate: 2,
          speed: 1.4
        };
      } else {
        return {
          primary: '#f59e0b',
          secondary: '#ef4444',
          glow: 'rgba(245, 158, 11, 0.3)',
          spawnRate: 1,
          speed: 1.0
        };
      }
    }

    burstParticles(count = 15) {
      const theme = this.getTheme();
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 2.5 + 1;
        this.particles.push({
          x: 14,
          y: 12,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: Math.random() * 2 + 1,
          alpha: 1,
          color: Math.random() > 0.5 ? theme.primary : theme.secondary
        });
      }
    }

    spawnAmbientParticle() {
      const theme = this.getTheme();
      for (let i = 0; i < theme.spawnRate; i++) {
        this.particles.push({
          x: 12 + (Math.random() * 8 - 4),
          y: 18,
          vx: (Math.random() - 0.5) * 0.8,
          vy: -(Math.random() * theme.speed + 0.8),
          radius: Math.random() * 2 + 0.8,
          alpha: 0.9,
          color: Math.random() > 0.4 ? theme.primary : theme.secondary
        });
      }
    }

    render() {
      const ctx = this.ctx;
      if (!ctx) return;

      ctx.clearRect(0, 0, this.width, this.height);

      const theme = this.getTheme();

      // Ambient Plasma Glow Halo
      const grad = ctx.createRadialGradient(14, 12, 1, 14, 12, 16);
      grad.addColorStop(0, theme.glow);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.width, this.height);

      // Particle physics & rendering
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.035;

        if (p.alpha <= 0) {
          this.particles.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      }
    }

    loop() {
      if (Math.random() > 0.4) {
        this.spawnAmbientParticle();
      }
      this.render();
      requestAnimationFrame(() => this.loop());
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { new StreakPlasmaEngine(); });
  } else {
    new StreakPlasmaEngine();
  }
})();
