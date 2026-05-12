import React, { useState } from 'react';
import api from '../api';
import { Upload, FileText, Send, X, AlertCircle } from 'lucide-react';

const CreateFile = () => {
  const [form, setForm] = useState({ name: '', department: 'Finance', priority: 'Normal', description: '', citizen_email: '', citizen_phone: '' });
  const [mainDoc, setMainDoc] = useState(null);
  const [supportingDocs, setSupportingDocs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!mainDoc) { alert("Please select a main document."); return; }
    
    setLoading(true);
    const formData = new FormData();
    formData.append('name', form.name);
    formData.append('department', form.department);
    formData.append('priority', form.priority);
    formData.append('description', form.description);
    formData.append('citizen_email', form.citizen_email);
    formData.append('citizen_phone', form.citizen_phone);
    formData.append('file_path', mainDoc);
    
    supportingDocs.forEach(file => formData.append('supporting_documents', file));

    try {
      await api.post('files/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSuccess(true);
      setForm({ name: '', department: 'Finance', priority: 'Normal', description: '', citizen_email: '', citizen_phone: '' });
      setMainDoc(null);
      setSupportingDocs([]);
    } catch (err) {
      alert("Error: " + (err.response?.data?.detail || "Upload failed"));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="glass-panel" style={{ textAlign: 'center', padding: '60px' }}>
        <div style={{ background: 'var(--success)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <FileText size={32} color="white" />
        </div>
        <h2>File Submitted Successfully!</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Your document package has been uploaded and routed for AI analysis.</p>
        
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', textAlign: 'left', marginBottom: '24px', maxWidth: '500px', margin: '0 auto 24px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: '700', marginBottom: '10px', textTransform: 'uppercase' }}>Preview: Message Sent to Citizen</div>
          <div style={{ fontSize: '0.9rem', lineHeight: '1.6', color: 'var(--text-main)' }}>
            Dear Citizen,<br/><br/>
            Your application <b>"{form.name}"</b> has been received.<br/>
            <b>File ID:</b> #F-AUTO<br/>
            <b>Track Link:</b> <span style={{ color: 'var(--primary)' }}>http://paperless.gov.in/citizen-portal</span><br/><br/>
            Log in with your email <b>({form.citizen_email})</b> and use your <b>Phone Number</b> as the password.<br/><br/>
            - PaperLessGov Team
          </div>
        </div>

        <button onClick={() => setSuccess(false)} className="btn-primary">Create Another File</button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ marginBottom: '4px' }}>Create New File</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Fill the details below to create a new file package</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
        <div className="glass-panel">
          <h3 style={{ marginBottom: '20px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} color="var(--primary)" /> File Information
          </h3>
          <div className="input-group">
            <label>Title *</label>
            <input className="glass-input" placeholder="Enter file title" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="input-group">
              <label>Department *</label>
              <select className="glass-input" value={form.department} onChange={e => setForm({...form, department: e.target.value})}>
                <option>Finance</option><option>Health</option><option>Transport</option><option>Education</option><option>Urban Planning</option>
              </select>
            </div>
            <div className="input-group">
              <label>Priority *</label>
              <select className="glass-input" value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}>
                <option>Normal</option><option>Urgent</option><option>Critical</option>
              </select>
            </div>
          </div>
          <div className="input-group">
            <label>Description</label>
            <textarea className="glass-input" rows={4} placeholder="Enter file description..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
          </div>

          <h3 style={{ margin: '20px 0 16px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
            <Send size={18} color="var(--success)" /> Citizen Notification Details
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="input-group">
              <label>Citizen Email *</label>
              <input type="email" className="glass-input" placeholder="citizen@example.com" value={form.citizen_email} onChange={e => setForm({...form, citizen_email: e.target.value})} required />
            </div>
            <div className="input-group">
              <label>Citizen Phone</label>
              <input type="text" className="glass-input" placeholder="+91 9876543210" value={form.citizen_phone} onChange={e => setForm({...form, citizen_phone: e.target.value})} />
            </div>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '8px' }}>
            Citizen will receive a login link and File ID: <b>#F-(Next)</b> to track this document online.
          </p>
          <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(59,130,246,0.1)', borderRadius: '8px', fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', gap: '8px' }}>
            <AlertCircle size={14} style={{ flexShrink: 0 }} />
            The AI Engine will scan all attached documents for text, dates, signatures, and mandatory fields.
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="glass-panel">
            <h3 style={{ marginBottom: '20px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Upload size={18} color="var(--primary)" /> Upload Documents
            </h3>
            
            <div className="input-group">
              <label>Main Document (Primary Letter / Application)</label>
              <div style={{ border: '2px dashed var(--border)', borderRadius: '12px', padding: '20px', textAlign: 'center', cursor: 'pointer', position: 'relative' }}>
                <input type="file" onChange={e => setMainDoc(e.target.files[0])} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                {mainDoc ? (
                  <div style={{ color: 'var(--success)', fontWeight: '600' }}>✓ {mainDoc.name}</div>
                ) : (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Drag & drop or <span style={{ color: 'var(--primary)' }}>Browse Files</span></div>
                )}
              </div>
            </div>

            <div className="input-group">
              <label>Supporting Documents (Optional)</label>
              <div style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '10px' }}>
                <input type="file" multiple onChange={e => setSupportingDocs([...supportingDocs, ...Array.from(e.target.files)])} style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }} />
              </div>
              {supportingDocs.length > 0 && (
                <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {supportingDocs.map((f, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '5px 10px', borderRadius: '4px', fontSize: '0.75rem' }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                      <X size={12} style={{ cursor: 'pointer', color: 'var(--danger)' }} onClick={() => setSupportingDocs(supportingDocs.filter((_, idx) => idx !== i))} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button type="button" onClick={() => window.history.back()} style={{ flex: 1, padding: '12px', borderRadius: '8px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary" style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              {loading ? 'Processing...' : <><Send size={16} /> Submit File Package</>}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateFile;
