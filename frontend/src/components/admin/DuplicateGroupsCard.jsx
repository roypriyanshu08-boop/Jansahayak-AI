import React, { useState } from 'react';
import { Card } from '../common/CommonComponents';
import { Layers, Users, Sparkles, CheckCircle2, AlertTriangle, Check, X, Search, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import { ExplainableAI } from '../common/ExplainableAI';

export const DuplicateGroupsCard = ({ duplicateGroups = [] }) => {
  const [statuses, setStatuses] = useState({});
  const [updating, setUpdating] = useState({});

  const handleStatusUpdate = async (groupId, newStatus) => {
    setUpdating(prev => ({ ...prev, [groupId]: true }));
    try {
      await adminService.updateRootCauseStatus(groupId, newStatus);
      setStatuses(prev => ({ ...prev, [groupId]: newStatus }));
    } catch (err) {
      console.error('Error updating root cause status:', err);
    } finally {
      setUpdating(prev => ({ ...prev, [groupId]: false }));
    }
  };

  return (
    <Card style={{ marginBottom: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', color: '#c084fc' }}>
          <Layers size={22} />
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>
            Common Issue Duplicate Groups <span className="gradient-text">(AI Clustered Grievances & Root Causes)</span>
          </h2>
        </div>
        <span style={{ fontSize: '0.78rem', background: 'rgba(139, 92, 246, 0.2)', color: '#e9d5ff', padding: '0.3rem 0.75rem', borderRadius: '20px', fontWeight: 700 }}>
          {duplicateGroups.length} Active Common Issue Clusters
        </span>
      </div>

      <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
        AI automatically groups related citizen complaints occurring in the same area/category and synthesizes an <strong>AI Root Cause Hypothesis</strong> for investigative dispatch.
      </p>

      {duplicateGroups.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>No duplicate complaint clusters detected currently.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {duplicateGroups.map((group) => {
            const citizenCount = group.affected_citizen_count || (group.complaint_ids ? group.complaint_ids.length : 1);
            const simScorePct = group.similarity_percentage || `${Math.round((group.similarity_score || 0.85) * 100)}%`;
            
            const currentStatus = statuses[group.group_id] || group.root_cause_status || "Needs Investigation";
            const rootCause = group.possible_root_cause || "Damaged water pipeline";
            const confidence = group.root_cause_confidence || "Medium";
            const investigation = group.recommended_investigation || "Inspect underground pipeline near affected area.";
            const summary = group.analysis_summary || `${citizenCount} complaints reported in same sector with common keywords.`;
            const isPending = updating[group.group_id];

            return (
              <div
                key={group.group_id}
                style={{
                  background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(30, 41, 59, 0.75) 100%)',
                  border: '1px solid rgba(139, 92, 246, 0.35)',
                  borderRadius: '16px',
                  padding: '1.35rem',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)'
                }}
              >
                {/* Header & Cluster Basic Info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        Cluster Group #{group.group_id}
                      </span>
                      {group.category && (
                        <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', borderRadius: '6px', fontWeight: 700 }}>
                          {group.category}
                        </span>
                      )}
                    </div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', marginTop: '0.2rem' }}>
                      {group.common_issue || "Similar Public Issue Cluster"}
                    </h3>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      padding: '0.25rem 0.65rem',
                      borderRadius: '12px',
                      background: 'rgba(16, 185, 129, 0.2)',
                      color: '#34d399',
                      border: '1px solid rgba(16, 185, 129, 0.4)'
                    }}>
                      Similarity: {simScorePct}
                    </span>
                    <span style={{
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      color: '#60a5fa',
                      background: 'rgba(59, 130, 246, 0.15)',
                      padding: '0.25rem 0.65rem',
                      borderRadius: '12px',
                      border: '1px solid rgba(59, 130, 246, 0.4)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem'
                    }}>
                      <Users size={14} /> {citizenCount} Citizens Affected ({citizenCount} Reports)
                    </span>
                  </div>
                </div>

                {/* AI Root Cause Analysis Box */}
                <div style={{
                  background: 'rgba(10, 14, 26, 0.75)',
                  border: '1px solid rgba(168, 85, 247, 0.4)',
                  borderRadius: '12px',
                  padding: '1.1rem',
                  marginBottom: '1rem',
                  position: 'relative'
                }}>
                  <ExplainableAI
                    type="root_cause"
                    value={rootCause}
                    reasons={[
                      `${citizenCount} citizen complaints reported in same ward cluster`,
                      `Keyword co-occurrence pattern in complaint texts: ${group.category || 'civic issue'}`,
                      `Recommended Field Action: ${investigation}`,
                      `Analysis Summary: ${summary}`
                    ]}
                    confidence={confidence === 'High' ? 0.88 : 0.64}
                    needsHumanVerification={currentStatus !== 'Confirmed'}
                    verificationReason={currentStatus === 'Confirmed' ? null : "Root cause is an AI hypothesis. Administrator confirmation required below."}
                    defaultExpanded={true}
                  />

                  {/* Root Cause Content Breakdown */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '0.85rem' }}>
                    <div style={{ padding: '0.75rem', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '10px', borderLeft: '4px solid #a855f7' }}>
                      <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.2rem', fontWeight: 600 }}>
                        Possible Common Root Cause
                      </span>
                      <p style={{ fontSize: '1rem', fontWeight: 800, color: '#f0abfc' }}>
                        {rootCause}
                      </p>
                    </div>

                    <div style={{ padding: '0.75rem', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '10px', borderLeft: '4px solid #38bdf8' }}>
                      <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.2rem', fontWeight: 600 }}>
                        Recommended Investigation
                      </span>
                      <p style={{ fontSize: '0.9rem', fontWeight: 700, color: '#e0f2fe' }}>
                        {investigation}
                      </p>
                    </div>
                  </div>

                  {/* Summary / Contributing patterns */}
                  {summary && (
                    <div style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', marginBottom: '0.85rem', lineHeight: '1.5' }}>
                      <strong>AI Insight Breakdown:</strong> {summary}
                    </div>
                  )}

                  {/* Admin Verification Control Bar */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'space-between',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    flexWrap: 'wrap',
                    gap: '0.75rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem' }}>
                      <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Admin Status:</span>
                      <span style={{
                        padding: '0.2rem 0.65rem',
                        borderRadius: '12px',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        background: currentStatus === 'Confirmed' 
                          ? 'rgba(16, 185, 129, 0.25)' 
                          : currentStatus === 'Rejected' 
                          ? 'rgba(244, 63, 94, 0.25)' 
                          : 'rgba(245, 158, 11, 0.25)',
                        color: currentStatus === 'Confirmed' ? '#34d399' : currentStatus === 'Rejected' ? '#f43f5e' : '#fbbf24',
                        border: currentStatus === 'Confirmed' 
                          ? '1px solid rgba(16, 185, 129, 0.5)' 
                          : currentStatus === 'Rejected' 
                          ? '1px solid rgba(244, 63, 94, 0.5)' 
                          : '1px solid rgba(245, 158, 11, 0.5)'
                      }}>
                        {currentStatus === 'Confirmed' && '✓ Confirmed'}
                        {currentStatus === 'Rejected' && '✕ Rejected'}
                        {currentStatus === 'Needs Investigation' && '🔍 Needs Investigation'}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '0.5rem', opacity: isPending ? 0.6 : 1 }}>
                      <button
                        onClick={() => handleStatusUpdate(group.group_id, 'Confirmed')}
                        disabled={isPending || currentStatus === 'Confirmed'}
                        style={{
                          padding: '0.35rem 0.75rem',
                          borderRadius: '8px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: isPending || currentStatus === 'Confirmed' ? 'default' : 'pointer',
                          background: currentStatus === 'Confirmed' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.15)',
                          color: '#34d399',
                          border: '1px solid rgba(16, 185, 129, 0.4)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem'
                        }}
                      >
                        <Check size={14} /> Confirmed
                      </button>

                      <button
                        onClick={() => handleStatusUpdate(group.group_id, 'Needs Investigation')}
                        disabled={isPending || currentStatus === 'Needs Investigation'}
                        style={{
                          padding: '0.35rem 0.75rem',
                          borderRadius: '8px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: isPending || currentStatus === 'Needs Investigation' ? 'default' : 'pointer',
                          background: currentStatus === 'Needs Investigation' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(245, 158, 11, 0.15)',
                          color: '#fbbf24',
                          border: '1px solid rgba(245, 158, 11, 0.4)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem'
                        }}
                      >
                        <Search size={14} /> Needs Investigation
                      </button>

                      <button
                        onClick={() => handleStatusUpdate(group.group_id, 'Rejected')}
                        disabled={isPending || currentStatus === 'Rejected'}
                        style={{
                          padding: '0.35rem 0.75rem',
                          borderRadius: '8px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: isPending || currentStatus === 'Rejected' ? 'default' : 'pointer',
                          background: currentStatus === 'Rejected' ? 'rgba(244, 63, 94, 0.3)' : 'rgba(244, 63, 94, 0.15)',
                          color: '#f43f5e',
                          border: '1px solid rgba(244, 63, 94, 0.4)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem'
                        }}
                      >
                        <X size={14} /> Rejected
                      </button>
                    </div>
                  </div>
                </div>

                {/* Linked Records Footer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Linked Records:</span>
                    {(group.complaint_ids || []).map((cid) => (
                      <Link
                        key={cid}
                        to={`/complaint/${cid}`}
                        style={{
                          fontSize: '0.78rem',
                          color: '#38bdf8',
                          textDecoration: 'none',
                          background: 'rgba(56, 189, 248, 0.12)',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '6px',
                          fontFamily: 'monospace',
                          fontWeight: 700
                        }}
                      >
                        #{cid.substring(0, 12)}
                      </Link>
                    ))}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--emerald)', fontWeight: 600 }}>
                    <CheckCircle2 size={14} /> Individual complaint records intact (Non-destructive)
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};
