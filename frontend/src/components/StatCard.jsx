export default function StatCard({ label, value, icon, variant, desc }) {
  return (
    <div className={`stat-card ${variant}`}>
      <div className="stat-card-header">
        <span className="stat-card-label">{label}</span>
        <div className="stat-card-icon">{icon}</div>
      </div>
      <div className="stat-card-value">{value ?? '—'}</div>
      {desc && <div className="stat-card-desc">{desc}</div>}
    </div>
  )
}
