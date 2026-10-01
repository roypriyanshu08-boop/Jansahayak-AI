import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { Card, Badge, LoadingSpinner, Button } from '../../components/common/CommonComponents';
import { 
  AlertTriangle, ShieldAlert, ArrowUpRight, CheckCircle2, 
  Settings, RefreshCw, UserCheck, ShieldCheck, Layers, Sliders, Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const EscalationManagement = () => {
  const [escalations, setEscalations] = useState([]);
  const [slaMatrix, setSlaMatrix] = useState({});
  const [loading, setLoading] = useState(true);
  const [checkingSla, setCheckingSla] = useState(false);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'sla_config'
  const [selectedLevelFilter, setSelectedLevelFilter] = useState('ALL'); // 'ALL' | 1 | 2 | 3

  // Form states for SLA configuration update
  const [editingCategory, setEditingCategory] = useState('Roads');
  const [editingPriority, setEditingPriority] = useState('CRITICAL');
  const [editingHours, setEditingHours] = useState(12.0);
  const [saveMessage, setSaveMessage] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [pendingData, matrixData] = await Promise.all([
        adminService.getPendingEscalations(),
        adminService.getSLAConfig()
      ]);
      setEscalations(pendingData || []);
      setSlaMatrix(matrixData || {});
    } catch (err) {
      console.error('Failed to load escalation management data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRunSLACheck = async () => {
    try {
      setCheckingSla(true);
      await adminService.checkSLAEscalations();
      await loadData();
    } catch (err) {
      console.error('Failed to run SLA check:', err);
    } finally {
      setCheckingSla(false);
    }
  };

  const handleSaveSLA = async (e) => {
    e.preventDefault();
    try {
      setSaveMessage('Saving SLA configuration...');
      const res = await adminService.updateSLAConfig(editingCategory, editingPriority, parseFloat(editingHours));
      setSaveMessage(res?.message || `SLA for ${editingCategory} (${editingPriority}) updated to ${editingHours}h`);
      
      // Update local SLA matrix state
      setSlaMatrix(prev => {
        const next = { ...prev };
        if (!next[editingCategory]) next[editingCategory] = {};
        next[editingCategory][editingPriority] = parseFloat(editingHours);
        return next;
      });

      setTimeout(() => setSaveMessage(''), 4000);
    } catch (err) {
      setSaveMessage('Failed to update SLA setting');
    }
  };

  const filteredEscalations = escalations.filter(esc => {
    if (selectedLevelFilter === 'ALL') return true;
    return esc.escalation_level === Number(selectedLevelFilter);
  });

  const getLevelBadgeColor = (level) => {
    if (level === 3) return { bg: 'rgba(239, 68, 68, 0.25)', border: 'rgba(239, 68, 68, 0.6)', text: '#fca5a5' };
    if (level === 2) return { bg: 'rgba(245, 158, 11, 0.25)', border: 'rgba(245, 158, 11, 0.6)', text: '#fcd34d' };
    return { bg: 'rgba(59, 130, 246, 0.25)', border: 'rgba(59, 130, 246, 0.6)', text: '#93c5fd' };
  };

  if (loading) return <LoadingSpinner label="Retrieving Pending Escalations & Configured SLA Matrix..." />;

  return (
    <div className="main-content">
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#f43f5e', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            <AlertTriangle size={14} /> Multi-Level SLA & Escalation Governance
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Pending Escalations & SLA Management</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
            Monitor SLA breaches across Level 1 (Officer), Level 2 (Supervisor), and Level 3 (Senior Authority).
          </p>
        </div>

        <Button 
          variant="secondary" 
          onClick={handleRunSLACheck}
          disabled={checkingSla}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <RefreshCw size={16} className={checkingSla ? 'spin' : ''} />
          {checkingSla ? 'Evaluating SLA Breach Limits...' : 'Trigger SLA Scan'}
        </Button>
      </div>

      {/* Mode Navigation Tabs */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '0.75rem' }}>
        <button
          onClick={() => setActiveTab('pending')}
          style={{
            padding: '0.6rem 1.25rem',
            borderRadius: '8px',
            border: 'none',
            fontSize: '0.9rem',
            fontWeight: 700,
            cursor: 'pointer',
            background: activeTab === 'pending' ? 'var(--primary-color)' : 'transparent',
            color: activeTab === 'pending' ? '#fff' : 'var(--text-muted)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <ShieldAlert size={16} /> Pending Escalations ({escalations.length})
        </button>

        <button
          onClick={() => setActiveTab('sla_config')}
          style={{
            padding: '0.6rem 1.25rem',
            borderRadius: '8px',
            border: 'none',
            fontSize: '0.9rem',
            fontWeight: 700,
            cursor: 'pointer',
            background: activeTab === 'sla_config' ? 'var(--primary-color)' : 'transparent',
            color: activeTab === 'sla_config' ? '#fff' : 'var(--text-muted)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Sliders size={16} /> Configurable SLA Matrix
        </button>
      </div>

      {/* Tab 1: Pending Escalations Queue */}
      {activeTab === 'pending' && (
        <div>
          {/* Level Filter Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Filter by Level:</span>
            {[
              { id: 'ALL', label: 'All Levels' },
              { id: '1', label: 'Level 1 → Officer' },
              { id: '2', label: 'Level 2 → Supervisor' },
              { id: '3', label: 'Level 3 → Senior Authority' }
            ].map(btn => (
              <button
                key={btn.id}
                onClick={() => setSelectedLevelFilter(btn.id)}
                style={{
                  padding: '0.35rem 0.8rem',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  border: selectedLevelFilter === btn.id ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                  background: selectedLevelFilter === btn.id ? 'rgba(56, 189, 248, 0.2)' : 'rgba(15, 23, 42, 0.5)',
                  color: selectedLevelFilter === btn.id ? '#38bdf8' : 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                {btn.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {filteredEscalations.length === 0 ? (
              <Card style={{ textAlign: 'center', padding: '3rem' }}>
                <CheckCircle2 size={36} color="#34d399" style={{ margin: '0 auto 0.5rem auto' }} />
                <p style={{ color: 'var(--text-muted)' }}>No pending escalations for the selected level filter.</p>
              </Card>
            ) : (
              filteredEscalations.map((esc) => {
                const badgeStyle = getLevelBadgeColor(esc.escalation_level);
                return (
                  <Card key={esc.complaint_id || esc.id} style={{ borderLeft: `5px solid ${badgeStyle.border}`, background: 'rgba(15, 23, 42, 0.7)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                      <div>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          padding: '0.25rem 0.65rem',
                          borderRadius: '12px',
                          background: badgeStyle.bg,
                          color: badgeStyle.text,
                          border: `1px solid ${badgeStyle.border}`
                        }}>
                          LEVEL {esc.escalation_level} ESCALATION → {esc.escalated_to}
                        </span>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '0.4rem', color: '#fff' }}>
                          {esc.title}
                        </h3>
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                          ID: {esc.complaint_id} • Category: {esc.category} • Priority: {esc.priority}
                        </span>
                      </div>

                      <Link to={`/complaint/${esc.complaint_id}`}>
                        <Button variant="secondary" style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                          View Detail <ArrowUpRight size={14} />
                        </Button>
                      </Link>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', background: 'rgba(10, 14, 26, 0.5)', padding: '1rem', borderRadius: '10px', marginBottom: '1rem' }}>
                      <div>
                        <span style={labelStyle}>Escalated Authority</span>
                        <p style={{ fontWeight: 800, color: badgeStyle.text }}>
                          {esc.escalated_to === 'Senior Authority' ? 'Level 3: Municipal Commissioner / Senior Admin' :
                           esc.escalated_to === 'Supervisor' ? 'Level 2: Zonal Department Supervisor' :
                           'Level 1: Assigned Field Officer'}
                        </p>
                      </div>

                      <div>
                        <span style={labelStyle}>SLA Deadline Status</span>
                        <p style={{ fontWeight: 700, color: '#f87171' }}>
                          SLA ({esc.sla_hours}h) Breached • Exceeded limit
                        </p>
                      </div>

                      <div>
                        <span style={labelStyle}>Escalation Trigger Reason</span>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>{esc.reason}</p>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Configurable SLA Matrix */}
      {activeTab === 'sla_config' && (
        <div>
          {/* Edit SLA Controls Card */}
          <Card style={{ marginBottom: '1.5rem', border: '1px solid rgba(59, 130, 246, 0.4)' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Settings size={20} color="#60a5fa" /> Configure SLA Thresholds
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Define resolution SLA hours by Category and Priority. When a complaint exceeds its target SLA, the system automatically triggers multi-level escalations.
            </p>

            <form onSubmit={handleSaveSLA} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', alignItems: 'end' }}>
              <div>
                <label style={labelStyle}>Category</label>
                <select
                  value={editingCategory}
                  onChange={(e) => setEditingCategory(e.target.value)}
                  style={inputStyle}
                >
                  {Object.keys(slaMatrix).map(cat => (
                    <option key={cat} value={cat} style={{ background: '#0f172a', color: '#fff' }}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Priority</label>
                <select
                  value={editingPriority}
                  onChange={(e) => setEditingPriority(e.target.value)}
                  style={inputStyle}
                >
                  <option value="CRITICAL" style={{ background: '#0f172a', color: '#fff' }}>CRITICAL</option>
                  <option value="HIGH" style={{ background: '#0f172a', color: '#fff' }}>HIGH</option>
                  <option value="MEDIUM" style={{ background: '#0f172a', color: '#fff' }}>MEDIUM</option>
                  <option value="LOW" style={{ background: '#0f172a', color: '#fff' }}>LOW</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>SLA Limit (Hours)</label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  max="168"
                  value={editingHours}
                  onChange={(e) => setEditingHours(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <Button type="submit" variant="primary" style={{ padding: '0.65rem 1.25rem' }}>
                Save SLA Rule
              </Button>
            </form>

            {saveMessage && (
              <div style={{ marginTop: '1rem', padding: '0.65rem 1rem', background: 'rgba(52, 211, 153, 0.15)', border: '1px solid rgba(52, 211, 153, 0.4)', borderRadius: '8px', color: '#34d399', fontSize: '0.85rem', fontWeight: 600 }}>
                {saveMessage}
              </div>
            )}
          </Card>

          {/* Current SLA Matrix Display */}
          <Card>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem', color: '#fff' }}>
              Active SLA Matrix (Category vs Priority)
            </h3>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>Category</th>
                    <th style={{ padding: '0.75rem 1rem', color: '#f43f5e' }}>Critical SLA</th>
                    <th style={{ padding: '0.75rem 1rem', color: '#fbbf24' }}>High SLA</th>
                    <th style={{ padding: '0.75rem 1rem', color: '#60a5fa' }}>Medium SLA</th>
                    <th style={{ padding: '0.75rem 1rem', color: '#94a3b8' }}>Low SLA</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(slaMatrix).map(([cat, prios]) => (
                    <tr key={cat} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#f8fafc' }}>{cat}</td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#f43f5e' }}>{prios.CRITICAL || 12}h</td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#fbbf24' }}>{prios.HIGH || 24}h</td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#60a5fa' }}>{prios.MEDIUM || 48}h</td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#94a3b8' }}>{prios.LOW || 72}h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

const labelStyle = { display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.25rem' };
const inputStyle = {
  width: '100%',
  padding: '0.6rem 0.85rem',
  background: 'rgba(15, 23, 42, 0.8)',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '0.9rem'
};
