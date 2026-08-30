/* =====================================================
   CLEAN SEPARATION 8-TAB NAVIGATION ENGINE
===================================================== */
function switchTab(tab) {
    const dockButtons = document.querySelectorAll('.dock-btn, .premium-dock-btn');
    dockButtons.forEach(b => b.classList.remove('active'));
    
    const tabMap = { 'home': 0, 'reels': 1, 'doubt': 2, 'arena': 3, 'lab': 4, 'test': 4, 'feed': 4, 'notes': 4 };
    if (tabMap[tab] !== undefined && dockButtons[tabMap[tab]]) {
        dockButtons[tabMap[tab]].classList.add('active');
    }

    const sections = ['home', 'reels', 'lab', 'doubt', 'test', 'arena', 'feed', 'notes'];
    sections.forEach(s => {
        const el = document.getElementById(s + 'Section');
        if (el) el.classList.add('hidden');
    });

    const targetId = tab + 'Section';
    const target = document.getElementById(targetId);
    if (target) target.classList.remove('hidden');
    
    if (tab === 'reels' && typeof renderReelsDeck === 'function') renderReelsDeck();
    if (tab === 'feed' && typeof fetchSchoolPosts === 'function') fetchSchoolPosts();
    
    // WAKE UP THE LAB ENGINE
    if (tab === 'lab' && typeof window.renderLabHome === 'function') {
        window.renderLabHome();
    }

    // Stop canvas render loop if navigating away from lab
    if (tab !== 'lab' && typeof window.closeLabSim === 'function') window.closeLabSim();

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
