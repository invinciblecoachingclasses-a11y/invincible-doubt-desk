/**
 * MODULE: ELECTROMAGNETISM - FARADAY'S INDUCTION
 * Dynamically injected into SIMULATIONS['phy_induction']
 */

if (typeof SIMULATIONS !== 'undefined' && SIMULATIONS['phy_induction']) {
  const indSim = SIMULATIONS['phy_induction'];

  indSim.init = function(canvas, ctx) {
    this.params.turns = 4;
    this.params.speed = 2;
    this.params.magnetX = 100;
    this.params.direction = 1;
    this.params.inducedV = 0;
    this.params.lastTone = 0;
  };

  indSim.update = function(paramId, value) {
    if (paramId === 'ctrl_turns') this.params.turns = parseInt(value, 10);
    if (paramId === 'ctrl_speed') this.params.speed = parseFloat(value);
  };

  indSim.render = function(canvas, ctx) {
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const centerY = h * 0.48;
    const coilCenterX = w * 0.52;

    // --- MAGNET KINEMATICS ---
    const minX = 70;
    const maxX = w * 0.85;

    if (this.params.speed > 0) {
      this.params.magnetX += this.params.speed * 2.8 * this.params.direction;
      if (this.params.magnetX >= maxX) {
        this.params.magnetX = maxX;
        this.params.direction = -1;
      } else if (this.params.magnetX <= minX) {
        this.params.magnetX = minX;
        this.params.direction = 1;
      }
    }

    // --- FARADAY INDUCTION MATH (E = -N * dPhi/dt) ---
    const distToCoil = this.params.magnetX - coilCenterX;
    const fluxGradient = -distToCoil / Math.pow(1 + Math.pow(distToCoil / 45, 2), 1.5);
    const velocity = this.params.speed * this.params.direction;
    this.params.inducedV = this.params.turns * velocity * fluxGradient * 0.08;

    // Audio & Haptic pulse when crossing coil center
    if (Math.abs(distToCoil) < 15 && this.params.speed > 0) {
      const now = performance.now();
      if (now - this.params.lastTone > 180) {
        if (typeof playTone === 'function') {
          playTone(320 + Math.abs(this.params.inducedV) * 60, 'sine', 0.06, 0.04);
        }
        if (typeof triggerLabHaptic === 'function') triggerLabHaptic([25]);
        this.params.lastTone = now;
      }
    }

    // --- DRAW MAGNETIC FIELD LINES ---
    const mX = this.params.magnetX;
    const mW = 90;
    const mH = 34;

    ctx.strokeStyle = 'rgba(0, 229, 255, 0.25)';
    ctx.lineWidth = 1.5;
    for (let r = 20; r <= 60; r += 20) {
      ctx.beginPath();
      ctx.ellipse(mX, centerY, r * 1.8, r, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // --- DRAW BAR MAGNET ---
    // North Pole (Red)
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(mX - mW / 2, centerY - mH / 2, mW / 2, mH);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('N', mX - mW / 4, centerY + 4);

    // South Pole (Blue)
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(mX, centerY - mH / 2, mW / 2, mH);
    ctx.fillStyle = '#ffffff';
    ctx.fillText('S', mX + mW / 4, centerY + 4);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(mX - mW / 2, centerY - mH / 2, mW, mH);

    // --- DRAW SOLENOID / COIL ---
    const coilW = 140;
    const turns = this.params.turns;
    const turnSpacing = coilW / (turns + 1);

    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 4;
    for (let i = 1; i <= turns; i++) {
      const tx = coilCenterX - coilW / 2 + i * turnSpacing;
      ctx.beginPath();
      ctx.ellipse(tx, centerY, 14, 52, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Connecting Circuit Wires
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(coilCenterX - coilW / 2 + turnSpacing, centerY + 52);
    ctx.lineTo(coilCenterX - coilW / 2 + turnSpacing, centerY + 105);
    ctx.lineTo(coilCenterX - 35, centerY + 105);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(coilCenterX + coilW / 2 - turnSpacing, centerY + 52);
    ctx.lineTo(coilCenterX + coilW / 2 - turnSpacing, centerY + 105);
    ctx.lineTo(coilCenterX + 35, centerY + 105);
    ctx.stroke();

    // --- GALVANOMETER (CENTER-ZERO METER) ---
    const gX = coilCenterX;
    const gY = centerY + 105;
    const gR = 34;

    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(gX, gY, gR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 9px monospace';
    ctx.fillText('G', gX, gY - 14);
    ctx.fillText('-V', gX - 18, gY + 4);
    ctx.fillText('+V', gX + 18, gY + 4);

    // Deflecting Needle
    const maxDeflection = Math.PI / 3.5;
    const needleAngle = Math.max(-maxDeflection, Math.min(maxDeflection, this.params.inducedV * 0.45));

    ctx.strokeStyle = '#05ffa1';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(gX, gY);
    ctx.lineTo(gX + Math.sin(needleAngle) * (gR - 8), gY - Math.cos(needleAngle) * (gR - 8));
    ctx.stroke();

    // Pivot dot
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(gX, gY, 3, 0, Math.PI * 2);
    ctx.fill();

    // --- HUD TELEMETRY PANEL ---
    ctx.fillStyle = 'rgba(2, 6, 23, 0.9)';
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.fillRect(16, 16, 220, 84);
    ctx.strokeRect(16, 16, 220, 84);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px monospace';
    ctx.fillText('FARADAY INDUCTION TELEMETRY:', 24, 32);

    ctx.fillStyle = Math.abs(this.params.inducedV) > 0.05 ? '#05ffa1' : '#64748b';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(`INDUCED EMF: ${this.params.inducedV.toFixed(2)} V`, 24, 52);

    ctx.fillStyle = '#fbbf24';
    ctx.fillText(`COIL TURNS:  ${this.params.turns} N`, 24, 70);

    ctx.fillStyle = '#00e5ff';
    ctx.fillText(`STATUS:      ${this.params.speed === 0 ? 'STATIC FLUX' : 'dΦ/dt ACTIVE'}`, 24, 88);
  };
}
