import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

export default function Members() {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterPart, setFilterPart] = useState('All');
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const data = await api('/users');
      setMembers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (memberId, newRole) => {
    try {
      await api(`/users/${memberId}/role`, {
        method: 'PATCH',
        body: { role: newRole }
      });
      setMembers(members.map(m => m.id === memberId ? { ...m, role: newRole } : m));
    } catch (err) {
      alert(`Error updating role: ${err.message}`);
    }
  };

  const handleDeleteMember = async (memberId) => {
      if (!window.confirm("Are you sure you want to delete this member?")) return;

      try {
        await api(`/users/${memberId}`, {
          method: 'DELETE'
        });
        // Remove the deleted member from the table UI immediately
        setMembers(members.filter(m => m.id !== memberId));
      } catch (err) {
        alert(`Error deleting member: ${err.message}`);
      }
    };

  const handleApprove = async (id) => {
    setProcessingId(id);
    try {
      await api(`/users/${id}/approve`, { method: 'PATCH' });
      // Move the user from pending to active immediately
      setMembers(members.map(m => m.id === id ? { ...m, active: true } : m));
    } catch (err) {
      alert(err.message || 'Failed to approve user');
    } finally {
      setProcessingId(null);
    }
  };

  // Separate members by active status
  const pendingMembers = members.filter(m => !m.active);
  const activeMembers = members.filter(m => m.active);

  // Apply voice part filter ONLY to active members
  const filteredActiveMembers = filterPart === 'All' 
    ? activeMembers 
    : activeMembers.filter(m => m.voice_part === filterPart);

  if (loading) return <div className="p-4 text-center text-gray-500">Loading directory...</div>;
  if (error) return <div className="p-4 text-red-500 text-center">Error: {error}</div>;

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Choir Directory</h1>
          <p className="text-sm text-gray-500 mt-1">Total active members: {filteredActiveMembers.length}</p>
        </div>
        
        <select 
          value={filterPart}
          onChange={(e) => setFilterPart(e.target.value)}
          className="p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm shadow-sm"
        >
          <option value="All">All Voice Parts</option>
          <option value="Soprano">Soprano</option>
          <option value="Alto">Alto</option>
          <option value="Tenor">Tenor</option>
          <option value="Bass">Bass</option>
        </select>
      </div>

      {/* Director Only: Pending Approvals Section */}
      {user?.role === 'director' && pendingMembers.length > 0 && (
        <div className="mb-8 bg-yellow-50 border border-yellow-200 rounded-xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-yellow-200 bg-yellow-100/50 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-yellow-800">Pending Approvals</h2>
            <span className="px-2.5 py-1 bg-yellow-200 text-yellow-800 rounded-full text-xs font-bold">
              {pendingMembers.length} Awaiting
            </span>
          </div>
          <div className="divide-y divide-yellow-100">
            {pendingMembers.map(member => (
              <div key={member.id} className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-gray-900">{member.name}</p>
                  <p className="text-sm text-gray-500">{member.email} • <span className="font-medium text-gray-700">{member.voice_part}</span></p>
                </div>
                <button
                  onClick={() => handleApprove(member.id)}
                  disabled={processingId === member.id}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  {processingId === member.id ? 'Approving...' : 'Approve Member'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Directory Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
              <tr>
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Email</th>
                <th className="px-6 py-4 font-medium">Voice Part</th>
                <th className="px-6 py-4 font-medium">Rank</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredActiveMembers.map(member => (
                <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{member.name}</td>
                  <td className="px-6 py-4 text-gray-500">{member.email}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                      {member.voice_part}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                      member.role === 'director' ? 'bg-purple-100 text-purple-800' :
                      member.role === 'leader' ? 'bg-indigo-100 text-indigo-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {member.role === 'leader' ? 'Exco' : member.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {user.role === 'director' && member.role !== 'director' ? (
                      <div className="flex items-center justify-end gap-3">
                        <select 
                          value={member.role}
                          onChange={(e) => handleRoleChange(member.id, e.target.value)}
                          className="text-xs border border-gray-300 rounded p-1 focus:ring-blue-500"
                        >
                          <option value="member">Make Member</option>
                          <option value="leader">Make Exco</option>
                        </select>

                        {member.role === 'member' && (
                          <button
                            onClick={() => handleDeleteMember(member.id)}
                            className="text-red-500 hover:text-red-700 text-xs font-bold"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 italic text-xs">Locked</span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredActiveMembers.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    No active members found in this section.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}