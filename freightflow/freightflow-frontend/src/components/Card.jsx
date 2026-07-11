export function Card({ title, action, children, className = "" }) {
  return (
    <div className={`rounded-lg border border-border bg-surface ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          {title && <h2 className="font-display text-sm font-semibold tracking-wide text-ink">{title}</h2>}
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}
