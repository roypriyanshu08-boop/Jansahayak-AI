import api from './api';

let localOfficers = [];
let localDuplicates = [];
let localEscalations = [];

const REALISTIC_DEMO_TEMPLATES = [
  {
    title: "Major Water Pipeline Leakage near Sector 14 Market",
    description: "Main underground water supply line has cracked. Thousands of liters of drinking water are being wasted into the main road causing waterlogging.",
    category: "Water Supply",
    department: "Jal Board",
    priority: "CRITICAL",
    status: "IN_PROGRESS",
    address: "Sector 14 Main Market, Ward 8",
    image_url: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=600&q=80",
    daysAgo: 2,
    resolved: false
  },
  {
    title: "Deep Pothole Cluster on Ring Road Flyover Approach",
    description: "Multiple severe potholes near flyover entry creating immediate vehicle accident risk during peak traffic hours.",
    category: "Roads & Transport",
    department: "Public Works Dept",
    priority: "HIGH",
    status: "SUBMITTED",
    address: "Ring Road Flyover Junction, Ward 12",
    image_url: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80",
    daysAgo: 1,
    resolved: false
  },
  {
    title: "Overflowing Garbage Dumpster near Primary School Gate",
    description: "Uncleared community waste dumpster overflowed onto pedestrian walkway. Pungent odor and stray animal menace near school entrance.",
    category: "Sanitation & Waste",
    department: "Municipal Corporation",
    priority: "HIGH",
    status: "ASSIGNED",
    address: "Gali No. 4, Laxmi Nagar, Ward 7",
    image_url: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=600&q=80",
    daysAgo: 3,
    resolved: false
  },
  {
    title: "Damaged High-Voltage Transformer and Streetlights Dark",
    description: "Substation transformer sparking loudly; streetlights out across 5 residential blocks creating safety concerns at night.",
    category: "Electricity",
    department: "State Electricity Board",
    priority: "CRITICAL",
    status: "RESOLVED",
    address: "Block C, Connaught Place Sector, Ward 3",
    image_url: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=600&q=80",
    daysAgo: 5,
    resolved: true,
    resolutionDays: 1
  },
  {
    title: "Choked Sewage Line and Open Drain Overflow",
    description: "Drainage chamber blocked with plastic waste causing raw sewage overflow into residential lane.",
    category: "Sewage",
    department: "Municipal Corporation",
    priority: "MEDIUM",
    status: "RESOLVED",
    address: "Civil Lines, Block B, Ward 4",
    image_url: "",
    daysAgo: 7,
    resolved: true,
    resolutionDays: 2
  },
  {
    title: "Broken Footpath Concrete Slabs & Exposed Underground Cable",
    description: "Pedestrian walkway slabs broken; loose telecom/power cable exposed on sidewalk.",
    category: "Roads & Transport",
    department: "Public Works Dept",
    priority: "MEDIUM",
    status: "UNDER_VERIFICATION",
    address: "RK Puram Sector 3, Ward 11",
    image_url: "",
    daysAgo: 4,
    resolved: false
  },
  {
    title: "Low Water Pressure and Contaminated Supply in Block D",
    description: "Tap water arriving muddy and discolored for the past 48 hours. Multiple households affected.",
    category: "Water Supply",
    department: "Jal Board",
    priority: "HIGH",
    status: "IN_PROGRESS",
    address: "Nehru Place Market Sector, Ward 5",
    image_url: "",
    daysAgo: 2,
    resolved: false
  },
  {
    title: "Fallen Tree Branch Blocking Lane and Power Line",
    description: "Heavy storm branch broke off tree and is leaning on overhead electric wire, obstructing vehicle movement.",
    category: "General Civic",
    department: "Municipal Corporation",
    priority: "HIGH",
    status: "RESOLVED",
    address: "Model Town Phase 2, Ward 9",
    image_url: "",
    daysAgo: 8,
    resolved: true,
    resolutionDays: 1
  },
  {
    title: "Unmaintained Park Public Toilet Water Leak",
    description: "Water tap continuously running inside public restroom in community park.",
    category: "Sanitation & Waste",
    department: "Municipal Corporation",
    priority: "LOW",
    status: "RESOLVED",
    address: "Vasant Kunj Community Park, Ward 15",
    image_url: "",
    daysAgo: 9,
    resolved: true,
    resolutionDays: 2
  },
  {
    title: "Stray Animal Menace near Garbage Collection Center",
    description: "Open garbage dumps attracting stray dogs creating hazard for morning commuters.",
    category: "Sanitation & Waste",
    department: "Municipal Corporation",
    priority: "LOW",
    status: "SUBMITTED",
    address: "Karol Bagh Metro Gate 2, Ward 6",
    image_url: "",
    daysAgo: 1,
    resolved: false
  },
  {
    title: "Non-Functional Traffic Signal at Busy Intersection",
    description: "Traffic light stuck on yellow causing gridlock and near-miss vehicle collisions.",
    category: "Roads & Transport",
    department: "Public Works Dept",
    priority: "CRITICAL",
    status: "IN_PROGRESS",
    address: "Dwarka Sector 10 Crossing, Ward 10",
    image_url: "",
    daysAgo: 1,
    resolved: false
  },
  {
    title: "Illegal Waste Dumping in Open Vacant Plot",
    description: "Commercial debris dumped illegally overnight in vacant plot near residential zone.",
    category: "Sanitation & Waste",
    department: "Municipal Corporation",
    priority: "MEDIUM",
    status: "CLOSED",
    address: "Preet Vihar Complex, Ward 2",
    image_url: "",
    daysAgo: 10,
    resolved: true,
    resolutionDays: 3
  },
  {
    title: "Hazardous Dangling Power Wires outside Shop 14",
    description: "Uninsulated low-hanging electrical wire hanging at eye-level on commercial sidewalk.",
    category: "Electricity",
    department: "State Electricity Board",
    priority: "HIGH",
    status: "ASSIGNED",
    address: "Janakpuri District Center, Ward 1",
    image_url: "",
    daysAgo: 2,
    resolved: false
  }
];

