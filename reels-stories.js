/* =====================================================
   ⚡ INVINCIBLE 360 - STUDY REELS MASTER ENGINE
   Phase 1: 3-Node Virtualized Recycler
   Phase 2: Drag & Drop Magnetic Formula Engine
   Phase 3: Canvas Mini-Sim Lifecycle Orchestrator
   Phase 4: Ray Prediction & Vector Sketching Engine
===================================================== */

const defaultReelDeck = [
    { id: 101, class_name: "10", type: "mcq", hook: "⚡ 5 SECOND CHALLENGE", title: "Only 18% got this right.", subject: "Physics", topic: "Light", q_en: "If m = -1 for a spherical mirror, where is the object placed?", options: ["At Infinity", "At Focus (F)", "At Centre of Curvature (C)"], answer: 2, time: 5, trap: "Negative magnification means real & inverted. Size is same only at C.", difficulty: "easy" },
    
    // PHASE 3: INTERACTIVE CANVAS MINI-SIM REEL
    { 
      id: 401, 
      class_name: "12", 
      type: "sim", 
      sim_id: "phy_wave_optics", 
      hook: "🔬 INTERACTIVE LAB", 
      title: "Young's Double-Slit Experiment", 
      subject: "Physics", 
      topic: "Wave Optics", 
      q_en: "Adjust Slit Gap (d) & Wavelength (λ) to observe fringe compression.", 
      controls: [
        { id: "ctrl_wl", label: "Wavelength (λ)", min: 380, max: 750, step: 1, val: 532, unit: "nm" },
        { id: "ctrl_d", label: "Slit Gap (d)", min: 0.1, max: 0.8, step: 0.01, val: 0.25, unit: "mm" },
        { id: "ctrl_bigD", label: "Screen Dist (D)", min: 0.5, max: 2.5, step: 0.1, val: 1.2, unit: "m" }
      ],
      time: 30, 
      trap: "Fringe Width β = λD/d. Decreasing slit gap d increases fringe separation!", 
      difficulty: "medium" 
    },

    // PHASE 4: PREDICTION & DRAWING REEL
    { 
      id: 501, 
      class_name: "10", 
      type: "draw", 
      sim_id: "phy_ray_draw", 
      hook: "✏️ SKETCH THE RAY", 
      title: "Law of Reflection", 
      subject: "Physics", 
      topic: "Light", 
      q_en: "Drag on the canvas to draw the reflected ray for θ_i = 45°.", 
      time: 20, 
      trap: "Law of Reflection: Angle of incidence (θ_i) strictly equals angle of reflection (θ_r) with the normal.", 
      difficulty: "medium" 
    },

    // PHASE 2: INTERACTIVE BUILDER REEL
    { id: 201, class_name: "10", type: "build", hook: "🧩 BUILD IT", title: "Ohm's Law", subject: "Physics", topic: "Electricity", q_en: "Drag or tap the correct terms to construct the formula for Voltage.", template: ["slot", "=", "slot", "×", "slot"], choices: ["V", "I", "R", "P", "+", "W"], answer: ["V", "I", "R"], time: 20, trap: "Voltage (V) is the product of Current (I) and Resistance (R).", difficulty: "medium" },
    { id: 102, class_name: "10", type: "trap", subject: "Physics", topic: "Electricity", title: "🚨 Ohm's Law Trap", content: "V = IR is ONLY valid when physical conditions like temperature remain constant. If the wire heats up, resistance changes!", rule: "Always state 'at constant temperature' in CBSE board questions to get full marks." },
    { id: 103, class_name: "10", type: "mcq", hook: "💀 BOSS QUESTION", title: "Can you beat the clock?", subject: "Chemistry", topic: "Reactions", q_en: "Heating lead nitrate powder produces brown fumes. What is the gas?", options: ["Nitrogen Monoxide", "Nitrogen Dioxide", "Oxygen"], answer: 1, time: 15, trap: "The brown fumes are strictly NO₂. 2Pb(NO₃)₂ → 2PbO + 4NO₂↑ + O₂.", difficulty: "boss" },
    { id: 301, class_name: "10", type: "build", hook: "🧩 BUILD IT", title: "Power Equation", subject: "Physics", topic: "Electricity", q_en: "Construct the formula for electrical power in terms of Current and Resistance.", template: ["slot", "=", "slot", "²", "×", "slot"], choices: ["P", "V", "I", "R", "t"], answer: ["P", "I", "R"], time: 20, trap: "Power is I²R for series circuits. P = V²/R is for parallel.", difficulty: "medium" },
    { id: 104, class_name: "10", type: "mcq", hook: "🧠 THINK BEFORE YOU TAP", title: "Don't calculate. Just look.", subject: "Mathematics", topic: "Trig", q_en: "If sin θ + sin² θ = 1, what is cos² θ + cos⁴ θ?", options: ["0", "1", "2"], answer: 1, time: 15, trap: "sin θ = 1 - sin² θ = cos² θ. Square it: sin² θ = cos⁴ θ. Thus cos² θ + cos⁴ θ = 1.", difficulty: "medium" },
    { id: 901, class_name: "9", type: "mcq", hook: "⚡ QUICK CHECK", title: "Core Concept", subject: "Physics", topic: "Gravitation", q_en: "The value of acceleration due to gravity (g) at the center of the Earth is:", options: ["9.8 m/s²", "Zero (0)", "Infinite"], answer: 1, time: 10, trap: "At Earth's center, mass attracts equally in all directions, so net force is zero." }
];

let currentReelsClass = localStorage.getItem('invincible_user_class') || "10";
let reelStreak = 0;

/* --- ENGINE STATE --- */
let activeReelDeck = [];
let currentReelIndex = 0;
let activeReelTimers = {};
let activeNodes = { prev: null, current: null, next: null };
let activeSimInstances = {};
let isTransitioning = false;
let isDraggingReel = false;
let isTokenDragging = false;
let touchStartY = 0;
let currentDeltaY = 0;

