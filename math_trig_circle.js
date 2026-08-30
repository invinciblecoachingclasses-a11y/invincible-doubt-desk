/**
 * =====================================================
 * MODULE: TRIGONOMETRY UNIT CIRCLE & RADIAN SNAPPER
 * Subject: Class 10/11 Mathematics (Trigonometric Functions)
 * Architecture: Interactive Coordinate Arm & Radian Angle Snapper
 * =====================================================
 */

window.ReelSimRegistry = window.ReelSimRegistry || {};

class MathTrigCircleEngine {
  constructor(canvas, customParams = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.cardId = canvas.getAttribute('data-sim-card-id');
    this.isDestroyed = false;

    this.params = {
      targetAngleDeg: 45, // Target: 45° (π/4 rad)
      toleranceDeg: 4,
      ...customParams
    };

    this.currentAngleDeg = 0;
    this.isDragging = false;
    this.isSubmitted = false;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.resize();
    this.bindEvents();
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

    this.originX = this.width * 0.48;
    this.originY = this.height * 0.52;
    this.radius = Math.min(this.width, this.height) * 0.38;
  }

  bindEvents() {
    const getAngleFromEvent = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      const x = (clientX - rect.left) - this.originX;
      const y = (clientY - rect.top) - this.originY;

      // Invert Y because canvas coordinate Y increases downwards
      let rad = Math.atan2(-y, x);
      if (rad < 0) rad += 2 * Math.PI;

      let deg = rad * (180 / Math.PI);

      // Snap to standard trigonometric angles (0, 30, 45, 60, 90, 120, 135, 150, 180...)
      const snapPoints = [0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330, 360];
      for (let pt of snapPoints) {
        if (Math.abs(deg - pt) <= 5) {
          deg = pt;
          break;
        }
      }

      this.currentAngleDeg = Math.round(deg);
    };

    const handlePointerDown = (e) => {
      if (this.isSubmitted) return;
      this.isDragging = true;
      getAngleFromEvent(e);
      if (typeof triggerHaptic === 'function') triggerHaptic([15]);
    };

    const handlePointerMove = (e) => {
      if (!this.isDragging || this.isSubmitted) return;
      getAngleFromEvent(e);
    };

    const handlePointerUp = () => {
      if (!this.isDragging || this.isSubmitted) return;
      this.isDragging = false;
      this.verifyAngle();
    };

    this.canvas.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
  }

  verifyAngle() {
    const isCorrect = Math.abs(this.currentAngleDeg - this.params.targetAngleDeg) <= this.params.toleranceDeg;

    if (isCorrect) {
      this.isSubmitted = true;
      if (typeof playDing === 'function') playDing();
      if (typeof triggerHaptic === 'function') triggerHaptic([30, 50]);
      if (typeof confetti === 'function') confetti({ particleCount: 40, spread: 50, origin: { y: 0.7 } });

      if (window.handleDrawReelAnswer) {
        window.handleDrawReelAnswer(
          this.cardId,
          true,
          `θ = ${this.currentAngleDeg}° (Locked)`,
          `θ = ${this.params.targetAngleDeg}°`
        );
      }
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
    const r = this.radius;

    const rad = this.currentAngleDeg * (Math.PI / 180);
    const armX = ox + Math.cos(rad) * r;
    const armY = oy - Math.sin(rad) * r;

    // 1. AXIS CROSSHAIR
    ctx.beginPath();
    ctx.moveTo(ox - r - 16, oy);
    ctx.lineTo(ox + r + 16, oy);
    ctx.moveTo(ox, oy - r - 12);
    ctx.lineTo(ox, oy + r + 12);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 2. UNIT CIRCLE
    ctx.beginPath();
    ctx.arc(ox, oy, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.35)';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // 3. RIGHT-TRIANGLE PROJECTION LINES (Cos & Sin)
    // Horizontal cos(θ) leg
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(armX, oy);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Vertical sin(θ) leg
    ctx.beginPath();
    ctx.moveTo(armX, oy);
    ctx.lineTo(armX, armY);
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 3]);
    ctx.stroke();
    ctx.setLineDash([]);

    // 4. RADIAL VECTOR ARM
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(armX, armY);
    ctx.strokeStyle = this.currentAngleDeg === this.params.targetAngleDeg ? '#10b981' : '#00e5ff';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // End-point Handle Node
    ctx.beginPath();
    ctx.arc(armX, armY, 6, 0, Math.PI * 2);
    ctx.fillStyle = this.currentAngleDeg === this.params.targetAngleDeg ? '#10b981' : '#00e5ff';
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;

    // 5. ANGLE ARC
    ctx.beginPath();
    ctx.arc(ox, oy, 20, 0, -rad, true);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 6. READOUT HUD
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 9.5px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`θ = ${this.currentAngleDeg}°`, 12, 20);
    ctx.fillText(`cos θ = ${Math.cos(rad).toFixed(2)}`, 12, 34);
    ctx.fillText(`sin θ = ${Math.sin(rad).toFixed(2)}`, 12, 48);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#f59e0b';
    ctx.fillText(`Target: ${this.params.targetAngleDeg}°`, w - 12, 20);
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

window.ReelSimRegistry['math_trig_circle'] = MathTrigCircleEngine;
