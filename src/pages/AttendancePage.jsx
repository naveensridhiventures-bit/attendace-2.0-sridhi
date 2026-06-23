import { useState, useEffect } from 'react'
import { MapPin, RefreshCw, TrendingUp } from 'lucide-react'
import TopBar from '../components/TopBar'
import StatusGrid from '../components/StatusGrid'
import EmployeeAvatar from '../components/EmployeeAvatar'
import EmployeeSelect from '../components/EmployeeSelect'
import { api } from '../utils/api'
import { useLocation } from '../hooks/useLocation'
import { toast } from '../hooks/useToast'
import { formatDate, nowIndia } from '../utils/helpers'

export default function AttendancePage() {
  const [employee, setEmployee] = useState('')
  const [status, setStatus] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [todayData, setTodayData] = useState([])
  const [loadingToday, setLoadingToday] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [justMarked, setJustMarked] = useState(null)
  const { location, loading: locLoading, fetchLocation } = useLocation()

  useEffect(() => { loadToday() }, [])

  async function loadToday() {
    setLoadingToday(true)
    try {
      const data = await api.todayStatus()
      setTodayData(data.employees || [])
    } catch {
      toast("Could not load today's status", 'error', '⚠️')
    } finally { setLoadingToday(false) }
  }

  async function handleRefresh() {
    setRefreshing(true)
    await loadToday()
    setRefreshing(false)
  }

  async function handleSubmit() {
    if (!employee.trim()) { toast('Choose an employee', 'error', '✗'); return }
    if (!status) { toast('Select a status', 'error', '✗'); return }
    setSubmitting(true)
    try {
      let lat = '', lng = ''
      if (status === 'P' || status === 'WOP') {
        const loc = location || await fetchLocation()
        lat = loc.lat; lng = loc.lng
      }
      await api.markAttendance({ employee_name: employee.trim(), status, latitude: lat, longitude: lng })
      setJustMarked(employee)
      toast(`✓ Marked ${status} for ${employee}`, 'success', '✓')
      setEmployee(''); setStatus('')
      setTimeout(() => { loadToday(); setJustMarked(null) }, 1200)
    } catch (e) {
      toast(e.message || 'Failed to mark attendance', 'error', '✗')
    } finally { setSubmitting(false) }
  }

  const presentCount = todayData.filter(e => e.status === 'P' || e.status === 'WOP').length
  const absentCount = todayData.filter(e => e.status === 'A').length
  const woCount = todayData.filter(e => e.status === 'WO').length

  return (
    <div className="page">
      <TopBar />

      {/* Hero */}
      <div className="hero-card">
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2.5, textTransform: 'uppercase', color: 'var(--leaf)', marginBottom: 6, position: 'relative', zIndex: 1 }}>
          Daily Attendance
        </div>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, color: 'white', lineHeight: 1.1, marginBottom: 18, position: 'relative', zIndex: 1 }}>
          Mark Today's <em style={{ fontStyle: 'italic', color: 'var(--leaf-light)' }}>Record</em>
        </div>
        <div style={{ display: 'flex', gap: 8, position: 'relative', zIndex: 1 }}>
          {[
            { num: presentCount, label: 'Present', icon: '🟢' },
            { num: absentCount,  label: 'Absent',  icon: '🔴' },
            { num: woCount,      label: 'Week Off', icon: '🟡' },
            { num: formatDate(nowIndia()), label: 'Today', icon: '📅' },
          ].map(({ num, label, icon }) => (
            <div key={label} className="hero-stat">
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,.5)', marginBottom: 2 }}>{icon}</div>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: typeof num === 'string' ? 13 : 20, color: 'var(--leaf-light)', lineHeight: 1 }}>{num}</div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,.5)', marginTop: 3, fontWeight: 500 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Mark form */}
      <div className="card">
        <div className="card-title">
          <span style={{ width: 8, height: 8, background: 'var(--leaf)', borderRadius: '50%', display: 'inline-block', animation: 'pulse-glow 2s ease-in-out infinite' }} />
          Mark Attendance
        </div>
        <div className="field">
          <label>Employee</label>
          <EmployeeSelect value={employee} onChange={setEmployee} />
        </div>
        <div className="field">
          <label>Status</label>
          <StatusGrid selected={status} onChange={setStatus} />
        </div>
        {(status === 'P' || status === 'WOP') && (
          <div style={{
            background: '#f0fdf4', border: '1px solid rgba(34,197,94,.2)',
            borderRadius: 12, padding: '10px 14px', marginBottom: 14,
            display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 13, color: 'var(--text-mid)', fontWeight: 500,
            animation: 'scaleIn .25s cubic-bezier(.34,1.56,.64,1)'
          }}>
            <MapPin size={14} />
            {location
              ? `📍 Location ready (${location.lat.toFixed(4)}, ${location.lng.toFixed(4)})`
              : locLoading ? 'Getting location…' : 'Location will be captured on submit'}
          </div>
        )}
        <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
          {submitting ? <div className="spinner" /> : '✓ Mark Attendance'}
        </button>
      </div>

      {/* Today's status */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div className="card-title" style={{ marginBottom: 0 }}>
            <TrendingUp size={16} style={{ color: 'var(--leaf)' }} />
            Today's Status
          </div>
          <button onClick={handleRefresh} disabled={refreshing} style={{
            background: refreshing ? 'rgba(34,197,94,.1)' : 'transparent',
            border: '1px solid rgba(34,197,94,.22)', borderRadius: 100, padding: '6px 12px',
            cursor: 'pointer', color: 'var(--text-mid)', fontSize: 12,
            fontFamily: "'DM Sans', sans-serif", fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 5, transition: 'all .2s'
          }}>
            <RefreshCw size={12} style={{ animation: refreshing ? 'spin .6s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>

        {/* Progress bar */}
        {!loadingToday && todayData.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600 }}>
              <span>Attendance Rate</span>
              <span>{Math.round((presentCount / todayData.length) * 100)}%</span>
            </div>
            <div style={{ height: 6, background: '#f0f0f0', borderRadius: 100, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 100,
                background: 'linear-gradient(90deg, var(--leaf), var(--forest-mid))',
                width: `${(presentCount / todayData.length) * 100}%`,
                transition: 'width 1s ease',
                animation: 'progressFill .8s ease'
              }} />
            </div>
          </div>
        )}

        {loadingToday ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ height: 58, borderRadius: 14 }} className="loading-shimmer" />
            ))}
          </div>
        ) : todayData.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <p>No records yet today</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {todayData.map((emp, i) => (
              <div key={i} className="emp-row"
                style={{
                  animationDelay: `${i * .04}s`,
                  background: justMarked === emp.name ? 'linear-gradient(135deg,#dcfce7,#f0fdf4)' : undefined,
                  borderColor: justMarked === emp.name ? 'rgba(34,197,94,.3)' : undefined
                }}>
                <EmployeeAvatar name={emp.name} size={36} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {emp.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{emp.time || ''}</div>
                </div>
                <span className={`badge badge-${emp.status || 'NA'}`}>{emp.status || 'NA'}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
