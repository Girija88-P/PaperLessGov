import React, { useState, useEffect } from 'react';
import api from '../api';
import { Send, Inbox, Plus, Search, FileText, CheckCircle, XCircle, Clock, Shield, AlertCircle, Link } from 'lucide-react';

const Requests = () => {
  const [requests, setRequests] = useState([]);
  const [myFiles, setMyFiles] = useState([]);
  const [activeTab, setActiveTab] = useState('incoming');
  const [showNewModal, setShowNewModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkingReq, setLinkingReq] = useState(null);
  
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Decision/Remarks Modal
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [decisionType, setDecisionType] = useState('');
  const [decisionTargetId, setDecisionTargetId] = useState(null);
  const [decisionRemarks, setDecisionRemarks] = useState('');
  
  // New Request Form
  const [targetDept, setTargetDept] = useState('Finance');
  const [subject, setSubject] = useState('');
  const [purpose, setPurpose] = useState('');
  
  // Fulfillment Form (Target Dept)
  const [selectedFileId, setSelectedFileId] = useState(null);
  const [confLevel, setConfLevel] = useState('Simple');
  
  const userRole = localStorage.getItem('user_role');
  const userDept = localStorage.getItem('user_dept') || 'Common';

  const fetchData = async () => {
    setLoading(true);
    try {
      const [reqRes, fileRes] = await Promise.all([
        api.get('requests/'),
        api.get('files/') 
      ]);
      const reqData = Array.isArray(reqRes.data) ? reqRes.data : reqRes.data.results || [];
      setRequests(reqData);
      setMyFiles(Array.isArray(fileRes.data) ? fileRes.data : fileRes.data.results || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    const availableDepts = ['Finance', 'Health', 'Transport', 'Education', 'Urban Planning'].filter(d => d !== userDept);
    if (availableDepts.length > 0) setTargetDept(availableDepts[0]);
  }, [userDept]);

  const handleCreateRequest = async () => {
    if (!subject || !purpose) {
      alert("Please fill in all fields.");
      return;
    }
    try {
      await api.post('requests/', {
        target_department: targetDept,
        subject,
        purpose,
        confidentiality: 'Simple'
      });
      setShowNewModal(false);
      setSubject('');
      setPurpose('');
      fetchData();
    } catch (err) {
      console.error("Request Error:", err.response?.data || err.message);
      alert("Failed to send request: " + (err.response?.data?.error || "Server Error"));
    }
  };

  const handleLinkAndSetConf = async () => {
    if (!selectedFileId) return;
    try {
      await api.post(`requests/${linkingReq.id}/transition/`, { 
        decision: 'link', 
        file_id: selectedFileId,
        confidentiality: confLevel
      });
      setShowLinkModal(false);
      setLinkingReq(null);
      setSelectedFileId(null);
      fetchData();
    } catch (err) { alert("Failed to fulfill request"); }
  };

  const handleTransition = (id, decision) => {
    setDecisionTargetId(id);
    setDecisionType(decision);
    setDecisionRemarks('');
    setShowDecisionModal(true);
  };

  const submitDecision = async () => {
    try {
      await api.post(`requests/${decisionTargetId}/transition/`, { 
        decision: decisionType, 
        remarks: decisionRemarks 
      });
      setShowDecisionModal(false);
      fetchData();
    } catch (err) { alert("Action failed"); }
  };

  const incoming = requests.filter(r => 
    userDept.toLowerCase() === 'common' ||
    (r.target_department || '').toLowerCase() === userDept.toLowerCase()
  );
  const sent = requests.filter(r => 
    userDept.toLowerCase() === 'common' ||
    (r.requesting_department || '').toLowerCase() === userDept.toLowerCase()
  );
  
  const filteredMyFiles = myFiles.filter(f => 
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Approved': return { color: 'var(--success)', bg: 'rgba(34,197,94,0.1)' };
      case 'Denied': return { color: 'var(--danger)', bg: 'rgba(239,68,68,0.1)' };
      case 'Forwarded': return { color: 'var(--warning)', bg: 'rgba(245,158,11,0.1)' };
      case 'Escalated': return { color: 'var(--primary)', bg: 'rgba(59,130,246,0.1)' };
      default: return { color: 'var(--text-muted)', bg: 'rgba(255,255,255,0.05)' };
    }
  };

  const RequestCard = ({ req, isSent }) => {
    const style = getStatusStyle(req.status);
    
    // Mapping for Professional Government Roles by Sector
    const getDisplayRole = (role, dept) => {
      const mappings = {
        'Common': {
          'Head': 'Cabinet Minister',
          'Higher Authority': 'Chief Secretary',
          'Officer': 'Joint Secretary',
          'Clerk': 'Secretariat Clerk',
          'Admin': 'System Administrator'
        },
        'Finance': {
          'Head': 'Director of Finance',
          'Higher Authority': 'Treasury Controller',
          'Officer': 'Accounts Officer',
          'Clerk': 'Finance Assistant'
        },
        'Health': {
          'Head': 'Medical Director',
          'Higher Authority': 'Chief Medical Officer',
          'Officer': 'Health Officer',
          'Clerk': 'Health Desk Clerk'
        },
        'Transport': {
          'Head': 'Transport Commissioner',
          'Higher Authority': 'Regional Transport Officer',
          'Officer': 'Enforcement Officer',
          'Clerk': 'Transport Assistant'
        },
        'Education': {
          'Head': 'Director of Education',
          'Higher Authority': 'District Education Officer',
          'Officer': 'Block Education Officer',
          'Clerk': 'Education Assistant'
        },
        'Urban Planning': {
          'Head': 'Chief Town Planner',
          'Higher Authority': 'Urban Development Authority',
          'Officer': 'Planning Officer',
          'Clerk': 'Planning Assistant'
        }
      };
      
      const deptMapping = mappings[dept] || mappings['Common'];
      return deptMapping[role] || role;
    };

    return (
      <div className="glass-panel" style={{ marginBottom: '16px', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '4px' }}>{req.subject}</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {isSent ? (
                <>To: <strong>{req.target_department === 'Common' ? 'Main State Govt' : req.target_department}</strong></>
              ) : (
                <>From: <strong>{req.requesting_department === 'Common' ? 'Main State Govt' : req.requesting_department}</strong> | {getDisplayRole(req.requesting_user_role, req.requesting_user_dept)} ({req.requesting_user_name})</>
              )}
            </p>
          </div>
          <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700', color: style.color, background: style.bg, border: `1px solid ${style.color}30` }}>
            {req.status}
          </span>
        </div>
        
        <div style={{ background: 'rgba(0,0,0,0.1)', padding: '12px', borderRadius: '8px', marginBottom: '12px' }}>
          <p style={{ fontSize: '0.85rem', marginBottom: '8px' }}><strong>Purpose:</strong> {req.purpose}</p>
          {req.file_details && (
            <div style={{ padding: '8px', background: 'rgba(59,130,246,0.1)', borderRadius: '6px', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={14} color="var(--primary)" />
              <span style={{ fontSize: '0.85rem' }}><strong>Linked:</strong> {req.file_details.name}</span>
            </div>
          )}
          {req.remarks && <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '8px' }}><strong>Latest Remark:</strong> {req.remarks}</p>}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={12} /> {new Date(req.created_at).toLocaleDateString()}
            </span>
            {req.file && (
              <span style={{ fontSize: '0.75rem', color: req.confidentiality === 'Confidential' ? 'var(--danger)' : 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Shield size={12} /> {req.confidentiality}
              </span>
            )}
          </div>
          
          {!isSent && req.status !== 'Approved' && req.status !== 'Denied' && (
            <div style={{ display: 'flex', gap: '8px' }}>
              {!req.file ? (
                userRole === 'Clerk' ? (
                  <button onClick={() => { setLinkingReq(req); setShowLinkModal(true); }} className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.75rem', background: 'var(--warning)', color: 'black' }}>
                    <Link size={12} /> Process & Link File
                  </button>
                ) : (
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} /> Awaiting Clerk Fulfillment
                  </span>
                )
              ) : (
                <>
                  {userRole === 'Clerk' && req.status === 'Pending' && (
                    <>
                      {req.confidentiality === 'Simple' ? (
                        <>
                          <button onClick={() => handleTransition(req.id, 'approve')} style={{ padding: '6px 12px', fontSize: '0.75rem', background: 'var(--success)', border: 'none', color: 'white', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>
                            Release Document
                          </button>
                          <button onClick={() => handleTransition(req.id, 'deny')} style={{ padding: '6px 12px', fontSize: '0.75rem', background: 'var(--danger)', border: 'none', color: 'white', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>
                            Deny Access
                          </button>
                        </>
                      ) : (
                        <button onClick={() => handleTransition(req.id, 'forward')} className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
                          Forward to Officer
                        </button>
                      )}
                    </>
                  )}
                  
                  {userRole === 'Officer' && req.status !== 'Escalated' && (
                    <button onClick={() => handleTransition(req.id, 'forward')} className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.75rem', background: 'var(--warning)', color: 'black' }}>
                      Forward to Department Head
                    </button>
                  )}

                  {(userRole === 'Head' || userRole === 'Higher Authority') && req.status !== 'Approved' && (
                    <>
                      <button onClick={() => handleTransition(req.id, 'approve')} style={{ padding: '6px 12px', fontSize: '0.75rem', background: 'var(--success)', border: 'none', color: 'white', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>
                        Release Document
                      </button>
                      <button onClick={() => handleTransition(req.id, 'deny')} style={{ padding: '6px 12px', fontSize: '0.75rem', background: 'var(--danger)', border: 'none', color: 'white', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>
                        Deny Access
                      </button>
                      {userDept !== 'Common' && req.status !== 'Escalated' && (
                        <button onClick={() => handleTransition(req.id, 'escalate')} style={{ padding: '6px 12px', fontSize: '0.75rem', background: 'var(--primary)', border: 'none', color: 'white', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>
                          Escalate to State Govt
                        </button>
                      )}
                    </>
                  )}
                  
                  {/* State Government Final Authority Actions */}
                  {userDept === 'Common' && req.status === 'Escalated' && (
                    <div style={{ display: 'flex', gap: '8px', borderLeft: '2px solid var(--primary)', paddingLeft: '12px' }}>
                      <button onClick={() => handleTransition(req.id, 'approve')} style={{ padding: '6px 12px', fontSize: '0.75rem', background: 'var(--success)', border: 'none', color: 'white', borderRadius: '6px', cursor: 'pointer', fontWeight: '700' }}>
                        State Govt: Approve Release
                      </button>
                      <button onClick={() => handleTransition(req.id, 'deny')} style={{ padding: '6px 12px', fontSize: '0.75rem', background: 'var(--danger)', border: 'none', color: 'white', borderRadius: '6px', cursor: 'pointer', fontWeight: '700' }}>
                        State Govt: Deny Access
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
          
          {req.status === 'Approved' && (
             <div style={{ color: 'var(--success)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
               <CheckCircle size={14} /> Official Access Granted
             </div>
          )}
        </div>

        {req.status === 'Approved' && req.file_details && (
           <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(34,197,94,0.1)', borderRadius: '10px', border: '1px solid rgba(34,197,94,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
               <div style={{ padding: '8px', background: 'var(--success)', borderRadius: '8px', color: 'white' }}>
                 <FileText size={18} />
               </div>
               <div>
                 <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--success)' }}>Access Granted</div>
                 <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Official Document Released</div>
               </div>
             </div>
             <a 
               href={req.file_details.file_path.startsWith('http') ? req.file_details.file_path : `http://127.0.0.1:8000/media/${req.file_details.file_path}`} 
               target="_blank" 
               rel="noopener noreferrer"
               className="btn-primary" 
               style={{ padding: '8px 16px', fontSize: '0.8rem', background: 'var(--success)', color: 'white', textDecoration: 'none', borderRadius: '8px', fontWeight: '600' }}
             >
               View Document
             </a>
           </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ marginBottom: '4px' }}>Document Requisitions</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Formal information requests between departments</p>
        </div>
        {activeTab === 'sent' && (
          <button onClick={() => setShowNewModal(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} /> New Requisition
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '10px', marginBottom: '24px', width: 'fit-content' }}>
        <button onClick={() => setActiveTab('incoming')} style={{ padding: '8px 24px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '0.88rem', background: activeTab === 'incoming' ? 'var(--primary)' : 'transparent', color: activeTab === 'incoming' ? 'white' : 'var(--text-muted)', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Inbox size={16} /> Received ({incoming.length})
        </button>
        <button onClick={() => setActiveTab('sent')} style={{ padding: '8px 24px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '0.88rem', background: activeTab === 'sent' ? 'var(--primary)' : 'transparent', color: activeTab === 'sent' ? 'white' : 'var(--text-muted)', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Send size={16} /> My Sent Requests ({sent.length})
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '100px', color: 'var(--text-muted)' }}>Loading...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(450px, 1fr))', gap: '20px' }}>
          {activeTab === 'incoming' ? (
            incoming.length > 0 ? incoming.map(r => <RequestCard key={r.id} req={r} isSent={false} />) : <p style={{ color: 'var(--text-muted)' }}>No received requisitions.</p>
          ) : (
            sent.length > 0 ? sent.map(r => <RequestCard key={r.id} req={r} isSent={true} />) : <p style={{ color: 'var(--text-muted)' }}>No sent requisitions.</p>
          )}
        </div>
      )}

      {/* New Requisition Modal (Simplified) */}
      {showNewModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h2 style={{ margin: 0 }}>Formal Requisition</h2>
              <button onClick={() => setShowNewModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
            </div>

            <div className="input-group">
              <label>Target Department</label>
              <select className="glass-input" value={targetDept} onChange={e => setTargetDept(e.target.value)}>
                {['Finance', 'Health', 'Transport', 'Education', 'Urban Planning']
                  .filter(d => d !== userDept)
                  .map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))
                }
              </select>
            </div>

            <div className="input-group">
              <label>Subject / Information Required</label>
              <input className="glass-input" placeholder="e.g. Budget Report Q1 2024" value={subject} onChange={e => setSubject(e.target.value)} />
            </div>

            <div className="input-group">
              <label>Purpose of Requisition</label>
              <textarea className="glass-input" rows={4} placeholder="Explain why your department needs this data..." value={purpose} onChange={e => setPurpose(e.target.value)} />
            </div>

            <button onClick={handleCreateRequest} className="btn-primary" style={{ width: '100%', padding: '12px', marginTop: '16px', fontWeight: '700' }}>
              Submit Official Request
            </button>
          </div>
        </div>
      )}

      {/* Fulfillment Modal (Target Clerk decides confidentiality) */}
      {showLinkModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '600px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <h2 style={{ margin: 0 }}>Process Requisition</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Searching for: <strong>{linkingReq?.subject}</strong></p>
              </div>
              <button onClick={() => { setShowLinkModal(false); setLinkingReq(null); setSelectedFileId(null); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
            </div>

            <div className="input-group">
              <label>1. Search Your Department Files</label>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input className="glass-input" placeholder="Filter files..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '40px', width: '100%' }} />
              </div>
              <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px' }}>
                {filteredMyFiles.map(f => (
                  <div key={f.id} onClick={() => setSelectedFileId(f.id)} style={{ padding: '10px', borderRadius: '8px', cursor: 'pointer', border: selectedFileId === f.id ? '1.5px solid var(--primary)' : '1px solid transparent', background: selectedFileId === f.id ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.03)' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>{f.name}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="input-group" style={{ marginTop: '20px' }}>
              <label>2. Define Confidentiality (Your Decision)</label>
              <select className="glass-input" value={confLevel} onChange={e => setConfLevel(e.target.value)}>
                <option value="Simple">Simple (Immediate Release)</option>
                <option value="Confidential">Confidential (Requires Head Approval)</option>
              </select>
            </div>

            <button onClick={handleLinkAndSetConf} className="btn-primary" style={{ width: '100%', padding: '12px', marginTop: '24px', fontWeight: '700' }} disabled={!selectedFileId}>
              Confirm & Attach Document
            </button>
          </div>
        </div>
      )}
      {/* Decision Remarks Modal */}
      {showDecisionModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(15px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '450px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(59,130,246,0.1)', color: 'var(--primary)' }}>
                <CheckCircle size={24} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Finalize Decision</h2>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Action: <span style={{ color: 'var(--primary)', fontWeight: '700', textTransform: 'capitalize' }}>{decisionType}</span></p>
              </div>
            </div>

            <div className="input-group" style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: '600' }}>Official Remarks / Note</label>
              <textarea 
                className="glass-input" 
                style={{ minHeight: '120px', resize: 'none' }}
                placeholder="Provide a reason or instructions for this action..." 
                value={decisionRemarks} 
                onChange={e => setDecisionRemarks(e.target.value)} 
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => setShowDecisionModal(false)} 
                style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'white', cursor: 'pointer', fontWeight: '600' }}
              >
                Cancel
              </button>
              <button 
                onClick={submitDecision} 
                className="btn-primary" 
                style={{ flex: 2, padding: '12px', borderRadius: '10px' }}
              >
                Confirm Decision
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Requests;
