import { useState } from 'react'
import TopBar from '../components/TopBar'
import EmployeeSelect from '../components/EmployeeSelect'
import { api } from '../utils/api'
import { toast } from '../hooks/useToast'

const LEAVE_TYPES = ['Casual Leave', 'Sick Leave', 'Emergency Leave', 'Personal Leave', 'Maternity/Paternity']

export default function LeavePage() {
  const [tab, setTab] = useState('apply')
  const [form, setForm] = useState({ name: '', type: '', reason: '', from: '', to: '' })
  const [submitting, setSubmitting] = useState(false)
  const [myRequests, setMyRequests] = useState([])
  const [loadingMy, setLoadingMy] = useState(false)
  const [myName, setMyName] = useState('')

  function set(k, v) { setForm(p => ({ ...p, [k]: v })) }

  async function handleSubmit() {
    const { name, type, reason, from, to } = form
    if (!name || !type || !reason || !from || !to) { toast('Fill all fields', 'error', '✗'); return }
    if (new Date(to) < new Date(from)) { toast('End date must be after start date', 'error', '✗'); return }
    setSubmitting(true)
    try {
      await api.submitLeave({ employee_name: name, leave_type: type, reason, from_date: from, to_date: to })
      toast('Leave request submitted!', 'success', '✓')
      setForm({ name: '', type: '', reason: '', from: '', to: '' })
    } catch (e) {
      toast(e.message || 'Submission failed', 'error', '✗')
    } finally { setSubmitting(false) }
  }

  async function loadMyRequests() {
    if (!myName.trim()) { toast('Choose your name first', 'error', '✗'); return }
    setLoadingMy(true)
    try {
      const data = await api.myRequests({ employee_name: myName.trim() })
      setMyRequests(data.requests || [])
    } catch (e) {
      toast('Could not load requests', 'error', '⚠️')
    } finally { setLoadingMy(false) }
  }

  const days = (form.from && form.to)
    ? Math.max(0, Math.ceil((new Date(form.to) - new Date(form.from)) / 86400000) + 1)
    : 0

  return (
    <div className="page">
      <TopBar title="Leave" />

      <div className="hero-card">
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2.5, textTransform: 'uppercase', color: 'var(--leaf)', marginBottom: 6 }}>
          Leave Management
        </div>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: 'white', lineHeight: 1.15 }}>
          Apply or <em style={{ color: 'var(--leaf-light)', fontStyle: 'italic' }}>Track</em> Leaves
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,.6)', marginTop: 8 }}>
          Submit requests and check approval status
        </div>
      </div>

      <div className="tab-bar">
        {['apply', 'my'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`tab-btn ${tab === t ? 'active' : 'inactive'}`}>
            {t === 'apply' ? '📋 Apply Leave' : '📂 My Requests'}
          </button>
        ))}
      </div>

      {tab === 'apply' && (
        <div className="card">
          <div className="card-title">📋 Leave Application</div>
          <div className="field">
            <label>Employee</label>
            <EmployeeSelect value={form.name} onChange={v => set('name', v)} />
          </div>
          <div className="field">
            <label>Leave Type</label>
            <select value={form.type} onChange={e => set('type', e.target.value)}>
              <option value="">Select type…</option>
              {LEAVE_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="field">
              <label>From Date</label>
              <input type="date" value={form.from} onChange={e => set('from', e.target.value)} />
            </div>
            <div className="field">
              <label>To Date</label>
              <input type="date" value={form.to} onChange={e => set('to', e.target.value)} />
            </div>
          </div>
          {days > 0 && (
            <div style={{
              background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
              border: '1px solid rgba(34,197,94,.2)',
              borderRadius: 12, padding: '10px 14px', marginBottom: 12,
              fontSize: 13, color: 'var(--forest-mid)', fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: 8,
              animation: 'scaleIn .2s ease'
            }}>
              📅 {days} day{days > 1 ? 's' : ''} selected
              <div style={{
                marginLeft: 'auto', background: 'var(--leaf)', color: 'white',
                borderRadius: 100, padding: '2px 10px', fontSize: 11, fontWeight: 800
              }}>{days}d</div>
            </div>
          )}
          <div className="field">
            <label>Reason</label>
            <textarea placeholder="Briefly describe the reason…" value={form.reason} onChange={e => set('reason', e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? <div className="spinner" /> : '📤 Submit Application'}
          </button>
        </div>
      )}

      {tab === 'my' && (
        <div className="card">
          <div className="card-title">📂 My Leave Requests</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <EmployeeSelect value={myName} onChange={setMyName} placeholder="Select your name…" />
            </div>
            <button className="btn btn-primary btn-sm" onClick={loadMyRequests} disabled={loadingMy}
              style={{ width: 'auto', padding: '12px 18px', borderRadius: 14 }}>
              {loadingMy ? <div className="spinner" style={{ width: 16, height: 16 }} /> : 'View'}
            </button>
          </div>
          {myRequests.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">📭</div><p>No requests found</p></div>
          ) : myRequests.map((r, i) => (
            <div key={i} style={{
              padding: '14px', borderRadius: 14,
              background: 'linear-gradient(135deg, #f9fafb, #f0fdf4)',
              marginBottom: 8, border: '1px solid rgba(34,197,94,.08)',
              animation: 'slideRight .3s ease both',
              animationDelay: `${i * .06}s`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontWeight: 700, fontSize: 14 }}>{r.type}</span>
                <span className={`badge badge-${(r.status || 'pending').toLowerCase()}`}>{r.status}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {r.from_date} → {r.to_date} · {r.days} days
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{r.reason}</div>
              {r.hr_comments && (
                <div style={{ fontSize: 12, color: 'var(--forest-mid)', marginTop: 6, fontStyle: 'italic', fontWeight: 500 }}>
                  💬 HR: {r.hr_comments}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
