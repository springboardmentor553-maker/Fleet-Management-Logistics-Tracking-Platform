import { useEffect, useState } from "react";
import { AppShell } from "../../layout/AppShell.jsx";
import { Card } from "../../components/Card.jsx";
import { Button } from "../../components/Button.jsx";
import { DataTable } from "../../components/DataTable.jsx";
import { ErrorBanner } from "../../components/ErrorBanner.jsx";
import { FormField, inputClasses } from "../../components/FormField.jsx";
import { maintenanceApi } from "../../api/maintenance";
import { extractErrorMessage } from "../../api/client";

const SERVICE_TYPES = ["routine_service", "repair", "inspection", "tire_change", "other"];

const EMPTY_FORM = {
  vehicle_id: "",
  service_type: SERVICE_TYPES[0],
  description: "",
  cost: "",
  performed_by: "",
  performed_at: "",
  next_due_at: "",
};

export default function MaintenancePage() {
  const [logs, setLogs] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function loadLogs() {
    maintenanceApi
      .list({ page: 1, page_size: 50 })
      .then((res) => setLogs(res.data.items))
      .catch((err) => setError(extractErrorMessage(err)));
  }

  useEffect(loadLogs, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await maintenanceApi.create({
        ...form,
        vehicle_id: Number(form.vehicle_id),
        cost: Number(form.cost),
        next_due_at: form.next_due_at || null,
      });
      setForm(EMPTY_FORM);
      setIsFormOpen(false);
      loadLogs();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleClose(id) {
    setError("");
    try {
      await maintenanceApi.close(id);
      loadLogs();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  const columns = [
    { key: "vehicle_id", header: "Vehicle", render: (l) => <span className="font-data">#{l.vehicle_id}</span> },
    { key: "service_type", header: "Service", render: (l) => l.service_type.replaceAll("_", " ") },
    { key: "description", header: "Description" },
    { key: "cost", header: "Cost", render: (l) => <span className="font-data">₹{l.cost}</span> },
    { key: "performed_at", header: "Performed" },
    { key: "next_due_at", header: "Next due", render: (l) => l.next_due_at || "—" },
    {
      key: "actions",
      header: "Actions",
      render: (l) => (
        <Button variant="secondary" onClick={() => handleClose(l.id)}>
          Close job (reactivate vehicle)
        </Button>
      ),
    },
  ];

  return (
    <AppShell title="Vehicle Maintenance">
      <div className="space-y-6">
        <ErrorBanner message={error} />
        <Card
          title={`Maintenance logs (${logs.length})`}
          action={
            <Button variant="secondary" onClick={() => setIsFormOpen((v) => !v)}>
              {isFormOpen ? "Close" : "Log service"}
            </Button>
          }
        >
          {isFormOpen && (
            <form onSubmit={handleCreate} className="mb-6 grid grid-cols-1 gap-4 rounded-md border border-border p-4 sm:grid-cols-3">
              <FormField label="Vehicle ID">
                <input required type="number" value={form.vehicle_id} onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })} className={inputClasses} />
              </FormField>
              <FormField label="Service type">
                <select required value={form.service_type} onChange={(e) => setForm({ ...form, service_type: e.target.value })} className={inputClasses}>
                  {SERVICE_TYPES.map((t) => (
                    <option key={t} value={t}>{t.replaceAll("_", " ")}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Cost">
                <input required type="number" min="0" step="0.01" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} className={inputClasses} />
              </FormField>
              <FormField label="Performed by">
                <input required value={form.performed_by} onChange={(e) => setForm({ ...form, performed_by: e.target.value })} className={inputClasses} placeholder="Workshop / technician name" />
              </FormField>
              <FormField label="Performed on">
                <input required type="date" value={form.performed_at} onChange={(e) => setForm({ ...form, performed_at: e.target.value })} className={inputClasses} />
              </FormField>
              <FormField label="Next due (optional)">
                <input type="date" value={form.next_due_at} onChange={(e) => setForm({ ...form, next_due_at: e.target.value })} className={inputClasses} />
              </FormField>
              <div className="sm:col-span-3">
                <FormField label="Description">
                  <textarea required rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputClasses} />
                </FormField>
              </div>
              <div className="sm:col-span-3">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving…" : "Save log"}
                </Button>
              </div>
            </form>
          )}

          <DataTable columns={columns} rows={logs} emptyLabel="No maintenance logs yet" />
        </Card>
      </div>
    </AppShell>
  );
}
