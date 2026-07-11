import { useState } from "react";
import { AppShell } from "../../layout/AppShell.jsx";
import { Card } from "../../components/Card.jsx";
import { Button } from "../../components/Button.jsx";
import { DataTable } from "../../components/DataTable.jsx";
import { StatusBadge } from "../../components/StatusBadge.jsx";
import { ErrorBanner } from "../../components/ErrorBanner.jsx";
import { reportsApi } from "../../api/reports";
import { extractErrorMessage } from "../../api/client";

export default function ReportsPage() {
  const [utilization, setUtilization] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function runReports() {
    setError("");
    setIsLoading(true);
    try {
      const [utilRes, perfRes] = await Promise.all([
        reportsApi.fleetUtilization({}),
        reportsApi.deliveryPerformance({}),
      ]);
      setUtilization(utilRes.data);
      setPerformance(perfRes.data);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }

  const utilizationColumns = [
    { key: "plate_number", header: "Vehicle", render: (r) => <span className="font-data">{r.plate_number}</span> },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    { key: "completed_shipments", header: "Completed shipments", render: (r) => <span className="font-data">{r.completed_shipments}</span> },
    { key: "total_distance_related_cost", header: "Maintenance spend", render: (r) => <span className="font-data">₹{r.total_distance_related_cost}</span> },
  ];

  return (
    <AppShell title="Reports">
      <div className="space-y-6">
        <ErrorBanner message={error} />

        <Card
          title="Analytics"
          action={
            <Button onClick={runReports} disabled={isLoading}>
              {isLoading ? "Generating…" : "Generate reports"}
            </Button>
          }
        >
          <p className="text-sm text-ink-muted">
            Runs fleet utilization and delivery performance across all recorded data.
          </p>
        </Card>

        {performance && (
          <Card title={`Delivery performance — ${performance.generated_for_range}`}>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Stat label="Total shipments" value={performance.total_shipments} />
              <Stat label="On-time delivery" value={`${Math.round(performance.delivered_on_time_ratio * 100)}%`} tone="text-status-available" />
              <Stat label="Avg transit hours" value={performance.average_transit_hours ?? "—"} />
              <Stat label="Cancelled" value={performance.cancelled_count} tone="text-status-alert" />
            </div>
          </Card>
        )}

        {utilization && (
          <Card title={`Fleet utilization — ${utilization.generated_for_range}`}>
            <DataTable columns={utilizationColumns} rows={utilization.rows} emptyLabel="No vehicles to report on" />
          </Card>
        )}
      </div>
    </AppShell>
  );
}

function Stat({ label, value, tone = "text-ink" }) {
  return (
    <div className="rounded-md border border-border p-4">
      <p className="text-[11px] uppercase tracking-wide text-ink-muted">{label}</p>
      <p className={`mt-1 font-data text-2xl font-semibold tabular ${tone}`}>{value}</p>
    </div>
  );
}
