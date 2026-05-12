import React, { useEffect, useState } from 'react';
import api from '../api';
import { UserPlus, Edit2, Trash2, Search, Shield, User, AlertTriangle } from 'lucide-react';

const ROLES = ['Admin', 'Clerk', 'Officer', 'Higher Authority', 'Head'];
const DEPTS = ['Main State Government', 'Finance', 'Health', 'Transport', 'Education', 'Urban Planning'];

const UsersRoles = () => {
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('users');
  const [search, setSearch] = useState('');
  
  const getProfessionalTitle = (role, dept) => {
    const mappings = {
      'Common': { 'Head': 'Cabinet Minister', 'Higher Authority': 'Chief Secretary', 'Officer': 'Joint Secretary', 'Clerk': 'Secretariat Clerk', 'Admin': 'System Administrator' },
      'Finance': { 'Head': 'Director of Finance', 'Higher Authority': 'Treasury Controller', 'Officer': 'Accounts Officer', 'Clerk': 'Finance Assistant' },
      'Health': { 'Head': 'Medical Director', 'Higher Authority': 'Chief Medical Officer', 'Officer': 'Health Officer', 'Clerk': 'Health Desk Clerk' },
      'Transport': { 'Head': 'Transport Commissioner', 'Higher Authority': 'Regional Transport Officer', 'Officer': 'Enforcement Officer', 'Clerk': 'Transport Assistant' },
      'Education': { 'Head': 'Director of Education', 'Higher Authority': 'District Education Officer', 'Officer': 'Block Education Officer', 'Clerk': 'Education Assistant' },
      'Urban Planning': { 'Head': 'Chief Town Planner', 'Higher Authority': 'Urban Development Authority', 'Officer': 'Planning Officer', 'Clerk': 'Planning Assistant' }
    };
    const deptMapping = mappings[dept] || mappings['Common'];
    return deptMapping[role] || role;
  };
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ username: '', first_name: '', last_name: '', email: '', role: 'Clerk', department: 'Common', password: '', date_joined: new Date().toISOString().split('T')[0] });
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  
  // OTP State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [expectedOtp, setExpectedOtp] = useState('');
  const [pendingSubmitData, setPendingSubmitData] = useState(null);
  
  // New Password Reset Flow States
  const [isOtpAuthenticated, setIsOtpAuthenticated] = useState(false);
  const [otpPhase, setOtpPhase] = useState('none'); // 'none', 'email', 'otp'
  const [emailInput, setEmailInput] = useState('');
  
  // Custom Delete Confirmation State
  const [confirmDelete, setConfirmDelete] = useState(null);


  const fetchUsers = async () => { try { const r = await api.get('users/'); setUsers(r.data); } catch(e){} finally { setLoading(false); } };
  useEffect(() => { fetchUsers(); }, []);

  const handleEdit = (user) => {
    setEditingUser(user);
    setForm({ 
      username: user.username, 
      first_name: user.first_name, 
      last_name: user.last_name, 
      email: user.email, 
      role: user.role, 
      department: user.department || 'Common', 
      password: '',
      date_joined: user.date_joined ? user.date_joined.split('T')[0] : new Date().toISOString().split('T')[0]
    });
    setShowModal(true);
  };

  const initiateDelete = (user) => {
    setConfirmDelete(user);
  };

  const executeDelete = async () => {
    if (!confirmDelete) return;
    try {
      await api.delete(`users/${confirmDelete.id}/`);
      setConfirmDelete(null);
      fetchUsers();
    } catch(err) { alert("Error deleting user"); }
  };

  const executeSubmit = async (submitData) => {
    try {
      if (editingUser) {
        await api.patch(`users/${editingUser.id}/`, submitData);
      } else {
        await api.post('users/', submitData);
      }
      setShowModal(false);
      setShowOtpModal(false);
      setEditingUser(null);
      setForm({ username: '', first_name: '', last_name: '', email: '', role: 'Clerk', department: 'Common', password: '', date_joined: new Date().toISOString().split('T')[0] });
      setOtpInput('');
      fetchUsers();
    } catch(err) { 
      const errorMsg = err.response?.data ? JSON.stringify(err.response.data) : 'Network error';
      alert('Error: ' + errorMsg); 
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const submitData = { ...form };
    
    if (editingUser && !submitData.password) {
      delete submitData.password;
    }
    
    // OTP Check if an existing employee is changing their password
    if (editingUser && submitData.password) {
      const generated = Math.floor(100000 + Math.random() * 900000).toString();
      console.log('SIMULATED EMAIL OTP for ' + (submitData.email || submitData.username) + ': ' + generated);
      setExpectedOtp(generated);
      setPendingSubmitData(submitData);
      setShowOtpModal(true);
      return;
    }

    await executeSubmit(submitData);
  };

  const handleOtpVerify = () => {
    if (otpInput === expectedOtp) {
      executeSubmit(pendingSubmitData);
    } else {
      alert('Invalid OTP. Please try again.');
    }
  };

  const staffUsers = users.filter(u => u.role !== 'Citizen');
  const citizenCount = users.filter(u => u.role === 'Citizen').length;

  const filtered = staffUsers.filter(u =>
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.role?.toLowerCase().includes(search.toLowerCase()) ||
    (u.first_name + ' ' + u.last_name).toLowerCase().includes(search.toLowerCase())
  );

  const roleColors = { Admin: 'var(--danger)', Clerk: 'var(--primary)', Officer: 'var(--warning)', 'Higher Authority': 'var(--success)', Head: '#a78bfa' };

  const closeAndReset = () => {
    setShowModal(false);
    setEditingUser(null);
    setForm({ username: '', first_name: '', last_name: '', email: '', role: 'Clerk', department: 'Common', password: '', date_joined: new Date().toISOString().split('T')[0] });
    setIsOtpAuthenticated(false);
    setOtpPhase('none');
    setEmailInput('');
  };

  const startPasswordReset = () => {
    setOtpPhase('email');
  };

  const sendOtp = () => {
    if (!emailInput || emailInput !== (editingUser?.email || '')) {
      alert("Error: Please enter the correct email associated with this account.");
      return;
    }
    const generated = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('SIMULATED EMAIL OTP for ' + emailInput + ': ' + generated);
    setExpectedOtp(generated);
    setOtpPhase('otp');
    setOtpInput('');
  };

  const verifyOtpPhase = () => {
    if (otpInput === expectedOtp) {
      setIsOtpAuthenticated(true);
      setOtpPhase('none');
      alert("Authenticated! You can now change the password.");
    } else {
      alert("Invalid OTP.");
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ marginBottom: '4px' }}>Users & Roles</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Manage users and their roles</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <UserPlus size={16} /> Add New User
        </button>
      </div>

      {/* Tabs & Stats */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '10px', width: 'fit-content' }}>
          {['users', 'roles'].map(t => (
            <button key={t} onClick={() => setActiveTab(t)} style={{ padding: '8px 20px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '0.88rem', background: activeTab === t ? 'var(--primary)' : 'transparent', color: activeTab === t ? 'white' : 'var(--text-muted)', transition: 'all 0.2s' }}>
              {t === 'users' ? '👤 Staff Members' : '🛡️ Permissions'}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ background: 'rgba(59,130,246,0.1)', padding: '8px 16px', borderRadius: '10px', border: '1px solid rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', gap: '8px' }}>
             <User size={14} color="var(--primary)" />
             <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>{citizenCount} Registered Citizens</span>
          </div>
        </div>
      </div>

      {activeTab === 'users' && (
        <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input className="glass-input" placeholder="Search by name, role, email..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '36px', width: '100%', padding: '9px 12px 9px 36px' }} />
            </div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{filtered.length} users</span>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                {['Name', 'Department', 'Role', 'Joining Date', 'Added By', 'Action'].map(h => (
                  <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading...</td></tr>
              ) : filtered.map((user, i) => (
                <tr key={user.id} style={{ borderTop: '1px solid var(--border)', transition: 'background 0.15s' }} onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.02)'} onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: `hsl(${(i * 67) % 360}, 60%, 45%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.85rem', flexShrink: 0 }}>
                        {(user.first_name || user.username)?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '0.88rem' }}>{user.first_name ? `${user.first_name} ${user.last_name}` : user.username}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>@{user.username}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 20px', color: 'var(--primary)', fontSize: '0.88rem', fontWeight: '500' }}>{user.department === 'Common' ? 'Main State Government' : (user.department || 'Main State Government')}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{ padding: '3px 10px', borderRadius: '999px', fontSize: '0.78rem', fontWeight: '600', background: `${roleColors[user.role] || 'var(--primary)'}20`, color: roleColors[user.role] || 'var(--primary)', border: `1px solid ${roleColors[user.role] || 'var(--primary)'}40` }}>
                      {getProfessionalTitle(user.role, user.department)}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    {new Date(user.date_joined).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    {user.created_by_name || 'System'}
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleEdit(user)} style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', color: 'var(--primary)', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}><Edit2 size={12} /> Edit</button>
                      <button onClick={() => initiateDelete(user)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--danger)', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}><Trash2 size={12} /> Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
            Showing {filtered.length} of {staffUsers.length} staff members
          </div>
        </div>
      )}

      {activeTab === 'roles' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: '16px' }}>
          {[
            { baseRole: 'Head', color: '#a78bfa', perms: ['Final Approval Authority','Workflow Supervision','Strategic Review','Override Decisions','Departmental Oversight'] },
            { baseRole: 'Higher Authority', color: 'var(--success)', perms: ['Final decision-making','Override approvals','View all files','Generate reports'] },
            { baseRole: 'Officer', color: 'var(--warning)', perms: ['Review files','Approve / Reject','Add remarks','Escalate to higher authority'] },
            { baseRole: 'Clerk', color: 'var(--primary)', perms: ['Upload documents','Initiate requests','View own file status','Resubmit corrected files'] },
            { baseRole: 'Admin', color: 'var(--danger)', perms: ['Manage all users','View all files','Override decisions','Configure workflows','Access audit logs'] },
          ].map(({ baseRole, color, perms }) => {
            const displayTitle = getProfessionalTitle(baseRole, localStorage.getItem('user_dept') || 'Common');
            return (
            <div key={baseRole} className="glass-panel" style={{ borderTop: `3px solid ${color}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <div style={{ padding: '8px', borderRadius: '8px', background: `${color}20`, display: 'flex' }}><Shield size={18} color={color} /></div>
                <div>
                  <div style={{ fontWeight: '700' }}>{displayTitle} <span style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>({baseRole})</span></div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{users.filter(u => u.role === baseRole).length} user(s)</div>
                </div>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {perms.map(p => <li key={p} style={{ fontSize: '0.83rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>✓ {p}</li>)}
              </ul>
            </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit User Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>{editingUser ? 'Edit User' : 'Add New User'}</h3>
              <button onClick={closeAndReset} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.4rem' }}>&times;</button>
            </div>
            <form onSubmit={handleSubmit} autoComplete="off">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 20px' }}>
                <div className="input-group"><label>First Name</label><input className="glass-input" style={{ width: '100%' }} autoComplete="off" value={form.first_name} onChange={e => setForm({...form, first_name: e.target.value})} /></div>
                <div className="input-group"><label>Last Name</label><input className="glass-input" style={{ width: '100%' }} autoComplete="off" value={form.last_name} onChange={e => setForm({...form, last_name: e.target.value})} /></div>
                <div className="input-group"><label>Username *</label><input className="glass-input" style={{ width: '100%' }} required autoComplete="off" value={form.username} onChange={e => setForm({...form, username: e.target.value})} /></div>
                <div className="input-group"><label>Email</label><input type="email" className="glass-input" style={{ width: '100%' }} autoComplete="off" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
                <div className="input-group">
                  <label>Role</label>
                  <select className="glass-input" style={{ width: '100%', appearance: 'auto' }} value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                    {ROLES.filter(r => r !== 'Citizen').map(r => <option key={r} style={{background: '#1e293b'}}>{r}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label>Department</label>
                  <select className="glass-input" style={{ width: '100%', appearance: 'auto' }} value={form.department} onChange={e => setForm({...form, department: e.target.value})}>
                    {DEPTS.filter(d => {
                      const userDept = localStorage.getItem('user_dept') || 'Common';
                      if (userDept === 'Common') return true;
                      return d === (userDept === 'Common' ? 'Main State Government' : userDept) || (d === 'Main State Government' && userDept === 'Common');
                    }).map(d => <option key={d} value={d === 'Main State Government' ? 'Common' : d} style={{background: '#1e293b'}}>{d}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label>Added By</label>
                  <input className="glass-input" value={editingUser ? (editingUser.created_by_name || 'System') : (localStorage.getItem('user_name') || 'Admin')} readOnly style={{ width: '100%', opacity: 0.7, cursor: 'not-allowed', background: 'rgba(255,255,255,0.05)' }} />
                </div>
                <div className="input-group"><label>Joining Date</label><input type="date" className="glass-input" style={{ width: '100%' }} value={form.date_joined} onChange={e => setForm({...form, date_joined: e.target.value})} /></div>
                <div className="input-group" style={{ gridColumn: 'span 2' }}>
                  <label>Authentication & Security</label>
                  {!editingUser ? (
                    <div>
                      <label style={{ fontSize: '0.75rem', marginBottom: '5px', display: 'block' }}>Password *</label>
                      <input type="password" className="glass-input" style={{ width: '100%' }} required autoComplete="new-password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
                    </div>
                  ) : (
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                      {isOtpAuthenticated ? (
                        <div>
                          <label style={{ fontSize: '0.75rem', marginBottom: '8px', display: 'block', color: 'var(--success)' }}>✓ Identity Verified - Set New Password</label>
                          <input type="password" className="glass-input" style={{ width: '100%' }} placeholder="Enter new password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
                        </div>
                      ) : (
                        <div>
                          {otpPhase === 'none' && (
                            <button type="button" onClick={startPasswordReset} style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--primary)', border: '1px solid var(--primary)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', width: '100%' }}>
                              Click here to Change Password
                            </button>
                          )}
                          {otpPhase === 'email' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                              <label style={{ fontSize: '0.75rem' }}>Step 1: Enter Account Email</label>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <input type="email" placeholder="email@gov.in" className="glass-input" style={{ flex: 1 }} value={emailInput} onChange={e => setEmailInput(e.target.value)} />
                                <button type="button" onClick={sendOtp} style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '0 15px', borderRadius: '8px', cursor: 'pointer' }}>Send OTP</button>
                              </div>
                            </div>
                          )}
                          {otpPhase === 'otp' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                              <label style={{ fontSize: '0.75rem' }}>Step 2: Enter 6-Digit OTP</label>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <input type="text" placeholder="XXXXXX" className="glass-input" style={{ flex: 1, textAlign: 'center', letterSpacing: '0.2em' }} maxLength={6} value={otpInput} onChange={e => setOtpInput(e.target.value)} />
                                <button type="button" onClick={verifyOtpPhase} style={{ background: 'var(--success)', color: 'white', border: 'none', padding: '0 15px', borderRadius: '8px', cursor: 'pointer' }}>Verify</button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" onClick={closeAndReset} style={{ padding: '10px 20px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" className="btn-primary">{editingUser ? 'Update User' : 'Create User'}</button>
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
            <h2 style={{ fontSize: '1.4rem', marginBottom: '10px', color: 'white' }}>Remove User?</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '0.95rem', lineHeight: '1.5' }}>
              Are you sure you want to remove <b>{confirmDelete.first_name ? `${confirmDelete.first_name} ${confirmDelete.last_name}` : confirmDelete.username}</b> from the system? This action is permanent.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setConfirmDelete(null)} style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'white', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}>Cancel</button>
              <button onClick={executeDelete} className="btn-danger" style={{ flex: 1.2, padding: '12px', borderRadius: '10px', fontWeight: '700' }}>Yes, Remove User</button>
            </div>
          </div>
        </div>
      )}
      {/* OTP Verification Modal */}
      {showOtpModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div className="glass-panel" style={{ width: '90%', maxWidth: '400px', textAlign: 'center', border: '1px solid rgba(59,130,246,0.3)' }}>
            <div style={{ background: 'rgba(59,130,246,0.1)', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Shield size={32} color="var(--primary)" />
            </div>
            <h2 style={{ fontSize: '1.4rem', marginBottom: '10px', color: 'white' }}>Security Verification</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '0.95rem', lineHeight: '1.5' }}>
              To change an existing employee's password, we have sent a 6-digit OTP to <b>{pendingSubmitData?.email || pendingSubmitData?.username}</b>.<br/><br/>
              <i>(For demo purposes, the OTP is printed in your browser's Developer Console)</i>
            </p>
            <input 
              type="text" 
              placeholder="Enter 6-digit OTP" 
              className="glass-input" 
              style={{ width: '100%', textAlign: 'center', fontSize: '1.2rem', letterSpacing: '0.5em', marginBottom: '20px' }} 
              maxLength={6}
              value={otpInput}
              onChange={e => setOtpInput(e.target.value)}
            />
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setShowOtpModal(false)} style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'white', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}>Cancel</button>
              <button onClick={handleOtpVerify} className="btn-primary" style={{ flex: 1.2, padding: '12px', borderRadius: '10px', fontWeight: '700' }}>Verify & Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersRoles;
