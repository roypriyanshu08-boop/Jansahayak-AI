import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { analyticsService } from '../../services/analyticsService';
import { Card, LoadingSpinner } from '../../components/common/CommonComponents';
import { DuplicateGroupsCard } from '../../components/admin/DuplicateGroupsCard';
import { PredictiveHotspotsCard } from '../../components/admin/PredictiveHotspotsCard';
import { Cpu, GitMerge, Zap, Sparkles, TrendingUp } from 'lucide-react';

export const AIInsights = () => {
  const [duplicateGroups, setDuplicateGroups] = useState([]);
  const [predictiveData, setPredictiveData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingDemo, setLoadingDemo] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [dupData, predRes] = await Promise.all([
        adminService.getDuplicateGroups(),
        analyticsService.getPredictiveHotspots()
      ]);
      setDuplicateGroups(dupData || []);
      setPredictiveData(predRes);
    } catch (err) {
      console.error('Failed to load AI Insights data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLoadDemoData = async () => {
    setLoadingDemo(true);
    try {
      await adminService.generateDemoData(100);
      await fetchData();
    } catch (err) {
      console.error('Failed to load demo data:', err);
    } finally {
      setLoadingDemo(false);
    }
  };

  if (loading) return <LoadingSpinner label="Analyzing Vector Clusters & Synthesizing AI Predictive Analytics..." />;

  const confirmedCount = duplicateGroups.filter(g => (g.root_cause_status || '').toLowerCase().includes('confirm')).length;
  const hotspotCount = predictiveData?.predictive_hotspots?.length || 0;

  return (
    <div className="main-content">
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#c084fc', background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.3)', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            <Cpu size={14} /> AI Architectural Engine & Predictive Intelligence
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>JanSahayak AI Insights & Predictive Analytics</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
            Predictive Future Hotspot Projections, Vector Cluster Groupings, & Root Cause Verification Controls
          </p>
        </div>

        <button
          onClick={handleLoadDemoData}
          disabled={loadingDemo}
          style={{
            padding: '0.6rem 1.15rem',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
            border: '1px solid rgba(139, 92, 246, 0.5)',
            color: '#fff',
            fontWeight: 800,
            fontSize: '0.85rem',
            cursor: loadingDemo ? 'default' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 4px 14px rgba(139, 92, 246, 0.35)',
            opacity: loadingDemo ? 0.7 : 1
          }}
        >
          <Sparkles size={16} />
          {loadingDemo ? 'Generating 100 Demo Records...' : 'Load Demo Data'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <Card style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#c084fc', marginBottom: '0.5rem' }}>
            <TrendingUp size={20} /> <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Predicted Hotspot Areas</span>
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>{hotspotCount} Ward Areas</h2>
        </Card>

        <Card style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#60a5fa', marginBottom: '0.5rem' }}>
            <GitMerge size={20} /> <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Identified Common Clusters</span>
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>{duplicateGroups.length} Active Groups</h2>
        </Card>

        <Card style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', marginBottom: '0.5rem' }}>
            <Zap size={20} /> <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Confirmed Root Causes</span>
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>{confirmedCount} Confirmed</h2>
        </Card>
      </div>

      {/* 1. Predictive Public-Service Analytics Hotspots Card */}
      <PredictiveHotspotsCard predictiveData={predictiveData} />

      {/* 2. Common Issue Duplicate Groups Card */}
      <DuplicateGroupsCard duplicateGroups={duplicateGroups} />
    </div>
  );
};
