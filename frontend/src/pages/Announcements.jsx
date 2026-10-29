import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

export default function Announcements() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ title: '', content: '', type: 'General' });

  useEffect(() => {
    api('/announcements')
      .then(data => setAnnouncements(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handlePost = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        // Update existing announcement
        const updatedNotice = await api(`/announcements/${editingId}`, { method: 'PUT', body: formData });
        setAnnouncements(announcements.map(a => a.id === editingId ? updatedNotice : a));
      } else {
        // Create new announcement
        const newNotice = await api('/announcements', { method: 'POST', body: formData });
        setAnnouncements([newNotice, ...announcements]);
      }
      resetForm();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEdit = (notice) => {
    setFormData({ title: notice.title, content: notice.content, type: notice.type });
    setEditingId(notice.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this announcement?")) return;
    try {
      await api(`/announcements/${id}`, { method: 'DELETE' });
      setAnnouncements(announcements.filter(a => a.id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ title: '', content: '', type: 'General' });
  };

  const canManage = user?.role === 'director' || user?.role === 'leader' || user?.role === 'executive';

  if (loading) return <div className="p-4 text-center text-gray-500">Loading notices...</div>;

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notice Board</h1>
          <p className="text-sm text-gray-500 mt-1">Updates and broadcasts for the choir</p>
        </div>
        {canManage && (
          <button 
            onClick={() => showForm ? resetForm() : setShowForm(true)} 
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            {showForm ? 'Cancel' : '+ New Notice'}
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
          <form onSubmit={handlePost} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g., Sunday Uniform" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority Type</label>
                <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500">
                  <option value="General">General Info</option>
                  <option value="Urgent">Urgent Alert</option>
                  <option value="Uniform">Uniform/Dress Code</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
              <textarea required value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} placeholder="Type your announcement here..." className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 min-h-[100px]"></textarea>
            </div>
            <button type="submit" className="w-full bg-green-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-green-700">
              {editingId ? 'Update Announcement' : 'Post Announcement'}
            </button>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {announcements.length === 0 ? (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center text-gray-500">
            No active announcements.
          </div>
        ) : (
          announcements.map(notice => (
            <div key={notice.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:border-blue-200 transition-colors">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded text-xs font-semibold uppercase ${
                    notice.type === 'Urgent' ? 'bg-red-100 text-red-700' : 
                    notice.type === 'Uniform' ? 'bg-purple-100 text-purple-700' : 
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {notice.type}
                  </span>
                  <h3 className="text-lg font-bold text-gray-900">{notice.title}</h3>
                </div>
                
                {/* OWNERSHIP OR DIRECTOR OVERRIDE CHECK */}
                <div className="flex gap-4">
                  {user?.name === notice.author_name && (
                    <button onClick={() => handleEdit(notice)} className="text-blue-500 hover:text-blue-700 text-sm font-medium">
                      Edit
                    </button>
                  )}
                  {(user?.name === notice.author_name || user?.role === 'director') && (
                    <button onClick={() => handleDelete(notice.id)} className="text-red-500 hover:text-red-700 text-sm font-medium">
                      Delete
                    </button>
                  )}
                </div>
              </div>
              <p className="text-gray-700 whitespace-pre-wrap">{notice.content}</p>
              <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
                <span>Posted by <span className="font-medium">{notice.author_name}</span></span>
                <span>{new Date(notice.created_at).toLocaleString()}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}