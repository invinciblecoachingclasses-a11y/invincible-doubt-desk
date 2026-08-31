/**
 * =====================================================
 * MODULE: RAY OPTICS PREDICTION & DRAWING ENGINE
 * Type: Interactive Vector / Ray Sketchpad
 * Architecture: Micro-Engine Plugin (Touch-Safe & Leak-Proof)
 * =====================================================
 */

window.ReelSimRegistry = window.ReelSimRegistry || {};

class RayDrawEngine {
  constructor(canvas, customParams = {}) {
    this.canvas = canvas;
    this.ctx = canvas ? canvas.getContext('2d') : null;
    this.cardId = canvas ? canvas.getAttribute('data-sim-card-id') : null;
    this.isDestroyed = false;
    this.isVisible = false;

    this.params = {
      incidentAngleDeg: 45, 
      toleranceDeg: 6,       
      ...customParams
    };

    this.userRay = null;
    this.isDrawing = false;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.boundMove = this.handleMove.bind(this);
    this.boundEnd = this.handleEnd.bind(this);

    this.resize();
    this.bindDrawingEvents();

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        this.isVisible = entry.isIntersecting;
        if (this.isVisible) this.render();
      });
    }, { threshold: 0.1 });

    if (this.canvas) this.observer.observe(this.canvas);
    this.render();
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    this.width = Math.max(100, rect.width || 320);
    this.height = Math.max(100, rect.height || 165);

    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    if (this.ctx) this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    this.originX = this.width * 0.5;
    this.originY = this.height * 0.72;
  }

  getPos(e) {
    if (!this.canvas) return { x: 0, y: 0 };
    const rect = this.canvas.getBoundingClientRect();
    const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const clientY = e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }

  bindDrawingEvents() {
    if (!this.canvas) return;
    this.canvas.style.touchAction = 'none'; // Keeps gesture strictly isolated to this canvas

    this.canvas.addEventListener('pointerdown', (e) => {
      if (this.isDestroyed || (this.userRay && this.userRay.isSubmitted)) return;
      this.isDrawing = true;
      try { this.canvas.setPointerCapture(e.pointerId); } catch(err){}
      this.handleMove(e);
    });

    this.canvas.addEventListener('pointermove', this.boundMove);
    this.canvas.addEventListener('pointerup', this.boundEnd);
    this.canvas.addEventListener('pointercancel', this.boundEnd);
  }

  handleMove(e) {
    if (!this.isDrawing || this.isDestroyed || !this.canvas) return;

    const pos = this.getPos(e);
    const dx = pos.x - this.originX;
    const dy = pos.y - this.originY;

    let drawnAngle = Math.atan2(dx, -dy) * (180 / Math.PI);
    if (drawnAngle < 0) drawnAngle += 360;

    this.userRay = {
      endX: pos.x,
      endY: pos.y,
      angleDeg: Math.round(drawnAngle),
      isSubmitted: false
    };

    this.render();
    this.updateAngleHUD(this.userRay.angleDeg);
  }

  handleEnd(e) {
    if (!this.isDrawing || this.isDestroyed) return;
    this.isDrawing = false;
    if (e && e.pointerId && this.canvas) {
      try { this.canvas.releasePointerCapture(e.pointerId); } catch(err){}
    }
    if (this.userRay) {
      this.verifyPrediction();
    }
  }

  updateAngleHUD(deg) {
    const hud = document.getElementById(`angleReadout_${this.cardId}`);
    if (hud) {
      hud.innerText = `θ_drawn = ${deg}°`;
    }
  }

  verifyPrediction() {
    if (!this.userRay) return;
    const expectedAngle = this.params.incidentAngleDeg;
    const error = Math.abs(this.userRay.angleDeg - expectedAngle);
    const isCorrect = error <= this.params.toleranceDeg;

    this.userRay.isSubmitted = true;
    this.render();

    if (window.handleDrawReelAnswer) {
      window.handleDrawReelAnswer(this.cardId, isCorrect, this.userRay.angleDeg, expectedAngle);
    }
  }

  render() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    if (!ctx || this.isDestroyed || w === 0 || h === 0) return;

    ctx.fillStyle = '#05070D';
    ctx.fillRect(0, 0, w, h);

    const ox = this.originX;
    const oy = this.originY;

    // Reflecting plane
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(16, oy);
    ctx.lineTo(w - 16, oy);
    ctx.stroke();

    // Hatching
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let x = 20; x < w - 16; x += 10) {
      ctx.beginPath();
      ctx.moveTo(x, oy);
      ctx.lineTo(x - 6, oy + 8);
      ctx.stroke();
    }

    // Normal line
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(ox, oy - 90);
    ctx.lineTo(ox, oy + 12);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#64748b';
    ctx.font = '9px monospace';
    ctx.fillText('Normal (N)', ox + 6, oy - 70);

    // Incident Beam
    const incRad = (this.params.incidentAngleDeg * Math.PI) / 180;
    const rayLength = 75;
    const sourceX = ox - Math.sin(incRad) * rayLength;
    const sourceY = oy - Math.cos(incRad) * rayLength;

    ctx.strokeStyle = '#ff007f';
    ctx.shadowColor = 'rgba(255, 0, 127, 0.5)';
    ctx.shadowBlur = 8;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(sourceX, sourceY);
    ctx.lineTo(ox, oy);
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#00f3ff';
    ctx.beginPath();
    ctx.arc(ox, oy, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Drawn Ray
    if (this.userRay) {
      const isCorrect = this.userRay.isSubmitted && Math.abs(this.userRay.angleDeg - this.params.incidentAngleDeg) <= this.params.toleranceDeg;
      const rayColor = !this.userRay.isSubmitted ? '#00f3ff' : (isCorrect ? '#10b981' : '#f43f5e');

      ctx.strokeStyle = rayColor;
      ctx.shadowColor = rayColor;
      ctx.shadowBlur = 10;
      ctx.lineWidth = 2.5;

      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.lineTo(this.userRay.endX, this.userRay.endY);
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.strokeStyle = rayColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(this.userRay.endX, this.userRay.endY, 7, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  destroy() {
    this.isDestroyed = true;
    this.isDrawing = false;
    if (this.canvas) {
      this.canvas.removeEventListener('pointermove', this.boundMove);
      this.canvas.removeEventListener('pointerup', this.boundEnd);
      this.canvas.removeEventListener('pointercancel', this.boundEnd);
      if (this.observer) this.observer.unobserve(this.canvas);
    }
    this.canvas = null;
    this.ctx = null;
    this.userRay = null;
  }
}

window.ReelSimRegistry['phy_ray_draw'] = RayDrawEngine;
