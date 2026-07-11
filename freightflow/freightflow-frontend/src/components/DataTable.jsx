export function DataTable({ columns, rows, emptyLabel = "No records to display" }) {
  if (!rows || rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border py-12 text-center">
        <p className="text-sm text-ink-muted">{emptyLabel}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto scrollbar-thin">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border text-[11px] uppercase tracking-wide text-ink-muted">
            {columns.map((col) => (
              <th key={col.key} className="whitespace-nowrap px-3 py-2 font-medium">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={row.id ?? idx} className="border-b border-border/60 last:border-0 hover:bg-surface-raised/60">
              {columns.map((col) => (
                <td key={col.key} className="whitespace-nowrap px-3 py-3 text-ink">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
