// telemetry.js - Closed-Loop Learning Telemetry & Auto-Remediation Pipeline
window.TelemetryEngine = {
    // 1. Emit mistake event to Supabase and local Mistake Vault
    async recordMistake({ subject, chapter, questionText, studentAnswer, correctAnswer, explanation, difficulty = 'medium' }) {
        const studentUser = JSON.parse(localStorage.getItem('student_profile') || '{}');
        const studentId = studentUser.id || 'demo_student_01';
        const studentName = studentUser.name || 'Anonymous Learner';
        const schoolId = studentUser.school_id || 'unassigned';

        const mistakePayload = {
            student_id: studentId,
            student_name: studentName,
            school_id: schoolId,
            subject: subject || 'Science',
            chapter: chapter || 'General Concepts',
            question_text: questionText,
            student_answer: studentAnswer,
            correct_answer: correctAnswer,
            explanation: explanation,
            timestamp: new Date().toISOString(),
            remediated: false
        };

        // Cache locally for instant offline access in Mistake Vault
        this.saveToLocalVault(mistakePayload);

        // Send to Supabase learning_telemetry table
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

        // Trigger notification badge on the Mistake Vault
        this.updateVaultBadge();
    },

    // 2. Local storage sync for instant UI updates
    saveToLocalVault(entry) {
        const currentVault = JSON.parse(localStorage.getItem('mistake_vault') || '[]');
        currentVault.unshift(entry);
        // Keep the latest 50 items locally
        if (currentVault.length > 50) currentVault.pop();
        localStorage.setItem('mistake_vault', JSON.stringify(currentVault));
    },

    // 3. UI Badge Trigger for student dock
    updateVaultBadge() {
        const vaultBadge = document.getElementById('vaultBadge');
        if (vaultBadge) {
            const currentVault = JSON.parse(localStorage.getItem('mistake_vault') || '[]');
            const unresolved = currentVault.filter(m => !m.remediated).length;
            vaultBadge.textContent = unresolved > 0 ? unresolved : '';
            vaultBadge.style.display = unresolved > 0 ? 'inline-block' : 'none';
        }
    },

    // 4. Open the Mistake Vault UI
    openMistakeVault() {
        const currentVault = JSON.parse(localStorage.getItem('mistake_vault') || '[]');
        const pendingMistakes = currentVault.filter(m => !m.remediated);

        let vaultHtml = `
            <div id="vaultModal" style="position:fixed; inset:0; background:rgba(0,0,0,0.9); z-index:9999; display:flex; justify-content:center; align-items:center; padding:20px;">
                <div style="background:#0f172a; border:2px solid #ff4757; border-radius:20px; width:100%; max-width:500px; padding:25px; max-height:80vh; overflow-y:auto;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                        <h2 style="color:#fff; margin:0;">🧠 Mistake Vault</h2>
                        <button onclick="document.getElementById('vaultModal').remove()" style="background:transparent; border:none; color:#fff; font-size:20px; cursor:pointer;">✖</button>
                    </div>
        `;

        if (pendingMistakes.length === 0) {
            vaultHtml += `<p style="color:#2ed573; text-align:center;">All clear! You have fixed all your recent mistakes.</p>`;
        } else {
            pendingMistakes.forEach((mistake, index) => {
                vaultHtml += `
                    <div style="background:#1e293b; padding:15px; border-radius:12px; margin-bottom:15px; border-left:4px solid #ff4757;">
                        <p style="font-size:12px; color:#94a3b8; margin:0 0 5px 0;">${mistake.subject} - ${mistake.chapter}</p>
                        <p style="color:#fff; font-size:14px; margin:0 0 10px 0;"><strong>Q:</strong> ${mistake.question_text}</p>
                        <button onclick="window.TelemetryEngine.launchFixDrill(${index})" style="width:100%; padding:10px; background:#4facfe; color:#fff; border:none; border-radius:8px; font-weight:bold; cursor:pointer; margin-top:10px;">
                            Generate 2-Minute Fix ⚡
                        </button>
                    </div>
                `;
            });
        }

        vaultHtml += `</div></div>`;
        document.body.insertAdjacentHTML('beforeend', vaultHtml);
    },

    // 5. Connect to your existing api/generate-fix.js
    async launchFixDrill(index) {
        const currentVault = JSON.parse(localStorage.getItem('mistake_vault') || '[]');
        const pendingMistakes = currentVault.filter(m => !m.remediated);
        const mistake = pendingMistakes[index];

        const btn = event.target;
        btn.innerText = "Analyzing AI Neural Link... ⏳";
        btn.disabled = true;

        const misconceptionStr = `Question was: "${mistake.question_text}". Student wrongly chose "${mistake.student_answer}". Correct answer is "${mistake.correct_answer}".`;

        try {
            const res = await fetch('/api/generate-fix', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subject: mistake.subject,
                    topic: mistake.chapter,
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

            document.getElementById('vaultModal').remove();
            
            alert(`🚨 2-MINUTE AI FIX 🚨\n\n💡 Explanation: ${drill.explanation}\n📌 Example: ${drill.example}\n\n📝 Challenge: ${drill.question}\n\n1) ${drill.options[0]}\n2) ${drill.options[1]}\n3) ${drill.options[2]}\n4) ${drill.options[3]}\n\n(Correct Option: ${drill.correctIndex + 1})`);
            
        } catch (error) {
            console.error(error);
            btn.innerText = "Error. Try again.";
            btn.disabled = false;
        }
    }
};
