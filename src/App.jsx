import { useState, useRef } from 'react'
import { ClipboardList, Calendar, Clock, Users, User, BarChart2 } from 'lucide-react'
import AttendancePage from './pages/AttendancePage'
import LeavePage from './pages/LeavePage'
import PermissionPage from './pages/PermissionPage'
import HRPage from './pages/HRPage'
import ProfilePage from './pages/ProfilePage'
import SalaryPage from './pages/SalaryPage'
import { ToastProvider } from './hooks/useToast'

const TABS = [
  { id: 'attendance', label: 'Attendance', Icon: ClipboardList },
  { id: 'leave',      label: 'Leave',      Icon: Calendar },
  { id: 'permission', label: 'Permission', Icon: Clock },
  { id: 'salary',     label: 'Salary',     Icon: BarChart2 },
  { id: 'hr',         label: 'HR',         Icon: Users },
]

export default function App() {
  const [tab, setTab] = useState('attendance')
  const [animDir, setAnimDir] = useState('right')
  const tabOrder = TABS.map(t => t.id)

  function switchTab(id) {
    if (id === tab) return
    const from = tabOrder.indexOf(tab)
    const to = tabOrder.indexOf(id)
    setAnimDir(to > from ? 'left' : 'right')
    setTab(id)
  }

  const pages = {
    attendance: <AttendancePage key="attendance" />,
    leave:      <LeavePage key="leave" />,
    permission: <PermissionPage key="permission" />,
    salary:     <SalaryPage key="salary" />,
    hr:         <HRPage key="hr" />,
  }

  return (
    <ToastProvider>
      <div id="orb2" />
      <div style={{ minHeight: '100vh' }}>
        <div key={tab} style={{ animation: `${animDir === 'left' ? 'slideLeft' : 'slideRight'} .28s ease both` }}>
          {pages[tab]}
        </div>
        <nav className="bottom-nav">
          {TABS.map(({ id, label, Icon }, i) => (
            <button
              key={id}
              className={`nav-item ${tab === id ? 'active' : ''}`}
              onClick={() => switchTab(id)}
              style={{ animationDelay: `${i * .06}s`, animation: 'navItemIn .4s ease both' }}
            >
              <div className="nav-icon-wrap">
                <Icon size={20} strokeWidth={tab === id ? 2.5 : 1.8} />
              </div>
              {label}
            </button>
          ))}
        </nav>
      </div>
    </ToastProvider>
  )
}
