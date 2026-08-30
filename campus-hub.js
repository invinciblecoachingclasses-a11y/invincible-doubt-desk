/* =====================================================
   CAMPUS HUB / LIVE GPS PROXIMITY RADAR (PRIVACY-SAFE)
==================================================== */
let currentCategoryFilter = 'ALL';
let allSchoolPosts = [];

const CampusRadarEngine = {
    canvasId: 'campusRadarCanvas',
    loop: null,
    w: 0, h: 0,
    ctx: null,
    frame: 0,
    userLocation: null,
    nearbyPeers: [],
    mode: 'schools', // 'schools' or 'live_gps'
    schools: [],
    
    init: function(container) {
        const old = document.getElementById('radarWrapper');
        if (old) {
            if(this.loop) cancelAnimationFrame(this.loop);
            old.remove();
        }

        const wrapper = document.createElement('div');
        wrapper.id = 'radarWrapper';
        wrapper.style.cssText = "width:100%; border-radius:16px; overflow:hidden; border:1px solid rgba(0,229,255,0.2); margin-bottom:20px; box-shadow:0 10px 30px rgba(0,0,0,0.5); position:relative; background:#020617;";
        
        wrapper.innerHTML = `
            <div style="position:absolute; top:12px; left:16px; font-size:12px; font-weight:900; color:var(--accent-cyan); letter-spacing:1px; z-index:10; display:flex; align-items:center; gap:6px;">
                <span class="pulse-dot" style="display:inline-block; width:8px; height:8px; background:var(--accent-cyan); border-radius:50%; box-shadow:0 0 10px var(--accent-cyan);"></span>
                <span id="radarModeText">SECTOR RADAR</span>
            </div>
            
            <button id="activateGpsBtn" onclick="CampusRadarEngine.requestLocation()" style="position:absolute; top:12px; right:16px; font-size:10px; font-weight:800; color:#020617; background:var(--accent-cyan); border:none; padding:6px 10px; border-radius:8px; z-index:20; cursor:pointer; box-shadow:0 0 15px rgba(0,229,255,0.4);">
                📍 FIND PEERS
            </button>

            <canvas id="${this.canvasId}" style="width:100%; height:260px; display:block;"></canvas>
        `;

        container.insertBefore(wrapper, container.firstChild);

        const canvas = document.getElementById(this.canvasId);
        if (!canvas) return;

        this.ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        
        canvas.width = (rect.width || 320) * dpr;
        canvas.height = 260 * dpr;
        this.ctx.scale(dpr, dpr);
        
        this.w = canvas.width / dpr;
        this.h = canvas.height / dpr;
        
        this.generateSchoolNodes();
        this.render();
    },

    requestLocation: function() {
        const btn = document.getElementById('activateGpsBtn');
        if (btn) btn.innerText = "LOCATING... ⏳";

        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser.");
            if (btn) btn.innerText = "📍 FIND PEERS";
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                this.userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                this.mode = 'live_gps';
                document.getElementById('radarModeText').innerText = "LIVE PROXIMITY RADAR";
                if (btn) btn.style.display = 'none';
                
                // Fetch/Simulate live peers based on user coordinates
                this.fetchNearbyPeers();
            },
            (error) => {
                alert("Location access denied. Enable GPS to find nearby challengers.");
                if (btn) btn.innerText = "📍 FIND PEERS";
            },
            { enableHighAccuracy: true }
        );
    },

    fetchNearbyPeers: function() {
        // In a real backend, you would send this.userLocation to Supabase.
        // For now, we simulate finding 5-10 random active students within 15km.
        const numPeers = Math.floor(Math.random() * 8) + 5;
        this.nearbyPeers = [];

        for (let i = 0; i < numPeers; i++) {
            const distanceKm = Math.random() * 15; // 0 to 15km away
            const angle = Math.random() * Math.PI * 2;
            
            this.nearbyPeers.push({
                id: i,
                distance: distanceKm,
                angle: angle,
                school: i % 2 === 0 ? "DVM Public" : "Modern DAV",
                isLookingForMatch: Math.random() > 0.7,
                color: Math.random() > 0.5 ? '#f43f5e' : '#f59e0b'
            });
        }
    },

    generateSchoolNodes: function() {
        const schoolNames = ["Invincible", "DVM Public", "RSP Global", "Modern DAV", "Composite Kulesra", "Bharat Public", "Yashdeep", "Heritage"];
        this.schools = schoolNames.map((name, i) => {
            const angle = (i / schoolNames.length) * Math.PI * 2;
            const radius = 40 + Math.random() * 60; 
            return {
                id: i, name: name, x: this.w/2 + Math.cos(angle) * radius, y: this.h/2 + Math.sin(angle) * radius,
                baseRadius: 4, activity: 0, color: i === 0 ? '#00e5ff' : (i % 2 === 0 ? '#10b981' : '#f59e0b')
            };
        });
    },

    updateActivity: function(postsData) {
        if (this.mode !== 'schools') return;
        this.schools.forEach(s => s.activity = 0.5);
        postsData.forEach(p => {
            const match = this.schools.find(s => p.school_name && p.school_name.includes(s.name.split(' ')[0]));
            if (match) match.activity += 2 + (p.upvotes || 0) * 0.5;
        });
    },

    render: function() {
        this.frame++;
        this.ctx.fillStyle = 'rgba(2, 6, 23, 0.2)'; 
        this.ctx.fillRect(0, 0, this.w, this.h);

        const cx = this.w / 2;
        const cy = this.h / 2;

        // Radar Sweep Line
        this.ctx.save();
        this.ctx.translate(cx, cy);
        this.ctx.rotate(this.frame * 0.03);
        const grad = this.ctx.createLinearGradient(0, 0, 0, -120);
        grad.addColorStop(0, 'rgba(0, 229, 255, 0.4)');
        grad.addColorStop(1, 'rgba(0, 229, 255, 0)');
        this.ctx.fillStyle = grad;
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.arc(0, 0, 120, -Math.PI/2, -Math.PI/2 + 0.6);
        this.ctx.fill();
        this.ctx.restore();

        // Grid Rings
        this.ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        this.ctx.lineWidth = 1;
        [40, 80, 120].forEach((r, idx) => {
            this.ctx.beginPath(); this.ctx.arc(cx, cy, r, 0, Math.PI*2); this.ctx.stroke();
            if (this.mode === 'live_gps') {
                this.ctx.fillStyle = 'rgba(255,255,255,0.3)';
                this.ctx.font = '8px Space Grotesk';
                this.ctx.fillText(`${(idx+1)*5}km`, cx + 2, cy - r - 2);
            }
        });

        if (this.mode === 'live_gps') {
            // Render YOU at the center
            this.ctx.beginPath(); this.ctx.arc(cx, cy, 6, 0, Math.PI * 2);
            this.ctx.fillStyle = '#00e5ff'; this.ctx.shadowBlur = 15; this.ctx.shadowColor = '#00e5ff'; this.ctx.fill();
            this.ctx.shadowBlur = 0;
            this.ctx.fillStyle = '#fff'; this.ctx.font = '10px Space Grotesk'; this.ctx.fillText("YOU", cx - 10, cy + 16);

            // Render live peers based on distance
            this.nearbyPeers.forEach(p => {
                // Map 15km to 120px radius
                const pxDist = (p.distance / 15) * 120;
                const px = cx + Math.cos(p.angle) * pxDist;
                const py = cy + Math.sin(p.angle) * pxDist;

                const pulse = 3 + Math.sin(this.frame * 0.1 + p.id) * 2;
                
                this.ctx.beginPath(); this.ctx.arc(px, py, pulse, 0, Math.PI * 2);
                this.ctx.fillStyle = p.color;
                this.ctx.shadowBlur = 10; this.ctx.shadowColor = p.color; this.ctx.fill();
                this.ctx.shadowBlur = 0;

                if (p.isLookingForMatch) {
                    this.ctx.strokeStyle = p.color; this.ctx.lineWidth = 1;
                    this.ctx.beginPath(); this.ctx.arc(px, py, pulse + 6, 0, Math.PI*2); this.ctx.stroke();
                    this.ctx.fillStyle = '#fff'; this.ctx.font = '8px Plus Jakarta Sans';
                    this.ctx.fillText(`${p.distance.toFixed(1)}km`, px + 6, py + 3);
                }
            });

        } else {
            // Render default school activity
            this.schools.forEach(s => {
                const pulse = s.baseRadius + s.activity + Math.sin(this.frame * 0.05 + s.id) * (s.activity * 0.3);
                this.ctx.strokeStyle = 'rgba(255,255,255,0.03)';
                this.ctx.beginPath(); this.ctx.moveTo(cx, cy); this.ctx.lineTo(s.x, s.y); this.ctx.stroke();

                this.ctx.beginPath(); this.ctx.arc(s.x, s.y, pulse * 1.5, 0, Math.PI * 2);
                this.ctx.fillStyle = s.color.replace(')', ', 0.2)').replace('rgb', 'rgba'); this.ctx.fill();

                this.ctx.beginPath(); this.ctx.arc(s.x, s.y, s.baseRadius, 0, Math.PI * 2);
                this.ctx.fillStyle = s.color; this.ctx.shadowBlur = 10; this.ctx.shadowColor = s.color; this.ctx.fill();
                this.ctx.shadowBlur = 0;

                if (s.activity > 3) {
                    this.ctx.fillStyle = '#fff'; this.ctx.font = '9px Space Grotesk'; this.ctx.fillText(s.name, s.x + 8, s.y + 3);
                }
            });
        }

        this.loop = requestAnimationFrame(() => this.render());
    }
};

