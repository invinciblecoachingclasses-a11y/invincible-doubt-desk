/**
 * =====================================================
 * MODULE: ACID-BASE TITRATION & COLORIMETRIC ENGINE
 * Subject: Class 10/11/12 Chemistry (Acids, Bases & Salts / Equilibrium)
 * Architecture: Kinetic Drop Dispenser & pH Color Transition Simulator
 * =====================================================
 */

window.ReelSimRegistry = window.ReelSimRegistry || {};

class ChemTitrationEngine {
  constructor(canvas, customParams = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.cardId = canvas.getAttribute('data-sim-card-id');
    this.isDestroyed = false;

    this.params = {
      targetDrops: 8,       // Exact equivalence point
      titrantName: "0.1M NaOH",
      analyteName: "0.1M HCl + Phenolphthalein",
      ...customParams
    };

    this.dropsAdded = 0;
    this.fallingDrops = [];
    this.isSubmitted = false;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.resize();
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
  }

  addDrop() {
    if (this.isSubmitted) return;

    this.dropsAdded++;
    this.fallingDrops.push({
      x: this.width * 0.5,
      y: 42,
      vy: 3.5
    });

    if (typeof triggerHaptic === 'function') triggerHaptic([15]);

    // Check equivalence point
    if (this.dropsAdded === this.params.targetDrops) {
      this.isSubmitted = true;
      if (typeof playDing === 'function') playDing();
      if (typeof triggerHaptic === 'function') triggerHaptic([30, 50]);
      if (typeof confetti === 'function') confetti({ particleCount: 40, spread: 50, origin: { y: 0.7 } });

      if (window.handleDrawReelAnswer) {
        window.handleDrawReelAnswer(
          this.cardId,
          true,
          `pH 7.0 (Pink Endpoint)`,
          `pH 7.0 (${this.params.targetDrops} Drops)`
        );
      }
    } else if (this.dropsAdded > this.params.targetDrops + 2) {
      this.isSubmitted = true;
      if (typeof playBuzz === 'function') playBuzz();
      if (typeof triggerHaptic === 'function') triggerHaptic([80]);

      if (window.handleDrawReelAnswer) {
        window.handleDrawReelAnswer(
          this.cardId,
          false,
          `pH 11.5 (Over-Titrated)`,
          `pH 7.0 (${this.params.targetDrops} Drops)`
        );
      }
    }
  }

  getFlaskLiquidColor() {
    if (this.dropsAdded < this.params.targetDrops) {
      // Clear acidic solution
      return 'rgba(255, 255, 255, 0.08)';
    } else if (this.dropsAdded === this.params.targetDrops) {
      // Neutral equivalence point: faint persistent pink
      return 'rgba(244, 114, 182, 0.45)';
    } else {
      // Excess base: deep dark magenta
      return 'rgba(219, 39, 119, 0.85)';
    }
  }

  getCurrentPH() {
    if (this.dropsAdded < this.params.targetDrops) {
      const p = 1.0 + (this.dropsAdded / this.params.targetDrops) * 3.5;
      return p.toFixed(1);
    } else if (this.dropsAdded === this.params.targetDrops) {
      return "7.0 (Neutral)";
    } else {
      const p = 7.0 + Math.min(5.5, (this.dropsAdded - this.params.targetDrops) * 1.5);
      return p.toFixed(1);
    }
  }

  render() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    if (!ctx || w === 0 || h === 0) return;

    ctx.clearRect(0, 0, w, h);

    const midX = w * 0.5;

    // 1. BURETTE TIP & NOZZLE
    ctx.beginPath();
    ctx.moveTo(midX - 7, 6);
    ctx.lineTo(midX - 7, 30);
    ctx.lineTo(midX - 2, 40);
    ctx.lineTo(midX + 2, 40);
    ctx.lineTo(midX + 7, 30);
    ctx.lineTo(midX + 7, 6);
    ctx.fillStyle = 'rgba(0, 229, 255, 0.15)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Burette Stopcock valve
    ctx.fillStyle = '#00e5ff';
    ctx.fillRect(midX - 11, 24, 22, 4);

    // 2. FALLING DROPS
    ctx.fillStyle = '#38bdf8';
    for (let i = this.fallingDrops.length - 1; i >= 0; i--) {
      const d = this.fallingDrops[i];
      d.y += d.vy;

      ctx.beginPath();
      ctx.arc(d.x, d.y, 3, 0, Math.PI * 2);
      ctx.fill();

      // Liquid landing into flask
      if (d.y >= h * 0.72) {
        this.fallingDrops.splice(i, 1);
      }
    }

    // 3. CONICAL FLASK OUTLINE
    const flaskTopY = h * 0.58;
    const flaskNeckW = 14;
    const flaskBaseY = h * 0.90;
    const flaskBaseW = 60;

    ctx.beginPath();
    ctx.moveTo(midX - flaskNeckW / 2, flaskTopY);
    ctx.lineTo(midX - flaskNeckW / 2, flaskTopY + 10);
    ctx.lineTo(midX - flaskBaseW / 2, flaskBaseY);
    ctx.lineTo(midX + flaskBaseW / 2, flaskBaseY);
    ctx.lineTo(midX + flaskNeckW / 2, flaskTopY + 10);
    ctx.lineTo(midX + flaskNeckW / 2, flaskTopY);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 4. LIQUID INSIDE FLASK
    ctx.beginPath();
    ctx.moveTo(midX - flaskBaseW * 0.42, flaskBaseY - 2);
    ctx.lineTo(midX - flaskBaseW * 0.35, flaskBaseY - 22);
    ctx.lineTo(midX + flaskBaseW * 0.35, flaskBaseY - 22);
    ctx.lineTo(midX + flaskBaseW * 0.42, flaskBaseY - 2);
    ctx.closePath();
    ctx.fillStyle = this.getFlaskLiquidColor();
    ctx.fill();

    // 5. TELEMETRY READOUTS
    ctx.fillStyle = '#cbd5e1';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Titrant: ${this.params.titrantName}`, 12, 20);
    ctx.fillText(`Drops: ${this.dropsAdded} / ${this.params.targetDrops}`, 12, 34);

    ctx.textAlign = 'right';
    ctx.fillStyle = this.dropsAdded === this.params.targetDrops ? '#10b981' : (this.dropsAdded > this.params.targetDrops ? '#f43f5e' : '#00e5ff');
    ctx.fillText(`pH: ${this.getCurrentPH()}`, w - 12, 20);
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

window.ReelSimRegistry['chem_titration'] = ChemTitrationEngine;

window.dispenseTitrationDrop = function(cardId) {
  const instance = window.activeSimInstances ? window.activeSimInstances[cardId] : null;
  if (instance && instance.addDrop) {
    instance.addDrop();
  }
};
