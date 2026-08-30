/* =====================================================
   CLEAN SEPARATION 8-TAB NAVIGATION ENGINE (FIXED)
===================================================== */
function switchTab(tab) {
    // Safely toggle active states based on data-tab attribute or class matching
    const dockButtons = document.querySelectorAll('.dock-btn, .premium-dock-btn');
    dockButtons.forEach(b => {
        b.classList.remove('active');
        if (b.getAttribute('data-tab') === tab || (b.getAttribute('onclick') && b.getAttribute('onclick').includes(tab))) {
            b.classList.add('active');
        }
    });

    // Hide all sections cleanly
    const sections = ['home', 'reels', 'lab', 'doubt', 'test', 'arena', 'feed', 'notes'];
    sections.forEach(s => {
        const el = document.getElementById(s + 'Section');
        if (el) el.classList.add('hidden');
    });

    // Reveal target section
    const targetId = tab + 'Section';
    const target = document.getElementById(targetId);
    if (target) {
        target.classList.remove('hidden');
    }
    
    // Defer heavy initializations slightly so the DOM layout finishes rendering first
    setTimeout(() => {
        if (tab === 'reels' && typeof renderReelsDeck === 'function') {
            renderReelsDeck();
        }
        if (tab === 'feed' && typeof fetchSchoolPosts === 'function') {
            fetchSchoolPosts();
        }
        // WAKE UP THE LAB ENGINE
        if (tab === 'lab' && typeof window.renderLabHome === 'function') {
            window.renderLabHome();
        }
    }, 30);

    // Stop canvas render loop if navigating away from lab
    if (tab !== 'lab' && typeof window.closeLabSim === 'function') {
        window.closeLabSim();
    }

    if (typeof playDing === 'function') playDing();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function selectStartingQuest(quest) {
    localStorage.setItem('invincible_onboarded', 'true');
    const modal = document.getElementById('onboardingModal');
    if (modal) modal.style.display = 'none';
    switchTab(quest);
}

setTimeout(() => { 
    const isVerified = localStorage.getItem('student_verified') === 'true';
    if (isVerified && !localStorage.getItem('invincible_onboarded')) { 
        const m = document.getElementById('onboardingModal'); 
        if(m) m.style.display = 'flex'; 
    } 
}, 800);
