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
    }
};
