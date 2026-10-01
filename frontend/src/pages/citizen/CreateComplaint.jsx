import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ComplaintForm } from '../../components/citizen/ComplaintForm';
import { VoiceComplaintCard } from '../../components/citizen/VoiceComplaintCard';
import { complaintService } from '../../services/complaintService';
import { FileText, Mic, Sparkles } from 'lucide-react';

export const CreateComplaint = () => {
  const [mode, setMode] = useState('voice'); // Default to Voice mode for instant voice feature showcase
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlMode = params.get('mode');
    if (urlMode === 'text') {
      setMode('text');
    } else if (urlMode === 'voice') {
      setMode('voice');
    }
  }, [location.search]);

  const handleSubmit = async (formData) => {
    setLoading(true);
    setError('');
    try {
      await complaintService.submitComplaint(formData);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit complaint');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-content" style={{ maxWidth: '850px' }}>
      {/* Page Title & Subtitle */}
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '2.1rem', fontWeight: 800, marginBottom: '0.4rem' }}>
          Lodge a Civic <span className="gradient-text">Grievance</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          File your complaint via Voice Dictation in Hindi/English or standard form.
        </p>
      </div>

      {/* Mode Switcher Tabs */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '0.75rem',
        marginBottom: '1.75rem',
        background: 'rgba(10, 14, 26, 0.7)',
        padding: '0.4rem',
        borderRadius: '16px',
        border: '1px solid var(--glass-border)',
        maxWidth: '480px',
        margin: '0 auto 1.75rem auto'
      }}>
        <button
          type="button"
          onClick={() => setMode('voice')}
          style={tabStyle(mode === 'voice')}
        >
          <Mic size={18} /> 🎙️ Voice Grievance Mode
        </button>
        <button
          type="button"
          onClick={() => setMode('text')}
          style={tabStyle(mode === 'text')}
        >
          <FileText size={18} /> 📝 Standard Form
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div style={{
          background: 'rgba(244, 63, 94, 0.15)',
          border: '1px solid rgba(244, 63, 94, 0.3)',
          color: '#f43f5e',
          padding: '0.85rem',
          borderRadius: '10px',
          fontSize: '0.9rem',
          marginBottom: '1.5rem'
        }}>
          {error}
        </div>
      )}

      {/* Render Active Complaint Mode */}
      {mode === 'voice' ? (
        <VoiceComplaintCard onSubmit={handleSubmit} loading={loading} />
      ) : (
        <ComplaintForm onSubmit={handleSubmit} loading={loading} />
      )}
    </div>
  );
};

const tabStyle = (active) => ({
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.5rem',
  padding: '0.75rem 1rem',
  borderRadius: '12px',
  background: active ? 'var(--primary-gradient)' : 'transparent',
  color: active ? '#fff' : 'var(--text-secondary)',
  border: 'none',
  fontSize: '0.9rem',
  fontWeight: active ? 700 : 500,
  cursor: 'pointer',
  boxShadow: active ? '0 4px 14px rgba(59, 130, 246, 0.3)' : 'none',
  transition: 'all 0.25 ease',
});
