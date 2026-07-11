import { useEffect, useState } from "react";
import { AppShell } from "../../layout/AppShell.jsx";
import { Card } from "../../components/Card.jsx";
import { Button } from "../../components/Button.jsx";
import { DataTable } from "../../components/DataTable.jsx";
import { StatusBadge } from "../../components/StatusBadge.jsx";
import { ErrorBanner } from "../../components/ErrorBanner.jsx";
import { FormField, inputClasses } from "../../components/FormField.jsx";
import { vehiclesApi } from "../../api/vehicles";
import { extractErrorMessage } from "../../api/client";

const EMPTY_FORM = { plate_number: "", vehicle_type: "", capacity_kg: "" };

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function loadVehicles() {
    vehiclesApi
      .list({ page: 1, page_size: 50 })
      .then((res) => setVehicles(res.data.items))
      .catch((err) => setError(extractErrorMessage(err)));
  }

  useEffect(loadVehicles, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await vehiclesApi.create({ ...form, capacity_kg: Number(form.capacity_kg) });
      setForm(EMPTY_FORM);
      setIsFormOpen(false);
      loadVehicles();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  const columns = [
    { key: "plate_number", header: "Plate", render: (v) => <span className="font-data">{v.plate_number}</span> },
    { key: "vehicle_type", header: "Type" },
    { key: "capacity_kg", header: "Capacity", render: (v) => <span className="font-data">{v.capacity_kg} kg</span> },
    { key: "odometer_km", header: "Odometer", render: (v) => <span className="font-data">{v.odometer_km} km</span> },
    { key: "status", header: "Status", render: (v) => <StatusBadge status={v.status} /> },
  ];

  return (
    <AppShell title="Fleet">
      <div className="space-y-6">
        <ErrorBanner message={error} />
        <Card
          title={`Vehicles (${vehicles.length})`}
          action={
            <Button variant="secondary" onClick={() => setIsFormOpen((v) => !v)}>
              {isFormOpen ? "Close" : "Register vehicle"}
            </Button>
          }
        >
          {isFormOpen && (
            <form onSubmit={handleCreate} className="mb-6 grid grid-cols-1 gap-4 rounded-md border border-border p-4 sm:grid-cols-3">
              <FormField label="Plate number">
                <input
                  required
                  value={form.plate_number}
                  onChange={(e) => setForm({ ...form, plate_number: e.target.value })}
                  className={inputClasses}
                  placeholder="KA-01-AB-1234"
                />
              </FormField>
              <FormField label="Vehicle type">
                <input
                  required
                  value={form.vehicle_type}
                  onChange={(e) => setForm({ ...form, vehicle_type: e.target.value })}
                  className={inputClasses}
                  placeholder="Box truck"
                />
              </FormField>
              <FormField label="Capacity (kg)">
                <input
                  required
                  type="number"
                  min="1"
                  value={form.capacity_kg}
                  onChange={(e) => setForm({ ...form, capacity_kg: e.target.value })}
                  className={inputClasses}
                  placeholder="2000"
                />
              </FormField>
              <div className="sm:col-span-3">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving…" : "Save vehicle"}
                </Button>
              </div>
            </form>
          )}

          <DataTable columns={columns} rows={vehicles} emptyLabel="No vehicles registered yet" />
        </Card>
      </div>
    </AppShell>
  );
}
