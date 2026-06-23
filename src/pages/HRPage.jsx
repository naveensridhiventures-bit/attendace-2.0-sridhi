import { useState } from 'react'
import TopBar from '../components/TopBar'
import EmployeeAvatar from '../components/EmployeeAvatar'
import { api } from '../utils/api'
import { toast } from '../hooks/useToast'

export default function HRPage() {
  const [unlocked, setUnlocked] = useState(false)
  const [pin, setPin] = useState('')
  const [requests, setRequests] = useState({ leaves: [], permissions: [] })
  const [loading, setLoading] = useState(false)
  const [deciding, setDeciding] = useState(null)
  const [tab, setTab] = useState('leaves')
  const [unlocking, setUnlocking] = useState(false)
  const [pinDigits, setPinDigits] = useState(['', '', '', ''])

  async function unlock() {
    const fullPin = pinDigits.join('')
    if (fullPin.length < 4) { toast('Enter 4-digit PIN', 'error', '✗'); return }
    setUnlocking(true)
    try {
      await api.unlock({ pin: fullPin })
      setUnlocked(true)
      setPin(fullPin)
      loadRequests(fullPin)
    } catch (e) {
      toast('Wrong PIN — try again', 'error', '✗')
      setPinDigits(['', '', '', ''])
    } finally { setUnlocking(false) }
  }

  function handlePinInput(i, val) {
    if (!/^\d?$/.test(val)) return
    const next = [...pinDigits]
    next[i] = val
    setPinDigits(next)
    if (val && i < 3) {
      document.getElementById(`pin-${i+1}`)?.focus()
    }
    if (i === 3 && val) {
      setTimeout(() => {
        const p = [...next].join('')
        if (p.length === 4) {
          const fullPin = p
          setUnlocking(true)
          api.unlock({ pin: fullPin }).then(() => {
            setUnlocked(true)
            setPin(fullPin)
            loadRequests(fullPin)
          }).catch(() => {
            toast('Wrong PIN — try again', 'error', '✗')
            setPinDigits(['', '', '', ''])
            document.getElementById('pin-0')?.focus()
          }).finally(() => setUnlocking(false))
        }
      }, 100)
    }
  }

  async function loadRequests(p = pin) {
    setLoading(true)
    try {
      const data = await api.hrPendingRequests({ pin: p })
      setRequests({ leaves: data.leaves || [], permissions: data.permissions || [] })
    } catch (e) {
      toast('Failed to load requests', 'error', '⚠️')
    } finally { setLoading(false) }
  }

  async function decide(id, type, action) {
    setDeciding(id)
    try {
      await api.hrDecide({ id, type, action, hr_comments: '', pin })
      toast(`${action === 'approve' ? 'Approved' : 'Rejected'}!`, 'success', '✓')
      loadRequests()
    } catch (e) {
      toast(e.message || 'Failed', 'error', '✗')
    } finally { setDeciding(null) }
  }

  const current = tab === 'leaves' ? requests.leaves : requests.permissions
  const total = requests.leaves.length + requests.permissions.length

  if (!unlocked) return (
    <div className="page">
      <TopBar title="HR Dashboard" />
      <div className="hero-card">
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2.5, textTransform: 'uppercase', color: 'var(--leaf)', marginBottom: 6 }}>
          Restricted Access
        </div>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: 'white', lineHeight: 1.15 }}>
          HR <em style={{ color: 'var(--leaf-light)', fontStyle: 'italic' }}>Dashboard</em>
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,.6)', marginTop: 8 }}>
          Enter your PIN to access pending requests
        </div>
      </div>

      <div className="card" style={{ textAlign: 'center', padding: '28px 24px' }}>
        <div style={{ fontSize: 52, marginBottom: 12, animation: 'orbFloat 3s ease-in-out infinite' }}>🔐</div>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: 'var(--text-dark)', marginBottom: 6 }}>HR Access</div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 28, lineHeight: 1.5 }}>
          Enter your 4-digit PIN to view and manage leave and permission requests
        </p>

        {/* PIN dots */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 28 }}>
          {pinDigits.map((d, i) => (
            <input
              key={i}
              id={`pin-${i}`}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={e => handlePinInput(i, e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Backspace' && !d && i > 0) {
                  document.getElementById(`pin-${i-1}`)?.focus()
                }
              }}
              style={{
                width: 52, height: 60, textAlign: 'center',
                fontSize: 22, letterSpacing: 2, fontWeight: 700,
                border: d ? '2px solid var(--leaf)' : '2px solid #e5e7eb',
                borderRadius: 14, background: d ? '#f0fdf4' : '#f9fafb',
                outline: 'none', boxShadow: d ? '0 0 0 3px rgba(34,197,94,.12)' : 'none',
                transition: 'all .2s', caretColor: 'transparent'
              }}
            />
          ))}
        </div>

        <button className="btn btn-primary" onClick={unlock} disabled={unlocking || pinDigits.join('').length < 4}>
          {unlocking ? <div className="spinner" /> : '🔓 Unlock Dashboard'}
        </button>
      </div>
    </div>
  )

  return (
    <div className="page">
      <TopBar title="HR Dashboard" />

      <div className="hero-card">
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2.5, textTransform: 'uppercase', color: 'var(--leaf)', marginBottom: 6 }}>
          Pending Review
        </div>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, color: 'white', marginBottom: 16 }}>
          {total} Request{total !== 1 ? 's' : ''}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { num: requests.leaves.length, label: 'Leave Requests', icon: '📅' },
            { num: requests.permissions.length, label: 'Permissions', icon: '🕐' }
          ].map(({ num, label, icon }) => (
            <div key={label} className="hero-stat">
              <div style={{ fontSize: 14, marginBottom: 2 }}>{icon}</div>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, color: 'var(--leaf-light)' }}>{num}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,.55)', marginTop: 3 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="tab-bar">
        {['leaves', 'permissions'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`tab-btn ${tab === t ? 'active' : 'inactive'}`}>
            {t === 'leaves' ? `📅 Leaves (${requests.leaves.length})` : `🕐 Permissions (${requests.permissions.length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 'var(--max-w)' }}>
          {[1,2].map(i => (
            <div key={i} style={{ height: 120, borderRadius: 20 }} className="loading-shimmer" />
          ))}
        </div>
      ) : current.length === 0 ? (
        <div className="card">
          <div className="empty-state"><div className="empty-icon">✅</div><p>No pending {tab}</p></div>
        </div>
      ) : current.map((r, i) => (
        <div key={i} className="card" style={{ animationDelay: `${i * .08}s` }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
            <EmployeeAvatar name={r.employee_name || r.name} size={44} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{r.employee_name || r.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                {tab === 'leaves'
                  ? `${r.type} · ${r.from_date} → ${r.to_date} · ${r.days} days`
                  : `${r.date} · ${r.hours} hrs`}
              </div>
            </div>
            <span style={{
              background: 'rgba(245,158,11,.1)', color: '#d97706',
              fontSize: 10, fontWeight: 800, padding: '3px 10px',
              borderRadius: 100, letterSpacing: .5
            }}>PENDING</span>
          </div>
          <div style={{
            background: 'linear-gradient(135deg, #f9fafb, #f0fdf4)',
            borderRadius: 12, padding: '10px 14px', marginBottom: 14,
            fontSize: 13, color: 'var(--text-dark)', lineHeight: 1.5,
            border: '1px solid rgba(34,197,94,.08)'
          }}>
            {r.reason}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-success btn-sm"
              onClick={() => decide(r.id || r.sno, tab === 'leaves' ? 'leave' : 'permission', 'approve')}
              disabled={deciding === (r.id || r.sno)}
              style={{ flex: 1, borderRadius: 12, border: '1px solid rgba(34,197,94,.2)', fontWeight: 700, fontSize: 13 }}>
              ✓ Approve
            </button>
            <button className="btn btn-danger btn-sm"
              onClick={() => decide(r.id || r.sno, tab === 'leaves' ? 'leave' : 'permission', 'reject')}
              disabled={deciding === (r.id || r.sno)}
              style={{ flex: 1, borderRadius: 12, border: '1px solid rgba(239,68,68,.2)', fontWeight: 700, fontSize: 13 }}>
              ✗ Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
