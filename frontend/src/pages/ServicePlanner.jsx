import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

export default function ServicePlanner() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [songs, setSongs] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [setlist, setSetlist] = useState([]);
  
  const [formData, setFormData] = useState({ song_id: '', lead_vocalist: '' });
  const canManage = user?.role === 'director' || user?.role === 'leader' || user?.role === 'executive';

  useEffect(() => {
    // Fetch upcoming events and the music library simultaneously
    Promise.all([api('/events'), api('/songs')])
      .then(([eventsData, songsData]) => {
        setEvents(Array.isArray(eventsData) ? eventsData : []);
        setSongs(Array.isArray(songsData) ? songsData : []);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedEventId) {
      setSetlist([]);
      return;
    }
    // Fetch the setlist for the selected event
    api(`/planner/${selectedEventId}`)
      .then(data => setSetlist(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, [selectedEventId]);

  const handleAddSong = async (e) => {
    e.preventDefault();
    if (!selectedEventId) return alert('Please select an event first');
    
    try {
      await api('/planner', { 
        method: 'POST', 
        body: { ...formData, event_id: selectedEventId } 
      });
      // Refresh the setlist
      const updatedSetlist = await api(`/planner/${selectedEventId}`);
      setSetlist(updatedSetlist);
      setFormData({ song_id: '', lead_vocalist: '' });
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRemove = async (id) => {
    if (!window.confirm("Remove this song from the setlist?")) return;
    try {
      await api(`/planner/${id}`, { method: 'DELETE' });
      setSetlist(setlist.filter(item => item.id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Service Planner</h1>
        <p className="text-sm text-gray-500 mt-1">Design setlists and assign vocalists for upcoming events</p>
      </div>

      {/* Event Selector */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Event to Plan</label>
        <select 
          value={selectedEventId} 
          onChange={(e) => setSelectedEventId(e.target.value)}
          className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">-- Select an Event --</option>
          {events.map(ev => (
            <option key={ev.id} value={ev.id}>
              {ev.title} - {new Date(ev.starts_at).toLocaleDateString()}
            </option>
          ))}
        </select>
      </div>

      {selectedEventId && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Setlist Panel */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Current Setlist</h2>
            {setlist.length === 0 ? (
              <div className="bg-gray-50 p-8 rounded-xl border border-dashed border-gray-300 text-center text-gray-500">
                No songs added to this event yet.
              </div>
            ) : (
              setlist.map((item, index) => (
                <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-100 text-blue-800 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{item.title}</h3>
                      <div className="text-sm text-gray-500 flex gap-3 mt-1">
                        <span>Key: {item.musical_key || 'N/A'}</span>
                        {item.lead_vocalist && <span>• Lead: <span className="font-medium text-gray-700">{item.lead_vocalist}</span></span>}
                      </div>
                    </div>
                  </div>
                  {canManage && (
                    <button onClick={() => handleRemove(item.id)} className="text-red-500 hover:text-red-700 text-sm font-medium">
                      Remove
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Add Song Form */}
          {canManage && (
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 h-fit">
              <h3 className="font-bold text-gray-900 mb-4">Add Song to Setlist</h3>
              <form onSubmit={handleAddSong} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Song *</label>
                  <select 
                    required 
                    value={formData.song_id} 
                    onChange={e => setFormData({...formData, song_id: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500"
                  >
                    <option value="">-- Choose from Library --</option>
                    {songs.map(s => (
                      <option key={s.id} value={s.id}>{s.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lead Vocalist (Optional)</label>
                  <input 
                    type="text" 
                    placeholder="e.g., Sister Mary" 
                    value={formData.lead_vocalist} 
                    onChange={e => setFormData({...formData, lead_vocalist: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500"
                  />
                </div>
                <button type="submit" className="w-full bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700">
                  Add to Event
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}