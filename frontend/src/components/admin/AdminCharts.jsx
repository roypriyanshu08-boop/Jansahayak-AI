import React from 'react';
import { Card } from '../common/CommonComponents';
import { 
  BarChart3, PieChart, TrendingUp, Clock, AlertTriangle, 
  Layers, ShieldAlert, Cpu, CheckCircle2, Copy
} from 'lucide-react';

export const AdminCharts = ({ analyticsData }) => {
  if (!analyticsData) return null;

  const byCategory = analyticsData.by_category || {};
  const byDepartment = analyticsData.by_department || {};
  const byPriority = analyticsData.by_priority || { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
  const byStatus = analyticsData.by_status || {};
  const overTime = analyticsData.over_time || [];
  const resolutionTimeByCategory = analyticsData.resolution_time_by_category || {};
  const dupGroups = analyticsData.duplicate_groups || { total_groups: 0, confirmed_root_causes: 0, total_affected_citizens: 0, groups: [] };

  const totalCat = Object.values(byCategory).reduce((a, b) => a + b, 0) || 1;
  const totalDept = Object.values(byDepartment).reduce((a, b) => a + b, 0) || 1;
  const totalPrio = Object.values(byPriority).reduce((a, b) => a + b, 0) || 1;
  const totalStatus = Object.values(byStatus).reduce((a, b) => a + b, 0) || 1;

  const maxOverTime = Math.max(1, ...overTime.map(d => d.count));
  const maxResTime = Math.max(1, ...Object.values(resolutionTimeByCategory));

  const priorityColors = {
    CRITICAL: { bar: '#f43f5e', bg: 'rgba(244, 63, 94, 0.2)' },
    HIGH: { bar: '#fbbf24', bg: 'rgba(251, 191, 36, 0.2)' },
    MEDIUM: { bar: '#60a5fa', bg: 'rgba(96, 165, 250, 0.2)' },
    LOW: { bar: '#94a3b8', bg: 'rgba(148, 163, 184, 0.2)' }
  };

  const statusColors = {
    SUBMITTED: '#38bdf8',
    AI_ANALYSED: '#c084fc',
    ASSIGNED: '#818cf8',
    IN_PROGRESS: '#fbbf24',
    UNDER_VERIFICATION: '#f472b6',
    RESOLVED: '#34d399',
    CLOSED: '#94a3b8',
    ESCALATED: '#f43f5e'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
      
      {/* Row 1: Category & Department Distribution */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        
        {/* Chart 1: Complaints by Category */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#38bdf8' }}>
              <PieChart size={20} />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>1. Complaints by Category</h3>
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total: {totalCat}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {Object.keys(byCategory).length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No complaints found for current filter.</p>
            ) : (
              Object.entries(byCategory).map(([cat, count]) => {
                const pct = Math.round((count / totalCat) * 100);
                return (
                  <div key={cat}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                      <span style={{ color: '#f8fafc' }}>{cat}</span>
                      <span style={{ color: '#38bdf8' }}>{count} ({pct}%)</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #0284c7, #38bdf8)', borderRadius: '4px', transition: 'width 0.5s ease' }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* Chart 2: Complaints by Department */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#c084fc' }}>
              <BarChart3 size={20} />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>2. Complaints by Department</h3>
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total: {totalDept}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {Object.keys(byDepartment).length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No department data found for current filter.</p>
            ) : (
              Object.entries(byDepartment).map(([dept, count]) => {
                const pct = Math.round((count / totalDept) * 100);
                return (
                  <div key={dept}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                      <span style={{ color: '#f8fafc' }}>{dept}</span>
                      <span style={{ color: '#c084fc' }}>{count} cases</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #9333ea, #c084fc)', borderRadius: '4px', transition: 'width 0.5s ease' }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>

      {/* Row 2: Priority & Status Distribution */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        
        {/* Chart 3: Priority Distribution */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#fbbf24' }}>
              <ShieldAlert size={20} />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>3. Priority Distribution</h3>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
            {Object.entries(byPriority).map(([prio, count]) => {
              const colors = priorityColors[prio] || priorityColors.MEDIUM;
              const pct = Math.round((count / totalPrio) * 100);
              return (
                <div key={prio} style={{ padding: '0.85rem', borderRadius: '10px', background: colors.bg, border: `1px solid ${colors.bar}40` }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: colors.bar }}>{prio}</span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginTop: '0.2rem' }}>
                    <h4 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff' }}>{count}</h4>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>({pct}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Chart 4: Status Distribution */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#34d399' }}>
              <CheckCircle2 size={20} />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>4. Status Distribution</h3>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {Object.entries(byStatus).map(([st, count]) => {
              const color = statusColors[st] || '#38bdf8';
              const pct = Math.round((count / totalStatus) * 100);
              return (
                <div key={st} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ width: '130px', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    {st.replace('_', ' ')}
                  </span>
                  <div style={{ flex: 1, height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '4px' }} />
                  </div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: color, minWidth: '35px', textAlign: 'right' }}>
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Row 3: Complaints Over Time & Resolution Time */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        
        {/* Chart 5: Complaints Over Time */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#60a5fa' }}>
              <TrendingUp size={20} />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>5. Complaints Over Time</h3>
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Date Trend</span>
          </div>

          {overTime.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No trend data for timeframe.</p>
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '140px', gap: '0.5rem', paddingTop: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
              {overTime.map((item, idx) => {
                const heightPct = Math.round((item.count / maxOverTime) * 100);
                return (
                  <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#38bdf8', marginBottom: '0.25rem' }}>{item.count}</span>
                    <div style={{
                      width: '100%',
                      maxWidth: '24px',
                      height: `${Math.max(10, heightPct)}%`,
                      background: 'linear-gradient(180deg, #38bdf8 0%, rgba(56, 189, 248, 0.2) 100%)',
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.4s ease'
                    }} />
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.4rem', whiteSpace: 'nowrap' }}>{item.date}</span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Chart 6: Resolution Time */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#a78bfa' }}>
              <Clock size={20} />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>6. Resolution Time (Hours)</h3>
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>By Category</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {Object.keys(resolutionTimeByCategory).length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No resolution time data available.</p>
            ) : (
              Object.entries(resolutionTimeByCategory).map(([cat, hrs]) => {
                const pct = Math.round((hrs / maxResTime) * 100);
                return (
                  <div key={cat}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                      <span style={{ color: '#f8fafc' }}>{cat}</span>
                      <span style={{ color: '#a78bfa' }}>{hrs} Hours</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #8b5cf6, #a78bfa)', borderRadius: '4px' }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>

      {/* Row 4: Chart 7 - Duplicate Complaint Groups Summary */}
      <Card style={{ border: '1px solid rgba(168, 85, 247, 0.4)', background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.08) 0%, rgba(15, 23, 42, 0.8) 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid rgba(168, 85, 247, 0.2)', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', color: '#c084fc' }}>
            <Copy size={22} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>7. Duplicate Complaint Groups Analytics</h3>
          </div>

          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.82rem', fontWeight: 700 }}>
            <span style={{ padding: '0.3rem 0.75rem', borderRadius: '12px', background: 'rgba(168, 85, 247, 0.2)', color: '#e9d5ff' }}>
              Active Groups: {dupGroups.total_groups || 0}
            </span>
            <span style={{ padding: '0.3rem 0.75rem', borderRadius: '12px', background: 'rgba(52, 211, 153, 0.2)', color: '#34d399' }}>
              Confirmed Root Causes: {dupGroups.confirmed_root_causes || 0}
            </span>
            <span style={{ padding: '0.3rem 0.75rem', borderRadius: '12px', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8' }}>
              Affected Citizens: {dupGroups.total_affected_citizens || 0}
            </span>
          </div>
        </div>

        {dupGroups.groups?.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No duplicate complaint clusters active.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {dupGroups.groups?.slice(0, 3).map((grp, idx) => (
              <div key={grp.group_id || idx} style={{ padding: '0.9rem', borderRadius: '10px', background: 'rgba(10, 14, 26, 0.5)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <span style={{ fontSize: '0.75rem', color: '#c084fc', fontWeight: 800 }}>{grp.group_id} • {grp.count} Complaints</span>
                <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#fff', marginTop: '0.2rem' }}>{grp.common_issue}</h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
                  <strong>Root Cause:</strong> {grp.possible_root_cause}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>

    </div>
  );
};
