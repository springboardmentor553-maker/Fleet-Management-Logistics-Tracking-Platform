import { useEffect, useState } from "react";
import { AppShell } from "../../layout/AppShell.jsx";
import { Card } from "../../components/Card.jsx";
import { Button } from "../../components/Button.jsx";
import { DataTable } from "../../components/DataTable.jsx";
import { StatusBadge } from "../../components/StatusBadge.jsx";
import { ErrorBanner } from "../../components/ErrorBanner.jsx";
import { FormField, inputClasses } from "../../components/FormField.jsx";
import { usersApi } from "../../api/users";
import { extractErrorMessage } from "../../api/client";

const ROLES = ["admin", "dispatcher", "driver"];
const EMPTY_FORM = { full_name: "", email: "", password: "", role: "dispatcher" };

export default function UsersPage() {
  const [accounts, setAccounts] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function loadAccounts() {
    usersApi
      .list({ page: 1, page_size: 50 })
      .then((res) => setAccounts(res.data.items))
      .catch((err) => setError(extractErrorMessage(err)));
  }

  useEffect(loadAccounts, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await usersApi.create(form);
      setForm(EMPTY_FORM);
      setIsFormOpen(false);
      loadAccounts();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeactivate(id) {
    setError("");
    try {
      await usersApi.deactivate(id);
      loadAccounts();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  const columns = [
    { key: "full_name", header: "Name" },
    { key: "email", header: "Email", render: (a) => <span className="font-data text-xs">{a.email}</span> },
    { key: "role", header: "Role", render: (a) => <StatusBadge status={a.role === "driver" ? "off_duty" : "available"} /> },
    { key: "is_active", header: "Active", render: (a) => (a.is_active ? "Yes" : "No") },
    {
      key: "actions",
      header: "Actions",
      render: (a) =>
        a.is_active && (
          <Button variant="danger" onClick={() => handleDeactivate(a.id)}>
            Deactivate
          </Button>
        ),
    },
  ];

  return (
    <AppShell title="User Management">
      <div className="space-y-6">
        <ErrorBanner message={error} />
        <Card
          title={`Accounts (${accounts.length})`}
          action={
            <Button variant="secondary" onClick={() => setIsFormOpen((v) => !v)}>
              {isFormOpen ? "Close" : "Create account"}
            </Button>
          }
        >
          {isFormOpen && (
            <form onSubmit={handleCreate} className="mb-6 grid grid-cols-1 gap-4 rounded-md border border-border p-4 sm:grid-cols-4">
              <FormField label="Full name">
                <input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className={inputClasses} />
              </FormField>
              <FormField label="Email">
                <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClasses} />
              </FormField>
              <FormField label="Temporary password">
                <input required type="password" minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={inputClasses} />
              </FormField>
              <FormField label="Role">
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className={inputClasses}>
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </FormField>
              <div className="sm:col-span-4">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving…" : "Create account"}
                </Button>
              </div>
            </form>
          )}

          <DataTable columns={columns} rows={accounts} emptyLabel="No accounts yet" />
        </Card>
      </div>
    </AppShell>
  );
}
