/**
 * =====================================================
 * MODULE: WAVE OPTICS & YOUNG'S DOUBLE-SLIT INTERFERENCE
 * Engine: Canvas2D Micro-Sim Plugin (HiDPI + Lifecycle Aware)
 * =====================================================
 */

window.ReelSimRegistry = window.ReelSimRegistry || {};

class WaveOpticsMiniEngine {
  constructor(canvas, customParams = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.animId = null;
    this.isDestroyed = false;

    // Physics Parameters
    this.params = {
      wavelength: 532, // nm (Green Laser)
      slitD: 0.25,     // mm
      screenD: 1.2,    // m
      phase: 0,
      ...customParams
    };

    this.dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap at 2x for mobile GPU efficiency
    this.resize();
    this.start();
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;

    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.ctx.scale(this.dpr, this.dpr);
  }

  update(paramId, value) {
    const val = parseFloat(value);
    if (paramId === 'ctrl_wl') {
      this.params.wavelength = val;
      if (typeof playTone === 'function') {
        playTone(200 + (this.params.wavelength - 380) * 0.8, 'sine', 0.04, 0.02);
      }
    } else if (paramId === 'ctrl_d') {
      this.params.slitD = val;
    } else if (paramId === 'ctrl_bigD') {
      this.params.screenD = val;
    }
  }

  getTelemetry() {
    const lambdaM = this.params.wavelength * 1e-9;
    const DM = this.params.screenD;
    const dM = Math.max(0.01, this.params.slitD) * 1e-3;
    const betaMM = (lambdaM * DM / dM) * 1000;
    return {
      fringeWidthMM: betaMM,
      wavelength: this.params.wavelength,
      slitD: this.params.slitD,
      screenD: this.params.screenD
    };
  }

  nmToRGB(wl) {
    let r = 0, g = 0, b = 0;
    if (wl >= 380 && wl < 440) {
      r = -(wl - 440) / (440 - 380);
      b = 1.0;
    } else if (wl >= 440 && wl < 490) {
      g = (wl - 440) / (490 - 440);
      b = 1.0;
    } else if (wl >= 490 && wl < 510) {
      g = 1.0;
      b = -(wl - 510) / (510 - 490);
    } else if (wl >= 510 && wl < 580) {
      r = (wl - 510) / (580 - 510);
      g = 1.0;
    } else if (wl >= 580 && wl < 645) {
      r = 1.0;
      g = -(wl - 645) / (645 - 580);
    } else if (wl >= 645 && wl <= 750) {
      r = 1.0;
    }
    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    };
  }

  start() {
    const loop = () => {
      if (this.isDestroyed) return;
      this.render();
      this.animId = requestAnimationFrame(loop);
    };
    this.animId = requestAnimationFrame(loop);
  }

  render() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    if (!ctx || w === 0 || h === 0) return;

    ctx.clearRect(0, 0, w, h);
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

    // --- 1. LASER SOURCE ---
    ctx.fillStyle = laserColor;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 10;
    ctx.fillRect(10, centerY - 10, 18, 20);
    ctx.shadowBlur = 0;

    // Incident Plane Wavefronts
    ctx.lineWidth = 1.5;
    for (let x = 36; x < slitBarrierX - 4; x += 14) {
      const pOffset = (x + (this.params.phase * 12)) % 14;
      ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${0.15 + (pOffset / 14) * 0.55})`;
      ctx.beginPath();
      ctx.moveTo(x, centerY - 45);
      ctx.lineTo(x, centerY + 45);
      ctx.stroke();
    }

    // --- 2. DOUBLE-SLIT BARRIER ---
    const slitGapVisual = Math.min(h * 0.6, this.params.slitD * 90);
    const s1Y = centerY - (slitGapVisual / 2);
    const s2Y = centerY + (slitGapVisual / 2);

    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;

    // Top, Middle, Bottom barrier segments
    ctx.fillRect(slitBarrierX - 3, 10, 6, Math.max(0, s1Y - 14));
    ctx.strokeRect(slitBarrierX - 3, 10, 6, Math.max(0, s1Y - 14));

    if (s2Y - s1Y > 10) {
      ctx.fillRect(slitBarrierX - 3, s1Y + 5, 6, (s2Y - 5) - (s1Y + 5));
      ctx.strokeRect(slitBarrierX - 3, s1Y + 5, 6, (s2Y - 5) - (s1Y + 5));
    }

    ctx.fillRect(slitBarrierX - 3, s2Y + 5, 6, Math.max(0, h - s2Y - 15));
    ctx.strokeRect(slitBarrierX - 3, s2Y + 5, 6, Math.max(0, h - s2Y - 15));

    // Slit labels
    ctx.fillStyle = '#64748b';
    ctx.font = '8px monospace';
    ctx.fillText('S₁', slitBarrierX - 14, s1Y + 3);
    ctx.fillText('S₂', slitBarrierX - 14, s2Y + 3);

    // --- 3. CIRCULAR INTERFERING WAVEFRONTS ---
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

    // --- 4. DETECTOR SCREEN ---
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

    // --- 5. INTENSITY DISTRIBUTION CURVE ---
    const plotStartX = screenX + screenWidth + 4;
    ctx.strokeStyle = laserColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let y = 12; y < h - 12; y += 3) {
      const dy = y - centerY;
      const phaseDiff = (Math.PI * dy) / fringeScale;
      const intensity = Math.pow(Math.cos(phaseDiff), 2);
      const plotX = plotStartX + (intensity * 26);

      if (y === 12) ctx.moveTo(plotX, y);
      else ctx.lineTo(plotX, y);
    }
    ctx.stroke();
  }

  destroy() {
    this.isDestroyed = true;
    if (this.animId) cancelAnimationFrame(this.animId);
    this.canvas = null;
    this.ctx = null;
  }
}

// Register into Invincible 360 Plugin Registry
window.ReelSimRegistry['phy_wave_optics'] = WaveOpticsMiniEngine;

// Backward Compatibility Hook for Lab Studio
if (typeof SIMULATIONS !== 'undefined' && SIMULATIONS['phy_wave_optics']) {
  SIMULATIONS['phy_wave_optics'].engineClass = WaveOpticsMiniEngine;
}
