import { useEffect, useState } from "react";
import { AppShell } from "../../layout/AppShell.jsx";
import { Card } from "../../components/Card.jsx";
import { Button } from "../../components/Button.jsx";
import { DataTable } from "../../components/DataTable.jsx";
import { StatusBadge } from "../../components/StatusBadge.jsx";
import { ErrorBanner } from "../../components/ErrorBanner.jsx";
import { FormField, inputClasses } from "../../components/FormField.jsx";
import { driversApi } from "../../api/drivers";
import { extractErrorMessage } from "../../api/client";

const EMPTY_FORM = { account_id: "", license_number: "", license_expiry: "" };

export default function DriversPage() {
  const [drivers, setDrivers] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function loadDrivers() {
    driversApi
      .list({ page: 1, page_size: 50 })
      .then((res) => setDrivers(res.data.items))
      .catch((err) => setError(extractErrorMessage(err)));
  }

  useEffect(loadDrivers, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await driversApi.create({ ...form, account_id: Number(form.account_id) });
      setForm(EMPTY_FORM);
      setIsFormOpen(false);
      loadDrivers();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  const columns = [
    { key: "id", header: "Driver ID", render: (d) => <span className="font-data">#{d.id}</span> },
    { key: "license_number", header: "License", render: (d) => <span className="font-data">{d.license_number}</span> },
    { key: "license_expiry", header: "Expires" },
    { key: "status", header: "Status", render: (d) => <StatusBadge status={d.status} /> },
  ];

  return (
    <AppShell title="Drivers">
      <div className="space-y-6">
        <ErrorBanner message={error} />
        <Card
          title={`Drivers (${drivers.length})`}
          action={
            <Button variant="secondary" onClick={() => setIsFormOpen((v) => !v)}>
              {isFormOpen ? "Close" : "Add driver profile"}
            </Button>
          }
        >
          {isFormOpen && (
            <form onSubmit={handleCreate} className="mb-6 grid grid-cols-1 gap-4 rounded-md border border-border p-4 sm:grid-cols-3">
              <FormField label="Linked account ID" hint="Must already exist with the driver role">
                <input
                  required
                  type="number"
                  value={form.account_id}
                  onChange={(e) => setForm({ ...form, account_id: e.target.value })}
                  className={inputClasses}
                  placeholder="e.g. 4"
                />
              </FormField>
              <FormField label="License number">
                <input
                  required
                  value={form.license_number}
                  onChange={(e) => setForm({ ...form, license_number: e.target.value })}
                  className={inputClasses}
                  placeholder="DL-2024-00019"
                />
              </FormField>
              <FormField label="License expiry">
                <input
                  required
                  type="date"
                  value={form.license_expiry}
                  onChange={(e) => setForm({ ...form, license_expiry: e.target.value })}
                  className={inputClasses}
                />
              </FormField>
              <div className="sm:col-span-3">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving…" : "Save driver"}
                </Button>
              </div>
            </form>
          )}

          <DataTable columns={columns} rows={drivers} emptyLabel="No driver profiles yet" />
        </Card>
      </div>
    </AppShell>
  );
}
