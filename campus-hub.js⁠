/* =====================================================
   CAMPUS HUB / SCHOOL DISPATCH CONTROLLER (MULTI-TENANT)
==================================================== */
let currentCategoryFilter = 'ALL';
let allSchoolPosts = [];

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

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:24px 14px; background:#111827; border-radius:14px; border:1px dashed rgba(255,255,255,0.12);">
        <div style="font-size:24px;">💬</div>
        <div style="color:#e5e7eb; font-weight:700; font-size:13px; margin-top:4px;">No posts available for your school</div>
        <div style="color:#9ca3af; font-size:11px; margin-top:2px;">Check back later for updates from your teachers!</div>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(post => `
    <div class="post-card">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
        <span class="post-tag tag-${post.category}">${formatCategoryName(post.category)}</span>
        <span style="font-size:10px; color:#9ca3af; font-weight:700;">🏫 ${escapeHTML(post.school_name)}</span>
      </div>

      <h4 style="font-size:14px; font-weight:800; color:#ffffff; margin:0 0 4px 0; line-height:1.3;">${escapeHTML(post.title)}</h4>
      <p style="font-size:12px; color:#d1d5db; line-height:1.4; margin:0 0 10px 0; white-space: pre-line;">${escapeHTML(post.content)}</p>

      <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid rgba(255,255,255,0.06); padding-top:8px;">
        <div style="font-size:11px; color:#9ca3af; display:flex; align-items:center; gap:6px;">
          <span style="font-weight:700; color:#e5e7eb;">${post.is_anonymous ? '🤫 Koi Dost (Anonymous)' : '👤 ' + (post.author_name || 'Student')}</span>
          <span>•</span>
          <span style="color:#9ca3af; font-size:10px;">${post.batch_tag || 'Student'}</span>
        </div>
        <button onclick="upvotePost(${post.id}, this)" style="background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); color:#fff; border-radius:6px; padding:3px 8px; font-size:11px; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:4px;">
          🔥 Sahi Hai <span>${post.upvotes || 0}</span>
        </button>
      </div>
    </div>
  `).join('');
}

function filterSchoolPosts() { fetchSchoolPosts(); }

function setCategoryFilter(cat, btn) {
  currentCategoryFilter = cat;
  document.querySelectorAll('#hubCategoryPills .hub-pill').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderSchoolFeed();
}

async function upvotePost(postId, btnEl) {
  const span = btnEl.querySelector('span');
  let currentVal = parseInt(span.textContent, 10) || 0;
  span.textContent = currentVal + 1;
  btnEl.style.borderColor = '#05ffa1';
  btnEl.disabled = true;

  try {
    if (typeof supabase !== 'undefined') {
      await supabase.from('school_posts').update({ upvotes: currentVal + 1 }).eq('id', postId);
    }
  } catch (err) {}
}

function openCreatePostModal() {
  let studentSchool = localStorage.getItem('userSchool') || localStorage.getItem('testOrg') || 'ALL';
  const mSel = document.getElementById('modalSchoolSelect');
  
  if (studentSchool !== 'ALL' && mSel) {
    mSel.value = studentSchool;
    mSel.disabled = true;
    mSel.style.opacity = "0.7";
  }

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
    id: Date.now(),
    school_name,
    category,
    batch_tag,
    title,
    content,
    is_anonymous,
    upvotes: 0,
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
  } catch (err) {
    alert('Failed to publish post: ' + err.message);
  }
}

/* =====================================================
   KNOWLEDGE MARKET (PEER BOUNTIES) LOGIC
===================================================== */
async function loadBountyMarket() {
  const container = document.getElementById('bountyMarketFeed');
  if (!container) return;

  try {
    const SUPABASE_URL = 'https://cbgwbzidkmcefoithipp.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiZ3diemlka21jZWZvaXRoaXBwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyMDgyNTQsImV4cCI6MjEwMTc4NDI1NH0.gJq3-0tU-8fxdF0Y_1_qcet_VYp7gysv5yWfl_o8T0g';
    const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const { data, error } = await client.from('doubt_bounties').select('*').eq('status', 'open').order('id', { ascending: false }).limit(5);
    if (error) throw error;

    if (!data || data.length === 0) {
      container.innerHTML = `<div style="color:#64748b; font-size:11px; text-align:center; padding:10px;">No open peer bounties. Be the first to ask!</div>`;
      return;
    }

    container.innerHTML = data.map(b => `
      <div style="background:#020617; border:1px solid #1e293b; border-radius:12px; padding:10px; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div style="font-size:10px; font-weight:800; color:var(--accent-cyan);">${b.subject.toUpperCase()} • Bountied by ${escapeHTML(b.student_name)}</div>
          <div style="font-size:12px; color:#fff; font-weight:700; margin-top:2px;">${escapeHTML(b.question)}</div>
        </div>
        <button onclick="solveBounty(${b.id}, '${escapeHTML(b.question)}')" style="background:var(--accent-emerald); color:#020617; border:none; padding:6px 10px; border-radius:8px; font-size:10px; font-weight:900; cursor:pointer; whitespace-nowrap;">Solve (+${b.bounty_xp} XP)</button>
      </div>
    `).join('');
  } catch(e) {
    container.innerHTML = `<div style="color:#64748b; font-size:11px; text-align:center;">Market offline.</div>`;
  }
}

async function solveBounty(bountyId, questionText) {
  switchTab('doubt');
  const qInput = document.getElementById('question');
  if (qInput) qInput.value = questionText;
  alert("💡 Solve this doubt in the AI Solver, copy the steps, and share with your classmate to claim your bounty XP!");
}
