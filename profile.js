/* =====================================================
   ⚡ INVINCIBLE 360 - GAMING PROFILE & XP PROGRESSION ENGINE
   - Dynamic Leveling Tiers (Novice to Invincible Grandmaster)
   - Real-Time Level XP Progress Ring & Bar
   - Achievement Badges Showcase with Unlock Checks
   - Combat & Study Telemetry (Reels, Arena, Lab, Tests)
===================================================== */

const LEVEL_TIERS = [
  { level: 1, title: "Novice Explorer", minXP: 0, maxXP: 250, badge: "🌱", color: "#94a3b8" },
  { level: 2, title: "Curious Scholar", minXP: 250, maxXP: 600, badge: "⚡", color: "#38bdf8" },
  { level: 3, title: "Concept Crusher", minXP: 600, maxXP: 1200, badge: "🔥", color: "#f59e0b" },
  { level: 4, title: "Arena Gladiator", minXP: 1200, maxXP: 2000, badge: "⚔️", color: "#f43f5e" },
  { level: 5, title: "Board Strategist", minXP: 2000, maxXP: 3200, badge: "🧠", color: "#a855f7" },
  { level: 6, title: "Lab Alchemist", minXP: 3200, maxXP: 5000, badge: "🧪", color: "#10b981" },
  { level: 7, title: "Invincible Grandmaster", minXP: 5000, maxXP: 10000, badge: "👑", color: "#00e5ff" }
];

const BADGE_REGISTRY = [
  { id: "first_blood", name: "First Blood", desc: "Win your first 1v1 Arena match", icon: "🗡️", check: (xp) => xp >= 100 },
  { id: "streak_master", name: "On Fire", desc: "Maintain a 3+ day streak", icon: "🔥", check: () => parseInt(localStorage.getItem('streak_days') || '2', 10) >= 3 },
  { id: "lab_rat", name: "Lab Pioneer", desc: "Complete a Science Lab experiment", icon: "🔬", check: (xp) => xp >= 300 },
  { id: "speed_demon", name: "Speed Demon", desc: "Solve 5 reels with lightning speed", icon: "⚡", check: (xp) => xp >= 450 },
  { id: "test_ace", name: "Mock Champion", desc: "Score 80%+ on any chapter test", icon: "🎯", check: (xp) => xp >= 600 },
  { id: "grandmaster", name: "Top 1%", desc: "Surpass 2,000 Lifetime XP", icon: "👑", check: (xp) => xp >= 2000 }
];

function getPlayerLevelInfo(currentXP) {
  for (let i = LEVEL_TIERS.length - 1; i >= 0; i--) {
    if (currentXP >= LEVEL_TIERS[i].minXP) {
      const tier = LEVEL_TIERS[i];
      const xpInLevel = currentXP - tier.minXP;
      const totalLevelSpan = tier.maxXP - tier.minXP;
      const progressPct = Math.min(100, Math.round((xpInLevel / totalLevelSpan) * 100));
      return { ...tier, xpInLevel, totalLevelSpan, progressPct };
    }
  }
  return { ...LEVEL_TIERS[0], xpInLevel: currentXP, totalLevelSpan: 250, progressPct: 0 };
}

