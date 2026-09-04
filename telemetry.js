// telemetry.js - Closed-Loop Learning Telemetry, Vault & Student Learning Intelligence
window.MistakeAnalytics = {
    // 1. Pure Algorithmic Analysis Engine (Safe, Null-Guarded, Local)
    compute() {
        let vault = [];
        try {
            const raw = localStorage.getItem('mistake_vault');
            vault = raw ? JSON.parse(raw) : [];
            if (!Array.isArray(vault)) vault = [];
        } catch (e) {
            console.warn('Telemetry: Corrupted mistake_vault reset to []', e);
            vault = [];
        }

        // Clean and sanitize records against legacy or malformed entries
        const cleanVault = vault.filter(m => m && typeof m === 'object').map(m => ({
            subject: String(m.subject || 'General').trim(),
            chapter: String(m.chapter || 'Foundational Topics').trim(),
            questionText: String(m.question_text || m.questionText || 'Assessment Question').trim(),
            studentAnswer: String(m.student_answer || m.studentAnswer || '').trim(),
            correctAnswer: String(m.correct_answer || m.correctAnswer || '').trim(),
            remediated: Boolean(m.remediated),
            timestamp: m.timestamp || new Date().toISOString()
        }));

        const totalMistakes = cleanVault.length;
        const pendingMistakes = cleanVault.filter(m => !m.remediated);
        const resolvedMistakes = cleanVault.filter(m => m.remediated);

        // Subject Breakdown
        const subjectCounts = {};
        // Chapter Breakdown
        const chapterCounts = {};
        const chapterSubjectMap = {};

        cleanVault.forEach(item => {
            subjectCounts[item.subject] = (subjectCounts[item.subject] || 0) + 1;
            chapterCounts[item.chapter] = (chapterCounts[item.chapter] || 0) + 1;
            if (!chapterSubjectMap[item.chapter]) {
                chapterSubjectMap[item.chapter] = item.subject;
            }
        });

        // Sort chapters by mistake frequency (Descending)
        const sortedChapters = Object.entries(chapterCounts)
            .map(([chapter, count]) => ({
                chapter,
                subject: chapterSubjectMap[chapter] || 'General',
                count
            }))
            .sort((a, b) => b.count - a.count);

        const top3WeakTopics = sortedChapters.slice(0, 3);
        const primaryFocusTopic = top3WeakTopics[0] || null;

        // Stronger areas (Chapters where mistakes <= 1)
        const strongerChapters = sortedChapters.filter(c => c.count <= 1).slice(0, 3);

        // Algorithmic Learning Status & Revise Next Recommendation
        let learningStatus = { label: 'All Clear', color: '#10b981', badge: '🟢 Optimal' };
        let reviseRecommendation = 'You currently have zero recorded mistakes. Keep maintaining your streak!';

        if (pendingMistakes.length > 8) {
            learningStatus = { label: 'Critical Revision Priority', color: '#ff4757', badge: '🔴 High Priority' };
            reviseRecommendation = `Focus immediately on **${primaryFocusTopic.chapter}** (${primaryFocusTopic.subject}). Clear your ${pendingMistakes.length} unresolved questions in the Vault.`;
        } else if (pendingMistakes.length > 3) {
            learningStatus = { label: 'Active Attention Needed', color: '#f59e0b', badge: '🟠 Focus Required' };
            reviseRecommendation = `Prioritize **${primaryFocusTopic.chapter}**. Completing 2-Minute Fix drills will rapidly restore concept mastery.`;
        } else if (pendingMistakes.length > 0) {
            learningStatus = { label: 'Minor Review', color: '#00e5ff', badge: '🟡 Stable' };
            reviseRecommendation = `Review **${primaryFocusTopic.chapter}** to eliminate your remaining ${pendingMistakes.length} minor misconception(s).`;
        }

        return {
            totalMistakes,
            activeMistakes: pendingMistakes.length,
            resolvedCount: resolvedMistakes.length,
            subjectCounts,
            top3WeakTopics,
            primaryFocusTopic,
            strongerChapters,
            learningStatus,
            reviseRecommendation
        };
    }
};

