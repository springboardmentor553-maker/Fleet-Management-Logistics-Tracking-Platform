import { useEffect, useState } from "react";
import { AppShell } from "../../layout/AppShell.jsx";
import { Card } from "../../components/Card.jsx";
import { Button } from "../../components/Button.jsx";
import { DataTable } from "../../components/DataTable.jsx";
import { StatusBadge } from "../../components/StatusBadge.jsx";
import { ErrorBanner } from "../../components/ErrorBanner.jsx";
import { FormField, inputClasses } from "../../components/FormField.jsx";
import { shipmentsApi } from "../../api/shipments";
import { extractErrorMessage } from "../../api/client";

const EMPTY_FORM = { reference_code: "", origin: "", destination: "", weight_kg: "", scheduled_at: "" };
const EMPTY_ASSIGN = { vehicle_id: "", driver_id: "" };

export default function ShipmentsPage() {
  const [shipments, setShipments] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [assignTarget, setAssignTarget] = useState(null);
  const [assignForm, setAssignForm] = useState(EMPTY_ASSIGN);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function loadShipments() {
    shipmentsApi
      .list({ page: 1, page_size: 50 })
      .then((res) => setShipments(res.data.items))
      .catch((err) => setError(extractErrorMessage(err)));
  }

  useEffect(loadShipments, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await shipmentsApi.create({
        ...form,
        weight_kg: Number(form.weight_kg),
        scheduled_at: new Date(form.scheduled_at).toISOString(),
      });
      setForm(EMPTY_FORM);
      setIsFormOpen(false);
      loadShipments();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAssign(e) {
    e.preventDefault();
    setError("");
    try {
      await shipmentsApi.assign(assignTarget.id, {
        vehicle_id: Number(assignForm.vehicle_id),
        driver_id: Number(assignForm.driver_id),
      });
      setAssignTarget(null);
      setAssignForm(EMPTY_ASSIGN);
      loadShipments();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  async function runAction(actionFn, id) {
    setError("");
    try {
      await actionFn(id);
      loadShipments();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  const columns = [
    { key: "reference_code", header: "Reference", render: (s) => <span className="font-data">{s.reference_code}</span> },
    { key: "origin", header: "Origin" },
    { key: "destination", header: "Destination" },
    { key: "weight_kg", header: "Weight", render: (s) => <span className="font-data">{s.weight_kg} kg</span> },
    { key: "status", header: "Status", render: (s) => <StatusBadge status={s.status} /> },
    {
      key: "actions",
      header: "Actions",
      render: (s) => (
        <div className="flex flex-wrap gap-2">
          {s.status === "pending" && (
            <Button variant="secondary" onClick={() => { setAssignTarget(s); setAssignForm(EMPTY_ASSIGN); }}>
              Assign
            </Button>
          )}
          {s.status === "assigned" && (
            <Button variant="secondary" onClick={() => runAction(shipmentsApi.startTransit, s.id)}>
              Start transit
            </Button>
          )}
          {s.status === "in_transit" && (
            <Button variant="secondary" onClick={() => runAction(shipmentsApi.deliver, s.id)}>
              Mark delivered
            </Button>
          )}
          {["pending", "assigned"].includes(s.status) && (
            <Button variant="danger" onClick={() => runAction(shipmentsApi.cancel, s.id)}>
              Cancel
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <AppShell title="Shipments">
      <div className="space-y-6">
        <ErrorBanner message={error} />
        <Card
          title={`Shipments (${shipments.length})`}
          action={
            <Button variant="secondary" onClick={() => setIsFormOpen((v) => !v)}>
              {isFormOpen ? "Close" : "Create shipment"}
            </Button>
          }
        >
          {isFormOpen && (
            <form onSubmit={handleCreate} className="mb-6 grid grid-cols-1 gap-4 rounded-md border border-border p-4 sm:grid-cols-3">
              <FormField label="Reference code">
                <input required value={form.reference_code} onChange={(e) => setForm({ ...form, reference_code: e.target.value })} className={inputClasses} placeholder="SHP-2026-0142" />
              </FormField>
              <FormField label="Origin">
                <input required value={form.origin} onChange={(e) => setForm({ ...form, origin: e.target.value })} className={inputClasses} placeholder="Mumbai DC" />
              </FormField>
              <FormField label="Destination">
                <input required value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} className={inputClasses} placeholder="Pune Hub" />
              </FormField>
              <FormField label="Weight (kg)">
                <input required type="number" min="1" value={form.weight_kg} onChange={(e) => setForm({ ...form, weight_kg: e.target.value })} className={inputClasses} placeholder="850" />
              </FormField>
              <FormField label="Scheduled at">
                <input required type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} className={inputClasses} />
              </FormField>
              <div className="flex items-end sm:col-span-1">
                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? "Saving…" : "Save shipment"}
                </Button>
              </div>
            </form>
          )}

          {assignTarget && (
            <form onSubmit={handleAssign} className="mb-6 grid grid-cols-1 gap-4 rounded-md border border-signal/40 bg-signal/5 p-4 sm:grid-cols-3">
              <p className="text-sm text-ink sm:col-span-3">
                Assigning vehicle &amp; driver to <span className="font-data text-signal">{assignTarget.reference_code}</span>
              </p>
              <FormField label="Vehicle ID">
                <input required type="number" value={assignForm.vehicle_id} onChange={(e) => setAssignForm({ ...assignForm, vehicle_id: e.target.value })} className={inputClasses} />
              </FormField>
              <FormField label="Driver ID">
                <input required type="number" value={assignForm.driver_id} onChange={(e) => setAssignForm({ ...assignForm, driver_id: e.target.value })} className={inputClasses} />
              </FormField>
              <div className="flex items-end gap-2">
                <Button type="submit">Confirm assignment</Button>
                <Button type="button" variant="ghost" onClick={() => setAssignTarget(null)}>Cancel</Button>
              </div>
            </form>
          )}

          <DataTable columns={columns} rows={shipments} emptyLabel="No shipments created yet" />
        </Card>
      </div>
    </AppShell>
  );
}
