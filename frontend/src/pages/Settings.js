import React, { useState } from 'react';
import { Save, Lock, Bell, Shield, Database, User, Globe } from 'lucide-react';

const Toggle = ({ value, onChange }) => (
  <div onClick={onChange} style={{ width: '44px', height: '24px', borderRadius: '12px', cursor: 'pointer', background: value ? 'var(--primary)' : 'rgba(255,255,255,0.1)', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
    <div style={{ position: 'absolute', top: '3px', width: '18px', height: '18px', borderRadius: '50%', background: 'white', transition: 'left 0.2s', left: value ? '23px' : '3px' }} />
  </div>
);

const Settings = () => {
  const [saved, setSaved] = useState(false);
  const [general, setGeneral] = useState({
    name: localStorage.getItem('user_name') || 'Arjun Sharma',
    email: 'arjun@gov.in',
    phone: '+91-9876543210',
    systemName: 'PaperLessGov',
    dateFormat: 'DD/MM/YYYY',
  });
  const [notifications, setNotifications] = useState({
    email: true, sms: false, taskReminders: true, fileUpdates: false, dailyDigest: false,
  });
  const [security, setSecurity] = useState({ twoFactor: false });
  const [backup, setBackup] = useState({ autoBackup: true, frequency: 'Daily' });
  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' });

  const handleSave = () => {
    localStorage.setItem('user_name', general.name);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const SectionTitle = ({ icon, title }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px', paddingBottom: '10px', borderBottom: '1px solid var(--border)' }}>
      <div style={{ padding: '6px', background: 'rgba(59,130,246,0.1)', borderRadius: '6px', display: 'flex' }}>{icon}</div>
      <h3 style={{ margin: 0, fontSize: '1rem' }}>{title}</h3>
    </div>
  );

  const Row = ({ label, children }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>{label}</span>
      {children}
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ marginBottom: '4px' }}>Settings</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>System configuration and preferences</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }}>
        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* General Settings */}
          <div className="glass-panel">
            <SectionTitle icon={<User size={15} color="var(--primary)" />} title="General Settings" />
            {[
              { label: 'Name', key: 'name', type: 'text' },
              { label: 'Email', key: 'email', type: 'email' },
              { label: 'Phone', key: 'phone', type: 'text' },
              { label: 'System Name', key: 'systemName', type: 'text' },
            ].map(f => (
              <div key={f.key} className="input-group" style={{ marginBottom: '14px' }}>
                <label>{f.label}</label>
                <input type={f.type} className="glass-input" value={general[f.key]}
                  onChange={e => setGeneral({ ...general, [f.key]: e.target.value })} />
              </div>
            ))}
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>Date Format</label>
              <select className="glass-input" value={general.dateFormat} onChange={e => setGeneral({ ...general, dateFormat: e.target.value })}>
                <option>DD/MM/YYYY</option><option>MM/DD/YYYY</option><option>YYYY-MM-DD</option>
              </select>
            </div>
          </div>

          {/* Security Settings */}
          <div className="glass-panel">
            <SectionTitle icon={<Shield size={15} color="var(--danger)" />} title="Security Settings" />
            <div className="input-group"><label>Current Password</label><input type="password" className="glass-input" value={passwords.current} onChange={e => setPasswords({...passwords, current: e.target.value})} /></div>
            <div className="input-group"><label>New Password</label><input type="password" className="glass-input" value={passwords.newPass} onChange={e => setPasswords({...passwords, newPass: e.target.value})} /></div>
            <div className="input-group" style={{ marginBottom: '16px' }}><label>Confirm Password</label><input type="password" className="glass-input" value={passwords.confirm} onChange={e => setPasswords({...passwords, confirm: e.target.value})} /></div>
            <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}><Lock size={14} /> Change Password</button>
            <Row label="Two Factor Authentication">
              <Toggle value={security.twoFactor} onChange={() => setSecurity(s => ({...s, twoFactor: !s.twoFactor}))} />
            </Row>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Notification Settings */}
          <div className="glass-panel">
            <SectionTitle icon={<Bell size={15} color="var(--warning)" />} title="Notification Settings" />
            {[
              { key: 'email', label: 'Email Notifications' },
              { key: 'sms', label: 'SMS Notifications' },
              { key: 'taskReminders', label: 'Task Reminders' },
              { key: 'fileUpdates', label: 'File Updates' },
              { key: 'dailyDigest', label: 'Daily Digest' },
            ].map(n => (
              <Row key={n.key} label={n.label}>
                <Toggle value={notifications[n.key]} onChange={() => setNotifications(prev => ({...prev, [n.key]: !prev[n.key]}))} />
              </Row>
            ))}
          </div>

          {/* Backup Settings */}
          <div className="glass-panel">
            <SectionTitle icon={<Database size={15} color="var(--success)" />} title="Backup Settings" />
            <Row label="Auto Backup">
              <Toggle value={backup.autoBackup} onChange={() => setBackup(b => ({...b, autoBackup: !b.autoBackup}))} />
            </Row>
            <div className="input-group" style={{ marginTop: '12px', marginBottom: 0 }}>
              <label>Backup Frequency</label>
              <select className="glass-input" value={backup.frequency} onChange={e => setBackup({...backup, frequency: e.target.value})}>
                <option>Daily</option><option>Weekly</option><option>Monthly</option>
              </select>
            </div>
          </div>

          {/* System Info */}
          <div className="glass-panel">
            <SectionTitle icon={<Globe size={15} color="var(--primary)" />} title="System Information" />
            {[
              { label: 'Django Version', value: '6.0.4' },
              { label: 'Database', value: 'SQLite (Dev)' },
              { label: 'ML Models', value: '✓ 3/3 Loaded' },
              { label: 'JWT Lifetime', value: '8 Hours' },
            ].map(item => (
              <Row key={item.label} label={item.label}>
                <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--success)' }}>{item.value}</span>
              </Row>
            ))}
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
        <button onClick={handleSave} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 28px', fontSize: '1rem' }}>
          <Save size={16} /> {saved ? '✓ Settings Saved!' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
};

export default Settings;
