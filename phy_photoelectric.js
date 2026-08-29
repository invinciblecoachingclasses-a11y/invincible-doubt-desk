if (typeof SIMULATIONS !== 'undefined' && SIMULATIONS['phy_photoelectric']) {
  const sim = SIMULATIONS['phy_photoelectric'];
  sim.init = function() { this.electrons = []; };
  sim.update = function(p, v) { 
    if (p === 'ctrl_wl') this.params.wl = parseFloat(v);
    if (p === 'ctrl_int') this.params.intensity = parseFloat(v);
    if (p === 'ctrl_met') this.params.metal = parseFloat(v);
  };
  sim.render = function(c, ctx) {
    ctx.clearRect(0, 0, c.width, c.height);
    // Wavelength to Energy (E = hc/lambda, approx E in eV = 1240/wl)
    const eV = 1240 / this.params.wl;
    const emits = eV > this.params.metal;
    
    // Metal Plate
    ctx.fillStyle = '#64748b'; ctx.fillRect(c.width/2 - 100, c.height - 40, 200, 40);
    // Light Beam
    ctx.fillStyle = `rgba(${this.params.wl < 450 ? 100 : 255}, 100, 255, ${this.params.intensity/200})`;
    ctx.beginPath(); ctx.moveTo(c.width/2 - 50, 0); ctx.lineTo(c.width/2 + 50, 0); ctx.lineTo(c.width/2 + 100, c.height-40); ctx.lineTo(c.width/2 - 100, c.height-40); ctx.fill();

    if (emits && Math.random() < (this.params.intensity/100)) {
      this.electrons.push({ x: c.width/2 - 80 + Math.random()*160, y: c.height - 40 });
      if(window.playTone) playTone(800, 'sine', 0.02, 0.01);
    }
    
    ctx.fillStyle = '#00e5ff';
    this.electrons.forEach((e, i) => {
      e.y -= (eV - this.params.metal) * 2; // Kinetic energy
      ctx.beginPath(); ctx.arc(e.x, e.y, 3, 0, 7); ctx.fill();
      if (e.y < 0) this.electrons.splice(i, 1);
    });

    ctx.fillStyle = '#0f172a'; ctx.fillRect(10, 10, 180, 80);
    ctx.fillStyle = '#fbbf24'; ctx.font = '11px monospace';
    ctx.fillText(`PHOTON ENERGY: ${eV.toFixed(2)} eV`, 20, 30);
    ctx.fillText(`WORK FUNCTION: ${this.params.metal.toFixed(2)} eV`, 20, 50);
    ctx.fillStyle = emits ? '#05ffa1' : '#ef4444';
    ctx.fillText(emits ? 'EMISSION: ACTIVE' : 'EMISSION: HALTED', 20, 70);
  };
}