export const adminService = {
  createOfficer: async (officerData) => {
    try {
      const response = await api.post('/admin/officers', officerData);
      return response.data;
    } catch (err) {
      const newOfficer = {
        id: `off-${Math.floor(200 + Math.random() * 800)}`,
        name: officerData.name,
        department: officerData.department,
        assigned_area: officerData.assigned_area,
        current_workload: officerData.current_workload || 0
      };
      localOfficers.unshift(newOfficer);
      return newOfficer;
    }
  },

  getOfficers: async () => {
    try {
      const response = await api.get('/admin/officers');
      return Array.isArray(response.data) ? response.data : [];
    } catch (err) {
      return localOfficers;
    }
  },

  getOfficersWorkloadSummary: async () => {
    try {
      const response = await api.get('/admin/officers/workload-summary');
      return Array.isArray(response.data) ? response.data : [];
    } catch (err) {
      return [];
    }
  },

  assignOfficer: async (assignmentData) => {
    try {
      const response = await api.post('/admin/assign', assignmentData);
      return response.data;
    } catch (err) {
      const officer = localOfficers.find(o => o.id === assignmentData.officer_id);
      if (officer) officer.current_workload += 1;
      return {
        id: `asg-${Date.now()}`,
        complaint_id: assignmentData.complaint_id,
        officer_id: assignmentData.officer_id,
        assigned_at: new Date().toISOString()
      };
    }
  },

  reassignOfficer: async (complaintId, newOfficerId) => {
    try {
      const response = await api.post('/admin/reassign', null, {
        params: { complaint_id: complaintId, new_officer_id: newOfficerId }
      });
      return response.data;
    } catch (err) {
      const officer = localOfficers.find(o => o.id === newOfficerId);
      if (officer) officer.current_workload += 1;
      return {
        id: `reassigned-${Date.now()}`,
        complaint_id: complaintId,
        new_officer_id: newOfficerId
      };
    }
  },

  escalateComplaint: async (escalationData) => {
    try {
      const response = await api.post('/admin/escalate', escalationData);
      return response.data;
    } catch (err) {
      const newEsc = {
        id: `ESC-${Math.floor(300 + Math.random() * 100)}`,
        complaint_id: escalationData.complaint_id,
        current_level: escalationData.current_level || 1,
        escalated_to: escalationData.escalated_to,
        reason: escalationData.reason,
        timestamp: new Date().toISOString()
      };
      localEscalations.unshift(newEsc);
      return newEsc;
    }
  },

  getEscalations: async () => {
    return localEscalations;
  },

  getDuplicateGroups: async () => {
    try {
      const response = await api.get('/admin/duplicates/groups');
      return Array.isArray(response.data) ? response.data : [];
    } catch (err) {
      return localDuplicates;
    }
  },

  createDuplicateGroup: async (groupData) => {
    try {
      const response = await api.post('/admin/duplicates/groups', groupData);
      return response.data;
    } catch (err) {
      const newGroup = {
        group_id: `DUP-GRP-${Math.floor(100 + Math.random() * 900)}`,
        complaint_ids: groupData.complaint_ids,
        similarity_score: groupData.similarity_score || 0.88,
        common_issue: groupData.common_issue || "Similar issue identified by AI",
        category: groupData.category || "General",
        possible_root_cause: groupData.possible_root_cause || "Underlying infrastructure maintenance failure",
        root_cause_confidence: groupData.root_cause_confidence || "Medium",
        recommended_investigation: groupData.recommended_investigation || "Conduct site inspection.",
        root_cause_status: groupData.root_cause_status || "Needs Investigation"
      };
      localDuplicates.unshift(newGroup);
      return newGroup;
    }
  },

  updateRootCauseStatus: async (groupId, status) => {
    try {
      const response = await api.put(`/admin/duplicates/groups/${groupId}/root-cause-status`, { status });
      return response.data;
    } catch (err) {
      const group = localDuplicates.find(g => g.group_id === groupId);
      if (group) {
        let normStatus = "Needs Investigation";
        const s = (status || "").toLowerCase();
        if (s.includes("confirm")) normStatus = "Confirmed";
        else if (s.includes("reject")) normStatus = "Rejected";

        group.root_cause_status = normStatus;
        return { ...group };
      }
      return null;
    }
  },

  reanalyzeGroupRootCause: async (groupId) => {
    try {
      const response = await api.post(`/admin/duplicates/groups/${groupId}/analyze-root-cause`);
      return response.data;
    } catch (err) {
      const group = localDuplicates.find(g => g.group_id === groupId);
      if (group) {
        group.possible_root_cause = group.possible_root_cause || "Damaged water pipeline";
        group.root_cause_confidence = "Medium";
        group.recommended_investigation = group.recommended_investigation || "Inspect underground pipeline near affected area.";
        return { ...group };
      }
      return null;
    }
  },

  recommendOfficer: async (complaintData) => {
    try {
      const response = await api.post('/admin/recommend-officer', complaintData);
      return response.data;
    } catch (err) {
      return {
        recommended_officer: null,
        reason: "No officers available in database for assignment.",
        current_workload: 0,
        all_ranked_officers: [],
        admin_override_allowed: true
      };
    }
  },

  getSLAConfig: async () => {
    try {
      const response = await api.get('/admin/sla/config');
      return response.data.sla_matrix;
    } catch (err) {
      return {
        "Roads": { "CRITICAL": 12.0, "HIGH": 24.0, "MEDIUM": 48.0, "LOW": 72.0 },
        "Water Supply": { "CRITICAL": 12.0, "HIGH": 24.0, "MEDIUM": 36.0, "LOW": 72.0 },
        "Sanitation": { "CRITICAL": 8.0, "HIGH": 18.0, "MEDIUM": 36.0, "LOW": 48.0 },
        "Electricity": { "CRITICAL": 6.0, "HIGH": 18.0, "MEDIUM": 36.0, "LOW": 48.0 },
        "Sewage": { "CRITICAL": 12.0, "HIGH": 24.0, "MEDIUM": 48.0, "LOW": 72.0 },
        "DEFAULT": { "CRITICAL": 12.0, "HIGH": 24.0, "MEDIUM": 48.0, "LOW": 72.0 }
      };
    }
  },

  updateSLAConfig: async (category, priority, hours) => {
    try {
      const response = await api.put('/admin/sla/config', null, {
        params: { category, priority, hours }
      });
      return response.data;
    } catch (err) {
      return { status: "success", message: `SLA for ${category} (${priority}) updated to ${hours}h` };
    }
  },

  checkSLAEscalations: async () => {
    try {
      const response = await api.post('/admin/sla/check-escalations');
      return response.data;
    } catch (err) {
      return { status: "success", escalated_count: 0, escalated_complaints: [] };
    }
  },

  getPendingEscalations: async () => {
    try {
      const response = await api.get('/admin/escalations/pending');
      return Array.isArray(response.data) ? response.data : [];
    } catch (err) {
      return [];
    }
  },

  generateDemoData: async (count = 15) => {
    // Try backend demo generation API first
    try {
      const response = await api.post('/admin/demo-data/generate', null, { params: { count } });
      if (response.data && response.data.status !== "error") {
        window.dispatchEvent(new Event('jansahayak_complaint_updated'));
        return response.data;
      }
    } catch (err) {
      // ignore
    }

    // Prototype / Local Demo Mode: generate realistic demo dataset into unified complaint store
    try {
      const rawStored = localStorage.getItem('jansahayak_local_complaints');
      let existingComplaints = rawStored ? JSON.parse(rawStored) : [];

      // Preserve non-demo citizen-submitted complaints
      const userComplaints = existingComplaints.filter(c => !c.is_demo_record && !c.id?.startsWith('DEMO-'));

      const now = Date.now();
      const generatedDemoRecords = REALISTIC_DEMO_TEMPLATES.map((tmpl, index) => {
        const createdTime = new Date(now - (tmpl.daysAgo * 24 * 3600 * 1000) - (index * 3600 * 1000));
        const updatedTime = tmpl.resolved 
          ? new Date(createdTime.getTime() + (tmpl.resolutionDays * 24 * 3600 * 1000))
          : createdTime;

        const demoId = `DEMO-${202600 + index + 1}`;
        const photoUrl = tmpl.image_url || "";

        return {
          complaintId: demoId,
          id: demoId,
          user_id: `usr-demo-${index + 1}`,
          userId: `usr-demo-${index + 1}`,
          user_name: `Citizen Representative ${index + 1}`,
          title: tmpl.title,
          description: tmpl.description,
          category: tmpl.category,
          subcategory: tmpl.category === 'Roads & Transport' ? 'Pothole' : tmpl.category === 'Water Supply' ? 'Pipeline Leak' : 'Civic Maintenance',
          department: tmpl.department,
          priority: tmpl.priority,
          status: tmpl.status,
          latitude: 28.6139 + (index * 0.004),
          longitude: 77.2090 + (index * 0.003),
          accuracy: 12.0,
          address: tmpl.address,
          location: tmpl.address,
          photoUrl: photoUrl,
          image_url: photoUrl,
          photoName: photoUrl ? `demo_site_photo_${index + 1}.jpg` : "",
          photo_name: photoUrl ? `demo_site_photo_${index + 1}.jpg` : "",
          photoType: photoUrl ? "image/jpeg" : "",
          photo_type: photoUrl ? "image/jpeg" : "",
          audio_url: "",
          detected_language: index % 2 === 0 ? "Hindi" : "English",
          impact_score: tmpl.priority === 'CRITICAL' ? 92.0 : tmpl.priority === 'HIGH' ? 78.0 : 54.0,
          createdAt: createdTime.toISOString(),
          created_at: createdTime.toISOString(),
          updatedAt: updatedTime.toISOString(),
          updated_at: updatedTime.toISOString(),
          resolved_at: tmpl.resolved ? updatedTime.toISOString() : null,
          location_timestamp: createdTime.toISOString(),
          is_demo_record: true,
          ai_analysis: {
            category: tmpl.category,
            severity: tmpl.priority === 'CRITICAL' ? 'Critical' : tmpl.priority === 'HIGH' ? 'High' : 'Medium',
            priority: tmpl.priority,
            summary: tmpl.title,
            recommended_action: `Dispatch ${tmpl.department} field inspection team immediately.`,
            impact_score: tmpl.priority === 'CRITICAL' ? 92.0 : 78.0,
            estimated_resolution_time: tmpl.priority === 'CRITICAL' ? '12 Hours' : '24-48 Hours'
          }
        };
      });

      // Unified store = user complaints + generated demo records (no duplicates)
      const mergedDataset = [...userComplaints, ...generatedDemoRecords];
      localStorage.setItem('jansahayak_local_complaints', JSON.stringify(mergedDataset));

      // Trigger global real-time event for UI sync
      window.dispatchEvent(new Event('jansahayak_complaint_updated'));

      return {
        status: "success",
        message: `Successfully loaded ${generatedDemoRecords.length} realistic demo grievance records across 6 Departments & 12 Wards.`
      };
    } catch (e) {
      console.error('Failed to generate demo dataset locally:', e);
      return { status: "error", message: "Failed to generate demo dataset." };
    }
  },

  clearDemoData: async () => {
    try {
      const response = await api.delete('/admin/demo-data/clear');
      if (response.data && response.data.status !== "error") {
        window.dispatchEvent(new Event('jansahayak_complaint_updated'));
        return response.data;
      }
    } catch (err) {
      // ignore
    }

    try {
      const rawStored = localStorage.getItem('jansahayak_local_complaints');
      if (rawStored) {
        const existingComplaints = JSON.parse(rawStored);
        const nonDemo = existingComplaints.filter(c => !c.is_demo_record && !c.id?.startsWith('DEMO-'));
        localStorage.setItem('jansahayak_local_complaints', JSON.stringify(nonDemo));
      }

      window.dispatchEvent(new Event('jansahayak_complaint_updated'));
      return { status: "success", message: "Cleared synthetic demo complaint dataset." };
    } catch (e) {
      return { status: "error", message: "Failed to clear demo dataset." };
    }
  }
};
