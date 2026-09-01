/* =====================================================
   ⚡ INVINCIBLE 360 - TEACHER COMMAND CENTER
   Core Engine: "Don't Report Activity. Prove Impact."
   - Live Teacher Effectiveness Dashboard
   - AI-Prioritized Intervention Queue
   - Student Recovery Tracking
   - Evidence-Based Remediation Dispatcher
===================================================== */

const TeacherCommandCenter = {
    containerId: 'teacherCommandWrapper',
    
    // Mock state mapping to the Supabase schema we just created
    state: {
        effectivenessScore: 82,
        recoveryRate: 72,
        metrics: {
            improvement: 88,
            weakConceptsResolved: 79,
            remediationCompletion: 91,
            assessmentFollowThrough: 84
        },
        priorities: [
            { id: 'int_1', class: '10-B', subject: 'Mathematics', topic: 'Quadratic Equations', issue: '63% students below mastery.', severity: 'CRITICAL', status: 'ACTION REQUIRED' },
            { id: 'int_2', class: '9-A', subject: 'Science', topic: 'Motion Kinematics', issue: 'Retest pending after remediation.', severity: 'MEDIUM', status: 'PENDING RETEST' },
            { id: 'int_3', class: '12-A', subject: 'Physics', topic: 'Current Electricity', issue: '11 students showing persistent errors.', severity: 'HIGH', status: 'AT RISK' }
        ]
    },

    init: function(parentElement) {
        let wrapper = document.getElementById(this.containerId);
        if (!wrapper) {
            wrapper = document.createElement('div');
            wrapper.id = this.containerId;
            wrapper.style.cssText = "width:100%; max-width:800px; margin:0 auto; padding:16px; font-family:'Plus Jakarta Sans', sans-serif; color:#f8fafc;";
            parentElement.appendChild(wrapper);
        }
        this.render(wrapper);
    },

    render: function(wrapper) {
        wrapper.innerHTML = `
            <!-- HEADER -->
            <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:24px; border-bottom:1px solid rgba(0,229,255,0.2); padding-bottom:12px;">
                <div>
                    <div style="font-size:10px; font-weight:900; color:var(--accent-cyan); letter-spacing:2px; text-transform:uppercase;">Academic Mission Control</div>
                    <div style="font-family:'Space Grotesk', sans-serif; font-size:24px; font-weight:900; color:#fff;">TEACHER COMMAND</div>
                </div>
                <div style="text-align:right;">
                    <div style="font-size:11px; color:#94a3b8; font-weight:700;">Prof. S. Sharma</div>
                    <div style="font-size:10px; color:#05ffa1; font-weight:800; background:rgba(5,255,161,0.1); padding:4px 8px; border-radius:6px; margin-top:4px;">Science Dept</div>
                </div>
            </div>

            <!-- MY TEACHING IMPACT (EFFECTIVENESS) -->
            <div style="background:rgba(15,23,42,0.6); border:1px solid rgba(255,255,255,0.08); border-radius:16px; padding:20px; margin-bottom:24px; backdrop-filter:blur(12px); box-shadow:0 10px 30px rgba(0,0,0,0.5);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
                    <h2 style="margin:0; font-family:'Space Grotesk', sans-serif; font-size:16px; font-weight:800; color:#fff;">MY TEACHING IMPACT</h2>
                    <span style="font-size:11px; font-weight:800; color:#94a3b8; background:rgba(255,255,255,0.05); padding:4px 8px; border-radius:6px;">Last 30 Days</span>
                </div>
                
                <div style="display:flex; gap:20px; align-items:center; flex-wrap:wrap;">
                    <!-- Main Score Ring -->
                    <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; width:100px; height:100px; border-radius:50%; border:4px solid var(--accent-emerald); box-shadow:0 0 20px rgba(16,185,129,0.2);">
                        <div style="font-size:28px; font-weight:900; color:#fff; line-height:1;">${this.state.effectivenessScore}</div>
                        <div style="font-size:10px; font-weight:800; color:var(--accent-emerald);">EFFECTIVENESS</div>
                    </div>
                    
                    <!-- Sub Metrics -->
                    <div style="flex:1; display:grid; grid-template-columns:repeat(auto-fit, minmax(140px, 1fr)); gap:12px;">
                        ${this.renderMetricBar('Student Improvement', this.state.metrics.improvement, '#00e5ff')}
                        ${this.renderMetricBar('Weak Concepts Resolved', this.state.metrics.weakConceptsResolved, '#f59e0b')}
                        ${this.renderMetricBar('Remediation Completion', this.state.metrics.remediationCompletion, '#10b981')}
                        ${this.renderMetricBar('Student Recovery Rate', this.state.recoveryRate, '#f43f5e')}
                    </div>
                </div>
            </div>

            <!-- TODAY'S PRIORITIES -->
            <div style="margin-bottom:16px;">
                <h2 style="margin:0 0 16px 0; font-family:'Space Grotesk', sans-serif; font-size:16px; font-weight:800; color:#fff; display:flex; align-items:center; gap:8px;">
                    🚨 TODAY'S PRIORITIES
                    <span style="font-size:10px; background:#ef4444; color:#fff; padding:2px 8px; border-radius:10px;">${this.state.priorities.length} Actionable</span>
                </h2>
                
                <div style="display:flex; flex-direction:column; gap:12px;">
                    ${this.state.priorities.map(p => this.renderPriorityCard(p)).join('')}
                </div>
            </div>
            
            <!-- RECENT EVIDENCE & AUDIT LOG -->
            <div style="background:rgba(255,255,255,0.02); border:1px dashed rgba(255,255,255,0.1); border-radius:16px; padding:16px; text-align:center;">
                <div style="font-size:12px; font-weight:800; color:#94a3b8; margin-bottom:8px;">EVIDENCE ENGINE ACTIVE</div>
                <div style="font-size:11px; color:#64748b;">Monitoring student telemetry across AI Doubt Desk, Arena, and Mistake Vault.</div>
                <button onclick="alert('Feature unlocking in Phase 2: Evidence Explorer')" style="margin-top:12px; background:transparent; border:1px solid var(--accent-cyan); color:var(--accent-cyan); padding:8px 16px; border-radius:8px; font-weight:800; font-size:11px; cursor:pointer;">
                    View My Audit Trail
                </button>
            </div>
        `;
    },

    renderMetricBar: function(label, value, color) {
        return `
            <div>
                <div style="display:flex; justify-content:space-between; font-size:11px; font-weight:700; margin-bottom:4px; color:#cbd5e1;">
                    <span>${label}</span>
                    <span style="color:${color};">${value}%</span>
                </div>
                <div style="width:100%; height:6px; background:rgba(255,255,255,0.1); border-radius:3px; overflow:hidden;">
                    <div style="width:${value}%; height:100%; background:${color}; border-radius:3px; box-shadow:0 0 8px ${color};"></div>
                </div>
            </div>
        `;
    },

    renderPriorityCard: function(priority) {
        let borderColor = 'rgba(255,255,255,0.1)';
        let badgeColor = '#94a3b8';
        let actionText = 'REVIEW';
        
        if (priority.severity === 'CRITICAL') { borderColor = '#ef4444'; badgeColor = '#ef4444'; actionText = 'FIX NOW'; }
        else if (priority.severity === 'HIGH') { borderColor = '#f59e0b'; badgeColor = '#f59e0b'; actionText = 'VIEW ANALYSIS'; }
        else if (priority.severity === 'MEDIUM') { borderColor = '#00e5ff'; badgeColor = '#00e5ff'; actionText = 'COMPLETE'; }

        return `
            <div style="background:rgba(2,6,23,0.8); border-left:4px solid ${borderColor}; border-top:1px solid rgba(255,255,255,0.05); border-right:1px solid rgba(255,255,255,0.05); border-bottom:1px solid rgba(255,255,255,0.05); border-radius:12px; padding:16px; display:flex; flex-direction:column; gap:12px; transition:transform 0.2s; cursor:pointer;" onmouseover="this.style.transform='translateX(4px)'" onmouseout="this.style.transform='none'">
                
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div>
                        <div style="font-size:10px; font-weight:900; color:${badgeColor}; letter-spacing:1px; margin-bottom:4px;">CLASS ${priority.class} — ${priority.subject.toUpperCase()}</div>
                        <div style="font-size:15px; font-weight:800; color:#fff;">${priority.topic}</div>
                    </div>
                    <div style="font-size:9px; font-weight:900; background:rgba(255,255,255,0.1); color:#fff; padding:4px 8px; border-radius:8px;">${priority.status}</div>
                </div>

                <div style="font-size:12px; color:#cbd5e1; background:rgba(255,255,255,0.03); padding:8px 12px; border-radius:8px; border-left:2px solid ${borderColor};">
                    ${priority.issue}
                </div>

                <div style="text-align:right;">
                    <button onclick="TeacherCommandCenter.openInterventionModal('${priority.id}')" style="background:${borderColor === 'rgba(255,255,255,0.1)' ? 'var(--accent-cyan)' : borderColor}; color:${priority.severity === 'CRITICAL' ? '#fff' : '#000'}; border:none; padding:8px 16px; border-radius:8px; font-weight:900; font-size:11px; cursor:pointer; box-shadow:0 4px 12px ${borderColor}40;">
                        ${actionText} ➔
                    </button>
                </div>
            </div>
        `;
    },

    openInterventionModal: function(priorityId) {
        const p = this.state.priorities.find(x => x.id === priorityId);
        if(!p) return;

        const overlayId = 'interventionModalOverlay';
        let existing = document.getElementById(overlayId);
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = overlayId;
        overlay.style.cssText = "position:fixed; inset:0; z-index:99999; background:rgba(2,6,23,0.9); backdrop-filter:blur(12px); display:flex; justify-content:center; align-items:center; padding:16px;";
        
        overlay.innerHTML = `
            <div style="background:#0f172a; border:1px solid rgba(0,229,255,0.3); border-radius:20px; width:100%; max-width:480px; overflow:hidden; box-shadow:0 20px 50px rgba(0,0,0,0.8);">
                <div style="padding:20px; border-bottom:1px solid rgba(255,255,255,0.05); display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <div style="font-size:10px; font-weight:900; color:var(--accent-cyan);">PRIORITY INTERVENTION</div>
                        <div style="font-size:16px; font-weight:900; color:#fff;">${p.topic}</div>
                    </div>
                    <button onclick="document.getElementById('${overlayId}').remove()" style="background:transparent; border:none; color:#94a3b8; font-size:20px; cursor:pointer;">×</button>
                </div>
                
                <div style="padding:20px; font-size:13px; color:#cbd5e1; line-height:1.6;">
                    <div style="margin-bottom:16px;">
                        <span style="color:#f43f5e; font-weight:800;">Problem:</span> ${p.issue}<br>
                        <span style="color:#94a3b8;">Detected via Mistake Vault & Recent Mock Tests.</span>
                    </div>

                    <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:16px; margin-bottom:20px;">
                        <div style="font-size:11px; font-weight:900; color:#05ffa1; margin-bottom:8px;">SYSTEM RECOMMENDED ACTION:</div>
                        <ol style="margin:0; padding-left:16px; color:#fff; font-weight:600; display:flex; flex-direction:column; gap:6px;">
                            <li>Conduct 10-min concept remediation.</li>
                            <li>Assign targeted 2-Minute Fix practice.</li>
                            <li>System will automatically reassess mastery.</li>
                        </ol>
                    </div>

                    <button onclick="TeacherCommandCenter.acknowledgeIntervention('${p.id}', '${overlayId}')" style="width:100%; background:linear-gradient(135deg, var(--accent-cyan), #0284c7); color:#060913; border:none; padding:14px; border-radius:12px; font-weight:900; font-size:13px; cursor:pointer;">
                        Acknowledge & Start Remediation
                    </button>
                    
                    <div style="text-align:center; margin-top:12px;">
                        <button onclick="alert('Viewing Telemetry Evidence...')" style="background:transparent; border:none; color:#94a3b8; font-size:11px; font-weight:700; text-decoration:underline; cursor:pointer;">Show Me The Evidence</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    },

    acknowledgeIntervention: function(id, modalId) {
        document.getElementById(modalId).remove();
        alert("Intervention Acknowledged! Status moved to 'REMEDIATION STARTED'.\n\nStudent Mastery will be recalculated upon follow-up assessment.");
        // Future backend integration:
        // fetch('/api/teacher/interventions/acknowledge', { method: 'POST', body: JSON.stringify({ id }) })
    }
};
