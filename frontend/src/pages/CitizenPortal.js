import React, { useState } from 'react';
import api from '../api';
import { Search, FileText, LogOut, Globe } from 'lucide-react';
import translations from '../i18n';

const CitizenPortal = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('access_token'));
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [fileId, setFileId] = useState('');
  const [fileData, setFileData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState(localStorage.getItem('portal_lang') || 'en');
  const t = translations[lang];

  const handleLangChange = (e) => {
    setLang(e.target.value);
    localStorage.setItem('portal_lang', e.target.value);
  };

  const LangSelector = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <Globe size={16} style={{ color: '#2563eb' }} />
      <select value={lang} onChange={handleLangChange} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.85rem', cursor: 'pointer', background: 'white' }}>
        {Object.keys(translations).map(code => (
          <option key={code} value={code}>{translations[code].name}</option>
        ))}
      </select>
    </div>
  );

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
    } catch (err) {
      setError(t.loginError);
    }
  };

  const handleTrack = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`files/${fileId}/`);
      if (res.data.citizen_email !== localStorage.getItem('user_email')) {
        setError(t.fileNotYours);
        setFileData(null);
      } else {
        setFileData(res.data);
      }
    } catch (err) {
      setError(t.invalidFileId);
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
      const contentDisposition = res.headers['content-disposition'];
      let filename = 'document';
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?(.+)"?/);
        if (match) filename = match[1];
      }
      const blob = new Blob([res.data]);
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (err) {
      alert('Download failed. Please try again.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_name');
    setIsLoggedIn(false);
    setFileData(null);
    setError('');
  };

  if (!isLoggedIn) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#1e293b', fontFamily: 'sans-serif' }}>
        <header style={{ background: 'white', padding: '16px 5%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '700', fontSize: '1.2rem', color: '#2563eb' }}>
            <FileText /> {t.portalTitle}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <LangSelector />
            <div style={{ fontSize: '0.9rem', color: '#64748b' }}>{t.govLabel}</div>
          </div>
        </header>

        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '80px', padding: '20px' }}>
          <div style={{ background: 'white', padding: '40px', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' }}>
            <h2 style={{ marginBottom: '8px' }}>{t.citizenLogin}</h2>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '32px' }}>{t.loginSubtext}</p>
            
            {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.85rem' }}>{error}</div>}
            
            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>{t.emailLabel}</label>
                <input type="email" placeholder="name@example.com" value={credentials.email} onChange={e => setCredentials({...credentials, email: e.target.value})} style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', outline: 'none' }} required />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>{t.passwordLabel}</label>
                <input type="password" placeholder="••••••••" value={credentials.password} onChange={e => setCredentials({...credentials, password: e.target.value})} style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', outline: 'none' }} required />
              </div>
              <button type="submit" style={{ width: '100%', padding: '12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>{t.loginBtn}</button>
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
          <FileText /> {t.portalTitle}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <LangSelector />
          <div style={{ fontSize: '0.9rem', color: '#64748b' }}>{t.welcome}, <b>{localStorage.getItem('user_name')}</b></div>
          <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.9rem' }}><LogOut size={16} /> {t.logout}</button>
        </div>
      </header>

      <main style={{ padding: '40px 5%' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          
          {/* Track Application Section */}
          <div style={{ background: '#2563eb', padding: '40px', borderRadius: '16px', color: 'white', marginBottom: '32px' }}>
            <h1 style={{ marginBottom: '16px', fontSize: '2rem' }}>{t.trackTitle}</h1>
            <p style={{ opacity: 0.9, marginBottom: '24px' }}>{t.trackSubtext}</p>
            <form onSubmit={handleTrack} style={{ display: 'flex', gap: '10px' }}>
              <input value={fileId} onChange={e => setFileId(e.target.value)} placeholder={t.trackPlaceholder} style={{ flex: 1, padding: '14px 20px', borderRadius: '12px', border: 'none', color: '#1e293b', fontSize: '1rem', outline: 'none' }} />
              <button type="submit" disabled={loading} style={{ background: '#1e293b', color: 'white', border: 'none', padding: '0 30px', borderRadius: '12px', fontWeight: '600', cursor: 'pointer' }}>
                {loading ? t.searching : t.trackBtn}
              </button>
            </form>
            {error && <div style={{ color: '#fecaca', marginTop: '12px', fontSize: '0.9rem', fontWeight: '600' }}>{error}</div>}
          </div>

          {/* File Data Display */}
          {fileData && (
            <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
              <div style={{ padding: '24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', marginBottom: '4px' }}>{fileData.name}</h2>
                  <p style={{ color: '#64748b', fontSize: '0.85rem' }}>{t.appId}: <b>#F-{fileData.id}</b></p>
                </div>
                <div style={{ padding: '6px 16px', borderRadius: '999px', background: '#dcfce7', color: '#166534', fontWeight: '700', fontSize: '0.85rem' }}>
                  {fileData.statuses?.slice(-1)[0]?.current_stage}
                </div>
              </div>

              <div style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '20px', color: '#64748b' }}>{t.timeline}</h3>
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

              {/* Documents Section */}
              <div style={{ padding: '24px', borderTop: '1px solid #f1f5f9' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '16px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  📄 {t.docsOnFile} ({1 + (fileData.supporting_documents?.length || 0)})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: '#f0f9ff', borderRadius: '10px', border: '1px solid #bae6fd' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '1.3rem' }}>📋</span>
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '0.95rem', color: '#0c4a6e' }}>{fileData.file_path?.split('/').pop() || 'Main Document'}</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{t.primaryDoc}</div>
                      </div>
                    </div>
                    <button onClick={() => handleDownload(fileData.id, 'main')} style={{ padding: '8px 18px', background: '#2563eb', color: 'white', borderRadius: '8px', border: 'none', fontWeight: '600', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                      ⬇ {t.download}
                    </button>
                  </div>

                  {fileData.supporting_documents?.map((sd, idx) => (
                    <div key={sd.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: '#fefce8', borderRadius: '10px', border: '1px solid #fde68a' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '1.3rem' }}>📎</span>
                        <div>
                          <div style={{ fontWeight: '600', fontSize: '0.95rem', color: '#713f12' }}>{sd.name || `${t.supportDoc} ${idx + 1}`}</div>
                          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{t.supportDoc} #{idx + 1}</div>
                        </div>
                      </div>
                      <button onClick={() => handleDownload(fileData.id, 'support', sd.id)} style={{ padding: '8px 18px', background: '#d97706', color: 'white', borderRadius: '8px', border: 'none', fontWeight: '600', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                        ⬇ {t.download}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ padding: '20px 24px', background: '#f8fafc', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '40px' }}>
                <div><div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{t.department}</div><div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{fileData.department}</div></div>
                <div><div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{t.priority}</div><div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{fileData.priority}</div></div>
                <div><div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{t.submittedBy}</div><div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{fileData.uploaded_by_name}</div></div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!fileData && !loading && (
            <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '16px', border: '2px dashed #e2e8f0' }}>
              <div style={{ color: '#94a3b8', marginBottom: '16px' }}><Search size={48} style={{ margin: '0 auto' }} /></div>
              <h3 style={{ color: '#64748b' }}>{t.noAppSelected}</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>{t.noAppText}</p>
            </div>
          )}

        </div>
      </main>

      <footer style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: '0.95rem' }}>
        {t.footer}
      </footer>
    </div>
  );
};

export default CitizenPortal;
