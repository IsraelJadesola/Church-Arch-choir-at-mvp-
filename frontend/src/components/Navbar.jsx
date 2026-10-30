import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  const hasSidebar = user.role === 'director' || user.role === 'leader';

  return (
    <nav className={`bg-blue-800 text-white shadow-md ${hasSidebar ? 'md:hidden' : ''}`}>
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="font-bold text-xl tracking-tight">
            Choir App <span className="text-blue-300 text-sm font-normal ml-2 capitalize">({user.role})</span>
          </div>
          
          <div className="hidden md:flex space-x-6">
            {user.role === 'member' && (
              <>
                <Link to="/member-dashboard" className="hover:text-blue-200">My Home</Link>
                <Link to="/events" className="hover:text-blue-200">My Schedule</Link>
                <Link to="/songs" className="hover:text-blue-200">My Tracks</Link>
                <Link to="/announcements" className="hover:text-blue-200">Announcements</Link>
                <Link to="/settings" className="hover:text-blue-200">Settings</Link>
              </>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-sm text-blue-200 hidden sm:block">
              {user.name} ({user.voicePart})
            </span>
            <button 
              onClick={handleLogout} 
              className="bg-blue-700 px-3 py-1.5 rounded hover:bg-blue-600 text-sm font-medium transition-colors"
            >
              Log Out
            </button>
          </div>
        </div>
        
        {/* MOBILE MENU */}
        <div className="md:hidden flex overflow-x-auto py-3 space-x-4 text-sm border-t border-blue-700 whitespace-nowrap">
            {user.role === 'director' && (
              <>
                <Link to="/director" className="hover:text-blue-200 font-medium">Admin</Link>
                <Link to="/events" className="hover:text-blue-200 font-medium">Events</Link>
                <Link to="/songs" className="hover:text-blue-200 font-medium">Songs</Link>
                <Link to="/members" className="hover:text-blue-200 font-medium">Directory</Link>
                <Link to="/announcements" className="hover:text-blue-200 font-medium">Notices</Link>
                <Link to="/settings" className="hover:text-blue-200 font-medium">Settings</Link>
              </>
            )}
            {user.role === 'leader' && (
              <>
                <Link to="/exco" className="hover:text-blue-200 font-medium">Executive</Link>
                <Link to="/events" className="hover:text-blue-200 font-medium">Schedule</Link>
                <Link to="/songs" className="hover:text-blue-200 font-medium">Library</Link>
                <Link to="/members" className="hover:text-blue-200 font-medium">Roster</Link>
                <Link to="/announcements" className="hover:text-blue-200 font-medium">Notices</Link>
                <Link to="/settings" className="hover:text-blue-200 font-medium">Settings</Link>
              </>
            )}
            {user.role === 'member' && (
              <>
                <Link to="/member-dashboard" className="hover:text-blue-200 font-medium">Home</Link>
                <Link to="/events" className="hover:text-blue-200 font-medium">Schedule</Link>
                <Link to="/songs" className="hover:text-blue-200 font-medium">Tracks</Link>
                <Link to="/announcements" className="hover:text-blue-200 font-medium">Notices</Link>
                <Link to="/settings" className="hover:text-blue-200 font-medium">Settings</Link>
              </>
            )}
        </div>
      </div>
    </nav>
  );
}