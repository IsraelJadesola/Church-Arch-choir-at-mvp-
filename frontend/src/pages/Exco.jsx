import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Link } from 'react-router-dom';

export default function Exco() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/events')
      .then(data => setEvents(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-4 text-center text-gray-500">Loading Executive Desk...</div>;

  const nextEvent = events.length > 0 ? events[0] : null;

  return (
    <div className="max-w-4xl mx-auto p-4 pb-20">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Executive Committee Desk
        </h1>
        <p className="text-gray-500 mt-1">
          Welcome back, {user.name}. Oversee choir-wide communications, roster management, and general attendance here.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Next Event Status Card */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Rehearsal / Service</h2>
          {nextEvent ? (
            <div>
              <p className="font-medium text-blue-800">{nextEvent.title}</p>
              <p className="text-sm text-gray-500 mb-4">
                {new Date(nextEvent.starts_at).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
              
              <div className="flex gap-2">
                <Link to={`/events/${nextEvent.id}/attendance`} className="flex-1 bg-blue-600 text-white text-center py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
                  Mark Master Attendance
                </Link>
                <button className="flex-1 bg-blue-50 text-blue-700 py-2 rounded-lg text-sm font-medium hover:bg-blue-100">
                  View Full RSVPs
                </button>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm italic">No upcoming events scheduled.</p>
          )}
        </div>

        {/* Executive Tools Card */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Administrative Tools</h2>
          <div className="space-y-3">
            <Link to="/members" className="block w-full text-left px-4 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700">
              👥 View Complete Choir Roster
            </Link>
            <button className="w-full text-left px-4 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700">
              📢 Post Global Announcement (Soon)
            </button>
            <button className="w-full text-left px-4 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700">
              🎵 Review Full Repertoire Library
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}