function safeEscapeHTML(str) {
    if (typeof escapeHTML === 'function') return escapeHTML(str);
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function safeFormatMath(str) {
    if (typeof formatMathText === 'function') return formatMathText(str);
    return String(str || '');
}

async function setReelsClass(cls, btn) {
    currentReelsClass = String(cls);
    localStorage.setItem('invincible_user_class', currentReelsClass);
    document.querySelectorAll('.reel-class-btn').forEach(b => b.classList.remove('active'));
    if (btn) {
        btn.classList.add('active');
    } else {
        const matchingBtn = document.querySelector(`.reel-class-btn[data-class="${cls}"]`);
        if (matchingBtn) matchingBtn.classList.add('active');
    }
    await renderReelsDeck();
}

/* =====================================================
   PHASE 1: 3-NODE VIRTUALIZED SCROLL RECYCLER
===================================================== */

async function renderReelsDeck() {
    const container = document.getElementById('studyReelsDeck');
    if (!container) return;

    let apiDeck = [];
    try {
        const res = await fetch(`/api/get-questions?target_class=${currentReelsClass}`);
        const data = await res.json();
        if (data && Array.isArray(data.reelDeck) && data.reelDeck.length > 0) {
            apiDeck = data.reelDeck;
        }
    } catch(e) {}

    // Extract ALL interactive master cards (regardless of class) to guarantee visual gameplay mixing
    const interactiveCards = defaultReelDeck.filter(c => c.type === 'build' || c.type === 'sim' || c.type === 'draw');

    let finalDeck = [];

    if (apiDeck.length > 0) {
        // The Interactive Mixer: Inject 1 Game/Sim Card after every 2 standard API MCQs
        let interactiveIdx = 0;
        for (let i = 0; i < apiDeck.length; i++) {
            finalDeck.push(apiDeck[i]);
            if ((i + 1) % 2 === 0 && interactiveIdx < interactiveCards.length) {
                finalDeck.push(interactiveCards[interactiveIdx]);
                interactiveIdx++;
            }
        }
    } else {
        const classDeck = defaultReelDeck.filter(item => String(item.class_name) === String(currentReelsClass));
        finalDeck = classDeck.length > 0 ? classDeck : defaultReelDeck;
    }

    activeReelDeck = finalDeck;
    currentReelIndex = 0;

    setupSwiperEngine(container);
}

function createReelNode(index, initialOffsetPct) {
    const node = document.createElement('div');
    node.className = 'virtual-reel-slot';
    node.style.position = 'absolute';
    node.style.top = '0';
    node.style.left = '0';
    node.style.width = '100%';
    node.style.height = '100%';
    node.style.willChange = 'transform';
    node.style.transform = `translate3d(0, ${initialOffsetPct}%, 0)`;
    node.style.transition = 'none';
    node.dataset.index = index;

    if (index >= 0 && index < activeReelDeck.length) {
        const card = activeReelDeck[index];
        node.innerHTML = generateReelHTML(card, index);

        if (card.type === 'sim' || card.type === 'draw') {
          setTimeout(() => mountReelSimulation(card.id || index, card.sim_id), 50);
        }

        try {
            if (window.MathJax && MathJax.typesetPromise) {
                MathJax.typesetPromise([node]).catch(() => {});
            }
        } catch(e) {}
    } else {
        node.innerHTML = '';
        node.style.visibility = 'hidden';
    }
    return node;
}

function destroyReelNodeSim(node) {
  if (!node) return;
  const canvas = node.querySelector('canvas[data-sim-card-id]');
  if (canvas) {
    const cardId = canvas.getAttribute('data-sim-card-id');
    unmountReelSimulation(cardId);
  }
}

function setupSwiperEngine(container) {
    Object.keys(activeSimInstances).forEach(k => unmountReelSimulation(k));
    Object.keys(activeReelTimers).forEach(id => stopReelTimer(id));

    container.innerHTML = '';
    container.style.position = 'relative';
    container.style.overflow = 'hidden';
    container.style.touchAction = 'none';
    container.style.userSelect = 'none';
    container.style.webkitUserSelect = 'none';

    activeNodes.prev = createReelNode(currentReelIndex - 1, -100);
    activeNodes.current = createReelNode(currentReelIndex, 0);
    activeNodes.next = createReelNode(currentReelIndex + 1, 100);

    container.appendChild(activeNodes.prev);
    container.appendChild(activeNodes.current);
    container.appendChild(activeNodes.next);

    const currentCard = activeReelDeck[currentReelIndex];
    if (currentCard) {
        setTimeout(() => startReelTimer(currentCard.id || currentReelIndex), 400);
    }

    attachGestureListeners(container);
    attachTokenDragEngine(container);
}

function attachGestureListeners(container) {
    const onStart = (clientY, target) => {
        if (isTransitioning || isTokenDragging || (target && target.closest('.build-choice-btn, .build-slot, .reel-opt-btn, .sim-slider, .reel-dock-action-btn, .draw-canvas-container, button, input[type="range"]'))) {
            return;
        }
        isDraggingReel = true;
        touchStartY = clientY;
        currentDeltaY = 0;

        ['prev', 'current', 'next'].forEach(k => {
            if (activeNodes[k]) activeNodes[k].style.transition = 'none';
        });
    };

    const onMove = (clientY, e) => {
        if (!isDraggingReel || isTransitioning || isTokenDragging) return;
        currentDeltaY = clientY - touchStartY;

        if (e && e.cancelable) e.preventDefault();

        let dampedDelta = currentDeltaY;
        if ((currentReelIndex === 0 && currentDeltaY > 0) || 
            (currentReelIndex === activeReelDeck.length - 1 && currentDeltaY < 0)) {
            dampedDelta = currentDeltaY * 0.22;
        }

        if (activeNodes.prev) activeNodes.prev.style.transform = `translate3d(0, calc(-100% + ${dampedDelta}px), 0)`;
        if (activeNodes.current) activeNodes.current.style.transform = `translate3d(0, ${dampedDelta}px, 0)`;
        if (activeNodes.next) activeNodes.next.style.transform = `translate3d(0, calc(100% + ${dampedDelta}px), 0)`;
    };

    const onEnd = () => {
        if (!isDraggingReel) return;
        isDraggingReel = false;

        const containerHeight = container.clientHeight || window.innerHeight;
        const threshold = Math.max(60, containerHeight * 0.16);

        if (currentDeltaY < -threshold && currentReelIndex < activeReelDeck.length - 1) {
            snapToNode('next');
        } else if (currentDeltaY > threshold && currentReelIndex > 0) {
            snapToNode('prev');
        } else {
            snapToNode('center');
        }
        currentDeltaY = 0;
    };

    container.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) onStart(e.touches[0].clientY, e.target);
    }, { passive: false });

    container.addEventListener('touchmove', (e) => {
        if (e.touches.length === 1) onMove(e.touches[0].clientY, e);
    }, { passive: false });

    container.addEventListener('touchend', onEnd);
    container.addEventListener('touchcancel', onEnd);

    container.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        onStart(e.clientY, e.target);
        
        const onMouseMove = (ev) => onMove(ev.clientY, ev);
        const onMouseUp = () => {
            onEnd();
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    });

    container.onwheel = (e) => {
        if (isTransitioning || isTokenDragging) return;
        if (Math.abs(e.deltaY) > 35) {
            if (e.deltaY > 0 && currentReelIndex < activeReelDeck.length - 1) snapToNode('next');
            else if (e.deltaY < 0 && currentReelIndex > 0) snapToNode('prev');
        }
    };

    window.onkeydown = (e) => {
        if (document.activeElement && ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
        if ((e.key === 'ArrowDown' || e.key === 'PageDown') && currentReelIndex < activeReelDeck.length - 1) {
            e.preventDefault();
            snapToNode('next');
        } else if ((e.key === 'ArrowUp' || e.key === 'PageUp') && currentReelIndex > 0) {
            e.preventDefault();
            snapToNode('prev');
        }
    };
}

function snapToNode(direction) {
    if (isTransitioning) return;
    isTransitioning = true;

    const transitionCSS = 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)';
    ['prev', 'current', 'next'].forEach(k => {
        if (activeNodes[k]) activeNodes[k].style.transition = transitionCSS;
    });

    if (direction === 'next' && currentReelIndex < activeReelDeck.length - 1) {
        activeNodes.prev.style.transform = 'translate3d(0, -200%, 0)';
        activeNodes.current.style.transform = 'translate3d(0, -100%, 0)';
        activeNodes.next.style.transform = 'translate3d(0, 0%, 0)';

        const oldCard = activeReelDeck[currentReelIndex];
        if (oldCard) stopReelTimer(oldCard.id || currentReelIndex);

        setTimeout(() => {
            currentReelIndex++;
            recycleForward();
            isTransitioning = false;
        }, 300);

    } else if (direction === 'prev' && currentReelIndex > 0) {
        activeNodes.prev.style.transform = 'translate3d(0, 0%, 0)';
        activeNodes.current.style.transform = 'translate3d(0, 100%, 0)';
        activeNodes.next.style.transform = 'translate3d(0, 200%, 0)';

        const oldCard = activeReelDeck[currentReelIndex];
        if (oldCard) stopReelTimer(oldCard.id || currentReelIndex);

        setTimeout(() => {
            currentReelIndex--;
            recycleBackward();
            isTransitioning = false;
        }, 300);

    } else {
        activeNodes.prev.style.transform = 'translate3d(0, -100%, 0)';
        activeNodes.current.style.transform = 'translate3d(0, 0%, 0)';
        activeNodes.next.style.transform = 'translate3d(0, 100%, 0)';

        setTimeout(() => {
            isTransitioning = false;
        }, 300);
    }
}

function recycleForward() {
    const container = document.getElementById('studyReelsDeck');
    if (!container) return;

    if (activeNodes.prev) {
      destroyReelNodeSim(activeNodes.prev);
      activeNodes.prev.remove();
    }

    activeNodes.prev = activeNodes.current;
    activeNodes.current = activeNodes.next;

    activeNodes.next = createReelNode(currentReelIndex + 1, 100);
    container.appendChild(activeNodes.next);

    ['prev', 'current', 'next'].forEach(k => {
        if (activeNodes[k]) activeNodes[k].style.transition = 'none';
    });
    activeNodes.prev.style.transform = 'translate3d(0, -100%, 0)';
    activeNodes.current.style.transform = 'translate3d(0, 0%, 0)';
    activeNodes.next.style.transform = 'translate3d(0, 100%, 0)';

    const newCard = activeReelDeck[currentReelIndex];
    if (newCard) startReelTimer(newCard.id || currentReelIndex);
}

function recycleBackward() {
    const container = document.getElementById('studyReelsDeck');
    if (!container) return;

    if (activeNodes.next) {
      destroyReelNodeSim(activeNodes.next);
      activeNodes.next.remove();
    }

    activeNodes.next = activeNodes.current;
    activeNodes.current = activeNodes.prev;

    activeNodes.prev = createReelNode(currentReelIndex - 1, -100);
    container.insertBefore(activeNodes.prev, activeNodes.current);

    ['prev', 'current', 'next'].forEach(k => {
        if (activeNodes[k]) activeNodes[k].style.transition = 'none';
    });
    activeNodes.prev.style.transform = 'translate3d(0, -100%, 0)';
    activeNodes.current.style.transform = 'translate3d(0, 0%, 0)';
    activeNodes.next.style.transform = 'translate3d(0, 100%, 0)';

    const newCard = activeReelDeck[currentReelIndex];
    if (newCard) startReelTimer(newCard.id || currentReelIndex);
}

/* =====================================================
   PHASE 3 & 4: SIMULATION LIFECYCLE & TELEMETRY
===================================================== */

function mountReelSimulation(cardId, simId) {
  const canvas = document.querySelector(`canvas[data-sim-card-id="${cardId}"]`);
  if (!canvas) return;

  const EngineClass = window.ReelSimRegistry ? window.ReelSimRegistry[simId] : null;
  if (!EngineClass) {
    console.warn(`[Invincible 360] Sim Engine "${simId}" not found in ReelSimRegistry.`);
    return;
  }

  if (activeSimInstances[cardId]) {
    activeSimInstances[cardId].destroy();
  }

  const instance = new EngineClass(canvas);
  activeSimInstances[cardId] = instance;

  updateSimTelemetryHUD(cardId, instance);
}

