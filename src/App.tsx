import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import Layout from '@/components/Layout';
import AdminLayout from '@/components/AdminLayout';
import { useAuthStore } from '@/store/auth';
import Home from '@/pages/Home';
import Rules from '@/pages/Rules';
import Register from '@/pages/Register';
import HexCard from '@/pages/HexCard';
import HallOfFame from '@/pages/HallOfFame';
import Schedule from '@/pages/Schedule';
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import Profile from '@/pages/Profile';
import ChangePassword from '@/pages/ChangePassword';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import UserAgreement from '@/pages/UserAgreement';
import Report from '@/pages/Report';
import InfoSecurity from '@/pages/InfoSecurity';
import AdminDashboard from '@/pages/admin/Dashboard';
import AdminSeasons from '@/pages/admin/Seasons';
import AdminRegistrations from '@/pages/admin/Registrations';
import AdminTeams from '@/pages/admin/Teams';
import AdminRunes from '@/pages/admin/Runes';
import AdminMatches from '@/pages/admin/Matches';
import AdminContent from '@/pages/admin/Content';
import AdminUsers from '@/pages/admin/Users';
import AdminReports from '@/pages/admin/Reports';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, mustChangePassword, loading } = useAuthStore();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-hex-purple border-t-transparent rounded-full" /></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (mustChangePassword) return <Navigate to="/change-password" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAdmin, mustChangePassword, loading } = useAuthStore();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-hex-purple border-t-transparent rounded-full" /></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (mustChangePassword) return <Navigate to="/change-password" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  const { fetchMe, token } = useAuthStore();

  useEffect(() => {
    if (token) fetchMe();
  }, [token, fetchMe]);

  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/rules" element={<Rules />} />
          <Route path="/register" element={<Register />} />
          <Route path="/hexcard" element={<HexCard />} />
          <Route path="/hall-of-fame" element={<HallOfFame />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/agreement" element={<UserAgreement />} />
          <Route path="/report" element={<Report />} />
          <Route path="/info-security" element={<InfoSecurity />} />
        </Route>

        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="seasons" element={<AdminSeasons />} />
          <Route path="registrations" element={<AdminRegistrations />} />
          <Route path="teams" element={<AdminTeams />} />
          <Route path="runes" element={<AdminRunes />} />
          <Route path="matches" element={<AdminMatches />} />
          <Route path="content" element={<AdminContent />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="reports" element={<AdminReports />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
