import React, { useEffect, useState } from 'react';
import { complaintService } from '../../services/complaintService';
import { adminService } from '../../services/adminService';
import { ComplaintTable } from '../../components/admin/ComplaintTable';
import { Card, Button, LoadingSpinner } from '../../components/common/CommonComponents';
import { Sparkles, CheckCircle2, UserCheck, ShieldAlert, Cpu } from 'lucide-react';
import { ExplainableAI } from '../../components/common/ExplainableAI';

export const ManageComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [loadingRec, setLoadingRec] = useState(false);
  const [selectedOfficer, setSelectedOfficer] = useState('');

  const loadData = async () => {
    try {
      const [cData, oData] = await Promise.all([
        complaintService.getAllComplaints(),
        adminService.getOfficers()
      ]);
      setComplaints(cData);
      setOfficers(oData);
    } catch (err) {
      console.error('Failed to load complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectComplaint = async (complaint) => {
    setSelectedComplaint(complaint);
    setLoadingRec(true);
    try {
      const rec = await adminService.recommendOfficer(complaint);
      setRecommendation(rec);
      if (rec?.recommended_officer?.officer_id) {
        setSelectedOfficer(rec.recommended_officer.officer_id);
      }
    } catch (err) {
      console.error('Failed to get officer recommendation:', err);
    } finally {
      setLoadingRec(false);
    }
  };

  const handleAssignSubmit = async (e, customOfficerId = null) => {
    if (e) e.preventDefault();
    const officerIdToAssign = customOfficerId || selectedOfficer;
    if (!selectedComplaint || !officerIdToAssign) return;

    try {
      await adminService.assignOfficer({
        complaint_id: selectedComplaint.id,
        officer_id: officerIdToAssign
      });
      setSelectedComplaint(null);
      setRecommendation(null);
      setSelectedOfficer('');
      loadData();
    } catch (err) {
      console.error('Failed to assign officer:', err);
    }
  };

  if (loading) return <LoadingSpinner label="Loading Grievances List..." />;

  return (
    <div className="main-content">
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Manage Civic Complaints</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Review citizen grievances, execute Smart Officer Dispatch, and manage escalations
          </p>
        </div>
      </div>

      {selectedComplaint && (
        <Card style={{
          marginBottom: '2rem',
          border: '1px solid rgba(139, 92, 246, 0.4)',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.8) 100%)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Grievance #{selectedComplaint.id}</span>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', marginTop: '0.2rem' }}>
                {selectedComplaint.title}
              </h2>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Category: <strong>{selectedComplaint.category || 'General'}</strong> | Location: <strong>{selectedComplaint.address || 'Ward 12'}</strong> | Priority: <strong style={{ color: selectedComplaint.priority === 'CRITICAL' ? '#f43f5e' : '#fbbf24' }}>{selectedComplaint.priority || 'MEDIUM'}</strong>
              </span>
            </div>

            <Button variant="secondary" onClick={() => { setSelectedComplaint(null); setRecommendation(null); }}>
              Cancel
            </Button>
          </div>

          {loadingRec ? (
            <LoadingSpinner label="Evaluating Department, Ward Area, Specialization & Workloads..." />
          ) : recommendation && recommendation.recommended_officer ? (
            <div>
              {/* AI Smart Recommendation Box */}
              <div style={{
                background: 'rgba(10, 14, 26, 0.75)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                borderRadius: '12px',
                padding: '1.15rem',
                marginBottom: '1.25rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#34d399' }}>
                    <Sparkles size={20} />
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Smart Officer Recommendation (AI Suggestion)</h3>
                  </div>

                  <span style={{
                    padding: '0.2rem 0.65rem',
                    borderRadius: '12px',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    background: 'rgba(16, 185, 129, 0.2)',
                    color: '#34d399',
                    border: '1px solid rgba(16, 185, 129, 0.4)'
                  }}>
                    Match Score: {recommendation.recommended_officer.match_score || 95} / 100
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '0.85rem' }}>
                  <div style={{ padding: '0.65rem 0.85rem', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '8px', borderLeft: '3px solid #34d399' }}>
                    <span style={labelStyle}>Recommended Officer</span>
                    <p style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff' }}>
                      {recommendation.recommended_officer.name}
                    </p>
                  </div>

                  <div style={{ padding: '0.65rem 0.85rem', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '8px', borderLeft: '3px solid #38bdf8' }}>
                    <span style={labelStyle}>Department & Area</span>
                    <p style={{ fontSize: '0.9rem', fontWeight: 700, color: '#e0f2fe' }}>
                      {recommendation.recommended_officer.department} ({recommendation.recommended_officer.assigned_area})
                    </p>
                  </div>

                  <div style={{ padding: '0.65rem 0.85rem', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '8px', borderLeft: '3px solid #fbbf24' }}>
                    <span style={labelStyle}>Current Workload</span>
                    <p style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fbbf24' }}>
                      {recommendation.current_workload} Pending Complaints
                    </p>
                  </div>
                </div>

                {/* Explainable AI Decision Factors */}
                <ExplainableAI
                  type="department"
                  title="AI Assignment Recommendation Rationale"
                  value={`${recommendation.recommended_officer.name} (${recommendation.recommended_officer.department})`}
                  reasons={[
                    `Department & Category Alignment: ${recommendation.recommended_officer.department}`,
                    `Geographic Ward Match: ${recommendation.recommended_officer.assigned_area}`,
                    `Lowest Active Queue Workload: ${recommendation.current_workload} pending complaints`,
                    `Match Rationale: ${recommendation.reason}`
                  ]}
                  confidence={(recommendation.recommended_officer.match_score || 95) / 100}
                  needsHumanVerification={false}
                  defaultExpanded={true}
                />

                {/* Quick Assign Recommended Officer */}
                <Button
                  onClick={(e) => handleAssignSubmit(e, recommendation.recommended_officer.officer_id)}
                  style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', width: '100%', justifyContent: 'center' }}
                >
                  <UserCheck size={18} /> Accept AI Recommendation & Assign {recommendation.recommended_officer.name} (Pending: {recommendation.current_workload})
                </Button>
              </div>

              {/* Admin Manual Control & Override Form */}
              <div style={{ borderTop: '1px dashed var(--glass-border)', paddingTop: '1rem' }}>
                <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.6rem' }}>
                  Admin Manual Selection (Override Recommendation):
                </h4>
                <form onSubmit={handleAssignSubmit} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <select
                    value={selectedOfficer}
                    onChange={(e) => setSelectedOfficer(e.target.value)}
                    required
                    style={{ flex: 1, minWidth: '260px', padding: '0.75rem', background: 'rgba(10, 14, 26, 0.7)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-primary)' }}
                  >
                    <option value="">Select Field Officer...</option>
                    {(recommendation.all_ranked_officers || officers).map(o => (
                      <option key={o.officer_id || o.id} value={o.officer_id || o.id}>
                        {o.name} — {o.department} ({o.assigned_area}) | Pending Workload: {o.current_workload} | Match: {o.match_score || 0} pts
                      </option>
                    ))}
                  </select>
                  <Button type="submit" variant="secondary">
                    Confirm Custom Assignment
                  </Button>
                </form>
              </div>
            </div>
          ) : null}
        </Card>
      )}

      <ComplaintTable
        complaints={complaints}
        onAssign={(c) => handleSelectComplaint(c)}
        onEscalate={(c) => handleSelectComplaint(c)}
        onViewDetails={(c) => window.location.href = `/complaint/${c.id}`}
      />
    </div>
  );
};

const labelStyle = { display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.2rem' };
