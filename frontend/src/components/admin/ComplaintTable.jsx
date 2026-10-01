import React, { useState } from 'react';
import { Card, Badge, Button } from '../common/CommonComponents';
import { UserCheck, AlertTriangle, Eye, Info, ChevronDown, ChevronUp } from 'lucide-react';

export const ComplaintTable = ({ complaints, onAssign, onEscalate, onViewDetails }) => {
  const [expandedId, setExpandedId] = useState(null);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <Card style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            <th style={thStyle}>ID</th>
            <th style={thStyle}>Title & Category</th>
            <th style={thStyle}>Department</th>
            <th style={thStyle}>Priority Level</th>
            <th style={thStyle}>Priority Score</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {complaints.length === 0 ? (
            <tr>
              <td colSpan="7" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>No complaints yet</div>
                <div style={{ fontSize: '0.85rem', marginTop: '0.3rem' }}>Data will appear here after citizens submit real complaints.</div>
              </td>
            </tr>
          ) : (
            complaints.map((c) => {
              const priorityScore = c.ai_analysis?.priority_score || c.priority_score || c.impact_score || 50;
              const priorityLevel = c.ai_analysis?.priority || c.priority || 'MEDIUM';
              const rawReasons = c.ai_analysis?.priority_reasons;
              const priorityReasons = Array.isArray(rawReasons) 
                ? rawReasons 
                : (typeof rawReasons === 'string' ? JSON.parse(rawReasons) : [
                    `High Severity: Categorized as ${c.ai_analysis?.severity || 'High'} severity`,
                    `Location: ${c.address || 'Public area'}`,
                    `Impact Score: ${priorityScore}/100`
                  ]);
              const isExpanded = expandedId === c.id;

              return (
                <React.Fragment key={c.id}>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', transition: 'background 0.2s' }}>
                    <td style={tdStyle}><span style={{ fontFamily: 'monospace', color: 'var(--primary)' }}>#{c.id.substring(0, 8)}</span></td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                        {(c.title?.includes('[DEMO DATA]') || c.is_demo_data) && (
                          <span style={{
                            padding: '0.15rem 0.5rem',
                            borderRadius: '6px',
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            background: 'rgba(245, 158, 11, 0.25)',
                            color: '#fcd34d',
                            border: '1px solid rgba(245, 158, 11, 0.5)',
                            letterSpacing: '0.04em'
                          }}>
                            DEMO DATA
                          </span>
                        )}
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.title}</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.category || 'General'}</div>
                    </td>
                    <td style={tdStyle}>{c.department || 'Unassigned'}</td>
                    <td style={tdStyle}>
                      <span style={{
                        padding: '0.25rem 0.6rem',
                        borderRadius: '12px',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        background: priorityLevel === 'CRITICAL' ? 'rgba(244, 63, 94, 0.2)' : priorityLevel === 'HIGH' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                        color: priorityLevel === 'CRITICAL' ? '#f43f5e' : priorityLevel === 'HIGH' ? '#fbbf24' : '#60a5fa',
                        border: priorityLevel === 'CRITICAL' ? '1px solid rgba(244, 63, 94, 0.4)' : priorityLevel === 'HIGH' ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid rgba(59, 130, 246, 0.4)'
                      }}>
                        {priorityLevel}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ color: priorityLevel === 'CRITICAL' ? '#f43f5e' : priorityLevel === 'HIGH' ? '#fbbf24' : '#60a5fa', fontWeight: 800 }}>
                          {priorityScore} / 100
                        </span>
                        <button
                          onClick={() => toggleExpand(c.id)}
                          title="View Transparent Priority Reasons"
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                        >
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </div>
                    </td>
                    <td style={tdStyle}><Badge status={c.status} /></td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <Button variant="secondary" onClick={() => onViewDetails(c)} style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}>
                          <Eye size={14} /> Details
                        </Button>
                        <Button variant="primary" onClick={() => onAssign(c)} style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}>
                          <UserCheck size={14} /> Assign
                        </Button>
                        <Button variant="danger" onClick={() => onEscalate(c)} style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}>
                          <AlertTriangle size={14} /> Escalate
                        </Button>
                      </div>
                    </td>
                  </tr>

                  {/* Expanded Transparent Priority Reasons Row */}
                  {isExpanded && (
                    <tr style={{ background: 'rgba(15, 23, 42, 0.7)' }}>
                      <td colSpan="7" style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                        <div style={{ fontSize: '0.82rem', color: '#c084fc', fontWeight: 700, marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Info size={14} /> Transparent Priority Breakdown for #{c.id}:
                        </div>
                        <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                          {priorityReasons.map((reason, idx) => (
                            <li key={idx} style={{ marginBottom: '0.2rem' }}>{reason}</li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })
          )}
        </tbody>
      </table>
    </Card>
  );
};

const thStyle = {
  padding: '1rem',
  fontWeight: 600
};

const tdStyle = {
  padding: '1rem',
  fontSize: '0.88rem'
};
