import { useEffect, useState } from "react";
import { AppShell } from "../../layout/AppShell.jsx";
import { Card } from "../../components/Card.jsx";
import { ErrorBanner } from "../../components/ErrorBanner.jsx";
import { dashboardApi } from "../../api/dashboard";
import { extractErrorMessage } from "../../api/client";

function BoardStat({ label, value }) {
  return (
    <div className="flex flex-col items-center gap-1 px-6 py-4">
      <span className="font-data text-3xl font-semibold tabular text-signal">
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-[11px] uppercase tracking-board text-ink-muted">{label}</span>
    </div>
  );
}

function MiniStat({ label, value, tone = "text-ink" }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 py-2.5 last:border-0">
      <span className="text-sm text-ink-muted">{label}</span>
      <span className={`font-data text-sm font-semibold tabular ${tone}`}>{value}</span>
    </div>
  );
}

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    dashboardApi
      .summary()
      .then((res) => setSummary(res.data))
      .catch((err) => setError(extractErrorMessage(err)));
  }, []);

  return (
    <AppShell title="Control Tower">
      <div className="space-y-6">
        <ErrorBanner message={error} />

        {/* Signature: departure-board style live strip */}
        <div className="overflow-hidden rounded-lg border border-border bg-[#0B0F11]">
          <div className="flex items-center justify-between border-b border-border px-5 py-2.5">
            <span className="text-[11px] uppercase tracking-board text-ink-muted">Live Operations Board</span>
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-status-available" />
          </div>
          <div className="flex flex-wrap divide-x divide-border">
            <BoardStat label="Active Vehicles" value={summary?.fleet?.active_vehicles ?? 0} />
            <BoardStat label="Drivers On Trip" value={summary?.drivers?.on_trip_drivers ?? 0} />
            <BoardStat label="In Transit" value={summary?.shipments?.in_transit ?? 0} />
            <BoardStat label="Pending Dispatch" value={summary?.shipments?.pending ?? 0} />
            <BoardStat label="In Shop" value={summary?.open_maintenance_jobs ?? 0} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card title="Fleet">
            <MiniStat label="Total vehicles" value={summary?.fleet?.total_vehicles ?? "—"} />
            <MiniStat label="Active" value={summary?.fleet?.active_vehicles ?? "—"} tone="text-status-available" />
            <MiniStat label="In shop" value={summary?.fleet?.in_shop_vehicles ?? "—"} tone="text-signal" />
          </Card>

          <Card title="Drivers">
            <MiniStat label="Total drivers" value={summary?.drivers?.total_drivers ?? "—"} />
            <MiniStat label="Available" value={summary?.drivers?.available_drivers ?? "—"} tone="text-status-available" />
            <MiniStat label="On trip" value={summary?.drivers?.on_trip_drivers ?? "—"} tone="text-status-transit" />
          </Card>

          <Card title="Shipments">
            <MiniStat label="Total" value={summary?.shipments?.total_shipments ?? "—"} />
            <MiniStat label="Pending" value={summary?.shipments?.pending ?? "—"} tone="text-signal" />
            <MiniStat label="In transit" value={summary?.shipments?.in_transit ?? "—"} tone="text-status-transit" />
            <MiniStat label="Delivered" value={summary?.shipments?.delivered ?? "—"} tone="text-status-available" />
            <MiniStat label="Cancelled" value={summary?.shipments?.cancelled ?? "—"} tone="text-status-alert" />
          </Card>
        </div>
      </div>
    </AppShell>
  );
}