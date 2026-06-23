import { gradient, getInitials } from '../utils/helpers'

export default function EmployeeAvatar({ name, size = 40, style = {} }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.35,
      background: gradient(name),
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'white', fontWeight: 800, fontSize: size * 0.35,
      fontFamily: "'DM Sans', sans-serif",
      flexShrink: 0,
      ...style
    }}>
      {getInitials(name)}
    </div>
  )
}
