import { useState } from "react";
import { AppShell } from "../../layout/AppShell.jsx";
import { Card } from "../../components/Card.jsx";
import { Button } from "../../components/Button.jsx";
import { ErrorBanner } from "../../components/ErrorBanner.jsx";
import { FormField, inputClasses } from "../../components/FormField.jsx";
import { routesApi } from "../../api/routes";
import { extractErrorMessage } from "../../api/client";

const EMPTY_WAYPOINT = { label: "", latitude: "", longitude: "" };
const EMPTY_FORM = { shipment_id: "", distance_km: "", estimated_duration_min: "" };

export default function RoutesPage() {
  const [lookupId, setLookupId] = useState("");
  const [route, setRoute] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState(EMPTY_FORM);
  const [waypoints, setWaypoints] = useState([{ ...EMPTY_WAYPOINT }, { ...EMPTY_WAYPOINT }]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLookup(e) {
    e.preventDefault();
    setError("");
    setNotFound(false);
    setRoute(null);
    try {
      const res = await routesApi.getForShipment(Number(lookupId));
      setRoute(res.data);
    } catch (err) {
      if (err.response?.status === 404) {
        setNotFound(true);
      } else {
        setError(extractErrorMessage(err));
      }
    }
  }

  function updateWaypoint(idx, field, value) {
    setWaypoints((prev) => prev.map((wp, i) => (i === idx ? { ...wp, [field]: value } : wp)));
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const res = await routesApi.create({
        shipment_id: Number(form.shipment_id),
        distance_km: Number(form.distance_km),
        estimated_duration_min: Number(form.estimated_duration_min),
        waypoints: waypoints.map((wp) => ({
          label: wp.label,
          latitude: Number(wp.latitude),
          longitude: Number(wp.longitude),
        })),
      });
      setRoute(res.data);
      setNotFound(false);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AppShell title="Route Planner">
      <div className="space-y-6">
        <ErrorBanner message={error} />

        <Card title="Look up a shipment's route">
          <form onSubmit={handleLookup} className="flex items-end gap-3">
            <FormField label="Shipment ID">
              <input required type="number" value={lookupId} onChange={(e) => setLookupId(e.target.value)} className={inputClasses} placeholder="e.g. 12" />
            </FormField>
            <Button type="submit">Look up route</Button>
          </form>

          {route && (
            <div className="mt-5 space-y-3 rounded-md border border-border p-4">
              <div className="flex gap-8 text-sm">
                <span className="text-ink-muted">Distance: <span className="font-data text-ink">{route.distance_km} km</span></span>
                <span className="text-ink-muted">ETA: <span className="font-data text-ink">{route.estimated_duration_min} min</span></span>
              </div>
              <ol className="space-y-2">
                {route.waypoints.map((wp, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-sm">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-signal/15 font-data text-xs text-signal">{idx + 1}</span>
                    <span className="text-ink">{wp.label}</span>
                    <span className="font-data text-xs text-ink-muted">{wp.latitude}, {wp.longitude}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
          {notFound && <p className="mt-4 text-sm text-ink-muted">No route has been planned for that shipment yet — plan one below.</p>}
        </Card>

        <Card title="Plan a new route">
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <FormField label="Shipment ID">
                <input required type="number" value={form.shipment_id} onChange={(e) => setForm({ ...form, shipment_id: e.target.value })} className={inputClasses} />
              </FormField>
              <FormField label="Distance (km)">
                <input required type="number" step="0.1" value={form.distance_km} onChange={(e) => setForm({ ...form, distance_km: e.target.value })} className={inputClasses} />
              </FormField>
              <FormField label="Estimated duration (min)">
                <input required type="number" value={form.estimated_duration_min} onChange={(e) => setForm({ ...form, estimated_duration_min: e.target.value })} className={inputClasses} />
              </FormField>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wide text-ink-muted">Waypoints</span>
                <Button type="button" variant="ghost" onClick={() => setWaypoints((prev) => [...prev, { ...EMPTY_WAYPOINT }])}>
                  + Add waypoint
                </Button>
              </div>
              {waypoints.map((wp, idx) => (
                <div key={idx} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <input required placeholder="Label" value={wp.label} onChange={(e) => updateWaypoint(idx, "label", e.target.value)} className={inputClasses} />
                  <input required placeholder="Latitude" type="number" step="0.000001" value={wp.latitude} onChange={(e) => updateWaypoint(idx, "latitude", e.target.value)} className={inputClasses} />
                  <input required placeholder="Longitude" type="number" step="0.000001" value={wp.longitude} onChange={(e) => updateWaypoint(idx, "longitude", e.target.value)} className={inputClasses} />
                </div>
              ))}
            </div>

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : "Save route"}
            </Button>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}
