/* =====================================================
   AUDIO SYNTHESIS ENGINE & SOUNDSCAPES (COLLISION-SAFE)
===================================================== */
let currentLofiMode = 0; 
let activeLofiNodes = [];

function getGlobalAudioContext() {
  if (!window._invAudioCtx) {
    const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
    if (AudioCtxClass) {
      window._invAudioCtx = new AudioCtxClass();
    }
  }
  if (window._invAudioCtx && window._invAudioCtx.state === 'suspended') {
    window._invAudioCtx.resume();
  }
  return window._invAudioCtx;
}

function playSound(type, freq, duration, vol = 0.1) {
    try {
        const ctx = getGlobalAudioContext();
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type; 
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(vol, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
        osc.connect(gain); 
        gain.connect(ctx.destination);
        osc.start(); 
        osc.stop(ctx.currentTime + duration);
    } catch(e){}
}

function playDing() { playSound('sine', 880, 0.1); setTimeout(() => playSound('sine', 1760, 0.25), 90); }
function playBuzz() { playSound('sawtooth', 140, 0.25, 0.2); }
function playWin() { playSound('square', 440, 0.15); setTimeout(() => playSound('square', 554, 0.15), 150); setTimeout(() => playSound('square', 659, 0.35), 300); }
function playTick() { playSound('triangle', 950, 0.03, 0.05); }
function playComboDrop(multiplier = 1) {
  playSound('sawtooth', 180 + (multiplier * 45), 0.2, 0.18);
  setTimeout(() => playSound('sine', 440 + (multiplier * 60), 0.25, 0.15), 60);
}

function stopLofiAudio() {
    activeLofiNodes.forEach(n => { try { n.stop(); n.disconnect(); } catch(e){} });
    activeLofiNodes = [];
}

function toggleLofiAudio() {
    const ctx = getGlobalAudioContext();
    if (!ctx) return;
    stopLofiAudio();
    currentLofiMode = (currentLofiMode + 1) % 9;
    const label = document.getElementById('lofiLabel');

    if (currentLofiMode === 0) { 
        if (label) label.textContent = 'Sound: Off'; 
        return; 
    }
    
    let gainNode = ctx.createGain(); 
    gainNode.connect(ctx.destination);

    const soundNames = [
        "", "Alpha 108Hz", "Theta 432Hz", "Brown Noise",
        "Pink Noise", "Rain Ambiance", "Pulse 528Hz",
        "Deep Drone", "Spark Wave"
    ];
    if (label) label.textContent = soundNames[currentLofiMode];

    if (currentLofiMode === 1) {
        let o1 = ctx.createOscillator(); o1.type = 'sine'; o1.frequency.value = 108;
        let o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = 112;
        gainNode.gain.value = 0.05; o1.connect(gainNode); o2.connect(gainNode); o1.start(); o2.start();
        activeLofiNodes.push(o1, o2);
    } else if (currentLofiMode === 2) {
        let osc = ctx.createOscillator(); osc.type = 'triangle'; osc.frequency.value = 432;
        gainNode.gain.value = 0.03; osc.connect(gainNode); osc.start(); activeLofiNodes.push(osc);
    } else if (currentLofiMode === 3 || currentLofiMode === 4 || currentLofiMode === 5) {
        let bufferSize = ctx.sampleRate * 2; 
        let buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        let output = buffer.getChannelData(0); 
        let lastOut = 0;
        for (let i = 0; i < bufferSize; i++) {
            let white = Math.random() * 2 - 1;
            if(currentLofiMode === 3) { output[i] = (lastOut + (0.02 * white)) / 1.02; lastOut = output[i]; output[i] *= 3.5; }
            else if(currentLofiMode === 4) { output[i] = (lastOut + (0.05 * white)) / 1.05; lastOut = output[i]; output[i] *= 2; }
            else { output[i] = white * 0.15; }
        }
        let noise = ctx.createBufferSource(); 
        noise.buffer = buffer; 
        noise.loop = true;
        if(currentLofiMode === 5) {
            let filter = ctx.createBiquadFilter(); 
            filter.type = 'lowpass'; 
            filter.frequency.value = 800;
            gainNode.gain.value = 0.06; 
            noise.connect(filter); 
            filter.connect(gainNode);
        } else {
            gainNode.gain.value = 0.06; 
            noise.connect(gainNode);
        }
        noise.start(); 
        activeLofiNodes.push(noise);
    } else if (currentLofiMode === 6) {
        let o1 = ctx.createOscillator(); o1.type = 'sine'; o1.frequency.value = 528;
        let o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = 534;
        gainNode.gain.value = 0.03; o1.connect(gainNode); o2.connect(gainNode); o1.start(); o2.start();
        activeLofiNodes.push(o1, o2);
    } else if (currentLofiMode === 7) {
        let osc = ctx.createOscillator(); osc.type = 'sawtooth'; osc.frequency.value = 60;
        let filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 140;
        gainNode.gain.value = 0.06; osc.connect(filter); filter.connect(gainNode); osc.start(); activeLofiNodes.push(osc);
    } else if (currentLofiMode === 8) {
        let osc = ctx.createOscillator(); osc.type = 'sine'; osc.frequency.value = 10000;
        gainNode.gain.value = 0.008; osc.connect(gainNode); osc.start(); activeLofiNodes.push(osc);
    }
}

let currentTtsAudio = null;

async function playAudioExplanation(textToRead, btnElement) {
  try {
    if (currentTtsAudio) {
      currentTtsAudio.pause();
      currentTtsAudio = null;
      if (btnElement) btnElement.innerHTML = "🔊 Listen";
      return;
    }

    if (btnElement) btnElement.innerHTML = "⏳ Generating...";

    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: textToRead,
        languageCode: "hi-IN",
        speakingRate: 1.05
      })
    });

    const data = await res.json();
    if (!data.success || !data.audioBase64) {
      throw new Error(data.error || "Audio generation failed");
    }

    currentTtsAudio = new Audio(data.audioBase64);
    if (btnElement) btnElement.innerHTML = "⏹️ Stop";

    currentTtsAudio.play();
    currentTtsAudio.onended = () => {
      if (btnElement) btnElement.innerHTML = "🔊 Listen";
      currentTtsAudio = null;
    };
  } catch (err) {
    alert("Audio error: " + err.message);
    if (btnElement) btnElement.innerHTML = "🔊 Listen";
  }
}
