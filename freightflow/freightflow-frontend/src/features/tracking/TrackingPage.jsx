import { useState } from "react";
import { AppShell } from "../../layout/AppShell.jsx";
import { Card } from "../../components/Card.jsx";
import { Button } from "../../components/Button.jsx";
import { DataTable } from "../../components/DataTable.jsx";
import { ErrorBanner } from "../../components/ErrorBanner.jsx";
import { FormField, inputClasses } from "../../components/FormField.jsx";
import { trackingApi } from "../../api/tracking";
import { extractErrorMessage } from "../../api/client";

export default function TrackingPage() {
  const [shipmentId, setShipmentId] = useState("");
  const [latest, setLatest] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  async function handleLookup(e) {
    e.preventDefault();
    setError("");
    setLatest(null);
    setHistory([]);
    setHasSearched(true);
    try {
      const [latestRes, historyRes] = await Promise.all([
        trackingApi.latest(Number(shipmentId)).catch(() => null),
        trackingApi.history(Number(shipmentId)),
      ]);
      if (latestRes) setLatest(latestRes.data);
      setHistory(historyRes.data);
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  const columns = [
    { key: "recorded_at", header: "Recorded at", render: (p) => <span className="font-data text-xs">{new Date(p.recorded_at).toLocaleString()}</span> },
    { key: "latitude", header: "Latitude", render: (p) => <span className="font-data">{p.latitude}</span> },
    { key: "longitude", header: "Longitude", render: (p) => <span className="font-data">{p.longitude}</span> },
    { key: "speed_kmh", header: "Speed", render: (p) => <span className="font-data">{p.speed_kmh} km/h</span> },
  ];

  return (
    <AppShell title="Live Tracking">
      <div className="space-y-6">
        <ErrorBanner message={error} />

        <Card title="Track a shipment">
          <form onSubmit={handleLookup} className="flex items-end gap-3">
            <FormField label="Shipment ID">
              <input required type="number" value={shipmentId} onChange={(e) => setShipmentId(e.target.value)} className={inputClasses} placeholder="e.g. 12" />
            </FormField>
            <Button type="submit">Track</Button>
          </form>

          {latest && (
            <div className="mt-5 rounded-md border border-status-transit/30 bg-status-transit/10 p-4">
              <p className="text-[11px] uppercase tracking-board text-ink-muted">Current position</p>
              <p className="mt-1 font-data text-lg text-ink">
                {latest.latitude}, {latest.longitude}
                <span className="ml-3 text-sm text-status-transit">{latest.speed_kmh} km/h</span>
              </p>
              <p className="mt-1 text-xs text-ink-muted">as of {new Date(latest.recorded_at).toLocaleString()}</p>
            </div>
          )}
          {hasSearched && !latest && !error && (
            <p className="mt-4 text-sm text-ink-muted">No position data recorded for this shipment yet.</p>
          )}
        </Card>

        {history.length > 0 && (
          <Card title="Position history">
            <DataTable columns={columns} rows={history} />
          </Card>
        )}
      </div>
    </AppShell>
  );
}
