/**
 * =====================================================
 * MODULE: DNA BASE-PAIRING & REPLICATION FORK ENGINE
 * Subject: Class 10/12 Biology (Heredity & Genetics)
 * Architecture: Interactive Nucleotide Slotting & Hydrogen Bond Visualizer
 * =====================================================
 */

window.ReelSimRegistry = window.ReelSimRegistry || {};

class BioDnaEngine {
  constructor(canvas, customParams = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.cardId = canvas.getAttribute('data-sim-card-id');
    this.isDestroyed = false;

    this.params = {
      templateStr: "A-T-G-C",
      targetComplement: "T-A-C-G",
      ...customParams
    };

    this.userSlots = ["?", "?", "?", "?"];
    this.activeSlotIdx = 0;
    this.isSubmitted = false;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.resize();
    this.render();
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    this.width = rect.width || 320;
    this.height = rect.height || 165;

    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.ctx.scale(this.dpr, this.dpr);
  }

  slotNucleotide(base) {
    if (this.isSubmitted) return;

    const templateBases = ["A", "T", "G", "C"];
    const expectedPair = { "A": "T", "T": "A", "G": "C", "C": "G" };
    
    const currentTemplate = templateBases[this.activeSlotIdx];
    const correctPairBase = expectedPair[currentTemplate];

    if (base === correctPairBase) {
      if (typeof playDing === 'function') playDing();
      if (typeof triggerHaptic === 'function') triggerHaptic([20, 30]);

      this.userSlots[this.activeSlotIdx] = base;
      this.activeSlotIdx++;

      if (this.activeSlotIdx >= this.userSlots.length) {
        this.isSubmitted = true;
        if (window.handleDrawReelAnswer) {
          window.handleDrawReelAnswer(this.cardId, true, this.userSlots.join("-"), "T-A-C-G");
        }
      }
    } else {
      if (typeof playBuzz === 'function') playBuzz();
      if (typeof triggerHaptic === 'function') triggerHaptic([60]);
    }
    this.render();
  }

  render() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    if (!ctx || w === 0 || h === 0) return;

    ctx.clearRect(0, 0, w, h);

    const templateSequence = ["A", "T", "G", "C"];
    const startX = 55;
    const spacing = 65;

    // 1. RENDER TEMPLATE STRAND (Top)
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 10px monospace';
    ctx.fillText("TEMPLATE STRAND (5' → 3')", startX - 25, 25);

    templateSequence.forEach((base, idx) => {
      const x = startX + (idx * spacing);
      const y = 48;

      ctx.beginPath();
      ctx.arc(x, y, 18, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 229, 255, 0.12)';
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 1.5;
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px "Space Grotesk", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(base, x, y);
    });

    // 2. RENDER HYDROGEN BONDS (Middle Animated Dash)
    templateSequence.forEach((_, idx) => {
      const x = startX + (idx * spacing);
      ctx.beginPath();
      ctx.moveTo(x, 68);
      ctx.lineTo(x, 92);
      ctx.strokeStyle = this.userSlots[idx] !== "?" ? '#10b981' : 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // 3. RENDER COMPLEMENTARY STRAND / USER SLOTS (Bottom)
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText("COMPLEMENTARY STRAND (3' → 5')", startX - 25, 122);

    this.userSlots.forEach((base, idx) => {
      const x = startX + (idx * spacing);
      const y = 114;
      const isActive = idx === this.activeSlotIdx && !this.isSubmitted;

      ctx.beginPath();
      ctx.arc(x, y, 18, 0, Math.PI * 2);
      ctx.fillStyle = base !== "?" ? 'rgba(16, 185, 129, 0.2)' : (isActive ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.02)');
      ctx.strokeStyle = base !== "?" ? '#10b981' : (isActive ? '#f59e0b' : 'rgba(255,255,255,0.15)');
      ctx.lineWidth = isActive ? 2 : 1.5;
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = base !== "?" ? '#10b981' : '#64748b';
      ctx.font = 'bold 16px "Space Grotesk", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(base, x, y);
    });
  }

  destroy() {
    this.isDestroyed = true;
    this.canvas = null;
    this.ctx = null;
  }
}

window.ReelSimRegistry['bio_dna'] = BioDnaEngine;

window.slotDnaBase = function(cardId, base) {
  const instance = window.activeSimInstances ? window.activeSimInstances[cardId] : null;
  if (instance && instance.slotNucleotide) {
    instance.slotNucleotide(base);
  }
};
