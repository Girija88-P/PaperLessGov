import React, { useEffect, useState, useMemo } from 'react';
import api from '../api';
import FileUploader from '../components/FileUploader';
import FileCard from '../components/FileCard';
import { Search, SlidersHorizontal, X } from 'lucide-react';

const Dashboard = () => {
  const [files, setFiles] = useState([]);
  const [role, setRole] = useState('');
  const [name, setName] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('all'); // 'relevant' or 'all'
  const [filters, setFilters] = useState({ department: '', status: '', priority: '', dateFrom: '', dateTo: '' });

  const fetchFiles = async () => {
    try { const res = await api.get('files/'); setFiles(res.data); } catch (err) {}
  };

  useEffect(() => {
    setRole(localStorage.getItem('user_role') || '');
    setName(localStorage.getItem('user_name') || '');
    fetchFiles();
  }, []);

  const filteredFiles = useMemo(() => files.filter(file => {
    const stage = file.statuses?.length > 0 ? file.statuses[file.statuses.length - 1].current_stage : 'Uploaded';
    const q = search.toLowerCase();

    // Hierarchy Relevance Check
    if (viewMode === 'relevant' && role !== 'Admin') {
       const s = stage.trim();
       if (role === 'Clerk' && !['Returned to Clerk', 'Returned for Correction', 'Uploaded', 'Officer Review', 'Higher Authority Review', 'Head Approval', 'Final Approval'].includes(s)) return false;
       if (role === 'Officer' && s !== 'Officer Review' && s !== 'Returned to Clerk') return false;
       if (role === 'Higher Authority' && s !== 'Higher Authority Review') return false;
       if (role === 'Head' && s !== 'Head Approval' && s !== 'Final Approval') return false;
    }

    return (!search || file.name?.toLowerCase().includes(q) || file.department?.toLowerCase().includes(q) || file.uploaded_by_name?.toLowerCase().includes(q))
      && (!filters.department || file.department === filters.department)
      && (!filters.status || stage === filters.status)
      && (!filters.priority || file.priority === filters.priority)
      && (!filters.dateFrom || new Date(file.upload_date) >= new Date(filters.dateFrom))
      && (!filters.dateTo || new Date(file.upload_date) <= new Date(filters.dateTo + 'T23:59:59'));
  }), [files, search, filters, viewMode, role]);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;
  const approved = files.filter(f => f.statuses?.slice(-1)[0]?.current_stage === 'Final Approval').length;
  const pending = files.filter(f => ['Officer Review', 'Higher Authority Review', 'Head Approval'].includes(f.statuses?.slice(-1)[0]?.current_stage)).length;
  const rejected = files.filter(f => f.statuses?.slice(-1)[0]?.current_stage === 'Rejected').length;

  return (
    <div>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1>Welcome back!</h1>
          <p style={{ color: 'var(--text-muted)' }}>{role === 'Clerk' ? 'Submit and track your applications.' : 'Manage and review hierarchical documents.'}</p>
        </div>
        {role === 'Clerk' && <FileUploader onUploadSuccess={fetchFiles} />}
      </header>

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
        {[
          { label: 'Total Files', value: files.length, color: 'var(--primary)' },
          { label: 'Pending', value: pending, color: 'var(--warning)' },
          { label: 'Approved', value: approved, color: 'var(--success)' },
          { label: 'Rejected', value: rejected, color: 'var(--danger)' },
        ].map((m, i) => (
          <div key={i} className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '8px' }}>{m.label}</div>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: m.color }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Stream Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <h2 style={{ fontSize: '1.3rem', margin: 0 }}>Document Workflow Stream</h2>
        <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '10px' }}>
           <button onClick={() => setViewMode('relevant')} style={{ border: 'none', padding: '6px 14px', borderRadius: '7px', fontSize: '0.82rem', fontWeight: '600', cursor: 'pointer', background: viewMode === 'relevant' ? 'var(--primary)' : 'transparent', color: viewMode === 'relevant' ? 'white' : 'var(--text-muted)' }}>My Hierarchy</button>
           <button onClick={() => setViewMode('all')} style={{ border: 'none', padding: '6px 14px', borderRadius: '7px', fontSize: '0.82rem', fontWeight: '600', cursor: 'pointer', background: viewMode === 'all' ? 'var(--primary)' : 'transparent', color: viewMode === 'all' ? 'white' : 'var(--text-muted)' }}>All Files</button>
        </div>
      </div>

      {/* Search & Filters */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input type="text" className="glass-input" placeholder="Search by name, department, uploader..."
              value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '36px', width: '100%' }} />
            {search && <button onClick={() => setSearch('')} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={14} /></button>}
          </div>
          <button onClick={() => setShowFilters(!showFilters)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: showFilters ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)', border: `1px solid ${showFilters ? 'var(--primary)' : 'var(--border)'}`, color: showFilters ? 'var(--primary)' : 'var(--text-muted)', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>
            <SlidersHorizontal size={15} /> Filters {activeFilterCount > 0 && <span style={{ background: 'var(--primary)', color: 'white', borderRadius: '999px', padding: '1px 7px', fontSize: '0.75rem' }}>{activeFilterCount}</span>}
          </button>
          {(activeFilterCount > 0 || search) && <button onClick={() => { setFilters({ department: '', status: '', priority: '', dateFrom: '', dateTo: '' }); setSearch(''); }} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'transparent', border: '1px solid var(--danger)', color: 'var(--danger)', padding: '10px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}><X size={14} /> Clear All</button>}
        </div>
        {showFilters && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '12px', marginTop: '12px', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid var(--border)' }}>
            {[
              { label: 'Department', key: 'department', options: ['Finance','Health','Transport','Education','Urban Planning'] },
              { label: 'Status', key: 'status', options: ['Officer Review', 'Higher Authority Review', 'Head Approval', 'Final Approval', 'Returned to Clerk', 'Rejected'] },
              { label: 'Priority', key: 'priority', options: ['Normal','Urgent','Critical'] },
            ].map(f => (
              <div key={f.key} className="input-group" style={{ margin: 0 }}>
                <label>{f.label}</label>
                <select className="glass-input" value={filters[f.key]} onChange={e => setFilters({ ...filters, [f.key]: e.target.value })}>
                  <option value="">All</option>
                  {f.options.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            ))}
            <div className="input-group" style={{ margin: 0 }}><label>From</label><input type="date" className="glass-input" value={filters.dateFrom} onChange={e => setFilters({ ...filters, dateFrom: e.target.value })} /></div>
            <div className="input-group" style={{ margin: 0 }}><label>To</label><input type="date" className="glass-input" value={filters.dateTo} onChange={e => setFilters({ ...filters, dateTo: e.target.value })} /></div>
          </div>
        )}
      </div>

      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '16px' }}>
        Showing <b style={{ color: 'white' }}>{filteredFiles.length}</b> of <b style={{ color: 'white' }}>{files.length}</b> documents
      </p>

      {filteredFiles.length === 0
        ? <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>{files.length === 0 ? 'No documents found.' : '🔍 No documents match your filters.'}</div>
        : <div className="file-grid">{filteredFiles.map(file => <FileCard key={file.id} file={file} role={role} refreshData={fetchFiles} />)}</div>
      }
    </div>
  );
};

export default Dashboard;
