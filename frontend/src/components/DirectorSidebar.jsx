import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function DirectorSidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // If they are a regular member, hide this sidebar entirely
  if (user?.role === 'member' || !user) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Define distinct links based on rank
  const directorLinks = [
    { name: 'Director Admin', path: '/director' },
    { name: 'Member Directory', path: '/members' },
    { name: 'Music Library', path: '/songs' },
    { name: 'Service Planner', path: '/planner' },
    { name: 'Rehearsals & RSVP', path: '/events' },
    { name: 'Announcements', path: '/announcements' },
    { name: 'Reports', path: '/reports' },
    { name: 'System Settings', path: '/settings' },
  ];

  const excoLinks = [
    { name: 'Executive Desk', path: '/exco' },
    { name: 'Global Roster', path: '/members' },
    { name: 'Repertoire Library', path: '/songs' },
    { name: 'Master Schedule', path: '/events' },
    { name: 'Announcements', path: '/announcements' },
    { name: 'System Settings', path: '/settings' },
  ];

  const links = user.role === 'director' ? directorLinks : excoLinks;
  
  // Distinct colors: Director gets a darker slate/blue, Exco gets a rich standard blue
  const sidebarBg = user.role === 'director' ? 'bg-slate-900' : 'bg-blue-900';
  const headerBorder = user.role === 'director' ? 'border-slate-800' : 'border-blue-800';

  return (
    <div className={`w-64 ${sidebarBg} text-white min-h-screen hidden md:flex flex-col shadow-xl fixed left-0 top-0 bottom-0 z-50`}>
      <div className={`p-6 border-b ${headerBorder}`}>
        <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <span className="text-3xl">🎵</span> Choir App
        </h2>
        <p className="text-gray-300 text-sm mt-2">{user.name}</p>
        <span className={`inline-block mt-1 text-xs px-2 py-1 rounded uppercase tracking-wider font-semibold ${
          user.role === 'director' ? 'bg-slate-800 text-slate-300' : 'bg-blue-800 text-blue-200'
        }`}>
          {user.role === 'director' ? 'Director' : 'Executive'}
        </span>
      </div>
      
      <nav className="flex-1 px-4 space-y-1.5 mt-6 overflow-y-auto">
        {links.map((link) => {
          const isActive = location.pathname.startsWith(link.path);
          return (
            <Link
              key={link.name}
              to={link.path}
              className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive 
                  ? (user.role === 'director' ? 'bg-slate-700 text-white shadow-sm' : 'bg-blue-700 text-white shadow-sm')
                  : (user.role === 'director' ? 'text-slate-300 hover:bg-slate-800 hover:text-white' : 'text-blue-100 hover:bg-blue-800 hover:text-white')
              }`}
            >
              {link.name}
            </Link>
          );
        })}
      </nav>

      <div className={`p-4 border-t ${headerBorder}`}>
        <button 
          onClick={handleLogout}
          className={`w-full text-left px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
            user.role === 'director' ? 'text-slate-300 hover:text-white hover:bg-slate-800' : 'text-blue-200 hover:text-white hover:bg-blue-800'
          }`}
        >
          Log Out
        </button>
      </div>
    </div>
  );
}