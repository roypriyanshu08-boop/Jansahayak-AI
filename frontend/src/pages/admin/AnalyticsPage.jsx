import React, { useEffect, useState } from 'react';
import { analyticsService } from '../../services/analyticsService';
import { Card, LoadingSpinner } from '../../components/common/CommonComponents';
import { BarChart3, PieChart, TrendingUp, Layers } from 'lucide-react';

export const AnalyticsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await analyticsService.getSummary();
        setData(res);
      } catch (err) {
        console.error('Error fetching analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) return <LoadingSpinner label="Compiling JanSahayak AI Analytics..." />;

  const categories = data?.by_category || {};
  const departments = data?.by_department || {};

  return (
    <div className="main-content">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Analytics & Intelligence Insights</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
          Departmental performance metrics, grievance frequency distributions, and AI resolution forecasts
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', color: '#60a5fa' }}>
            <PieChart size={20} /> <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Complaints by Category</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {Object.keys(categories).length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No category data logged yet.</p>
            ) : (
              Object.entries(categories).map(([cat, count]) => (
                <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.8rem', background: 'rgba(10, 14, 26, 0.4)', borderRadius: '8px' }}>
                  <span style={{ fontWeight: 600 }}>{cat}</span>
                  <span style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 700 }}>
                    {count} cases
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', color: '#c084fc' }}>
            <BarChart3 size={20} /> <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Departmental Distribution</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {Object.keys(departments).length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No department data logged yet.</p>
            ) : (
              Object.entries(departments).map(([dept, count]) => (
                <div key={dept} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.8rem', background: 'rgba(10, 14, 26, 0.4)', borderRadius: '8px' }}>
                  <span style={{ fontWeight: 600 }}>{dept}</span>
                  <span style={{ background: 'rgba(139, 92, 246, 0.2)', color: '#c084fc', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 700 }}>
                    {count} assigned
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
