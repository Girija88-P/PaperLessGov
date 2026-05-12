import React, { useState } from 'react';
import api from '../api';
import { Search, GitBranch, Clock, User, CheckCircle, AlertCircle } from 'lucide-react';

const FileTracking = () => {
  const [fileId, setFileId] = useState('');
  const [fileData, setFileData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!fileId) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`files/${fileId}/`);
      const userRole = localStorage.getItem('user_role');
      const userEmail = localStorage.getItem('user_email');

      if (userRole === 'Citizen') {
        if (res.data.citizen_email !== userEmail) {
          setError("Access Denied: This File ID is not associated with your account.");
          setFileData(null);
          return;
        }
      }
      
      setFileData(res.data);
    } catch (err) {
      setError("File not found or access denied.");
      setFileData(null);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (ts) => {
    const d = new Date(ts);
    return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ marginBottom: '4px' }}>File Tracking</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Track the status and movement of files</p>
      </div>

      <div className="glass-panel" style={{ marginBottom: '24px' }}>
        <form onSubmit={handleTrack} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="glass-input" placeholder="Enter File ID (e.g. 101)" value={fileId} onChange={e => setFileId(e.target.value)} style={{ paddingLeft: '38px', width: '100%' }} />
          </div>
          <button type="submit" disabled={loading} className="btn-primary" style={{ padding: '10px 24px' }}>
            {loading ? 'Tracking...' : 'Track File'}
          </button>
        </form>
        {error && <div style={{ color: 'var(--danger)', fontSize: '0.85rem', marginTop: '10px' }}>{error}</div>}
      </div>

      {fileData && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '24px' }}>
          {/* File Info */}
          <div className="glass-panel">
            <h3 style={{ marginBottom: '20px', fontSize: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>File Details</h3>
            {[
              { label: 'File ID', value: `#F-${fileData.id}` },
              { label: 'Title', value: fileData.name },
              { label: 'Department', value: fileData.department },
              { label: 'Submitted By', value: fileData.uploaded_by_name },
              { label: 'Date Submitted', value: new Date(fileData.upload_date).toLocaleDateString() },
              { label: 'Current Priority', value: fileData.priority, color: fileData.priority === 'Critical' ? 'var(--danger)' : 'var(--warning)' },
              { label: 'Current Status', value: fileData.statuses?.slice(-1)[0]?.current_stage || 'Uploaded', color: 'var(--primary)' },
            ].map(item => (
              <div key={item.label} style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>{item.label}</div>
                <div style={{ fontWeight: '600', color: item.color || 'white' }}>{item.value}</div>
              </div>
            ))}
          </div>

          {/* Timeline */}
          <div className="glass-panel">
            <h3 style={{ marginBottom: '20px', fontSize: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>File Movement History</h3>
            <div style={{ position: 'relative', paddingLeft: '30px' }}>
              <div style={{ position: 'absolute', left: '11px', top: '10px', bottom: '10px', width: '2px', background: 'var(--border)' }} />
              
              {fileData.statuses?.map((s, i) => {
                const isLast = i === fileData.statuses.length - 1;
                return (
                  <div key={i} style={{ position: 'relative', marginBottom: '32px' }}>
                    <div style={{ position: 'absolute', left: '-27px', top: '4px', width: '16px', height: '16px', borderRadius: '50%', background: isLast ? 'var(--success)' : 'var(--border)', border: '4px solid var(--bg-dark)', zIndex: 1 }}>
                      {isLast && <CheckCircle size={8} color="white" style={{ position: 'absolute', top: '0px', left: '0px' }} />}
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontWeight: '700', color: isLast ? 'var(--success)' : 'white' }}>{s.current_stage}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatDate(s.timestamp)}</span>
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <User size={12} /> {s.approved_by_name || fileData.uploaded_by_name}
                      </div>
                      {s.remarks && (
                        <div style={{ marginTop: '8px', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', fontSize: '0.8rem', border: '1px solid var(--border)' }}>
                          {s.remarks}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ background: 'rgba(16,185,129,0.1)', padding: '12px', borderRadius: '8px', border: '1px solid var(--success)', display: 'flex', alignItems: 'center', gap: '10px' }}>
               <CheckCircle size={18} color="var(--success)" />
               <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--success)' }}>Current Status: {fileData.statuses?.slice(-1)[0]?.current_stage}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileTracking;
