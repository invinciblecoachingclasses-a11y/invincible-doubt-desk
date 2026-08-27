/* =====================================================
   DOUBT DESK LOGIC
===================================================== */
let selectedSubject = "Mathematics";
let currentTone = "step";
let selectedImage = null;
let doubtHistory = [];
const questionInput = document.getElementById("question");
const imageInput = document.getElementById("imageInput");
const imagePreview = document.getElementById("imagePreview");
const removeImageButton = document.getElementById("removeImage");

function setExplanationTone(tone, el) {
    currentTone = tone; document.querySelectorAll('.tone-btn').forEach(b => b.classList.remove('active')); el.classList.add('active');
}
document.querySelectorAll("#doubtSection .subject").forEach(b => {
    b.onclick = () => { document.querySelectorAll("#doubtSection .subject").forEach(btn => btn.classList.remove('active')); b.classList.add('active'); selectedSubject = b.getAttribute('data-subject'); };
});
if (document.getElementById("uploadBtn")) {
  document.getElementById("uploadBtn").onclick = () => imageInput.click();
}
if (document.getElementById("cameraBtn")) {
  document.getElementById("cameraBtn").onclick = () => { imageInput.setAttribute("capture", "environment"); imageInput.click(); };
}

if (imageInput) {
  imageInput.onchange = e => {
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

              const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
              selectedImage = {
                  data: compressedBase64.split(',')[1],
                  mimeType: 'image/jpeg'
              };

              imagePreview.src = compressedBase64;
              imagePreview.style.display = "block";
              removeImageButton.style.display = "block";
              const container = document.getElementById('imagePreviewContainer');
              if (container) container.style.display = "block";
          };
          img.src = evt.target.result;
      };
      reader.readAsDataURL(file);
  };
}

if (removeImageButton) {
  removeImageButton.onclick = () => { 
    selectedImage = null; 
    imageInput.value = ""; 
    imagePreview.style.display = "none"; 
    removeImageButton.style.display = "none";
    const container = document.getElementById('imagePreviewContainer');
    if (container) container.style.display = "none";
  };
}

async function renderAnswerContent(container, markdownText) {
  let parsedHtml = typeof marked !== 'undefined' ? marked.parse(markdownText || "") : markdownText;
  
  parsedHtml = parsedHtml
    .replace(/🚨\s*\*\*Common Student Mistakes[\s\S]*?(?=(🎯|🧠|💡|$))/gi, (match) => `<div class="callout-trap">${typeof marked !== 'undefined' ? marked.parse(match) : match}</div>`)
    .replace(/🎯\s*\*\*Direct Approach[\s\S]*?(?=(🧠|💡|🚨|$))/gi, (match) => `<div class="callout-tldr">${typeof marked !== 'undefined' ? marked.parse(match) : match}</div>`);

  container.innerHTML = parsedHtml;
  
  if (window.MathJax && MathJax.typesetPromise) {
    await MathJax.typesetPromise([container]);
  }
}

if (document.getElementById("askBtn")) {
  document.getElementById("askBtn").onclick = async () => {
      const q = questionInput.value.trim();
      if(!q && !selectedImage) return alert("Please enter a question or upload a photo.");

      const askBtn = document.getElementById("askBtn");
      askBtn.disabled = true;
      document.getElementById("loadingDoubt").classList.remove('hidden'); 
      document.getElementById("answerBox").style.display = "none"; 
      
      startDoubtWaitingPipeline();
      const attachedImageBase64 = selectedImage ? `data:${selectedImage.mimeType};base64,${selectedImage.data}` : null;
      doubtHistory = [];

      try {
          const res = await fetch("/api/ask", {
              method: "POST", 
              headers: {"Content-Type": "application/json"},
              body: JSON.stringify({ 
                subject: selectedSubject, 
                question: q, 
                image: selectedImage, 
                tone: currentTone,
                history: []
              })
          });
          const data = await res.json();
          if(!res.ok) throw new Error(data.error || "Unable to solve.");

          doubtHistory.push({ role: 'user', content: q || 'Image Question' });
          doubtHistory.push({ role: 'assistant', content: data.answer });

          const ansContainer = document.getElementById("answerText");
          await renderAnswerContent(ansContainer, data.answer);
          
          if (attachedImageBase64) {
            const imgMarkup = `<div style="margin-bottom:14px; text-align:center;"><img src="${attachedImageBase64}" alt="Uploaded Doubt" style="max-width:100%; max-height:260px; border-radius:12px; border:1px solid rgba(255,255,255,0.15); object-fit:contain;" /></div>`;
            ansContainer.insertAdjacentHTML('afterbegin', imgMarkup);
          }
          
          document.getElementById("answerBox").style.display = "block"; 
          if (typeof playDing === 'function') playDing();
      } catch(err) {
          alert("Doubt Engine: " + err.message);
      } finally { 
          askBtn.disabled = false;
          stopDoubtWaitingPipeline();
          document.getElementById("loadingDoubt").classList.add('hidden'); 
      }
  };
}

