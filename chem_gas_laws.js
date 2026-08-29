/**
 * MODULE: KINETIC THEORY & GAS LAWS SANDBOX
 * Dynamically injected into SIMULATIONS['chem_gas_laws']
 */

if (typeof SIMULATIONS !== 'undefined' && SIMULATIONS['chem_gas_laws']) {
  const gasSim = SIMULATIONS['chem_gas_laws'];

  gasSim.init = function(canvas, ctx) {
    this.params.temp = 300;
    this.params.volFactor = 80;
    this.params.count = 40;
    this.params.pressure = 1.0;
    this.params.ruptured = false;
    this.params.wallHits = 0;
    this.params.lastHitReset = performance.now();

    this.particles = [];
    this.spawnParticles();
  };

  gasSim.spawnParticles = function() {
    this.particles = [];
    const speedBase = Math.sqrt(this.params.temp / 300) * 2.5;
    for (let i = 0; i < this.params.count; i++) {
      const angle = Math.random() * Math.PI * 2;
      this.particles.push({
        x: 60 + Math.random() * 120,
        y: 60 + Math.random() * 160,
        vx: Math.cos(angle) * speedBase,
        vy: Math.sin(angle) * speedBase,
        r: 4
      });
    }
  };

  gasSim.update = function(paramId, value) {
    if (paramId === 'ctrl_temp') {
      this.params.temp = parseFloat(value);
      this.rescaleVelocities();
    }
    if (paramId === 'ctrl_vol') {
      this.params.volFactor = parseFloat(value);
    }
    if (paramId === 'ctrl_count') {
      this.params.count = parseInt(value, 10);
      this.spawnParticles();
    }

    // Ideal Gas Law Approximation: P = (n * R * T) / V
    const effectiveVol = Math.max(25, this.params.volFactor);
    const calculatedP = ((this.params.count / 40) * (this.params.temp / 300) * 80) / effectiveVol;
    this.params.pressure = calculatedP;

    // Destructive Chamber Rupture Threshold (P > 4.2 atm)
    if (this.params.pressure > 4.2 && !this.params.ruptured) {
      this.params.ruptured = true;
      if (typeof triggerLabHaptic === 'function') triggerLabHaptic([150, 100, 250]);
      if (typeof playTone === 'function') playTone(140, 'sawtooth', 0.5, 0.3);
    } else if (this.params.pressure <= 4.2 && this.params.ruptured) {
      this.params.ruptured = false;
    }
  };

  gasSim.rescaleVelocities = function() {
    const targetSpeed = Math.sqrt(this.params.temp / 300) * 2.5;
    this.particles.forEach(p => {
      const currentSpeed = Math.hypot(p.vx, p.vy) || 1;
      p.vx = (p.vx / currentSpeed) * targetSpeed;
      p.vy = (p.vy / currentSpeed) * targetSpeed;
    });
  };

  gasSim.render = function(canvas, ctx) {
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const cLeft = 40;
    const cTop = 40;
    const cHeight = h - 90;
    const maxChamberW = w * 0.52;
    const currentChamberW = (this.params.volFactor / 100) * maxChamberW;
    const pistonX = cLeft + currentChamberW;

    // --- DRAW PISTON CHAMBER ---
    ctx.lineWidth = 4;
    ctx.strokeStyle = this.params.ruptured ? '#ef4444' : '#00e5ff';
    ctx.shadowColor = this.params.ruptured ? '#ef4444' : '#00e5ff';
    ctx.shadowBlur = this.params.ruptured ? 15 : 4;

    // Top, Bottom, and Left Fixed Cylinder Walls
    ctx.beginPath();
    ctx.moveTo(pistonX + 40, cTop);
    ctx.lineTo(cLeft, cTop);
    ctx.lineTo(cLeft, cTop + cHeight);
    ctx.lineTo(pistonX + 40, cTop + cHeight);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Movable Piston Wall & Handle
    ctx.fillStyle = this.params.ruptured ? '#ef4444' : '#38bdf8';
    ctx.fillRect(pistonX - 8, cTop + 4, 14, cHeight - 8);

    // Piston Shaft
    ctx.fillStyle = '#64748b';
    ctx.fillRect(pistonX + 6, cTop + cHeight / 2 - 8, 45, 16);

    // --- PARTICLE KINETICS & COLLISION DETECTION ---
    this.particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;

      // Left Wall
      if (p.x - p.r <= cLeft) {
        p.x = cLeft + p.r;
        p.vx *= -1;
      }
      // Piston Wall (Right Boundary)
      if (!this.params.ruptured && p.x + p.r >= pistonX - 8) {
        p.x = pistonX - 8 - p.r;
        p.vx *= -1;
      }
      // Top Wall
      if (p.y - p.r <= cTop) {
        p.y = cTop + p.r;
        p.vy *= -1;
      }
      // Bottom Wall
      if (p.y + p.r >= cTop + cHeight) {
        p.y = cTop + cHeight - p.r;
        p.vy *= -1;
      }

      // Dynamic Kinetic Color Coding (Cool Blue -> Amber -> Hot Rose)
      const speed = Math.hypot(p.vx, p.vy);
      let pColor = '#38bdf8';
      if (speed > 3.0) pColor = '#fbbf24';
      if (speed > 4.5 || this.params.temp > 450) pColor = '#f43f5e';

      ctx.fillStyle = pColor;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // --- BURNOUT / RUPTURE GRAPHIC OVERLAY ---
    if (this.params.ruptured) {
      ctx.fillStyle = '#ef4444';
      ctx.font = '900 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('💥 CHAMBER RUPTURED!', cLeft + currentChamberW / 2, cTop + cHeight / 2);
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('CRITICAL PRESSURE THRESHOLD EXCEEDED', cLeft + currentChamberW / 2, cTop + cHeight / 2 + 20);
    }

    // --- TELEMETRY & DIGITAL MANOMETER READOUT ---
    const hudX = w - 210;
    const hudY = 16;
    const hudW = 195;
    const hudH = 135;

    ctx.fillStyle = 'rgba(2, 6, 23, 0.9)';
    ctx.strokeStyle = this.params.ruptured ? 'rgba(239, 68, 68, 0.4)' : 'rgba(0, 229, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.fillRect(hudX, hudY, hudW, hudH);
    ctx.strokeRect(hudX, hudY, hudW, hudH);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px monospace';
    ctx.fillText('GAS LAWS MANOMETER:', hudX + 12, hudY + 22);

    ctx.fillStyle = this.params.ruptured ? '#ef4444' : (this.params.pressure > 3.0 ? '#f59e0b' : '#00e5ff');
    ctx.font = 'bold 13px monospace';
    ctx.fillText(`PRESSURE (P): ${this.params.pressure.toFixed(2)} atm`, hudX + 12, hudY + 44);

    ctx.fillStyle = '#fbbf24';
    ctx.fillText(`TEMP (T):     ${this.params.temp.toFixed(0)} K`, hudX + 12, hudY + 66);

    ctx.fillStyle = '#05ffa1';
    ctx.fillText(`VOLUME (V):   ${this.params.volFactor.toFixed(0)} %`, hudX + 12, hudY + 88);

    ctx.fillStyle = '#a855f7';
    ctx.fillText(`MOLECULES:    ${this.params.count} mol`, hudX + 12, hudY + 110);

    ctx.fillStyle = this.params.ruptured ? '#ef4444' : '#64748b';
    ctx.font = '9px monospace';
    ctx.fillText(`STATUS: ${this.params.ruptured ? 'OVERLOAD BLOWOUT' : 'CONTAINED'}`, hudX + 12, hudY + 126);
  };
}
