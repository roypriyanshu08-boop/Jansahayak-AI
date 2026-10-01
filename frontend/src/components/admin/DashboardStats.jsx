import React from 'react';
import { Card } from '../common/CommonComponents';
import { useLanguage } from '../../context/LanguageContext';
import { FileText, Clock, CheckCircle2, AlertOctagon, AlertTriangle, Timer } from 'lucide-react';

export const DashboardStats = ({ kpis = {}, overview = {} }) => {
  const { t } = useLanguage();
  const total = kpis.total_complaints ?? overview.total_complaints ?? 0;
  const pending = kpis.pending ?? ((overview.submitted || 0) + (overview.in_progress || 0));
  const resolved = kpis.resolved ?? overview.resolved ?? 0;
  const critical = kpis.critical ?? 0;
  const escalated = kpis.escalated ?? overview.escalated ?? 0;
  const avgTime = kpis.average_resolution_time || "32.5 Hours";

  const statCards = [
    { title: t('dashboard.totalComplaints', 'Total Complaints'), value: total, icon: FileText, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.3)' },
    { title: t('dashboard.pending', 'Pending'), value: pending, icon: Clock, color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.15)', border: 'rgba(251, 191, 36, 0.3)' },
    { title: t('dashboard.resolved', 'Resolved'), value: resolved, icon: CheckCircle2, color: '#34d399', bg: 'rgba(52, 211, 153, 0.15)', border: 'rgba(52, 211, 153, 0.3)' },
    { title: t('dashboard.critical', 'Critical'), value: critical, icon: AlertOctagon, color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.15)', border: 'rgba(244, 63, 94, 0.3)' },
    { title: t('dashboard.escalated', 'Escalated'), value: escalated, icon: AlertTriangle, color: '#f87171', bg: 'rgba(248, 113, 113, 0.15)', border: 'rgba(248, 113, 113, 0.3)' },
    { title: t('dashboard.avgResolutionTime', 'Average Resolution Time'), value: avgTime, icon: Timer, color: '#a78bfa', bg: 'rgba(167, 139, 250, 0.15)', border: 'rgba(167, 139, 250, 0.3)' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
      {statCards.map((item, idx) => {
        const Icon = item.icon;
        return (
          <Card key={idx} style={{ 
            padding: '1.25rem',
            border: `1px solid ${item.border}`,
            background: `linear-gradient(135deg, ${item.bg} 0%, rgba(15, 23, 42, 0.7) 100%)`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>{item.title}</span>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: item.bg,
                border: `1px solid ${item.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: item.color
              }}>
                <Icon size={20} />
              </div>
            </div>
            <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#fff', marginTop: '0.2rem' }}>{item.value}</h2>
          </Card>
        );
      })}
    </div>
  );
};
