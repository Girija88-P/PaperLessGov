import React, { useEffect, useState } from 'react';
import api from '../api';
import { CheckCircle, Clock, AlertCircle, FileText, Search, Filter, Calendar } from 'lucide-react';

const MyTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = () => {
    setLoading(true);
    api.get('files/').then(res => {
      const role = localStorage.getItem('user_role');
      let filtered = res.data;
      
      if (role === 'Officer') {
        filtered = res.data.filter(f => f.statuses?.slice(-1)[0]?.current_stage === 'Officer Review');
      } else if (role === 'Higher Authority') {
        filtered = res.data.filter(f => f.statuses?.slice(-1)[0]?.current_stage === 'Higher Authority Review');
      } else if (role === 'Head') {
        filtered = res.data.filter(f => f.statuses?.slice(-1)[0]?.current_stage === 'Head Approval');
      } else if (role === 'Clerk') {
        filtered = res.data.filter(f => {
          const s = f.statuses?.slice(-1)[0]?.current_stage;
          return s === 'Returned to Clerk' || s === 'Returned for Correction';
        });
      } else if (role === 'Admin') {
        filtered = res.data; // Admins see all
      } else {
        filtered = []; // Clerks/Citizens don't have review tasks in this view
      }
      
      setTasks(filtered);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  const handleAction = async (fileId, decision) => {
    const remarks = window.prompt(`Enter remarks for ${decision}:`);
    if (remarks === null) return;
    try {
      await api.post(`files/${fileId}/transition/`, { decision, remarks });
      fetchTasks();
    } catch(err) { alert("Error updating task"); }
  };

  const stats = [
    { label: 'Pending', value: tasks.length, icon: <Clock size={16} />, color: 'var(--warning)' },
    { label: 'Review', value: tasks.filter(t => t.priority === 'Critical').length, icon: <AlertCircle size={16} />, color: 'var(--danger)' },
    { label: 'Completed Today', value: 0, icon: <CheckCircle size={16} />, color: 'var(--success)' },
    { label: 'Total Assigned', value: tasks.length, icon: <FileText size={16} />, color: 'var(--primary)' },
  ];

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ marginBottom: '4px' }}>My Tasks</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Files that require your hierarchy-level attention</p>
      </div>

      {/* Mini Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {stats.map((s, i) => (
          <div key={i} className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '8px', background: `${s.color}20`, borderRadius: '8px', display: 'flex' }}>
              {React.cloneElement(s.icon, { color: s.color })}
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.label}</div>
              <div style={{ fontSize: '1.2rem', fontWeight: '700' }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '12px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={14} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="glass-input" placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '32px', width: '100%', padding: '8px 12px 8px 32px' }} />
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
               {['File ID', 'Title', 'Priority', 'Current Stage', 'Actions'].map(h => (
                 <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>{h}</th>
               ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading tasks...</td></tr>
            ) : tasks.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No tasks pending for your role.</td></tr>
            ) : tasks.map(task => {
              const stage = task.statuses?.slice(-1)[0]?.current_stage || 'Uploaded';
              return (
                <tr key={task.id} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={{ padding: '14px 20px' }}>#F-{task.id}</td>
                  <td style={{ padding: '14px 20px', fontWeight: '600' }}>{task.name}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{ color: task.priority === 'Critical' ? 'var(--danger)' : 'var(--warning)', fontWeight: '600', fontSize: '0.75rem' }}>{task.priority}</span>
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{ padding: '3px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '600', background: 'rgba(59,130,246,0.1)', color: 'var(--primary)', border: '1px solid rgba(59,130,246,0.2)' }}>{stage}</span>
                  </td>
                  <td style={{ padding: '14px 20px', minWidth: '320px' }}>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'nowrap' }}>
                      {localStorage.getItem('user_role') === 'Clerk' ? (
                        <button onClick={() => alert("Resubmit logic coming soon")} className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>Resubmit</button>
                      ) : (
                        <>
                          <button onClick={() => handleAction(task.id, 'approve')} style={{ padding: '8px 14px', fontSize: '0.78rem', background: 'var(--success)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Accept</button>
                          <button onClick={() => handleAction(task.id, 'escalate')} style={{ padding: '8px 14px', fontSize: '0.78rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Escalate</button>
                          <button onClick={() => handleAction(task.id, 'return')} style={{ padding: '8px 14px', fontSize: '0.78rem', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Return</button>
                          <button onClick={() => handleAction(task.id, 'reject')} style={{ padding: '8px 14px', fontSize: '0.78rem', background: 'var(--danger)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Reject</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MyTasks;
