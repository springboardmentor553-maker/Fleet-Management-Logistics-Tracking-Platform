export default function StatCard({ label, value, icon, color }) {
  return (
    <div className="stat-card" style={{ '--card-color': color }}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-info">
        <span className="stat-value">{value ?? '—'}</span>
        <span className="stat-label">{label}</span>
      </div>
    </div>
  )
}
