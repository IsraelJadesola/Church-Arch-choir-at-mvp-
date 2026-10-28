const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export async function api(path, { method = 'GET', body } = {}) {
  const token = localStorage.getItem('token');
  
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    // Safely handles both raw objects and already-stringified data
    body: body ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
  });
  
  const data = await res.json().catch(() => ({}));
  
  // Extracts the specific error message sent from the Express backend
  if (!res.ok) throw new Error(data.error || data.message || 'Something went wrong');
  
  return data;
}