function unmountReelSimulation(cardId) {
  if (activeSimInstances[cardId]) {
    activeSimInstances[cardId].destroy();
    delete activeSimInstances[cardId];
  }
}

window.updateReelSimParam = function(cardId, paramId, value, unit) {
  const instance = activeSimInstances[cardId];
  if (instance) {
    instance.update(paramId, value);
    updateSimTelemetryHUD(cardId, instance);
  }
  const valBadge = document.getElementById(`valBadge_${cardId}_${paramId}`);
  if (valBadge) {
    valBadge.innerText = `${value} ${unit || ''}`;
  }
};

function updateSimTelemetryHUD(cardId, instance) {
  const telemetry = instance.getTelemetry ? instance.getTelemetry() : null;
  if (!telemetry) return;

  const hudEl = document.getElementById(`telemetryVal_${cardId}`);
  if (hudEl && telemetry.fringeWidthMM !== undefined) {
    hudEl.innerText = `${telemetry.fringeWidthMM.toFixed(2)} mm`;
  }
}

/* =====================================================
   PHASE 2: DRAG-AND-DROP & MAGNETIC COLLISION ENGINE
===================================================== */

function attachTokenDragEngine(container) {
    let dragGhost = null;
    let sourceBtn = null;
    let cardId = null;
    let choiceVal = null;
    let choiceIdx = null;
    let startX = 0, startY = 0;
    let currentHoveredSlot = null;
    let hasMovedSignificantly = false;

    container.addEventListener('pointerdown', (e) => {
        const btn = e.target.closest('.build-choice-btn');
        if (!btn || btn.classList.contains('is-docked-ghost')) return;

        e.stopPropagation();
        isTokenDragging = true;
        hasMovedSignificantly = false;

        sourceBtn = btn;
        cardId = btn.getAttribute('data-card-id');
        choiceVal = btn.getAttribute('data-choice');
        choiceIdx = btn.getAttribute('data-choice-idx');

        startX = e.clientX;
        startY = e.clientY;

        const rect = sourceBtn.getBoundingClientRect();
        
        dragGhost = sourceBtn.cloneNode(true);
        dragGhost.classList.add('is-dragging');
        dragGhost.style.width = `${rect.width}px`;
        dragGhost.style.height = `${rect.height}px`;
        dragGhost.style.left = `${rect.left}px`;
        dragGhost.style.top = `${rect.top}px`;
        document.body.appendChild(dragGhost);

        sourceBtn.classList.add('is-docked-ghost');

        const onPointerMove = (ev) => {
            if (!dragGhost) return;
            ev.preventDefault();

            const deltaX = ev.clientX - startX;
            const deltaY = ev.clientY - startY;

            if (Math.hypot(deltaX, deltaY) > 6) {
                hasMovedSignificantly = true;
            }

            dragGhost.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0) scale(1.15)`;

            const elBelow = document.elementFromPoint(ev.clientX, ev.clientY);
            const slot = elBelow ? elBelow.closest('.build-slot') : null;

            if (slot && !slot.getAttribute('data-filled')) {
                if (currentHoveredSlot !== slot) {
                    clearSlotHover();
                    currentHoveredSlot = slot;
                    currentHoveredSlot.classList.add('slot-hover');
                    if (typeof triggerHaptic === 'function') triggerHaptic([15]);
                }
            } else {
                clearSlotHover();
            }
        };

        const onPointerUp = (ev) => {
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
            window.removeEventListener('pointercancel', onPointerUp);

            if (!dragGhost) return;

            const elBelow = document.elementFromPoint(ev.clientX, ev.clientY);
            const targetSlot = elBelow ? elBelow.closest('.build-slot') : null;

            if (targetSlot && !targetSlot.getAttribute('data-filled')) {
                dropTokenIntoSlot(cardId, targetSlot, choiceVal, choiceIdx);
            } else if (!hasMovedSignificantly) {
                autoFillNextSlot(cardId, choiceVal, choiceIdx, sourceBtn);
            } else {
                sourceBtn.classList.remove('is-docked-ghost');
                if (typeof triggerHaptic === 'function') triggerHaptic([30]);
            }

            clearSlotHover();
            if (dragGhost) dragGhost.remove();
            dragGhost = null;
            sourceBtn = null;
            isTokenDragging = false;
        };

        window.addEventListener('pointermove', onPointerMove, { passive: false });
        window.addEventListener('pointerup', onPointerUp);
        window.addEventListener('pointercancel', onPointerUp);
    });

    function clearSlotHover() {
        if (currentHoveredSlot) {
            currentHoveredSlot.classList.remove('slot-hover');
            currentHoveredSlot = null;
        }
    }
}

function dropTokenIntoSlot(cardId, slotEl, choiceStr, choiceIdx) {
    if (typeof playDing === 'function') playDing();
    if (typeof triggerHaptic === 'function') triggerHaptic([30, 40]);

    slotEl.innerHTML = choiceStr;
    slotEl.setAttribute('data-filled', choiceStr);
    slotEl.setAttribute('data-source', choiceIdx);
    slotEl.classList.add('slot-filled');

    const card = document.getElementById(`reelCard_${cardId}`);
    if (!card) return;

    const slots = card.querySelectorAll('.build-slot');
    const allFilled = Array.from(slots).every(s => s.getAttribute('data-filled'));
    if (allFilled) {
        window.checkBuildAnswer(cardId);
    }
}

function autoFillNextSlot(cardId, choiceStr, choiceIdx, btnEl) {
    const card = document.getElementById(`reelCard_${cardId}`);
    if (!card) {
        if (btnEl) btnEl.classList.remove('is-docked-ghost');
        return;
    }

    const slots = card.querySelectorAll('.build-slot');
    let emptySlot = null;
    for (let slot of slots) {
        if (!slot.getAttribute('data-filled')) {
            emptySlot = slot;
            break;
        }
    }

    if (emptySlot) {
        dropTokenIntoSlot(cardId, emptySlot, choiceStr, choiceIdx);
    } else {
        if (btnEl) btnEl.classList.remove('is-docked-ghost');
    }
}

window.removeBuildTap = function(cardId, slotEl) {
    const sourceIdx = slotEl.getAttribute('data-source');
    if (sourceIdx !== null) {
        const card = document.getElementById(`reelCard_${cardId}`);
        if (card) {
            const btn = card.querySelector(`.build-choice-btn[data-choice-idx="${sourceIdx}"]`);
            if (btn) btn.classList.remove('is-docked-ghost');
        }
        slotEl.innerHTML = '';
        slotEl.removeAttribute('data-filled');
        slotEl.removeAttribute('data-source');
        slotEl.classList.remove('slot-filled', 'slot-hover');
    }
};

window.checkBuildAnswer = function(cardId) {
    stopReelTimer(cardId);
    const card = document.getElementById(`reelCard_${cardId}`);
    if (!card) return;

    const matrix = card.querySelector('.build-matrix');
    const correctAnswer = JSON.parse(matrix.getAttribute('data-answer'));
    const isBoss = matrix.getAttribute('data-boss') === 'true';

    const slots = card.querySelectorAll('.build-slot');
    const currentAnswer = Array.from(slots).map(s => s.getAttribute('data-filled'));
    const isCorrect = JSON.stringify(currentAnswer) === JSON.stringify(correctAnswer);

    slots.forEach(s => s.onclick = null);
    card.querySelectorAll('.build-choice-btn').forEach(b => b.style.pointerEvents = 'none');

    const reveal = document.getElementById(`revealState_${cardId}`);
    const revealTitle = document.getElementById(`revealResultTitle_${cardId}`);
    const xpBadge = document.getElementById(`revealXpBadge_${cardId}`);
    const streakBadge = document.getElementById(`revealStreakBadge_${cardId}`);

    if (isCorrect) {
        slots.forEach(s => s.classList.add('slot-correct'));
        if (typeof playDing === 'function') playDing();
        if (typeof triggerHaptic === 'function') triggerHaptic([30, 50]);
        if (typeof confetti === 'function') confetti({ particleCount: 50, spread: 60, origin:{ y: 0.6 } });
        
        reelStreak++;
        const totalXP = (isBoss ? 50 : 20) + (reelStreak > 2 ? 10 : 0);
        revealTitle.innerHTML = `<span style="color:var(--accent-emerald, #10b981);">✓ PERFECT BUILD</span>`;
        xpBadge.innerText = `+${totalXP} XP`;
        
        if (reelStreak > 2) {
            streakBadge.style.display = 'inline-block';
            streakBadge.innerText = `🔥 x${reelStreak} STREAK`;
        }
        const xpEl = document.getElementById('xpCounter');
        if (xpEl) xpEl.textContent = parseInt(xpEl.textContent || '0', 10) + totalXP;
    } else {
        slots.forEach(s => s.classList.add('slot-wrong'));
        if (typeof playBuzz === 'function') playBuzz();
        if (typeof triggerHaptic === 'function') triggerHaptic([80]);
        reelStreak = 0;
        revealTitle.innerHTML = `<span style="color:var(--accent-rose, #f43f5e);">✕ CIRCUIT BROKEN</span>`;
        xpBadge.innerText = `+0 XP`;
        xpBadge.style.background = 'rgba(255,255,255,0.05)';
        xpBadge.style.color = '#94a3b8';
    }

    setTimeout(() => { if (reveal) reveal.style.transform = 'translateY(0)'; }, 400);
};

// ---------------------------------------------------
// PHASE 4: DRAWING / PREDICTION ACCURACY EVALUATOR
// ---------------------------------------------------
window.handleDrawReelAnswer = function(cardId, isCorrect, drawnAngle, expectedAngle) {
  stopReelTimer(cardId);
  const reveal = document.getElementById(`revealState_${cardId}`);
  const revealTitle = document.getElementById(`revealResultTitle_${cardId}`);
  const xpBadge = document.getElementById(`revealXpBadge_${cardId}`);
  const streakBadge = document.getElementById(`revealStreakBadge_${cardId}`);
  if (!reveal) return;

  if (isCorrect) {
    if (typeof playDing === 'function') playDing();
    if (typeof triggerHaptic === 'function') triggerHaptic([30, 50]);
    if (typeof confetti === 'function') confetti({ particleCount: 50, spread: 60, origin:{ y: 0.6 } });

    reelStreak++;
    const totalXP = 25 + (reelStreak > 2 ? 10 : 0);
    revealTitle.innerHTML = `<span style="color:var(--accent-emerald, #10b981);">✓ RAY LOCKED (${drawnAngle}°)</span>`;
    xpBadge.innerText = `+${totalXP} XP`;
    if (reelStreak > 2) {
      streakBadge.style.display = 'inline-block';
      streakBadge.innerText = `🔥 x${reelStreak} STREAK`;
    }
    const xpEl = document.getElementById('xpCounter');
    if (xpEl) xpEl.textContent = parseInt(xpEl.textContent || '0', 10) + totalXP;
  } else {
    if (typeof playBuzz === 'function') playBuzz();
    if (typeof triggerHaptic === 'function') triggerHaptic([80]);

    reelStreak = 0;
    revealTitle.innerHTML = `<span style="color:var(--accent-rose, #f43f5e);">✕ OFF TARGET (${drawnAngle}° vs ${expectedAngle}°)</span>`;
    xpBadge.innerText = `+0 XP`;
    xpBadge.style.background = 'rgba(255,255,255,0.05)';
    xpBadge.style.color = '#94a3b8';
  }

  setTimeout(() => { 
    reveal.style.transform = 'translateY(0)'; 
  }, 400);
};

/* =====================================================
   UI TEMPLATING (GLASS & AIR DESIGN SYSTEM)
===================================================== */

function generateReelHTML(card, idx) {
    const sub = card.subject || 'Science';
    const hook = card.hook || '⚡ QUICK CHECK';
    const safeCardId = String(card.id || idx);
    const timeLimit = card.time || 15;
    const isBoss = card.difficulty === 'boss';
    const hookColor = isBoss ? 'var(--accent-rose, #ff007f)' : 'var(--accent-cyan, #00f3ff)';
    
    // Dynamic Title Generator (Kills the generic "Can you solve this?" fallback)
    const dynamicTitle = card.title && card.title !== "Can you solve this?" 
        ? card.title 
        : `${card.topic ? card.topic + ' Challenge' : 'Concept Mastery'}`;

    let contentHTML = '';

    const rawTitle = String(card.q_en || card.title || '');
    const rawSub = String(card.subject || 'Science');
    const qJS = rawTitle.replace(/'/g, "\\'").replace(/"/g, "&quot;");
    const subJS = rawSub.replace(/'/g, "\\'").replace(/"/g, "&quot;");

    const dockStyle = `position:absolute; right:12px; bottom:24px; display:flex; flex-direction:column; gap:14px; align-items:center; z-index:10;`;
    const dockBtnStyle = `width:44px; height:44px; border-radius:50%; background:rgba(15,23,42,0.7); border:1px solid rgba(255,255,255,0.15); display:flex; align-items:center; justify-content:center; font-size:18px; cursor:pointer; backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px); box-shadow:0 8px 24px rgba(0,0,0,0.6); transition:transform 0.2s;`;
    const dockLabelStyle = `font-size:10px; color:#cbd5e1; font-weight:800; margin-top:4px; text-shadow:0 1px 3px #000;`;

    // 1. STANDARD MCQ (Now with injected Visuals!)
    if (card.type === 'mcq') {
        let opts = Array.isArray(card.options) ? card.options : [];
        if (typeof card.options === 'string') {
            try { opts = JSON.parse(card.options); } catch(e) { opts = []; }
        }
        
        // Auto-inject a sleek animated SVG diagram above the text so it never looks boring
        const visualSVG = `
          <div style="width:100%; height:75px; background:radial-gradient(ellipse at center, rgba(0,243,255,0.08) 0%, transparent 80%); border:1px solid rgba(255,255,255,0.05); border-radius:16px; margin-bottom:16px; display:flex; align-items:center; justify-content:center; overflow:hidden; position:relative;">
             <svg width="100%" height="100%" preserveAspectRatio="none">
               <path d="M-10 35 Q 50 10, 150 35 T 350 35" stroke="rgba(0, 243, 255, 0.4)" stroke-width="2" fill="none" />
               <path d="M-10 45 Q 50 20, 150 45 T 350 45" stroke="rgba(244, 63, 94, 0.4)" stroke-width="2" fill="none" />
               <circle cx="50%" cy="35" r="4" fill="#00f3ff" style="filter:blur(1px);"/>
             </svg>
          </div>
        `;

        contentHTML = `
          ${visualSVG}
          <div class="reel-q-title" style="font-size:16px; font-weight:800; color:#ffffff; margin:0 0 12px 0; line-height:1.5;">${safeFormatMath(card.q_en || '')}</div>
          <div class="reel-options-grid" style="display:flex; flex-direction:column; gap:10px; margin-top:16px;">
            ${opts.map((opt, oIdx) => `
              <button type="button" class="reel-opt-btn" onclick="handleReelAnswer('${safeCardId}', ${oIdx}, ${card.answer}, ${isBoss}, this)">
                  <span>${safeFormatMath(String(opt))}</span>
                  <span class="opt-indicator" style="width:16px; height:16px; border-radius:50%; border:2px solid rgba(255,255,255,0.3);"></span>
              </button>
            `).join('')}
          </div>
        `;
    } 
    // 2. BUILDER (PHASE 2)
    else if (card.type === 'build') {
        const templateArray = Array.isArray(card.template) ? card.template : [];
        const choicesArray = Array.isArray(card.choices) ? card.choices : [];
        
        const builderSlotsHTML = templateArray.map((item) => {
            if (item === 'slot') {
                return `<div class="build-slot" onclick="window.removeBuildTap('${safeCardId}', this)" data-filled=""></div>`;
            } else {
                return `<div style="font-family:'Space Grotesk',sans-serif; font-size:22px; font-weight:900; color:#cbd5e1; display:flex; align-items:center;">${item}</div>`;
            }
        }).join('');

        const choicesHTML = choicesArray.map((choice, cIdx) => `
            <button type="button" class="build-choice-btn" data-card-id="${safeCardId}" data-choice="${choice}" data-choice-idx="${cIdx}">${choice}</button>
        `).join('');

        contentHTML = `
          <div class="reel-q-title" style="font-size:16px; font-weight:800; color:#ffffff; margin:0 0 10px 0; line-height:1.5;">${safeFormatMath(card.q_en || '')}</div>
          
          <div class="build-matrix" data-answer='${JSON.stringify(card.answer)}' data-boss='${isBoss}'>
              <div class="build-slots-tray">
                  ${builderSlotsHTML}
              </div>
              <div class="build-choices-tray">
                  ${choicesHTML}
              </div>
          </div>
        `;
    }
    // 3. CANVAS MINI-SIM (PHASE 3)
    else if (card.type === 'sim') {
        const controls = Array.isArray(card.controls) ? card.controls : [];
        
        const slidersHTML = controls.map(ctrl => `
          <div style="margin-bottom:8px;">
            <div style="display:flex; justify-content:space-between; font-size:11px; font-weight:800; color:#cbd5e1; margin-bottom:2px;">
              <span>${ctrl.label}</span>
              <span id="valBadge_${safeCardId}_${ctrl.id}" style="color:var(--accent-cyan); font-family:monospace;">${ctrl.val} ${ctrl.unit}</span>
            </div>
            <input type="range" class="sim-slider" min="${ctrl.min}" max="${ctrl.max}" step="${ctrl.step}" value="${ctrl.val}" 
              oninput="window.updateReelSimParam('${safeCardId}', '${ctrl.id}', this.value, '${ctrl.unit}')"
              style="width:100%; height:5px; accent-color:var(--accent-cyan); cursor:pointer;">
          </div>
        `).join('');

        contentHTML = `
          <div class="reel-q-title" style="font-size:14px; font-weight:800; color:#ffffff; margin:0 0 8px 0; line-height:1.4;">${safeFormatMath(card.q_en || '')}</div>
          
          <div style="position:relative; width:100%; height:160px; background:#020617; border:1px solid rgba(0,229,255,0.25); border-radius:16px; overflow:hidden; margin-bottom:12px; box-shadow:inset 0 0 20px rgba(0,0,0,0.8);">
             <canvas data-sim-card-id="${safeCardId}" style="width:100%; height:100%; display:block;"></canvas>
             
             <div style="position:absolute; top:8px; right:8px; background:rgba(8,13,26,0.85); border:1px solid rgba(0,229,255,0.3); border-radius:8px; padding:3px 8px; font-size:10px; font-family:monospace; font-weight:900; color:var(--accent-cyan); backdrop-filter:blur(8px);">
               β = <span id="telemetryVal_${safeCardId}">-- mm</span>
             </div>
          </div>

          <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:14px; padding:10px 14px;">
            ${slidersHTML}
          </div>
        `;
    }
    // 4. PREDICTION & DRAWING ENGINE (PHASE 4)
    else if (card.type === 'draw') {
        contentHTML = `
          <div class="reel-q-title" style="font-size:14px; font-weight:800; color:#ffffff; margin:0 0 10px 0; line-height:1.4;">${safeFormatMath(card.q_en || '')}</div>
          
          <div class="draw-canvas-container">
             <canvas data-sim-card-id="${safeCardId}" style="width:100%; height:100%; display:block;"></canvas>
             <div class="draw-prompt-badge">👆 Drag to aim reflected ray</div>
             <div class="draw-angle-badge" id="angleReadout_${safeCardId}">θ_drawn = --°</div>
          </div>
          
          <div style="font-size:11px; color:#64748b; font-weight:700; text-align:center;">Release finger to submit ray</div>
        `;
    }
    // 5. TRAP / HACK
    else if (card.type === 'trap' || card.type === 'hack') {
        const isTrap = card.type === 'trap';
        return `
          <div class="reel-card-inner" style="position:relative; width:100%; height:100%; background:linear-gradient(180deg, rgba(15,23,42,0.92) 0%, rgba(3,7,18,0.96) 100%); backdrop-filter:blur(16px); -webkit-backdrop-filter:blur(16px); border:1px solid rgba(255,255,255,0.08); border-left:4px solid ${isTrap ? 'var(--accent-rose, #ff007f)' : 'var(--accent-cyan, #00f3ff)'}; border-radius:24px; padding:24px; box-sizing:border-box; display:flex; flex-direction:column; justify-content:center; box-shadow:0 24px 60px rgba(0,0,0,0.85);">
            <div class="reel-q-title" style="font-size:22px; font-weight:900; color:${isTrap ? '#ff007f' : 'var(--accent-cyan, #00f3ff)'}; margin:0 0 16px 0;">${dynamicTitle}</div>
            <div style="font-size:15px; color:#f1f5f9; line-height:1.6; background:rgba(255,255,255,0.04); padding:20px; border-radius:16px; border:1px solid rgba(255,255,255,0.08); backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px);">${card.content || ''}</div>
            ${card.rule ? `<div style="font-size:14px; color:#10b981; font-weight:800; margin-top:16px; background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.25); padding:16px; border-radius:14px;">✅ RULE: ${card.rule}</div>` : ''}
            
            <div style="${dockStyle}">
              <div style="text-align:center;">
                <div style="${dockBtnStyle} border-color:var(--accent-cyan, #00f3ff); box-shadow:0 0 15px rgba(0,243,255,0.3);" onclick="sendReelToDoubtSolver('${qJS}', '${subJS}')">🧠</div>
                <div style="${dockLabelStyle}">Explain</div>
              </div>
              <div style="text-align:center;">
                <div style="${dockBtnStyle}" onclick="reactStory('mind')">🤯</div>
                <div style="${dockLabelStyle}">Clout</div>
              </div>
              <div style="text-align:center;">
                <div style="${dockBtnStyle}" onclick="shareReel('${qJS}')">🚀</div>
                <div style="${dockLabelStyle}">Share</div>
              </div>
            </div>

            <div style="position:absolute; bottom:20px; left:24px; font-size:11px; color:#64748b; font-weight:800; letter-spacing:0.5px;">⚡ Swipe up for next</div>
          </div>
        `;
    }

    return `
      <div class="reel-card-inner" id="reelCard_${safeCardId}" data-time="${timeLimit}" data-id="${safeCardId}" style="position:relative; width:100%; height:100%; padding:0; background:linear-gradient(175deg, rgba(15,23,42,0.92) 0%, rgba(5,8,17,0.96) 100%); backdrop-filter:blur(16px); -webkit-backdrop-filter:blur(16px); border:1px solid rgba(255,255,255,0.08); border-radius:24px; display:flex; flex-direction:column; justify-content:space-between; box-shadow:0 24px 60px rgba(0,0,0,0.85); overflow:hidden; box-sizing:border-box;">
        
        <!-- Timer Bar -->
        <div style="width:100%; height:4px; background:rgba(255,255,255,0.05);">
            <div id="timerFill_${safeCardId}" style="height:100%; width:100%; background:${hookColor}; box-shadow:0 0 12px ${hookColor}; transition:width 0.1s linear;"></div>
        </div>

        <div style="padding:24px 20px; flex:1; display:flex; flex-direction:column; justify-content:center;">
            <div style="margin-bottom:14px;">
                <div style="font-size:10px; font-weight:900; letter-spacing:1px; color:${hookColor}; background:rgba(255,255,255,0.05); border:1px solid ${hookColor}; display:inline-block; padding:4px 10px; border-radius:8px; margin-bottom:8px;">
                    ${hook}
                </div>
                <!-- DYNAMIC TITLE INSTALLED HERE -->
                <div style="font-family:'Space Grotesk', system-ui, sans-serif; font-size:22px; font-weight:900; color:#fff; line-height:1.2; margin-bottom:4px;">${dynamicTitle}</div>
                <div style="font-size:11.5px; color:rgba(203,213,225,0.7); font-weight:700; text-transform:uppercase;">${sub} • ${card.topic}</div>
            </div>
            
            <div style="position:relative; z-index:10;">
                ${contentHTML}
            </div>
        </div>

        <!-- TWO-STAGE GLASS REVEAL DRAWER -->
        <div id="revealState_${safeCardId}" style="position:absolute; bottom:0; left:0; right:0; background:rgba(11,17,32,0.94); backdrop-filter:blur(24px); -webkit-backdrop-filter:blur(24px); border-top:1px solid rgba(255,255,255,0.12); padding:24px 20px; transform:translateY(100%); transition:transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); z-index:20; border-radius:24px 24px 0 0;">
            <div id="revealResultTitle_${safeCardId}" style="font-family:'Space Grotesk', system-ui, sans-serif; font-size:22px; font-weight:900; margin-bottom:8px;"></div>
            <div style="font-size:13px; color:#cbd5e1; line-height:1.5; margin-bottom:16px; padding:12px 14px; background:rgba(255,255,255,0.04); border-radius:12px; border:1px solid rgba(255,255,255,0.06);">
                ${card.trap || 'Review the core concepts in the Study Hub.'}
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
                <div style="display:flex; gap:8px;">
                    <span id="revealXpBadge_${safeCardId}" style="background:rgba(245,158,11,0.15); color:#fbbf24; font-weight:900; font-size:11px; padding:6px 12px; border-radius:8px; border:1px solid rgba(245,158,11,0.3);">+0 XP</span>
                    <span id="revealStreakBadge_${safeCardId}" style="display:none; background:rgba(244,63,94,0.15); color:#f43f5e; font-weight:900; font-size:11px; padding:6px 12px; border-radius:8px; border:1px solid rgba(244,63,94,0.3);">🔥 STREAK</span>
                </div>
            </div>
            <div style="text-align:center; font-size:11px; font-weight:800; color:#64748b; letter-spacing:1px;">↑ SWIPE FOR NEXT</div>
        </div>

        <div style="${dockStyle}">
          <div style="text-align:center;">
            <div style="${dockBtnStyle} border-color:var(--accent-cyan, #00f3ff); box-shadow:0 0 15px rgba(0,243,255,0.3);" onclick="sendReelToDoubtSolver('${qJS}', '${subJS}')">🧠</div>
            <div style="${dockLabelStyle}">Doubt</div>
          </div>
          <div style="text-align:center;">
            <div style="${dockBtnStyle}" onclick="reactStory('fire')">🔥</div>
            <div style="${dockLabelStyle}">Clout</div>
          </div>
          <div style="text-align:center;">
            <div style="${dockBtnStyle}" onclick="shareReel('${qJS}')">🚀</div>
            <div style="${dockLabelStyle}">Share</div>
          </div>
        </div>
      </div>
    `;
}

// ---------------------------------------------------
// TIMERS & GAMEPLAY CONTROLS
// ---------------------------------------------------
function startReelTimer(cardId) {
    if (activeReelTimers[cardId]) return; 
    const card = document.getElementById(`reelCard_${cardId}`);
    const fill = document.getElementById(`timerFill_${cardId}`);
    if (!card || !fill) return;

    const timeLimit = parseInt(card.getAttribute('data-time'), 10) * 1000;
    let timeLeft = timeLimit;
    
    activeReelTimers[cardId] = setInterval(() => {
        timeLeft -= 100;
        const percentage = Math.max(0, (timeLeft / timeLimit) * 100);
        fill.style.width = `${percentage}%`;

        if (timeLeft <= 0) {
            stopReelTimer(cardId);
            const grid = card.querySelector('.reel-options-grid');
            if (grid) handleReelAnswer(cardId, -1, -1, false, null);
            const matrix = card.querySelector('.build-matrix');
            if (matrix) window.checkBuildAnswer(cardId);
        }
    }, 100);
}

function stopReelTimer(cardId) {
    if (activeReelTimers[cardId]) {
        clearInterval(activeReelTimers[cardId]);
        delete activeReelTimers[cardId];
    }
}

// ---------------------------------------------------
// TWO-STAGE MCQ REVEAL
// ---------------------------------------------------
function handleReelAnswer(cardId, selectedIdx, correctIdx, isBoss, btnEl) {
    stopReelTimer(cardId);
    const card = document.getElementById(`reelCard_${cardId}`);
    const reveal = document.getElementById(`revealState_${cardId}`);
    const revealTitle = document.getElementById(`revealResultTitle_${cardId}`);
    const xpBadge = document.getElementById(`revealXpBadge_${cardId}`);
    const streakBadge = document.getElementById(`revealStreakBadge_${cardId}`);
    
    if (!card || !reveal) return;

    const buttons = card.querySelectorAll('.reel-opt-btn');
    buttons.forEach((btn, idx) => {
        btn.disabled = true;
        btn.style.opacity = '0.5';
        if (idx === correctIdx) {
            btn.style.opacity = '1';
            btn.classList.add('correct');
        }
    });

    const isCorrect = Number(selectedIdx) === Number(correctIdx);

    if (isCorrect) {
        if (typeof playDing === 'function') playDing();
        if (typeof triggerHaptic === 'function') triggerHaptic([30, 50]);
        if (typeof confetti === 'function') confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } });

        if (selectedIdx >= 0 && btnEl) {
            btnEl.classList.add('correct');
            const indicator = btnEl.querySelector('.opt-indicator');
            if (indicator) {
                indicator.style.background = '#10b981';
                indicator.style.borderColor = '#10b981';
            }
        }

        reelStreak++;
        const totalXP = (isBoss ? 50 : 20) + (reelStreak > 2 ? 10 : 0);
        revealTitle.innerHTML = `<span style="color:#10b981;">✓ CORRECT</span>`;
        xpBadge.innerText = `+${totalXP} XP`;
        if (reelStreak > 2) {
            streakBadge.style.display = 'inline-block';
            streakBadge.innerText = `🔥 x${reelStreak} STREAK`;
        }
        const xpEl = document.getElementById('xpCounter');
        if (xpEl) xpEl.textContent = parseInt(xpEl.textContent || '0', 10) + totalXP;
    } else {
        if (typeof playBuzz === 'function') playBuzz();
        if (typeof triggerHaptic === 'function') triggerHaptic([80]);

        if (selectedIdx >= 0 && btnEl) {
            btnEl.classList.add('wrong');
            const indicator = btnEl.querySelector('.opt-indicator');
            if (indicator) {
                indicator.style.background = '#ff007f';
                indicator.style.borderColor = '#ff007f';
            }
        }

        reelStreak = 0;
        revealTitle.innerHTML = `<span style="color:#ff007f;">✕ MISSED</span>`;
        xpBadge.innerText = `+0 XP`;
        xpBadge.style.background = 'rgba(255,255,255,0.05)';
        xpBadge.style.color = '#94a3b8';
    }

    setTimeout(() => { reveal.style.transform = 'translateY(0)'; }, 400);
}

