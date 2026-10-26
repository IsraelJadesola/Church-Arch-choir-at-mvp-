import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

export default function Songs() {
  const { user } = useAuth();
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [selectedSong, setSelectedSong] = useState(null);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({ 
    title: '', composer: '', key: '', status: 'Learning', category: 'Praise', notes: '' 
  });
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    api('/songs')
      .then(setSongs)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const resetForm = () => {
    setFormData({ title: '', composer: '', key: '', status: 'Learning', category: 'Praise', notes: '' });
    setSelectedFile(null);
    setEditingId(null);
    setShowForm(false);
  };

  const handleEditClick = (song) => {
    setFormData({
      title: song.title || '',
      composer: song.composer || '',
      key: song.key || '',
      status: song.status || 'Learning',
      category: song.category || 'Praise',
      notes: song.notes || ''
    });
    setEditingId(song.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClick = async (id) => {
    if (!window.confirm("Are you sure you want to delete this song? This action cannot be undone.")) return;
    try {
      await api(`/songs/${id}`, { method: 'DELETE' });
      setSongs(songs.filter(s => s.id !== id));
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    
    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('composer', formData.composer);
      data.append('key', formData.key);
      data.append('status', formData.status);
      data.append('category', formData.category);
      data.append('notes', formData.notes);
      
      if (selectedFile) {
        data.append('file', selectedFile);
      }

      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const endpoint = editingId ? `${API_URL}/songs/${editingId}` : `${API_URL}/songs`;
      const method = editingId ? 'PUT' : 'POST';
      
      const res = await fetch(endpoint, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: data
      });

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const textError = await res.text();
        console.error("Backend Error Response:", textError);
        throw new Error("Server crashed. Check backend logs.");
      }

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save song');
      }

      const savedSong = await res.json();
      
      if (editingId) {
        setSongs(songs.map(s => s.id === editingId ? savedSong : s));
      } else {
        setSongs([savedSong, ...songs]);
      }
      
      resetForm();
    } catch (err) {
      alert(err.message);
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="p-4 text-center text-gray-500">Loading Library...</div>;

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Repertoire Library</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and access choir music materials</p>
        </div>
        {user.role === 'director' && (
          <button 
            onClick={() => {
              if (showForm) resetForm();
              else setShowForm(true);
            }} 
            className={`${showForm ? 'bg-gray-500 hover:bg-gray-600' : 'bg-blue-600 hover:bg-blue-700'} text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors`}
          >
            {showForm ? 'Cancel' : '+ Add New Song'}
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-200 mb-6 relative">
          <h2 className="text-lg font-bold text-gray-800 mb-4">{editingId ? 'Edit Song Details' : 'Add New Song'}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Composer / Arranger</label>
              <input type="text" value={formData.composer} onChange={e => setFormData({...formData, composer: e.target.value})} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500">
                <option>Praise</option>
                <option>Worship</option>
                <option>Hymns</option>
                <option>Anthem</option>
                <option>Special</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Musical Key</label>
              <input type="text" placeholder="e.g. C# Major" value={formData.key} onChange={e => setFormData({...formData, key: e.target.value})} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {editingId ? 'Upload New Material (Leave blank to keep existing file)' : 'Upload Material (Audio, PDF, Image)'}
              </label>
              <input 
                type="file" 
                accept="audio/*,video/*,image/*,.pdf" 
                onChange={e => setSelectedFile(e.target.files[0])} 
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-gray-50" 
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Performance Notes / Details</label>
              <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" rows="2"></textarea>
            </div>

            <div className="md:col-span-2">
              <button type="submit" disabled={uploading} className="w-full bg-green-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 mt-2 disabled:opacity-50">
                {uploading ? 'Saving...' : (editingId ? 'Update Song' : 'Save Song to Library')}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
              <tr>
                <th className="px-6 py-4 font-medium">Song Title</th>
                <th className="px-6 py-4 font-medium">Key</th>
                <th className="px-6 py-4 font-medium">Category</th>
                <th className="px-6 py-4 font-medium">Material</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {songs.map(song => (
                <tr key={song.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{song.title}</td>
                  <td className="px-6 py-4 text-gray-500">{song.key || '-'}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium">
                      {song.category || 'Uncategorized'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {song.file_url ? (
                      <a href={song.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                        📎 View File
                      </a>
                    ) : (
                      <span className="text-gray-400 italic">No file</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right space-x-4">
                    <button 
                      onClick={() => setSelectedSong(song)} 
                      className="text-blue-600 hover:text-blue-800 font-medium text-xs"
                    >
                      Details
                    </button>
                    {user.role === 'director' && (
                      <>
                        <button 
                          onClick={() => handleEditClick(song)} 
                          className="text-amber-600 hover:text-amber-800 font-medium text-xs"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(song.id)} 
                          className="text-red-600 hover:text-red-800 font-medium text-xs"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {songs.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">No songs added to the library yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SONG DETAILS MODAL */}
      {selectedSong && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-gray-900">{selectedSong.title}</h2>
              <button 
                onClick={() => setSelectedSong(null)} 
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>
            
            <div className="space-y-3 text-sm">
              <p><span className="font-medium text-gray-700">Composer:</span> {selectedSong.composer || 'N/A'}</p>
              <p><span className="font-medium text-gray-700">Key:</span> {selectedSong.key || 'N/A'}</p>
              <p><span className="font-medium text-gray-700">Category:</span> {selectedSong.category || 'Uncategorized'}</p>
              <p><span className="font-medium text-gray-700">Status:</span> {selectedSong.status || 'Learning'}</p>
              <p><span className="font-medium text-gray-700">Notes:</span> {selectedSong.notes || 'No performance notes provided.'}</p>
              
              {selectedSong.file_url && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="font-medium text-gray-700 mb-2">Practice Material:</p>
                  {(selectedSong.file_type?.includes('audio') || selectedSong.file_type?.includes('video')) ? (
                    <audio controls src={selectedSong.file_url} className="w-full h-12" />
                  ) : (
                    <a 
                      href={selectedSong.file_url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="bg-blue-50 text-blue-600 px-4 py-2.5 rounded-lg block text-center font-medium hover:bg-blue-100 transition-colors"
                    >
                      Open Attached Document
                    </a>
                  )}
                </div>
              )}
            </div>
            
            <button 
              onClick={() => setSelectedSong(null)} 
              className="w-full mt-6 bg-gray-100 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Close Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
}