import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, RefreshCw, AlertTriangle, CheckCircle2, Globe, Crosshair } from 'lucide-react';

export const LocationPicker = ({
  address,
  setAddress,
  latitude,
  setLatitude,
  longitude,
  setLongitude,
  accuracy,
  setAccuracy,
  locationTimestamp,
  setLocationTimestamp,
  language = 'en'
}) => {
  const [detecting, setDetecting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState('none'); // 'success' | 'warning' | 'error' | 'info' | 'none'
  const [manualMode, setManualMode] = useState(false);

  // High Accuracy Location Detection Handler
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setStatusType('error');
      setStatusMessage(
        language === 'hi'
          ? 'आपके डिवाइस/ब्राउज़र में जीपीएस स्थान समर्थन उपलब्ध नहीं है।'
          : 'Geolocation is not supported by your browser or device settings.'
      );
      return;
    }

    setDetecting(true);
    setStatusType('info');
    setStatusMessage(
      language === 'hi'
        ? 'जीपीएस उपग्रहों से उच्च-सटीकता स्थान प्राप्त किया जा रहा है...'
        : 'Acquiring high-accuracy location from GPS hardware...'
    );

    const geoOptions = {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 25000
    };

    const onSuccess = async (position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      const acc = position.coords.accuracy || 15;
      const timeISO = new Date(position.timestamp || Date.now()).toISOString();

      setLatitude(lat);
      setLongitude(lon);
      setAccuracy(acc);
      if (setLocationTimestamp) setLocationTimestamp(timeISO);

      const roundedAcc = Math.round(acc);

      // reverse geocoding via OpenStreetMap Nominatim API
      let geocodedAddr = '';
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
        const data = await res.json();
        if (data && data.display_name) {
          geocodedAddr = data.display_name;
        }
      } catch (err) {
        console.warn('Reverse geocoding offline:', err);
      }

      if (geocodedAddr) {
        setAddress(geocodedAddr);
      } else if (!address) {
        setAddress('Address could not be determined precisely.');
      }

      setDetecting(false);

      if (acc <= 100) {
        setStatusType('success');
        setStatusMessage(
          language === 'hi'
            ? `✓ स्थान का सफलतापूर्वक पता चला — सटीकता: लगभग ${roundedAcc} मीटर`
            : `✓ Location detected successfully — Accuracy: approximately ${roundedAcc} meters`
        );
      } else {
        setStatusType('warning');
        setStatusMessage(
          language === 'hi'
            ? `⚠️ स्थान का पता चला, लेकिन सटीकता कम है (लगभग ${roundedAcc} मीटर)। कृपया बाहर जाएं या जीपीएस सक्षम करें।`
            : `⚠️ Location detected, but accuracy is low (${roundedAcc} meters). Please move outdoors or enable high-accuracy location services and try again.`
        );
      }
    };

    const onError = (err) => {
      setDetecting(false);
      setStatusType('error');

      switch (err.code) {
        case err.PERMISSION_DENIED:
          setStatusMessage(
            language === 'hi'
              ? 'स्थान की अनुमति अस्वीकृत। कृपया अपनी ब्राउज़र सेटिंग में स्थान एक्सेस की अनुमति दें या मैन्युअल दर्ज करें।'
              : 'Location permission was denied. Please allow location access in your browser/device settings or enter location manually.'
          );
          break;
        case err.POSITION_UNAVAILABLE:
          setStatusMessage(
            language === 'hi'
              ? 'स्थान की जानकारी उपलब्ध नहीं है। कृपया मैन्युअल दर्ज करें।'
              : 'Location information is unavailable on your device. Please enter the location manually.'
          );
          break;
        case err.TIMEOUT:
          setStatusMessage(
            language === 'hi'
              ? 'जीपीएस स्थान अनुरोध का समय समाप्त हो गया। कृपया पुन: प्रयास करें।'
              : 'Location request timed out. Please try refreshing or enter location manually.'
          );
          break;
        default:
          setStatusMessage(
            language === 'hi'
              ? 'स्थान की खोज विफल रही। कृपया मैन्युअल दर्ज करें।'
              : 'Failed to acquire location. Please enter address manually.'
          );
          break;
      }
    };

    navigator.geolocation.getCurrentPosition(onSuccess, onError, geoOptions);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <MapPin size={16} style={{ color: 'var(--primary)' }} />
          {language === 'hi' ? 'सटीक स्थान एवं पता' : 'Incident Location & Coordinates'}
        </label>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={handleDetectLocation}
            disabled={detecting}
            style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: '#34d399',
              padding: '0.3rem 0.75rem',
              borderRadius: '12px',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.2)'
            }}
          >
            {detecting ? (
              <>
                <RefreshCw size={14} className="spin-animation" />
                {language === 'hi' ? 'स्थान खोजा जा रहा है...' : 'Detecting GPS...'}
              </>
            ) : (
              <>
                <Navigation size={14} />
                {latitude ? (language === 'hi' ? '🔄 स्थान रीफ्रेश करें' : '🔄 Refresh Location') : (language === 'hi' ? '📍 स्वतः स्थान का पता लगाएं' : '📍 Auto-Detect Location')}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Address Text Field */}
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder={language === 'hi' ? 'उदा: मकान नं. 12, मेन रोड, ब्लॉक बी' : 'e.g. Street 4, Near Govt School, Sector 14'}
          style={{
            width: '100%',
            padding: '0.75rem 1rem 0.75rem 2.5rem',
            background: 'rgba(10, 14, 26, 0.6)',
            border: '1px solid var(--glass-border)',
            borderRadius: '10px',
            color: 'var(--text-primary)',
            fontSize: '0.9rem',
            outline: 'none'
          }}
        />
        <MapPin size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
      </div>

      {/* Status Alert Banner */}
      {statusMessage && (
        <div style={{
          padding: '0.65rem 0.85rem',
          borderRadius: '10px',
          fontSize: '0.82rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          background: statusType === 'success'
            ? 'rgba(16, 185, 129, 0.15)'
            : statusType === 'warning'
            ? 'rgba(245, 158, 11, 0.15)'
            : statusType === 'error'
            ? 'rgba(244, 63, 94, 0.15)'
            : 'rgba(59, 130, 246, 0.15)',
          border: statusType === 'success'
            ? '1px solid rgba(16, 185, 129, 0.3)'
            : statusType === 'warning'
            ? '1px solid rgba(245, 158, 11, 0.3)'
            : statusType === 'error'
            ? '1px solid rgba(244, 63, 94, 0.3)'
            : '1px solid rgba(59, 130, 246, 0.3)',
          color: statusType === 'success'
            ? '#34d399'
            : statusType === 'warning'
            ? '#fbbf24'
            : statusType === 'error'
            ? '#f43f5e'
            : '#60a5fa'
        }}>
          {statusType === 'success' && <CheckCircle2 size={16} style={{ flexShrink: 0 }} />}
          {statusType === 'warning' && <AlertTriangle size={16} style={{ flexShrink: 0 }} />}
          {statusType === 'error' && <AlertTriangle size={16} style={{ flexShrink: 0 }} />}
          {statusType === 'info' && <Globe size={16} style={{ flexShrink: 0 }} />}
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Detected Coordinates Box & Interactive Pin Info */}
      {latitude && longitude && (
        <div style={{
          background: 'rgba(15, 23, 42, 0.7)',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          borderRadius: '12px',
          padding: '0.85rem 1rem',
          fontSize: '0.82rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontWeight: 800, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Crosshair size={14} /> {language === 'hi' ? 'जीपीएस निर्देशांक प्राप्त' : '📍 Detected Device GPS Coordinates'}
            </span>
            <span style={{ fontSize: '0.75rem', color: accuracy <= 100 ? '#34d399' : '#fbbf24', fontWeight: 700 }}>
              Accuracy: ~{Math.round(accuracy || 0)}m
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.5rem', color: 'var(--text-secondary)' }}>
            <div><strong>Latitude:</strong> {typeof latitude === 'number' ? latitude.toFixed(6) : latitude}</div>
            <div><strong>Longitude:</strong> {typeof longitude === 'number' ? longitude.toFixed(6) : longitude}</div>
            {accuracy && <div><strong>GPS Error Margin:</strong> ±{Math.round(accuracy)}m</div>}
          </div>

          {/* Real Embedded Leaflet Map View at exact coordinates */}
          <div style={{ marginTop: '0.75rem', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--glass-border)', height: '180px', position: 'relative' }}>
            <iframe
              title="Location Map"
              width="100%"
              height="100%"
              frameBorder="0"
              scrolling="no"
              src={`https://maps.google.com/maps?q=${latitude},${longitude}&z=16&output=embed`}
              style={{ filter: 'invert(90%) hue-rotate(180deg) brightness(95%) contrast(90%)' }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
