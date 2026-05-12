import React, { useState, useEffect } from 'react';
import { Edit2, Trash2, Plus, Search, Building2, AlertTriangle } from 'lucide-react';
import api from '../api';

const Departments = () => {
  const [depts, setDepts] = useState([
    { id: 1, name: 'Finance', description: 'Handles all finance related activities', head: 'Amit Verma' },
    { id: 2, name: 'Common', description: 'Cabinet of the State Government and Central Oversight', head: 'System Cabinet' },
    { id: 3, name: 'Health', description: 'Medical and health services', head: 'Dr. Rekha' },
    { id: 4, name: 'Transport', description: 'Logistics and fleet management', head: 'Arjun S' },
    { id: 5, name: 'Education', description: 'Academic and training services', head: 'Priya P' },
    { id: 6, name: 'Urban Planning', description: 'City infrastructure and development', head: 'Sanjay K' },
  ]);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editDept, setEditDept] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', head: '' });
  
  // Custom Delete Confirmation State
  const [confirmDelete, setConfirmDelete] = useState(null); // stores dept object if confirming

  const fetchUsers = async () => {
    try {
      const res = await api.get('users/');
      setUsers(res.data);
    } catch(err) {}
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const getUserCount = (deptName) => {
    return users.filter(u => u.department && (u.department.toLowerCase().includes(deptName.toLowerCase()) || deptName.toLowerCase().includes(u.department.toLowerCase()))).length;
  };

  const userDept = localStorage.getItem('user_dept') || 'Common';
  
  const filtered = depts.filter(d => {
    // Security: Non-Main Govt users only see their own dept
    if (userDept !== 'Common' && d.name !== userDept) return false;
    
    return d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.description.toLowerCase().includes(search.toLowerCase()) ||
      d.head.toLowerCase().includes(search.toLowerCase());
  });

  const openAdd = () => { setForm({ name: '', description: '', head: '' }); setEditDept(null); setShowModal(true); };
  const openEdit = (d) => { setForm({ name: d.name, description: d.description, head: d.head }); setEditDept(d.id); setShowModal(true); };
  
  const initiateDelete = (dept) => {
    setConfirmDelete(dept);
  };

  const executeDelete = () => {
    if (confirmDelete) {
      setDepts(prev => prev.filter(d => d.id !== confirmDelete.id));
      setConfirmDelete(null);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editDept) {
      setDepts(prev => prev.map(d => d.id === editDept ? { ...d, ...form } : d));
    } else {
      setDepts(prev => [...prev, { id: Date.now(), ...form }]);
    }
    setShowModal(false);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ marginBottom: '4px' }}>Departments</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Manage list of departments</p>
        </div>
        <button onClick={openAdd} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={16} /> Add Department
        </button>
      </div>

      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={14} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="glass-input" placeholder="Search departments..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '32px', width: '100%' }} />
          </div>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{filtered.length} departments</span>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
              {['Department Name', 'Description', 'Head', 'Total Users', 'Action'].map(h => (
                <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((dept) => (
              <tr key={dept.id} style={{ borderTop: '1px solid var(--border)' }} onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.02)'} onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                <td style={{ padding: '14px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ padding: '7px', background: 'rgba(59,130,246,0.1)', borderRadius: '8px', display: 'flex' }}>
                      <Building2 size={15} color="var(--primary)" />
                    </div>
                    <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{dept.name === 'Common' ? 'Main State Government' : dept.name}</span>
                  </div>
                </td>
                <td style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: '0.86rem', maxWidth: '240px' }}>{dept.description}</td>
                <td style={{ padding: '14px 20px', fontSize: '0.86rem', fontWeight: '500' }}>{dept.head}</td>
                <td style={{ padding: '14px 20px' }}>
                  <span style={{ background: 'rgba(59,130,246,0.15)', color: 'var(--primary)', borderRadius: '999px', padding: '3px 12px', fontSize: '0.82rem', fontWeight: '600' }}>
                    {getUserCount(dept.name)} members
                  </span>
                </td>
                <td style={{ padding: '14px 20px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => openEdit(dept)} style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', color: 'var(--primary)', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}><Edit2 size={12} /> Edit</button>
                    <button onClick={() => initiateDelete(dept)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--danger)', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}><Trash2 size={12} /> Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ width: '90%', maxWidth: '440px', border: '1px solid rgba(255,255,255,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>{editDept ? 'Edit Department' : 'Add New Department'}</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.4rem' }}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="input-group"><label>Department Name *</label><input className="glass-input" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
              <div className="input-group"><label>Description</label><input className="glass-input" value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
              <div className="input-group"><label>Head / In-charge</label><input className="glass-input" value={form.head} onChange={e => setForm({...form, head: e.target.value})} /></div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '10px 20px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" className="btn-primary">{editDept ? 'Update' : 'Add'} Department</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modern Delete Confirmation Modal */}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div className="glass-panel" style={{ width: '90%', maxWidth: '400px', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <AlertTriangle size={32} color="var(--danger)" />
            </div>
            <h2 style={{ fontSize: '1.4rem', marginBottom: '10px', color: 'white' }}>Delete Department?</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '0.95rem', lineHeight: '1.5' }}>
              Are you sure you want to delete the <b>{confirmDelete.name}</b> department? This action cannot be undone and may affect associated users.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setConfirmDelete(null)} style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'white', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}>Cancel</button>
              <button onClick={executeDelete} className="btn-danger" style={{ flex: 1.2, padding: '12px', borderRadius: '10px', fontWeight: '700' }}>Yes, Delete It</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Departments;
