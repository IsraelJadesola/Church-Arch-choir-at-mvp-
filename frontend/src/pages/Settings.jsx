import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { user } = useAuth();
  
  // Form States
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });
  
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  });

  const [notifications, setNotifications] = useState({
    emailReminders: true,
    smsAlerts: false,
    repertoireUpdates: true,
  });

  const [isSaving, setIsSaving] = useState(false);

  // Handlers
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    // TODO: Wire up to PUT /api/users/profile
    setTimeout(() => {
      alert('Profile updated successfully (Mock)');
      setIsSaving(false);
    }, 1000);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      return alert("New passwords do not match");
    }
    setIsSaving(true);
    // TODO: Wire up to PUT /api/users/password
    setTimeout(() => {
      alert('Password changed successfully (Mock)');
      setPasswords({ current: '', new: '', confirm: '' });
      setIsSaving(false);
    }, 1000);
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account preferences and configurations.</p>
      </div>

      <div className="space-y-6">
        {/* Profile Settings Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-800">Personal Information</h2>
          </div>
          <div className="p-6">
            <form onSubmit={handleProfileUpdate} className="space-y-4 max-w-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input 
                  type="text" 
                  value={profileData.name}
                  onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input 
                  type="email" 
                  value={profileData.email}
                  onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Voice Part</label>
                <input 
                  type="text" 
                  value={user?.voice_part || 'Unassigned'}
                  disabled
                  className="w-full p-2.5 border border-gray-200 bg-gray-50 rounded-lg text-sm text-gray-500 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">Contact your director to change your voice part.</p>
              </div>
              <button 
                type="submit" 
                disabled={isSaving}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isSaving ? 'Saving...' : 'Save Profile'}
              </button>
            </form>
          </div>
        </div>

        {/* Security / Password Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-800">Security</h2>
          </div>
          <div className="p-6">
            <form onSubmit={handlePasswordChange} className="space-y-4 max-w-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                <input 
                  type="password" 
                  value={passwords.current}
                  onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input 
                  type="password" 
                  value={passwords.new}
                  onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <input 
                  type="password" 
                  value={passwords.confirm}
                  onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              <button 
                type="submit" 
                disabled={isSaving}
                className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-900 disabled:opacity-50 transition-colors"
              >
                Update Password
              </button>
            </form>
          </div>
        </div>

        {/* Director Only: Global System Configurations */}
        {user?.role === 'director' && (
          <div className="bg-white rounded-xl shadow-sm border border-purple-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-purple-100 bg-purple-50 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-purple-900">Choir Administration</h2>
              <span className="px-2.5 py-1 bg-purple-200 text-purple-800 rounded-full text-xs font-bold">Director Access</span>
            </div>
            <div className="p-6">
              <div className="space-y-4 max-w-lg">
                <p className="text-sm text-gray-600 mb-4">Global settings applied to all members.</p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Default RSVP Deadline</label>
                  <select className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 text-sm">
                    <option>24 Hours before event</option>
                    <option>48 Hours before event</option>
                    <option>1 Week before event</option>
                  </select>
                </div>
                <div className="pt-4 border-t border-gray-100">
                  <button className="text-red-600 hover:text-red-800 text-sm font-medium transition-colors">
                    Archive All Past Events
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}