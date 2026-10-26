import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

export default function MemberDashboard() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [songs, setSongs] = useState([]);
  const [rsvps, setRsvps] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsData, songsData, rsvpData] = await Promise.all([
          api('/events').catch(() => []),
          api('/songs').catch(() => []),
          api('/events/my-rsvps').catch(() => [])
        ]);

        setEvents(Array.isArray(eventsData) ? eventsData : []);
        setSongs(Array.isArray(songsData) ? songsData : []);
        
        // Convert RSVP array into an easy-to-read lookup object: { event_id: 'Attending' }
        const rsvpMap = {};
        if (Array.isArray(rsvpData)) {
          rsvpData.forEach(r => { rsvpMap[r.event_id] = r.status; });
        }
        setRsvps(rsvpMap);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleRSVP = async (eventId, status) => {
    try {
      await api(`/events/${eventId}/rsvp`, { method: 'POST', body: { status } });
      setRsvps(prev => ({ ...prev, [eventId]: status }));
    } catch (err) {
      alert("Failed to save RSVP: " + err.message);
    }
  };

  if (loading) return <div className="p-4 text-center text-gray-500">Loading your dashboard...</div>;

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <div className="bg-blue-900 p-8 rounded-xl shadow-md mb-6 text-white">
        <h1 className="text-3xl font-bold">Member Portal</h1>
        <p className="text-blue-200 mt-2 text-lg">
          Welcome, {user?.name}. Manage your schedule and access practice materials.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Schedule & RSVP Widget */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Upcoming Schedule</h2>
          <div className="space-y-4">
            {events.length === 0 ? (
              <p className="text-gray-500 text-sm italic">No upcoming events on the calendar.</p>
            ) : (
              events.map(event => (
                <div key={event.id} className="p-4 border border-gray-100 rounded-lg bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-semibold uppercase mr-2">
                        {event.type}
                      </span>
                      <h3 className="font-bold text-gray-900 inline">{event.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {new Date(event.starts_at).toLocaleString([], { weekday: 'long', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-200 flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700 mr-2">RSVP:</span>
                    <button 
                      onClick={() => handleRSVP(event.id, 'Attending')}
                      className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${rsvps[event.id] === 'Attending' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-green-100 hover:text-green-800'}`}
                    >
                      Attending
                    </button>
                    <button 
                      onClick={() => handleRSVP(event.id, 'Not Attending')}
                      className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${rsvps[event.id] === 'Not Attending' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-red-100 hover:text-red-800'}`}
                    >
                      Not Attending
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Practice Materials Widget */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Latest Practice Materials</h2>
          <div className="space-y-3">
            {songs.length === 0 ? (
              <p className="text-gray-500 text-sm italic">The library is currently empty.</p>
            ) : (
              songs.slice(0, 5).map(song => (
                <div key={song.id} className="p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-gray-800">{song.title}</h4>
                    <p className="text-xs text-gray-500">{song.category} • Key: {song.key || 'N/A'}</p>
                  </div>
                  {song.file_url ? (
                    <a href={song.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded text-sm font-medium">
                      Open
                    </a>
                  ) : (
                    <span className="text-gray-400 text-xs italic">No file</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}