const sendFollowUpBtn = document.getElementById('sendFollowUpBtn');
const followUpInput = document.getElementById('followUpInput');

if (sendFollowUpBtn && followUpInput) {
  const submitFollowUp = async () => {
    const followQ = followUpInput.value.trim();
    if (!followQ) return;

    sendFollowUpBtn.disabled = true;
    sendFollowUpBtn.textContent = "...";

    const thread = document.getElementById('doubtConversationThread');

    const userBubble = document.createElement('div');
    userBubble.style.cssText = "background:rgba(0, 229, 255, 0.1); border:1px solid rgba(0, 229, 255, 0.25); border-radius:12px; padding:10px 14px; font-size:13px; font-weight:700; color:#fff; align-self:flex-end;";
    userBubble.textContent = "🙋 " + followQ;
    thread.appendChild(userBubble);
    followUpInput.value = "";

    const aiBubble = document.createElement('div');
    aiBubble.className = "topper-content";
    aiBubble.style.cssText = "background:rgba(255,255,255,0.03); border:1px solid var(--border-subtle); border-radius:14px; padding:12px 16px; margin-top:6px;";
    aiBubble.innerHTML = "<em>Refining explanation with step logic...</em>";
    thread.appendChild(aiBubble);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          subject: selectedSubject,
          question: followQ,
          tone: currentTone,
          history: doubtHistory
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed follow-up");

      doubtHistory.push({ role: 'user', content: followQ });
      doubtHistory.push({ role: 'assistant', content: data.answer });

      await renderAnswerContent(aiBubble, data.answer);
      if (typeof playDing === 'function') playDing();
    } catch (err) {
      aiBubble.innerHTML = `<span style="color:var(--accent-rose);">Error: ${err.message}</span>`;
    } finally {
      sendFollowUpBtn.disabled = false;
      sendFollowUpBtn.textContent = "Ask";
    }
  };

  sendFollowUpBtn.onclick = submitFollowUp;
  followUpInput.onkeydown = (e) => { if (e.key === 'Enter') submitFollowUp(); };
}

if (document.getElementById("againBtn")) {
  document.getElementById("againBtn").addEventListener("click", function(){ 
    if (followUpInput) {
      followUpInput.value = "Can you explain this step by step with a simpler real-world example?";
      if (sendFollowUpBtn) sendFollowUpBtn.click();
    }
  });
}

if (document.getElementById("teacherBtn")) {
  document.getElementById("teacherBtn").addEventListener("click", function(){ 
    const studentQuestion = questionInput ? questionInput.value.trim() : ""; 
    const ansEl = document.getElementById("answerText");
    const explanation = ansEl ? ansEl.innerText.trim() : ""; 
    const whatsappMessage = "Hello Invincible 360 Faculty,\n\nI need further help on this concept:\n\nSubject: " + selectedSubject + "\n\nQuestion:\n" + (studentQuestion || "Image attachment") + "\n\nPlatform Solution:\n" + explanation; 
    window.open("https://api.whatsapp.com/send?text=" + encodeURIComponent(whatsappMessage), "_blank"); 
  });
}

