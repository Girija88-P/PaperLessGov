import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { Search, FileText, CheckCircle, Clock, User, LogOut, ChevronRight, MapPin } from 'lucide-react';

const CitizenPortal = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('access_token'));
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [fileId, setFileId] = useState('');
  const [fileData, setFileData] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState('tracking'); // 'tracking' or 'notifications'
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('notifications/');
      setNotifications(res.data);
    } catch (err) {
      console.error("Failed to fetch notifications");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('auth/token/', { username: credentials.email, password: credentials.password });
      localStorage.setItem('access_token', res.data.access);
      localStorage.setItem('refresh_token', res.data.refresh);
      const userRes = await api.get('users/me/');
      localStorage.setItem('user_role', userRes.data.role);
      localStorage.setItem('user_email', userRes.data.email);
      localStorage.setItem('user_name', userRes.data.first_name);
      setIsLoggedIn(true);
      setError('');
      fetchNotifications();
    } catch (err) {
      setError('Login failed. Please check your email and password.');
    }
  };

  const markRead = async (id) => {
    try {
      await api.post(`notifications/${id}/mark_read/`);
      fetchNotifications();
    } catch (err) {}
  };

  React.useEffect(() => {
    if (isLoggedIn) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 10000); // Poll every 10s for demo
      return () => clearInterval(interval);
    }
  }, [isLoggedIn]);

  const handleTrack = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`files/${fileId}/`);
      if (res.data.citizen_email !== localStorage.getItem('user_email')) {
        setError("This file is not linked to your account.");
        setFileData(null);
      } else {
        setFileData(res.data);
      }
    } catch (err) {
      setError("File not found.");
      setFileData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (fileId, type, docId) => {
    try {
      const url = type === 'main' 
        ? `files/${fileId}/download/` 
        : `files/${fileId}/download_support/${docId}/`;
      const res = await api.get(url, { responseType: 'blob' });
      
      // Get filename from Content-Disposition header or default
      const contentDisposition = res.headers['content-disposition'];
      let filename = 'document';
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?(.+)"?/);
        if (match) filename = match[1];
      }
      
      // Trigger browser download
      const blob = new Blob([res.data]);
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href);
    } catch (err) {
      alert("Download failed. Please try again.");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setIsLoggedIn(false);
    setFileData(null);
  };

  if (!isLoggedIn) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#1e293b', fontFamily: 'sans-serif' }}>
        {/* Simple Public Header */}
        <header style={{ background: 'white', padding: '16px 5%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '700', fontSize: '1.2rem', color: '#2563eb' }}>
            <FileText /> Digital Seva Portal
          </div>
          <div style={{ fontSize: '0.9rem', color: '#64748b' }}>Government of India</div>
        </header>

        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '80px', padding: '20px' }}>
          <div style={{ background: 'white', padding: '40px', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' }}>
            <h2 style={{ marginBottom: '8px' }}>Citizen Login</h2>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '32px' }}>Enter your email and password to track your documents.</p>
            
            {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.85rem' }}>{error}</div>}
            
            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>Email Address</label>
                <input type="email" placeholder="name@example.com" value={credentials.email} onChange={e => setCredentials({...credentials, email: e.target.value})} style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', outline: 'none' }} required />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>Password (Your Phone Number)</label>
                <input type="password" placeholder="••••••••" value={credentials.password} onChange={e => setCredentials({...credentials, password: e.target.value})} style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', outline: 'none' }} required />
              </div>
              <button type="submit" style={{ width: '100%', padding: '12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Login to Portal</button>
              
              <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Are you a government official? </span>
                <button 
                  type="button"
                  onClick={() => navigate('/login')}
                  style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', paddingLeft: '4px', textDecoration: 'underline' }}
                >
                  Official Login
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#1e293b', fontFamily: 'sans-serif' }}>
      <header style={{ background: 'white', padding: '16px 5%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '700', fontSize: '1.2rem', color: '#2563eb' }}>
          <FileText /> Digital Seva Portal
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ fontSize: '0.9rem', color: '#64748b' }}>Welcome, <b>{localStorage.getItem('user_name')}</b></div>
          <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.9rem' }}><LogOut size={16} /> Logout</button>
        </div>
      </header>

      <main style={{ padding: '40px 5%' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          
          {/* Tab Switcher */}
          <div style={{ display: 'flex', gap: '20px', marginBottom: '24px' }}>
            <button 
              onClick={() => setActiveTab('tracking')}
              style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: activeTab === 'tracking' ? '#2563eb' : 'white', color: activeTab === 'tracking' ? 'white' : '#64748b', fontWeight: '600', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
            >
              Document Tracking
            </button>
            <button 
              onClick={() => setActiveTab('notifications')}
              style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: activeTab === 'notifications' ? '#2563eb' : 'white', color: activeTab === 'notifications' ? 'white' : '#64748b', fontWeight: '600', cursor: 'pointer', position: 'relative', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
            >
              Notifications
              {notifications.filter(n => !n.is_read).length > 0 && (
                <span style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#ef4444', color: 'white', fontSize: '10px', width: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white' }}>
                  {notifications.filter(n => !n.is_read).length}
                </span>
              )}
            </button>
          </div>

          {activeTab === 'tracking' ? (
            <>
              <div style={{ background: '#2563eb', padding: '40px', borderRadius: '16px', color: 'white', marginBottom: '32px' }}>
                <h1 style={{ marginBottom: '16px', fontSize: '2rem' }}>Track Your Application</h1>
                <p style={{ opacity: 0.9, marginBottom: '24px' }}>Enter your File ID to see the current status and history of your document.</p>
                <form onSubmit={handleTrack} style={{ display: 'flex', gap: '10px' }}>
                  <input value={fileId} onChange={e => setFileId(e.target.value)} placeholder="Enter File ID (e.g. 101)" style={{ flex: 1, padding: '14px 20px', borderRadius: '12px', border: 'none', color: '#1e293b', fontSize: '1rem', outline: 'none' }} />
                  <button type="submit" disabled={loading} style={{ background: '#1e293b', color: 'white', border: 'none', padding: '0 30px', borderRadius: '12px', fontWeight: '600', cursor: 'pointer' }}>
                    {loading ? 'Searching...' : 'Track Now'}
                  </button>
                </form>
                {error && <div style={{ color: '#fecaca', marginTop: '12px', fontSize: '0.9rem', fontWeight: '600' }}>{error}</div>}
              </div>

              {fileData && (
                <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                  <div style={{ padding: '24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h2 style={{ fontSize: '1.25rem', marginBottom: '4px' }}>{fileData.name}</h2>
                        <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Application ID: <b>#F-{fileData.id}</b></p>
                      </div>
                      <div style={{ padding: '6px 16px', borderRadius: '999px', background: '#dcfce7', color: '#166534', fontWeight: '700', fontSize: '0.85rem' }}>
                        {fileData.statuses?.slice(-1)[0]?.current_stage}
                      </div>
                  </div>

                  <div style={{ padding: '24px' }}>
                      <h3 style={{ fontSize: '1rem', marginBottom: '20px', color: '#64748b' }}>Application Timeline</h3>
                      <div style={{ position: 'relative', paddingLeft: '32px' }}>
                        <div style={{ position: 'absolute', left: '11px', top: '8px', bottom: '8px', width: '2px', background: '#f1f5f9' }} />
                        {fileData.statuses?.map((s, i) => (
                          <div key={i} style={{ position: 'relative', marginBottom: '24px' }}>
                            <div style={{ position: 'absolute', left: '-27px', top: '4px', width: '12px', height: '12px', borderRadius: '50%', background: i === fileData.statuses.length-1 ? '#2563eb' : '#cbd5e1', border: '4px solid white', boxShadow: '0 0 0 1px #f1f5f9' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                              <span style={{ fontWeight: '600' }}>{s.current_stage}</span>
                              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{new Date(s.timestamp).toLocaleString()}</span>
                            </div>
                            {s.remarks && <p style={{ fontSize: '0.85rem', color: '#64748b', background: '#f8fafc', padding: '10px', borderRadius: '8px', marginTop: '4px' }}>{s.remarks}</p>}
                          </div>
                        ))}
                      </div>
                  </div>

                  {/* DOCUMENTS ON FILE - Download Section */}
                  <div style={{ padding: '24px', borderTop: '1px solid #f1f5f9' }}>
                      <h3 style={{ fontSize: '1rem', marginBottom: '16px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        📄 Documents on File ({1 + (fileData.supporting_documents?.length || 0)})
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {/* Main Document */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: '#f0f9ff', borderRadius: '10px', border: '1px solid #bae6fd' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '1.3rem' }}>📋</span>
                            <div>
                              <div style={{ fontWeight: '600', fontSize: '0.95rem', color: '#0c4a6e' }}>{fileData.file_path?.split('/').pop() || 'Main Document'}</div>
                              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Primary Application Document</div>
                            </div>
                          </div>
                          <button 
                            onClick={() => handleDownload(fileData.id, 'main')}
                            style={{ padding: '8px 18px', background: '#2563eb', color: 'white', borderRadius: '8px', border: 'none', fontWeight: '600', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                          >
                            ⬇ Download
                          </button>
                        </div>

                        {/* Supporting Documents */}
                        {fileData.supporting_documents?.map((sd, idx) => (
                          <div key={sd.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: '#fefce8', borderRadius: '10px', border: '1px solid #fde68a' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{ fontSize: '1.3rem' }}>📎</span>
                              <div>
                                <div style={{ fontWeight: '600', fontSize: '0.95rem', color: '#713f12' }}>{sd.name || `Supporting Document ${idx + 1}`}</div>
                                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Supporting Document #{idx + 1}</div>
                              </div>
                            </div>
                            <button 
                              onClick={() => handleDownload(fileData.id, 'support', sd.id)}
                              style={{ padding: '8px 18px', background: '#d97706', color: 'white', borderRadius: '8px', border: 'none', fontWeight: '600', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                            >
                              ⬇ Download
                            </button>
                          </div>
                        ))}
                      </div>
                  </div>

                  <div style={{ padding: '20px 24px', background: '#f8fafc', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '40px' }}>
                      <div><div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Department</div><div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{fileData.department}</div></div>
                      <div><div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Priority</div><div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{fileData.priority}</div></div>
                      <div><div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Submitted By</div><div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{fileData.uploaded_by_name}</div></div>
                  </div>
                </div>
              )}

              {!fileData && !loading && (
                <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '16px', border: '2px dashed #e2e8f0' }}>
                  <div style={{ color: '#94a3b8', marginBottom: '16px' }}><Search size={48} style={{ margin: '0 auto' }} /></div>
                  <h3 style={{ color: '#64748b' }}>No Application Selected</h3>
                  <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Enter your File ID above to view your document's live status.</p>
                </div>
              )}
            </>
          ) : (
            <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
              <div style={{ padding: '24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '1.4rem', margin: 0 }}>Official Notifications</h2>
                <span style={{ fontSize: '0.95rem', color: '#64748b' }}>{notifications.filter(n => !n.is_read).length} unread</span>
              </div>
              <div style={{ padding: '24px' }}>
                {notifications.length === 0 ? (
                  <p style={{ color: '#64748b', textAlign: 'center', padding: '40px', fontSize: '1.05rem' }}>You have no notifications yet.</p>
                ) : (
                  notifications.map((n) => {
                    // Determine notification type for color coding
                    const isReturned = n.title.includes('Returned') || n.message.includes('RETURNED FOR CORRECTION');
                    const isRejected = n.title.includes('Rejected') || n.message.includes('REJECTED');
                    const isApproved = n.title.includes('Final Approval') || n.message.includes('APPROVED');
                    const isResubmitted = n.title.includes('Resubmitted');
                    
                    let borderColor = '#e2e8f0';
                    let statusBadge = null;
                    if (isApproved) { borderColor = '#16a34a'; statusBadge = { text: '✅ APPROVED', bg: '#dcfce7', color: '#166534' }; }
                    else if (isRejected) { borderColor = '#dc2626'; statusBadge = { text: '❌ REJECTED', bg: '#fef2f2', color: '#991b1b' }; }
                    else if (isReturned) { borderColor = '#d97706'; statusBadge = { text: '⚠️ ACTION REQUIRED', bg: '#fffbeb', color: '#92400e' }; }
                    else if (isResubmitted) { borderColor = '#2563eb'; statusBadge = { text: '🔄 RESUBMITTED', bg: '#eff6ff', color: '#1e40af' }; }
                    
                    return (
                      <div key={n.id} style={{ 
                        padding: '24px', 
                        background: n.is_read ? 'white' : '#fafbff', 
                        borderRadius: '12px', 
                        border: `2px solid ${borderColor}`,
                        borderLeft: `5px solid ${borderColor}`,
                        marginBottom: '16px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                          <div>
                            <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '1.1rem', marginBottom: '4px' }}>{n.title}</div>
                            <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>{new Date(n.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</div>
                          </div>
                          {statusBadge && (
                            <span style={{ padding: '6px 14px', borderRadius: '999px', background: statusBadge.bg, color: statusBadge.color, fontWeight: '700', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                              {statusBadge.text}
                            </span>
                          )}
                        </div>
                        <pre style={{ 
                          fontSize: '1rem', 
                          color: '#334155', 
                          lineHeight: '1.7', 
                          whiteSpace: 'pre-wrap', 
                          wordBreak: 'break-word',
                          fontFamily: "'Segoe UI', 'Roboto', sans-serif",
                          background: '#f8fafc',
                          padding: '20px',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          margin: '0 0 12px 0'
                        }}>{n.message}</pre>
                        {!n.is_read && (
                          <button 
                            onClick={() => markRead(n.id)}
                            style={{ marginTop: '4px', background: '#2563eb', border: 'none', color: 'white', padding: '8px 20px', borderRadius: '8px', fontSize: '0.9rem', cursor: 'pointer', fontWeight: '600' }}
                          >
                            ✓ Mark as Read
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <footer style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: '0.95rem' }}>
        &copy; 2025 PaperLessGov • Digital Seva Portal • National Informatics Centre
      </footer>
    </div>
  );
};

export default CitizenPortal;
