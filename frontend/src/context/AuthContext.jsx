import { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // stay logged in after refresh
  useEffect(() => {
    if (!localStorage.getItem('token')) {
      setLoading(false);
      return;
    }
    api('/auth/me')
      .then((d) => setUser(d.user))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false));
  }, []);

  // Route users to their specific dashboards based on role
  const routeUser = (role) => {
    if (role === 'director') {
      navigate('/');
    } else if (role === 'executive' || role === 'leader') {
      navigate('/executive');
    } else {
      navigate('/member-dashboard');
    }
  };

  const handleAuth = (data) => {
    localStorage.setItem('token', data.token);
    setUser(data.user);
    routeUser(data.user.role);
  };

  const login = async (email, password) => {
    const data = await api('/auth/login', { method: 'POST', body: { email, password } });
    handleAuth(data);
  };

  // Accepts the 'role' parameter from the signup form
  const register = async (name, email, password, voicePart, role) => {
    const data = await api('/auth/register', {
      method: 'POST',
      body: { name, email, password, voicePart, role },
    });
    handleAuth(data);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);