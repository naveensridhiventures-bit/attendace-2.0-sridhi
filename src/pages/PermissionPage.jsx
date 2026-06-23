import { useState } from 'react'
import TopBar from '../components/TopBar'
import EmployeeSelect from '../components/EmployeeSelect'
import { api } from '../utils/api'
import { toast } from '../hooks/useToast'

const REASONS = ['Personal Work', 'Family Emergency', 'Health Issue', 'Vehicle Issue', 'Other']
const HOURS = ['30 MIN', '1 HRS', '1:30 HRS', '2 HRS', '2:30 HRS', '3 HRS', '4 HRS']

export default function PermissionPage() {
  const [form, setForm] = useState({ name: '', reason: '', date: '', hours: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  function set(k, v) { setForm(p => ({ ...p, [k]: v })) }

  async function handleSubmit() {
    const { name, reason, date, hours } = form
    if (!name || !reason || !date || !hours) { toast('Fill all fields', 'error', '✗'); return }
    setSubmitting(true)
    try {
      await api.submitPermission({ employee_name: name, reason, date, hours })
      toast('Permission request submitted!', 'success', '✓')
      setSubmitted(true)
      setTimeout(() => { setSubmitted(false); setForm({ name: '', reason: '', date: '', hours: '' }) }, 2500)
    } catch (e) {
      toast(e.message || 'Failed', 'error', '✗')
    } finally { setSubmitting(false) }
  }

  const STEPS = [
    { icon: '📝', label: 'Submit your request with date and hours' },
    { icon: '👀', label: 'HR reviews and approves or rejects' },
    { icon: '🔔', label: 'You get notified of the decision' },
    { icon: '📋', label: 'Auto-logged to June-2026 Permission sheet' },
  ]

  return (
    <div className="page">
      <TopBar title="Permission" />

      <div className="hero-card">
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2.5, textTransform: 'uppercase', color: 'var(--leaf)', marginBottom: 6, position: 'relative', zIndex: 1 }}>
          Permission Request
        </div>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: 'white', lineHeight: 1.15, position: 'relative', zIndex: 1 }}>
          Early Leave or <em style={{ color: 'var(--leaf-light)', fontStyle: 'italic' }}>Late Start</em>
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,.6)', marginTop: 8, position: 'relative', zIndex: 1 }}>
          Logged automatically in the monthly permission tab
        </div>
      </div>

      {submitted ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px 24px', animation: 'scaleIn .35s cubic-bezier(.34,1.56,.64,1)' }}>
          <div style={{ fontSize: 56, marginBottom: 14, animation: 'heartbeat 1s ease' }}>✅</div>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: 'var(--forest)', marginBottom: 6 }}>Request Submitted!</div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>HR will review and notify you soon</p>
        </div>
      ) : (
        <div className="card">
          <div className="card-title">🕐 Permission Request</div>
          <div className="field">
            <label>Employee</label>
            <EmployeeSelect value={form.name} onChange={v => set('name', v)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="field">
              <label>Date</label>
              <input type="date" value={form.date} onChange={e => set('date', e.target.value)} />
            </div>
            <div className="field">
              <label>Hours Needed</label>
              <select value={form.hours} onChange={e => set('hours', e.target.value)}>
                <option value="">Select…</option>
                {HOURS.map(h => <option key={h}>{h}</option>)}
              </select>
            </div>
          </div>
          <div className="field">
            <label>Reason</label>
            <select value={form.reason} onChange={e => set('reason', e.target.value)}>
              <option value="">Select reason…</option>
              {REASONS.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? <div className="spinner" /> : '📤 Submit Request'}
          </button>
        </div>
      )}

      <div className="card" style={{ background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', border: '1px solid rgba(34,197,94,.12)' }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--forest-mid)', marginBottom: 14, fontFamily: "'DM Serif Display', serif" }}>
          📌 How it works
        </div>
        {STEPS.map((step, i) => (
          <div key={i} style={{
            display: 'flex', gap: 12, marginBottom: 10, alignItems: 'center',
            animation: 'slideRight .35s ease both', animationDelay: `${i * .08}s`
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 12, background: 'white',
              boxShadow: '0 4px 12px rgba(10,79,46,.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, flexShrink: 0
            }}>{step.icon}</div>
            <div>
              <span style={{ fontSize: 9, fontWeight: 800, color: 'var(--leaf)', letterSpacing: 1 }}>STEP {i + 1}</span>
              <div style={{ fontSize: 13, color: 'var(--forest-mid)', lineHeight: 1.4, fontWeight: 500 }}>{step.label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
