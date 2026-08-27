/* =====================================================
   CORE DATA LOADING & MULTI-TENANT IDENTITY SYNC
===================================================== */
async function checkAuth() {
  try {
      if (typeof window.supabase !== 'undefined') {
          const { data: { session } } = await window.supabase.auth.getSession();
          if (session && session.user) {
              const metadata = session.user.user_metadata || {};
              if (metadata.school_id) {
                  localStorage.setItem('userSchool', metadata.school_id);
                  localStorage.setItem('testOrg', metadata.school_id);
              }
              if (metadata.name) {
                  localStorage.setItem('studentName', metadata.name);
              }
          }
      }
  } catch(e) {}
}

async function loadPlatformData(){
    try{
        await checkAuth(); 
        const response = await fetch('/api/get-questions');
        const data = await response.json();

        if (data && data.reelDeck && Array.isArray(data.reelDeck)) {
            if (typeof cachedReelDeck !== 'undefined') {
                cachedReelDeck = data.reelDeck;
            }
        }

        if (data && data.dailyPuzzle && typeof renderDailyPuzzle === 'function') {
          renderDailyPuzzle(data.dailyPuzzle);
        }

        if(data && Array.isArray(data.leaderboard) && data.leaderboard.length > 0){
            const top3 = data.leaderboard.slice(0, 3);
            const rest = data.leaderboard.slice(3, 7);

            const getSchool = (item) => item.organization || item.school_name || item.school || item.institution || `Class ${item.student_class || '10'}`;

            const podiumEl = document.getElementById("podiumContainer");
            if (podiumEl) {
              podiumEl.innerHTML = top3.map((item, idx) => `
                  <div class="podium-item podium-${idx+1}">
                      <div class="podium-avatar">${idx === 0 ? '👑' : (idx === 1 ? '🥈' : '🥉')}</div>
                      <div class="podium-name">${escapeHTML(item.student_name)}</div>
                      <div style="font-size:8px; color:var(--accent-cyan); max-width:70px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHTML(getSchool(item))}</div>
                      <div class="podium-score">${item.percentage}%</div>
                  </div>
              `).join('');
            }

            const listEl = document.getElementById("leaderboardList");
            if (listEl) {
              listEl.innerHTML = rest.map((item, idx) => `
                  <div class="clout-row">
                      <span>#${idx+4} ${escapeHTML(item.student_name)} <span style="color:var(--accent-cyan); font-size:10px;">(${escapeHTML(getSchool(item))})</span></span>
                      <span style="color:var(--accent-emerald);">${item.percentage}%</span>
                  </div>
              `).join('');
            }

            const lb = document.getElementById("leaderboardBox");
            if (lb) lb.style.display = "block";
        }
    }catch(error){ console.error(error); }
}

/* =====================================================
   INITIALIZATION & EVENT BINDING
===================================================== */
window.addEventListener('DOMContentLoaded', () => { 
    setTimeout(loadPlatformData, 300); 
    
    if (typeof loadActiveStories === 'function') loadActiveStories();
    if (typeof initBlitzCountdown === 'function') initBlitzCountdown();
    if (typeof updatePowerupUI === 'function') updatePowerupUI();
    if (typeof loadBountyMarket === 'function') loadBountyMarket(); 
    
    // Initialize Lab Matrix
    if (typeof window.filterLabMatrix === 'function') {
        window.filterLabMatrix(10, document.querySelector('.curr-tab.active'));
    }
    
    const isVerified = localStorage.getItem('student_verified') === 'true';
    if (!isVerified) {
        const inviteModal = document.getElementById('studentInviteModal');
        if (inviteModal) inviteModal.style.display = 'flex';
    }
    
    const passBtns = document.querySelectorAll('#blitzPassBtn, [data-action="blitz-pass"]');
    passBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        if (typeof handleGetBlitzPass === 'function') handleGetBlitzPass();
      });
    });

    setTimeout(() => {
        const savedClass = localStorage.getItem('invincible_user_class') || "10";
        const btn = document.querySelector(`.reel-class-btn[data-class="${savedClass}"]`);
        if (typeof setReelsClass === 'function') setReelsClass(savedClass, btn);
    }, 200);

    // Start Boss Raid Countdown
    setInterval(() => {
        const d = new Date();
        const diff = (24 - d.getHours()) + "h " + (60 - d.getMinutes()) + "m";
        const ticker = document.getElementById('blitzCountdownTicker');
        if (ticker) ticker.textContent = "⚡ FRIDAY BOSS RAID IN: " + diff;
    }, 60000);
});