/* =====================================================
   FEED FETCH & RENDER LOGIC
==================================================== */
async function fetchSchoolPosts() {
  let studentSchool = localStorage.getItem('userSchool') || localStorage.getItem('testOrg') || 'ALL';
  const selectedSchool = studentSchool !== 'ALL' ? studentSchool : (document.getElementById('hubSchoolSelect')?.value || 'ALL');

  const schoolSelect = document.getElementById('hubSchoolSelect');
  if (schoolSelect && studentSchool !== 'ALL') {
      schoolSelect.value = studentSchool;
      schoolSelect.disabled = true; 
      schoolSelect.style.opacity = "0.7";
  }
  
  try {
    if (typeof supabase !== 'undefined') {
      let query = supabase.from('school_posts').select('*').order('created_at', { ascending: false });
      if (selectedSchool !== 'ALL') query = query.eq('school_name', selectedSchool);
      const { data, error } = await query;
      if (error) throw error;
      allSchoolPosts = data || [];
    } else {
      const res = await fetch(`/api/feed?school=${encodeURIComponent(selectedSchool)}`);
      if (res.ok) {
        const resData = await res.json();
        allSchoolPosts = resData.posts || [];
      } else {
        allSchoolPosts = getSamplePosts();
      }
    }
  } catch (err) {
    allSchoolPosts = getSamplePosts();
  }
  renderSchoolFeed();
}

