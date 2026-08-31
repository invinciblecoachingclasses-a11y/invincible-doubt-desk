/**
 * =====================================================
 * MODULE: WAVE OPTICS & YOUNG'S DOUBLE-SLIT INTERFERENCE
 * Engine: Canvas2D Micro-Sim Plugin (Crash-Proof Mobile)
 * =====================================================
 */

window.ReelSimRegistry = window.ReelSimRegistry || {};

class WaveOpticsMiniEngine {
  constructor(canvas, customParams = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false }); // Optimize composite
    this.animId = null;
    this.isDestroyed = false;
    this.isVisible = false;

    this.params = {
      wavelength: 532, 
      slitD: 0.25,     
      screenD: 1.2,    
      phase: 0,
      ...customParams
    };

    this.dpr = Math.min(window.devicePixelRatio || 1, 2); 
    this.resize();

    // Prevent rendering when off-screen to save the UI thread
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        this.isVisible = entry.isIntersecting;
        if (this.isVisible && !this.animId) {
          this.start();
        }
      });
    }, { threshold: 0.1 });
    this.observer.observe(this.canvas);
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    // Fallback prevents 0px math crashes on hidden mount
    this.width = Math.max(100, rect.width);
    this.height = Math.max(100, rect.height);

    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.ctx.scale(this.dpr, this.dpr);
  }

  update(paramId, value) {
    const val = parseFloat(value);
    if (paramId === 'ctrl_wl') {
      this.params.wavelength = val;
    } else if (paramId === 'ctrl_d') {
      this.params.slitD = val;
    } else if (paramId === 'ctrl_bigD') {
      this.params.screenD = val;
    }
  }

  nmToRGB(wl) {
    let r = 0, g = 0, b = 0;
    if (wl >= 380 && wl < 440) { r = -(wl - 440) / (440 - 380); b = 1.0; } 
    else if (wl >= 440 && wl < 490) { g = (wl - 440) / (490 - 440); b = 1.0; } 
    else if (wl >= 490 && wl < 510) { g = 1.0; b = -(wl - 510) / (510 - 490); } 
    else if (wl >= 510 && wl < 580) { r = (wl - 510) / (580 - 510); g = 1.0; } 
    else if (wl >= 580 && wl < 645) { r = 1.0; g = -(wl - 645) / (645 - 580); } 
    else if (wl >= 645 && wl <= 750) { r = 1.0; }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
  }

  start() {
    if (this.animId) cancelAnimationFrame(this.animId);
    const loop = () => {
      if (this.isDestroyed) return;
      if (this.isVisible) this.render();
      // Throttle completely if not visible
      if (this.isVisible) {
        this.animId = requestAnimationFrame(loop);
      } else {
        this.animId = null;
      }
    };
    this.animId = requestAnimationFrame(loop);
  }

  render() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    if (!ctx) return;

    ctx.fillStyle = '#05070D'; // Solid background instead of clearRect for mobile GPU
    ctx.fillRect(0, 0, w, h);
    
    this.params.phase += 0.08;

    const centerY = h * 0.5;
    const slitBarrierX = w * 0.32;
    const screenX = w * 0.72;

    const rgb = this.nmToRGB(this.params.wavelength);
    const laserColor = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
    const glowColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.5)`;

    const lambdaM = this.params.wavelength * 1e-9;
    const DM = this.params.screenD;
    const dM = Math.max(0.01, this.params.slitD) * 1e-3;
    const betaMM = (lambdaM * DM / dM) * 1000;

    // Laser Source
    ctx.fillStyle = laserColor;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 10;
    ctx.fillRect(10, centerY - 10, 18, 20);
    ctx.shadowBlur = 0;

    // Wavefronts
    ctx.lineWidth = 1.5;
    for (let x = 36; x < slitBarrierX - 4; x += 14) {
      const pOffset = (x + (this.params.phase * 12)) % 14;
      ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${0.15 + (pOffset / 14) * 0.55})`;
      ctx.beginPath();
      ctx.moveTo(x, centerY - 45);
      ctx.lineTo(x, centerY + 45);
      ctx.stroke();
    }

    // Barrier
    const slitGapVisual = Math.min(h * 0.6, this.params.slitD * 90);
    const s1Y = centerY - (slitGapVisual / 2);
    const s2Y = centerY + (slitGapVisual / 2);

    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;

    ctx.fillRect(slitBarrierX - 3, 10, 6, Math.max(0, s1Y - 14));
    ctx.strokeRect(slitBarrierX - 3, 10, 6, Math.max(0, s1Y - 14));

    if (s2Y - s1Y > 10) {
      ctx.fillRect(slitBarrierX - 3, s1Y + 5, 6, (s2Y - 5) - (s1Y + 5));
      ctx.strokeRect(slitBarrierX - 3, s1Y + 5, 6, (s2Y - 5) - (s1Y + 5));
    }

    ctx.fillRect(slitBarrierX - 3, s2Y + 5, 6, Math.max(0, h - s2Y - 15));
    ctx.strokeRect(slitBarrierX - 3, s2Y + 5, 6, Math.max(0, h - s2Y - 15));

    // Circular Ripples
    const numRipples = 5;
    ctx.lineWidth = 1.2;
    const maxRadius = screenX - slitBarrierX;
    for (let r = 1; r <= numRipples; r++) {
      const radius = ((r * 18) + (this.params.phase * 8)) % maxRadius;
      const alpha = Math.max(0, 1 - (radius / maxRadius));
      ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha * 0.4})`;

      ctx.beginPath();
      ctx.arc(slitBarrierX, s1Y, radius, -Math.PI / 2.3, Math.PI / 2.3);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(slitBarrierX, s2Y, radius, -Math.PI / 2.3, Math.PI / 2.3);
      ctx.stroke();
    }

    // Detector Screen
    const screenWidth = 16;
    ctx.fillStyle = '#020617';
    ctx.fillRect(screenX, 10, screenWidth, h - 20);
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.strokeRect(screenX, 10, screenWidth, h - 20);

    const fringeScale = 12 / Math.max(0.3, betaMM);
    for (let y = 12; y < h - 12; y += 2) {
      const dy = y - centerY;
      const phaseDiff = (Math.PI * dy) / fringeScale;
      const intensity = Math.pow(Math.cos(phaseDiff), 2);
      ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${intensity * 0.95})`;
      ctx.fillRect(screenX + 1, y, screenWidth - 2, 2);
    }
  }

  destroy() {
    this.isDestroyed = true;
    this.isVisible = false;
    if (this.animId) cancelAnimationFrame(this.animId);
    if (this.observer && this.canvas) this.observer.unobserve(this.canvas);
    this.canvas = null;
    this.ctx = null;
  }
}

window.ReelSimRegistry['phy_wave_optics'] = WaveOpticsMiniEngine;
