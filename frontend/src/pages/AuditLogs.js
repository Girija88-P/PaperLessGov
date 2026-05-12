import React, { useEffect, useState } from 'react';
import api from '../api';
import { Search, Clock, User, FileText, Filter } from 'lucide-react';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const r = await api.get('statuses/');
        setLogs(r.data.reverse()); // Most recent first
      } catch (e) {} finally { setLoading(false); }
    };
    fetchLogs();
  }, []);

  const uniqueUsers = [...new Set(logs.map(l => l.approved_by_name).filter(Boolean))];
  const uniqueActions = [...new Set(logs.map(l => l.current_stage))];

  const filtered = logs.filter(log => {
    const ts = new Date(log.timestamp);
    return (!search || log.remarks?.toLowerCase().includes(search.toLowerCase()) || log.current_stage?.toLowerCase().includes(search.toLowerCase()))
      && (!filterAction || log.current_stage === filterAction)
      && (!filterUser || log.approved_by_name === filterUser)
      && (!dateFrom || ts >= new Date(dateFrom))
      && (!dateTo || ts <= new Date(dateTo + 'T23:59:59'));
  });

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  const formatDate = (ts) => {
    if (!ts) return '—';
    const d = new Date(ts);
    return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const stageColor = { Approved: 'var(--success)', Rejected: 'var(--danger)', Uploaded: 'var(--primary)', 'Returned for Correction': 'var(--danger)', Escalated: 'var(--warning)', 'Under Review': 'var(--warning)' };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ marginBottom: '4px' }}>Audit Logs</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>System activities and audit trail</p>
      </div>

      {/* Filters Bar */}
      <div className="glass-panel" style={{ marginBottom: '20px', padding: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 2, minWidth: '200px' }}>
            <Search size={14} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="glass-input" placeholder="Search logs..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ paddingLeft: '32px', width: '100%' }} />
          </div>
          <select className="glass-input" style={{ flex: 1, minWidth: '140px' }} value={filterUser} onChange={e => { setFilterUser(e.target.value); setPage(1); }}>
            <option value="">All Users</option>
            {uniqueUsers.map(u => <option key={u}>{u}</option>)}
          </select>
          <select className="glass-input" style={{ flex: 1, minWidth: '160px' }} value={filterAction} onChange={e => { setFilterAction(e.target.value); setPage(1); }}>
            <option value="">All Actions</option>
            {uniqueActions.map(a => <option key={a}>{a}</option>)}
          </select>
          <input type="date" className="glass-input" style={{ flex: 1 }} value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }} />
          <input type="date" className="glass-input" style={{ flex: 1 }} value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }} />
          {(search || filterAction || filterUser || dateFrom || dateTo) && (
            <button onClick={() => { setSearch(''); setFilterAction(''); setFilterUser(''); setDateFrom(''); setDateTo(''); setPage(1); }} style={{ background: 'transparent', border: '1px solid var(--danger)', color: 'var(--danger)', padding: '9px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.83rem' }}>
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
              {['Date & Time', 'User', 'Action', 'File', 'Details', 'IP Address'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading audit logs...</td></tr>
            ) : paginated.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No logs match your filters.</td></tr>
            ) : paginated.map((log, i) => (
              <tr key={log.id} style={{ borderTop: '1px solid var(--border)' }} onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.02)'} onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                <td style={{ padding: '12px 16px', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                    <Clock size={12} /> {formatDate(log.timestamp)}
                  </div>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: `hsl(${((i+1) * 83) % 360},55%,45%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: '700', flexShrink: 0 }}>
                      {(log.approved_by_name || 'S')?.charAt(0).toUpperCase()}
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>{log.approved_by_name || 'System'}</span>
                  </div>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ padding: '3px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '600', background: `${stageColor[log.current_stage] || 'var(--primary)'}20`, color: stageColor[log.current_stage] || 'var(--primary)', border: `1px solid ${stageColor[log.current_stage] || 'var(--primary)'}40`, whiteSpace: 'nowrap' }}>
                    {log.current_stage}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><FileText size={11} /> File #{log.file}</div>
                </td>
                <td style={{ padding: '12px 16px', fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {log.remarks || '—'}
                </td>
                <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                  127.0.0.1
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
            Showing {Math.min((page - 1) * PER_PAGE + 1, filtered.length)}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length} logs
          </span>
          <div style={{ display: 'flex', gap: '4px' }}>
            {[...Array(Math.min(totalPages, 5))].map((_, i) => {
              const p = i + 1;
              return (
                <button key={p} onClick={() => setPage(p)} style={{ width: '32px', height: '32px', borderRadius: '6px', border: 'none', cursor: 'pointer', background: page === p ? 'var(--primary)' : 'rgba(255,255,255,0.05)', color: page === p ? 'white' : 'var(--text-muted)', fontWeight: page === p ? '700' : '400' }}>{p}</button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;