function getSamplePosts() {
  return [
    { id: 1, school_name: "Bharat Public School", category: "teacher_intel", title: "Chemistry Viva Important Topics", content: "External teacher is focusing heavily on Titration equations and Organic functional group tests. Be prepared!", author_name: "Anonymous Backbencher", batch_tag: "Class 12th", is_anonymous: true, upvotes: 14 },
    { id: 2, school_name: "DVM Public School", category: "syllabus_notes", title: "Physics Ch 9 Ray Optics Notes", content: "Diagrams for telescope and compound microscope derivations will definitely come in 5 marks.", author_name: "Rohan K.", batch_tag: "Class 12th Sci", is_anonymous: false, upvotes: 22 }
  ];
}

function formatCategoryName(cat) {
  const map = {
    'teacher_intel': '👨‍🏫 Teacher Update',
    'syllabus_notes': '📚 Notes / Syllabus',
    'ask_seniors': '❓ Seniors se Sawal',
    'news': '🎉 School Update'
  };
  return map[cat] || 'Charcha';
}

function renderSchoolFeed() {
  const container = document.getElementById('schoolPostsFeed');
  if (!container) return;

  const filtered = allSchoolPosts.filter(p => {
    return currentCategoryFilter === 'ALL' || p.category === currentCategoryFilter;
  });

  if (!document.getElementById('radarWrapper')) {
      CampusRadarEngine.init(container);
  }
  CampusRadarEngine.updateActivity(filtered);

  Array.from(container.children).forEach(child => {
      if (child.id !== 'radarWrapper') child.remove();
  });

  if (filtered.length === 0) {
    container.insertAdjacentHTML('beforeend', `
      <div style="text-align:center; padding:24px 14px; background:#111827; border-radius:14px; border:1px dashed rgba(255,255,255,0.12);">
        <div style="font-size:24px;">💬</div>
        <div style="color:#e5e7eb; font-weight:700; font-size:13px; margin-top:4px;">Sector clear. No activity detected.</div>
      </div>
    `);
    return;
  }

  const feedHtml = filtered.map(post => `
    <div class="post-card" style="background:#0b0f19; border:1px solid rgba(255,255,255,0.08); border-radius:16px; padding:16px; margin-bottom:12px; position:relative; overflow:hidden;">
      <div style="position:absolute; top:0; left:0; width:4px; height:100%; background:var(--accent-cyan);"></div>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
        <span class="post-tag tag-${post.category}" style="background:rgba(0,229,255,0.1); color:var(--accent-cyan); padding:4px 8px; border-radius:6px; font-size:9px; font-weight:900;">${formatCategoryName(post.category)}</span>
        <span style="font-size:10px; color:#9ca3af; font-weight:800;">🏫 ${escapeHTML(post.school_name)}</span>
      </div>

      <h4 style="font-size:15px; font-weight:900; color:#ffffff; margin:0 0 6px 0;">${escapeHTML(post.title)}</h4>
      <p style="font-size:13px; color:#cbd5e1; line-height:1.5; margin:0 0 14px 0; white-space: pre-line;">${escapeHTML(post.content)}</p>

      <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid rgba(255,255,255,0.06); padding-top:12px;">
        <div style="font-size:11px; color:#9ca3af; display:flex; align-items:center; gap:6px;">
          <span style="font-weight:800; color:#e2e8f0;">${post.is_anonymous ? '🤫 Ghost Source' : '👤 ' + (post.author_name || 'Student')}</span>
        </div>
        <button onclick="upvotePost(${post.id}, this)" style="background:rgba(244,63,94,0.1); border:1px solid rgba(244,63,94,0.3); color:var(--accent-rose); border-radius:8px; padding:6px 12px; font-size:11px; font-weight:900; cursor:pointer;">
          🔥 ${post.upvotes || 0}
        </button>
      </div>
    </div>
  `).join('');
  
  container.insertAdjacentHTML('beforeend', feedHtml);
}

