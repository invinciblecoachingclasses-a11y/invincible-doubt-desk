/**
 * =====================================================
 * MODULE: RUTHERFORD ALPHA SCATTERING SIMULATION
 * Subject: Chemistry / Physics (Atomic Structure)
 * Architecture: Kinetic Particle Collision Engine
 * =====================================================
 */

window.ReelSimRegistry = window.ReelSimRegistry || {};

class ChemRutherfordEngine {
  constructor(canvas, customParams = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.cardId = canvas.getAttribute('data-sim-card-id');
    this.isDestroyed = false;

    this.params = {
      nucleusCharge: 79, // Gold nucleus (Z=79)
      beamEnergy: 5,
      ...customParams
    };

    this.particles = [];
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.resize();
    this.initParticles();
    this.loop();
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    this.width = rect.width || 320;
    this.height = rect.height || 165;

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
    } else if (paramId === 'ctrl_energy') {
      this.params.beamEnergy = parseFloat(value);
    }
  }

  getTelemetry() {
    return {
      fringeWidthMM: this.params.nucleusCharge
    };
  }

  render() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    if (!ctx || w === 0 || h === 0) return;

    ctx.fillStyle = 'rgba(2, 6, 23, 0.25)';
    ctx.fillRect(0, 0, w, h);

    const nx = this.nucleusX;
    const ny = this.nucleusY;
    const k = this.params.nucleusCharge * 12;

    // 1. RENDER GOLD NUCLEUS (+Ze)
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

    // 2. SIMULATE & DRAW ALPHA PARTICLES (Coulomb Repulsion)
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      const dx = p.x - nx;
      const dy = p.y - ny;
      const r2 = dx * dx + dy * dy;
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

      // Render Trajectory Tail
      ctx.beginPath();
      for (let j = 0; j < p.history.length; j++) {
        const pt = p.history[j];
        if (j === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      }
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.35)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Render Alpha Particle
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fillStyle = '#00e5ff';
      ctx.fill();

      // Recycle particles leaving the screen
      if (p.x > w + 20 || p.x < -30 || p.y < -30 || p.y > h + 30) {
        this.particles.splice(i, 1);
        this.spawnParticle(false);
      }
    }
  }

  loop() {
    if (this.isDestroyed) return;
    this.render();
    this.animationFrame = requestAnimationFrame(() => this.loop());
  }

  destroy() {
    this.isDestroyed = true;
    if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
    this.canvas = null;
    this.ctx = null;
  }
}

window.ReelSimRegistry['chem_rutherford'] = ChemRutherfordEngine;
