/**
 * =====================================================
 * MODULE: ELECTRICAL BREADBOARD & CIRCUIT PATH ENGINE
 * Subject: Class 10/12 Physics (Current Electricity)
 * Architecture: Interactive Nodal Circuit with Kinetic Current Flow
 * =====================================================
 */

window.ReelSimRegistry = window.ReelSimRegistry || {};

class PhyCircuitsEngine {
  constructor(canvas, customParams = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.cardId = canvas.getAttribute('data-sim-card-id');
    this.isDestroyed = false;

    this.params = {
      voltage: 12,        // Volts
      resistorValue: 4,   // Ohms
      targetCurrent: 3,   // 12V / 4Ω = 3A
      ...customParams
    };

    this.switchClosed = false;
    this.currentAmps = 0;
    this.particles = [];
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.resize();
    this.initElectrons();
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

  initElectrons() {
    this.particles = [];
    for (let i = 0; i < 20; i++) {
      this.particles.push({
        progress: i / 20 // 0.0 to 1.0 along the rectangular circuit perimeter
      });
    }
  }

  toggleSwitch() {
    this.switchClosed = !this.switchClosed;
    this.currentAmps = this.switchClosed ? (this.params.voltage / this.params.resistorValue) : 0;

    if (this.switchClosed) {
      if (typeof playDing === 'function') playDing();
      if (typeof triggerHaptic === 'function') triggerHaptic([25, 45]);
      if (typeof confetti === 'function') confetti({ particleCount: 35, spread: 45, origin: { y: 0.7 } });

      if (window.handleDrawReelAnswer) {
        window.handleDrawReelAnswer(
          this.cardId,
          true,
          `${this.currentAmps.toFixed(1)} A`,
          `${this.params.targetCurrent} A`
        );
      }
    } else {
      if (typeof playBuzz === 'function') playBuzz();
      if (typeof triggerHaptic === 'function') triggerHaptic([50]);
    }
  }

  getTelemetry() {
    return {
      fringeWidthMM: this.currentAmps
    };
  }

  getCircuitPoint(t, padX, padY, loopW, loopH) {
    // Maps progress t (0 -> 1) clockwise around the rectangular circuit loop
    const topW = loopW;
    const rightH = loopH;
    const bottomW = loopW;
    const leftH = loopH;
    const totalP = 2 * (loopW + loopH);
    const dist = (t % 1) * totalP;

    if (dist < topW) {
      return { x: padX + dist, y: padY };
    } else if (dist < topW + rightH) {
      return { x: padX + loopW, y: padY + (dist - topW) };
    } else if (dist < topW + rightH + bottomW) {
      return { x: padX + loopW - (dist - topW - rightH), y: padY + loopH };
    } else {
      return { x: padX, y: padY + loopH - (dist - topW - rightH - bottomW) };
    }
  }

  render() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    if (!ctx || w === 0 || h === 0) return;

    ctx.clearRect(0, 0, w, h);

    const padX = 35;
    const padY = 30;
    const loopW = w - 70;
    const loopH = h - 60;

    // 1. CONDUCTIVE CIRCUIT TRACES
    ctx.beginPath();
    ctx.rect(padX, padY, loopW, loopH);
    ctx.strokeStyle = this.switchClosed ? '#00e5ff' : 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2.5;
    if (this.switchClosed) {
      ctx.shadowColor = '#00e5ff';
      ctx.shadowBlur = 10;
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // 2. DC BATTERY SOURCE (Left Rail)
    const batY = padY + loopH / 2;
    ctx.fillStyle = '#020617';
    ctx.fillRect(padX - 8, batY - 18, 16, 36);

    // Long line (+)
    ctx.beginPath();
    ctx.moveTo(padX - 12, batY - 6);
    ctx.lineTo(padX + 12, batY - 6);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Short thick line (-)
    ctx.beginPath();
    ctx.moveTo(padX - 6, batY + 6);
    ctx.lineTo(padX + 6, batY + 6);
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 8.5px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`${this.params.voltage}V`, padX - 16, batY + 4);

    // 3. FIXED RESISTOR (Top Rail)
    const resX = padX + loopW / 2;
    ctx.fillStyle = '#020617';
    ctx.fillRect(resX - 22, padY - 8, 44, 16);

    ctx.beginPath();
    ctx.moveTo(resX - 20, padY);
    ctx.lineTo(resX - 12, padY - 6);
    ctx.lineTo(resX - 4, padY + 6);
    ctx.lineTo(resX + 4, padY - 6);
    ctx.lineTo(resX + 12, padY + 6);
    ctx.lineTo(resX + 20, padY);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`R = ${this.params.resistorValue}Ω`, resX, padY - 12);

    // 4. LOAD BULB (Right Rail)
    const bulbY = padY + loopH / 2;
    const bulbX = padX + loopW;
    ctx.fillStyle = '#020617';
    ctx.fillRect(bulbX - 12, bulbY - 12, 24, 24);

    ctx.beginPath();
    ctx.arc(bulbX, bulbY, 11, 0, Math.PI * 2);
    ctx.fillStyle = this.switchClosed ? 'rgba(250, 204, 21, 0.35)' : 'rgba(255, 255, 255, 0.05)';
    ctx.strokeStyle = this.switchClosed ? '#facc15' : 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1.5;
    if (this.switchClosed) {
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 18;
    }
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Filament cross
    ctx.beginPath();
    ctx.moveTo(bulbX - 4, bulbY - 4);
    ctx.lineTo(bulbX + 4, bulbY + 4);
    ctx.moveTo(bulbX + 4, bulbY - 4);
    ctx.lineTo(bulbX - 4, bulbY + 4);
    ctx.strokeStyle = this.switchClosed ? '#fff' : '#64748b';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 5. INTERACTIVE KNIFE SWITCH (Bottom Rail)
    const swX = padX + loopW / 2;
    const swY = padY + loopH;
    ctx.fillStyle = '#020617';
    ctx.fillRect(swX - 18, swY - 8, 36, 16);

    // Left terminal node
    ctx.beginPath();
    ctx.arc(swX - 12, swY, 3, 0, Math.PI * 2);
    ctx.arc(swX + 12, swY, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#00e5ff';
    ctx.fill();

    // Switch Blade Lever
    ctx.beginPath();
    ctx.moveTo(swX - 12, swY);
    if (this.switchClosed) {
      ctx.lineTo(swX + 12, swY);
      ctx.strokeStyle = '#10b981';
    } else {
      ctx.lineTo(swX + 8, swY - 14);
      ctx.strokeStyle = '#f43f5e';
    }
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = this.switchClosed ? '#10b981' : '#f43f5e';
    ctx.font = 'bold 8.5px "Space Grotesk", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(this.switchClosed ? 'SWITCH CLOSED (ON)' : 'SWITCH OPEN (OFF)', swX, swY + 16);

    // 6. ELECTRON DRIFT CURRENT PARTICLES
    if (this.switchClosed) {
      for (let p of this.particles) {
        p.progress += 0.0055;
        const pt = this.getCircuitPoint(p.progress, padX, padY, loopW, loopH);

        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.shadowColor = '#00e5ff';
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;
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

window.ReelSimRegistry['phy_circuits'] = PhyCircuitsEngine;

window.toggleCircuitSwitch = function(cardId) {
  const instance = window.activeSimInstances ? window.activeSimInstances[cardId] : null;
  if (instance && instance.toggleSwitch) {
    instance.toggleSwitch();
  }
};
