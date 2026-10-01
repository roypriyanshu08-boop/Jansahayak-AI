import React, { useEffect, useState } from 'react';
import { Card } from '../common/CommonComponents';
import { complaintService } from '../../services/complaintService';
import { 
  CheckCircle2, Clock, AlertTriangle, ArrowUpRight, ShieldAlert, 
  Cpu, UserCheck, Play, SearchCheck, CheckCheck, Archive, Activity
} from 'lucide-react';

const LIFECYCLE_STAGES = [
  { key: 'SUBMITTED', label: 'Submitted', icon: Clock },
  { key: 'AI_ANALYSED', label: 'AI Analysed', icon: Cpu },
  { key: 'ASSIGNED', label: 'Assigned', icon: UserCheck },
  { key: 'IN_PROGRESS', label: 'In Progress', icon: Play },
  { key: 'UNDER_VERIFICATION', label: 'Under Verification', icon: SearchCheck },
  { key: 'RESOLVED', label: 'Resolved', icon: CheckCheck },
  { key: 'CLOSED', label: 'Closed', icon: Archive },
];

export const ComplaintTimelineCard = ({ complaintId, currentStatus, slaHours = 48, slaDeadline, isSlaBreached, escalationLevel = 0 }) => {
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadTimeline = async () => {
      try {
        const data = await complaintService.getComplaintTimeline(complaintId);
        if (isMounted) setTimeline(data);
      } catch (err) {
        console.error('Failed to load complaint timeline:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    if (complaintId) loadTimeline();
    return () => { isMounted = false; };
  }, [complaintId, currentStatus]);

  const cleanStatus = (currentStatus || 'SUBMITTED').toUpperCase();

  // Find index of current status in standard 7 happy path stages
  let activeStageIndex = LIFECYCLE_STAGES.findIndex(s => s.key === cleanStatus);
  if (cleanStatus === 'ESCALATED') {
    activeStageIndex = 3; // Highlight in progress / escalated phase
  }

  return (
    <Card style={{ 
      marginBottom: '1.5rem', 
      border: cleanStatus === 'ESCALATED' ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid rgba(59, 130, 246, 0.3)',
      background: cleanStatus === 'ESCALATED' 
        ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(15, 23, 42, 0.7) 100%)' 
        : 'linear-gradient(135deg, rgba(30, 58, 138, 0.12) 0%, rgba(15, 23, 42, 0.7) 100%)' 
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Activity size={22} color={cleanStatus === 'ESCALATED' ? '#f87171' : '#60a5fa'} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>Grievance Lifecycle & Timeline</h2>
        </div>

        {/* SLA Status Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {isSlaBreached || cleanStatus === 'ESCALATED' ? (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.35rem 0.8rem',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: 800,
              background: 'rgba(239, 68, 68, 0.2)',
              color: '#fca5a5',
              border: '1px solid rgba(239, 68, 68, 0.5)'
            }}>
              <AlertTriangle size={14} /> SLA Breached • Escalated Level {escalationLevel || 1}
            </span>
          ) : (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.35rem 0.8rem',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: 700,
              background: 'rgba(52, 211, 153, 0.15)',
              color: '#34d399',
              border: '1px solid rgba(52, 211, 153, 0.3)'
            }}>
              <Clock size={14} /> SLA Target: {slaHours} Hours (On Track)
            </span>
          )}
        </div>
      </div>

      {/* Lifecycle Progress Stepper Bar */}
      <div style={{ marginBottom: '1.75rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: '650px', position: 'relative' }}>
          
          {/* Connector line */}
          <div style={{
            position: 'absolute',
            top: '18px',
            left: '30px',
            right: '30px',
            height: '3px',
            background: 'rgba(255, 255, 255, 0.1)',
            zIndex: 1
          }}>
            <div style={{
              height: '100%',
              width: `${Math.max(0, Math.min(100, (activeStageIndex / (LIFECYCLE_STAGES.length - 1)) * 100))}%`,
              background: cleanStatus === 'ESCALATED' ? '#f87171' : 'linear-gradient(90deg, #3b82f6, #34d399)',
              transition: 'width 0.4s ease'
            }} />
          </div>

          {LIFECYCLE_STAGES.map((stage, idx) => {
            const isCompleted = idx < activeStageIndex;
            const isCurrent = idx === activeStageIndex;
            const Icon = stage.icon;

            let circleBg = 'rgba(30, 41, 59, 0.9)';
            let circleBorder = 'rgba(255, 255, 255, 0.2)';
            let iconColor = 'var(--text-muted)';
            let textColor = 'var(--text-muted)';

            if (isCurrent) {
              if (cleanStatus === 'ESCALATED') {
                circleBg = 'rgba(239, 68, 68, 0.3)';
                circleBorder = '#ef4444';
                iconColor = '#fca5a5';
                textColor = '#f87171';
              } else {
                circleBg = 'rgba(59, 130, 246, 0.3)';
                circleBorder = '#3b82f6';
                iconColor = '#60a5fa';
                textColor = '#60a5fa';
              }
            } else if (isCompleted) {
              circleBg = 'rgba(16, 185, 129, 0.2)';
              circleBorder = '#10b981';
              iconColor = '#34d399';
              textColor = '#e2e8f0';
            }

            return (
              <div key={stage.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, flex: 1 }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: circleBg,
                  border: `2px solid ${circleBorder}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s ease',
                  boxShadow: isCurrent ? `0 0 12px ${circleBorder}` : 'none'
                }}>
                  <Icon size={18} color={iconColor} />
                </div>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: isCurrent ? 800 : 600,
                  color: textColor,
                  marginTop: '0.4rem',
                  textAlign: 'center',
                  whiteSpace: 'nowrap'
                }}>
                  {stage.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Escalation Warning Card if Escalated */}
      {cleanStatus === 'ESCALATED' && (
        <div style={{
          padding: '0.85rem 1rem',
          borderRadius: '10px',
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <ShieldAlert size={24} color="#fca5a5" />
          <div>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#fca5a5' }}>
              Automatic Escalation Active (Level {escalationLevel || 1})
            </h4>
            <p style={{ fontSize: '0.82rem', color: '#fee2e2', marginTop: '0.15rem' }}>
              Resolution SLA threshold crossed. Grievance escalated to {
                escalationLevel === 3 ? 'Level 3 → Senior Municipal Authority' : 
                escalationLevel === 2 ? 'Level 2 → Department Supervisor' : 
                'Level 1 → Assigned Field Officer'
              } for priority intervention.
            </p>
          </div>
        </div>
      )}

      {/* Timeline Event History Log */}
      <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Chronological History Log
      </h3>

      {loading ? (
        <div style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading timeline history...</div>
      ) : timeline.length === 0 ? (
        <div style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No history entries logged yet.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', position: 'relative', paddingLeft: '1rem', borderLeft: '2px solid rgba(255, 255, 255, 0.1)' }}>
          {timeline.map((entry, idx) => {
            const isLast = idx === timeline.length - 1;
            return (
              <div key={entry.id || idx} style={{ position: 'relative', paddingBottom: '0.25rem' }}>
                {/* Bullet node on vertical timeline line */}
                <div style={{
                  position: 'absolute',
                  left: '-1.45rem',
                  top: '0.2rem',
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: isLast ? '#38bdf8' : 'rgba(148, 163, 184, 0.8)',
                  boxShadow: isLast ? '0 0 8px #38bdf8' : 'none',
                  border: '2px solid #0f172a'
                }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#38bdf8', display: 'block', marginBottom: '0.1rem' }}>
                      {entry.formatted_datetime}
                    </span>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f8fafc' }}>
                      {entry.action_title}
                    </h4>
                    {entry.comment && (
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                        {entry.comment}
                      </p>
                    )}
                  </div>

                  <span style={{
                    fontSize: '0.75rem',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '4px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    color: 'var(--text-muted)',
                    fontWeight: 600
                  }}>
                    By: {entry.changed_by}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};
