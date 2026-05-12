import React, { useEffect, useState } from 'react';
import api from '../api';
import { BarChart3, TrendingUp, FileText, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';

const Reports = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('files/').then(r => setFiles(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const total = files.length;
  const approved = files.filter(f => f.statuses?.slice(-1)[0]?.current_stage === 'Approved').length;
  const rejected = files.filter(f => f.statuses?.slice(-1)[0]?.current_stage === 'Rejected').length;
  const pending  = files.filter(f => ['Uploaded','Under Review'].includes(f.statuses?.slice(-1)[0]?.current_stage)).length;
  const returned = files.filter(f => f.statuses?.slice(-1)[0]?.current_stage === 'Returned for Correction').length;

  const deptCount = files.reduce((acc, f) => { acc[f.department] = (acc[f.department]||0)+1; return acc; }, {});
  const sortedDepts = Object.entries(deptCount).sort((a,b) => b[1]-a[1]);
  const maxDept = Math.max(...Object.values(deptCount), 1);

  const priorityCount = files.reduce((acc, f) => { acc[f.priority] = (acc[f.priority]||0)+1; return acc; }, {});

  const StatCard = ({ label, value, icon, color }) => (
    <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
      <div style={{ padding: '12px', background: `${color}20`, borderRadius: '10px', display: 'flex' }}>{icon}</div>
      <div>
        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '4px' }}>{label}</div>
        <div style={{ fontSize: '1.9rem', fontWeight: '700', color }}>{value}</div>
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ marginBottom: '4px' }}>Reports & Analytics</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Files overview and analytics of file management</p>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '24px' }}>
        <StatCard label="Total Files" value={total} icon={<FileText size={20} color="var(--primary)" />} color="var(--primary)" />
        <StatCard label="Approved" value={approved} icon={<CheckCircle size={20} color="var(--success)" />} color="var(--success)" />
        <StatCard label="Pending" value={pending} icon={<Clock size={20} color="var(--warning)" />} color="var(--warning)" />
        <StatCard label="Rejected" value={rejected} icon={<XCircle size={20} color="var(--danger)" />} color="var(--danger)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px', marginBottom: '20px' }}>
        {/* Department Breakdown */}
        <div className="glass-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <BarChart3 size={18} color="var(--primary)" /><h3 style={{ margin: 0 }}>Files by Department</h3>
          </div>
          {sortedDepts.length === 0
            ? <p style={{ color: 'var(--text-muted)' }}>No data yet.</p>
            : sortedDepts.map(([dept, count]) => (
              <div key={dept} style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '5px' }}>
                  <span>{dept}</span>
                  <span style={{ fontWeight: '600' }}>{count} ({Math.round(count/total*100)}%)</span>
                </div>
                <div style={{ height: '8px', background: 'rgba(255,255,255,0.07)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${count/maxDept*100}%`, background: 'linear-gradient(90deg, var(--primary), #8b5cf6)', borderRadius: '4px', transition: 'width 0.5s' }} />
                </div>
              </div>
            ))
          }
        </div>

        {/* Status Distribution */}
        <div className="glass-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <TrendingUp size={18} color="var(--success)" /><h3 style={{ margin: 0 }}>Status Distribution</h3>
          </div>
          {[
            { label: 'Approved', value: approved, color: 'var(--success)' },
            { label: 'Pending', value: pending, color: 'var(--warning)' },
            { label: 'Rejected', value: rejected, color: 'var(--danger)' },
            { label: 'Returned', value: returned, color: '#a78bfa' },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', marginBottom: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', borderLeft: `3px solid ${s.color}` }}>
              <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>{s.label}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontWeight: '700', color: s.color }}>{s.value}</span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{total ? `${Math.round(s.value/total*100)}%` : '0%'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Priority + Recent */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
        {/* Priority */}
        <div className="glass-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <AlertTriangle size={18} color="var(--warning)" /><h3 style={{ margin: 0 }}>By Priority</h3>
          </div>
          {[{ p: 'Critical', c: 'var(--danger)' }, { p: 'Urgent', c: 'var(--warning)' }, { p: 'Normal', c: 'var(--primary)' }].map(({ p, c }) => (
            <div key={p} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ padding: '2px 10px', borderRadius: '999px', fontSize: '0.78rem', fontWeight: '600', background: `${c}20`, color: c, border: `1px solid ${c}40` }}>{p}</span>
              <span style={{ fontWeight: '700', fontSize: '1.1rem' }}>{priorityCount[p] || 0}</span>
            </div>
          ))}
        </div>

        {/* Recent Files Table */}
        <div className="glass-panel" style={{ padding: 0 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} color="var(--primary)" /><h3 style={{ margin: 0 }}>Recent Files</h3>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                {['Name', 'Department', 'Priority', 'Status'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {files.slice(0, 6).map(file => {
                const stage = file.statuses?.slice(-1)[0]?.current_stage || 'Uploaded';
                const sc = { Approved: 'var(--success)', Rejected: 'var(--danger)', Uploaded: 'var(--primary)', 'Under Review': 'var(--warning)' }[stage] || 'white';
                return (
                  <tr key={file.id} style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={{ padding: '11px 16px', fontSize: '0.86rem', fontWeight: '500', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</td>
                    <td style={{ padding: '11px 16px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>{file.department}</td>
                    <td style={{ padding: '11px 16px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: '600', color: { Critical: 'var(--danger)', Urgent: 'var(--warning)', Normal: 'var(--primary)' }[file.priority] }}>{file.priority}</span>
                    </td>
                    <td style={{ padding: '11px 16px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '600', background: `${sc}20`, color: sc, border: `1px solid ${sc}40` }}>{stage}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
