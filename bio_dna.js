/**
 * MODULE: FLAGSHIP - DNA MUTATION ENGINE
 * Dynamically injected into SIMULATIONS['bio_dna']
 */

if (typeof SIMULATIONS !== 'undefined' && SIMULATIONS['bio_dna']) {
  const dnaSim = SIMULATIONS['bio_dna'];

  dnaSim.init = function(canvas, ctx) {
    this.params.temp = 37;
    this.params.uvLevel = 0;
    this.params.phase = 0;
    
    // Generate random DNA sequence (A-T, C-G)
    const bases = ['A', 'T', 'C', 'G'];
    this.sequence = [];
    for (let i = 0; i < 20; i++) {
        const left = bases[Math.floor(Math.random() * bases.length)];
        let right = '';
        if (left === 'A') right = 'T'; if (left === 'T') right = 'A';
        if (left === 'C') right = 'G'; if (left === 'G') right = 'C';
        this.sequence.push({ left, right, mutated: false });
    }
  };

  dnaSim.update = function(paramId, value) {
    if (paramId === 'ctrl_tmp') this.params.temp = parseFloat(value);
    if (paramId === 'ctrl_uv') {
        const oldUV = this.params.uvLevel;
        this.params.uvLevel = parseFloat(value);
        
        // Trigger mutations if UV spikes suddenly
        if (this.params.uvLevel > 70 && oldUV <= 70) {
            const mutateIdx = Math.floor(Math.random() * this.sequence.length);
            this.sequence[mutateIdx].mutated = true;
            if (typeof triggerLabHaptic === 'function') triggerLabHaptic([100, 50, 150]); // Heavy snap
            if (typeof playTone === 'function') playTone(120, 'sawtooth', 0.2, 0.2); // Error buzz
        }
    }
  };

  dnaSim.render = function(canvas, ctx) {
    const w = canvas.width; const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    
    // Rotation speed based on temperature
    this.params.phase += 0.02 + ((this.params.temp - 30) * 0.001);
    
    const centerY = h / 2;
    const strandSpacing = 80;
    
    // Calculate unzipping (Denaturation occurs above 85°C)
    let unzipFactor = 0;
    if (this.params.temp > 85) {
        unzipFactor = Math.min(1, (this.params.temp - 85) / 15);
    }
    
    // Base colors
    const colorMap = { 'A': '#0ea5e9', 'T': '#f59e0b', 'C': '#10b981', 'G': '#8b5cf6' };
    
    // Draw the strands and bonds
    for (let i = 0; i < this.sequence.length; i++) {
        const x = 50 + (i * 30);
        if (x > w - 20) break; // Keep inside bounds
        
        // Procedural 3D rotation using Sine/Cosine
        const offset = i * 0.4;
        const wave1 = Math.sin(this.params.phase + offset);
        const wave2 = Math.sin(this.params.phase + offset + Math.PI);
        
        // Unzipping physics (strands pull apart horizontally when hot)
        const currentSpacing = strandSpacing + (unzipFactor * 60);
        const y1 = centerY + (wave1 * currentSpacing);
        const y2 = centerY + (wave2 * currentSpacing);
        
        const base = this.sequence[i];
        
        // Draw the Hydrogen Bonds (or broken bonds if mutated)
        if (base.mutated) {
            ctx.strokeStyle = '#ef4444'; // Red for mutation
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x, y1); ctx.lineTo(x, (y1 + y2) / 2 - 10);
            ctx.moveTo(x, y2); ctx.lineTo(x, (y1 + y2) / 2 + 10);
            ctx.stroke();
            
            ctx.fillStyle = '#ef4444'; ctx.font = 'bold 14px monospace';
            ctx.fillText('⚡', x - 6, centerY + 4);
        } else if (unzipFactor < 0.5) {
            // Intact bonds
            ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x, y2); ctx.stroke();
        }

        // Draw Nucleotides (Left Strand)
        ctx.fillStyle = colorMap[base.left];
        ctx.beginPath(); ctx.arc(x, y1, 6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = '9px monospace';
        ctx.fillText(base.left, x - 3, y1 - 10);

        // Draw Nucleotides (Right Strand)
        ctx.fillStyle = colorMap[base.right];
        ctx.beginPath(); ctx.arc(x, y2, 6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.fillText(base.right, x - 3, y2 + 16);
    }
    
    // Draw Sugar-Phosphate Backbones
    ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 3;
    ctx.shadowColor = '#0ea5e9'; ctx.shadowBlur = 10;
    
    ctx.beginPath();
    for (let i = 0; i < this.sequence.length; i++) {
        const x = 50 + (i * 30);
        if (x > w - 20) break;
        const wave1 = Math.sin(this.params.phase + (i * 0.4));
        const y1 = centerY + (wave1 * (strandSpacing + (unzipFactor * 60)));
        if (i === 0) ctx.moveTo(x, y1); else ctx.lineTo(x, y1);
    }
    ctx.stroke();

    ctx.strokeStyle = '#c084fc';
    ctx.shadowColor = '#a855f7';
    ctx.beginPath();
    for (let i = 0; i < this.sequence.length; i++) {
        const x = 50 + (i * 30);
        if (x > w - 20) break;
        const wave2 = Math.sin(this.params.phase + (i * 0.4) + Math.PI);
        const y2 = centerY + (wave2 * (strandSpacing + (unzipFactor * 60)));
        if (i === 0) ctx.moveTo(x, y2); else ctx.lineTo(x, y2);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // HUD Text
    ctx.fillStyle = 'rgba(2, 6, 23, 0.85)'; ctx.strokeStyle = 'rgba(0, 229, 255, 0.3)'; ctx.lineWidth = 1;
    ctx.fillRect(16, 16, 210, 80); ctx.strokeRect(16, 16, 210, 80);
    
    ctx.fillStyle = '#94a3b8'; ctx.font = '10px monospace';
    ctx.fillText('DNA STATE MONITOR:', 26, 34);
    
    if (this.params.temp > 85) {
        ctx.fillStyle = '#f59e0b'; ctx.font = 'bold 12px monospace';
        ctx.fillText(`🔥 DENATURING (${this.params.temp.toFixed(1)}°C)`, 26, 54);
    } else {
        ctx.fillStyle = '#05ffa1'; ctx.font = 'bold 12px monospace';
        ctx.fillText(`🧬 STABLE HELIX (${this.params.temp.toFixed(1)}°C)`, 26, 54);
    }

    const mutatedCount = this.sequence.filter(s => s.mutated).length;
    if (mutatedCount > 0) {
        ctx.fillStyle = '#ef4444';
        ctx.fillText(`⚠️ ${mutatedCount} MUTATIONS DETECTED`, 26, 74);
    } else {
        ctx.fillStyle = '#00e5ff';
        ctx.fillText(`UV EXPOSURE: ${this.params.uvLevel.toFixed(1)} mSv`, 26, 74);
    }
  };
}
