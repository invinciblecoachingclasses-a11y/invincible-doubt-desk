/**
 * =====================================================
 * MODULE: RAY OPTICS PREDICTION & DRAWING ENGINE
 * Type: Interactive Vector / Ray Sketchpad
 * Architecture: Micro-Engine Plugin (DevicePixelRatio Aware)
 * =====================================================
 */

window.ReelSimRegistry = window.ReelSimRegistry || {};

class RayDrawEngine {
  constructor(canvas, customParams = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.cardId = canvas.getAttribute('data-sim-card-id');
    this.isDestroyed = false;

    this.params = {
      incidentAngleDeg: 45, // Target reflection angle
      toleranceDeg: 6,       // Angular error tolerance (±6°)
      ...customParams
    };

    this.userRay = null;
    this.isDrawing = false;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.resize();
    this.bindDrawingEvents();
    this.render();
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    this.width = rect.width || 320;
    this.height = rect.height || 165;

    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.ctx.scale(this.dpr, this.dpr);

    // Anchor origin at the center-bottom reflective surface
    this.originX = this.width * 0.5;
    this.originY = this.height * 0.72;
  }

  bindDrawingEvents() {
    const getPos = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    };

    const startDraw = (e) => {
      if (this.userRay && this.userRay.isSubmitted) return;
      this.isDrawing = true;
      moveDraw(e);
    };

    const moveDraw = (e) => {
      if (!this.isDrawing) return;
      if (e.cancelable) e.preventDefault();

      const pos = getPos(e);
      const dx = pos.x - this.originX;
      const dy = pos.y - this.originY;

      // Calculate angle relative to Normal (Upward normal vector)
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
    };

    const endDraw = () => {
      if (!this.isDrawing) return;
      this.isDrawing = false;
      if (this.userRay) {
        this.verifyPrediction();
      }
    };

    this.canvas.addEventListener('pointerdown', startDraw);
    window.addEventListener('pointermove', moveDraw, { passive: false });
    window.addEventListener('pointerup', endDraw);
  }

  updateAngleHUD(deg) {
    const hud = document.getElementById(`angleReadout_${this.cardId}`);
    if (hud) {
      hud.innerText = `θ_drawn = ${deg}°`;
    }
  }

  verifyPrediction() {
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
    if (!ctx || w === 0 || h === 0) return;

    ctx.clearRect(0, 0, w, h);

    const ox = this.originX;
    const oy = this.originY;

    // --- 1. REFLECTING PLANE / MIRROR ---
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(16, oy);
    ctx.lineTo(w - 16, oy);
    ctx.stroke();

    // Mirror Hatch Lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let x = 20; x < w - 16; x += 10) {
      ctx.beginPath();
      ctx.moveTo(x, oy);
      ctx.lineTo(x - 6, oy + 8);
      ctx.stroke();
    }

    // --- 2. NORMAL LINE (DASHED) ---
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

    // --- 3. INCIDENT LASER BEAM ---
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

    // Point of incidence beacon
    ctx.fillStyle = '#00f3ff';
    ctx.beginPath();
    ctx.arc(ox, oy, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // --- 4. USER DRAWN / SUBMITTED RAY ---
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

      // Pointer Target Ring
      ctx.strokeStyle = rayColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(this.userRay.endX, this.userRay.endY, 7, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  destroy() {
    this.isDestroyed = true;
    this.canvas = null;
    this.ctx = null;
  }
}

// Register into Invincible 360 Plugin Registry
window.ReelSimRegistry['phy_ray_draw'] = RayDrawEngine;
