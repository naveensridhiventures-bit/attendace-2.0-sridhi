const BASE = import.meta.env.VITE_API_URL || '/api'

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
  return data
}

export const api = {
  // Employees (live from the sheet)
  employees: () => request('/employees'),

  // Attendance
  markAttendance: (body) =>
    request('/mark_attendance', { method: 'POST', body: JSON.stringify(body) }),
  markBulk: (body) =>
    request('/mark_attendance_bulk', { method: 'POST', body: JSON.stringify(body) }),
  todayStatus: () => request('/today_status'),

  // Leave
  submitLeave: (body) =>
    request('/submit_leave', { method: 'POST', body: JSON.stringify(body) }),
  myRequests: (body) =>
    request('/my_requests', { method: 'POST', body: JSON.stringify(body) }),

  // Permission
  submitPermission: (body) =>
    request('/submit_permission', { method: 'POST', body: JSON.stringify(body) }),

  // Salary (fetches from monthly sheet tab)
  salaryData: (body) =>
    request('/salary_data', { method: 'POST', body: JSON.stringify(body) }),

  // Dashboard unlock (shared by Salary + HR)
  unlock: (body) =>
    request('/dashboard/unlock', { method: 'POST', body: JSON.stringify(body) }),

  // HR
  hrPendingRequests: (body) =>
    request('/hr/pending_requests', { method: 'POST', body: JSON.stringify(body) }),
  hrDecide: (body) =>
    request('/hr/decide', { method: 'POST', body: JSON.stringify(body) }),

  // Push notifications
  vapidKey: () => request('/vapid-public-key'),
  pushSubscribe: (body) =>
    request('/push/subscribe', { method: 'POST', body: JSON.stringify(body) }),
  checkNotifications: (body) =>
    request('/notifications/check', { method: 'POST', body: JSON.stringify(body) }),
}
