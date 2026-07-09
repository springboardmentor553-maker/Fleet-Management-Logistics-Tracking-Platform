export default function Table({ columns = [], rows = [] }) {
  return (
    <div style={styles.wrapper}>
      <table style={styles.table}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column} style={styles.th}>
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td style={styles.emptyCell} colSpan={Math.max(columns.length, 1)}>
                No records yet.
              </td>
            </tr>
          ) : (
            rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} style={styles.td}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

const styles = {
  wrapper: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left',
    padding: '14px 12px',
    fontSize: '0.8rem',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#536273',
    borderBottom: '1px solid rgba(16, 32, 48, 0.1)',
  },
  td: {
    padding: '14px 12px',
    borderBottom: '1px solid rgba(16, 32, 48, 0.06)',
    verticalAlign: 'top',
  },
  emptyCell: {
    padding: '20px 12px',
    textAlign: 'center',
    color: '#5b6a79',
  },
}