function shareReel(text) {
    if (navigator.share) {
        navigator.share({ title: 'Invincible 360 Reel', text: `Can you solve this? ${text} 🔥 Join the clash on Invincible 360!`, url: window.location.href });
    } else {
        navigator.clipboard.writeText(`${text} - Solve on Invincible 360: ${window.location.href}`);
        alert('📋 Reel link copied to clipboard!');
    }
}

function sendReelToDoubtSolver(questionText, subject) {
    if (typeof switchTab === 'function') switchTab('doubt');
    const qInput = document.getElementById('question');
    if (qInput) qInput.value = questionText;
    
    if (subject) {
        document.querySelectorAll("#doubtSection .subject").forEach(b => {
            if (b.getAttribute('data-subject') && b.getAttribute('data-subject').toLowerCase() === subject.toLowerCase()) {
                b.click();
            }
        });
    }
}

/* =====================================================
   📸 STORIES & INSTA-FILTER STUDIO ENGINE
===================================================== */
let activeStories = [];
let currentStoryIdx = 0;
let storyTimer = null;
let currentStoryImageBase64 = null;
let selectedFilterCSS = "none";

const storyFilters = [
  { name: "Original", css: "none", color: "#94a3b8" },
  { name: "Topper Glow", css: "contrast(1.2) saturate(1.3)", color: "#f59e0b" },
  { name: "Midnight", css: "brightness(0.8) sepia(0.3) hue-rotate(180deg) saturate(1.5)", color: "#3b82f6" },
  { name: "Backbencher", css: "grayscale(1) contrast(1.2)", color: "#64748b" },
  { name: "Exam Blur", css: "blur(1px) contrast(1.1)", color: "#14b8a6" },
  { name: "Vintage", css: "sepia(0.8) contrast(1.1)", color: "#d97706" },
  { name: "Neon Physics", css: "hue-rotate(280deg) saturate(2) contrast(1.1)", color: "#d946ef" },
  { name: "X-Ray Vision", css: "invert(1) hue-rotate(180deg)", color: "#06b6d4" },
  { name: "Focus Mode", css: "brightness(0.9) contrast(1.3)", color: "#ef4444" },
  { name: "Cyberpunk", css: "hue-rotate(90deg) saturate(2) brightness(0.9)", color: "#10b981" },
  { name: "Late Night", css: "brightness(0.7) contrast(1.4)", color: "#1e293b" },
  { name: "Golden Hour", css: "sepia(0.4) saturate(1.5) hue-rotate(-15deg)", color: "#fbbf24" },
  { name: "Cool Blue", css: "hue-rotate(45deg) saturate(1.2)", color: "#38bdf8" },
  { name: "Dramatic", css: "contrast(1.5) grayscale(0.5)", color: "#475569" },
  { name: "Vivid", css: "saturate(2) contrast(1.1)", color: "#f43f5e" }
];

