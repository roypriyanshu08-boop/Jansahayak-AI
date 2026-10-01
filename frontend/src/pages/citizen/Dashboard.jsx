import React, { useEffect, useState } from 'react';
import { complaintService } from '../../services/complaintService';
import { ComplaintCard } from '../../components/citizen/ComplaintCard';
import { LoadingSpinner, Button, Card, Badge } from '../../components/common/CommonComponents';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../context/LanguageContext';
import { Link, useNavigate } from 'react-router-dom';
import { 
  PlusCircle, Layers, CheckCircle2, Clock, Mic, Sparkles, 
  MessageSquare, Search, AlertOctagon, Bell, ArrowRight, ShieldCheck, HelpCircle
} from 'lucide-react';

export const CitizenDashboard = () => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const loadComplaints = async () => {
      try {
        const data = await complaintService.getMyComplaints();
        setComplaints(data || []);
      } catch (err) {
        console.error('Failed to load complaints:', err);
      } finally {
        setLoading(false);
      }
    };
    loadComplaints();
  }, []);

  // Filter complaints strictly for currently authenticated user
  const userComplaints = (complaints || []).filter(c => {
    if (!user?.id) return false;
    const ownerId = c.userId || c.user_id;
    return ownerId === user.id;
  });

  // Calculate 4 Core KPI Metrics ONLY from user's complaints
  const total = userComplaints.length;
  const pending = userComplaints.filter(c => ['SUBMITTED', 'IN_PROGRESS', 'ASSIGNED', 'UNDER_VERIFICATION', 'AI_ANALYSED'].includes((c.status || '').toUpperCase())).length;
  const resolved = userComplaints.filter(c => ['RESOLVED', 'CLOSED'].includes((c.status || '').toUpperCase())).length;
  const critical = userComplaints.filter(c => (c.priority || '').toUpperCase() === 'CRITICAL' || (c.priority || '').toUpperCase() === 'HIGH').length;

  // Filter user's complaints locally by search
  const filteredComplaints = userComplaints.filter(c => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (c.title || '').toLowerCase().includes(q) ||
      (c.description || '').toLowerCase().includes(q) ||
      (c.id || '').toLowerCase().includes(q) ||
      (c.category || '').toLowerCase().includes(q)
    );
  });

  // Check first login vs returning login based on persistent account record
  const isReturningUser = user?.has_logged_in_before === true || user?.hasLoggedInBefore === true;

  // Recent system status notifications
  const systemUpdates = [
    {
      id: 1,
      type: 'status',
      title: language === 'hi' ? "शिकायत एस्कलेशन सुरक्षा सक्रिय" : "Multi-Level SLA Escalation Active",
      text: language === 'hi' ? "यदि शिकायत 48 घंटों में हल नहीं होती है, तो AI स्वचालित रूप से उच्च अधिकारियों को सूचित करता है।" : "If grievances are delayed past SLA hours, JanSahayak AI automatically escalates to Supervisor Level.",
      time: "Live System",
      icon: Bell
    },
    {
      id: 2,
      type: 'ai',
      title: language === 'hi' ? "जनसहायक AI सहायक उपलब्ध है" : "JanSahayak AI Virtual Assistant Online",
      text: language === 'hi' ? "अपनी शिकायत की स्थिति देखने या नागरिक प्रश्न पूछने के लिए 'Ask JanSahayak' पर क्लिक करें।" : "Query your complaint status or municipal guidelines anytime via text or voice.",
      time: "24x7 Active",
      icon: Sparkles
    }
  ];

  return (
    <div className="main-content" style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* 1. Welcome Message & Header Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1.25rem'
      }}>
        <div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: '#60a5fa',
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            padding: '0.3rem 0.85rem',
            borderRadius: '20px',
            fontSize: '0.8rem',
            fontWeight: 700,
            marginBottom: '0.5rem'
          }}>
            <ShieldCheck size={14} /> {language === 'hi' ? "सत्यापित नागरिक पोर्टल" : "Authenticated Citizen Grievance Portal"}
          </div>
          <h1 style={{ fontSize: '2.1rem', fontWeight: 800, margin: 0 }}>
            {isReturningUser 
              ? (language === 'hi' ? 'पुनः स्वागत है,' : 'Welcome back,') 
              : (language === 'hi' ? 'स्वागत है,' : 'Welcome,')}{' '}
            <span className="gradient-text">{user?.name || (language === 'hi' ? 'नागरिक' : 'Citizen')}</span> 👋
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.35rem', fontSize: '0.95rem' }}>
            {language === 'hi' 
              ? 'जनसहायक AI पोर्टल: शिकायतों का रियल-टाइम निष्पादन एवं AI निगरानी'
              : 'JanSahayak AI Portal: Real-time complaint tracking, voice dictation, & SLA monitoring'
            }
          </p>
        </div>

        {/* Quick Top Controls */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link to="/create-complaint?mode=voice" style={{ textDecoration: 'none' }}>
            <button style={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
              color: '#fff',
              border: 'none',
              padding: '0.65rem 1.15rem',
              borderRadius: '12px',
              fontSize: '0.88rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 14px rgba(139, 92, 246, 0.4)',
              transition: 'all 0.2s ease'
            }}>
              <Mic size={18} /> {language === 'hi' ? '🎙️ आवाज से शिकायत दर्ज करें' : '🎙️ Speak Voice Complaint'}
            </button>
          </Link>
          <Link to="/create-complaint?mode=text" style={{ textDecoration: 'none' }}>
            <Button>
              <PlusCircle size={18} /> {t('btn.submitComplaint', 'File Complaint')}
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Primary 4 KPI Stat Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '1.25rem',
        marginBottom: '2rem'
      }}>
        {/* Total Complaints */}
        <Card style={{ padding: '1.25rem', border: '1px solid rgba(59, 130, 246, 0.3)', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(15, 23, 42, 0.8) 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              {t('dashboard.totalComplaints', 'Total Complaints')}
            </span>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Layers size={20} />
            </div>
          </div>
          <h2 style={{ fontSize: '1.9rem', fontWeight: 800, color: '#fff' }}>{total}</h2>
        </Card>

        {/* Pending Complaints */}
        <Card style={{ padding: '1.25rem', border: '1px solid rgba(251, 191, 36, 0.3)', background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.12) 0%, rgba(15, 23, 42, 0.8) 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              {t('dashboard.pending', 'Pending Complaints')}
            </span>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(251, 191, 36, 0.2)', color: '#fbbf24', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={20} />
            </div>
          </div>
          <h2 style={{ fontSize: '1.9rem', fontWeight: 800, color: '#fff' }}>{pending}</h2>
        </Card>

        {/* Resolved Complaints */}
        <Card style={{ padding: '1.25rem', border: '1px solid rgba(52, 211, 153, 0.3)', background: 'linear-gradient(135deg, rgba(52, 211, 153, 0.12) 0%, rgba(15, 23, 42, 0.8) 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              {t('dashboard.resolved', 'Resolved Complaints')}
            </span>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(52, 211, 153, 0.2)', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={20} />
            </div>
          </div>
          <h2 style={{ fontSize: '1.9rem', fontWeight: 800, color: '#fff' }}>{resolved}</h2>
        </Card>

        {/* Critical Complaints */}
        <Card style={{ padding: '1.25rem', border: '1px solid rgba(244, 63, 94, 0.3)', background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.12) 0%, rgba(15, 23, 42, 0.8) 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              {t('dashboard.critical', 'Critical Complaints')}
            </span>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(244, 63, 94, 0.2)', color: '#f43f5e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertOctagon size={20} />
            </div>
          </div>
          <h2 style={{ fontSize: '1.9rem', fontWeight: 800, color: '#fff' }}>{critical}</h2>
        </Card>
      </div>

      {/* 3. Action Cards Row (Submit, Track, Ask JanSahayak) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1.25rem',
        marginBottom: '2rem'
      }}>
        {/* Action 1: Submit Complaint */}
        <Card style={{ padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.6rem' }}>
            <div style={{ padding: '0.6rem', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
              <PlusCircle size={22} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
              {t('btn.submitComplaint', 'Submit Complaint')}
            </h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
            {language === 'hi' 
              ? 'आवाज से या मानक फॉर्म भरकर सड़क, पानी, कचरा या बिजली की समस्या दर्ज करें।'
              : 'Log road, water, garbage, or electrical issues via Voice dictation or standard form.'
            }
          </p>
          <button
            onClick={() => navigate('/create-complaint')}
            style={{
              width: '100%',
              padding: '0.6rem',
              borderRadius: '10px',
              background: 'var(--primary-gradient)',
              color: '#fff',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem'
            }}
          >
            {language === 'hi' ? 'शिकायत दर्ज करें' : 'Lodge New Complaint'} <ArrowRight size={15} />
          </button>
        </Card>

        {/* Action 2: Track Complaint */}
        <Card style={{ padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.6rem' }}>
            <div style={{ padding: '0.6rem', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
              <Layers size={22} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
              {t('nav.trackComplaint', 'Track Complaint')}
            </h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
            {language === 'hi'
              ? 'शिकायत आईडी दर्ज करके अधिकारी आवंटन एवं लाइव निवारण टाइमलाइन देखें।'
              : 'View live status updates, assigned officer details, and resolution timelines.'
            }
          </p>
          <button
            onClick={() => navigate('/track')}
            style={{
              width: '100%',
              padding: '0.6rem',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#34d399',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem'
            }}
          >
            {t('btn.trackDetails', 'Track Complaint Status')} <ArrowRight size={15} />
          </button>
        </Card>

        {/* Action 3: Ask JanSahayak AI */}
        <Card style={{ padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.6rem' }}>
            <div style={{ padding: '0.6rem', borderRadius: '10px', background: 'rgba(139, 92, 246, 0.15)', color: '#c084fc' }}>
              <Sparkles size={22} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
              {t('nav.askJanSahayak', 'Ask JanSahayak')}
            </h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
            {language === 'hi'
              ? 'AI सहायक से प्रश्न पूछें: "मेरी शिकायत का स्टेटस क्या है?" या "कचरा विभाग का समय क्या है?"'
              : 'Ask AI virtual assistant: "What is my complaint status?" or "How do I report a pothole?"'
            }
          </p>
          <button
            onClick={() => navigate('/ask-ai')}
            style={{
              width: '100%',
              padding: '0.6rem',
              borderRadius: '10px',
              background: 'var(--accent-gradient)',
              color: '#fff',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem'
            }}
          >
            {t('btn.askAI', 'Ask AI Virtual Assistant')} <ArrowRight size={15} />
          </button>
        </Card>
      </div>

      {/* 4. Simple Notifications & Status Updates Panel */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Bell size={18} style={{ color: '#60a5fa' }} /> {language === 'hi' ? 'प्रणाली स्थिति एवं अलर्ट' : 'System Notifications & Status Updates'}
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {systemUpdates.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                style={{
                  background: 'rgba(18, 24, 41, 0.65)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '14px',
                  padding: '1rem 1.15rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem'
                }}
              >
                <div style={{
                  padding: '0.5rem',
                  borderRadius: '10px',
                  background: 'rgba(59, 130, 246, 0.12)',
                  color: '#60a5fa',
                  flexShrink: 0
                }}>
                  <Icon size={18} />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff' }}>{item.title}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{item.time}</span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0 }}>
                    {item.text}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Recent Complaints Cards Grid */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff' }}>
            {t('nav.myComplaints', 'Your Registered Grievances')} ({userComplaints.length})
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
            {language === 'hi' ? 'आपके खाते में पंजीकृत शिकायतों की सूची' : 'Recent grievances logged under your authenticated citizen profile'}
          </p>
        </div>

        {/* Search Input for Citizen Complaints */}
        {userComplaints.length > 0 && (
          <div style={{ position: 'relative', width: '260px' }}>
            <input
              type="text"
              placeholder={t('form.searchPlaceholder', 'Search grievance title or ID...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.55rem 0.85rem 0.55rem 2.3rem',
                background: 'rgba(10, 14, 26, 0.7)',
                border: '1px solid var(--glass-border)',
                borderRadius: '10px',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
                outline: 'none'
              }}
            />
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>
        )}
      </div>

      {loading ? (
        <LoadingSpinner label={language === 'hi' ? "आपकी शिकायतें लोड हो रही हैं..." : "Loading registered grievances..."} />
      ) : filteredComplaints.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '3.5rem 2rem', background: 'rgba(18, 24, 41, 0.4)', border: '1px dashed var(--glass-border)' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem', fontSize: '0.95rem' }}>
            {searchQuery 
              ? (language === 'hi' ? "आपकी खोज के अनुसार कोई शिकायत नहीं मिली।" : "No grievances found matching your search term.")
              : (language === 'hi' ? "आपने अभी तक कोई शिकायत दर्ज नहीं की है।" : "You haven't filed any civic complaints yet under this account.")
            }
          </p>
          <Link to="/create-complaint" style={{ textDecoration: 'none' }}>
            <Button>
              <PlusCircle size={18} /> {language === 'hi' ? 'अपनी पहली शिकायत दर्ज करें' : 'Submit Your First Complaint'}
            </Button>
          </Link>
        </Card>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
          gap: '1.5rem'
        }}>
          {filteredComplaints.map((c) => (
            <ComplaintCard key={c.id} complaint={c} />
          ))}
        </div>
      )}
    </div>
  );
};
