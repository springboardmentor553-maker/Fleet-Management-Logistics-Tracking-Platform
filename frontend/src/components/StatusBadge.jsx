export default function StatusBadge({ status }) {
  const label = status?.replace('_', ' ') || '—'
  const cls = `badge badge-${status?.toLowerCase()}`
  return (
    <span className={cls}>
      <span className="badge-dot" />
      {label}
    </span>
  )
}

export function RoleBadge({ role }) {
  return (
    <span className={`badge badge-${role?.toLowerCase()}`}>
      {role?.replace('_', ' ') || '—'}
    </span>
  )
}
