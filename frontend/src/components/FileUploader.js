import React, { useState } from 'react';
import api from '../api';
import { UploadCloud, FileText, X, Plus } from 'lucide-react';

const FileUploader = ({ onUploadSuccess }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mainFile, setMainFile] = useState(null);
  const [supportingFiles, setSupportingFiles] = useState([]);
  const [formData, setFormData] = useState({ name: '', department: 'Finance' });
  const [verified, setVerified] = useState(false);

  const handleSupportingChange = (e) => {
    setSupportingFiles(Array.from(e.target.files));
  };

  const removeSupporting = (index) => {
    setSupportingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!mainFile) { alert("Please select a Main Document to upload."); return; }

    const data = new FormData();
    data.append('name', formData.name);
    data.append('department', formData.department);
    data.append('file_path', mainFile);
    if (formData.citizen_email) data.append('citizen_email', formData.citizen_email);
    if (formData.citizen_phone) data.append('citizen_phone', formData.citizen_phone);
    supportingFiles.forEach(sf => data.append('supporting_documents', sf));

    try {
      await api.post('files/', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      setIsOpen(false);
      setFormData({ name: '', department: 'Finance' });
      setMainFile(null);
      setSupportingFiles([]);
      setVerified(false);
      onUploadSuccess();
    } catch (err) {
      alert("Upload failed. " + JSON.stringify(err.response?.data));
    }
  };

  if (!isOpen) {
    return (
      <button onClick={() => setIsOpen(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <UploadCloud size={20} /> New Document Package
      </button>
    );
  }

  return (
    <div className="glass-panel" style={{ marginBottom: '24px', border: '1px solid var(--primary)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0 }}>Upload Document Package</h3>
        <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.5rem' }}>&times;</button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Basic Info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div className="input-group" style={{ margin: 0 }}>
            <label>Package / Case Name</label>
            <input type="text" className="glass-input" required value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Road Contract Approval" />
          </div>
          <div className="input-group" style={{ margin: 0 }}>
            <label>Department</label>
            <select className="glass-input" value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })}>
              <option value="Finance">Finance</option>
              <option value="Health">Health</option>
              <option value="Transport">Transport</option>
              <option value="Education">Education</option>
              <option value="Urban Planning">Urban Planning</option>
            </select>
          </div>
        </div>

        {/* Citizen Details */}
        <div style={{ background: 'rgba(59,130,246,0.05)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(59,130,246,0.1)', marginBottom: '16px' }}>
          <label style={{ color: 'var(--primary)', fontWeight: '700', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '12px', display: 'block' }}>
            📬 Citizen Notification Details (Used for automatic status updates)
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="input-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '0.75rem' }}>Citizen Email</label>
              <input type="email" className="glass-input" value={formData.citizen_email || ''}
                onChange={e => setFormData({ ...formData, citizen_email: e.target.value })} placeholder="email@citizen.com" />
            </div>
            <div className="input-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '0.75rem' }}>Citizen Phone</label>
              <input type="text" className="glass-input" value={formData.citizen_phone || ''}
                onChange={e => setFormData({ ...formData, citizen_phone: e.target.value })} placeholder="+91 XXXXX XXXXX" />
            </div>
          </div>
        </div>

        {/* Main Document */}
        <div className="input-group">
          <label style={{ color: 'var(--primary)', fontWeight: '600' }}>📄 Main Document (Primary Letter / Application)</label>
          <input type="file" className="glass-input" required accept=".pdf,.txt"
            onChange={e => setMainFile(e.target.files[0])} style={{ padding: '8px' }} />
          {mainFile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', color: 'var(--success)', fontSize: '0.85rem' }}>
              <FileText size={14} /> {mainFile.name}
            </div>
          )}
          <small style={{ color: 'var(--text-muted)' }}>The AI Engine will scan this document for text, dates, signatures, and mandatory fields.</small>
        </div>

        {/* Supporting Documents */}
        <div className="input-group">
          <label style={{ fontWeight: '600' }}>
            📎 Supporting Documents (receipts, annexures, etc.)
          </label>
          <input type="file" id="supp-docs" multiple accept=".pdf,.txt" style={{ display: 'none' }}
            onChange={e => {
              setSupportingFiles([...supportingFiles, ...Array.from(e.target.files)]);
              e.target.value = ""; // Clear value to allow re-selection and multiple clicks
            }} />
          
          <div style={{ marginTop: '10px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px' }}>
            {supportingFiles.map((sf, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '4px', background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '8px', border: '1px solid var(--border)', position: 'relative' }}>
                <button type="button" onClick={() => removeSupporting(i)} style={{ position: 'absolute', right: '4px', top: '4px', background: 'rgba(239,68,68,0.1)', border: 'none', color: 'var(--danger)', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <X size={12} />
                </button>
                <FileText size={20} color="var(--primary)" style={{ marginBottom: '4px' }} />
                <span style={{ fontSize: '0.7rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sf.name}</span>
              </div>
            ))}
            <div onClick={() => document.getElementById('supp-docs').click()} 
              style={{ border: '2px dashed var(--border)', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <Plus size={20} />
              <span style={{ fontSize: '0.7rem', marginTop: '4px' }}>Add More</span>
            </div>
          </div>
          <small style={{ color: 'var(--text-muted)', marginTop: '8px', display: 'block' }}>AI will scan ALL attached files and combine their content for a complete analysis.</small>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px', marginTop: '20px', display: 'flex', alignItems: 'flex-start', gap: '12px', border: '1px solid rgba(59,130,246,0.2)' }}>
          <input type="checkbox" id="upload-verify" checked={verified} onChange={e => setVerified(e.target.checked)} style={{ width: '20px', height: '20px', cursor: 'pointer', marginTop: '2px' }} />
          <label htmlFor="upload-verify" style={{ fontSize: '0.9rem', color: 'white', cursor: 'pointer', lineHeight: '1.4' }}>
            I have verified all documents, citizen contact details, and department selection. <b>Proceed with system submission?</b>
          </label>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button type="submit" disabled={!verified} className="btn-primary" style={{ padding: '12px 32px', opacity: verified ? 1 : 0.5, cursor: verified ? 'pointer' : 'not-allowed' }}>
            Submit Package to System
          </button>
        </div>
      </form>
    </div>
  );
};

export default FileUploader;