function renderFilters() {
  const tray = document.getElementById('filterTray');
  if(!tray) return;
  tray.innerHTML = storyFilters.map((f, idx) => `
    <button type="button" class="filter-btn ${idx === 0 ? 'active' : ''}" onclick="applyFilter(${idx}, this)" style="border:none; background:none; cursor:pointer;">
      <div class="filter-preview-box" style="width:50px; height:50px; border-radius:12px; background-color:${f.color}; filter:${f.css};"></div>
      <div class="filter-name" style="color:#fff; font-size:10px; text-align:center; margin-top:4px;">${f.name}</div>
    </button>
  `).join('');
}

function applyFilter(idx, btnEl) {
  if(typeof playDing === 'function') playDing();
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btnEl.classList.add('active');
  selectedFilterCSS = storyFilters[idx].css;
  const preview = document.getElementById('storyImagePreview');
  if(preview) preview.style.filter = selectedFilterCSS;
}

function handleStoryImage(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (evt) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_SIZE = 900;
      let width = img.width;
      let height = img.height;
      
      if (width > height && width > MAX_SIZE) {
        height *= MAX_SIZE / width;
        width = MAX_SIZE;
      } else if (height > MAX_SIZE) {
        width *= MAX_SIZE / height;
        height = MAX_SIZE;
      }
      
      canvas.width = width; 
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      currentStoryImageBase64 = canvas.toDataURL('image/jpeg', 0.65); 
      
      const preview = document.getElementById('storyImagePreview');
      if (preview) { 
        preview.src = currentStoryImageBase64; 
        preview.style.display = 'block'; 
      }
      const placeholder = document.getElementById('storyPlaceholderText');
      if (placeholder) placeholder.style.display = 'none';
    };
    img.src = evt.target.result;
  };
  reader.readAsDataURL(file);
}

