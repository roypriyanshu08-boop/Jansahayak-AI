import React, { useState } from 'react';
import { complaintService } from '../../services/complaintService';
import { Card, Button, Badge, LoadingSpinner, ProgressStepper, EmptyState } from '../../components/common/CommonComponents';
import { Search, MapPin, Calendar, Briefcase, Cpu, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export const TrackComplaint = () => {
  const { user } = useAuth();
  const [complaintId, setComplaintId] = useState('');
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!complaintId.trim()) return;
    setLoading(true);
    setError('');
    try {
      const data = await complaintService.getComplaintById(complaintId.trim());
      const ownerId = data?.userId || data?.user_id;
      if (user?.role !== 'admin' && user?.id && ownerId && ownerId !== user.id) {
        setError('Grievance ID not found or access forbidden for your account.');
        setComplaint(null);
      } else {
        setComplaint(data);
      }
    } catch (err) {
      setError('Grievance ID not found or access forbidden for your account.');
      setComplaint(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-content" style={{ maxWidth: '850px' }}>
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800 }}>Track Public Grievance</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
          Enter your 12-digit Grievance ID number to view real-time resolution progress
        </p>
      </div>

      <Card style={{ marginBottom: '2rem', padding: '1.75rem' }}>
        <form onSubmit={handleTrack} style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              type="text"
              required
              placeholder="e.g. GRV-2026-8901"
              value={complaintId}
              onChange={(e) => setComplaintId(e.target.value)}
              style={{
                width: '100%',
                padding: '0.85rem 1rem 0.85rem 2.75rem',
                background: 'rgba(10, 14, 26, 0.7)',
                border: '1px solid var(--glass-border)',
                borderRadius: '10px',
                color: 'var(--text-primary)',
                fontSize: '1rem',
                outline: 'none',
                fontFamily: 'monospace'
              }}
            />
            <Search size={20} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>
          <Button type="submit" disabled={loading} style={{ padding: '0.85rem 1.5rem', fontSize: '1rem' }}>
            {loading ? 'Searching...' : 'Track Grievance'}
          </Button>
        </form>
      </Card>

      {error && (
        <EmptyState title="ID Not Found" message={error} />
      )}

      {loading && <LoadingSpinner label="Locating Grievance Record & History Logs..." />}

      {complaint && !loading && (
        <div>
          <Card style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                  ID: {complaint.id}
                </span>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '0.2rem' }}>{complaint.title}</h2>
              </div>
              <Badge status={complaint.status} />
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              {complaint.description}
            </p>

            {/* Stepper Progress Visualizer */}
            <ProgressStepper currentStatus={complaint.status} />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1.5rem', padding: '1rem', background: 'rgba(10, 14, 26, 0.4)', borderRadius: '12px' }}>
              <div>
                <span style={labelStyle}>Category & Dept</span>
                <p style={valueStyle}>{complaint.category} ({complaint.department || 'PWD'})</p>
              </div>
              <div>
                <span style={labelStyle}>Location</span>
                <p style={valueStyle}><MapPin size={14} /> {complaint.address || 'Specified'}</p>
              </div>
              <div>
                <span style={labelStyle}>Submitted On</span>
                <p style={valueStyle}><Calendar size={14} /> {new Date(complaint.created_at).toLocaleString()}</p>
              </div>
            </div>
          </Card>

          {complaint.ai_analysis && (
            <Card style={{ border: '1px solid rgba(59, 130, 246, 0.3)', background: 'rgba(59, 130, 246, 0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#60a5fa', marginBottom: '0.75rem' }}>
                <Cpu size={20} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>AI Dispatch Diagnostic Summary</h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.9rem' }}>
                <div>
                  <span style={labelStyle}>Predicted Severity</span>
                  <span style={{ color: '#f59e0b', fontWeight: 700 }}>{complaint.ai_analysis.severity} ({complaint.ai_analysis.impact_score}/100)</span>
                </div>
                <div>
                  <span style={labelStyle}>Target Resolution SLA</span>
                  <span style={{ color: '#10b981', fontWeight: 700 }}>{complaint.ai_analysis.estimated_resolution_time}</span>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

const labelStyle = { display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.2rem' };
const valueStyle = { fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' };
