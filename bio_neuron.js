if (typeof SIMULATIONS !== 'undefined' && SIMULATIONS['bio_neuron']) {
  const sim = SIMULATIONS['bio_neuron'];
  sim.init = function() { this.vesicles = []; this.firePhase = 0; };
  sim.update = function(p, v) { 
    if (p === 'ctrl_mv') {
      this.params.voltage = parseFloat(v);
      if (this.params.voltage > -55) { this.firePhase = 1; if(window.triggerLabHaptic) triggerLabHaptic([50]); }
    }
    if (p === 'ctrl_tox') this.params.toxin = parseFloat(v);
  };
  sim.render = function(c, ctx) {
    ctx.clearRect(0, 0, c.width, c.height);
    const cx = c.width/2, h = c.height;
    // Axon Terminal
    ctx.fillStyle = '#1e293b'; ctx.beginPath(); ctx.arc(cx, 100, 80, 0, Math.PI); ctx.fill();
    // Synaptic Cleft
    ctx.strokeStyle = '#0ea5e9'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(cx, h-50, 120, Math.PI, 0); ctx.stroke();
    
    // Toxin Blockers
    if (this.params.toxin > 0) {
      ctx.fillStyle = `rgba(239, 68, 68, ${this.params.toxin/100})`;
      ctx.fillRect(cx - 100, h-60, 200, 20);
    }
    // Fire Action Potential
    if (this.firePhase > 0) {
      this.firePhase += 0.05;
      ctx.fillStyle = '#05ffa1';
      for(let i=0; i<8; i++) {
        let vy = 100 + (this.firePhase * 100) + Math.random()*20;
        if (vy < h-60 || this.params.toxin < 50) {
          ctx.beginPath(); ctx.arc(cx - 50 + i*15, vy, 4, 0, 7); ctx.fill();
        }
      }
      if (this.firePhase > 2) this.firePhase = 0;
    }
    ctx.fillStyle = '#0f172a'; ctx.fillRect(10, 10, 190, 60);
    ctx.fillStyle = this.params.voltage > -55 ? '#05ffa1' : '#94a3b8'; ctx.font = '12px monospace';
    ctx.fillText(`MEMBRANE: ${this.params.voltage} mV`, 20, 30);
    ctx.fillStyle = this.params.toxin > 50 ? '#ef4444' : '#fbbf24';
    ctx.fillText(`BLOCKADE: ${this.params.toxin}%`, 20, 50);
  };
}
