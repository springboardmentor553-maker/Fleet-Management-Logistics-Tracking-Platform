export default function Card({ title, children, action }) {
  return (
    <section style={styles.card}>
      {(title || action) && (
        <header style={styles.header}>
          <h3 style={styles.title}>{title}</h3>
          {action}
        </header>
      )}
      {children}
    </section>
  )
}

const styles = {
  card: {
    background: 'rgba(255, 255, 255, 0.88)',
    border: '1px solid rgba(16, 32, 48, 0.08)',
    borderRadius: '18px',
    boxShadow: '0 16px 40px rgba(16, 32, 48, 0.08)',
    padding: '20px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
  },
  title: {
    margin: 0,
    fontSize: '1rem',
    fontWeight: 700,
  },
}