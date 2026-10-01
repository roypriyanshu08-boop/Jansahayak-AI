import api from './api';
import { MOCK_COMPLAINTS } from './mockData';

const getStoredComplaints = () => {
  try {
    const data = localStorage.getItem('jansahayak_local_complaints');
    if (!data) {
      localStorage.setItem('jansahayak_local_complaints', JSON.stringify(MOCK_COMPLAINTS));
      return MOCK_COMPLAINTS;
    }
    return JSON.parse(data);
  } catch (e) {
    return MOCK_COMPLAINTS;
  }
};

const saveStoredComplaints = (complaints) => {
  try {
    localStorage.setItem('jansahayak_local_complaints', JSON.stringify(complaints));
  } catch (e) {
    console.warn('Failed to persist complaints to localStorage', e);
  }
};

let localComplaints = getStoredComplaints();

export const complaintService = {
  uploadPhoto: async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post('/complaints/upload-photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data.url;
    } catch (err) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
    }
  },

  submitComplaint: async (complaintData) => {
    // Get current user details from local storage for accurate attribution
    let currentUserId = null;
    let currentUserName = "JanSahayak Citizen";
    try {
      const storedUser = localStorage.getItem('jansahayak_user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        if (parsed.id) currentUserId = parsed.id;
        if (parsed.name) currentUserName = parsed.name;
      }
    } catch (e) {
      // ignore
    }

    if (!currentUserId) {
      currentUserId = `usr-anon-${Date.now()}`;
    }

    const complaintId = `GRV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const createdAt = new Date().toISOString();
    const photoUrl = complaintData.image_url || complaintData.photo_url || complaintData.photoUrl || "";
    const photoName = complaintData.photo_name || complaintData.photoName || (photoUrl ? "site_photo.jpg" : "");
    const photoType = complaintData.photo_type || complaintData.photoType || (photoUrl ? "image/jpeg" : "");
    const location = complaintData.address || complaintData.location || "Location Marker Specified";

    const fullPayload = {
      ...complaintData,
      complaintId,
      id: complaintId,
      userId: currentUserId,
      user_id: currentUserId,
      user_name: currentUserName,
      category: complaintData.category || "General Civic",
      department: complaintData.department || "Public Works Department",
      description: complaintData.description || "",
      location: location,
      address: location,
      latitude: complaintData.latitude ? parseFloat(complaintData.latitude) : null,
      longitude: complaintData.longitude ? parseFloat(complaintData.longitude) : null,
      accuracy: complaintData.accuracy ? parseFloat(complaintData.accuracy) : null,
      photoUrl: photoUrl,
      image_url: photoUrl,
      photoName: photoName,
      photo_name: photoName,
      photoType: photoType,
      photo_type: photoType,
      createdAt: createdAt,
      created_at: createdAt,
      status: complaintData.status || "SUBMITTED"
    };

    try {
      const response = await api.post('/complaints/', fullPayload);
      if (response.data) {
        localComplaints.unshift(response.data);
        saveStoredComplaints(localComplaints);
        return response.data;
      }
    } catch (err) {
      console.warn('Backend offline, using mock persistence layer for complaint submission');
    }

    const text = `${complaintData.title || ''} ${complaintData.description || ''}`.toLowerCase();
    const isRoad = text.includes('gaddha') || text.includes('road') || text.includes('pothole') || text.includes('sadak');
    const isSchool = text.includes('school') || text.includes('bachch') || text.includes('baccho') || text.includes('kid');
    const isAccident = text.includes('accident') || text.includes('risk') || text.includes('danger') || text.includes('khatra');

    let ai = {
      category: isRoad ? "Road" : (complaintData.category || "General Civic"),
      subcategory: isRoad ? "Pothole" : (complaintData.subcategory || "Civic Issue"),
      department: isRoad ? "Municipal/Road Department" : (complaintData.department || "Public Works Department"),
      severity: (isSchool && isAccident) || isRoad ? "High" : "Medium",
      priority: (isSchool && isAccident) ? "Critical" : (isRoad ? "High" : "MEDIUM"),
      summary: (isSchool && isRoad) ? "Large pothole near school creating safety risk" : (complaintData.title || "Civic complaint reported"),
      recommended_action: (isSchool && isRoad) ? "Immediate inspection and temporary safety measures" : "Dispatch field officer for on-site assessment.",
      impact_score: (isSchool && isAccident) ? 88.0 : 72.0,
      duplicate_probability: 10.0,
      estimated_resolution_time: "24-48 Hours",
      root_cause: isRoad ? "Asphalt degradation creating hazardous road hole near high-pedestrian area" : "Initial inspection pending by area municipal officer."
    };

    const newComplaint = {
      ...fullPayload,
      subcategory: complaintData.subcategory || ai.subcategory,
      priority: complaintData.priority || ai.priority,
      audio_url: complaintData.audio_url || "",
      detected_language: complaintData.detected_language || "Hindi",
      impact_score: ai.impact_score,
      updated_at: createdAt,
      location_timestamp: complaintData.location_timestamp || createdAt,
      ai_analysis: ai
    };

    localComplaints.unshift(newComplaint);
    saveStoredComplaints(localComplaints);
    window.dispatchEvent(new Event('jansahayak_complaint_updated'));
    return newComplaint;
  },

  getMyComplaints: async () => {
    let currentUserId = null;
    try {
      const storedUser = localStorage.getItem('jansahayak_user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        if (parsed.id) currentUserId = parsed.id;
      }
    } catch (e) {
      // ignore
    }

    try {
      const response = await api.get('/complaints/my');
      if (Array.isArray(response.data)) {
        return response.data;
      }
    } catch (err) {
      // ignore
    }

    if (!currentUserId) return [];

    localComplaints = getStoredComplaints();
    return localComplaints.filter(c => (c.userId === currentUserId || c.user_id === currentUserId));
  },

  getAllComplaints: async (params = {}) => {
    try {
      const response = await api.get('/complaints/', { params });
      if (Array.isArray(response.data) && response.data.length > 0) {
        return response.data;
      }
    } catch (err) {
      // ignore
    }
    localComplaints = getStoredComplaints();
    return localComplaints;
  },

  getComplaintById: async (id) => {
    let currentUserId = null;
    let currentUserRole = null;
    try {
      const storedUser = localStorage.getItem('jansahayak_user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        if (parsed.id) currentUserId = parsed.id;
        if (parsed.role) currentUserRole = parsed.role;
      }
    } catch (e) {
      // ignore
    }

    try {
      const response = await api.get(`/complaints/${id}`);
      return response.data;
    } catch (err) {
      localComplaints = getStoredComplaints();
      const found = localComplaints.find(c => c.id === id || c.complaintId === id || (c.id && c.id.includes(id)));
      if (found) {
        const ownerId = found.userId || found.user_id;
        if (currentUserRole !== 'admin' && currentUserId && ownerId && ownerId !== currentUserId) {
          throw new Error('Access forbidden: You can only view your own complaints.');
        }
        return found;
      }
      throw new Error('Complaint not found');
    }
  },

  updateStatus: async (id, status, comment) => {
    try {
      const response = await api.patch(`/complaints/${id}/status`, null, {
        params: { new_status: status, comment },
      });
      if (response.data) {
        return response.data;
      }
    } catch (err) {
      // ignore
    }
    localComplaints = getStoredComplaints();
    const target = localComplaints.find(c => c.id === id || c.complaintId === id);
    if (target) {
      target.status = status;
      target.updated_at = new Date().toISOString();
      saveStoredComplaints(localComplaints);
      window.dispatchEvent(new Event('jansahayak_complaint_updated'));
    }
    return target || localComplaints[0];
  },

  getComplaintTimeline: async (id) => {
    try {
      const response = await api.get(`/complaints/${id}/timeline`);
      if (response.data && response.data.length > 0) return response.data;
    } catch (err) {
      // ignore
    }

    localComplaints = getStoredComplaints();
    const found = localComplaints.find(c => c.id === id || c.complaintId === id) || localComplaints[0];
    const baseDate = new Date(found?.created_at || found?.createdAt || Date.now() - 86400000);
    
    const formatTime = (d) => {
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const day = d.getDate();
      const month = monthNames[d.getMonth()];
      const hrs = String(d.getHours()).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');
      return `${day} ${month} ${hrs}:${mins}`;
    };

    const date1 = new Date(baseDate.getTime());
    const date2 = new Date(baseDate.getTime() + 1 * 60000);
    const date3 = new Date(baseDate.getTime() + 2 * 60000);
    const date4 = new Date(baseDate.getTime() + 14 * 3600000 + 30 * 60000);

    const timeline = [
      {
        id: 't1',
        status: 'SUBMITTED',
        action_title: 'Complaint Submitted',
        comment: 'Complaint registered in JanSahayak AI system',
        changed_by: 'Citizen',
        formatted_datetime: formatTime(date1)
      },
      {
        id: 't2',
        status: 'AI_ANALYSED',
        action_title: 'AI Analysis Completed',
        comment: 'AI Vision & NLP evidence processing completed',
        changed_by: 'AI_ENGINE',
        formatted_datetime: formatTime(date2)
      },
      {
        id: 't3',
        status: 'ASSIGNED',
        action_title: `Assigned to ${found?.department || 'Road Department'}`,
        comment: 'Smart Officer Assignment allocated field officer',
        changed_by: 'Admin',
        formatted_datetime: formatTime(date3)
      },
      {
        id: 't4',
        status: 'IN_PROGRESS',
        action_title: 'Officer Started Work',
        comment: 'Field officer dispatched and started on-site resolution',
        changed_by: 'Officer',
        formatted_datetime: formatTime(date4)
      }
    ];

    if (found?.status === 'UNDER_VERIFICATION' || found?.status === 'RESOLVED' || found?.status === 'CLOSED') {
      const date5 = new Date(baseDate.getTime() + 24 * 3600000);
      timeline.push({
        id: 't5',
        status: 'UNDER_VERIFICATION',
        action_title: 'Submitted for Verification',
        comment: 'Work completed, submitted for citizen/admin review',
        changed_by: 'Officer',
        formatted_datetime: formatTime(date5)
      });
    }

    if (found?.status === 'RESOLVED' || found?.status === 'CLOSED') {
      const date6 = new Date(baseDate.getTime() + 28 * 3600000);
      timeline.push({
        id: 't6',
        status: 'RESOLVED',
        action_title: 'Complaint Resolved',
        comment: 'Site issue verified and resolved successfully',
        changed_by: 'Admin',
        formatted_datetime: formatTime(date6)
      });
    }

    if (found?.status === 'ESCALATED') {
      const dateEsc = new Date(baseDate.getTime() + 30 * 3600000);
      timeline.push({
        id: 't7',
        status: 'ESCALATED',
        action_title: 'Escalation Triggered',
        comment: 'SLA deadline exceeded. Auto-escalated to Level 1 Officer / Level 2 Supervisor.',
        changed_by: 'SLA_ENGINE',
        formatted_datetime: formatTime(dateEsc)
      });
    }

    return timeline;
  }
};