const addStoryBtn = document.getElementById('btnAddStory');
if (addStoryBtn) {
  addStoryBtn.addEventListener('click', () => { 
    const m = document.getElementById('storyModal');
    if (m) { 
      m.style.display = 'flex'; 
      renderFilters(); 
    } else {
      alert("Story modal not found in HTML.");
    }
  });
}

async function loadActiveStories() {
    const container = document.getElementById('dynamicStoryCircles');
    if (!container) return;
    
    let studentSchool = localStorage.getItem('userSchool') || localStorage.getItem('testOrg') || 'ALL';

    try {
        const res = await fetch(`/api/stories?school_id=${encodeURIComponent(studentSchool)}&t=${Date.now()}`);
        const data = await res.json();
        const dbStories = Array.isArray(data.stories) ? data.stories : (Array.isArray(data) ? data : []);

        activeStories = dbStories.filter(s => studentSchool === 'ALL' || s.institution === studentSchool || !s.institution);
        renderStoryCircles();
    } catch(e) { 
        console.error("Story load error:", e); 
    }
}

function renderStoryCircles() {
    const container = document.getElementById('dynamicStoryCircles');
    if (!container) return;

    container.innerHTML = activeStories.map((s, idx) => {
        const author = String(s.author_name || s.author || s.name || "Student");
        const initial = author.charAt(0).toUpperCase() || "S";
        return `
        <div class="story-circle-item" onclick="openStoryViewer(${idx})" style="cursor:pointer;">
            <div class="story-avatar-wrap" style="width:54px; height:54px; border-radius:50%; background:linear-gradient(135deg, var(--accent-cyan, #00f3ff), #0284c7); padding:2px; margin-bottom:4px; border:1px solid rgba(0,243,255,0.3);">
                <div class="story-avatar-inner" style="width:100%; height:100%; border-radius:50%; background:#05070D; display:flex; align-items:center; justify-content:center; font-size:20px; font-weight:900; color:#fff;">${initial}</div>
            </div>
            <div class="story-username" style="font-size:10px; color:#94a3b8; text-align:center; max-width:60px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${safeEscapeHTML(author)}</div>
        </div>
        `;
    }).join('');
}

