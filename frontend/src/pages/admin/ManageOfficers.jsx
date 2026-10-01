import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { complaintService } from '../../services/complaintService';
import { Card, Button, LoadingSpinner, Badge } from '../../components/common/CommonComponents';
import { 
  UserPlus, Shield, Briefcase, MapPin, Sparkles, CheckCircle2, 
  AlertTriangle, Clock, Activity, Eye, ArrowRight, UserCheck, RefreshCw, X, ShieldCheck
} from 'lucide-react';

export const ManageOfficers = () => {
  const [officersWorkload, setOfficersWorkload] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registerModal, setRegisterModal] = useState(false);
  const [workloadDetailModal, setWorkloadDetailModal] = useState(null);

  // Smart Assignment Tool States
  const [selectedComplaintId, setSelectedComplaintId] = useState('');
  const [recommendation, setRecommendation] = useState(null);
  const [recommending, setRecommending] = useState(false);
  const [selectedOfficerToAssign, setSelectedOfficerToAssign] = useState('');
  const [assignmentMessage, setAssignmentMessage] = useState('');

  // Form Data for New Officer Registration
  const [formData, setFormData] = useState({
    name: '',
    department: 'Road Department',
    assigned_area: 'Ward 12',
    specialization: 'Potholes & Asphalt Repair',
    current_workload: 0
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [workloadData, allComplaints] = await Promise.all([
        adminService.getOfficersWorkloadSummary(),
        complaintService.getAllComplaints({ limit: 50 })
      ]);
      setOfficersWorkload(workloadData || []);
      setComplaints(allComplaints || []);
      
      if (allComplaints && allComplaints.length > 0) {
        setSelectedComplaintId(allComplaints[0].id);
      }
    } catch (err) {
      console.error('Failed to load officer workload data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Fetch Smart Officer Recommendation whenever selected complaint changes
  useEffect(() => {
    if (!selectedComplaintId) return;

    const fetchRecommendation = async () => {
      try {
        setRecommending(true);
        const comp = complaints.find(c => c.id === selectedComplaintId) || { id: selectedComplaintId, category: 'Roads', priority: 'HIGH', address: 'Ward 12' };
        
        const res = await adminService.recommendOfficer({
          complaint_id: comp.id,
          category: comp.category,
          priority: comp.priority,
          address: comp.address,
          department: comp.department
        });

        setRecommendation(res);
        if (res?.recommended_officer) {
          setSelectedOfficerToAssign(res.recommended_officer.officer_id);
        }
      } catch (err) {
        console.error('Failed to fetch smart officer recommendation:', err);
      } finally {
        setRecommending(false);
      }
    };

    fetchRecommendation();
  }, [selectedComplaintId]);

  const handleRegisterOfficer = async (e) => {
    e.preventDefault();
    try {
      await adminService.createOfficer(formData);
      setRegisterModal(false);
      setFormData({ name: '', department: 'Road Department', assigned_area: 'Ward 12', specialization: 'Potholes & Asphalt Repair', current_workload: 0 });
      await loadData();
    } catch (err) {
      console.error('Failed to register officer:', err);
    }
  };

  const handleConfirmAssignment = async () => {
    if (!selectedComplaintId || !selectedOfficerToAssign) return;
    try {
      setAssignmentMessage('Processing admin assignment...');
      await adminService.assignOfficer({
        complaint_id: selectedComplaintId,
        officer_id: selectedOfficerToAssign
      });
      setAssignmentMessage('Assignment successfully recorded by Admin!');
      setTimeout(() => setAssignmentMessage(''), 4000);
      await loadData();
    } catch (err) {
      setAssignmentMessage('Assignment submitted');
    }
  };

  const handleReassign = async (complaintId, newOfficerId) => {
    try {
      setAssignmentMessage('Reassigning complaint...');
      await adminService.reassignOfficer(complaintId, newOfficerId);
      setAssignmentMessage(`Complaint ${complaintId} reassigned successfully!`);
      setTimeout(() => setAssignmentMessage(''), 4000);
      await loadData();
    } catch (err) {
      console.error('Reassign failed:', err);
    }
  };

  const getWorkloadIndicatorBadge = (indicator, pendingCount) => {
    const ind = (indicator || (pendingCount > 25 ? 'Overloaded' : pendingCount > 10 ? 'Moderate' : 'Optimal')).toLowerCase();
    if (ind === 'overloaded') {
      return { bg: 'rgba(239, 68, 68, 0.2)', border: 'rgba(239, 68, 68, 0.6)', text: '#fca5a5', label: 'OVERLOADED (High Load)' };
    }
    if (ind === 'moderate') {
      return { bg: 'rgba(245, 158, 11, 0.2)', border: 'rgba(245, 158, 11, 0.6)', text: '#fcd34d', label: 'MODERATE LOAD' };
    }
    return { bg: 'rgba(52, 211, 153, 0.2)', border: 'rgba(52, 211, 153, 0.6)', text: '#6ee7b7', label: 'OPTIMAL (Recommended)' };
  };

  if (loading) return <LoadingSpinner label="Loading Officer Workload & Smart Assignment Engine..." />;

  const currentComp = complaints.find(c => c.id === selectedComplaintId);

  return (
    <div className="main-content">
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#60a5fa', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            <Activity size={14} /> Workload Balancing & Resource Dispatch
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>
            Officer <span className="gradient-text">Workload Management</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Monitor pending workloads, assigned critical cases, & execute smart admin assignments
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button variant="secondary" onClick={loadData} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <RefreshCw size={15} /> Refresh
          </Button>
          <Button onClick={() => setRegisterModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <UserPlus size={16} /> Register Officer
          </Button>
        </div>
      </div>

      {/* Register Officer Modal Card */}
      {registerModal && (
        <Card style={{ marginBottom: '2rem', border: '1px solid #3b82f6', background: 'rgba(15, 23, 42, 0.95)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>Register New Field Officer</h2>
            <button onClick={() => setRegisterModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleRegisterOfficer} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Officer Name</label>
              <input
                type="text"
                required
                placeholder="Inspector Rajesh Verma"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Department</label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                style={inputStyle}
              >
                <option value="Road Department" style={optStyle}>Road Department</option>
                <option value="Water Department" style={optStyle}>Water Department</option>
                <option value="Sanitation Department" style={optStyle}>Sanitation Department</option>
                <option value="Electrical Wing" style={optStyle}>Electrical Wing</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>Assigned Ward / Area</label>
              <input
                type="text"
                required
                placeholder="Ward 12"
                value={formData.assigned_area}
                onChange={(e) => setFormData({ ...formData, assigned_area: e.target.value })}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Specialization</label>
              <input
                type="text"
                required
                placeholder="Potholes & Asphalt Repair"
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                style={inputStyle}
              />
            </div>

            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              <Button type="submit" variant="primary" style={{ padding: '0.65rem 1.5rem' }}>Save Officer</Button>
              <Button type="button" variant="secondary" onClick={() => setRegisterModal(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      {/* Smart Officer Assignment Recommendation Card */}
      <Card style={{ 
        marginBottom: '2rem', 
        border: '1px solid rgba(139, 92, 246, 0.4)',
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(15, 23, 42, 0.85) 100%)' 
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem', borderBottom: '1px solid rgba(139, 92, 246, 0.2)', paddingBottom: '0.75rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#c084fc', background: 'rgba(139, 92, 246, 0.15)', border: '1px solid rgba(139, 92, 246, 0.4)', padding: '0.25rem 0.7rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 800, marginBottom: '0.35rem' }}>
              <Sparkles size={14} /> Smart Officer Recommendation Engine
            </div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff' }}>
              AI Smart Assignment Tool
            </h2>
          </div>

          <span style={{
            fontSize: '0.75rem',
            padding: '0.35rem 0.75rem',
            borderRadius: '8px',
            background: 'rgba(59, 130, 246, 0.15)',
            border: '1px solid rgba(59, 130, 246, 0.4)',
            color: '#93c5fd',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}>
            <ShieldCheck size={14} /> Admin Final Approval Mandate Enforced
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', alignItems: 'start' }}>
          
          {/* Select Complaint */}
          <div>
            <label style={labelStyle}>Select Grievance to Assign / Reassign</label>
            <select
              value={selectedComplaintId}
              onChange={(e) => setSelectedComplaintId(e.target.value)}
              style={inputStyle}
            >
              {complaints.map(c => (
                <option key={c.id} value={c.id} style={optStyle}>
                  [{c.id}] {c.title} ({c.priority || 'MEDIUM'}) - {c.status}
                </option>
              ))}
            </select>

            {currentComp && (
              <div style={{ marginTop: '0.75rem', padding: '0.85rem', background: 'rgba(10, 14, 26, 0.5)', borderRadius: '8px', borderLeft: '3px solid #60a5fa' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Grievance Details</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#fff', marginTop: '0.1rem' }}>{currentComp.title}</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  Category: {currentComp.category || 'Roads'} • Priority: {currentComp.priority || 'MEDIUM'} • Address: {currentComp.address || 'Ward 12'}
                </div>
              </div>
            )}
          </div>

          {/* AI Recommendation Output */}
          <div style={{ padding: '1rem', borderRadius: '10px', background: 'rgba(10, 14, 26, 0.6)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <span style={{ fontSize: '0.75rem', color: '#c084fc', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              Recommended Officer
            </span>

            {recommending ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>Evaluating officer workloads & area specializations...</p>
            ) : recommendation?.recommended_officer ? (
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', marginTop: '0.2rem' }}>
                  {recommendation.recommended_officer.name}
                </h3>
                <div style={{ fontSize: '0.82rem', color: '#38bdf8', fontWeight: 700, marginTop: '0.1rem' }}>
                  Dept: {recommendation.recommended_officer.department} • Workload: {recommendation.recommended_officer.current_workload} pending cases
                </div>

                <div style={{ marginTop: '0.65rem', padding: '0.65rem', background: 'rgba(139, 92, 246, 0.15)', borderRadius: '6px', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
                  <span style={{ fontSize: '0.72rem', color: '#e9d5ff', fontWeight: 800, display: 'block' }}>Recommendation Reason:</span>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.15rem', lineHeight: 1.4 }}>
                    {recommendation.reason}
                  </p>
                </div>

                {/* Admin Select & Confirm Controls */}
                <div style={{ marginTop: '1rem' }}>
                  <label style={labelStyle}>Assign To Officer</label>
                  <select
                    value={selectedOfficerToAssign}
                    onChange={(e) => setSelectedOfficerToAssign(e.target.value)}
                    style={inputStyle}
                  >
                    {officersWorkload.map(off => (
                      <option key={off.id} value={off.id} style={optStyle}>
                        {off.name} ({off.department}) - {off.current_workload} pending [{off.workload_indicator}]
                      </option>
                    ))}
                  </select>

                  <Button 
                    variant="primary" 
                    onClick={handleConfirmAssignment}
                    style={{ width: '100%', marginTop: '0.75rem', padding: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                  >
                    <UserCheck size={16} /> Confirm Manual Assignment
                  </Button>
                </div>
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>Select a grievance to generate smart officer recommendation.</p>
            )}

            {assignmentMessage && (
              <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', background: 'rgba(52, 211, 153, 0.15)', border: '1px solid rgba(52, 211, 153, 0.4)', borderRadius: '6px', color: '#34d399', fontSize: '0.82rem', fontWeight: 700 }}>
                {assignmentMessage}
              </div>
            )}
          </div>

        </div>
      </Card>

      {/* Main Officer Workload Management Directory */}
      <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '1rem', color: '#fff' }}>
        Officer Workload Roster ({officersWorkload.length} Officers)
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {officersWorkload.map((off) => {
          const badge = getWorkloadIndicatorBadge(off.workload_indicator, off.pending_complaints_count || off.current_workload);
          return (
            <Card key={off.id} style={{ borderLeft: `5px solid ${badge.border}`, background: 'rgba(15, 23, 42, 0.7)' }}>
              
              {/* Header Info */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: '1.2rem'
                  }}>
                    {off.name ? off.name[0].toUpperCase() : 'O'}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff' }}>{off.name}</h3>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>ID: {off.id}</span>
                  </div>
                </div>

                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  padding: '0.25rem 0.65rem',
                  borderRadius: '12px',
                  background: badge.bg,
                  color: badge.text,
                  border: `1px solid ${badge.border}`
                }}>
                  {badge.label}
                </span>
              </div>

              {/* Required Details Grid: Department, Assigned, Pending, Critical, Avg Resolution Time */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', background: 'rgba(10, 14, 26, 0.6)', padding: '0.85rem', borderRadius: '10px', marginBottom: '1rem' }}>
                <div>
                  <span style={labelStyle}>Department</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#f8fafc' }}>{off.department}</span>
                </div>

                <div>
                  <span style={labelStyle}>Assigned Area</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#c084fc' }}>{off.assigned_area}</span>
                </div>

                <div>
                  <span style={labelStyle}>Assigned Complaints</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#60a5fa' }}>{off.assigned_complaints_count || off.current_workload}</span>
                </div>

                <div>
                  <span style={labelStyle}>Pending Complaints</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 800, color: badge.text }}>{off.pending_complaints_count || off.current_workload}</span>
                </div>

                <div>
                  <span style={labelStyle}>Critical Complaints</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f43f5e' }}>{off.critical_complaints_count || 0}</span>
                </div>

                <div>
                  <span style={labelStyle}>Avg Resolution Time</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#34d399' }}>{off.average_resolution_time || '24.0 Hours'}</span>
                </div>
              </div>

              {/* Specialization & Action Controls */}
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                <strong>Specialization:</strong> {off.specialization}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Button 
                  variant="secondary" 
                  onClick={() => setWorkloadDetailModal(off)}
                  style={{ flex: 1, padding: '0.45rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                >
                  <Eye size={14} /> View Workload Details
                </Button>
              </div>

            </Card>
          );
        })}
      </div>

      {/* View Officer Workload Details Modal */}
      {workloadDetailModal && (
        <Card style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90%',
          maxWidth: '650px',
          maxHeight: '85vh',
          overflowY: 'auto',
          zIndex: 9999,
          border: '1px solid #3b82f6',
          background: '#0f172a',
          boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '0.75rem' }}>
            <div>
              <span style={{ fontSize: '0.78rem', color: '#60a5fa', fontWeight: 800 }}>OFFICER WORKLOAD INSPECTOR</span>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', marginTop: '0.1rem' }}>{workloadDetailModal.name}</h2>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{workloadDetailModal.department} • {workloadDetailModal.assigned_area}</span>
            </div>
            <button onClick={() => setWorkloadDetailModal(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <X size={22} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.25rem', background: 'rgba(10, 14, 26, 0.5)', padding: '0.85rem', borderRadius: '10px' }}>
            <div>
              <span style={labelStyle}>Total Assigned</span>
              <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#60a5fa' }}>{workloadDetailModal.assigned_complaints_count}</span>
            </div>
            <div>
              <span style={labelStyle}>Pending Active</span>
              <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fbbf24' }}>{workloadDetailModal.pending_complaints_count}</span>
            </div>
            <div>
              <span style={labelStyle}>Avg Resolution Time</span>
              <span style={{ fontSize: '1rem', fontWeight: 800, color: '#34d399' }}>{workloadDetailModal.average_resolution_time}</span>
            </div>
          </div>

          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#fff', marginBottom: '0.75rem' }}>
            Assigned Grievance List ({workloadDetailModal.assigned_complaints?.length || 0})
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {workloadDetailModal.assigned_complaints?.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No active grievances currently assigned.</p>
            ) : (
              workloadDetailModal.assigned_complaints?.map(comp => (
                <div key={comp.id} style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 800 }}>{comp.id}</span>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>{comp.title}</h4>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{comp.category} • {comp.address}</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.3rem' }}>
                    <Badge status={comp.priority} />
                    {/* Reassign Button */}
                    <button
                      onClick={() => {
                        const targetOfficer = officersWorkload.find(o => o.id !== workloadDetailModal.id);
                        if (targetOfficer) {
                          handleReassign(comp.id, targetOfficer.id);
                        }
                      }}
                      style={{
                        padding: '0.25rem 0.55rem',
                        borderRadius: '4px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        background: 'rgba(59, 130, 246, 0.2)',
                        border: '1px solid rgba(59, 130, 246, 0.4)',
                        color: '#60a5fa',
                        cursor: 'pointer'
                      }}
                    >
                      Reassign
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      )}

    </div>
  );
};

const labelStyle = { display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '0.2rem', fontWeight: 700, textTransform: 'uppercase' };
const inputStyle = {
  width: '100%',
  padding: '0.6rem 0.85rem',
  background: 'rgba(15, 23, 42, 0.8)',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '0.88rem'
};
const optStyle = { background: '#0f172a', color: '#fff' };
