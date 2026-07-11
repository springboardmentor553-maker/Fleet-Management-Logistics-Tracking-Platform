import { useAuth } from "../auth/AuthContext.jsx";
import { Button } from "../components/Button.jsx";

export function Topbar({ title }) {
  const { account, logout } = useAuth();

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-surface px-6">
      <h1 className="font-display text-lg font-semibold text-ink">{title}</h1>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-ink">{account?.full_name}</p>
          <p className="text-[11px] uppercase tracking-wide text-ink-muted">{account?.role}</p>
        </div>
        <Button variant="secondary" onClick={logout}>
          Sign out
        </Button>
      </div>
    </header>
  );
}
