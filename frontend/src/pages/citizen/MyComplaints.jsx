import React, { useEffect, useState } from 'react';
import { complaintService } from '../../services/complaintService';
import { ComplaintCard } from '../../components/citizen/ComplaintCard';
import { LoadingSpinner, SearchFilterBar, EmptyState, Button } from '../../components/common/CommonComponents';
import { PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export const MyComplaints = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const data = await complaintService.getMyComplaints();
        setComplaints(data || []);
      } catch (err) {
        console.error('Failed to load my complaints:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchComplaints();
  }, []);

  const userComplaints = (complaints || []).filter(c => {
    if (!user?.id) return false;
    const ownerId = c.userId || c.user_id;
    return ownerId === user.id;
  });

  const filtered = userComplaints.filter(c => {
    const matchesSearch = (c.title || '').toLowerCase().includes(search.toLowerCase()) ||
                          (c.id || '').toLowerCase().includes(search.toLowerCase()) ||
                          (c.address && c.address.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = filterCategory === 'ALL' || c.category === filterCategory;
    const matchesStatus = filterStatus === 'ALL' || c.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="main-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>My Grievance Directory</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
            View, search, and track all complaints filed under your account
          </p>
        </div>
        <Link to="/create-complaint" style={{ textDecoration: 'none' }}>
          <Button><PlusCircle size={18} /> File Grievance</Button>
        </Link>
      </div>

      <SearchFilterBar
        search={search}
        setSearch={setSearch}
        filterCategory={filterCategory}
        setFilterCategory={setFilterCategory}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
      />

      {loading ? (
        <LoadingSpinner label="Fetching your filed grievances..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No Grievances Found"
          message="No complaints match your selected search keyword or filter options."
          action={
            <Link to="/create-complaint" style={{ textDecoration: 'none' }}>
              <Button><PlusCircle size={18} /> Submit New Grievance</Button>
            </Link>
          }
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {filtered.map(c => (
            <ComplaintCard key={c.id} complaint={c} />
          ))}
        </div>
      )}
    </div>
  );
};