async function bakeImageWithFilter(base64Image, cssFilter) {
  return new Promise((resolve) => {
    if (!base64Image || cssFilter === "none") return resolve(base64Image);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width; canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.filter = cssFilter;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.65));
    };
    img.onerror = () => resolve(base64Image); 
    img.src = base64Image;
  });
}

const pubStoryBtn = document.getElementById('btnPublishStory');
if (pubStoryBtn) {
  pubStoryBtn.onclick = async () => {
    const name = document.getElementById('storyAuthorName')?.value.trim();
    const age = document.getElementById('storyAuthorAge')?.value.trim();
    const stuClass = document.getElementById('storyAuthorClass')?.value.trim();
    const inst = document.getElementById('storyInstitution')?.value.trim();
    const caption = document.getElementById('storyCaption')?.value.trim();

    if (!name) return alert("Please enter your Name.");
    
    pubStoryBtn.disabled = true;
    pubStoryBtn.textContent = "PROCESSING... ⏳";

    try {
        const finalImage = await bakeImageWithFilter(currentStoryImageBase64, selectedFilterCSS);
        pubStoryBtn.textContent = "UPLOADING... 🚀";

        const optimisticStory = {
            id: Date.now(),
            author_name: name,
            institution: inst || 'Invincible Coaching',
            caption: caption || '',
            media_url: finalImage || null,
            age: age,
            class_name: stuClass
        };
        activeStories.unshift(optimisticStory);
        renderStoryCircles(); 
        
        const storyModal = document.getElementById('storyModal');
        if (storyModal) storyModal.style.display = 'none';

        fetch('/api/stories', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ 
              action: 'create_story', 
              author_name: name, 
              institution: inst || 'Invincible Coaching',
              student_class: stuClass || '10',
              caption: caption || '',
              media_url: finalImage || null
            })
        }).then(async (res) => {
            const data = await res.json();
            if (data.story && data.story.id) {
              let myStoryIds = JSON.parse(localStorage.getItem('my_created_stories') || '[]');
              myStoryIds.push(data.story.id);
              localStorage.setItem('my_created_stories', JSON.stringify(myStoryIds));
            }
            loadActiveStories(); 
        }).catch(err => console.error(err));

        currentStoryImageBase64 = null;
        selectedFilterCSS = "none";
        const preview = document.getElementById('storyImagePreview');
        if (preview) { preview.style.display = 'none'; preview.style.filter = "none"; preview.src = ""; }
        const placeholder = document.getElementById('storyPlaceholderText');
        if (placeholder) placeholder.style.display = 'block';
        if (document.getElementById('storyCaption')) document.getElementById('storyCaption').value = '';
        
        if (typeof playWin === 'function') playWin();
        alert("🎉 Story Posted Successfully!");
    } catch(err) { 
        alert("Upload failed: " + err.message); 
    } finally {
        pubStoryBtn.disabled = false;
        pubStoryBtn.textContent = "🚀 POST STORY";
    }
  };
}

function getViewerIdentity() {
  let name = localStorage.getItem('studentName') || localStorage.getItem('userName');
  let school = localStorage.getItem('userSchool') || localStorage.getItem('testOrg');

  if (!name) {
    let guestId = localStorage.getItem('invincible_guest_id');
    if (!guestId) {
      guestId = Math.floor(1000 + Math.random() * 9000);
      localStorage.setItem('invincible_guest_id', guestId);
    }
    name = `Student #${guestId}`;
  }
  if (!school) school = 'Invincible Explorer';
  return { name, school };
}

async function recordStoryView(storyId) {
  if (!storyId) return;
  const { name, school } = getViewerIdentity();
  try {
    await fetch('/api/stories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'record_view', story_id: storyId, viewer_name: name, viewer_institution: school })
    });
  } catch (e) {}
}

async function fetchStoryViewers(storyId) {
  if (!storyId) return [];
  try {
    const res = await fetch(`/api/stories?action=get_viewers&story_id=${storyId}`);
    const data = await res.json();
    return Array.isArray(data.viewers) ? data.viewers : [];
  } catch (e) { return []; }
}

window.openStoryViewer = function(idx) {
  currentStoryIdx = idx;
  const viewer = document.getElementById('storyViewer');
  if (viewer) {
    viewer.style.display = 'flex';
    renderStorySlide();
  }
};

window.prevStorySlide = function() {
  if (currentStoryIdx > 0) {
    currentStoryIdx--;
    renderStorySlide();
  }
};

window.nextStorySlide = function() {
  if (currentStoryIdx < activeStories.length - 1) {
    currentStoryIdx++;
    renderStorySlide();
  } else {
    closeStoryViewer();
  }
};

async function deleteCurrentStory() {
  const story = activeStories[currentStoryIdx];
  if (!story) return;

  const myStoryIds = JSON.parse(localStorage.getItem('my_created_stories') || '[]').map(Number);
  const isMyStory = story.id && myStoryIds.includes(Number(story.id));
  const savedAdminPin = localStorage.getItem('story_admin_pin');

  let adminPin = savedAdminPin || null;

  if (!isMyStory && !adminPin) {
    adminPin = prompt("Enter Admin PIN to delete this story:");
    if (!adminPin) return;
  } else {
    if (!confirm("Are you sure you want to delete this story?")) return;
  }

  try {
    const res = await fetch('/api/stories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'delete_story',
        story_id: story.id,
        admin_key: adminPin || undefined
      })
    });

    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error || "Failed to delete");

    if (adminPin) {
      localStorage.setItem('story_admin_pin', adminPin);
    }

    alert("Story deleted successfully!");
    closeStoryViewer();
    loadActiveStories();
  } catch (err) {
    alert("Delete failed: " + err.message);
  }
}

function renderStorySlide() {
  clearTimeout(storyTimer);
  const story = activeStories[currentStoryIdx];
  if (!story) {
    closeStoryViewer();
    return;
  }

  if (story.id) recordStoryView(story.id);

  const authorDetailsEl = document.getElementById('viewerAuthorDetails');
  const schoolDetailsEl = document.getElementById('viewerSchoolDetails');
  const avatarEl = document.getElementById('viewerAvatar');
  const capEl = document.getElementById('viewerCaption');
  const bgImg = document.getElementById('viewerImageBg');

  const authorName = String(story.author_name || story.author || story.name || "Student");
  const ageText = story.age ? `, ${story.age}` : '';
  const classText = story.class_name ? ` • ${story.class_name}` : '';

  if (authorDetailsEl) authorDetailsEl.textContent = `${authorName}${ageText}${classText}`;
  if (schoolDetailsEl) schoolDetailsEl.textContent = `📍 ${story.institution || 'Invincible Coaching'}`;
  if (avatarEl) avatarEl.textContent = authorName.charAt(0).toUpperCase() || 'S';

  const deleteBtn = document.getElementById('viewerDeleteBtn');
  if (deleteBtn) {
    deleteBtn.style.display = 'inline-flex';
    deleteBtn.onclick = (e) => {
      e.stopPropagation();
      deleteCurrentStory();
    };
  }

  if (capEl) capEl.innerHTML = String(story.caption || '').replace(/\n/g, '<br>');

  const imageUrl = story.media_url || story.image_data || story.image_url || story.image;

  if (bgImg) {
    if (imageUrl && imageUrl.length > 50) {
      bgImg.src = imageUrl;
      bgImg.style.display = 'block';
    } else {
      bgImg.style.display = 'none';
    }
  }

  const rFire = document.getElementById('reactCountFire');
  const rMind = document.getElementById('reactCountMind');
  const r100 = document.getElementById('reactCount100');
  if (rFire) rFire.textContent = story.reactions_fire ? `(${story.reactions_fire})` : '';
  if (rMind) rMind.textContent = story.reactions_mind ? `(${story.reactions_mind})` : '';
  if (r100) r100.textContent = story.reactions_100 ? `(${story.reactions_100})` : '';

  const viewCountEl = document.getElementById('storyViewCount');
  if (viewCountEl && story.id) {
    fetchStoryViewers(story.id).then(viewers => {
      if (viewCountEl) viewCountEl.textContent = viewers.length;
    });
  }

  const pContainer = document.getElementById('storyProgressContainer');
  if (pContainer) {
    pContainer.innerHTML = activeStories.map((_, i) => `
      <div class="story-progress-seg" style="flex:1; height:3px; background:rgba(255,255,255,0.3); border-radius:3px; overflow:hidden;">
        <div class="story-progress-fill" style="height:100%; background:#fff; width: ${i < currentStoryIdx ? '100%' : (i === currentStoryIdx ? '100%' : '0%')}; transition: width 6s linear;"></div>
      </div>
    `).join('');
  }

  storyTimer = setTimeout(nextStorySlide, 6000);
}

