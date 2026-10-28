import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import Navbar from './components/Navbar';
import DirectorSidebar from './components/DirectorSidebar';
import Login from './pages/Login';
import Events from './pages/Events';
import Songs from './pages/Songs';
import Members from './pages/Members';
import Announcements from './pages/Announcements';
import Director from './pages/Director';
import Exco from './pages/Exco';
import MemberDashboard from './pages/MemberDashboard';
import Reports from './pages/Reports';
import ServicePlanner from './pages/ServicePlanner';
import Settings from './pages/Settings';

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex h-screen items-center justify-center text-gray-500 font-medium">Loading Choir App...</div>;
  }

  if (!user) {
    return (
      <Routes>
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }

  // Both directors and leaders (excos) get the desktop sidebar layout
  const hasSidebar = user.role === 'director' || user.role === 'leader';

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <DirectorSidebar />

      <div className={`flex-1 flex flex-col min-h-screen ${hasSidebar ? 'md:ml-64' : ''}`}>
        <Navbar />
        
        <main className="flex-1 p-4 md:p-6">
          <Routes>
            <Route path="/events" element={<Events />} />
            <Route path="/songs" element={<Songs />} />
            <Route path="/announcements" element={<Announcements />} />
            
            {/* Added Settings here so all roles can manage their profiles */}
            <Route path="/settings" element={<Settings />} />
            
            {/* DIRECTOR ROUTES */}
            {user.role === 'director' && (
              <>
                <Route path="/" element={<Navigate to="/director" replace />} />
                <Route path="/director" element={<Director />} />
                <Route path="/members" element={<Members />} />
                <Route path="/planner" element={<ServicePlanner/>} />                
                <Route path="/reports" element={<Reports />} />                
                <Route path="/member-dashboard" element={<MemberDashboard />} />
              </>
            )}

            {/* EXCO ROUTES */}
            {user.role === 'leader' && (
              <>
                <Route path="/" element={<Navigate to="/exco" replace />} />
                <Route path="/exco" element={<Exco />} />
                <Route path="/members" element={<Members />} />
              </>
            )}

            {/* MEMBER ROUTES */}
            {user.role === 'member' && (
              <>
                <Route path="/" element={<Navigate to="/member-dashboard" replace />} />
                <Route path="/member-dashboard" element={<MemberDashboard />} />
              </>
            )}

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}