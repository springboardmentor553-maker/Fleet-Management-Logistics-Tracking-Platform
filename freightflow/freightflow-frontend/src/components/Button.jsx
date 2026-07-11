const VARIANTS = {
  primary: "bg-signal text-base hover:bg-signal/90",
  secondary: "bg-surface-raised text-ink border border-border hover:border-signal/60",
  danger: "bg-status-alert/15 text-status-alert border border-status-alert/30 hover:bg-status-alert/25",
  ghost: "text-ink-muted hover:text-ink",
};

export function Button({ variant = "primary", className = "", children, ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
