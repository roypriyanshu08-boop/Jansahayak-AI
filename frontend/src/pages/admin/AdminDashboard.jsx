import React, { useEffect, useState } from 'react';
import { analyticsService } from '../../services/analyticsService';
import { complaintService } from '../../services/complaintService';
import { adminService } from '../../services/adminService';
import { DashboardStats } from '../../components/admin/DashboardStats';
import { DashboardFilters } from '../../components/admin/DashboardFilters';
import { AdminCharts } from '../../components/admin/AdminCharts';
import { ComplaintTable } from '../../components/admin/ComplaintTable';
import { LoadingSpinner, Card } from '../../components/common/CommonComponents';
import { useLanguage } from '../../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, ShieldAlert, BarChart3, Database, Sparkles, Trash2, CheckCircle2 } from 'lucide-react';

import { PredictiveHotspotsCard } from '../../components/admin/PredictiveHotspotsCard';

export const AdminDashboard = () => {
  const { t, language } = useLanguage();
  const [analyticsData, setAnalyticsData] = useState(null);
  const [predictiveData, setPredictiveData] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [demoMessage, setDemoMessage] = useState(null);
  const navigate = useNavigate();

  // Active filter state
  const [filters, setFilters] = useState({
    search: '',
    dateRange: 'all',
    category: 'all',
    department: 'all',
    priority: 'all',
    status: 'all'
  });

  const loadDashboard = async (currentFilters = filters) => {
    try {
      setRefreshing(true);
      const queryParams = {
        search: currentFilters.search || undefined,
        category: currentFilters.category !== 'all' ? currentFilters.category : undefined,
        department: currentFilters.department !== 'all' ? currentFilters.department : undefined,
        priority: currentFilters.priority !== 'all' ? currentFilters.priority : undefined,
        status: currentFilters.status !== 'all' ? currentFilters.status : undefined,
        date_range: currentFilters.dateRange || 'all'
      };

      const [analyticsRes, complaintsRes, predRes] = await Promise.all([
        analyticsService.getSummary(queryParams),
        complaintService.getAllComplaints({
          limit: 10,
          status: currentFilters.status !== 'all' ? currentFilters.status : undefined,
          department: currentFilters.department !== 'all' ? currentFilters.department : undefined
        }),
        analyticsService.getPredictiveHotspots()
      ]);

      setAnalyticsData(analyticsRes);
      setPredictiveData(predRes);
      
      // Local search filtering on complaint table list if search parameter set
      let tableComplaints = complaintsRes || [];
      if (currentFilters.search) {
        const q = currentFilters.search.toLowerCase();
        tableComplaints = tableComplaints.filter(c =>
          c.title?.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q) ||
          c.address?.toLowerCase().includes(q) ||
          c.id?.toLowerCase().includes(q)
        );
      }
      setComplaints(tableComplaints);
    } catch (err) {
      console.error('Failed to load admin dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard(filters);

    const handleUpdate = () => {
      loadDashboard(filters);
    };

    window.addEventListener('jansahayak_complaint_updated', handleUpdate);
    return () => window.removeEventListener('jansahayak_complaint_updated', handleUpdate);
  }, [filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    const reset = {
      search: '',
      dateRange: 'all',
      category: 'all',
      department: 'all',
      priority: 'all',
      status: 'all'
    };
    setFilters(reset);
  };

  const handleLoadDemoData = async () => {
    setLoadingDemo(true);
    try {
      const res = await adminService.generateDemoData(100);
      setDemoMessage(res.message || "Successfully generated 100 synthetic Demo Complaint records across 12 Wards & 6 Departments.");
      await loadDashboard(filters);
    } catch (err) {
      console.error('Failed to generate demo data:', err);
      setDemoMessage("Failed to generate demo dataset.");
    } finally {
      setLoadingDemo(false);
    }
  };

  const handleClearDemoData = async () => {
    setLoadingDemo(true);
    try {
      const res = await adminService.clearDemoData();
      setDemoMessage(res.message || "Cleared synthetic demo complaint dataset.");
      await loadDashboard(filters);
    } catch (err) {
      console.error('Failed to clear demo data:', err);
    } finally {
      setLoadingDemo(false);
    }
  };

  const handleAssign = (complaint) => {
    navigate('/admin/officers');
  };

  const handleEscalate = (complaint) => {
    navigate('/admin/escalations');
  };

  const handleViewDetails = (complaint) => {
    navigate(`/complaint/${complaint.id}`);
  };

  if (loading) return <LoadingSpinner label={language === 'hi' ? "जनसहायक एडमिन एनालिटिक्स लोड हो रहा है..." : "Compiling Complete JanSahayak Admin Analytics & Live Data..."} />;

  const kpis = analyticsData?.kpis || {};
  const overview = analyticsData?.overview || {};

  return (
    <div className="main-content">
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#60a5fa', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            <BarChart3 size={14} /> {language === 'hi' ? 'वास्तविक समय डेटाबेस विश्लेषण' : 'Real-Time Database Analytics & Intelligence'}
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>
            {language === 'hi' ? 'जनसहायक' : 'JanSahayak'} <span className="gradient-text">{t('nav.dashboard', 'Admin Dashboard')}</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            {language === 'hi' 
              ? 'मुख्य KPI मेट्रिक्स, विश्लेषणात्मक चार्ट, SLA उल्लंघन निगरानी एवं खोज नियंत्रण'
              : 'Comprehensive KPI Metrics, 7 Visual Analytics Charts, SLA Breach Monitoring, & Search Controls'
            }
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Load Demo Data Admin Button */}
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
            {loadingDemo ? (language === 'hi' ? 'डेमो डेटा लोड हो रहा है...' : 'Generating 100 Demo Records...') : (language === 'hi' ? 'डेमो डेटा लोड करें' : 'Load Demo Data')}
          </button>

          {/* Clear Demo Data Button */}
          <button
            onClick={handleClearDemoData}
            disabled={loadingDemo}
            style={{
              padding: '0.6rem 0.9rem',
              borderRadius: '8px',
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.4)',
              color: '#f43f5e',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: loadingDemo ? 'default' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
            title="Clear all synthetic demo records"
          >
            <Trash2 size={15} />
            {language === 'hi' ? 'डेमो डेटा हटाएं' : 'Clear Demo'}
          </button>

          {/* Refresh Button */}
          <button
            onClick={() => loadDashboard(filters)}
            disabled={refreshing}
            style={{
              padding: '0.6rem 1.1rem',
              borderRadius: '8px',
              background: 'rgba(30, 41, 59, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <RefreshCw size={16} className={refreshing ? 'spin' : ''} />
            {refreshing ? (language === 'hi' ? 'अपडेट हो रहा है...' : 'Refreshing...') : (language === 'hi' ? 'डेटा रीफ्रेश करें' : 'Refresh Live Data')}
          </button>
        </div>
      </div>

      {/* Demo Data Notification Toast / Banner */}
      {demoMessage && (
        <div style={{
          marginBottom: '1.25rem',
          padding: '0.85rem 1.1rem',
          borderRadius: '12px',
          background: 'rgba(139, 92, 246, 0.15)',
          border: '1px solid rgba(139, 92, 246, 0.4)',
          color: '#e9d5ff',
          display: 'flex',
          alignItems: 'center',
          justify: 'space-between',
          fontSize: '0.88rem',
          fontWeight: 600
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <CheckCircle2 size={18} style={{ color: '#34d399' }} />
            <span>{demoMessage}</span>
          </div>
          <button
            onClick={() => setDemoMessage(null)}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Top 6 KPI Cards */}
      <DashboardStats kpis={kpis} overview={overview} />

      {/* Pending Escalations Alert Banner */}
      <Card style={{ 
        marginBottom: '1.5rem', 
        border: '1px solid rgba(244, 63, 94, 0.4)',
        background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.1) 0%, rgba(15, 23, 42, 0.8) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{ padding: '0.65rem', borderRadius: '12px', background: 'rgba(244, 63, 94, 0.2)', border: '1px solid rgba(244, 63, 94, 0.5)', color: '#f43f5e' }}>
            <ShieldAlert size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>
              {language === 'hi' ? 'लंबित SLA एस्केलेशन सक्रिय हैं' : 'Pending SLA Escalations Active'}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
              {language === 'hi'
                ? 'लेवल 1 (अधिकारी), लेवल 2 (पर्यवेक्षक), और लेवल 3 (वरिष्ठ प्राधिकारी) एस्केलेशन में हस्तक्षेप आवश्यक है।'
                : 'Level 1 (Officer), Level 2 (Supervisor), and Level 3 (Senior Authority) escalations require intervention.'
              }
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/admin/escalations')}
          style={{
            padding: '0.6rem 1.2rem',
            borderRadius: '8px',
            background: '#f43f5e',
            color: '#fff',
            border: 'none',
            fontWeight: 800,
            fontSize: '0.85rem',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(244, 63, 94, 0.3)'
          }}
        >
          {language === 'hi' ? 'लंबित एस्केलेशन सूची देखें →' : 'View Pending Escalations Queue →'}
        </button>
      </Card>

      {/* Search & Multi-Criteria Filter Controls */}
      <DashboardFilters 
        filters={filters} 
        onFilterChange={handleFilterChange} 
        onResetFilters={handleResetFilters} 
      />

      {/* Visual Analytics Charts */}
      <AdminCharts analyticsData={analyticsData} />

      {/* Predictive Public-Service Analytics Hotspots Card */}
      <PredictiveHotspotsCard predictiveData={predictiveData} />

      {/* Recent Grievance Table */}
      <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '1rem', color: '#fff' }}>
        {t('nav.complaints', 'Complaints')} ({complaints.length})
      </h2>

      <ComplaintTable
        complaints={complaints}
        onAssign={handleAssign}
        onEscalate={handleEscalate}
        onViewDetails={handleViewDetails}
      />
    </div>
  );
};
