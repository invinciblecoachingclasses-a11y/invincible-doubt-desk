<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AI Answer Sheet Evaluator - Teacher Studio</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  
  <style>
    @media print {
      @page {
        margin: 12mm 15mm;
        size: A4 portrait;
      }
      body {
        background: #ffffff !important;
        color: #000000 !important;
      }
      body * { visibility: hidden; }
      #printable-report, #printable-report * { visibility: visible; }
      #printable-report {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        padding: 0 !important;
        border: none !important;
        box-shadow: none !important;
      }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body class="bg-slate-50 text-slate-900 min-h-screen">
  <div class="max-w-3xl mx-auto p-4 md:py-8">
    
    <!-- Top Navigation HUD -->
    <div class="flex justify-between items-center mb-6 no-print">
      <div class="flex items-center gap-2">
        <a href="history.html" class="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-lg transition">
          ← Exam Archive
        </a>
        <a href="test-maker.html" class="text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 px-3 py-1.5 rounded-lg transition">
          📝 Exam Studio
        </a>
      </div>
      <button id="logoutBtn" class="text-xs text-slate-500 hover:text-slate-800 font-medium">Logout</button>
    </div>

    <!-- Header Block -->
    <div class="mb-6 text-center no-print">
      <h1 class="text-2xl md:text-3xl font-extrabold text-indigo-700 tracking-tight">AI Answer Sheet Evaluator</h1>
      <p class="text-xs md:text-sm text-slate-500 mt-1">Scan student handwritten answer sheets against your exam marking scheme for instant step-by-step grading.</p>
    </div>

    <!-- Evaluation Setup Form -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 md:p-6 mb-8 no-print space-y-5">
      
      <!-- 1. Master Exam / Marking Scheme Selector -->
      <div>
        <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
          Step 1: Select Master Exam / Marking Scheme
        </label>
        <select id="examSelect" class="w-full border border-slate-300 rounded-xl p-3 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none">
          <option value="">Loading your saved papers from Supabase...</option>
        </select>
        <p class="text-[11px] text-slate-500 mt-1">Or the system will use the currently active test paper from session.</p>
      </div>

      <!-- 2. Student Answer Sheet Image Upload / Snap -->
      <div>
        <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
          Step 2: Capture / Upload Student Handwritten Sheet
        </label>
        
        <label class="flex flex-col items-center justify-center border-2 border-dashed border-indigo-300 hover:border-indigo-500 bg-indigo-50/50 hover:bg-indigo-50 rounded-2xl p-6 cursor-pointer transition text-center">
          <span class="text-3xl mb-1.5">📸</span>
          <span class="text-sm font-bold text-indigo-900">Click to Snap Photo or Upload Sheet</span>
          <span class="text-xs text-slate-500 mt-0.5">Supports handwritten sheets, single photos, and notebook pages</span>
          <input id="cameraInput" type="file" accept="image/*" class="hidden" />
        </label>

        <!-- Compressed Image Preview -->
        <div id="previewWrapper" class="hidden mt-3 relative">
          <img id="previewImg" class="max-h-60 w-full object-contain rounded-xl border border-slate-300 bg-slate-100 p-1" alt="Student Sheet Preview" />
          <button type="button" id="removeImgBtn" class="absolute top-2 right-2 bg-rose-600 text-white text-xs font-bold px-2.5 py-1 rounded-lg shadow hover:bg-rose-700 transition">
            ✕ Remove
          </button>
        </div>
      </div>

      <!-- Submit Evaluation Button -->
      <button id="evaluateBtn" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3.5 rounded-xl shadow-lg transition active:scale-[0.98] text-sm">
        Start AI Vision Evaluation &amp; Grade Sheet 🚀
      </button>

      <!-- Progress Loading Status -->
      <div id="loadingBox" class="hidden text-center py-4 bg-indigo-50/60 rounded-xl border border-indigo-100 space-y-1">
        <div class="text-xs font-bold text-indigo-700 animate-pulse">🤖 Vision AI is parsing student handwriting &amp; verifying marking steps...</div>
        <p class="text-[10px] text-slate-500">Matching equations, checking step logic, awarding partial marks.</p>
      </div>
    </div>

    <!-- Evaluation Results / Printable Report -->
    <div id="resultCard" class="hidden space-y-4">
      <div class="flex justify-end gap-2 no-print">
        <button onclick="window.print()" class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow transition flex items-center gap-1.5">
          <span>🖨️</span> <span>Print Evaluation Report / PDF</span>
        </button>
      </div>

      <!-- Printable Report Container -->
      <div id="printable-report" class="bg-white rounded-2xl border border-slate-300 p-6 md:p-8 shadow-sm text-slate-900 space-y-6">
        
        <!-- Score Banner Header -->
        <div class="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 class="text-xl font-black text-slate-900 uppercase tracking-wide">Student Performance Report</h2>
            <div class="flex items-center gap-4 text-xs font-bold text-slate-600 mt-1">
              <span>Student: <strong id="resStudentName" class="text-indigo-700">Unknown</strong></span>
              <span>Roll No: <strong id="resRollNo" class="text-slate-800">N/A</strong></span>
            </div>
          </div>
          <div class="bg-slate-900 text-white px-5 py-3 rounded-xl text-center">
            <div class="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Score</div>
            <div class="text-2xl font-black text-emerald-400">
              <span id="resScore">0</span> / <span id="resMaxScore">0</span>
            </div>
          </div>
        </div>

        <!-- Teacher Actionable Summary -->
        <div class="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <h4 class="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Teacher Summary &amp; Examiner Feedback</h4>
          <p id="resSummary" class="text-xs text-slate-600 leading-relaxed"></p>
        </div>

        <!-- Question by Question Itemized Breakdown -->
        <div>
          <h3 class="text-xs font-black uppercase tracking-wider text-slate-900 border-b pb-2 mb-3">Itemized Question Scoring</h3>
          <div id="gradedQuestionsList" class="space-y-3"></div>
        </div>

      </div>
    </div>

  </div>

  <script>
    const SUPABASE_URL = "https://cbgwbzidkmcefoithipp.supabase.co";
    const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiZ3diemlka21jZWZvaXRoaXBwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyMDgyNTQsImV4cCI6MjEwMTc4NDI1NH0.gJq3-0tU-8fxdF0Y_1_qcet_VYp7gysv5yWfl_o8T0g";
    const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    let currentUser = null;
    let savedExams = [];
    let activeExamData = null;
    let studentImageB64 = null;

    // Check Auth & Load Exams
    async function init() {
      try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session || !session.user) {
          window.location.href = "login.html";
          return;
        }
        currentUser = session.user;

        // Load saved exams from Supabase
        const { data: exams } = await supabaseClient
          .from('exams')
          .select('*')
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: false });

        const selectEl = document.getElementById('examSelect');
        selectEl.innerHTML = '';

        if (exams && exams.length > 0) {
          savedExams = exams;
          exams.forEach((item, idx) => {
            const opt = document.createElement('option');
            opt.value = idx;
            opt.textContent = `${item.subject || 'Subject'} (${item.class_grade || 'Class'}) - ${item.title || 'Exam'} [${item.total_marks || 25}M]`;
            selectEl.appendChild(opt);
          });
          activeExamData = exams[0].exam_data;
        } else {
          // Check session storage
          const stored = sessionStorage.getItem('currentExam');
          if (stored) {
            activeExamData = JSON.parse(stored);
            const opt = document.createElement('option');
            opt.value = "session";
            opt.textContent = "Current Active Exam from Studio";
            selectEl.appendChild(opt);
          } else {
            const opt = document.createElement('option');
            opt.value = "";
            opt.textContent = "No saved exams found (Default NCERT Key used)";
            selectEl.appendChild(opt);
          }
        }

        selectEl.addEventListener('change', (e) => {
          const val = e.target.value;
          if (val !== "" && val !== "session" && savedExams[val]) {
            activeExamData = savedExams[val].exam_data;
          }
        });

      } catch (e) {
        console.error("Init error:", e);
      }
    }
    init();

    // Camera / Image File Handler with Canvas Compression
    const cameraInput = document.getElementById('cameraInput');
    const previewWrapper = document.getElementById('previewWrapper');
    const previewImg = document.getElementById('previewImg');
    const removeImgBtn = document.getElementById('removeImgBtn');

    cameraInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (evt) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 1200;
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

          studentImageB64 = canvas.toDataURL('image/jpeg', 0.7);
          previewImg.src = studentImageB64;
          previewWrapper.classList.remove('hidden');
        };
        img.src = evt.target.result;
      };
      reader.readAsDataURL(file);
    });

    removeImgBtn.addEventListener('click', () => {
      studentImageB64 = null;
      cameraInput.value = '';
      previewWrapper.classList.add('hidden');
      previewImg.src = '';
    });

    // Evaluate Button Submission
    const evaluateBtn = document.getElementById('evaluateBtn');
    const loadingBox = document.getElementById('loadingBox');
    const resultCard = document.getElementById('resultCard');

    evaluateBtn.addEventListener('click', async () => {
      if (!studentImageB64) {
        alert('Please snap or upload a student answer sheet photo first.');
        return;
      }

      evaluateBtn.disabled = true;
      loadingBox.classList.remove('hidden');
      resultCard.classList.add('hidden');

      try {
        const res = await fetch('/api/grade-sheet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: studentImageB64,
            examData: activeExamData || {}
          })
        });

        const data = await res.json();
        if (!data.success || !data.evaluation) throw new Error(data.error || 'Failed to grade answer sheet.');

        renderGradedReport(data.evaluation);
      } catch (err) {
        alert('Evaluation Error: ' + err.message);
      } finally {
        evaluateBtn.disabled = false;
        loadingBox.classList.add('hidden');
      }
    });

    function renderGradedReport(evalData) {
      document.getElementById('resStudentName').innerText = evalData.student_name || 'Student';
      document.getElementById('resRollNo').innerText = evalData.roll_number || 'N/A';
      document.getElementById('resScore').innerText = evalData.total_score_obtained ?? 0;
      document.getElementById('resMaxScore').innerText = evalData.total_max_marks ?? 25;
      document.getElementById('resSummary').innerText = evalData.teacher_summary || 'Evaluation complete.';

      const list = document.getElementById('gradedQuestionsList');
      list.innerHTML = '';

      (evalData.graded_questions || []).forEach(q => {
        const statusColors = {
          Full: 'bg-emerald-50 text-emerald-800 border-emerald-300',
          Partial: 'bg-amber-50 text-amber-800 border-amber-300',
          Incorrect: 'bg-rose-50 text-rose-800 border-rose-300'
        };

        const item = document.createElement('div');
        item.className = 'border border-slate-200 rounded-xl p-3.5 text-xs space-y-1.5';
        
        item.innerHTML = `
          <div class="flex justify-between items-center font-bold">
            <span>Question ${q.question_number}</span>
            <span class="px-2 py-0.5 rounded border text-[11px] ${statusColors[q.status] || 'bg-slate-100 text-slate-700 border-slate-300'}">
              Score: ${q.marks_awarded} / ${q.max_marks} [${q.status || 'Graded'}]
            </span>
          </div>
          ${q.student_answer_extracted ? `<p class="text-slate-600"><strong class="text-slate-700">Answer Extracted:</strong> ${q.student_answer_extracted}</p>` : ''}
          <p class="text-slate-800 leading-relaxed"><strong class="text-slate-900">Feedback:</strong> ${q.feedback || 'Evaluated against marking criteria.'}</p>
        `;
        list.appendChild(item);
      });

      resultCard.classList.remove('hidden');
      resultCard.scrollIntoView({ behavior: 'smooth' });
    }

    document.getElementById('logoutBtn').addEventListener('click', async () => {
      await supabaseClient.auth.signOut();
      window.location.href = "login.html";
    });
  </script>
</body>
</html>
