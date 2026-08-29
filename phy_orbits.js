if (typeof SIMULATIONS !== 'undefined' && SIMULATIONS['phy_orbits']) {
  const sim = SIMULATIONS['phy_orbits'];
  sim.init = function() { this.params.angle = 0; this.params.r = 150; };
  sim.update = function(p, v) { if (p === 'ctrl_v') this.params.v = parseFloat(v); if (p === 'ctrl_alt') this.params.alt = parseFloat(v); };
  sim.render = function(c, ctx) {
    ctx.clearRect(0, 0, c.width, c.height);
    const cx = c.width / 2, cy = c.height / 2;
    // Earth
    ctx.fillStyle = '#0ea5e9'; ctx.beginPath(); ctx.arc(cx, cy, 40, 0, 7); ctx.fill();
    ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 2; ctx.stroke();
    // Orbital mechanics approximation
    const G = 1, M = 1000; 
    const vC = Math.sqrt((G * M) / (this.params.alt / 10 + 40));
    const vRatio = this.params.v / vC;
    this.params.angle += (this.params.v * 0.005);
    const orbitR = (this.params.alt / 10) + 40;
    const x = cx + Math.cos(this.params.angle) * orbitR * (vRatio > 1.4 ? vRatio : 1);
    const y = cy + Math.sin(this.params.angle) * orbitR * (vRatio > 1.4 ? 1 : (2-vRatio));
    
    // Orbit Path
    ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.beginPath(); ctx.ellipse(cx, cy, orbitR * (vRatio > 1.4 ? vRatio : 1), orbitR * (vRatio > 1.4 ? 1 : (2-vRatio)), 0, 0, 7); ctx.stroke();
    // Satellite
    ctx.fillStyle = '#fbbf24'; ctx.fillRect(x - 4, y - 4, 8, 8);
    // HUD
    ctx.fillStyle = '#0f172a'; ctx.fillRect(10, 10, 180, 70);
    ctx.fillStyle = vRatio > 1.4 ? '#ef4444' : '#05ffa1'; ctx.font = '12px monospace';
    ctx.fillText(vRatio > 1.4 ? '⚠️ ESCAPE TRAJECTORY' : '✓ STABLE ORBIT', 20, 30);
    ctx.fillStyle = '#94a3b8'; ctx.fillText(`VELOCITY: ${this.params.v} km/s`, 20, 50);
  };
}
