import React, { useEffect, useState, useRef } from 'react';
import L from 'leaflet';
import 'leaflet.heat';
import { complaintService } from '../../services/complaintService';
import { Card, Badge, LoadingSpinner, Button } from '../../components/common/CommonComponents';
import { 
  MapPin, Layers, AlertTriangle, Filter, Eye, Building2, 
  CheckCircle2, Clock, ShieldAlert, Sparkles, Navigation, RefreshCw, Flame, Calendar
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const ComplaintMap = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('markers'); // 'heatmap' | 'markers'

  // Multi-criteria Filter States
  const [dateFilter, setDateFilter] = useState('all'); // 'all' | '7d' | '30d' | '90d'
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [selectedWard, setSelectedWard] = useState('all');

  const [selectedComplaint, setSelectedComplaint] = useState(null);

  const mapRef = useRef(null);
  const leafletMapInstance = useRef(null);
  const markersLayerRef = useRef(null);
  const heatLayerRef = useRef(null);

  // Fetch complaints from DB
  const loadComplaints = async () => {
    try {
      setLoading(true);
      const data = await complaintService.getAllComplaints();

      let mapData = (data || []).filter(c => c.latitude && c.longitude && !isNaN(c.latitude) && !isNaN(c.longitude)).map((c, idx) => {
        let ward = "Ward Area";
        const addr = (c.address || '').toLowerCase();
        if (addr.includes('ward 5')) ward = "Ward 5";
        else if (addr.includes('ward 18')) ward = "Ward 18";
        else if (addr.includes('ward 4')) ward = "Ward 4";
        else if (addr.includes('ward 12')) ward = "Ward 12";

        return {
          ...c,
          ward,
          created_days_ago: c.created_at ? Math.max(0, Math.floor((Date.now() - new Date(c.created_at).getTime()) / 86400000)) : 0
        };
      });

      setComplaints(mapData);
      if (mapData.length > 0) setSelectedComplaint(mapData[0]);
      else setSelectedComplaint(null);
    } catch (err) {
      console.error('Failed to load map data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, []);

  // Initialize Leaflet + OpenStreetMap engine
  useEffect(() => {
    if (loading || !mapRef.current) return;

    if (!leafletMapInstance.current) {
      const map = L.map(mapRef.current, {
        center: DEFAULT_CENTER,
        zoom: 13,
        zoomControl: true
      });

      // Add OpenStreetMap Tile Layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      leafletMapInstance.current = map;
    }
  }, [loading]);

  // Update Map Layer (Heatmap vs Markers) whenever viewMode, complaints, or filters change
  useEffect(() => {
    if (!leafletMapInstance.current) return;

    const map = leafletMapInstance.current;
    const markersLayer = markersLayerRef.current;
    markersLayer.clearLayers();

    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }

    const filtered = getFilteredComplaints();

    if (viewMode === 'heatmap') {
      // Build weighted heat points: [lat, lng, intensity]
      const heatPoints = filtered.map(c => {
        const prio = (c.priority || 'MEDIUM').toUpperCase();
        let intensity = 0.5;
        if (prio === 'CRITICAL') intensity = 1.0;
        else if (prio === 'HIGH') intensity = 0.8;
        else if (prio === 'MEDIUM') intensity = 0.5;
        else if (prio === 'LOW') intensity = 0.25;

        if (c.status === 'ESCALATED') intensity = 1.0;

        return [c.latitude, c.longitude, intensity];
      });

      if (heatPoints.length > 0 && L.heatLayer) {
        heatLayerRef.current = L.heatLayer(heatPoints, {
          radius: 28,
          blur: 18,
          maxZoom: 16,
          max: 1.0,
          gradient: {
            0.2: '#3b82f6', // Low density (Blue)
            0.5: '#22c55e', // Moderate density (Green)
            0.75: '#eab308', // High density (Yellow/Orange)
            1.0: '#ef4444'  // Critical hotspot (Red)
          }
        }).addTo(map);
      }
    } else {
      // Render Individual Marker Pins
      filtered.forEach((c) => {
        const prio = (c.priority || 'MEDIUM').toUpperCase();
        const st = (c.status || 'SUBMITTED').toUpperCase();

        let markerColor = '#60a5fa';
        if (prio === 'CRITICAL' || st === 'ESCALATED') markerColor = '#f43f5e';
        else if (prio === 'HIGH') markerColor = '#fbbf24';
        else if (st === 'RESOLVED' || st === 'CLOSED') markerColor = '#34d399';
        else if (prio === 'LOW') markerColor = '#94a3b8';

        const customIcon = L.divIcon({
          className: 'custom-map-marker',
          html: `
            <div style="
              width: 32px;
              height: 32px;
              border-radius: 50%;
              background: ${markerColor};
              border: 2.5px solid #ffffff;
              box-shadow: 0 4px 12px ${markerColor}90;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #ffffff;
              font-weight: 800;
              cursor: pointer;
            ">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 32],
          popupAnchor: [0, -32]
        });

        const marker = L.marker([c.latitude, c.longitude], { icon: customIcon });

        const createdDateStr = c.created_at ? new Date(c.created_at).toLocaleString() : "Recent";

        const popupHtml = `
          <div style="font-family: inherit; width: 220px; color: #0f172a; padding: 4px;">
            <div style="font-size: 0.72rem; font-weight: 800; color: #64748b; text-transform: uppercase;">ID: ${c.id}</div>
            <h4 style="font-size: 0.95rem; font-weight: 800; margin: 2px 0 6px 0; color: #0f172a; line-height: 1.3;">${c.title}</h4>
            <div style="display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 6px;">
              <span style="font-size: 0.7rem; font-weight: 800; padding: 2px 6px; border-radius: 10px; background: ${markerColor}25; color: ${markerColor};">${prio}</span>
              <span style="font-size: 0.7rem; font-weight: 700; padding: 2px 6px; border-radius: 10px; background: #e2e8f0; color: #334155;">${st.replace('_', ' ')}</span>
            </div>
            <div style="font-size: 0.78rem; color: #475569; margin-bottom: 3px;"><strong>Category:</strong> ${c.category || 'General'}</div>
            <div style="font-size: 0.78rem; color: #475569; margin-bottom: 3px;"><strong>Location:</strong> ${c.address || 'Public Area'}</div>
            <div style="font-size: 0.72rem; color: #94a3b8; margin-top: 4px;">Created: ${createdDateStr}</div>
          </div>
        `;

        marker.bindPopup(popupHtml);
        marker.on('click', () => setSelectedComplaint(c));
        markersLayer.addLayer(marker);
      });
    }

    if (filtered.length > 0) {
      const bounds = L.latLngBounds(filtered.map(c => [c.latitude, c.longitude]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  }, [complaints, viewMode, dateFilter, categoryFilter, priorityFilter, departmentFilter, selectedWard]);

  // Multi-criteria Filtering Function
  const getFilteredComplaints = () => {
    return complaints.filter(c => {
      // 1. Ward Filter
      if (selectedWard !== 'all' && c.ward !== selectedWard) return false;

      // 2. Date Filter
      if (dateFilter !== 'all') {
        const days = c.created_days_ago || 0;
        if (dateFilter === '7d' && days > 7) return false;
        if (dateFilter === '30d' && days > 30) return false;
        if (dateFilter === '90d' && days > 90) return false;
      }

      // 3. Category Filter
      if (categoryFilter !== 'all' && (c.category || '').toLowerCase() !== categoryFilter.toLowerCase()) {
        return false;
      }

      // 4. Priority Filter
      const prio = (c.priority || 'MEDIUM').toUpperCase();
      const st = (c.status || 'SUBMITTED').toUpperCase();

      if (priorityFilter !== 'all') {
        if (priorityFilter === 'Pending') {
          if (['RESOLVED', 'CLOSED'].includes(st)) return false;
        } else if (priorityFilter === 'Resolved') {
          if (!['RESOLVED', 'CLOSED'].includes(st)) return false;
        } else if (prio !== priorityFilter.toUpperCase()) {
          return false;
        }
      }

      // 5. Department Filter
      if (departmentFilter !== 'all' && !(c.department || '').toLowerCase().includes(departmentFilter.toLowerCase())) {
        return false;
      }

      return true;
    });
  };

  const filteredList = getFilteredComplaints();

  // Area-level Ward Aggregation Statistics
  const calculateWardStats = () => {
    const wardMap = {};
    complaints.forEach(c => {
      const w = c.ward || "Ward 12";
      if (!wardMap[w]) {
        wardMap[w] = { ward: w, total: 0, pending: 0, high_priority: 0, categories: {} };
      }
      wardMap[w].total += 1;
      const st = (c.status || 'SUBMITTED').toUpperCase();
      if (!['RESOLVED', 'CLOSED'].includes(st)) wardMap[w].pending += 1;
      const prio = (c.priority || 'MEDIUM').toUpperCase();
      if (prio === 'CRITICAL' || prio === 'HIGH') wardMap[w].high_priority += 1;
      const cat = c.category || 'General';
      wardMap[w].categories[cat] = (wardMap[w].categories[cat] || 0) + 1;
    });

    return Object.values(wardMap).map(w => {
      let topCat = "General";
      let maxCnt = 0;
      Object.entries(w.categories).forEach(([cat, cnt]) => {
        if (cnt > maxCnt) {
          maxCnt = cnt;
          topCat = cat;
        }
      });
      return { ...w, top_category: topCat };
    });
  };

  const wardStats = calculateWardStats();

  if (loading) return <LoadingSpinner label="Initializing Leaflet + OpenStreetMap Heatmap Engine..." />;

  return (
    <div className="main-content">
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#f43f5e', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            <Flame size={14} /> AI Spatial Problem Heatmap & Hotspot Detection
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>
            Geographic <span className="gradient-text">Complaint Heatmap</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Density gradient visualization of civic grievance concentrations & priority clusters
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {/* View Mode Switcher */}
          <div style={{ display: 'flex', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '8px', padding: '0.25rem' }}>
            <button
              onClick={() => setViewMode('heatmap')}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: '6px',
                border: 'none',
                background: viewMode === 'heatmap' ? '#f43f5e' : 'transparent',
                color: '#fff',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <Flame size={14} /> Heatmap Layer
            </button>
            <button
              onClick={() => setViewMode('markers')}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: '6px',
                border: 'none',
                background: viewMode === 'markers' ? '#3b82f6' : 'transparent',
                color: '#fff',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <MapPin size={14} /> Pin Markers
            </button>
          </div>

          <Button 
            variant="secondary" 
            onClick={loadComplaints}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <RefreshCw size={15} /> Refresh Data
          </Button>
        </div>
      </div>



      {/* Multi-Criteria Filters Bar */}
      <Card style={{ marginBottom: '1.5rem', padding: '1.1rem', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#60a5fa' }}>
            <Filter size={16} />
            <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Heatmap Filter Controls ({filteredList.length} Active Records)</h3>
          </div>

          {(dateFilter !== 'all' || categoryFilter !== 'all' || priorityFilter !== 'all' || departmentFilter !== 'all' || selectedWard !== 'all') && (
            <button
              onClick={() => {
                setDateFilter('all');
                setCategoryFilter('all');
                setPriorityFilter('all');
                setDepartmentFilter('all');
                setSelectedWard('all');
              }}
              style={{
                fontSize: '0.78rem',
                fontWeight: 700,
                color: '#fca5a5',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                padding: '0.25rem 0.6rem',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Clear All Filters
            </button>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.85rem' }}>
          
          {/* Date Filter */}
          <div>
            <label style={labelStyle}>Date Filter</label>
            <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} style={inputStyle}>
              <option value="all" style={optStyle}>All Time</option>
              <option value="7d" style={optStyle}>Last 7 Days</option>
              <option value="30d" style={optStyle}>Last 30 Days</option>
              <option value="90d" style={optStyle}>Last 90 Days</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label style={labelStyle}>Category</label>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={inputStyle}>
              <option value="all" style={optStyle}>All Categories</option>
              <option value="Roads" style={optStyle}>Roads</option>
              <option value="Water Supply" style={optStyle}>Water Supply</option>
              <option value="Sanitation" style={optStyle}>Sanitation</option>
              <option value="Electricity" style={optStyle}>Electricity</option>
              <option value="Sewage" style={optStyle}>Sewage</option>
              <option value="General" style={optStyle}>General</option>
            </select>
          </div>

          {/* Priority / Status Filter */}
          <div>
            <label style={labelStyle}>Priority / Status</label>
            <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} style={inputStyle}>
              <option value="all" style={optStyle}>All Priority & Status</option>
              <option value="CRITICAL" style={optStyle}>Critical Priority</option>
              <option value="HIGH" style={optStyle}>High Priority</option>
              <option value="MEDIUM" style={optStyle}>Medium Priority</option>
              <option value="LOW" style={optStyle}>Low Priority</option>
              <option value="Pending" style={optStyle}>Pending Status</option>
              <option value="Resolved" style={optStyle}>Resolved Status</option>
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <label style={labelStyle}>Department</label>
            <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)} style={inputStyle}>
              <option value="all" style={optStyle}>All Departments</option>
              <option value="Road Department" style={optStyle}>Road Department</option>
              <option value="Water Department" style={optStyle}>Water Department</option>
              <option value="Sanitation Department" style={optStyle}>Sanitation Department</option>
              <option value="Electrical Wing" style={optStyle}>Electrical Wing</option>
            </select>
          </div>

          {/* Ward Selector */}
          <div>
            <label style={labelStyle}>Ward Area</label>
            <select value={selectedWard} onChange={(e) => setSelectedWard(e.target.value)} style={inputStyle}>
              <option value="all" style={optStyle}>All Wards</option>
              {wardStats.map(w => (
                <option key={w.ward} value={w.ward} style={optStyle}>{w.ward} ({w.total} cases)</option>
              ))}
            </select>
          </div>

        </div>
      </Card>

      {/* Main Grid: Leaflet Map Container & Side Detail Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* Leaflet Map Mount Container */}
        <Card style={{ padding: '0.5rem', minHeight: '540px', position: 'relative', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
          
          {/* Interactive Heatmap Density Legend Overlay */}
          <div style={{
            position: 'absolute',
            bottom: '1.5rem',
            left: '1.5rem',
            zIndex: 1000,
            background: 'rgba(15, 23, 42, 0.92)',
            backdropFilter: 'blur(12px)',
            padding: '0.75rem 1rem',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            maxWidth: '300px'
          }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#fff', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Flame size={15} color="#f43f5e" /> {viewMode === 'heatmap' ? 'Heatmap Density Gradient Legend' : 'Map Pin Color Legend'}
            </div>

            {viewMode === 'heatmap' ? (
              <div>
                {/* Thermal Gradient Bar */}
                <div style={{
                  width: '100%',
                  height: '10px',
                  borderRadius: '5px',
                  background: 'linear-gradient(90deg, #3b82f6 0%, #22c55e 35%, #eab308 70%, #ef4444 100%)',
                  marginBottom: '0.4rem'
                }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 700 }}>
                  <span>Low Concentration</span>
                  <span>Moderate</span>
                  <span>High Hotspot</span>
                  <span style={{ color: '#f87171' }}>Critical Peak</span>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f43f5e' }} /> Critical / Escalated Pin
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#fbbf24' }} /> High Priority Pin
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#60a5fa' }} /> Medium Priority Pin
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#34d399' }} /> Resolved Pin
                </div>
              </div>
            )}
          </div>

          {/* Leaflet Map Ref Element */}
          <div 
            ref={mapRef} 
            style={{ 
              width: '100%', 
              height: '100%', 
              minHeight: '520px', 
              borderRadius: '10px', 
              zIndex: 1 
            }} 
          />
        </Card>

        {/* Side Panel: Selected Marker Details */}
        <div>
          {selectedComplaint ? (
            <Card style={{ padding: '1.25rem', border: '1px solid rgba(59, 130, 246, 0.4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div>
                  <span style={{ fontSize: '0.78rem', color: '#60a5fa', fontWeight: 800 }}>
                    ID: {selectedComplaint.id}
                  </span>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '0.2rem', color: '#fff', lineHeight: 1.3 }}>
                    {selectedComplaint.title}
                  </h3>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <Badge status={selectedComplaint.status} />
                <Badge status={selectedComplaint.priority} />
              </div>

              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                {selectedComplaint.description}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.85rem', background: 'rgba(10, 14, 26, 0.6)', padding: '0.85rem', borderRadius: '10px', marginBottom: '1.25rem' }}>
                <div><strong style={{ color: 'var(--text-muted)' }}>Category:</strong> <span style={{ color: '#fff', fontWeight: 600 }}>{selectedComplaint.category || 'General'}</span></div>
                <div><strong style={{ color: 'var(--text-muted)' }}>Department:</strong> <span style={{ color: '#fff', fontWeight: 600 }}>{selectedComplaint.department || 'Public Works'}</span></div>
                <div><strong style={{ color: 'var(--text-muted)' }}>Ward Zone:</strong> <span style={{ color: '#c084fc', fontWeight: 700 }}>{selectedComplaint.ward}</span></div>
                <div><strong style={{ color: 'var(--text-muted)' }}>Location:</strong> <span style={{ color: '#fff' }}>{selectedComplaint.address || 'Public locality'}</span></div>
                <div><strong style={{ color: 'var(--text-muted)' }}>Coordinates:</strong> <span style={{ color: '#38bdf8', fontSize: '0.8rem', fontFamily: 'monospace' }}>{selectedComplaint.latitude?.toFixed(4)}, {selectedComplaint.longitude?.toFixed(4)}</span></div>
                <div><strong style={{ color: 'var(--text-muted)' }}>Created Date:</strong> <span style={{ color: 'var(--text-secondary)' }}>{selectedComplaint.created_at ? new Date(selectedComplaint.created_at).toLocaleString() : 'Recent'}</span></div>
              </div>

              <Link to={`/complaint/${selectedComplaint.id}`} style={{ textDecoration: 'none' }}>
                <Button variant="primary" style={{ width: '100%', padding: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                  <Eye size={16} /> Open Full Grievance Detail
                </Button>
              </Link>
            </Card>
          ) : (
            <Card style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
              <MapPin size={36} color="var(--text-muted)" style={{ margin: '0 auto 0.5rem auto' }} />
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Inspect hotspot areas or select map pins for detailed preview.</p>
            </Card>
          )}
        </div>

      </div>

      {/* Area-Level Ward Hotspot Aggregation Overview */}
      <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Building2 size={22} color="#c084fc" /> Area-Level Problem Hotspot Aggregations ({wardStats.length} Wards)
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
        {wardStats.map((w) => (
          <Card 
            key={w.ward} 
            style={{ 
              border: selectedWard === w.ward ? '1.5px solid #c084fc' : '1px solid rgba(255, 255, 255, 0.1)',
              background: selectedWard === w.ward ? 'linear-gradient(135deg, rgba(192, 132, 252, 0.12) 0%, rgba(15, 23, 42, 0.8) 100%)' : 'rgba(15, 23, 42, 0.6)',
              cursor: 'pointer'
            }}
            onClick={() => setSelectedWard(w.ward)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#e9d5ff' }}>{w.ward}</h3>
              <span style={{ fontSize: '0.78rem', padding: '0.25rem 0.6rem', borderRadius: '12px', background: 'rgba(192, 132, 252, 0.2)', color: '#c084fc', fontWeight: 800 }}>
                {w.total} Total Cases
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', background: 'rgba(10, 14, 26, 0.5)', padding: '0.75rem', borderRadius: '8px', marginBottom: '0.75rem' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Pending</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fbbf24' }}>{w.pending}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>High-Priority</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f43f5e' }}>{w.high_priority}</span>
              </div>
            </div>

            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              <strong>Top Category:</strong> <span style={{ color: '#38bdf8', fontWeight: 700 }}>{w.top_category}</span>
            </div>
          </Card>
        ))}
      </div>

    </div>
  );
};

const labelStyle = { display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '0.2rem', fontWeight: 700, textTransform: 'uppercase' };
const inputStyle = {
  width: '100%',
  padding: '0.5rem 0.75rem',
  background: 'rgba(15, 23, 42, 0.8)',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '0.85rem'
};
const optStyle = { background: '#0f172a', color: '#fff' };
