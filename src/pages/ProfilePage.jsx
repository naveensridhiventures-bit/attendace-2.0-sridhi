import { useState } from 'react'
import TopBar from '../components/TopBar'
import EmployeeAvatar from '../components/EmployeeAvatar'
import EmployeeSelect from '../components/EmployeeSelect'
import { Bell, MapPin, Moon, Clock, Calendar, FileText, DollarSign, Zap, Shield } from 'lucide-react'

const UPCOMING = [
  { icon: <DollarSign size={16} />, title: 'Salary Slips', desc: 'Download monthly pay slips as PDF', tag: 'Coming Soon', color: '#f59e0b' },
  { icon: <Calendar size={16} />, title: 'Holiday Calendar', desc: 'View company holidays for the year', tag: 'Coming Soon', color: '#8b5cf6' },
  { icon: <Clock size={16} />, title: 'Shift Tracker', desc: 'Track shift timings and overtime', tag: 'Coming Soon', color: '#06b6d4' },
  { icon: <FileText size={16} />, title: 'Policy Docs', desc: 'Read HR policies and guidelines', tag: 'Coming Soon', color: '#ec4899' },
  { icon: <Zap size={16} />, title: 'Quick Check-In', desc: 'One-tap check-in with auto-location', tag: 'Planned', color: '#22c55e' },
]

export default function ProfilePage() {
  const [name, setName] = useState(() => localStorage.getItem('emp_name') || '')
  const [saved, setSaved] = useState(false)

  function saveName() {
    localStorage.setItem('emp_name', name)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  return (
    <div className="page">
      <TopBar title="Profile" />

      {/* Profile hero */}
      <div className="hero-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative', zIndex: 1 }}>
          <div style={{
            borderRadius: 20, overflow: 'hidden',
            boxShadow: '0 8px 24px rgba(0,0,0,.2)',
            border: '2px solid rgba(34,197,94,.3)',
            flexShrink: 0
          }}>
            <EmployeeAvatar name={name || 'You'} size={68} />
          </div>
          <div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: 'white', lineHeight: 1.1 }}>
              {name || 'Set your name'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--leaf-light)', marginTop: 4, fontWeight: 600 }}>
              Sridhi Ventures Employee
            </div>
            <div style={{
              marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 4,
              background: 'rgba(34,197,94,.15)', borderRadius: 100, padding: '3px 10px'
            }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--leaf)', animation: 'dotBlink 2s ease-in-out infinite' }} />
              <span style={{ fontSize: 10, color: 'var(--leaf-light)', fontWeight: 700 }}>ACTIVE</span>
            </div>
          </div>
        </div>
      </div>

      {/* Name picker */}
      <div className="card">
        <div className="card-title">👤 Your Identity</div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14, lineHeight: 1.5 }}>
          Choose your name to auto-fill forms throughout the app
        </p>
        <div style={{ marginBottom: 10 }}>
          <EmployeeSelect value={name} onChange={setName} placeholder="Select your name…" />
        </div>
        <button className="btn btn-primary" onClick={saveName} style={{ marginTop: 4 }}>
          {saved ? '✓ Saved!' : '💾 Save Name'}
        </button>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, textAlign: 'center' }}>
          Saved locally on this device. Used to auto-fill attendance forms.
        </p>
      </div>

      {/* App settings */}
      <div className="card">
        <div className="card-title">⚙️ App Settings</div>
        {[
          { icon: <Bell size={16} />, label: 'Notifications', value: 'Enabled', color: '#22c55e' },
          { icon: <MapPin size={16} />, label: 'Location Access', value: 'For check-in', color: '#8b5cf6' },
          { icon: <Shield size={16} />, label: 'HR PIN', value: 'Protected', color: '#f59e0b' },
          { icon: <Moon size={16} />, label: 'App Version', value: '2.1.0 React', color: '#06b6d4' },
        ].map(({ icon, label, value, color }, i) => (
          <div key={label} style={{
            display: 'flex', alignItems: 'center', padding: '12px 0',
            borderBottom: '1px solid #f3f4f6',
            animation: 'slideRight .3s ease both',
            animationDelay: `${i * .07}s`
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: `${color}15`, color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginRight: 12, flexShrink: 0
            }}>{icon}</div>
            <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{label}</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{value}</span>
          </div>
        ))}
      </div>

      {/* Upcoming features */}
      <div className="card">
        <div className="card-title">🚀 Coming Features</div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
          Features being built for the next update
        </p>
        {UPCOMING.map(({ icon, title, desc, tag, color }, i) => (
          <div key={title} style={{
            display: 'flex', gap: 12, padding: '12px 0',
            borderBottom: '1px solid #f3f4f6', alignItems: 'flex-start',
            animation: 'slideRight .35s ease both',
            animationDelay: `${i * .07}s`
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: 12,
              background: `${color}15`, color,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              boxShadow: `0 4px 12px ${color}20`
            }}>{icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: 14 }}>{title}</span>
                <span style={{
                  fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 100,
                  background: tag === 'Planned' ? '#fef3c7' : '#f0fdf4',
                  color: tag === 'Planned' ? '#d97706' : '#16a34a'
                }}>{tag}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{desc}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 8, paddingBottom: 8 }}>
        Sridhi Ventures Attendance v2.1 · Built with React + Vite
      </div>
    </div>
  )
}
