import { useState, useEffect } from 'react'
import TopBar from '../components/TopBar'
import EmployeeAvatar from '../components/EmployeeAvatar'
import { api } from '../utils/api'
import { toast } from '../hooks/useToast'

// Months auto-generated (current + past 11)
function getMonths() {
  const now = new Date()
  const months = []
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const label = d.toLocaleString('en-IN', { month: 'short', year: 'numeric' })
    const key = `${d.toLocaleString('en-IN', { month: 'long' })}-${d.getFullYear()}`
    months.push({ label, key, month: d.getMonth() + 1, year: d.getFullYear() })
  }
  return months
}

const MONTHS = getMonths()

function fmt(n) {
  if (!n && n !== 0) return '—'
  return '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })
}

function pct(paid, total) {
  if (!total) return 0
  return Math.min(100, Math.round((paid / total) * 100))
}

export default function SalaryPage() {
  const [unlocked, setUnlocked] = useState(false)
  const [pin, setPin] = useState('')
  const [pinDigits, setPinDigits] = useState(['', '', '', ''])
  const [unlocking, setUnlocking] = useState(false)
  const [selMonth, setSelMonth] = useState(MONTHS[0])
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState(null)

  async function loadSalary() {
    setLoading(true)
    try {
      const d = await api.salaryData({ pin, month: selMonth.month, year: selMonth.year })
      setData(d.employees || [])
    } catch {
      toast('Could not load salary data', 'error', '⚠️')
    } finally { setLoading(false) }
  }

  useEffect(() => {
    if (unlocked) loadSalary()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selMonth, unlocked])

  async function unlock() {
    const fullPin = pinDigits.join('')
    if (fullPin.length < 4) { toast('Enter 4-digit PIN', 'error', '✗'); return }
    setUnlocking(true)
    try {
      await api.unlock({ pin: fullPin })
      setUnlocked(true)
      setPin(fullPin)
    } catch {
      toast('Wrong PIN — try again', 'error', '✗')
      setPinDigits(['', '', '', ''])
      document.getElementById('spin-0')?.focus()
    } finally { setUnlocking(false) }
  }

  function handlePinInput(i, val) {
    if (!/^\d?$/.test(val)) return
    const next = [...pinDigits]; next[i] = val
    setPinDigits(next)
    if (val && i < 3) document.getElementById(`spin-${i + 1}`)?.focus()
    if (i === 3 && val) {
      const full = next.join('')
      if (full.length === 4) setTimeout(() => {
        setUnlocking(true)
        api.unlock({ pin: full }).then(() => {
          setUnlocked(true); setPin(full)
        }).catch(() => {
          toast('Wrong PIN', 'error', '✗')
          setPinDigits(['', '', '', ''])
          document.getElementById('spin-0')?.focus()
        }).finally(() => setUnlocking(false))
      }, 80)
    }
  }

  const filtered = data.filter(e =>
    !search || e.name?.toLowerCase().includes(search.toLowerCase())
  )


  const totalGross = data.reduce((s, e) => s + (Number(e.gross_salary) || 0), 0)
  const totalNet = data.reduce((s, e) => s + (Number(e.net_salary) || 0), 0)
  const totalAdvance = data.reduce((s, e) => s + (Number(e.advance) || 0), 0)

  if (!unlocked) return (
    <div className="page">
      <TopBar title="Salary" />
      <div className="hero-card">
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2.5, textTransform: 'uppercase', color: 'var(--leaf)', marginBottom: 6 }}>
          Salary Dashboard
        </div>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: 'white', lineHeight: 1.15 }}>
          Monthly <em style={{ color: 'var(--leaf-light)', fontStyle: 'italic' }}>Payroll</em>
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,.6)', marginTop: 8 }}>
          Auto-synced from Google Sheets every month
        </div>
      </div>

      <div className="card" style={{ textAlign: 'center', padding: '28px 24px' }}>
        <div style={{ fontSize: 52, marginBottom: 12, animation: 'orbFloat 3s ease-in-out infinite' }}>💰</div>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, marginBottom: 6 }}>Salary Access</div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 28, lineHeight: 1.5 }}>
          Enter your PIN to view payroll data fetched live from the attendance sheet
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 28 }}>
          {pinDigits.map((d, i) => (
            <input key={i} id={`spin-${i}`} type="password" inputMode="numeric" maxLength={1}
              value={d} onChange={e => handlePinInput(i, e.target.value)}
              onKeyDown={e => { if (e.key === 'Backspace' && !d && i > 0) document.getElementById(`spin-${i - 1}`)?.focus() }}
              className={`pin-input ${d ? 'filled' : ''}`}
            />
          ))}
        </div>
        <button className="btn btn-primary" onClick={unlock} disabled={unlocking || pinDigits.join('').length < 4}>
          {unlocking ? <div className="spinner" /> : '🔓 View Salary'}
        </button>
      </div>
    </div>
  )

  return (
    <div className="page">
      <TopBar title="Salary" />

      <div className="hero-card">
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2.5, textTransform: 'uppercase', color: 'var(--leaf)', marginBottom: 6 }}>
          {selMonth.label} Payroll
        </div>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, color: 'white', marginBottom: 16 }}>
          Live from <em style={{ color: 'var(--leaf-light)', fontStyle: 'italic' }}>Google Sheets</em>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { num: fmt(totalGross), label: 'Gross', icon: '💼' },
            { num: fmt(totalNet),   label: 'Net Pay', icon: '💸' },
            { num: data.length,    label: 'Employees', icon: '👥' },
          ].map(({ num, label, icon }) => (
            <div key={label} className="hero-stat">
              <div style={{ fontSize: 12, marginBottom: 2 }}>{icon}</div>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 16, color: 'var(--leaf-light)', lineHeight: 1 }}>{num}</div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,.5)', marginTop: 3 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Month selector */}
      <div style={{ background: 'white', borderRadius: 18, padding: '12px 14px', boxShadow: 'var(--shadow-card)', border: '1px solid rgba(34,197,94,.06)' }}>
        <div className="section-header">📅 Select Month</div>
        <div className="month-scroll">
          {MONTHS.map(m => (
            <button key={m.key} className={`month-chip ${selMonth.key === m.key ? 'active' : ''}`}
              onClick={() => setSelMonth(m)}>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary stats */}
      {!loading && data.length > 0 && (
        <div className="stat-grid">
          {[
            { num: fmt(totalGross), label: 'Total Gross', color: '#16a34a' },
            { num: fmt(totalNet),   label: 'Total Net',   color: '#0284c7' },
            { num: fmt(totalAdvance), label: 'Advances',  color: '#d97706' },
            { num: data.filter(e => (e.net_salary || 0) > 0).length, label: 'Paid', color: '#7c3aed' },
          ].map(({ num, label, color }, i) => (
            <div key={label} className="stat-box" style={{ animationDelay: `${i * .07}s` }}>
              <div className="stat-num" style={{ color }}>{num}</div>
              <div className="stat-label">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      {!loading && data.length > 0 && (
        <div className="field" style={{ marginBottom: 0 }}>
          <input placeholder="🔍  Search employee…" value={search} onChange={e => setSearch(e.target.value)}
            style={{ borderRadius: 14, fontSize: 14, padding: '11px 14px' }} />
        </div>
      )}

      {/* Employee list */}
      <div>
        {loading ? (
          [1, 2, 3, 4].map(i => (
            <div key={i} style={{ height: 80, borderRadius: 16, marginBottom: 10 }} className="loading-shimmer" />
          ))
        ) : filtered.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-icon">📊</div>
              <p>{data.length === 0 ? 'No salary data for this month' : 'No employees found'}</p>
            </div>
          </div>
        ) : (
          filtered.map((emp, i) => {
            const isOpen = expanded === emp.name
            const p = pct(emp.paid_days, emp.total_days)
            return (
              <div key={i} className="salary-employee-card" style={{ marginBottom: 10, animationDelay: `${i * .05}s`, cursor: 'pointer' }}
                onClick={() => setExpanded(isOpen ? null : emp.name)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <EmployeeAvatar name={emp.name} size={40} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-dark)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {emp.name}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                      {emp.role || ''} · {emp.paid_days || 0}/{emp.total_days || 0} days
                    </div>
                    <div className="salary-bar-track" style={{ '--target-width': p + '%' }}>
                      <div className="salary-bar-fill" style={{ width: p + '%' }} />
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 16, color: 'var(--forest)', fontWeight: 700 }}>
                      {fmt(emp.net_salary)}
                    </div>
                    <span className={`badge badge-${emp.warning === 'OK' ? 'OK' : 'pending'}`} style={{ fontSize: 9 }}>
                      {emp.warning || '—'}
                    </span>
                  </div>
                </div>

                {isOpen && (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(34,197,94,.1)', animation: 'fadeUp .2s ease' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                      {[
                        { label: 'Monthly', val: fmt(emp.monthly_salary) },
                        { label: 'Gross',   val: fmt(emp.gross_salary) },
                        { label: 'Advance', val: fmt(emp.advance) },
                        { label: 'P Count', val: emp.p_count ?? '—' },
                        { label: 'A Count', val: emp.a_count ?? '—' },
                        { label: 'WO Count',val: emp.wo_count ?? '—' },
                        { label: 'Per Day',  val: fmt(emp.per_day_salary) },
                        { label: 'Paid Days',val: emp.paid_days ?? '—' },
                        { label: 'Net Pay',  val: fmt(emp.net_salary) },
                      ].map(({ label, val }) => (
                        <div key={label} style={{ background: 'white', borderRadius: 10, padding: '8px 10px', textAlign: 'center', border: '1px solid rgba(34,197,94,.08)' }}>
                          <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-mid)', letterSpacing: .5, textTransform: 'uppercase' }}>{label}</div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-dark)', marginTop: 2 }}>{val}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Info note */}
      <div style={{ background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', borderRadius: 16, padding: '14px 16px', border: '1px solid rgba(34,197,94,.12)' }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--forest-mid)', marginBottom: 6 }}>ℹ️ How salary is calculated</div>
        {[
          '📋 Attendance is pulled from the monthly attendance sheet',
          '💰 Net = (Monthly ÷ Total Days) × Paid Days − Advance',
          '📅 New tabs are auto-created each month for Attendance, Salary & Permission',
          '✏️ Edit employee data in the Employees sheet — changes reflect immediately',
        ].map((t, i) => (
          <div key={i} style={{ fontSize: 12, color: 'var(--forest-mid)', marginBottom: 4, display: 'flex', gap: 6, animation: `slideRight .3s ease ${i * .06}s both` }}>
            {t}
          </div>
        ))}
      </div>
    </div>
  )
}
