import React, { useState } from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { Home, FileText, Users, Building2, History, Settings, LogOut, BarChart3, PlusCircle, ChevronDown, ChevronRight, GitBranch, CheckSquare, Send } from 'lucide-react';

const Layout = ({ setAuth }) => {
  const [filesOpen, setFilesOpen] = useState(true);
  const navigate = useNavigate();
  const role = localStorage.getItem('user_role');
  const name = localStorage.getItem('user_name') || 'User';

  const handleLogout = () => { localStorage.clear(); setAuth(false); navigate('/login'); };

  const nav = ({ isActive }) => ({
    display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px',
    borderRadius: '8px', textDecoration: 'none', fontSize: '0.88rem', fontWeight: '500',
    transition: 'all 0.2s', color: isActive ? 'white' : 'var(--text-muted)',
    background: isActive ? 'var(--primary)' : 'transparent',
  });

  const subNav = ({ isActive }) => ({
    display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px',
    borderRadius: '6px', textDecoration: 'none', fontSize: '0.82rem',
    color: isActive ? 'var(--primary)' : 'var(--text-muted)',
    background: isActive ? 'rgba(59,130,246,0.1)' : 'transparent',
  });

  return (
    <div className="app-container">
      <aside className="sidebar" style={{ width: '220px', display: 'flex', flexDirection: 'column', gap: 0, padding: '20px 12px' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px', paddingLeft: '4px' }}>
          <div style={{ background: 'var(--primary)', padding: '7px', borderRadius: '8px', display: 'flex' }}>
            <FileText size={18} color="white" />
          </div>
          <div>
            <div style={{ fontWeight: '700', fontSize: '0.88rem', lineHeight: 1.2 }}>PaperLessGov</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Digital Document Workflow</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
          <NavLink to="/dashboard" end style={nav}><Home size={15} /> Dashboard</NavLink>
          <NavLink to="/users" style={nav}><Users size={15} /> Users & Roles</NavLink>

          {localStorage.getItem('user_dept') === 'Common' && (
            <NavLink to="/departments" style={nav}><Building2 size={15} /> Departments</NavLink>
          )}
          <NavLink to="/audit-logs" style={nav}><History size={15} /> Audit Logs</NavLink>
          <NavLink to="/requests" style={nav}><Send size={15} /> Requests</NavLink>
          <NavLink to="/settings" style={nav}><Settings size={15} /> Settings</NavLink>
        </nav>

        {/* User */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.9rem', flexShrink: 0 }}>
              {name.charAt(0).toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontWeight: '600', fontSize: '0.82rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{role}</div>
            </div>
          </div>
          <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '7px', background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.82rem', fontWeight: '500' }}>
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      <main className="main-content" style={{ display: 'flex', flexDirection: 'column' }}>
        <header style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', padding: '16px 32px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border)', backdropFilter: 'blur(10px)', sticky: 'top', zIndex: 100 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(59,130,246,0.1)', color: 'var(--primary)', padding: '6px 16px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '700', border: '1px solid rgba(59,130,246,0.2)' }}>
              <Building2 size={14} /> {localStorage.getItem('user_dept') === 'Common' ? 'Main State Government' : (localStorage.getItem('user_dept') || 'State Government')}
            </div>
          </div>
        </header>
        <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
