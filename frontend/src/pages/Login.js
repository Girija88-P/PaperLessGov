import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { FileText, Lock, User, Briefcase } from 'lucide-react';

const Login = ({ setAuth }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [dept, setDept] = useState('Common');
  const [error, setError] = useState('');
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    // SECURITY: Brute-force protection — lockout after 5 failed attempts
    if (lockoutUntil && new Date() < lockoutUntil) {
      const remaining = Math.ceil((lockoutUntil - new Date()) / 1000);
      setError(`⚠️ Too many failed attempts. Account locked for ${remaining} seconds.`);
      return;
    }

    try {
      const response = await api.post('auth/token/', { username, password });
      
      // Get user info to verify department
      const userRes = await api.get('users/me/', {
        headers: { Authorization: `Bearer ${response.data.access}` }
      });

      const userDept = userRes.data.department || 'Common';
      const selectedDept = dept === 'Common (HQ)' ? 'Common' : dept;

      // Security Check: Ensure user belongs to the department they selected
      if (userDept !== 'Common' && userDept !== selectedDept) {
        setError(`Access Denied: You are not from the ${selectedDept} department.`);
        setLoginAttempts(prev => prev + 1);
        return;
      }

      // Success — reset attempts
      setLoginAttempts(0);
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      localStorage.setItem('user_role', userRes.data.role);
      localStorage.setItem('user_email', userRes.data.email);
      localStorage.setItem('user_name', userRes.data.first_name || userRes.data.username);
      localStorage.setItem('user_dept', userDept);
      
      setAuth(true);
      navigate('/');
    } catch (err) {
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      
      let errMsg = "Invalid credentials.";
      if (err.response && err.response.data && err.response.data.detail) {
        errMsg = err.response.data.detail;
      } else if (err.message) {
        errMsg = err.message;
      }

      if (newAttempts >= 5) {
        const lockTime = new Date(Date.now() + 60000); // Lock for 60 seconds
        setLockoutUntil(lockTime);
        setError(`⚠️ 5 failed attempts detected. Login locked for 60 seconds as a security measure.`);
      } else {
        setError(`Login failed: ${errMsg} (${5 - newAttempts} attempts remaining)`);
      }
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '20px' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <div style={{ background: 'var(--primary)', padding: '12px', borderRadius: '12px', display: 'flex' }}>
            <FileText size={32} color="white" />
          </div>
        </div>
        <h1 style={{ fontSize: '2rem' }}>PaperLessGov</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>AI-Powered e-Governance Portal</p>
        
        {error && <div style={{ color: 'var(--danger)', marginBottom: '16px', fontSize: '0.9rem' }}>{error}</div>}

        <form onSubmit={handleLogin}>
          <div className="input-group" style={{ textAlign: 'left' }}>
            <label><User size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }}/>Username</label>
            <input 
              type="text" 
              className="glass-input" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required 
            />
          </div>

          <div className="input-group" style={{ textAlign: 'left' }}>
            <label><Briefcase size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }}/>Target Department</label>
            <select 
              className="glass-input" 
              style={{ appearance: 'auto', width: '100%' }}
              value={dept}
              onChange={(e) => setDept(e.target.value)}
              required
            >
                <option value="Common">Main State Government</option>
               <option value="Finance">Finance</option>
               <option value="Health">Health</option>
               <option value="Transport">Transport</option>
               <option value="Education">Education</option>
               <option value="Urban Planning">Urban Planning</option>
            </select>
          </div>

          <div className="input-group" style={{ textAlign: 'left', marginBottom: '32px' }}>
            <label><Lock size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }}/>Password</label>
            <input 
              type="password" 
              className="glass-input" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>
          <button type="submit" className="btn-primary" style={{ width: '100%', fontSize: '1.1rem' }}>
            Secure Login
          </button>
          
          <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Are you a citizen? </span>
            <button 
              type="button"
              onClick={() => navigate('/citizen-portal')}
              style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', paddingLeft: '4px', textDecoration: 'underline' }}
            >
              Go to Citizen Portal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
