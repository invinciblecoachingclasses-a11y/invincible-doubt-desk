/**
 * =====================================================
 * MODULE: RUTHERFORD ALPHA SCATTERING SIMULATION
 * Subject: Chemistry / Physics (Atomic Structure)
 * Architecture: Kinetic Particle Collision Engine (Crash-Proof)
 * =====================================================
 */

window.ReelSimRegistry = window.ReelSimRegistry || {};

class ChemRutherfordEngine {
  constructor(canvas, customParams = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.cardId = canvas.getAttribute('data-sim-card-id');
    this.isDestroyed = false;
    this.isVisible = false;

    this.params = {
      nucleusCharge: 79,
      beamEnergy: 5,
      ...customParams
    };

    this.particles = [];
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.resize();
    this.initParticles();
    
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        this.isVisible = entry.isIntersecting;
        if (this.isVisible && !this.animationFrame) {
          this.loop();
        }
      });
    }, { threshold: 0.1 });
    this.observer.observe(this.canvas);
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    this.width = Math.max(100, rect.width || 320);
    this.height = Math.max(100, rect.height || 165);

    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.ctx.scale(this.dpr, this.dpr);

    this.nucleusX = this.width * 0.55;
    this.nucleusY = this.height * 0.5;
  }

  initParticles() {
    this.particles = [];
    for (let i = 0; i < 28; i++) {
      this.spawnParticle(true);
    }
  }

  spawnParticle(randomizeX = false) {
    this.particles.push({
      x: randomizeX ? Math.random() * this.width * 0.4 : -10,
      y: Math.random() * this.height,
      vx: 3.5 + Math.random() * 1.5,
      vy: 0,
      history: []
    });
  }

  update(paramId, value) {
    if (paramId === 'ctrl_z') {
      this.params.nucleusCharge = parseFloat(value);
    }
  }

  render() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    if (!ctx) return;

    ctx.fillStyle = '#05070D'; // Solid background prevents transparency compounding bugs
    ctx.fillRect(0, 0, w, h);

    const nx = this.nucleusX;
    const ny = this.nucleusY;
    const k = this.params.nucleusCharge * 12;

    ctx.beginPath();
    ctx.arc(nx, ny, 10, 0, Math.PI * 2);
    ctx.fillStyle = '#f59e0b';
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 18;
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#000';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('+79e', nx, ny + 3);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      const dx = p.x - nx;
      const dy = p.y - ny;
      // Prevent division by strictly 0 which poisons the particle array with NaN
      const r2 = Math.max(0.1, dx * dx + dy * dy); 
      const r = Math.sqrt(r2);

      if (r > 8) {
        const force = k / Math.max(r2, 100);
        const fx = (dx / r) * force;
        const fy = (dy / r) * force;

        p.vx += fx * 0.15;
        p.vy += fy * 0.15;
      }

      p.x += p.vx;
      p.y += p.vy;

      p.history.push({ x: p.x, y: p.y });
      if (p.history.length > 8) p.history.shift();

      ctx.beginPath();
      for (let j = 0; j < p.history.length; j++) {
        const pt = p.history[j];
        if (j === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      }
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.35)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fillStyle = '#00e5ff';
      ctx.fill();

      if (p.x > w + 20 || p.x < -30 || p.y < -30 || p.y > h + 30) {
        this.particles.splice(i, 1);
        this.spawnParticle(false);
      }
    }
  }

  loop() {
    if (this.isDestroyed) return;
    if (this.isVisible) this.render();
    
    if (this.isVisible) {
      this.animationFrame = requestAnimationFrame(() => this.loop());
    } else {
      this.animationFrame = null;
    }
  }

  destroy() {
    this.isDestroyed = true;
    this.isVisible = false;
    if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
    if (this.observer && this.canvas) this.observer.unobserve(this.canvas);
    this.canvas = null;
    this.ctx = null;
    this.particles = [];
  }
}

window.ReelSimRegistry['chem_rutherford'] = ChemRutherfordEngine;
