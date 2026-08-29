if (typeof SIMULATIONS !== 'undefined' && SIMULATIONS['chem_kinetics']) {
  const sim = SIMULATIONS['chem_kinetics'];
  sim.init = function() { 
    this.particles = Array.from({length: 40}, () => ({ x: 100+Math.random()*100, y: 100+Math.random()*100, vx: (Math.random()-0.5)*5, vy: (Math.random()-0.5)*5, reacted: false }));
  };
  sim.update = function(p, v) { 
    if (p === 'ctrl_t') this.params.temp = parseFloat(v);
    if (p === 'ctrl_cat') this.params.catalyst = parseFloat(v);
  };
  sim.render = function(c, ctx) {
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.strokeStyle = '#334155'; ctx.lineWidth = 4; ctx.strokeRect(50, 50, c.width-100, c.height-100);
    
    const energy = (this.params.temp / 300);
    const threshold = 1.5 - (this.params.catalyst / 100); 

    let reactedCount = 0;
    this.particles.forEach(p => {
      p.x += p.vx * energy; p.y += p.vy * energy;
      if (p.x < 55 || p.x > c.width-55) p.vx *= -1;
      if (p.y < 55 || p.y > c.height-55) p.vy *= -1;
      
      if (!p.reacted && energy > threshold && Math.random() < 0.02) p.reacted = true;
      if (p.reacted) reactedCount++;

      ctx.fillStyle = p.reacted ? '#05ffa1' : '#0ea5e9';
      ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, 7); ctx.fill();
    });

    ctx.fillStyle = '#0f172a'; ctx.fillRect(10, 10, 180, 60);
    ctx.fillStyle = '#94a3b8'; ctx.font = '11px monospace';
    ctx.fillText(`Ea BARRIER: ${threshold.toFixed(2)}`, 20, 30);
    ctx.fillStyle = reactedCount > 20 ? '#05ffa1' : '#fbbf24';
    ctx.fillText(`PRODUCT YIELD: ${((reactedCount/40)*100).toFixed(0)}%`, 20, 50);
  };
}
