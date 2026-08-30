/**
 * =====================================================
 * MODULE: BIOLOGY ANATOMICAL TAP-TARGET ENGINE
 * Subject: Biology (Circulatory System / Life Processes)
 * Architecture: Canvas Particle & Target Hit Engine
 * =====================================================
 */

window.ReelSimRegistry = window.ReelSimRegistry || {};

class BioHeartEngine {
  constructor(canvas, customParams = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.cardId = canvas.getAttribute('data-sim-card-id');
    this.isDestroyed = false;

    this.params = {
      targetId: 'left_ventricle', // Default target chamber
      targetLabel: 'Left Ventricle',
      ...customParams
    };

    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.pulseAngle = 0;
    this.selectedRegion = null;
    this.isSubmitted = false;

    // Define Heart Anatomical Regions (Relative percentages of canvas width/height)
    this.regions = [
      { id: 'right_atrium', name: 'Right Atrium', x: 0.32, y: 0.38, r: 24, type: 'deoxygenated' },
      { id: 'right_ventricle', name: 'Right Ventricle', x: 0.38, y: 0.65, r: 28, type: 'deoxygenated' },
      { id: 'left_atrium', name: 'Left Atrium', x: 0.68, y: 0.38, r: 24, type: 'oxygenated' },
      { id: 'left_ventricle', name: 'Left Ventricle', x: 0.62, y: 0.68, r: 30, type: 'oxygenated' },
      { id: 'aorta', name: 'Aorta Arch', x: 0.50, y: 0.18, r: 20, type: 'oxygenated' }
    ];

    this.resize();
    this.bindTapEvents();
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

  bindTapEvents() {
    const handleTap = (e) => {
      if (this.isSubmitted) return;
      const rect = this.canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      const clickX = (clientX - rect.left);
      const clickY = (clientY - rect.top);

      // Check collision with anatomical nodes
      for (let reg of this.regions) {
        const rx = reg.x * this.width;
        const ry = reg.y * this.height;
        const dist = Math.hypot(clickX - rx, clickY - ry);

        if (dist <= reg.r + 10) {
          this.selectedRegion = reg;
          this.verifyTap();
          break;
        }
      }
    };

    this.canvas.addEventListener('pointerdown', handleTap);
  }

  verifyTap() {
    if (!this.selectedRegion) return;
    this.isSubmitted = true;

    const isCorrect = this.selectedRegion.id === this.params.targetId;

    if (window.handleDrawReelAnswer) {
      window.handleDrawReelAnswer(
        this.cardId,
        isCorrect,
        this.selectedRegion.name,
        this.params.targetLabel
      );
    }
  }

  render() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    if (!ctx || w === 0 || h === 0) return;

    ctx.clearRect(0, 0, w, h);

    this.pulseAngle += 0.05;
    const heartScale = 1 + Math.sin(this.pulseAngle) * 0.03;

    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.scale(heartScale, heartScale);
    ctx.translate(-w / 2, -h / 2);

    // 1. ANATOMICAL HEART SILHOUETTE
    ctx.beginPath();
    ctx.moveTo(w * 0.5, h * 0.85);
    ctx.bezierCurveTo(w * 0.2, h * 0.7, w * 0.15, h * 0.35, w * 0.35, h * 0.25);
    ctx.bezierCurveTo(w * 0.45, h * 0.2, w * 0.5, h * 0.3, w * 0.5, h * 0.35);
    ctx.bezierCurveTo(w * 0.5, h * 0.3, w * 0.55, h * 0.2, w * 0.65, h * 0.25);
    ctx.bezierCurveTo(w * 0.85, h * 0.35, w * 0.8, h * 0.7, w * 0.5, h * 0.85);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 2. SEPTUM DIVISION LINE
    ctx.beginPath();
    ctx.moveTo(w * 0.5, h * 0.32);
    ctx.lineTo(w * 0.5, h * 0.82);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 3;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    // 3. INTERACTIVE CHAMBER TARGET NODES
    for (let reg of this.regions) {
      const rx = reg.x * w;
      const ry = reg.y * h;
      const isSelected = this.selectedRegion && this.selectedRegion.id === reg.id;
      const isTarget = reg.id === this.params.targetId;

      let fillColor = reg.type === 'oxygenated' ? 'rgba(244, 63, 94, 0.25)' : 'rgba(0, 229, 255, 0.25)';
      let strokeColor = reg.type === 'oxygenated' ? '#f43f5e' : '#00e5ff';

      if (this.isSubmitted && isSelected) {
        fillColor = isTarget ? 'rgba(16, 185, 129, 0.6)' : 'rgba(244, 63, 94, 0.6)';
        strokeColor = isTarget ? '#10b981' : '#f43f5e';
      }

      ctx.beginPath();
      ctx.arc(rx, ry, reg.r, 0, Math.PI * 2);
      ctx.fillStyle = fillColor;
      ctx.fill();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = isSelected ? 2.5 : 1;
      ctx.stroke();

      // Pulsing Center Dot
      ctx.beginPath();
      ctx.arc(rx, ry, 4, 0, Math.PI * 2);
      ctx.fillStyle = strokeColor;
      ctx.shadowColor = strokeColor;
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Chamber Labels
      ctx.fillStyle = '#fff';
      ctx.font = '8.5px "Space Grotesk", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(reg.name, rx, ry + reg.r + 11);
    }

    ctx.restore();
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

window.ReelSimRegistry['bio_heart'] = BioHeartEngine;
