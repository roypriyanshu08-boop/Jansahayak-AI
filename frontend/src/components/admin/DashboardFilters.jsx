import React from 'react';
import { Search, Filter, Calendar, X, Tag, ShieldAlert, CheckSquare } from 'lucide-react';
import { Card, Button } from '../common/CommonComponents';

export const DashboardFilters = ({ filters, onFilterChange, onResetFilters }) => {
  return (
    <Card style={{ marginBottom: '1.5rem', padding: '1.25rem', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#60a5fa' }}>
          <Filter size={18} />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Search & Filter Analytics</h3>
        </div>

        {(filters.search || filters.category !== 'all' || filters.department !== 'all' || filters.priority !== 'all' || filters.status !== 'all' || filters.dateRange !== 'all') && (
          <button
            onClick={onResetFilters}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.3rem 0.7rem',
              borderRadius: '6px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#fca5a5',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <X size={14} /> Clear Active Filters
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        
        {/* Search Query Input */}
        <div>
          <label style={labelStyle}>Search Query</label>
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search title, ID, location..."
              value={filters.search || ''}
              onChange={(e) => onFilterChange('search', e.target.value)}
              style={{ ...inputStyle, paddingLeft: '2.2rem' }}
            />
          </div>
        </div>

        {/* Date Range Filter */}
        <div>
          <label style={labelStyle}>Date Range</label>
          <select
            value={filters.dateRange || 'all'}
            onChange={(e) => onFilterChange('dateRange', e.target.value)}
            style={inputStyle}
          >
            <option value="all" style={optionStyle}>All Time</option>
            <option value="7d" style={optionStyle}>Last 7 Days</option>
            <option value="30d" style={optionStyle}>Last 30 Days</option>
            <option value="90d" style={optionStyle}>Last 90 Days</option>
          </select>
        </div>

        {/* Category Filter */}
        <div>
          <label style={labelStyle}>Category</label>
          <select
            value={filters.category || 'all'}
            onChange={(e) => onFilterChange('category', e.target.value)}
            style={inputStyle}
          >
            <option value="all" style={optionStyle}>All Categories</option>
            <option value="Roads" style={optionStyle}>Roads</option>
            <option value="Water Supply" style={optionStyle}>Water Supply</option>
            <option value="Sanitation" style={optionStyle}>Sanitation</option>
            <option value="Electricity" style={optionStyle}>Electricity</option>
            <option value="Sewage" style={optionStyle}>Sewage</option>
            <option value="General" style={optionStyle}>General</option>
          </select>
        </div>

        {/* Department Filter */}
        <div>
          <label style={labelStyle}>Department</label>
          <select
            value={filters.department || 'all'}
            onChange={(e) => onFilterChange('department', e.target.value)}
            style={inputStyle}
          >
            <option value="all" style={optionStyle}>All Departments</option>
            <option value="Road Department" style={optionStyle}>Road Department</option>
            <option value="Water Department" style={optionStyle}>Water Department</option>
            <option value="Sanitation Department" style={optionStyle}>Sanitation Department</option>
            <option value="Electrical Wing" style={optionStyle}>Electrical Wing</option>
          </select>
        </div>

        {/* Priority Filter */}
        <div>
          <label style={labelStyle}>Priority</label>
          <select
            value={filters.priority || 'all'}
            onChange={(e) => onFilterChange('priority', e.target.value)}
            style={inputStyle}
          >
            <option value="all" style={optionStyle}>All Priorities</option>
            <option value="CRITICAL" style={optionStyle}>CRITICAL</option>
            <option value="HIGH" style={optionStyle}>HIGH</option>
            <option value="MEDIUM" style={optionStyle}>MEDIUM</option>
            <option value="LOW" style={optionStyle}>LOW</option>
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label style={labelStyle}>Status</label>
          <select
            value={filters.status || 'all'}
            onChange={(e) => onFilterChange('status', e.target.value)}
            style={inputStyle}
          >
            <option value="all" style={optionStyle}>All Statuses</option>
            <option value="SUBMITTED" style={optionStyle}>Submitted</option>
            <option value="AI_ANALYSED" style={optionStyle}>AI Analysed</option>
            <option value="ASSIGNED" style={optionStyle}>Assigned</option>
            <option value="IN_PROGRESS" style={optionStyle}>In Progress</option>
            <option value="UNDER_VERIFICATION" style={optionStyle}>Under Verification</option>
            <option value="RESOLVED" style={optionStyle}>Resolved</option>
            <option value="CLOSED" style={optionStyle}>Closed</option>
            <option value="ESCALATED" style={optionStyle}>Escalated</option>
          </select>
        </div>

      </div>
    </Card>
  );
};

const labelStyle = { display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: 700, textTransform: 'uppercase' };
const inputStyle = {
  width: '100%',
  padding: '0.55rem 0.8rem',
  background: 'rgba(15, 23, 42, 0.8)',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '0.85rem'
};
const optionStyle = { background: '#0f172a', color: '#fff' };