window.openPlayerProfile = function() {
  const existing = document.getElementById('playerProfileModal');
  if (existing) existing.remove();

  const currentXP = parseInt(localStorage.getItem('student_xp') || document.getElementById('xpCounter')?.textContent || '680', 10);
  const studentName = localStorage.getItem('studentName') || 'Champion';
  const studentSchool = localStorage.getItem('userSchool') || localStorage.getItem('testOrg') || 'Invincible Coaching';
  const studentClass = localStorage.getItem('invincible_user_class') || '10';
  const streakDays = localStorage.getItem('streak_days') || '2';
  
  const levelInfo = getPlayerLevelInfo(currentXP);

  const badgesHTML = BADGE_REGISTRY.map(b => {
    const isUnlocked = b.check(currentXP);
    return `
      <div style="background:${isUnlocked ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)'}; border:1px solid ${isUnlocked ? 'rgba(0,229,255,0.3)' : 'rgba(255,255,255,0.05)'}; border-radius:14px; padding:12px; display:flex; align-items:center; gap:10px; opacity:${isUnlocked ? '1' : '0.4'};">
        <div style="font-size:24px; filter:${isUnlocked ? 'none' : 'grayscale(1)'};">${b.icon}</div>
        <div style="flex:1;">
          <div style="font-size:12px; font-weight:900; color:${isUnlocked ? '#fff' : '#94a3b8'};">${b.name}</div>
          <div style="font-size:10px; color:#64748b; margin-top:2px;">${b.desc}</div>
        </div>
        ${isUnlocked ? '<span style="color:#10b981; font-size:10px; font-weight:900;">UNLOCKED</span>' : '<span style="color:#64748b; font-size:10px;">LOCKED</span>'}
      </div>
    `;
  }).join('');

  const modalHtml = `
    <div id="playerProfileModal" class="bottom-sheet-overlay open" onclick="closePlayerProfile()" style="z-index:100005;">
      <div class="bottom-sheet-content" onclick="event.stopPropagation()" style="max-height:85vh; overflow-y:auto;">
        <div class="sheet-handle"></div>

        <!-- Identity Header -->
        <div style="display:flex; align-items:center; gap:14px; margin-bottom:20px;">
          <div style="width:58px; height:58px; border-radius:50%; background:linear-gradient(135deg, ${levelInfo.color}, #0284c7); display:flex; align-items:center; justify-content:center; font-size:26px; box-shadow:0 0 20px ${levelInfo.color}66; flex-shrink:0;">
            ${levelInfo.badge}
          </div>
          <div style="flex:1;">
            <div style="display:flex; align-items:center; gap:8px;">
              <h2 style="font-family:'Space Grotesk',sans-serif; font-size:20px; font-weight:900; color:#fff; margin:0;">${studentName}</h2>
              <span style="font-size:9px; font-weight:900; background:${levelInfo.color}22; color:${levelInfo.color}; border:1px solid ${levelInfo.color}44; padding:2px 6px; border-radius:6px;">LVL ${levelInfo.level}</span>
            </div>
            <div style="font-size:11px; color:#94a3b8; font-weight:700; margin-top:2px;">${studentSchool} • Class ${studentClass}</div>
          </div>
        </div>

        <!-- Level Tier Card -->
        <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:18px; padding:16px; margin-bottom:20px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <span style="font-size:12px; font-weight:800; color:${levelInfo.color};">${levelInfo.title}</span>
            <span style="font-size:11px; font-family:monospace; color:#cbd5e1; font-weight:700;">${currentXP} / ${levelInfo.maxXP} XP</span>
          </div>
          <div style="background:rgba(255,255,255,0.06); height:8px; border-radius:4px; overflow:hidden; margin-bottom:8px;">
            <div style="width:${levelInfo.progressPct}%; height:100%; background:${levelInfo.color}; box-shadow:0 0 10px ${levelInfo.color}; transition:width 0.4s ease;"></div>
          </div>
          <div style="font-size:10px; color:#64748b; font-weight:700; text-align:right;">${levelInfo.maxXP - currentXP} XP until Level ${levelInfo.level + 1}</div>
        </div>

        <!-- Stats Grid -->
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:20px;">
          <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:14px; padding:12px; text-align:center;">
            <div style="font-size:18px;">🔥</div>
            <div style="font-size:18px; font-weight:900; color:#fff; margin:2px 0;">${streakDays} Days</div>
            <div style="font-size:10px; color:#64748b; font-weight:800;">CURRENT STREAK</div>
          </div>
          <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:14px; padding:12px; text-align:center;">
            <div style="font-size:18px;">✨</div>
            <div style="font-size:18px; font-weight:900; color:var(--accent-cyan); margin:2px 0;">${currentXP}</div>
            <div style="font-size:10px; color:#64748b; font-weight:800;">LIFETIME XP</div>
          </div>
        </div>

        <!-- Achievements Showcase -->
        <div style="margin-bottom:12px;">
          <h4 style="font-family:'Space Grotesk',sans-serif; font-size:14px; font-weight:900; color:#fff; margin:0 0 10px 0;">🏆 BADGES & TROPHIES</h4>
          <div style="display:flex; flex-direction:column; gap:8px;">
            ${badgesHTML}
          </div>
        </div>

        <button type="button" class="solid-cta" onclick="closePlayerProfile()" style="margin-top:16px;">CLOSE PROFILE</button>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  if (typeof playDing === 'function') playDing();
};

window.closePlayerProfile = function() {
  const modal = document.getElementById('playerProfileModal');
  if (modal) modal.remove();
};
