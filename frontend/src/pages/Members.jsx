import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

export default function Members() {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterPart, setFilterPart] = useState('All');

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

  const filteredMembers = filterPart === 'All' 
    ? members 
    : members.filter(m => m.voice_part === filterPart);

  if (loading) return <div className="p-4 text-center text-gray-500">Loading directory...</div>;
  if (error) return <div className="p-4 text-red-500 text-center">Error: {error}</div>;

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Choir Directory</h1>
          <p className="text-sm text-gray-500 mt-1">Total members: {filteredMembers.length}</p>
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
              {filteredMembers.map(member => (
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
                      <select 
                        value={member.role}
                        onChange={(e) => handleRoleChange(member.id, e.target.value)}
                        className="text-xs border border-gray-300 rounded p-1 focus:ring-blue-500"
                      >
                        <option value="member">Make Member</option>
                        <option value="leader">Make Exco</option>
                      </select>
                    ) : (
                      <span className="text-gray-400 italic text-xs">Locked</span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredMembers.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    No members found in this section.
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