/**
 * MODULE: WAVE OPTICS & YOUNG'S DOUBLE-SLIT INTERFERENCE
 * Dynamically injected into SIMULATIONS['phy_wave_optics']
 */

if (typeof SIMULATIONS !== 'undefined' && SIMULATIONS['phy_wave_optics']) {
  const waveSim = SIMULATIONS['phy_wave_optics'];

  waveSim.init = function(canvas, ctx) {
    this.params.wavelength = 532; // nm (Green Laser)
    this.params.slitD = 0.25;      // mm
    this.params.screenD = 1.2;     // m
    this.params.phase = 0;
  };

  waveSim.update = function(paramId, value) {
    if (paramId === 'ctrl_wl') {
      this.params.wavelength = parseFloat(value);
      if (typeof playTone === 'function') {
        playTone(200 + (this.params.wavelength - 380) * 0.8, 'sine', 0.05, 0.03);
      }
    }
    if (paramId === 'ctrl_d') this.params.slitD = parseFloat(value);
    if (paramId === 'ctrl_bigD') this.params.screenD = parseFloat(value);
  };

  // Converts wavelength (nm) to an exact RGB color representation
  waveSim.nmToRGB = function(wl) {
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
  };

  waveSim.render = function(canvas, ctx) {
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    this.params.phase += 0.08;

    const centerY = h * 0.5;
    const slitBarrierX = w * 0.32;
    const screenX = w * 0.72;

    const rgb = this.nmToRGB(this.params.wavelength);
    const laserColor = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
    const glowColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.6)`;

    // Calculate Fringe Width: beta = (lambda * D) / d
    // lambda in m (nm * 1e-9), D in m, d in m (mm * 1e-3) -> beta in mm
    const lambdaM = this.params.wavelength * 1e-9;
    const DM = this.params.screenD;
    const dM = this.params.slitD * 1e-3;
    const betaMM = (lambdaM * DM / dM) * 1000;

    // --- 1. LASER SOURCE & INCIDENT PLANE WAVES ---
    ctx.strokeStyle = laserColor;
    ctx.fillStyle = laserColor;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 12;

    // Laser Emitter Box
    ctx.fillRect(15, centerY - 14, 28, 28);
    ctx.shadowBlur = 0;

    // Incident Parallel Wavefronts
    ctx.lineWidth = 2;
    for (let x = 55; x < slitBarrierX - 5; x += 18) {
      const pOffset = (x + (this.params.phase * 15)) % 18;
      ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${0.2 + (pOffset / 18) * 0.6})`;
      ctx.beginPath();
      ctx.moveTo(x, centerY - 60);
      ctx.lineTo(x, centerY + 60);
      ctx.stroke();
    }

    // --- 2. DOUBLE-SLIT BARRIER ---
    const slitGapVisual = this.params.slitD * 120; // Visual scaling for slit distance
    const s1Y = centerY - (slitGapVisual / 2);
    const s2Y = centerY + (slitGapVisual / 2);

    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 3;

    // Top Barrier
    ctx.fillRect(slitBarrierX - 4, 20, 8, s1Y - 26);
    ctx.strokeRect(slitBarrierX - 4, 20, 8, s1Y - 26);

    // Middle Barrier between slits
    ctx.fillRect(slitBarrierX - 4, s1Y + 6, 8, (s2Y - 6) - (s1Y + 6));
    ctx.strokeRect(slitBarrierX - 4, s1Y + 6, 8, (s2Y - 6) - (s1Y + 6));

    // Bottom Barrier
    ctx.fillRect(slitBarrierX - 4, s2Y + 6, 8, h - s2Y - 26);
    ctx.strokeRect(slitBarrierX - 4, s2Y + 6, 8, h - s2Y - 26);

    // Slit labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = '9px monospace';
    ctx.fillText('S₁', slitBarrierX - 16, s1Y + 3);
    ctx.fillText('S₂', slitBarrierX - 16, s2Y + 3);

    // --- 3. CIRCULAR INTERFERING WAVEFRONTS ---
    const numRipples = 6;
    ctx.lineWidth = 1.5;
    for (let r = 1; r <= numRipples; r++) {
      const radius = ((r * 22) + (this.params.phase * 10)) % (screenX - slitBarrierX);
      const alpha = Math.max(0, 1 - (radius / (screenX - slitBarrierX)));
      ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha * 0.45})`;

      // Wavefront from Slit 1
      ctx.beginPath();
      ctx.arc(slitBarrierX, s1Y, radius, -Math.PI / 2.3, Math.PI / 2.3);
      ctx.stroke();

      // Wavefront from Slit 2
      ctx.beginPath();
      ctx.arc(slitBarrierX, s2Y, radius, -Math.PI / 2.3, Math.PI / 2.3);
      ctx.stroke();
    }

    // --- 4. DETECTOR SCREEN WITH REALISTIC INTERFERENCE PATTERN ---
    const screenWidth = 24;
    ctx.fillStyle = '#020617';
    ctx.fillRect(screenX, 20, screenWidth, h - 40);
    ctx.strokeStyle = '#334155';
    ctx.strokeRect(screenX, 20, screenWidth, h - 40);

    // Render continuous fringe pattern across screen height
    const fringeScale = 14 / Math.max(0.4, betaMM);
    for (let y = 22; y < h - 22; y += 2) {
      const dy = y - centerY;
      // Intensity formula: I = I_0 * cos^2(pi * d * y / (lambda * D))
      const phaseDiff = (Math.PI * dy) / fringeScale;
      const intensity = Math.pow(Math.cos(phaseDiff), 2);

      ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${intensity * 0.95})`;
      ctx.fillRect(screenX + 2, y, screenWidth - 4, 2);
    }

    // --- 5. INTENSITY DISTRIBUTION PROFILE (Right side curve) ---
    const plotStartX = screenX + screenWidth + 8;
    ctx.strokeStyle = laserColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let y = 22; y < h - 22; y += 3) {
      const dy = y - centerY;
      const phaseDiff = (Math.PI * dy) / fringeScale;
      const intensity = Math.pow(Math.cos(phaseDiff), 2);
      const plotX = plotStartX + (intensity * 40);

      if (y === 22) ctx.moveTo(plotX, y);
      else ctx.lineTo(plotX, y);
    }
    ctx.stroke();

    // --- 6. TELEMETRY READOUT ---
    const hudX = 14;
    const hudY = 14;
    const hudW = 205;
    const hudH = 102;

    ctx.fillStyle = 'rgba(2, 6, 23, 0.9)';
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.fillRect(hudX, hudY, hudW, hudH);
    ctx.strokeRect(hudX, hudY, hudW, hudH);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px monospace';
    ctx.fillText('WAVE OPTICS INTERFEROMETER:', hudX + 10, hudY + 20);

    ctx.fillStyle = laserColor;
    ctx.font = 'bold 12px monospace';
    ctx.fillText(`FRINGE WIDTH (β): ${betaMM.toFixed(2)} mm`, hudX + 10, hudY + 40);

    ctx.fillStyle = '#fbbf24';
    ctx.fillText(`WAVELENGTH (λ):   ${this.params.wavelength.toFixed(0)} nm`, hudX + 10, hudY + 58);

    ctx.fillStyle = '#05ffa1';
    ctx.fillText(`SLIT GAP (d):     ${this.params.slitD.toFixed(2)} mm`, hudX + 10, hudY + 76);

    ctx.fillStyle = '#00e5ff';
    ctx.fillText(`DISTANCE (D):     ${this.params.screenD.toFixed(1)} m`, hudX + 10, hudY + 94);
  };
}
