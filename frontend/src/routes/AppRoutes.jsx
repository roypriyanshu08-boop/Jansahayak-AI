import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Landing } from '../pages/Landing';
import { Login } from '../pages/auth/Login';
import { Register } from '../pages/auth/Register';
import { CitizenDashboard } from '../pages/citizen/Dashboard';
import { CreateComplaint } from '../pages/citizen/CreateComplaint';
import { ComplaintDetail } from '../pages/citizen/ComplaintDetail';
import { MyComplaints } from '../pages/citizen/MyComplaints';
import { TrackComplaint } from '../pages/citizen/TrackComplaint';
import { AskJanSahayak } from '../pages/citizen/AskJanSahayak';
import { Profile } from '../pages/citizen/Profile';
import { NotificationsPage } from '../pages/citizen/NotificationsPage';

import { AdminDashboard } from '../pages/admin/AdminDashboard';
import { ManageOfficers } from '../pages/admin/ManageOfficers';
import { AnalyticsPage } from '../pages/admin/AnalyticsPage';
import { ManageComplaints } from '../pages/admin/ManageComplaints';
import { ComplaintMap } from '../pages/admin/ComplaintMap';
import { EscalationManagement } from '../pages/admin/EscalationManagement';
import { AIInsights } from '../pages/admin/AIInsights';

import { ProtectedRoute } from './ProtectedRoute';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Landing & Auth Routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Citizen Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute requiredRole="citizen">
            <CitizenDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/create-complaint"
        element={
          <ProtectedRoute requiredRole="citizen">
            <CreateComplaint />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-complaints"
        element={
          <ProtectedRoute requiredRole="citizen">
            <MyComplaints />
          </ProtectedRoute>
        }
      />
      <Route
        path="/track"
        element={
          <ProtectedRoute>
            <TrackComplaint />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ask-ai"
        element={
          <ProtectedRoute>
            <AskJanSahayak />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/complaint/:id"
        element={
          <ProtectedRoute>
            <ComplaintDetail />
          </ProtectedRoute>
        }
      />

      {/* Admin Protected Routes (RBAC: Admin Only) */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/complaints"
        element={
          <ProtectedRoute requiredRole="admin">
            <ManageComplaints />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/map"
        element={
          <ProtectedRoute requiredRole="admin">
            <ComplaintMap />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/analytics"
        element={
          <ProtectedRoute requiredRole="admin">
            <AnalyticsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/officers"
        element={
          <ProtectedRoute requiredRole="admin">
            <ManageOfficers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/escalations"
        element={
          <ProtectedRoute requiredRole="admin">
            <EscalationManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/ai-insights"
        element={
          <ProtectedRoute requiredRole="admin">
            <AIInsights />
          </ProtectedRoute>
        }
      />

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
