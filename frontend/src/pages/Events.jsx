import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

export default function Events() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [myRsvps, setMyRsvps] = useState({}); // Stores { eventId: 'going' }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', starts_at: '', type: 'Rehearsal', description: '' });

  useEffect(() => {
    // Fetch events and the user's RSVPs at the same time
    Promise.all([
      api('/events'),
      api('/events/my-rsvps')
    ])
      .then(([eventsData, rsvpsData]) => {
        setEvents(Array.isArray(eventsData) ? eventsData : []);
        
        // Convert RSVPs array into an easy lookup object for button highlighting
        const rsvpMap = {};
        if (Array.isArray(rsvpsData)) {
          rsvpsData.forEach(rsvp => {
            rsvpMap[rsvp.event_id] = rsvp.status;
          });
        }
        setMyRsvps(rsvpMap);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleAddEvent = async (e) => {
    e.preventDefault();
    try {
      const newEvent = await api('/events', { method: 'POST', body: formData });
      const updatedEvents = [...events, newEvent].sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at));
      setEvents(updatedEvents);
      setShowForm(false);
      setFormData({ title: '', starts_at: '', type: 'Rehearsal', description: '' });
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this event?")) return;
    try {
      await api(`/events/${id}`, { method: 'DELETE' });
      setEvents(events.filter(e => e.id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRsvp = async (eventId, status) => {
    try {
      await api(`/events/${eventId}/rsvp`, { method: 'POST', body: { status } });
      setMyRsvps(prev => ({ ...prev, [eventId]: status }));
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="p-4 text-center text-gray-500">Loading Schedule...</div>;
  if (error) return <div className="p-4 text-center text-red-500">Error loading schedule: {error}</div>;

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Master Schedule</h1>
          <p className="text-sm text-gray-500 mt-1">Upcoming rehearsals and services</p>
        </div>
        {user?.role === 'director' && (
          <button 
            onClick={() => setShowForm(!showForm)} 
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            {showForm ? 'Cancel' : '+ Schedule Event'}
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
          <form onSubmit={handleAddEvent} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Event Title *</label>
              <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g., Sunday Service" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
              <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500">
                <option>Rehearsal</option>
                <option>Sunday Service</option>
                <option>Midweek Service</option>
                <option>Special Concert</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time *</label>
              <input required type="datetime-local" value={formData.starts_at} onChange={e => setFormData({...formData, starts_at: e.target.value})} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Details / Notes</label>
              <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="What are we preparing for?" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" rows="2"></textarea>
            </div>
            <div className="md:col-span-2">
              <button type="submit" className="w-full bg-green-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 mt-2">
                Add to Schedule
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {events.length === 0 ? (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center text-gray-500">
            No upcoming events scheduled.
          </div>
        ) : (
          events.map(event => (
            <div key={event.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-blue-300 transition-colors">
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2.5 py-0.5 rounded text-xs font-semibold uppercase ${
                    event.type === 'Rehearsal' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {event.type}
                  </span>
                  <h3 className="text-lg font-bold text-gray-900">{event.title}</h3>
                </div>
                <p className="text-sm text-gray-600 font-medium">
                  {new Date(event.starts_at).toLocaleString([], { weekday: 'long', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
                {event.description && <p className="text-sm text-gray-500 mt-2">{event.description}</p>}
              </div>
              
              <div className="flex flex-col sm:flex-row items-center gap-2">
                {user?.role !== 'director' && (
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button 
                      onClick={() => handleRsvp(event.id, 'going')}
                      className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        myRsvps[event.id] === 'going' ? 'bg-green-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Going
                    </button>
                    <button 
                      onClick={() => handleRsvp(event.id, 'not_going')}
                      className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        myRsvps[event.id] === 'not_going' ? 'bg-red-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Not Going
                    </button>
                  </div>
                )}
                
                {user?.role === 'director' && (
                  <button onClick={() => handleDelete(event.id)} className="text-red-600 hover:text-red-800 text-sm font-medium ml-2">
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}