function filterSchoolPosts() { fetchSchoolPosts(); }

function setCategoryFilter(cat, btn) {
  currentCategoryFilter = cat;
  document.querySelectorAll('#hubCategoryPills .hub-pill').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderSchoolFeed();
}

async function upvotePost(postId, btnEl) {
  let currentVal = parseInt(btnEl.innerText.replace('🔥', '').trim(), 10) || 0;
  btnEl.innerHTML = `🔥 ${currentVal + 1}`;
  btnEl.style.background = 'rgba(5, 255, 161, 0.15)';
  btnEl.style.borderColor = 'var(--accent-emerald)';
  btnEl.style.color = 'var(--accent-emerald)';
  btnEl.disabled = true;

  if(typeof triggerHaptic === 'function') triggerHaptic([30]);
  if(typeof playDing === 'function') playDing();

  try {
    if (typeof supabase !== 'undefined') {
      await supabase.from('school_posts').update({ upvotes: currentVal + 1 }).eq('id', postId);
    }
  } catch (err) {}
}

function openCreatePostModal() {
  const modal = document.getElementById('createPostModal');
  if (modal) modal.style.display = 'flex';
}

function closeCreatePostModal() {
  const modal = document.getElementById('createPostModal');
  if (modal) modal.style.display = 'none';
}

async function handleCreatePost(e) {
  e.preventDefault();
  
  let studentSchool = localStorage.getItem('userSchool') || localStorage.getItem('testOrg') || 'ALL';
  const school_name = studentSchool !== 'ALL' ? studentSchool : document.getElementById('modalSchoolSelect')?.value;
  
  const category = document.getElementById('modalCategorySelect')?.value;
  const batch_tag = document.getElementById('modalBatchInput')?.value;
  const title = document.getElementById('modalTitleInput')?.value;
  const content = document.getElementById('modalContentInput')?.value;
  const is_anonymous = document.getElementById('modalAnonCheckbox')?.checked ?? true;

  const newPost = {
    id: Date.now(), school_name, category, batch_tag, title, content, is_anonymous, upvotes: 0,
    author_name: is_anonymous ? 'Anonymous Backbencher' : (localStorage.getItem('studentName') || 'Student')
  };

  try {
    if (typeof supabase !== 'undefined') {
      const { error } = await supabase.from('school_posts').insert([newPost]);
      if (error) throw error;
    }
    allSchoolPosts.unshift(newPost);
    closeCreatePostModal();
    document.getElementById('createPostForm')?.reset();
    renderSchoolFeed();
  } catch (err) { alert('Failed to publish post.'); }
}

async function loadBountyMarket() {
  const container = document.getElementById('bountyMarketFeed');
  if (!container) return;
  container.innerHTML = `<div style="color:#64748b; font-size:11px; text-align:center;">Market offline.</div>`;
}