window.TelemetryEngine = {
    // 1. Emit mistake event to Supabase and local Mistake Vault
    async recordMistake({ subject, chapter, questionText, studentAnswer, correctAnswer, explanation, difficulty = 'medium' }) {
        let studentUser = {};
        try {
            studentUser = JSON.parse(localStorage.getItem('student_profile') || '{}');
        } catch (e) {
            studentUser = {};
        }

        const studentId = studentUser.id || 'demo_student_01';
        const studentName = studentUser.name || localStorage.getItem('studentName') || 'Anonymous Learner';
        const schoolId = studentUser.school_id || localStorage.getItem('userSchool') || 'unassigned';

        const mistakePayload = {
            student_id: studentId,
            student_name: studentName,
            school_id: schoolId,
            subject: subject || 'Science',
            chapter: chapter || 'General Concepts',
            question_text: questionText || '',
            student_answer: studentAnswer || '',
            correct_answer: correctAnswer || '',
            explanation: explanation || '',
            timestamp: new Date().toISOString(),
            remediated: false
        };

        this.saveToLocalVault(mistakePayload);

        const SUPABASE_URL = "https://cbgwbzidkmcefoithipp.supabase.co";
        const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiZ3diemlka21jZWZvaXRoaXBwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyMDgyNTQsImV4cCI6MjEwMTc4NDI1NH0.gJq3-0tU-8fxdF0Y_1_qcet_VYp7gysv5yWfl_o8T0g";

        try {
            await fetch(`${SUPABASE_URL}/rest/v1/learning_telemetry`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify(mistakePayload)
            });
        } catch (err) {
            console.warn('Telemetry cloud sync delayed (cached locally):', err);
        }

        this.updateVaultBadge();
        this.renderLearningIntelligence();
    },

    // 2. Local storage sync
    saveToLocalVault(entry) {
        let currentVault = [];
        try {
            currentVault = JSON.parse(localStorage.getItem('mistake_vault') || '[]');
            if (!Array.isArray(currentVault)) currentVault = [];
        } catch (e) {
            currentVault = [];
        }

        currentVault.unshift(entry);
        if (currentVault.length > 50) currentVault.pop();
        localStorage.setItem('mistake_vault', JSON.stringify(currentVault));
    },

    // 3. UI Badge Trigger
    updateVaultBadge() {
        const vaultBadge = document.getElementById('vaultBadge');
        if (vaultBadge) {
            let currentVault = [];
            try {
                currentVault = JSON.parse(localStorage.getItem('mistake_vault') || '[]');
            } catch (e) {
                currentVault = [];
            }
            const unresolved = currentVault.filter(m => !m.remediated).length;
            vaultBadge.textContent = unresolved > 0 ? unresolved : '';
            vaultBadge.style.display = unresolved > 0 ? 'inline-block' : 'none';
        }
    },

    // 4. Mistake Vault UI
    openMistakeVault() {
        let currentVault = [];
        try {
            currentVault = JSON.parse(localStorage.getItem('mistake_vault') || '[]');
        } catch (e) {
            currentVault = [];
        }

        const pendingMistakes = currentVault.filter(m => !m.remediated);

        let vaultHtml = `
            <div id="vaultModal" style="position:fixed; inset:0; background:rgba(0,0,0,0.9); z-index:9999; display:flex; justify-content:center; align-items:center; padding:20px;">
                <div style="background:#0f172a; border:2px solid #ff4757; border-radius:20px; width:100%; max-width:500px; padding:25px; max-height:80vh; overflow-y:auto;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                        <h2 style="color:#fff; margin:0; font-size:18px;">🧠 Mistake Vault</h2>
                        <button onclick="document.getElementById('vaultModal').remove()" style="background:transparent; border:none; color:#fff; font-size:20px; cursor:pointer;">✖</button>
                    </div>
        `;

        if (pendingMistakes.length === 0) {
            vaultHtml += `<p style="color:#10b981; text-align:center; font-weight:700;">All clear! You have fixed all your recent mistakes.</p>`;
        } else {
            pendingMistakes.forEach((mistake, index) => {
                vaultHtml += `
                    <div style="background:#1e293b; padding:15px; border-radius:12px; margin-bottom:15px; border-left:4px solid #ff4757;">
                        <p style="font-size:12px; color:#94a3b8; margin:0 0 5px 0;">${mistake.subject || 'General'} - ${mistake.chapter || 'Foundational'}</p>
                        <p style="color:#fff; font-size:14px; margin:0 0 10px 0;"><strong>Q:</strong> ${mistake.question_text || mistake.questionText}</p>
                        <button onclick="window.TelemetryEngine.launchFixDrill(${index})" style="width:100%; padding:10px; background:#00e5ff; color:#020617; border:none; border-radius:8px; font-weight:bold; cursor:pointer; margin-top:10px;">
                            Generate 2-Minute Fix ⚡
                        </button>
                    </div>
                `;
            });
        }

        vaultHtml += `</div></div>`;
        document.body.insertAdjacentHTML('beforeend', vaultHtml);
    },

    // 5. Connect to api/generate-fix.js
    async launchFixDrill(index) {
        let currentVault = [];
        try {
            currentVault = JSON.parse(localStorage.getItem('mistake_vault') || '[]');
        } catch (e) {
            currentVault = [];
        }

        const pendingMistakes = currentVault.filter(m => !m.remediated);
        const mistake = pendingMistakes[index];
        if (!mistake) return;

        const btn = event?.target;
        if (btn) {
            btn.innerText = "Analyzing AI Neural Link... ⏳";
            btn.disabled = true;
        }

        const misconceptionStr = `Question was: "${mistake.question_text || mistake.questionText}". Student wrongly chose "${mistake.student_answer || mistake.studentAnswer}". Correct answer is "${mistake.correct_answer || mistake.correctAnswer}".`;

        try {
            const res = await fetch('/api/generate-fix', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subject: mistake.subject || 'Science',
                    topic: mistake.chapter || 'Core Concepts',
                    coreMisconception: misconceptionStr
                })
            });

            const drill = await res.json();
            if (drill.error) throw new Error(drill.error);

            const globalIndex = currentVault.findIndex(m => m.timestamp === mistake.timestamp);
            if (globalIndex > -1) {
                currentVault[globalIndex].remediated = true;
                localStorage.setItem('mistake_vault', JSON.stringify(currentVault));
            }

            this.updateVaultBadge();
            this.renderLearningIntelligence();

            const SUPABASE_URL = "https://cbgwbzidkmcefoithipp.supabase.co";
            const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiZ3diemlka21jZWZvaXRoaXBwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyMDgyNTQsImV4cCI6MjEwMTc4NDI1NH0.gJq3-0tU-8fxdF0Y_1_qcet_VYp7gysv5yWfl_o8T0g";

            await fetch(`${SUPABASE_URL}/rest/v1/learning_telemetry?timestamp=eq.${mistake.timestamp}`, {
                method: 'PATCH',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ remediated: true })
            }).catch(() => {});

            const modal = document.getElementById('vaultModal');
            if (modal) modal.remove();

            alert(`🚨 2-MINUTE AI FIX 🚨\n\n💡 Explanation: ${drill.explanation}\n📌 Example: ${drill.example}\n\n📝 Challenge: ${drill.question}\n\n1) ${drill.options[0]}\n2) ${drill.options[1]}\n3) ${drill.options[2]}\n4) ${drill.options[3]}\n\n(Correct Option: ${drill.correctIndex + 1})`);
        } catch (error) {
            console.error(error);
            if (btn) {
                btn.innerText = "Error. Try again.";
                btn.disabled = false;
            }
        }
    },

    // 6. Student Learning Intelligence Renderer (Algorithmic, Safe, Zero-Lag)
    renderLearningIntelligence() {
        let container = document.getElementById('learningIntelligenceSection');
        if (!container) return;

        const data = window.MistakeAnalytics.compute();

        let weakListHtml = '';
        if (data.top3WeakTopics.length === 0) {
            weakListHtml = `<div style="font-size:12px; color:#10b981; font-weight:700;">✅ No recurring weak topics detected.</div>`;
        } else {
            weakListHtml = data.top3WeakTopics.map((t, idx) => `
                <div style="display:flex; justify-content:space-between; align-items:center; background:#020617; border:1px solid rgba(255,255,255,0.06); padding:8px 12px; border-radius:10px; margin-bottom:6px;">
                    <div style="font-size:12px; color:#e2e8f0; font-weight:700; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:70%;">
                        <span style="color:#00e5ff; font-weight:900; margin-right:6px;">${idx + 1}.</span> ${t.chapter}
                        <span style="font-size:10px; color:#64748b; margin-left:4px;">(${t.subject})</span>
                    </div>
                    <span style="background:rgba(255,71,87,0.15); color:#ff4757; font-size:11px; font-weight:800; padding:2px 8px; border-radius:6px;">
                        ${t.count} ${t.count === 1 ? 'mistake' : 'mistakes'}
                    </span>
                </div>
            `).join('');
        }

        let subjectBreakdownHtml = '';
        const subjects = Object.entries(data.subjectCounts);
        if (subjects.length === 0) {
            subjectBreakdownHtml = `<span style="font-size:12px; color:#64748b;">No subject data yet.</span>`;
        } else {
            subjectBreakdownHtml = subjects.map(([sub, count]) => `
                <div style="display:flex; justify-content:space-between; align-items:center; font-size:12px; padding:4px 0; border-bottom:1px solid rgba(255,255,255,0.04);">
                    <span style="color:#94a3b8; font-weight:600;">${sub}</span>
                    <strong style="color:#fff; font-weight:800;">${count}</strong>
                </div>
            `).join('');
        }

        container.innerHTML = `
            <div style="background:linear-gradient(180deg, #0f172a 0%, #030712 100%); border:1px solid rgba(0,229,255,0.25); border-radius:20px; padding:20px; box-shadow:0 8px 30px rgba(0,0,0,0.5); margin-top:20px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span style="font-size:18px;">📊</span>
                        <h3 style="font-size:14px; font-weight:900; color:#fff; letter-spacing:0.5px; margin:0; text-transform:uppercase;">
                            Learning Intelligence
                        </h3>
                    </div>
                    <span style="font-size:10px; font-weight:800; background:rgba(0,229,255,0.12); color:#00e5ff; border:1px solid rgba(0,229,255,0.3); padding:2px 8px; border-radius:6px;">
                        ${data.learningStatus.badge}
                    </span>
                </div>

                <!-- Highlight Cards -->
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:16px;">
                    <div style="background:#020617; border:1px solid rgba(255,255,255,0.06); border-radius:12px; padding:10px 12px;">
                        <div style="font-size:10px; color:#64748b; font-weight:800; text-transform:uppercase;">Unresolved Errors</div>
                        <div style="font-size:20px; font-weight:900; color:#ff4757; margin-top:2px;">${data.activeMistakes}</div>
                        <div style="font-size:10px; color:#64748b;">${data.resolvedCount} fixed so far</div>
                    </div>
                    <div style="background:#020617; border:1px solid rgba(255,255,255,0.06); border-radius:12px; padding:10px 12px;">
                        <div style="font-size:10px; color:#64748b; font-weight:800; text-transform:uppercase;">Primary Weakness</div>
                        <div style="font-size:13px; font-weight:800; color:#00e5ff; margin-top:4px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                            ${data.primaryFocusTopic ? data.primaryFocusTopic.chapter : 'None'}
                        </div>
                        <div style="font-size:10px; color:#64748b;">${data.primaryFocusTopic ? data.primaryFocusTopic.subject : 'All clear'}</div>
                    </div>
                </div>

                <!-- Weak Areas -->
                <div style="margin-bottom:14px;">
                    <div style="font-size:11px; font-weight:900; color:#94a3b8; margin-bottom:8px; text-transform:uppercase; letter-spacing:0.5px;">
                        🎯 Recurring Weak Areas
                    </div>
                    ${weakListHtml}
                </div>

                <!-- Subject Breakdown -->
                <div style="margin-bottom:16px; background:#020617; border:1px solid rgba(255,255,255,0.06); border-radius:12px; padding:10px 12px;">
                    <div style="font-size:11px; font-weight:900; color:#94a3b8; margin-bottom:6px; text-transform:uppercase; letter-spacing:0.5px;">
                        📚 Subject Breakdown
                    </div>
                    ${subjectBreakdownHtml}
                </div>

                <!-- Recommended Next Step -->
                <div style="background:rgba(0,229,255,0.06); border-left:3px solid #00e5ff; padding:12px; border-radius:0 12px 12px 0;">
                    <div style="font-size:10px; font-weight:900; color:#00e5ff; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px;">
                        ⚡ Recommended Next Step
                    </div>
                    <div style="font-size:12px; color:#cbd5e1; line-height:1.4; font-weight:600;">
                        ${data.reviseRecommendation.replace(/\*\*(.*?)\*\*/g, '<strong style="color:#fff;">$1</strong>')}
                    </div>
                </div>
            </div>
        `;
    }
};

// Automatic Mount Trigger on Document Ready
document.addEventListener('DOMContentLoaded', () => {
    if (window.TelemetryEngine) {
        window.TelemetryEngine.updateVaultBadge();
        window.TelemetryEngine.renderLearningIntelligence();
    }
});
