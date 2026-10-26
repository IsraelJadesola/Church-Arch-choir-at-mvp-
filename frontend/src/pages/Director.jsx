import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Link } from 'react-router-dom';

export default function Director() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState({ events: [], members: [], songs: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        // Fetch all three endpoints simultaneously, defaulting to empty arrays if any fail
        const [eventsData, membersData, songsData] = await Promise.all([
          api('/events').catch(() => []),
          api('/users').catch(() => []),
          api('/songs').catch(() => [])
        ]);

        setDashboardData({
          events: Array.isArray(eventsData) ? eventsData : [],
          members: Array.isArray(membersData) ? membersData : [],
          songs: Array.isArray(songsData) ? songsData : []
        });
      } catch (error) {
        console.error("Dashboard Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  if (loading) return <div className="p-4 text-center text-gray-500">Loading Director Dashboard...</div>;

  const nextEvent = dashboardData.events.length > 0 ? dashboardData.events[0] : null;

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <div className="bg-slate-900 p-8 rounded-xl shadow-md mb-6 text-white">
        <h1 className="text-3xl font-bold">Director Desk</h1>
        <p className="text-slate-300 mt-2 text-lg">
          Welcome back, {user?.name}. Here is your choir overview.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Quick Stats Cards */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="text-gray-500 text-sm font-medium mb-1">Total Members</div>
          <div className="text-3xl font-bold text-gray-900">{dashboardData.members.length}</div>
          <Link to="/members" className="text-blue-600 text-sm font-medium mt-3 inline-block hover:underline">Manage Roster &rarr;</Link>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="text-gray-500 text-sm font-medium mb-1">Repertoire Library</div>
          <div className="text-3xl font-bold text-gray-900">{dashboardData.songs.length}</div>
          <Link to="/songs" className="text-blue-600 text-sm font-medium mt-3 inline-block hover:underline">Add Music &rarr;</Link>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="text-gray-500 text-sm font-medium mb-1">Upcoming Events</div>
          <div className="text-3xl font-bold text-gray-900">{dashboardData.events.length}</div>
          <Link to="/events" className="text-blue-600 text-sm font-medium mt-3 inline-block hover:underline">View Schedule &rarr;</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Next Event Widget */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Next Up</h2>
          {nextEvent ? (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2.5 py-1 rounded text-xs font-semibold uppercase ${
                  nextEvent.type === 'Rehearsal' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {nextEvent.type}
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-800">{nextEvent.title}</h3>
              <p className="text-gray-600 mt-1 font-medium">
                {new Date(nextEvent.starts_at).toLocaleString([], { weekday: 'long', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
              {nextEvent.description && <p className="text-sm text-gray-500 mt-2">{nextEvent.description}</p>}
            </div>
          ) : (
            <p className="text-gray-500 text-sm italic">No events scheduled. Use the Master Schedule to add one.</p>
          )}
        </div>
      </div>
    </div>
  );
}