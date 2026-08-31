/**
 * =====================================================
 * MODULE: ALGEBRAIC EQUATION STEP BALANCER ENGINE
 * Subject: Mathematics (Linear Equations, Algebra & Polynomials)
 * Architecture: Interactive Step Transformer & Canvas Balance Beam (Loop Throttled)
 * =====================================================
 */

window.ReelSimRegistry = window.ReelSimRegistry || {};

class MathAlgebraDragEngine {
  constructor(canvas, customParams = {}) {
    this.canvas = canvas;
    this.ctx = canvas ? canvas.getContext('2d') : null;
    this.cardId = canvas ? canvas.getAttribute('data-sim-card-id') : null;
    this.isDestroyed = false;
    this.isVisible = false;
    this.animationFrame = null;

    this.params = {
      initialEquation: "2x + 6 = 18",
      targetVar: "x",
      expectedFinal: 6,
      steps: [
        { op: "-6", resultLeft: "2x", resultRight: "12" },
        { op: "÷2", resultLeft: "x", resultRight: "6" }
      ],
      ...customParams
    };

    this.currentStepIdx = 0;
    this.leftVal = 18;
    this.rightVal = 18;
    this.beamAngle = 0;
    this.targetBeamAngle = 0;
    this.isSubmitted = false;

    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.resize();
    this.renderEquationHUD();

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        this.isVisible = entry.isIntersecting;
        if (this.isVisible && !this.animationFrame) {
          this.loop();
        }
      });
    }, { threshold: 0.1 });

    if (this.canvas) this.observer.observe(this.canvas);
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    this.width = Math.max(100, rect.width || 320);
    this.height = Math.max(100, rect.height || 165);

    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    if (this.ctx) this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  renderEquationHUD() {
    const hud = document.getElementById(`angleReadout_${this.cardId}`);
    if (hud) {
      if (this.currentStepIdx === 0) hud.innerText = "2x + 6 = 18";
      else if (this.currentStepIdx === 1) hud.innerText = "2x = 12";
      else hud.innerText = "x = 6 (Solved!)";
    }
  }

  applyOperation(opString) {
    if (this.isSubmitted || this.isDestroyed) return;

    const expectedStep = this.params.steps[this.currentStepIdx];
    if (expectedStep && opString === expectedStep.op) {
      if (typeof playDing === 'function') playDing();
      if (typeof triggerHaptic === 'function') triggerHaptic([20, 30]);

      this.currentStepIdx++;
      this.targetBeamAngle = 0;
      this.renderEquationHUD();

      if (this.currentStepIdx >= this.params.steps.length) {
        this.isSubmitted = true;
        if (window.handleDrawReelAnswer) {
          window.handleDrawReelAnswer(
            this.cardId,
            true,
            `${this.params.targetVar} = ${this.params.expectedFinal}`,
            `${this.params.targetVar} = ${this.params.expectedFinal}`
          );
        }
      }
    } else {
      if (typeof playBuzz === 'function') playBuzz();
      if (typeof triggerHaptic === 'function') triggerHaptic([60]);
      
      this.targetBeamAngle = (Math.random() > 0.5 ? 1 : -1) * 0.14;
      setTimeout(() => { if (!this.isDestroyed) this.targetBeamAngle = 0; }, 500);
    }
  }

  render() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    if (!ctx || this.isDestroyed || w === 0 || h === 0) return;

    ctx.fillStyle = '#05070D';
    ctx.fillRect(0, 0, w, h);

    this.beamAngle += (this.targetBeamAngle - this.beamAngle) * 0.12;

    const fulcrumX = w * 0.5;
    const fulcrumY = h * 0.62;
    const beamLength = w * 0.72;

    // Fulcrum Base
    ctx.beginPath();
    ctx.moveTo(fulcrumX, fulcrumY);
    ctx.lineTo(fulcrumX - 18, fulcrumY + 36);
    ctx.lineTo(fulcrumX + 18, fulcrumY + 36);
    ctx.closePath();
    ctx.fillStyle = '#1e293b';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(fulcrumX, fulcrumY, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = '#00f3ff';
    ctx.fill();

    // Balance Beam
    ctx.save();
    ctx.translate(fulcrumX, fulcrumY);
    ctx.rotate(this.beamAngle);

    ctx.beginPath();
    ctx.moveTo(-beamLength / 2, 0);
    ctx.lineTo(beamLength / 2, 0);
    ctx.strokeStyle = '#00f3ff';
    ctx.lineWidth = 3;
    ctx.shadowColor = 'rgba(0, 243, 255, 0.4)';
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Left Pan
    const leftX = -beamLength / 2;
    ctx.beginPath();
    ctx.moveTo(leftX, 0);
    ctx.lineTo(leftX - 14, 28);
    ctx.lineTo(leftX + 14, 28);
    ctx.closePath();
    ctx.fillStyle = 'rgba(2, 6, 23, 0.85)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Right Pan
    const rightX = beamLength / 2;
    ctx.beginPath();
    ctx.moveTo(rightX, 0);
    ctx.lineTo(rightX - 14, 28);
    ctx.lineTo(rightX + 14, 28);
    ctx.closePath();
    ctx.fillStyle = 'rgba(2, 6, 23, 0.85)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px "Space Grotesk", sans-serif';
    ctx.textAlign = 'center';

    const currentStep = this.params.steps[this.currentStepIdx] || { resultLeft: "x", resultRight: "6" };
    const displayLeft = this.currentStepIdx === 0 ? "2x + 6" : currentStep.resultLeft;
    const displayRight = this.currentStepIdx === 0 ? "18" : currentStep.resultRight;

    ctx.fillText(displayLeft, leftX, 22);
    ctx.fillText(displayRight, rightX, 22);

    ctx.restore();
  }

  loop() {
    if (this.isDestroyed) return;
    if (this.isVisible) {
      this.render();
      this.animationFrame = requestAnimationFrame(() => this.loop());
    } else {
      this.animationFrame = null;
    }
  }

  destroy() {
    this.isDestroyed = true;
    this.isVisible = false;
    if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
    if (this.observer && this.canvas) this.observer.unobserve(this.canvas);
    this.canvas = null;
    this.ctx = null;
  }
}

window.ReelSimRegistry['math_algebra_drag'] = MathAlgebraDragEngine;

window.triggerAlgebraStep = function(cardId, opStr) {
  const instance = window.activeSimInstances ? window.activeSimInstances[cardId] : null;
  if (instance && instance.applyOperation) {
    instance.applyOperation(opStr);
  }
};
