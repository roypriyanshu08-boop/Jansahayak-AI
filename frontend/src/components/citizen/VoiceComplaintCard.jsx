import React, { useState, useEffect } from 'react';
import { Card, Button } from '../common/CommonComponents';
import { 
  Mic, Square, RefreshCw, Edit3, Send, 
  Sparkles, AlertTriangle, Globe, Volume2, 
  FileText
} from 'lucide-react';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { parseVoiceTranscript } from '../../utils/voiceComplaintParser';
import { complaintService } from '../../services/complaintService';
import { LocationPicker } from '../common/LocationPicker';
import { SitePhotoUpload } from '../common/SitePhotoUpload';

export const VoiceComplaintCard = ({ onSubmit, loading }) => {
  const {
    isListening,
    transcript,
    setTranscript,
    interimTranscript,
    detectedLanguage,
    setDetectedLanguage,
    detectionFailed,
    setDetectionFailed,
    error,
    isSupported,
    recordingTime,
    audioUrl,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition();

  const [isEditing, setIsEditing] = useState(false);
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [locationTimestamp, setLocationTimestamp] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [fileError, setFileError] = useState('');

  const [coords, setCoords] = useState({ lat: null, lon: null });

  const [parsedData, setParsedData] = useState({
    title: '',
    category: 'Water Supply',
    subcategory: 'Pipe Leakage',
    department: 'Jal Board',
    priority: 'MEDIUM',
  });

  // Whenever transcript changes, run AI voice complaint parser to extract title, category, department
  useEffect(() => {
    if (transcript) {
      const parsed = parseVoiceTranscript(transcript);
      setParsedData(parsed);
      if (parsed.address && !address) {
        setAddress(parsed.address);
      }
    }
  }, [transcript]);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!transcript.trim()) return;

    let finalImageUrl = imageUrl;
    if (selectedFile) {
      try {
        const uploadedUrl = await complaintService.uploadPhoto(selectedFile);
        if (uploadedUrl) {
          finalImageUrl = uploadedUrl;
        }
      } catch (err) {
        console.warn('Photo upload API fallback:', err);
      }
    }

    const finalComplaintData = {
      title: parsedData.title || transcript.slice(0, 60) + '...',
      description: transcript,
      category: parsedData.category,
      subcategory: parsedData.subcategory,
      department: parsedData.department,
      priority: parsedData.priority,
      address: address || 'Voice Grievance Location',
      latitude: latitude || coords.lat || null,
      longitude: longitude || coords.lon || null,
      accuracy: accuracy || null,
      location_timestamp: locationTimestamp || new Date().toISOString(),
      image_url: finalImageUrl,
      audio_url: audioUrl || '',
      detected_language: detectedLanguage || 'Hindi',
    };

    onSubmit(finalComplaintData);
  };

  const handleTryAgain = () => {
    resetTranscript();
    startListening();
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Header Badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '0.4rem', 
            background: 'rgba(139, 92, 246, 0.15)', 
            border: '1px solid rgba(139, 92, 246, 0.3)', 
            color: '#c084fc', 
            padding: '0.3rem 0.85rem', 
            borderRadius: '20px', 
            fontSize: '0.8rem', 
            fontWeight: 700 
          }}>
            <Sparkles size={15} /> JanSahayak AI Automatic Voice Grievance
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.5rem', color: '#fff' }}>
            Speak Your Complaint <span className="gradient-text">(आवाज़ से शिकायत दर्ज करें)</span>
          </h2>
        </div>

        {/* Live Language Detection Status Indicator (NO Manual Language Buttons) */}
        {(isListening || detectedLanguage) && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            color: '#34d399',
            padding: '0.4rem 0.9rem',
            borderRadius: '12px',
            fontSize: '0.82rem',
            fontWeight: 700
          }}>
            <Globe size={15} style={{ animation: isListening && !detectedLanguage ? 'spin 3s linear infinite' : 'none' }} />
            {detectedLanguage ? `🌐 Detected Language: ${detectedLanguage}` : `🌐 Detecting language...`}
          </div>
        )}
      </div>

      {/* Graceful Fallback Banner if Web Speech API is Not Supported */}
      {!isSupported && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.15)',
          border: '1px solid rgba(245, 158, 11, 0.4)',
          color: '#fbbf24',
          padding: '1rem',
          borderRadius: '12px',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem'
        }}>
          <AlertTriangle size={22} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Browser Speech Recognition Unavailable</div>
            <div style={{ fontSize: '0.85rem', marginTop: '0.2rem', color: '#fef3c7' }}>
              Your current browser does not support live speech-to-text. Please type your complaint transcript manually in the box below or use Google Chrome/Edge for voice recording.
            </div>
          </div>
        </div>
      )}

      {/* Speech Detection Error / Fallback Card */}
      {detectionFailed && !isListening && (
        <div style={{
          background: 'rgba(244, 63, 94, 0.15)',
          border: '1px solid rgba(244, 63, 94, 0.4)',
          color: '#f43f5e',
          padding: '1rem 1.2rem',
          borderRadius: '14px',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <AlertTriangle size={20} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>Language could not be detected clearly. Please speak again.</div>
              <div style={{ fontSize: '0.8rem', color: '#fca5a5', marginTop: '0.1rem' }}>
                Ensure your microphone is clear and speak naturally in Hindi, Hinglish, or English.
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleTryAgain}
            style={{
              background: 'linear-gradient(135deg, #f43f5e 0%, #be123c 100%)',
              color: '#fff',
              border: 'none',
              padding: '0.45rem 0.9rem',
              borderRadius: '10px',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: '0 4px 12px rgba(244, 63, 94, 0.3)'
            }}
          >
            <RefreshCw size={15} /> 🔄 Try Again
          </button>
        </div>
      )}

      {/* Runtime Microphone Permission or Speech Error Alert */}
      {error && !detectionFailed && (
        <div style={{
          background: 'rgba(244, 63, 94, 0.15)',
          border: '1px solid rgba(244, 63, 94, 0.3)',
          color: '#f43f5e',
          padding: '0.85rem 1rem',
          borderRadius: '12px',
          marginBottom: '1.25rem',
          fontSize: '0.88rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <AlertTriangle size={18} /> {error}
        </div>
      )}

      {/* Central Microphone Recording Interface */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.6)',
        border: '1px solid var(--glass-border)',
        borderRadius: '18px',
        padding: '2rem 1.5rem',
        textAlign: 'center',
        marginBottom: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
      }}>
        {/* Animated Sound Wave Bars when Recording */}
        {isListening && (
          <div style={{ display: 'flex', gap: '5px', height: '30px', alignItems: 'center', marginBottom: '1rem' }}>
            {[0.4, 0.8, 1, 0.6, 0.9, 0.3, 0.7, 1, 0.5].map((scale, i) => (
              <div
                key={i}
                style={{
                  width: '4px',
                  background: 'var(--rose)',
                  borderRadius: '3px',
                  height: `${scale * 100}%`,
                  animation: 'soundwave 0.8s infinite ease-in-out alternate',
                  animationDelay: `${i * 0.1}s`
                }}
              />
            ))}
          </div>
        )}

        {/* Microphone Button */}
        <div style={{ position: 'relative', marginBottom: '1rem' }}>
          {isListening && (
            <div style={{
              position: 'absolute',
              top: '-10px',
              left: '-10px',
              right: '-10px',
              bottom: '-10px',
              borderRadius: '50%',
              background: 'rgba(244, 63, 94, 0.25)',
              animation: 'pulse-ring 1.5s infinite ease-out'
            }} />
          )}

          <button
            type="button"
            onClick={isListening ? stopListening : startListening}
            disabled={!isSupported && !isListening}
            style={{
              width: '90px',
              height: '90px',
              borderRadius: '50%',
              border: 'none',
              background: isListening 
                ? 'linear-gradient(135deg, #f43f5e 0%, #be123c 100%)' 
                : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: isSupported ? 'pointer' : 'not-allowed',
              boxShadow: isListening 
                ? '0 0 30px rgba(244, 63, 94, 0.6)' 
                : '0 0 25px rgba(59, 130, 246, 0.5)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative',
              zIndex: 2
            }}
          >
            {isListening ? <Square size={34} fill="#fff" /> : <Mic size={38} />}
          </button>
        </div>

        {/* Status Badge & Recording Timer */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
          {isListening ? (
            <>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: 'rgba(244, 63, 94, 0.2)',
                color: '#f43f5e',
                border: '1px solid rgba(244, 63, 94, 0.4)',
                padding: '0.3rem 0.85rem',
                borderRadius: '15px',
                fontSize: '0.85rem',
                fontWeight: 700
              }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f43f5e', display: 'inline-block', animation: 'blink 1s infinite' }} />
                🎤 Listening... {formatTimer(recordingTime)}
              </div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                color: '#34d399',
                padding: '0.25rem 0.75rem',
                borderRadius: '12px',
                fontSize: '0.8rem',
                fontWeight: 700,
                marginTop: '0.2rem'
              }}>
                <Globe size={14} /> 🌐 Language detected: {detectedLanguage || 'Detecting...'}
              </div>
            </>
          ) : (
            <>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: '1.05rem' }}>
                {transcript ? 'Speech Captured' : 'Tap Microphone to Begin'}
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                {transcript 
                  ? 'Review & edit your complaint transcript below before submitting.' 
                  : 'Speak naturally in Hindi, Hinglish, or English.'}
              </p>
            </>
          )}
        </div>

        {/* Mic Controls */}
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          {!isListening ? (
            <button
              type="button"
              onClick={startListening}
              disabled={!isSupported}
              style={controlBtnStyle('var(--primary-gradient)')}
            >
              <Mic size={16} /> {transcript ? 'Record More / Speak Again' : 'Start Recording'}
            </button>
          ) : (
            <button
              type="button"
              onClick={stopListening}
              style={controlBtnStyle('linear-gradient(135deg, #f43f5e 0%, #be123c 100%)')}
            >
              <Square size={16} fill="#fff" /> Stop Recording
            </button>
          )}

          {transcript && (
            <button
              type="button"
              onClick={resetTranscript}
              disabled={isListening}
              style={{
                ...controlBtnStyle('rgba(255, 255, 255, 0.08)'),
                color: 'var(--text-secondary)',
                border: '1px solid var(--glass-border)'
              }}
            >
              <RefreshCw size={15} /> Re-record / Clear
            </button>
          )}
        </div>

        {/* Audio Recording Playback Preview */}
        {audioUrl && (
          <div style={{ marginTop: '1.25rem', width: '100%', maxWidth: '450px', background: 'rgba(10, 14, 26, 0.8)', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--emerald)', marginBottom: '0.4rem', fontWeight: 600 }}>
              <Volume2 size={16} /> Audio Voice Note Recorded
            </div>
            <audio src={audioUrl} controls style={{ width: '100%', height: '36px' }} />
          </div>
        )}
      </div>

      {/* Transcript Display & Editable Box */}
      <form onSubmit={handleFormSubmit}>
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <FileText size={16} style={{ color: 'var(--primary)' }} /> Live Transcript (शिकायत का विवरण)
            </label>
            
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setIsEditing(!isEditing)}
                style={{
                  background: isEditing ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                  border: isEditing ? '1px solid var(--primary)' : '1px solid var(--glass-border)',
                  color: isEditing ? 'var(--primary)' : 'var(--text-secondary)',
                  padding: '0.25rem 0.65rem',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem'
                }}
              >
                <Edit3 size={14} /> {isEditing ? 'Editing Mode On' : '✏️ Edit Transcript'}
              </button>
            </div>
          </div>

          <div style={{ position: 'relative' }}>
            <textarea
              rows="5"
              required
              placeholder={isSupported ? "Your spoken speech transcript will appear here automatically... Speak naturally in Hindi, Hinglish, or English." : "Type your complaint description here..."}
              value={transcript + (interimTranscript ? ` [${interimTranscript}...]` : '')}
              onChange={(e) => {
                setTranscript(e.target.value);
              }}
              readOnly={!isEditing && isListening}
              style={{
                width: '100%',
                padding: '0.85rem 1rem',
                background: 'rgba(10, 14, 26, 0.7)',
                border: isListening ? '1px solid var(--rose)' : '1px solid var(--glass-border)',
                borderRadius: '12px',
                color: 'var(--text-primary)',
                fontSize: '0.95rem',
                lineHeight: '1.6',
                resize: 'vertical',
                outline: 'none',
                fontFamily: 'inherit'
              }}
            />

            {transcript && (
              <div style={{
                position: 'absolute',
                bottom: '10px',
                right: '12px',
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                background: 'rgba(15, 23, 42, 0.9)',
                padding: '0.15rem 0.55rem',
                borderRadius: '6px',
                border: '1px solid var(--glass-border)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}>
                <span>{transcript.split(/\s+/).filter(Boolean).length} words</span>
                <span>•</span>
                <span style={{ color: '#34d399', fontWeight: 600 }}>🌐 {detectedLanguage || 'Detecting...'}</span>
              </div>
            )}
          </div>
        </div>

        {/* AI Extracted Smart Metadata Preview */}
        {transcript && (
          <div style={{
            background: 'rgba(139, 92, 246, 0.08)',
            border: '1px solid rgba(139, 92, 246, 0.25)',
            borderRadius: '14px',
            padding: '1.1rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#c084fc', fontSize: '0.88rem', fontWeight: 700, marginBottom: '0.75rem' }}>
              <Sparkles size={16} /> JanSahayak AI Voice Analysis & Auto-Classification
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>Generated Title</span>
                <input
                  type="text"
                  value={parsedData.title}
                  onChange={(e) => setParsedData({ ...parsedData, title: e.target.value })}
                  style={{ ...miniInputStyle }}
                />
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>Detected Category</span>
                <select
                  value={parsedData.category}
                  onChange={(e) => setParsedData({ ...parsedData, category: e.target.value })}
                  style={{ ...miniInputStyle }}
                >
                  <option value="Water Supply">Water Supply</option>
                  <option value="Roads & Transport">Roads & Transport</option>
                  <option value="Sanitation & Waste">Sanitation & Waste</option>
                  <option value="Electricity">Electricity & Street Lights</option>
                  <option value="Sewage">Sewage & Drainage</option>
                </select>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>Assigned Department</span>
                <select
                  value={parsedData.department}
                  onChange={(e) => setParsedData({ ...parsedData, department: e.target.value })}
                  style={{ ...miniInputStyle }}
                >
                  <option value="Jal Board">Jal Board / Water Dept</option>
                  <option value="Public Works Dept">Public Works Dept (PWD)</option>
                  <option value="Municipal Corporation">Municipal Corporation</option>
                  <option value="State Electricity Board">Electricity Board</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Additional Optional Location & Reusable Photo Attachments */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.5rem' }}>
          {/* High-Accuracy Location Detection System */}
          <LocationPicker
            address={address}
            setAddress={setAddress}
            latitude={latitude}
            setLatitude={setLatitude}
            longitude={longitude}
            setLongitude={setLongitude}
            accuracy={accuracy}
            setAccuracy={setAccuracy}
            locationTimestamp={locationTimestamp}
            setLocationTimestamp={setLocationTimestamp}
            language={detectedLanguage === 'Hindi' ? 'hi' : 'en'}
          />

          {/* Reusable Photo Upload Component (IDENTICAL to Standard Form) */}
          <SitePhotoUpload
            photoPreview={photoPreview}
            setPhotoPreview={setPhotoPreview}
            selectedFile={selectedFile}
            setSelectedFile={setSelectedFile}
            setImageUrl={setImageUrl}
            fileError={fileError}
            setFileError={setFileError}
            language={detectedLanguage === 'Hindi' ? 'hi' : 'en'}
          />
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={loading || !transcript.trim() || isListening}
          style={{
            width: '100%',
            padding: '0.85rem',
            fontSize: '1rem',
            fontWeight: 700,
            background: 'var(--primary-gradient)',
            boxShadow: '0 4px 20px rgba(59, 130, 246, 0.4)',
            opacity: (!transcript.trim() || isListening) ? 0.6 : 1
          }}
        >
          <Send size={18} /> {loading ? 'Submitting Grievance...' : 'Submit Voice Grievance'}
        </Button>
      </form>

      {/* Keyframe animations */}
      <style>{`
        @keyframes soundwave {
          0% { height: 15%; }
          100% { height: 100%; }
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.95); opacity: 0.8; }
          50% { transform: scale(1.25); opacity: 0.3; }
          100% { transform: scale(1.4); opacity: 0; }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </Card>
  );
};

const controlBtnStyle = (bg) => ({
  background: bg,
  color: '#fff',
  border: 'none',
  padding: '0.55rem 1rem',
  borderRadius: '10px',
  fontSize: '0.85rem',
  fontWeight: 600,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '0.4rem',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
  transition: 'all 0.2s ease'
});

const miniInputStyle = {
  width: '100%',
  padding: '0.5rem 0.75rem',
  background: 'rgba(10, 14, 26, 0.8)',
  border: '1px solid var(--glass-border)',
  borderRadius: '8px',
  color: 'var(--text-primary)',
  fontSize: '0.82rem',
  outline: 'none',
};