/* =====================================================
   NOTES STUDIO GENERATOR & PDF ENGINE
===================================================== */
const genNotesBtn = document.getElementById('generateNotesBtn');
if (genNotesBtn) {
  genNotesBtn.onclick = async () => {
    const cls = document.getElementById('notesClass').value;
    const sub = document.getElementById('notesSubject').value;
    const lang = document.getElementById('notesLanguage').value; 
    const chapter = document.getElementById('notesChapter').value.trim();
    if(!chapter) return alert("Please enter a chapter name.");

    const targetPages = (cls === "9" || cls === "10") ? 8 : 10;

    genNotesBtn.disabled = true; 
    genNotesBtn.textContent = `Compiling ${targetPages}-Page Study Module...`;
    document.getElementById('notesLoading')?.classList.remove('hidden');
    document.getElementById('notesResultContainer')?.classList.add('hidden');

    const strictPrompt = `
      Create a comprehensive, highly-structured ${targetPages}-page CBSE Study Module for Chapter: "${chapter}".
      Target Audience: Class ${cls} (${sub}).
      Language: ${lang}. (If Hindi or Hinglish, keep scientific terms in English brackets).

      STRICT DESIGN & STRUCTURE REQUIREMENTS:
      1. MUST BE VERY THOROUGH AND DETAILED TO FILL APPROXIMATELY ${targetPages} STANDARD PRINT PAGES.
      2. Divide the chapter into 5 to 7 logical major sections.
      3. For EVERY section include:
         - ⚡ 1-Minute TL;DR Box: High-yield summary bullets.
         - Core Concepts: Clear 1-2 line concept trigger bullets (NO long dense paragraphs).
         - 🧠 FORMULA VAULT: Display all mathematical equations centered using standard LaTeX math ($ or $$).
         - Derivations / Step-by-Step Logic: Clear numbered sequences with justifications in brackets.
         - Comparison Tables: Fully formatted Markdown tables comparing definitions, devices, or wave types.
         - 🚨 EXAMINER TRAP Callout: Highlight standard student calculation or conceptual mistakes (e.g. ❌ Wrong vs ✅ Right).
      4. DO NOT add standalone multiple-choice question sets or practice quizzes at the end.
      5. Output ONLY valid Markdown with clean standard tables and LaTeX math.
    `;

    try {
        const res = await fetch('/api/ask', {
            method: 'POST', 
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ 
              subject: sub, 
              question: strictPrompt
            }) 
        });
        const data = await res.json();
        if(!res.ok) throw new Error(data.error || `Server error: ${res.status}`);
        data.notes = data.answer;

        document.getElementById('notesResultTitle').textContent = `CLASS ${cls} ${sub.toUpperCase()} • ${chapter.toUpperCase()} (${targetPages}-PAGE MODULE)`;
        
        const contentBody = document.getElementById('notesContentBody');
        let rawHtml = marked.parse(data.notes || "");

        rawHtml = rawHtml
          .replace(/<blockquote>\s*<p>.*?EXAMINER TRAP[\s\S]*?<\/blockquote>/gi, (match) => `<div class="callout-trap">${match.replace(/<\/?blockquote>/g, '')}</div>`)
          .replace(/<blockquote>\s*<p>.*?TL;DR[\s\S]*?<\/blockquote>/gi, (match) => `<div class="callout-tldr">${match.replace(/<\/?blockquote>/g, '')}</div>`)
          .replace(/<blockquote>\s*<p>.*?FORMULA VAULT[\s\S]*?<\/blockquote>/gi, (match) => `<div class="callout-formula">${match.replace(/<\/?blockquote>/g, '')}</div>`);

        contentBody.innerHTML = rawHtml;
        
        if (window.MathJax) {
            await MathJax.typesetPromise([contentBody]);
        }

        document.getElementById('notesResultContainer')?.classList.remove('hidden');
        if (typeof playWin === 'function') playWin();
    } catch(err) {
        alert("Notes Engine Error: " + err.message);
    } finally {
        genNotesBtn.disabled = false; 
        genNotesBtn.textContent = "GENERATE TOPPER NOTES";
        document.getElementById('notesLoading')?.classList.add('hidden');
    }
  };
}

function downloadPDF() {
  const content = document.getElementById('notesContentBody')?.innerHTML;
  const title = document.getElementById('notesResultTitle')?.textContent || "CBSE Study Module";
  const cls = document.getElementById('notesClass')?.value || "10";
  const chapter = document.getElementById('notesChapter')?.value.trim() || 'Notes';

  if (!content) {
    alert("Please generate notes first.");
    return;
  }

  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Invincible_Class_${cls}_${chapter.replace(/\\s+/g, '_')}_Notes</title>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=Space+Grotesk:wght@700;900&display=swap" rel="stylesheet">
        <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"><\/script>
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          body { font-family: 'Plus Jakarta Sans', Arial, sans-serif; color: #0f172a; background: #ffffff; margin: 0; padding: 10px; font-size: 13px; line-height: 1.65; }
          .header { border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: flex-end; }
          .title { font-family: 'Space Grotesk', sans-serif; font-size: 17px; font-weight: 900; color: #0f172a; }
          .sub { font-size: 9px; font-weight: 800; color: #0284c7; letter-spacing: 1px; text-transform: uppercase; }
          h1, h2, h3 { font-family: 'Space Grotesk', sans-serif; color: #0f172a; margin-top: 22px; margin-bottom: 10px; break-after: avoid; }
          p, li { color: #1e293b; }
          .callout-trap { background: #fff1f2; border-left: 4px solid #e11d48; border-radius: 8px; padding: 12px 16px; margin: 14px 0; color: #881337; break-inside: avoid; }
          .callout-tldr { background: #f0fdf4; border-left: 4px solid #16a34a; border-radius: 8px; padding: 12px 16px; margin: 14px 0; color: #14532d; break-inside: avoid; }
          .callout-formula { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 14px; margin: 14px 0; text-align: center; color: #0f172a; break-inside: avoid; }
          table { width: 100%; border-collapse: collapse; margin: 14px 0; break-inside: avoid; }
          th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; font-size: 12px; }
          th { background-color: #0f172a; color: #ffffff; }
          tr:nth-child(even) { background-color: #f8fafc; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="sub">Invincible 360 • Topper Study Module</div>
            <div class="title">${title}</div>
          </div>
          <div style="font-size: 9px; font-weight: 700; color: #64748b;">CBSE CURRICULUM</div>
        </div>
        <div>${content}</div>
        <script>
          window.onload = function() {
            if (window.MathJax) {
              MathJax.typesetPromise().then(() => { setTimeout(() => { window.print(); window.close(); }, 500); });
            } else {
              setTimeout(() => { window.print(); window.close(); }, 500);
            }
          };
        <\/script>
      </body>
    </html>
  `);
  printWindow.document.close();
}
