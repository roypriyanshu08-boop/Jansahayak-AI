import React, { useState, useRef, useEffect } from 'react';
import { Camera, Image as ImageIcon, Upload, X, RefreshCw, Sparkles, Check, AlertCircle } from 'lucide-react';
import { Card } from './CommonComponents';

export const SitePhotoUpload = ({
  photoPreview,
  setPhotoPreview,
  selectedFile,
  setSelectedFile,
  setImageUrl,
  fileError,
  setFileError,
  language = 'en',
  photoAnalysis = null,
  analyzingPhoto = false,
  handleAnalyzePhoto = null
}) => {
  const galleryInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Selection Option Modal State
  const [showOptionModal, setShowOptionModal] = useState(false);

  // Camera Live Stream Modal States
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [mediaStream, setMediaStream] = useState(null);
  const [capturedDataUrl, setCapturedDataUrl] = useState(null);
  const [cameraError, setCameraError] = useState('');
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
      const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test((userAgent || '').toLowerCase());
      setIsMobileDevice(isMobileUA && isTouch);
    };
    checkMobile();
  }, []);

  // Clean up media stream on unmount or modal close
  useEffect(() => {
    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [mediaStream]);

  // Keyboard escape listener for option modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowOptionModal(false);
        if (showCameraModal) handleCloseCameraModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showCameraModal]);

  // Handle Gallery Selection
  const handleGallerySelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setShowOptionModal(false);
    if (setFileError) setFileError('');
    setCameraError('');

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      if (setFileError) setFileError(language === 'hi' ? 'केवल JPG, JPEG, PNG, WEBP फोटो प्रारूप समर्थित हैं।' : 'Only JPG, JPEG, PNG, and WEBP image formats are accepted.');
      return;
    }

    const maxSizeMB = 10;
    if (file.size > maxSizeMB * 1024 * 1024) {
      if (setFileError) setFileError(language === 'hi' ? `फोटो का आकार ${maxSizeMB}MB की सीमा से कम होना चाहिए।` : `File size must be under ${maxSizeMB} MB limit.`);
      return;
    }

    if (setSelectedFile) setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      if (setPhotoPreview) setPhotoPreview(reader.result);
      if (setImageUrl) setImageUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Trigger "Take Photo" Action
  const handleTakePhotoClick = async () => {
    setShowOptionModal(false);
    if (setFileError) setFileError('');
    setCameraError('');

    // Mobile fallback: use native camera capture input
    if (isMobileDevice && cameraInputRef.current) {
      cameraInputRef.current.click();
      return;
    }

    // Desktop/Webcam flow: Request webcam stream via MediaDevices API
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        setMediaStream(stream);
        setCapturedDataUrl(null);
        setShowCameraModal(true);
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        }, 150);
      } catch (err) {
        console.warn('Camera access denied or media error:', err);
        setCameraError(language === 'hi' ? 'कैमरा उपलब्ध नहीं है। कृपया डिवाइस गैलरी से फोटो चुनें।' : 'Camera is not available. You can choose a photo from your device instead.');
      }
    } else {
      setCameraError(language === 'hi' ? 'कैमरा उपलब्ध नहीं है। कृपया डिवाइस गैलरी से फोटो चुनें।' : 'Camera is not available. You can choose a photo from your device instead.');
    }
  };

  // Capture Frame from Live Stream
  const handleSnapPhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedDataUrl(dataUrl);
    }
  };

  // Retake Photo in Camera Modal
  const handleRetakeInModal = () => {
    setCapturedDataUrl(null);
    if (videoRef.current && mediaStream) {
      videoRef.current.srcObject = mediaStream;
    }
  };

  // Use Captured Photo from Modal
  const handleUsePhotoFromModal = () => {
    if (!capturedDataUrl) return;

    fetch(capturedDataUrl)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], `site_photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
        if (setSelectedFile) setSelectedFile(file);
      });

    if (setPhotoPreview) setPhotoPreview(capturedDataUrl);
    if (setImageUrl) setImageUrl(capturedDataUrl);
    handleCloseCameraModal();
  };

  // Close Camera Modal and Stop Stream
  const handleCloseCameraModal = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      setMediaStream(null);
    }
    setShowCameraModal(false);
    setCapturedDataUrl(null);
  };

  // Remove Photo Preview
  const handleRemovePhoto = () => {
    if (setSelectedFile) setSelectedFile(null);
    if (setPhotoPreview) setPhotoPreview('');
    if (setImageUrl) setImageUrl('');
    if (setFileError) setFileError('');
    setCameraError('');
    if (galleryInputRef.current) galleryInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    handleCloseCameraModal();
  };

  return (
    <div>
      {/* Hidden Gallery Input */}
      <input
        type="file"
        ref={galleryInputRef}
        accept="image/jpeg,image/png,image/webp,image/jpg"
        onChange={handleGallerySelect}
        style={{ display: 'none' }}
      />

      {/* Hidden Mobile Camera Input */}
      <input
        type="file"
        ref={cameraInputRef}
        accept="image/*"
        capture="environment"
        onChange={handleGallerySelect}
        style={{ display: 'none' }}
      />

      {/* Hidden Canvas for Webcam Frame Snap */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* SINGLE PROFESSIONAL UPLOAD CARD WHEN NO PHOTO PREVIEW */}
      {!photoPreview ? (
        <div style={{
          background: 'rgba(15, 23, 42, 0.65)',
          border: '1px solid var(--glass-border)',
          borderRadius: '16px',
          padding: '1.25rem 1.5rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
            <div>
              <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', display: 'block' }}>
                {language === 'hi' ? 'साइट फोटो अपलोड करें' : 'Upload Site Photo'}
              </span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.15rem' }}>
                {language === 'hi' ? 'वैकल्पिक • JPG, PNG' : 'Optional • JPG, PNG'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowOptionModal(true)}
            style={{
              width: '100%',
              padding: '0.85rem 1.25rem',
              border: '1.5px dashed rgba(59, 130, 246, 0.4)',
              borderRadius: '12px',
              background: 'rgba(59, 130, 246, 0.08)',
              color: '#60a5fa',
              fontSize: '0.92rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.6rem',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
          >
            <Camera size={20} />
            <span>📷 {language === 'hi' ? 'फोटो अपलोड करें / जोड़ें' : 'Upload / Add Photo'}</span>
          </button>
        </div>
      ) : (
        /* PHOTO PREVIEW CARD AFTER SELECTION OR CAPTURE */
        <div style={{
          background: 'rgba(15, 23, 42, 0.85)',
          padding: '1.25rem',
          borderRadius: '16px',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#60a5fa', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Check size={16} style={{ color: '#34d399' }} />
              {language === 'hi' ? 'साइट फोटो संलग्न' : 'Site Photo Attached'}
            </span>

            {handleAnalyzePhoto && (
              <button
                type="button"
                onClick={handleAnalyzePhoto}
                disabled={analyzingPhoto}
                style={{
                  background: 'rgba(139, 92, 246, 0.2)',
                  border: '1px solid rgba(139, 92, 246, 0.4)',
                  color: '#c084fc',
                  padding: '0.3rem 0.75rem',
                  borderRadius: '14px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <Sparkles size={14} /> {analyzingPhoto ? (language === 'hi' ? 'विश्लेषण जारी...' : 'Analyzing...') : (language === 'hi' ? 'AI विश्लेषण' : 'Analyze with AI')}
              </button>
            )}
          </div>

          {/* Photo Thumbnail Display */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '12px',
            overflow: 'hidden',
            background: '#000',
            border: '1px solid var(--glass-border)',
            maxHeight: '260px',
            position: 'relative'
          }}>
            <img
              src={photoPreview}
              alt="Site Photo Preview"
              style={{ maxWidth: '100%', maxHeight: '260px', objectFit: 'contain' }}
            />
          </div>

          {/* Selected File Name / Details */}
          {selectedFile && (
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              📄 {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
            </div>
          )}

          {/* Change Photo and Remove Photo Actions */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={() => setShowOptionModal(true)}
              style={{
                flex: 1,
                padding: '0.65rem 1rem',
                background: 'rgba(59, 130, 246, 0.15)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                color: '#60a5fa',
                borderRadius: '10px',
                fontSize: '0.88rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                transition: 'all 0.2s ease'
              }}
            >
              <RefreshCw size={16} /> 🔄 {language === 'hi' ? 'फोटो बदलें' : 'Change Photo'}
            </button>

            <button
              type="button"
              onClick={handleRemovePhoto}
              style={{
                flex: 1,
                padding: '0.65rem 1rem',
                background: 'rgba(244, 63, 94, 0.15)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                color: '#f43f5e',
                borderRadius: '10px',
                fontSize: '0.88rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                transition: 'all 0.2s ease'
              }}
            >
              <X size={16} /> ✕ {language === 'hi' ? 'हटाएं' : 'Remove Photo'}
            </button>
          </div>
        </div>
      )}

      {/* Camera Permission Denied or File Error Alert */}
      {cameraError && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.15)',
          border: '1px solid rgba(245, 158, 11, 0.4)',
          color: '#fbbf24',
          padding: '0.75rem',
          borderRadius: '10px',
          fontSize: '0.85rem',
          marginTop: '0.75rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem'
        }}>
          <AlertCircle size={16} /> {cameraError}
        </div>
      )}

      {fileError && (
        <div style={{
          background: 'rgba(244, 63, 94, 0.15)',
          border: '1px solid rgba(244, 63, 94, 0.4)',
          color: '#f43f5e',
          padding: '0.75rem',
          borderRadius: '10px',
          fontSize: '0.85rem',
          marginTop: '0.75rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem'
        }}>
          <AlertCircle size={16} /> {fileError}
        </div>
      )}

      {/* ====================================================== */}
      {/* 1. SELECTION MODAL (Take Photo vs Choose from Gallery) */}
      {/* ====================================================== */}
      {showOptionModal && (
        <div
          onClick={() => setShowOptionModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 99999,
            background: 'rgba(10, 14, 26, 0.82)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#0f172a',
              border: '1px solid var(--glass-border)',
              borderRadius: '20px',
              maxWidth: '400px',
              width: '100%',
              padding: '1.75rem 1.5rem',
              boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
              textAlign: 'center'
            }}
          >
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', marginBottom: '1.25rem' }}>
              {language === 'hi' ? 'साइट फोटो जोड़ें' : 'Add Site Photo'}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.25rem' }}>
              {/* Option A: Take Photo */}
              <button
                type="button"
                onClick={handleTakePhotoClick}
                style={{
                  width: '100%',
                  padding: '1rem 1.25rem',
                  borderRadius: '14px',
                  background: 'rgba(59, 130, 246, 0.12)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  textAlign: 'left',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: 'rgba(59, 130, 246, 0.2)',
                  color: '#60a5fa',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Camera size={22} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff' }}>
                    📷 {language === 'hi' ? 'फोटो लें' : 'Take Photo'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                    {language === 'hi' ? 'कैमरे का उपयोग करें' : 'Use your camera'}
                  </div>
                </div>
              </button>

              {/* Option B: Choose from Gallery */}
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                style={{
                  width: '100%',
                  padding: '1rem 1.25rem',
                  borderRadius: '14px',
                  background: 'rgba(139, 92, 246, 0.12)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  textAlign: 'left',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: 'rgba(139, 92, 246, 0.2)',
                  color: '#c084fc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <ImageIcon size={22} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff' }}>
                    🖼️ {language === 'hi' ? 'गैलरी से चुनें' : 'Choose from Gallery'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                    {language === 'hi' ? 'मौजूदा फोटो चुनें' : 'Select an existing photo'}
                  </div>
                </div>
              </button>
            </div>

            {/* Cancel Button */}
            <button
              type="button"
              onClick={() => setShowOptionModal(false)}
              style={{
                width: '100%',
                padding: '0.65rem',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {language === 'hi' ? 'रद्द करें' : 'Cancel'}
            </button>
          </div>
        </div>
      )}

      {/* ====================================================== */}
      {/* 2. WEBCAM LIVE CAMERA STREAM MODAL (Desktop webcam)     */}
      {/* ====================================================== */}
      {showCameraModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 99999,
          background: 'rgba(10, 14, 26, 0.92)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem'
        }}>
          <Card style={{ maxWidth: '560px', width: '100%', padding: '1.5rem', border: '1px solid rgba(139, 92, 246, 0.4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Camera size={20} style={{ color: '#c084fc' }} /> {language === 'hi' ? 'लाइव कैमरा फोटो' : 'Camera Photo Capture'}
              </h3>
              <button
                type="button"
                onClick={handleCloseCameraModal}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {!capturedDataUrl ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ borderRadius: '12px', overflow: 'hidden', background: '#000', border: '1px solid var(--glass-border)' }}>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    style={{ width: '100%', maxHeight: '340px', objectFit: 'cover', display: 'block' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                  <button
                    type="button"
                    onClick={handleSnapPhoto}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: '#10b981',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '10px',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)'
                    }}
                  >
                    <Camera size={18} /> {language === 'hi' ? 'फोटो खींचें' : 'Capture Photo'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseCameraModal}
                    style={{
                      padding: '0.75rem 1.25rem',
                      background: 'rgba(244, 63, 94, 0.15)',
                      border: '1px solid rgba(244, 63, 94, 0.3)',
                      color: '#f43f5e',
                      borderRadius: '10px',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {language === 'hi' ? 'रद्द करें' : 'Cancel'}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ borderRadius: '12px', overflow: 'hidden', background: '#000', border: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'center' }}>
                  <img
                    src={capturedDataUrl}
                    alt="Captured Frame"
                    style={{ maxWidth: '100%', maxHeight: '340px', objectFit: 'contain' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={handleRetakeInModal}
                    style={{
                      padding: '0.65rem',
                      background: 'rgba(59, 130, 246, 0.15)',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      color: '#60a5fa',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.3rem'
                    }}
                  >
                    <RefreshCw size={14} /> {language === 'hi' ? 'पुनः लें' : 'Retake'}
                  </button>
                  <button
                    type="button"
                    onClick={handleUsePhotoFromModal}
                    style={{
                      padding: '0.65rem',
                      background: '#10b981',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.3rem',
                      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)'
                    }}
                  >
                    <Check size={14} /> {language === 'hi' ? 'उपयोग करें' : 'Use Photo'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseCameraModal}
                    style={{
                      padding: '0.65rem',
                      background: 'rgba(244, 63, 94, 0.15)',
                      border: '1px solid rgba(244, 63, 94, 0.3)',
                      color: '#f43f5e',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.3rem'
                    }}
                  >
                    <X size={14} /> {language === 'hi' ? 'रद्द करें' : 'Cancel'}
                  </button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};
