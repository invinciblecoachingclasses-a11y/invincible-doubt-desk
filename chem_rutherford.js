if (typeof SIMULATIONS !== 'undefined' && SIMULATIONS['chem_rutherford']) {
  const sim = SIMULATIONS['chem_rutherford'];
  sim.init = function() { this.particles = []; };
  sim.update = function(p, v) { if (p === 'ctrl_en') this.params.energy = parseFloat(v); if (p === 'ctrl_tz') this.params.targetZ = parseFloat(v); };
  sim.render = function(c, ctx) {
    ctx.clearRect(0, 0, c.width, c.height);
    const cx = c.width * 0.6, cy = c.height / 2;
    // Nucleus
    ctx.fillStyle = '#fbbf24'; ctx.beginPath(); ctx.arc(cx, cy, this.params.targetZ / 5, 0, 7); ctx.fill();
    ctx.shadowBlur = 20; ctx.shadowColor = '#f59e0b'; ctx.stroke(); ctx.shadowBlur = 0;
    
    if (Math.random() > 0.6) {
      this.particles.push({ x: 0, y: cy - 100 + Math.random()*200, vx: this.params.energy * 2, vy: 0 });
    }
    ctx.fillStyle = '#ef4444';
    this.particles.forEach((p, i) => {
      const dx = cx - p.x, dy = cy - p.y;
      const dist = Math.max(5, Math.hypot(dx, dy));
      const force = (this.params.targetZ * 20) / (dist * dist);
      p.vx -= (dx / dist) * force * (1 / this.params.energy);
      p.vy -= (dy / dist) * force * (1 / this.params.energy);
      p.x += p.vx; p.y += p.vy;
      ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, 7); ctx.fill();
      if (p.x > c.width || p.x < 0 || p.y > c.height || p.y < 0) this.particles.splice(i, 1);
    });
    ctx.fillStyle = '#0f172a'; ctx.fillRect(10, 10, 200, 60);
    ctx.fillStyle = '#94a3b8'; ctx.font = '12px monospace';
    ctx.fillText(`TARGET NUCLEUS: Z=${this.params.targetZ}`, 20, 30);
    ctx.fillStyle = '#ef4444'; ctx.fillText(`BEAM ENERGY: ${this.params.energy} MeV`, 20, 50);
  };
}