window.openStoryViewersDrawer = async function() {
  clearTimeout(storyTimer);
  const story = activeStories[currentStoryIdx];
  if (!story || !story.id) return;

  const drawer = document.getElementById('storyViewersDrawer');
  const list = document.getElementById('storyViewersList');
  if (drawer) drawer.style.display = 'flex';
  if (list) list.innerHTML = '<div style="color:#94a3b8; font-size:12px; text-align:center; padding:16px 0;">Fetching live watchers...</div>';

  const viewers = await fetchStoryViewers(story.id);
  if (!viewers || viewers.length === 0) {
    list.innerHTML = `
      <div style="text-align:center; padding:24px 10px; color:#94a3b8;">
        <div style="font-size:24px; margin-bottom:4px;">👀</div>
        <div style="font-weight:700; font-size:13px; color:#fff;">No views yet</div>
        <div style="font-size:11px;">Be the first to share this story with classmates!</div>
      </div>
    `;
    return;
  }

  const reactionEmojiMap = { fire: '🔥', mind: '🤯', '100': '💯' };
  list.innerHTML = viewers.map(v => `
    <div class="viewer-row-item" style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.03); padding:10px; border-radius:12px;">
      <div style="display:flex; align-items:center; gap:8px;">
        <div style="width:28px; height:28px; border-radius:50%; background:rgba(0,243,255,0.15); border:1px solid var(--accent-cyan, #00f3ff); color:var(--accent-cyan, #00f3ff); font-size:11px; font-weight:800; display:flex; align-items:center; justify-content:center;">
          ${(v.viewer_name || 'S').charAt(0).toUpperCase()}
        </div>
        <div>
          <div style="font-size:12px; font-weight:800; color:#fff;">${safeEscapeHTML(v.viewer_name || 'Student')}</div>
          <div style="font-size:10px; color:#94a3b8;">${safeEscapeHTML(v.viewer_institution || 'Invincible Coaching')}</div>
        </div>
      </div>
      <div>${v.reaction ? `<span style="font-size:14px;">${reactionEmojiMap[v.reaction] || '🔥'}</span>` : '<span style="font-size:10px; color:#64748b;">Watched</span>'}</div>
    </div>
  `).join('');
};

window.closeStoryViewersDrawer = function() {
  const drawer = document.getElementById('storyViewersDrawer');
  if (drawer) drawer.style.display = 'none';
  storyTimer = setTimeout(nextStorySlide, 3500);
};

window.closeStoryViewer = function() {
  clearTimeout(storyTimer);
  const v = document.getElementById('storyViewer');
  if (v) v.style.display = 'none';
  closeStoryViewersDrawer();
};

window.reactStory = async function(type) {
  if (typeof playDing === 'function') playDing();
  if (typeof confetti === 'function') confetti({ particleCount: 30, spread: 40, origin: { y: 0.8 } });

  const story = activeStories[currentStoryIdx];
  if (!story || !story.id) return;
  const { name, school } = getViewerIdentity();

  try {
    await fetch('/api/stories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'react', story_id: story.id, reaction_type: type, viewer_name: name, viewer_institution: school })
    });
  } catch (e) {}
};

function saveStoryToVault() {
  if (typeof playWin === 'function') playWin();
  alert("💾 Saved to Gallery!");
}

/* =====================================================
   MULTI-FORMAT CREATOR STUDIO
===================================================== */
let activeCreatorFormat = 'hack';

function switchReelFormat(format) {
  activeCreatorFormat = format;
  const formats = ['hack', 'mcq', 'trap', 'formula'];
  
  formats.forEach(f => {
    const tabBtn = document.getElementById(`tabFormat_${f}`);
    if (tabBtn) {
      if (f === format) {
        tabBtn.style.background = 'rgba(0,243,255,0.18)';
        tabBtn.style.borderColor = 'var(--accent-cyan, #00f3ff)';
        tabBtn.style.color = 'var(--accent-cyan, #00f3ff)';
      } else {
        tabBtn.style.background = '#020617';
        tabBtn.style.borderColor = '#1e293b';
        tabBtn.style.color = '#94a3b8';
      }
    }
  });

  const hEl = document.getElementById('formatFields_hack');
  const mEl = document.getElementById('formatFields_mcq');
  const fEl = document.getElementById('formatFields_formula');

  if (hEl) hEl.style.display = (format === 'hack' || format === 'trap') ? 'flex' : 'none';
  if (mEl) mEl.style.display = format === 'mcq' ? 'flex' : 'none';
  if (fEl) fEl.style.display = format === 'formula' ? 'flex' : 'none';
}

async function handleMultiFormatReelSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById('btnPublishReel');
  const originalText = btn ? btn.innerText : "PUBLISH";
  if (btn) {
    btn.innerText = "PUBLISHING... ⏳";
    btn.disabled = true;
  }

  const subject = document.getElementById('creatorSubject')?.value || 'Science';
  const grade = document.getElementById('creatorGrade')?.value || '10';
  const topic = document.getElementById('creatorTopic')?.value?.trim() || 'Concept';
  const author = localStorage.getItem('studentName') || 'Topper Creator';
  const school = localStorage.getItem('userSchool') || 'Invincible Coaching';

  let payload = {
    class_name: grade,
    type: activeCreatorFormat,
    subject: subject,
    topic: topic,
    author_name: author,
    school_name: school,
    views_count: 1,
    likes_count: 0
  };

  if (activeCreatorFormat === 'mcq') {
    const qText = document.getElementById('creatorMcqQuestion')?.value?.trim();
    const optA = document.getElementById('creatorOptA')?.value?.trim();
    const optB = document.getElementById('creatorOptB')?.value?.trim();
    const optC = document.getElementById('creatorOptC')?.value?.trim();
    const optD = document.getElementById('creatorOptD')?.value?.trim();

    if (!qText || !optA || !optB) {
      alert("Please provide the question and options.");
      if (btn) { btn.innerText = originalText; btn.disabled = false; }
      return;
    }

    payload.q_en = qText;
    payload.options = JSON.stringify([optA, optB, optC, optD]);
    payload.answer = 0;
  } else if (activeCreatorFormat === 'formula') {
    payload.title = topic;
    payload.formula = document.getElementById('creatorFormulaLatex')?.value?.trim() || '';
    payload.tip = document.getElementById('creatorFormulaTip')?.value?.trim() || '';
  } else {
    payload.title = document.getElementById('creatorHackTitle')?.value?.trim() || topic;
    payload.content = document.getElementById('creatorHackContent')?.value?.trim() || '';
    payload.rule = document.getElementById('creatorHackRule')?.value?.trim() || 'Focus on NCERT definitions.';
  }

  try {
    if (window.supabase) {
      const sbClient = window.supabase.createClient(
        'https://cbgwbzidkmcefoithipp.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiZ3diemlka21jZWZvaXRoaXBwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyMDgyNTQsImV4cCI6MjEwMTc4NDI1NH0.gJq3-0tU-8fxdF0Y_1_qcet_VYp7gysv5yWfl_o8T0g'
      );

      const { error } = await sbClient.from('study_reels').insert([payload]);
      if (error) throw error;
    }

    const xpEl = document.getElementById('xpCounter');
    if (xpEl) {
      const cur = parseInt(xpEl.textContent || '680', 10);
      xpEl.textContent = cur + 75;
    }

    const modal = document.getElementById('reelCreatorModal');
    if (modal) modal.style.display = 'none';

    if (typeof playWin === 'function') playWin();
    if (typeof confetti === 'function') confetti({ particleCount: 70, spread: 60 });
    
    alert(`🎉 Published globally! You earned +75 XP as a Topper Creator.`);
    await renderReelsDeck();
  } catch (err) {
    alert("Publishing notice: " + err.message);
  } finally {
    if (btn) {
      btn.innerText = originalText;
      btn.disabled = false;
    }
  }
}

// ---------------------------------------------------
// BOOTSTRAP INIT
// ---------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    loadActiveStories();
    renderReelsDeck();
});
