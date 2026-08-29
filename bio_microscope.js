/**
 * MODULE: CYTOLOGY & DIGITAL COMPOUND MICROSCOPE
 * Dynamically injected into SIMULATIONS['bio_microscope']
 */

if (typeof SIMULATIONS !== 'undefined' && SIMULATIONS['bio_microscope']) {
  const micSim = SIMULATIONS['bio_microscope'];

  micSim.init = function(canvas, ctx) {
    this.params.specimen = 'onion'; // 'onion' or 'cheek'
    this.params.coarse = 20;
    this.params.fine = 15;
    this.params.stain = 0;
    this.params.mag = 10;
  };

  micSim.update = function(paramId, value) {
    if (paramId === 'ctrl_specimen') {
      this.params.specimen = parseInt(value, 10) === 1 ? 'cheek' : 'onion';
      if (typeof triggerLabHaptic === 'function') triggerLabHaptic([35]);
    }
    if (paramId === 'ctrl_coarse') {
      this.params.coarse = parseFloat(value);
      if (typeof playTone === 'function') playTone(180 + this.params.coarse * 2, 'sine', 0.03, 0.02);
    }
    if (paramId === 'ctrl_fine') {
      this.params.fine = parseFloat(value);
      if (typeof playTone === 'function') playTone(300 + this.params.fine * 3, 'triangle', 0.03, 0.02);
    }
    if (paramId === 'ctrl_stain') {
      this.params.stain = parseFloat(value);
    }
  };

  micSim.render = function(canvas, ctx) {
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const centerX = w * 0.42;
    const centerY = h * 0.5;
    const fovRadius = Math.min(w * 0.34, h * 0.42);

    // --- FOCUS OPTICS CALCULATION ---
    // Focal sweet spot: Coarse ~ 60%, Fine ~ 50%
    const coarseDiff = Math.abs(this.params.coarse - 60);
    const fineDiff = Math.abs(this.params.fine - 50);
    const totalDefocus = (coarseDiff * 1.4) + (fineDiff * 0.5);
    const clarity = Math.max(0, Math.min(100, 100 - (totalDefocus * 1.8)));
    const blurPx = Math.max(0, (100 - clarity) * 0.16);

    // --- MICROSCOPE BARREL (FIELD OF VIEW CLIPPING) ---
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, fovRadius, 0, Math.PI * 2);
    ctx.clip();

    // Field of View Background Illumination
    const lightGrad = ctx.createRadialGradient(centerX, centerY, fovRadius * 0.1, centerX, centerY, fovRadius);
    lightGrad.addColorStop(0, '#ffffff');
    lightGrad.addColorStop(0.75, '#f1f5f9');
    lightGrad.addColorStop(1, '#94a3b8');
    ctx.fillStyle = lightGrad;
    ctx.fillRect(centerX - fovRadius, centerY - fovRadius, fovRadius * 2, fovRadius * 2);

    // Apply optical defocus blur if supported
    if (ctx.filter) {
      ctx.filter = blurPx > 0.4 ? `blur(${blurPx.toFixed(1)}px)` : 'none';
    }

    const stainFactor = this.params.stain / 100;

    // --- SPECIMEN RENDERING ---
    if (this.params.specimen === 'onion') {
      // ONION PEEL: Regular brick-like rectangular plant cells
      const cellW = 75;
      const cellH = 38;
      const startX = centerX - fovRadius - 20;
      const startY = centerY - fovRadius - 20;

      // Stain color: Amber/Iodine brown
      const wallColor = `rgba(${Math.round(180 - stainFactor * 90)}, ${Math.round(130 - stainFactor * 70)}, ${Math.round(70 - stainFactor * 40)}, ${0.4 + stainFactor * 0.55})`;
      const cytoColor = `rgba(245, 158, 11, ${0.05 + stainFactor * 0.18})`;
      const nucleusColor = `rgba(180, 83, 9, ${0.15 + stainFactor * 0.8})`;

      for (let r = 0; r < 12; r++) {
        const rowOffsetX = (r % 2 === 0) ? 0 : cellW * 0.5;
        for (let c = 0; c < 8; c++) {
          const cx = startX + (c * cellW) + rowOffsetX;
          const cy = startY + (r * cellH);

          // Cytoplasm / Cell Body
          ctx.fillStyle = cytoColor;
          ctx.fillRect(cx + 2, cy + 2, cellW - 4, cellH - 4);

          // Cellulose Cell Wall
          ctx.strokeStyle = wallColor;
          ctx.lineWidth = 3;
          ctx.strokeRect(cx, cy, cellW, cellH);

          // Plant Nucleus (Periphery due to central vacuole)
          ctx.fillStyle = nucleusColor;
          ctx.beginPath();
          ctx.arc(cx + cellW * 0.78, cy + cellH * 0.45, 5, 0, Math.PI * 2);
          ctx.fill();

          // Vacuole outline (visible when stained)
          if (stainFactor > 0.4) {
            ctx.strokeStyle = `rgba(217, 119, 6, ${stainFactor * 0.35})`;
            ctx.lineWidth = 1;
            ctx.strokeRect(cx + 10, cy + 6, cellW * 0.55, cellH - 12);
          }
        }
      }
    } else {
      // HUMAN CHEEK CELLS: Irregular polygonal animal cells with central nucleus
      const cheekStain = `rgba(37, 99, 235, ${0.08 + stainFactor * 0.3})`;
      const cheekBorder = `rgba(29, 78, 216, ${0.3 + stainFactor * 0.65})`;
      const cheekNucleus = `rgba(30, 58, 138, ${0.2 + stainFactor * 0.85})`;

      const cells = [
        { x: centerX - 35, y: centerY - 25, r: 42 },
        { x: centerX + 55, y: centerY + 20, r: 48 },
        { x: centerX - 60, y: centerY + 50, r: 38 },
        { x: centerX + 20, y: centerY - 65, r: 44 }
      ];

      cells.forEach(c => {
        // Irregular polygonal membrane
        ctx.fillStyle = cheekStain;
        ctx.strokeStyle = cheekBorder;
        ctx.lineWidth = 2;
        ctx.beginPath();
        const pts = 8;
        for (let i = 0; i < pts; i++) {
          const angle = (i / pts) * Math.PI * 2;
          const wobble = c.r + Math.sin(i * 3) * 6;
          const px = c.x + Math.cos(angle) * wobble;
          const py = c.y + Math.sin(angle) * wobble;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Central Dense Nucleus
        ctx.fillStyle = cheekNucleus;
        ctx.beginPath();
        ctx.arc(c.x + 3, c.y + 2, 7, 0, Math.PI * 2);
        ctx.fill();

        // Cytoplasmic granules
        if (stainFactor > 0.3) {
          ctx.fillStyle = `rgba(30, 64, 175, ${stainFactor * 0.5})`;
          for (let g = 0; g < 6; g++) {
            ctx.fillRect(c.x + Math.sin(g) * 20, c.y + Math.cos(g) * 20, 2, 2);
          }
        }
      });
    }

    if (ctx.filter) ctx.filter = 'none';
    ctx.restore();

    // --- MICROSCOPE EYEPIECE RING & METAL HOUSING ---
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.arc(centerX, centerY, fovRadius + 8, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Crosshair reticle (subtle)
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(centerX - 15, centerY); ctx.lineTo(centerX + 15, centerY);
    ctx.moveTo(centerX, centerY - 15); ctx.lineTo(centerX, centerY + 15);
    ctx.stroke();

    // --- TELEMETRY READOUT & STAGE STATUS ---
    const hudX = w - 215;
    const hudY = 16;
    const hudW = 200;
    const hudH = 135;

    ctx.fillStyle = 'rgba(2, 6, 23, 0.9)';
    ctx.strokeStyle = clarity > 85 ? 'rgba(5, 255, 161, 0.4)' : 'rgba(0, 229, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.fillRect(hudX, hudY, hudW, hudH);
    ctx.strokeRect(hudX, hudY, hudW, hudH);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px monospace';
    ctx.fillText('OPTICAL BENCH TELEMETRY:', hudX + 10, hudY + 20);

    ctx.fillStyle = clarity > 85 ? '#05ffa1' : (clarity > 50 ? '#f59e0b' : '#ef4444');
    ctx.font = 'bold 13px monospace';
    ctx.fillText(`CLARITY: ${clarity.toFixed(0)}% ${clarity > 85 ? '✓ CRISP' : '✖ BLUR'}`, hudX + 10, hudY + 42);

    ctx.fillStyle = '#fbbf24';
    ctx.fillText(`SPECIMEN: ${this.params.specimen === 'onion' ? 'Allium cepa' : 'Squamous Cell'}`, hudX + 10, hudY + 64);

    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`STAIN:    ${stainFactor > 0.2 ? (this.params.specimen === 'onion' ? 'Iodine Solution' : 'Methylene Blue') : 'Unstained (Faint)'}`, hudX + 10, hudY + 86);

    ctx.fillStyle = '#a855f7';
    ctx.fillText(`FOV DIA:  ~450 µm (10×)`, hudX + 10, hudY + 108);

    ctx.fillStyle = clarity > 85 && stainFactor > 0.4 ? '#05ffa1' : '#64748b';
    ctx.font = '9px monospace';
    ctx.fillText(`ORGANELLES: ${clarity > 85 && stainFactor > 0.4 ? 'NUCLEUS & WALL RESOLVED' : 'LOW CONTRAST'}`, hudX + 10, hudY + 124);
  };
}
