/**
 * MODULE: BIO-MECHANICS - HUMAN HEART
 * Dynamically injected into SIMULATIONS['bio_heart']
 */

// FIXED: Perfectly targets the global SIMULATIONS database
if (typeof SIMULATIONS !== 'undefined' && SIMULATIONS['bio_heart']) {
  const heartSim = SIMULATIONS['bio_heart'];

  heartSim.init = function(canvas, ctx) {
    this.params.bpm = 70;
    this.params.adrenaline = 0;
    this.params.blockage = 0;
    this.params.time = 0;
    this.params.ecgData = new Array(100).fill(0);
    this.params.lastBeat = 0;
  };

  heartSim.update = function(paramId, value) {
    if (paramId === 'ctrl_bpm') this.params.bpm = parseFloat(value);
    if (paramId === 'ctrl_adr') {
      this.params.adrenaline = parseFloat(value);
      // Adrenaline artificially drives up BPM
      const forcedBPM = Math.max(this.params.bpm, 70 + (this.params.adrenaline * 0.8));
      this.params.bpm = forcedBPM;
      document.getElementById('ctrl_bpm').value = forcedBPM;
      const bpmLabel = document.getElementById('val_ctrl_bpm');
      if (bpmLabel) bpmLabel.innerText = forcedBPM.toFixed(0) + ' bpm';
    }
    if (paramId === 'ctrl_blk') this.params.blockage = parseFloat(value);
  };

  heartSim.render = function(canvas, ctx) {
    const w = canvas.width; const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    
    // Time tracking based on BPM
    const beatDuration = 60 / this.params.bpm; // seconds per beat
    this.params.time += 0.016; // Approx 60FPS step
    
    const cyclePos = (this.params.time % beatDuration) / beatDuration; // 0.0 to 1.0
    
    // Mathematical ECG Generation (P-QRS-T wave)
    let ecgVoltage = 0;
    const isArrhythmia = this.params.blockage > 75;
    
    if (isArrhythmia) {
        // Erratic fibrillation wave if blocked heavily
        ecgVoltage = (Math.random() * 0.4) - 0.2;
    } else {
        if (cyclePos > 0.1 && cyclePos < 0.2) ecgVoltage = 0.2; // P wave
        else if (cyclePos > 0.25 && cyclePos < 0.28) ecgVoltage = -0.15; // Q wave
        else if (cyclePos >= 0.28 && cyclePos < 0.32) {
            ecgVoltage = 1.0; // R peak
            if (this.params.time - this.params.lastBeat > beatDuration * 0.9) {
                // Fire haptics and audio exactly on the R peak
                if (typeof triggerLabHaptic === 'function') triggerLabHaptic([50]);
                if (typeof playTone === 'function') playTone(400 + (this.params.adrenaline * 2), 'sine', 0.1, 0.05);
                this.params.lastBeat = this.params.time;
            }
        }
        else if (cyclePos >= 0.32 && cyclePos < 0.36) ecgVoltage = -0.2; // S wave
        else if (cyclePos > 0.5 && cyclePos < 0.7) ecgVoltage = 0.3; // T wave
    }

    // Scroll ECG Data Array
    this.params.ecgData.push(ecgVoltage);
    if (this.params.ecgData.length > 100) this.params.ecgData.shift();

    // Visual calculations
    const systolicContraction = (cyclePos >= 0.28 && cyclePos < 0.45) ? (1 - (cyclePos - 0.28)*4) : 1;
    const visualScale = 1.0 - (0.15 * (1 - Math.max(0, systolicContraction)));
    const stressColor = this.params.blockage > 60 ? '#ef4444' : '#f43f5e';

    // --- DRAW HEART CROSS-SECTION ---
    const hX = w * 0.35; const hY = h * 0.45;
    
    ctx.save();
    ctx.translate(hX, hY);
    ctx.scale(visualScale, visualScale);
    
    // Right Atrium & Ventricle (Blue - Deoxygenated)
    ctx.fillStyle = 'rgba(14, 165, 233, 0.4)';
    ctx.strokeStyle = '#0ea5e9'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(-30, -20, 30, 40, -Math.PI/6, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(-35, 40, 40, 60, Math.PI/8, 0, Math.PI*2); ctx.fill(); ctx.stroke();

    // Left Atrium & Ventricle (Red - Oxygenated)
    ctx.fillStyle = `rgba(244, 63, 94, 0.4)`;
    ctx.strokeStyle = stressColor;
    ctx.beginPath(); ctx.ellipse(30, -20, 30, 40, Math.PI/6, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(35, 40, 45, 65, -Math.PI/8, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    
    // Aorta with Blockage Visualization
    ctx.strokeStyle = '#f43f5e'; ctx.lineWidth = 12;
    ctx.beginPath(); ctx.moveTo(20, -50); ctx.quadraticCurveTo(30, -100, -20, -90); ctx.stroke();
    
    if (this.params.blockage > 0) {
        ctx.fillStyle = '#f59e0b';
        const blkSize = (this.params.blockage / 100) * 12;
        ctx.beginPath(); ctx.arc(0, -75, blkSize, 0, Math.PI*2); ctx.fill();
    }

    ctx.restore();

    // --- DRAW LIVE ECG MONITOR ---
    const ecgX = w * 0.60; const ecgY = 20; const ecgW = w * 0.35; const ecgH = 120;
    
    ctx.fillStyle = '#020617'; ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 2;
    ctx.fillRect(ecgX, ecgY, ecgW, ecgH); ctx.strokeRect(ecgX, ecgY, ecgW, ecgH);
    
    // Grid Lines
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.15)'; ctx.lineWidth = 1;
    for (let i = 0; i < ecgW; i += 15) { ctx.beginPath(); ctx.moveTo(ecgX + i, ecgY); ctx.lineTo(ecgX + i, ecgY + ecgH); ctx.stroke(); }
    for (let i = 0; i < ecgH; i += 15) { ctx.beginPath(); ctx.moveTo(ecgX, ecgY + i); ctx.lineTo(ecgX + ecgW, ecgY + i); ctx.stroke(); }

    // Plot ECG Line
    ctx.strokeStyle = isArrhythmia ? '#ef4444' : '#10b981'; 
    ctx.lineWidth = 2;
    ctx.shadowColor = ctx.strokeStyle; ctx.shadowBlur = 10;
    
    ctx.beginPath();
    for (let i = 0; i < this.params.ecgData.length; i++) {
        const px = ecgX + ((i / 100) * ecgW);
        const py = ecgY + (ecgH / 2) - (this.params.ecgData[i] * (ecgH * 0.4));
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.stroke(); ctx.shadowBlur = 0;

    // HUD Text
    ctx.fillStyle = '#94a3b8'; ctx.font = '10px monospace';
    ctx.fillText('LIVE TELEMETRY (ECG)', ecgX + 10, ecgY + ecgH + 20);
    ctx.fillStyle = this.params.bpm > 100 ? '#f59e0b' : '#00e5ff';
    ctx.font = 'bold 16px monospace';
    ctx.fillText(`HR: ${this.params.bpm.toFixed(0)} BPM`, ecgX + 10, ecgY + ecgH + 40);
    
    if (this.params.blockage > 60) {
        ctx.fillStyle = '#ef4444'; ctx.font = 'bold 12px sans-serif';
        ctx.fillText('⚠️ CRITICAL STENOSIS DETECTED', ecgX + 10, ecgY + ecgH + 60);
    }
  };
}
