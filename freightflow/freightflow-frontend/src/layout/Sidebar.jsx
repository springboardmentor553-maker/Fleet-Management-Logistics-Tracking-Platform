import { NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";

const NAV_ITEMS = [
  { to: "/", label: "Control Tower", end: true },
  { to: "/vehicles", label: "Fleet" },
  { to: "/drivers", label: "Drivers" },
  { to: "/shipments", label: "Shipments" },
  { to: "/routes", label: "Route Planner" },
  { to: "/maintenance", label: "Maintenance" },
  { to: "/tracking", label: "Live Tracking" },
  { to: "/reports", label: "Reports" },
];

export function Sidebar() {
  const { account } = useAuth();

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-border bg-surface">
      <div className="flex items-center gap-2 border-b border-border px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-signal text-base font-display font-bold">
          C
        </div>
        <div>
          <p className="font-display text-sm font-semibold leading-none text-ink">FreightFlow</p>
          <p className="text-[11px] uppercase tracking-board text-ink-muted">Ops Console</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4 scrollbar-thin">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive ? "bg-signal/15 text-signal" : "text-ink-muted hover:bg-surface-raised hover:text-ink"
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
        {account?.role === "admin" && (
          <NavLink
            to="/users"
            className={({ isActive }) =>
              `block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive ? "bg-signal/15 text-signal" : "text-ink-muted hover:bg-surface-raised hover:text-ink"
              }`
            }
          >
            User Management
          </NavLink>
        )}
      </nav>
    </aside>
  );
}
