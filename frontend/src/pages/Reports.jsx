import { useState, useEffect } from 'react';
import { api } from '../lib/api';

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/reports/rsvps')
      .then(data => setReports(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-4 text-center text-gray-500">Loading Reports...</div>;

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Attendance Reports</h1>
        <p className="text-sm text-gray-500 mt-1">Real-time RSVP analytics for upcoming and past events</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {reports.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-gray-200 text-center text-gray-500">
            No events found.
          </div>
        ) : (
          reports.map(report => (
            <div key={report.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-slate-50 p-4 border-b border-gray-200 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-lg text-gray-900">{report.title}</h3>
                  <p className="text-sm text-gray-600">
                    {new Date(report.starts_at).toLocaleString([], { weekday: 'long', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold uppercase">
                  {report.type}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200">
                {/* GOING COLUMN */}
                <div className="p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-semibold text-green-700">Going</h4>
                    <span className="bg-green-100 text-green-800 py-0.5 px-2 rounded-full text-xs font-bold">{report.going.length}</span>
                  </div>
                  {report.going.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">No confirmations yet.</p>
                  ) : (
                    <ul className="space-y-1">
                      {report.going.map((user, idx) => (
                        <li key={idx} className="text-sm text-gray-700 flex justify-between">
                          <span>{user.name}</span>
                          <span className="text-xs text-gray-400 uppercase">{user.role}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* NOT GOING COLUMN */}
                <div className="p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-semibold text-red-700">Not Going</h4>
                    <span className="bg-red-100 text-red-800 py-0.5 px-2 rounded-full text-xs font-bold">{report.not_going.length}</span>
                  </div>
                  {report.not_going.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">No declines yet.</p>
                  ) : (
                    <ul className="space-y-1">
                      {report.not_going.map((user, idx) => (
                        <li key={idx} className="text-sm text-gray-700 flex justify-between">
                          <span>{user.name}</span>
                          <span className="text-xs text-gray-400 uppercase">{user.role}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}