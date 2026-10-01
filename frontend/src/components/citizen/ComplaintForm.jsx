import React, { useState, useEffect } from 'react';
import { Card, Button } from '../common/CommonComponents';
import { Send, Mic, Square, Sparkles } from 'lucide-react';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { useLanguage } from '../../context/LanguageContext';
import { aiService } from '../../services/aiService';
import { complaintService } from '../../services/complaintService';
import { LocationPicker } from '../common/LocationPicker';
import { SitePhotoUpload } from '../common/SitePhotoUpload';

export const ComplaintForm = ({ onSubmit, loading }) => {
  const { t, language } = useLanguage();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Water Supply',
    subcategory: 'Pipe Leakage',
    department: 'Jal Board',
    address: '',
    latitude: '',
    longitude: '',
    image_url: '',
    audio_url: ''
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [fileError, setFileError] = useState('');
  const [photoAnalysis, setPhotoAnalysis] = useState(null);
  const [analyzingPhoto, setAnalyzingPhoto] = useState(false);

  const {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    startListening,
    stopListening,
  } = useSpeechRecognition();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleMicForDescription = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  useEffect(() => {
    if (transcript) {
      setFormData((prev) => ({
        ...prev,
        description: transcript
      }));
    }
  }, [transcript]);

  const handleAnalyzePhoto = async () => {
    if (!formData.image_url.trim()) return;
    setAnalyzingPhoto(true);
    try {
      const result = await aiService.analyzePhoto(formData.image_url);
      setPhotoAnalysis(result);

      setFormData((prev) => ({
        ...prev,
        title: prev.title || `${result.detected_issue} Reported at Site`,
        description: prev.description ? `${prev.description}\n\nAI Photo Insight: ${result.description}` : result.description,
        category: result.detected_issue === 'Pothole' || result.detected_issue === 'Broken road' ? 'Roads & Transport'
          : result.detected_issue === 'Garbage' ? 'Sanitation & Waste'
          : result.detected_issue === 'Water leakage' ? 'Water Supply'
          : result.detected_issue === 'Open drain' ? 'Sewage'
          : result.detected_issue === 'Damaged streetlight' ? 'Electricity'
          : prev.category
      }));
    } catch (err) {
      console.error('Failed to analyze photo:', err);
    } finally {
      setAnalyzingPhoto(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let submissionData = { ...formData };
    
    if (selectedFile) {
      try {
        const uploadedUrl = await complaintService.uploadPhoto(selectedFile);
        if (uploadedUrl) {
          submissionData.image_url = uploadedUrl;
        }
      } catch (err) {
        console.warn('Photo upload API fallback, using base64 preview:', err);
      }
    }

    onSubmit(submissionData);
  };

  return (
    <Card>
      <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1.25rem' }}>
        {t('btn.submitComplaint', 'File a Civic Grievance')}
      </h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
        <div>
          <label style={labelStyle}>{t('form.title', 'Complaint Title')}</label>
          <input
            type="text"
            name="title"
            required
            placeholder={language === 'hi' ? "उदाहरण: सेक्टर 14 के पास मुख्य जल पाइपलाइन रिसाव" : "e.g. Major Water Pipeline Leak near Sector 14"}
            value={formData.title}
            onChange={handleChange}
            style={inputStyle}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <label style={labelStyle}>{t('form.category', 'Category')}</label>
            <select name="category" value={formData.category} onChange={handleChange} style={inputStyle}>
              <option value="Water Supply">{t('category.Water Supply', 'Water Supply')}</option>
              <option value="Roads & Transport">{t('category.Roads', 'Roads & Transport')}</option>
              <option value="Sanitation & Waste">{t('category.Sanitation', 'Sanitation & Waste')}</option>
              <option value="Electricity">{t('category.Electricity', 'Electricity & Street Lights')}</option>
              <option value="Sewage">{t('category.Sewage & Drainage', 'Sewage & Drainage')}</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>{t('form.department', 'Department')}</label>
            <select name="department" value={formData.department} onChange={handleChange} style={inputStyle}>
              <option value="Jal Board">Jal Board / Water Dept</option>
              <option value="Public Works Dept">Public Works Dept (PWD)</option>
              <option value="Municipal Corporation">Municipal Corporation</option>
              <option value="State Electricity Board">Electricity Board</option>
            </select>
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <label style={labelStyle}>{t('form.description', 'Detailed Description')}</label>
            {isSupported && (
              <button
                type="button"
                onClick={toggleMicForDescription}
                style={{
                  background: isListening ? 'rgba(244, 63, 94, 0.2)' : 'rgba(59, 130, 246, 0.15)',
                  border: isListening ? '1px solid #f43f5e' : '1px solid rgba(59, 130, 246, 0.3)',
                  color: isListening ? '#f43f5e' : '#60a5fa',
                  padding: '0.25rem 0.65rem',
                  borderRadius: '16px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                {isListening ? <Square size={13} fill="#f43f5e" /> : <Mic size={14} />}
                {isListening ? (language === 'hi' ? 'बोलना बंद करें' : 'Stop Speaking') : (language === 'hi' ? '🎙️ माइक से बोलें' : '🎙️ Dictate with Mic')}
              </button>
            )}
          </div>
          <textarea
            name="description"
            rows="4"
            required
            placeholder={language === 'hi' ? "समस्या, गंभीरता, अवधि और सटीक स्थान विवरण लिखें..." : "Describe the problem, severity, duration, and exact location markers..."}
            value={formData.description + (isListening && interimTranscript ? ` [${interimTranscript}...]` : '')}
            onChange={handleChange}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </div>

        {/* High-Accuracy Location Detection System */}
        <LocationPicker
          address={formData.address}
          setAddress={(val) => setFormData(prev => ({ ...prev, address: val }))}
          latitude={formData.latitude}
          setLatitude={(val) => setFormData(prev => ({ ...prev, latitude: val }))}
          longitude={formData.longitude}
          setLongitude={(val) => setFormData(prev => ({ ...prev, longitude: val }))}
          accuracy={formData.accuracy}
          setAccuracy={(val) => setFormData(prev => ({ ...prev, accuracy: val }))}
          locationTimestamp={formData.location_timestamp}
          setLocationTimestamp={(val) => setFormData(prev => ({ ...prev, location_timestamp: val }))}
          language={language}
        />

        {/* Reusable Site Photo Upload Component */}
        <SitePhotoUpload
          photoPreview={photoPreview}
          setPhotoPreview={setPhotoPreview}
          selectedFile={selectedFile}
          setSelectedFile={setSelectedFile}
          setImageUrl={(val) => setFormData(prev => ({ ...prev, image_url: val }))}
          fileError={fileError}
          setFileError={setFileError}
          language={language}
          photoAnalysis={photoAnalysis}
          analyzingPhoto={analyzingPhoto}
          handleAnalyzePhoto={handleAnalyzePhoto}
        />

        <div>
          <label style={labelStyle}>{language === 'hi' ? 'ऑडियो यूआरएल (वैकल्पिक)' : 'Voice Note / Audio URL (Optional)'}</label>
          <input
            type="url"
            name="audio_url"
            placeholder="https://example.com/audio.mp3"
            value={formData.audio_url}
            onChange={handleChange}
            style={inputStyle}
          />
        </div>

        <Button type="submit" disabled={loading} style={{ marginTop: '0.5rem', width: '100%' }}>
          <Send size={18} /> {loading ? (language === 'hi' ? 'शिकायत जमा हो रही है...' : 'Submitting Grievance...') : t('btn.submitComplaint', 'Submit Grievance to JanSahayak AI')}
        </Button>
      </form>
    </Card>
  );
};

const labelStyle = {
  display: 'block',
  fontSize: '0.85rem',
  fontWeight: 600,
  color: 'var(--text-secondary)',
  marginBottom: '0.4rem'
};

const inputStyle = {
  width: '100%',
  padding: '0.75rem 1rem',
  background: 'rgba(10, 14, 26, 0.6)',
  border: '1px solid var(--glass-border)',
  borderRadius: '10px',
  color: 'var(--text-primary)',
  fontSize: '0.9rem',
  outline: 'none',
  transition: 'border-color 0.2s ease'
};
