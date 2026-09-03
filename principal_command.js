/* =====================================================
   ⚡ INVINCIBLE 360 - PRINCIPAL COMMAND CENTER & PRINCIPAL'S EYE
   Philosophy: "Don't Report Activity. Prove Impact."
   - School Learning Health Diagnostic (30-Second Snapshot)
   - "Where Should I Intervene Today?" AI Triage
   - Activity vs. Impact Mismatch Detection
   - Data Anomaly & Anti-Manipulation Radar
   - Top Impact Faculty Recognition
===================================================== */

const PrincipalCommandCenter = {
    containerId: 'principalCommandWrapper',

    state: {
        schoolHealth: 78,
        totalStudents: 1248,
        totalTeachers: 46,
        totalClasses: 38,
        activeGaps: 214,
        resolvedGaps: 167,
        schoolImprovement: "+14.8%",

        // Triage: "Where Should I Intervene Today?"
        criticalInterventions: [
            { id: 'crit_1', title: 'Class 10-B Mathematics', teacher: 'Prof. S. Sharma', issue: '63% below mastery in Quadratic Equations. Intervention overdue by 48h.', severity: 'CRITICAL', metric: '-18% Drop' },
            { id: 'crit_2', title: 'Class 9-C Science', teacher: 'Dr. A. Verma', issue: 'Repeated concept failure in Motion Kinematics across 3 consecutive assessments.', severity: 'HIGH', metric: '3 Failed Retests' },
            { id: 'crit_3', title: 'Class 12-A Physics', teacher: 'Prof. R. Malik', issue: '14 students exhibiting continuous Time-Pressure Panic in Arena telemetry.', severity: 'MEDIUM', metric: '14 At-Risk' }
        ],

        // Principal's Eye: Activity vs Impact Mismatch
        mismatchFlags: [
            {
                teacher: 'Teacher K. Mehta (Chemistry)',
                activity: '16 Tests Conducted • 24 Worksheets • 100% Attendance',
                impact: 'Student Mastery: 41% → 42% (+1%)',
                diagnosis: 'High administrative activity detected, but measurable student improvement remains stagnant. Intervention pedagogy review advised.'
            }
        ],

        // Data Anomaly & Audit Radar
        anomalies: [
            {
                class: 'Class 11-B Biology',
                metric: 'Mastery surged from 38% to 94% in 48 hours',
                reason: 'No corresponding 2-Minute Fixes, Lab simulations, or telemetry logs recorded to justify delta.',
                status: 'AUDIT REQUIRED'
            }
        ],

        // Top Impact Faculty (Reward genuine outcome leaders)
        topImpactTeachers: [
            { name: 'Prof. S. Sharma', dept: 'Mathematics', recoveryRate: '84%', badge: '🏆 Recovery Leader' },
            { name: 'Dr. P. Roy', dept: 'Science', recoveryRate: '81%', badge: '🎯 Weak-Concept Resolver' },
            { name: 'Prof. V. Gupta', dept: 'Physics', recoveryRate: '79%', badge: '⚡ Rapid Intervention' }
        ]
    },

    init: function(parentElement) {
        let wrapper = document.getElementById(this.containerId);
        if (!wrapper) {
            wrapper = document.createElement('div');
            wrapper.id = this.containerId;
            wrapper.style.cssText = "width:100%; max-width:880px; margin:0 auto; padding:16px; font-family:'Plus Jakarta Sans', sans-serif; color:#f8fafc;";
            parentElement.appendChild(wrapper);
        }
        this.render(wrapper);
    },

    render: function(wrapper) {
        wrapper.innerHTML = `
            <!-- PRINCIPAL HUD HEADER -->
            <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:24px; border-bottom:1px solid rgba(0,229,255,0.2); padding-bottom:12px;">
                <div>
                    <div style="font-size:10px; font-weight:900; color:var(--accent-amber); letter-spacing:2px; text-transform:uppercase;">Institutional Intelligence</div>
                    <div style="font-family:'Space Grotesk', sans-serif; font-size:24px; font-weight:900; color:#fff;">PRINCIPAL'S EYE OS</div>
                </div>
                <div style="text-align:right;">
                    <div style="font-size:11px; color:#94a3b8; font-weight:700;">Academic Operations Desk</div>
                    <div style="font-size:10px; color:var(--accent-cyan); font-weight:800; background:rgba(0,229,255,0.1); padding:4px 8px; border-radius:6px; margin-top:4px;">Full Telemetry Access</div>
                </div>
            </div>

            <!-- SCHOOL HEALTH SNAPSHOT (30-SECOND READ) -->
            <div style="background:rgba(15,23,42,0.6); border:1px solid rgba(255,255,255,0.08); border-radius:18px; padding:20px; margin-bottom:24px; backdrop-filter:blur(12px); box-shadow:0 12px 36px rgba(0,0,0,0.5);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
                    <h2 style="margin:0; font-family:'Space Grotesk', sans-serif; font-size:16px; font-weight:800; color:#fff;">SCHOOL LEARNING HEALTH</h2>
                    <span style="font-size:11px; font-weight:900; color:var(--accent-emerald); background:rgba(16,185,129,0.12); padding:4px 10px; border-radius:6px;">${this.state.schoolImprovement} Net Growth</span>
                </div>
                
                <div style="display:flex; gap:20px; align-items:center; flex-wrap:wrap;">
                    <!-- Health Gauge -->
                    <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; width:110px; height:110px; border-radius:50%; border:4px solid var(--accent-cyan); box-shadow:0 0 24px rgba(0,217,255,0.25);">
                        <div style="font-size:32px; font-weight:900; color:#fff; line-height:1;">${this.state.schoolHealth}</div>
                        <div style="font-size:9px; font-weight:800; color:var(--accent-cyan); letter-spacing:1px; margin-top:4px;">HEALTH INDEX</div>
                    </div>

                    <!-- Macro Counts -->
                    <div style="flex:1; display:grid; grid-template-columns:repeat(auto-fit, minmax(130px, 1fr)); gap:12px;">
                        <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); padding:10px 14px; border-radius:12px;">
                            <div style="font-size:10px; font-weight:800; color:#94a3b8;">STUDENTS ENROLLED</div>
                            <div style="font-size:18px; font-weight:900; color:#fff; margin-top:4px;">${this.state.totalStudents}</div>
                        </div>
                        <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); padding:10px 14px; border-radius:12px;">
                            <div style="font-size:10px; font-weight:800; color:#94a3b8;">ACTIVE FACULTY</div>
                            <div style="font-size:18px; font-weight:900; color:#fff; margin-top:4px;">${this.state.totalTeachers}</div>
                        </div>
                        <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); padding:10px 14px; border-radius:12px;">
                            <div style="font-size:10px; font-weight:800; color:#94a3b8;">LEARNING GAPS DETECTED</div>
                            <div style="font-size:18px; font-weight:900; color:var(--accent-rose); margin-top:4px;">${this.state.activeGaps}</div>
                        </div>
                        <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); padding:10px 14px; border-radius:12px;">
                            <div style="font-size:10px; font-weight:800; color:#94a3b8;">EVIDENCE-RESOLVED GAPS</div>
                            <div style="font-size:18px; font-weight:900; color:var(--accent-emerald); margin-top:4px;">${this.state.resolvedGaps}</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- "WHERE SHOULD I INTERVENE TODAY?" -->
            <div style="margin-bottom:24px;">
                <h2 style="margin:0 0 16px 0; font-family:'Space Grotesk', sans-serif; font-size:16px; font-weight:800; color:#fff; display:flex; align-items:center; gap:8px;">
                    🎯 WHERE SHOULD I INTERVENE TODAY?
                    <span style="font-size:10px; background:rgba(239,68,68,0.2); color:#ef4444; border:1px solid #ef4444; padding:2px 8px; border-radius:8px;">Priority Triage</span>
                </h2>
                <div style="display:flex; flex-direction:column; gap:12px;">
                    ${this.state.criticalInterventions.map(item => this.renderCriticalItem(item)).join('')}
                </div>
            </div>

            <!-- PRINCIPAL'S EYE: ACTIVITY VS IMPACT DETECTION -->
            <div style="background:linear-gradient(145deg, rgba(245,158,11,0.06), rgba(11,17,32,0.9)); border:1px solid rgba(245,158,11,0.3); border-radius:18px; padding:20px; margin-bottom:24px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                    <div style="font-size:12px; font-weight:900; color:var(--accent-amber); letter-spacing:1px; display:flex; align-items:center; gap:6px;">
                        <span>👁️</span> <span>ACTIVITY VS. IMPACT MISMATCH DETECTOR</span>
                    </div>
                    <span style="font-size:9px; font-weight:800; background:rgba(245,158,11,0.2); color:#fbbf24; padding:3px 8px; border-radius:6px;">NON-PUNITIVE FLAG</span>
                </div>

                ${this.state.mismatchFlags.map(m => `
                    <div style="background:rgba(2,6,23,0.8); border-radius:12px; padding:14px; border:1px solid rgba(255,255,255,0.05); margin-top:8px;">
                        <div style="font-size:14px; font-weight:800; color:#fff; margin-bottom:6px;">${m.teacher}</div>
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; font-size:11px; margin-bottom:10px;">
                            <div style="background:rgba(255,255,255,0.03); padding:8px 10px; border-radius:8px; color:#94a3b8;">
                                <strong>Logged Activity:</strong><br>${m.activity}
                            </div>
                            <div style="background:rgba(244,63,94,0.08); border:1px solid rgba(244,63,94,0.2); padding:8px 10px; border-radius:8px; color:#f43f5e;">
                                <strong>Measured Impact:</strong><br>${m.impact}
                            </div>
                        </div>
                        <div style="font-size:12px; color:#cbd5e1; line-height:1.45; margin-bottom:12px;">${m.diagnosis}</div>
                        <div style="text-align:right;">
                            <button onclick="PrincipalCommandCenter.requestPedagogyReview('${m.teacher}')" style="background:var(--accent-amber); color:#000; border:none; padding:8px 14px; border-radius:8px; font-weight:900; font-size:11px; cursor:pointer;">
                                Request Remediation Plan ➔
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>

            <!-- DATA ANOMALY & ANTI-MANIPULATION RADAR -->
            <div style="background:rgba(239,68,68,0.04); border:1px solid rgba(239,68,68,0.25); border-radius:18px; padding:18px; margin-bottom:24px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                    <div style="font-size:12px; font-weight:900; color:#ef4444; letter-spacing:1px;">⚠️ DATA ANOMALY RADAR</div>
                    <span style="font-size:9px; font-weight:800; color:#fff; background:#ef4444; padding:2px 8px; border-radius:6px;">INTEGRITY ALERT</span>
                </div>
                ${this.state.anomalies.map(a => `
                    <div style="font-size:13px; font-weight:800; color:#fff; margin-bottom:4px;">${a.class} — <span style="color:#ef4444;">${a.metric}</span></div>
                    <div style="font-size:11px; color:#94a3b8; margin-bottom:10px;">${a.reason}</div>
                    <button onclick="alert('Opening Immutable Audit Trail for ' + '${a.class}')" style="background:transparent; border:1px solid #ef4444; color:#ef4444; padding:6px 12px; border-radius:8px; font-weight:800; font-size:11px; cursor:pointer;">
                        Inspect Assessment Evidence
                    </button>
                `).join('')}
            </div>

            <!-- TOP IMPACT FACULTY -->
            <div>
                <h2 style="margin:0 0 14px 0; font-family:'Space Grotesk', sans-serif; font-size:16px; font-weight:800; color:#fff;">🏆 TOP IMPACT FACULTY (STUDENT RECOVERY LEADERS)</h2>
                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:12px;">
                    ${this.state.topImpactTeachers.map(t => `
                        <div style="background:rgba(15,23,42,0.6); border:1px solid rgba(255,255,255,0.06); border-radius:14px; padding:14px;">
                            <div style="font-size:9px; font-weight:900; color:var(--accent-cyan); margin-bottom:4px;">${t.badge}</div>
                            <div style="font-size:14px; font-weight:800; color:#fff;">${t.name}</div>
                            <div style="font-size:11px; color:#94a3b8; margin-bottom:10px;">${t.dept} Department</div>
                            <div style="font-size:12px; font-weight:800; color:var(--accent-emerald);">Recovery Rate: ${t.recoveryRate}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    renderCriticalItem: function(item) {
        return `
            <div style="background:rgba(2,6,23,0.8); border-left:4px solid #ef4444; border-radius:12px; padding:14px 16px; display:flex; justify-content:space-between; align-items:center; gap:14px;">
                <div style="flex:1;">
                    <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                        <span style="font-size:13px; font-weight:900; color:#fff;">${item.title}</span>
                        <span style="font-size:10px; font-weight:800; color:var(--accent-cyan);">[${item.teacher}]</span>
                    </div>
                    <div style="font-size:12px; color:#cbd5e1; line-height:1.4;">${item.issue}</div>
                </div>
                <div style="text-align:right; flex-shrink:0;">
                    <button onclick="PrincipalCommandCenter.interveneModal('${item.id}')" style="background:linear-gradient(135deg, var(--accent-rose), #dc2626); color:#fff; border:none; padding:8px 14px; border-radius:8px; font-weight:900; font-size:11px; cursor:pointer;">
                        INTERVENE ➔
                    </button>
                </div>
            </div>
        `;
    },

    interveneModal: function(id) {
        const item = this.state.criticalInterventions.find(x => x.id === id);
        if (!item) return;

        const modalId = 'principalInterveneOverlay';
        const existing = document.getElementById(modalId);
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = modalId;
        overlay.style.cssText = "position:fixed; inset:0; z-index:999999; background:rgba(2,6,23,0.9); backdrop-filter:blur(12px); display:flex; justify-content:center; align-items:center; padding:16px;";
        
        overlay.innerHTML = `
            <div style="background:#0f172a; border:1px solid rgba(239,68,68,0.4); border-radius:20px; width:100%; max-width:440px; padding:20px; box-shadow:0 20px 50px rgba(0,0,0,0.8);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
                    <div style="font-size:14px; font-weight:900; color:#ef4444;">DISPATCH PRINCIPAL DIRECTIVE</div>
                    <button onclick="document.getElementById('${modalId}').remove()" style="background:transparent; border:none; color:#94a3b8; font-size:18px; cursor:pointer;">×</button>
                </div>
                <div style="font-size:13px; color:#cbd5e1; margin-bottom:16px;">
                    Target: <strong>${item.title}</strong> (${item.teacher})<br>
                    <span style="color:#94a3b8; font-size:11px;">${item.issue}</span>
                </div>
                <div style="display:flex; flex-direction:column; gap:8px; margin-bottom:16px;">
                    <button onclick="PrincipalCommandCenter.confirmDirective('${modalId}', 'Mandatory Retest & Remediation assigned (24h deadline).')" style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); color:#fff; text-align:left; padding:10px 14px; border-radius:10px; font-size:12px; font-weight:700; cursor:pointer;">
                        🚨 Require Remediation & Reassessment (24h)
                    </button>
                    <button onclick="PrincipalCommandCenter.confirmDirective('${modalId}', 'Formal explanation requested regarding persistent mastery drop.')" style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); color:#fff; text-align:left; padding:10px 14px; border-radius:10px; font-size:12px; font-weight:700; cursor:pointer;">
                        📝 Request Pedagogical Explanation
                    </button>
                    <button onclick="PrincipalCommandCenter.confirmDirective('${modalId}', 'Classroom observation scheduled with Academic Coordinator.')" style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); color:#fff; text-align:left; padding:10px 14px; border-radius:10px; font-size:12px; font-weight:700; cursor:pointer;">
                        👥 Schedule Academic Observation
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    },

    confirmDirective: function(modalId, message) {
        document.getElementById(modalId).remove();
        alert(`✅ DIRECTIVE DISPATCHED TO TEACHER DASHBOARD:\n\n"${message}"\n\nLogged in institutional audit timeline.`);
    },

    requestPedagogyReview: function(teacher) {
        alert(`Pedagogical Review request sent to ${teacher}.\nSystem has flagged the intervention lifecycle to require follow-up proof.`);
    }
};

window.PrincipalCommandCenter = PrincipalCommandCenter;
