import React from 'react';
import { FileText, Clock, AlertCircle, CheckCircle, XCircle, Paperclip, ChevronDown, ChevronUp, History, Upload, Send, Edit, ShieldCheck, Plus, Folder } from 'lucide-react';
import api from '../api';
import { useState } from 'react';

const resolveFileUrl = (path) => {
  if (!path) return '#';
  if (path.startsWith('http')) return path;
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.') || window.location.hostname.startsWith('10.');
  const base = isLocal ? `http://${window.location.hostname}:8000` : 'https://paperlessgov-backend.onrender.com';
  return `${base}/media/${path}`;
};

const FileCard = ({ file, role, refreshData }) => {
  const [showDocs, setShowDocs] = useState(false);
  const [showLog, setShowLog] = useState(false);
  
  // Remark Modal State
  const [remarkModal, setRemarkModal] = useState({ open: false, decision: '', text: '' });
  const [remarkVerified, setRemarkVerified] = useState(false);

  // Resubmit Modal State
  const [isResubmitOpen, setIsResubmitOpen] = useState(false);
  const [resubmitVerified, setResubmitVerified] = useState(false);
  const [editForm, setEditForm] = useState({ 
    name: file.name, 
    department: file.department, 
    priority: file.priority, 
    description: file.description || '',
    remarks: ''
  });
  const [newMainDoc, setNewMainDoc] = useState(null);
  const [newSupportingDocs, setNewSupportingDocs] = useState([]);
  const [docsToDelete, setDocsToDelete] = useState([]); // Array of IDs to delete
  const [submitting, setSubmitting] = useState(false);

  const formatDateTime = (timestamp) => {
    if (!timestamp) return '—';
    const d = new Date(timestamp);
    return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const getLogIcon = (stage) => {
    switch (stage) {
      case 'Final Approval':         return { icon: '✅', color: 'var(--success)' };
      case 'Rejected':               return { icon: '❌', color: 'var(--danger)' };
      case 'Returned to Clerk':      return { icon: '↩️', color: 'var(--warning)' };
      case 'Returned for Correction':return { icon: '↩️', color: 'var(--warning)' };
      case 'Officer Review':         return { icon: '🔍', color: 'var(--warning)' };
      case 'Higher Authority Review':return { icon: '⬆️', color: 'var(--primary)' };
      case 'Head Approval':          return { icon: '🎖️', color: 'var(--success)' };
      default:                       return { icon: '📤', color: 'var(--primary)' };
    }
  };

  const getBadgeClass = (priority) => {
    switch (priority) {
      case 'Critical': return 'badge badge-critical';
      case 'Urgent': return 'badge badge-urgent';
      default: return 'badge badge-normal';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Final Approval': return <CheckCircle size={16} color="var(--success)" />;
      case 'Rejected': return <XCircle size={16} color="var(--danger)" />;
      case 'Returned to Clerk': 
      case 'Returned for Correction': return <AlertCircle size={16} color="#f59e0b" />;
      case 'Officer Review': return <Clock size={16} color="var(--warning)" />;
      default: return <FileText size={16} color="var(--primary)" />;
    }
  };

  const currentStatus = file.statuses && file.statuses.length > 0
    ? file.statuses[file.statuses.length - 1].current_stage
    : 'Uploaded';

  const handleAction = (decision) => {
    setRemarkVerified(false);
    setRemarkModal({ open: true, decision, text: '' });
  };

  const submitAction = async () => {
    try {
      await api.post(`files/${file.id}/transition/`, { 
        decision: remarkModal.decision, 
        remarks: remarkModal.text || `Actioned by ${role}` 
      });
      setRemarkModal({ ...remarkModal, open: false });
      refreshData();
    } catch (err) {
      alert("Error performing action: " + err.response?.data?.error);
    }
  };

  const handleResubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData();
    formData.append('name', editForm.name);
    formData.append('department', editForm.department);
    formData.append('priority', editForm.priority);
    formData.append('description', editForm.description);
    formData.append('remarks', editForm.remarks);
    if (newMainDoc) formData.append('file_path', newMainDoc);
    newSupportingDocs.forEach(sf => formData.append('supporting_documents', sf));
    docsToDelete.forEach(id => formData.append('delete_supporting_ids', id));

    try {
      await api.post(`files/${file.id}/resubmit/`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setIsResubmitOpen(false);
      setNewSupportingDocs([]);
      setDocsToDelete([]);
      refreshData();
    } catch (err) {
      alert("Resubmit failed: " + (err.response?.data?.detail || "Network error"));
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    if (status === 'Final Approval') return 'var(--success)';
    if (status === 'Rejected' || status === 'Returned to Clerk' || status === 'Returned for Correction') return 'var(--danger)';
    if (['Officer Review', 'Higher Authority Review', 'Head Approval'].includes(status)) return 'var(--warning)';
    return 'white';
  };

  const isReturned = currentStatus === 'Returned to Clerk' || currentStatus === 'Returned for Correction';

  const canEditPostForward = 
    (role === 'Clerk' && currentStatus === 'Officer Review') ||
    (role === 'Officer' && currentStatus === 'Higher Authority Review') ||
    (role === 'Higher Authority' && currentStatus === 'Head Approval');

  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h3 style={{ fontSize: '1.05rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {getStatusIcon(currentStatus)} {file.name}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            #{file.id} · {file.department} · by {file.uploaded_by_name}
          </p>
        </div>
        <span className={getBadgeClass(file.priority)}>{file.priority}</span>
      </div>

      <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '6px', padding: '6px 12px', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ color: 'var(--text-muted)' }}>Status</span>
        <span style={{ fontWeight: 'bold', color: getStatusColor(currentStatus) }}>{currentStatus}</span>
      </div>

      {file.ai_prediction && (
        <div style={{ background: 'rgba(59, 130, 246, 0.05)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)', marginBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={18} color="var(--primary)" />
                <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>AI Decision Prediction</span>
             </div>
             <div style={{ 
               padding: '4px 10px', 
               borderRadius: '6px', 
               fontSize: '0.75rem', 
               fontWeight: '800',
               background: file.ai_prediction.decision === 'REJECT' ? 'rgba(239, 68, 68, 0.1)' : (file.ai_prediction.decision === 'APPROVE' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)'),
               color: file.ai_prediction.decision === 'REJECT' ? 'var(--danger)' : (file.ai_prediction.decision === 'APPROVE' ? 'var(--success)' : 'var(--primary)'),
               border: `1px solid ${file.ai_prediction.decision === 'REJECT' ? 'var(--danger)' : (file.ai_prediction.decision === 'APPROVE' ? 'var(--success)' : 'var(--primary)')}`
             }}>
               {file.ai_prediction.decision}
             </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '8px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Confidence Score</span>
            <span style={{ fontWeight: 'bold' }}>{file.ai_prediction.decision === 'APPROVE' ? file.ai_prediction.approval_probability : (file.ai_prediction.decision === 'REJECT' ? file.ai_prediction.rejection_probability : 70)}%</span>
          </div>
          <div className="ai-bar-bg" style={{ height: '6px', marginBottom: '12px' }}>
            <div className="ai-bar-fill" style={{ 
              width: `${file.ai_prediction.decision === 'APPROVE' ? file.ai_prediction.approval_probability : (file.ai_prediction.decision === 'REJECT' ? file.ai_prediction.rejection_probability : 70)}%`,
              background: file.ai_prediction.decision === 'REJECT' ? 'var(--danger)' : (file.ai_prediction.decision === 'APPROVE' ? 'var(--success)' : 'var(--primary)')
            }}></div>
          </div>

          <div style={{ fontSize: '0.8rem', color: 'white', marginBottom: '8px', lineHeight: '1.4' }}>
            <b>Reasoning:</b> {file.ai_prediction.reason}
          </div>

          {file.ai_prediction.key_factors && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
              {file.ai_prediction.key_factors.split(',').map((factor, idx) => (
                <span key={idx} style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                  {factor.trim()}
                </span>
              ))}
            </div>
          )}

          {file.ai_prediction.flags && (
            <div style={{ marginTop: '10px', padding: '6px 10px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', borderRadius: '6px', fontSize: '0.7rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
               <AlertCircle size={12} /> {file.ai_prediction.flags}
            </div>
          )}
        </div>
      )}

      <div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '6px' }}>
          <a href={resolveFileUrl(file.file_path)} target="_blank" rel="noopener noreferrer"
            style={{ width: 'fit-content', display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--primary)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: '600', background: 'rgba(59,130,246,0.1)', padding: '6px 12px', borderRadius: '8px' }}>
            <FileText size={14} /> View Main Document
          </a>
          
          {file.supporting_documents?.length > 0 && (
            <div style={{ marginTop: '4px' }}>
              <button onClick={() => setShowDocs(!showDocs)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'white', padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', width: '100%', justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Folder size={14} color="var(--warning)" /> Supporting Documents ({file.supporting_documents.length})</span>
                {showDocs ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              
              {showDocs && (
                <div style={{ marginTop: '8px', padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {file.supporting_documents.map((sd, idx) => (
                    <a key={idx} href={resolveFileUrl(sd.file_path)} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.78rem', padding: '4px 8px', borderRadius: '4px' }}>
                      <Paperclip size={12} /> {sd.name}
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <button onClick={() => setShowLog(!showLog)} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem' }}>
        <History size={12} /> Activity Log ({file.statuses?.length}) {showLog ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      {showLog && (
        <div style={{ marginTop: '10px', borderLeft: '2px solid var(--border)', paddingLeft: '15px' }}>
          {[...file.statuses].reverse().slice(0, 3).map((s, i) => (
            <div key={i} style={{ marginBottom: '10px', fontSize: '0.75rem' }}>
              <div style={{ color: 'white', fontWeight: '600' }}>{s.current_stage}</div>
              <div style={{ color: 'var(--text-muted)' }}>{s.remarks}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
        {role === 'Clerk' && isReturned ? (
          <button onClick={() => { setResubmitVerified(false); setIsResubmitOpen(true); }} className="btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Edit size={16} /> Edit & Forward to Officer
          </button>
        ) : canEditPostForward ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
             <p style={{ fontSize: '0.7rem', color: 'var(--success)', margin: '0 0 4px 0', textAlign: 'center' }}>
               ✨ Since the next authority hasn't reacted yet, you can still update this file.
             </p>
             <button onClick={() => { setResubmitVerified(false); setIsResubmitOpen(true); }} style={{ width: '100%', background: 'rgba(59,130,246,0.1)', border: '1px solid var(--primary)', color: 'var(--primary)', padding: '8px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
               <Edit size={14} /> Update & Sync File
             </button>
          </div>
        ) : role !== 'Clerk' && currentStatus !== 'Final Approval' && currentStatus !== 'Rejected' && (
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button onClick={() => handleAction('approve')} style={{ flex: 1, padding: '8px', background: 'var(--success)', border: 'none', color: 'white', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer' }}>Accept</button>
            <button onClick={() => handleAction('escalate')} style={{ flex: 1, padding: '8px', background: 'var(--primary)', border: 'none', color: 'white', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer' }}>Escalate</button>
            <button onClick={() => handleAction('return')} style={{ flex: 1, padding: '8px', background: '#f59e0b', border: 'none', color: 'white', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer' }}>Return</button>
            <button onClick={() => handleAction('reject')} style={{ flex: 1, padding: '8px', background: 'var(--danger)', border: 'none', color: 'white', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer' }}>Reject</button>
          </div>
        )}
      </div>

      {/* Remarks Modal with Safety Checkbox */}
      {remarkModal.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div className="glass-panel" style={{ width: '90%', maxWidth: '420px', border: '1px solid rgba(255,255,255,0.15)' }}>
            <h3 style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
               <ShieldCheck size={20} color="var(--primary)" /> Finalize {remarkModal.decision.charAt(0).toUpperCase() + remarkModal.decision.slice(1)}
            </h3>
            <div className="input-group">
              <label>Remarks / Comments</label>
              <textarea className="glass-input" rows={4} placeholder="Add comments for the next stage..." value={remarkModal.text} onChange={e => setRemarkModal({...remarkModal, text: e.target.value})} style={{ width: '100%', resize: 'none' }} />
            </div>
            
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px', marginTop: '10px', display: 'flex', alignItems: 'flex-start', gap: '10px', border: '1px solid rgba(59,130,246,0.2)' }}>
              <input type="checkbox" checked={remarkVerified} onChange={e => setRemarkVerified(e.target.checked)} style={{ width: '18px', height: '18px', cursor: 'pointer', marginTop: '2px' }} id="safety-check" />
              <label htmlFor="safety-check" style={{ fontSize: '0.8rem', color: 'white', cursor: 'pointer', lineHeight: 1.4 }}>
                I have verified all documents and I am sure about this <b>{remarkModal.decision}</b> decision.
              </label>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button onClick={() => setRemarkModal({ ...remarkModal, open: false })} style={{ flex: 1, background: 'transparent', color: 'white', border: '1px solid var(--border)', borderRadius: '6px', padding: '10px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={submitAction} disabled={!remarkVerified} className="btn-primary" style={{ flex: 1.5, opacity: remarkVerified ? 1 : 0.5, cursor: remarkVerified ? 'pointer' : 'not-allowed' }}>Confirm Decision</button>
            </div>
          </div>
        </div>
      )}

      {/* Resubmit Modal with Safety Checkbox */}
      {isResubmitOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.4rem', margin: 0 }}>Edit & Resubmit File</h2>
              <XCircle size={24} style={{ cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setIsResubmitOpen(false)} />
            </div>
            
            <form onSubmit={handleResubmit}>
              <div className="input-group"><label>File Title</label><input className="glass-input" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} required /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="input-group"><label>Department</label><select className="glass-input" value={editForm.department} onChange={e => setEditForm({...editForm, department: e.target.value})}><option>Finance</option><option>Health</option><option>Transport</option><option>Education</option><option>Urban Planning</option></select></div>
                <div className="input-group"><label>Priority</label><select className="glass-input" value={editForm.priority} onChange={e => setEditForm({...editForm, priority: e.target.value})}><option>Normal</option><option>Urgent</option><option>Critical</option></select></div>
              </div>
              <div className="input-group" style={{ background: 'rgba(59,130,246,0.05)', padding: '15px', borderRadius: '10px', border: '1px solid rgba(59,130,246,0.2)' }}>
                <label style={{ color: 'var(--primary)', fontWeight: '700', marginBottom: '10px', display: 'block' }}>📄 Main Document (Primary Application)</label>
                
                {/* Current Main File Info */}
                <div style={{ background: 'rgba(0,0,0,0.1)', padding: '8px 12px', borderRadius: '6px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid var(--border)' }}>
                  <FileText size={14} color="var(--primary)" />
                  <span style={{ fontSize: '0.8rem', color: 'white' }}>Current: <b>{file.file_path?.split('/').pop()}</b></span>
                </div>

                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '5px', display: 'block' }}>Replace with new file (Optional):</label>
                <input type="file" onChange={e => setNewMainDoc(e.target.files[0])} style={{ fontSize: '0.8rem' }} />
              </div>

              {/* Existing Supporting Documents */}
              {file.supporting_documents && file.supporting_documents.length > 0 && (
                <div style={{ marginTop: '15px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>
                    📦 Currently Attached Supporting Files:
                  </label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', background: 'rgba(0,0,0,0.1)', padding: '10px', borderRadius: '8px' }}>
                    {file.supporting_documents.filter(sd => !docsToDelete.includes(sd.id)).map((sd, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', border: '1px solid var(--border)', position: 'relative' }}>
                        <Paperclip size={12} color="var(--text-muted)" />
                        <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sd.name}</span>
                        <button type="button" onClick={() => setDocsToDelete([...docsToDelete, sd.id])} 
                          style={{ marginLeft: '4px', background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0 2px', display: 'flex', alignItems: 'center' }}>
                          <XCircle size={12} />
                        </button>
                      </div>
                    ))}
                    {docsToDelete.length > 0 && (
                      <button type="button" onClick={() => setDocsToDelete([])} style={{ fontSize: '0.7rem', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer' }}>
                        Undo Deletions
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Add New Supporting Documents */}
              <div className="input-group" style={{ marginTop: '15px' }}>
                <label style={{ fontWeight: '600', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  📎 Add More Supporting Documents
                </label>
                <input type="file" id={`update-supp-${file.id}`} multiple accept=".pdf,.txt" style={{ display: 'none' }}
                  onChange={e => {
                    setNewSupportingDocs([...newSupportingDocs, ...Array.from(e.target.files)]);
                    e.target.value = "";
                  }} />
                
                <div style={{ marginTop: '10px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px' }}>
                  {newSupportingDocs.map((sf, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '4px', background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '8px', border: '1px solid var(--border)', position: 'relative' }}>
                      <button type="button" onClick={() => setNewSupportingDocs(prev => prev.filter((_, idx) => idx !== i))} style={{ position: 'absolute', right: '4px', top: '4px', background: 'rgba(239,68,68,0.1)', border: 'none', color: 'var(--danger)', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <XCircle size={12} />
                      </button>
                      <FileText size={18} color="var(--primary)" />
                      <span style={{ fontSize: '0.65rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sf.name}</span>
                    </div>
                  ))}
                  <div onClick={() => document.getElementById(`update-supp-${file.id}`).click()} 
                    style={{ border: '2px dashed var(--border)', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)', minHeight: '60px' }}>
                    <Plus size={18} />
                    <span style={{ fontSize: '0.65rem', marginTop: '2px' }}>Add File</span>
                  </div>
                </div>
              </div>

              <div className="input-group" style={{ marginTop: '15px' }}><label>Remarks for Correction</label><textarea className="glass-input" rows={2} placeholder="Explain what you corrected..." value={editForm.remarks} onChange={e => setEditForm({...editForm, remarks: e.target.value})} /></div>

              {/* Safety Checkbox for Resubmit */}
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px', marginTop: '10px', display: 'flex', alignItems: 'flex-start', gap: '10px', border: '1px solid rgba(59,130,246,0.2)' }}>
                <input type="checkbox" checked={resubmitVerified} onChange={e => setResubmitVerified(e.target.checked)} style={{ width: '18px', height: '18px', cursor: 'pointer', marginTop: '2px' }} id="resubmit-check" />
                <label htmlFor="resubmit-check" style={{ fontSize: '0.8rem', color: 'white', cursor: 'pointer', lineHeight: 1.4 }}>
                  I have corrected the documents and I am ready to forward this package back to the Officer.
                </label>
              </div>

              <button type="submit" disabled={submitting || !resubmitVerified} className="btn-primary" style={{ width: '100%', marginTop: '20px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', opacity: resubmitVerified ? 1 : 0.5 }}>
                {submitting ? 'Resubmitting...' : <><Send size={18} /> Confirm & Forward to Officer Review</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileCard;
