import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const resources = [
  {
    key: "vehicles",
    title: "Vehicles",
    endpoint: "/vehicles/",
    fields: [
      ["vehicle_number", "Vehicle No."],
      ["vehicle_type", "Type"],
      ["capacity", "Capacity"],
      ["status", "Status"],
      ["current_location", "Location"],
    ],
  },
  {
    key: "drivers",
    title: "Drivers",
    endpoint: "/drivers/",
    fields: [
      ["name", "Name"],
      ["license_number", "License"],
      ["phone", "Phone"],
      ["status", "Status"],
    ],
  },
  {
    key: "routes",
    title: "Routes",
    endpoint: "/routes/",
    fields: [
      ["name", "Name"],
      ["source", "Source"],
      ["destination", "Destination"],
      ["distance_km", "Distance km"],
      ["estimated_duration_hours", "Hours"],
    ],
  },
  {
    key: "shipments",
    title: "Shipments",
    endpoint: "/shipments/",
    fields: [
      ["tracking_number", "Tracking No."],
      ["sender_name", "Sender"],
      ["receiver_name", "Receiver"],
      ["pickup_location", "Pickup"],
      ["delivery_location", "Delivery"],
      ["status", "Status"],
      ["weight", "Weight"],
      ["assigned_vehicle_id", "Vehicle ID"],
      ["assigned_driver_id", "Driver ID"],
    ],
    readOnlyFields: ["tracking_number"],
  },
  {
    key: "trips",
    title: "Trips",
    endpoint: "/trips/",
    fields: [
      ["shipment_id", "Shipment ID"],
      ["driver_id", "Driver ID"],
      ["vehicle_id", "Vehicle ID"],
      ["pickup_location", "Pickup"],
      ["destination", "Destination"],
      ["scheduled_start_time", "Start Time"],
      ["scheduled_end_time", "End Time"],
      ["status", "Status"],
    ],
  },
  {
    key: "maintenance",
    title: "Maintenance",
    endpoint: "/maintenance/",
    fields: [
      ["vehicle_id", "Vehicle ID"],
      ["service_date", "Service Date"],
      ["description", "Description"],
      ["cost", "Cost"],
      ["status", "Status"],
    ],
  },
  {
    key: "users",
    title: "Users",
    endpoint: "/users/",
    fields: [
      ["name", "Name"],
      ["email", "Email"],
      ["password", "Password"],
      ["role", "Role"],
    ],
    hiddenTableFields: ["password"],
  },
  {
    key: "notifications",
    title: "Notifications",
    endpoint: "/notifications/",
    fields: [
      ["title", "Title"],
      ["message", "Message"],
      ["level", "Level"],
      ["is_read", "Read"],
    ],
  },
];

function App() {
  const [activeKey, setActiveKey] = useState("shipments");
  const [summary, setSummary] = useState(null);
  const [report, setReport] = useState(null);
  const [rows, setRows] = useState({});
  const [forms, setForms] = useState({});
  const [status, setStatus] = useState("Loading FleetFlow");

  const active = useMemo(
    () => resources.find((resource) => resource.key === activeKey),
    [activeKey],
  );

  async function request(path, options) {
    const response = await fetch(`${API_URL}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });

    if (!response.ok) {
      let detail = await response.text();
      try {
        const parsed = JSON.parse(detail);
        detail = parsed.detail || detail;
      } catch {
        detail = detail || `Request failed with ${response.status}`;
      }
      throw new Error(detail);
    }

    if (response.status === 204) return null;
    return response.json();
  }

  async function loadAll() {
    setStatus("Syncing");
    try {
      const [summaryData, reportData, ...resourceRows] = await Promise.all([
        request("/dashboard/summary"),
        request("/reports/operations"),
        ...resources.map((resource) => request(resource.endpoint)),
      ]);

      setSummary(summaryData);
      setReport(reportData);
      setRows(
        resources.reduce((acc, resource, index) => {
          acc[resource.key] = resourceRows[index];
          return acc;
        }, {}),
      );
      setStatus("Connected");
    } catch (error) {
      setStatus(error.message);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  function updateForm(key, field, value) {
    setForms((current) => ({
      ...current,
      [key]: {
        ...current[key],
        [field]: value,
      },
    }));
  }

  async function submitResource(event, resource) {
    event.preventDefault();
    const payload = Object.fromEntries(
      Object.entries(forms[resource.key] || {}).filter(([, value]) => value !== ""),
    );
    const normalizedPayload = Object.fromEntries(
      Object.entries(payload).map(([key, value]) => [
        key,
        key.endsWith("_id") ||
        ["capacity", "distance_km", "estimated_duration_hours", "weight", "cost", "is_read"].includes(
          key,
        )
          ? Number(value)
          : value,
      ]),
    );

    try {
      await request(resource.endpoint, {
        method: "POST",
        body: JSON.stringify(normalizedPayload),
      });
      setForms((current) => ({ ...current, [resource.key]: {} }));
      await loadAll();
      setStatus(`${resource.title} saved`);
    } catch (error) {
      setStatus(error.message);
    }
  }

  async function removeResource(resource, id) {
    try {
      await request(`${resource.endpoint}${id}`, { method: "DELETE" });
      await loadAll();
      setStatus(`${resource.title} item deleted`);
    } catch (error) {
      setStatus(error.message);
    }
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div>
          <p className="eyebrow">FleetFlow</p>
          <h1>Logistics Command</h1>
        </div>
        <nav className="nav-list">
          {resources.map((resource) => (
            <button
              className={resource.key === activeKey ? "nav-item active" : "nav-item"}
              key={resource.key}
              onClick={() => setActiveKey(resource.key)}
              type="button"
            >
              {resource.title}
            </button>
          ))}
        </nav>
        <div className="connection">{status}</div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Operations</p>
            <h2>{active.title}</h2>
          </div>
          <button className="refresh" onClick={loadAll} type="button">
            Refresh
          </button>
        </header>

        <section className="metrics">
          {[
            ["Shipments", summary?.shipments ?? 0],
            ["Vehicles", summary?.vehicles ?? 0],
            ["Drivers", summary?.drivers ?? 0],
            ["Unread", summary?.unread_notifications ?? 0],
            ["Capacity", report?.total_vehicle_capacity ?? 0],
            ["Cargo Weight", report?.total_cargo_weight ?? 0],
            ["Maint. Cost", report?.total_maintenance_cost ?? 0],
            ["Routes", summary?.routes ?? 0],
          ].map(([label, value]) => (
            <article className="metric" key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </article>
          ))}
        </section>

        <section className="report-band">
          {[
            ["Shipments", report?.shipments_by_status],
            ["Vehicles", report?.vehicles_by_status],
            ["Drivers", report?.drivers_by_status],
            ["Maintenance", report?.maintenance_by_status],
          ].map(([label, values]) => (
            <article className="report-group" key={label}>
              <h3>{label}</h3>
              <div className="status-list">
                {Object.entries(values || {}).length > 0 ? (
                  Object.entries(values || {}).map(([statusLabel, count]) => (
                    <div className="status-row" key={statusLabel}>
                      <span>{statusLabel}</span>
                      <strong>{count}</strong>
                    </div>
                  ))
                ) : (
                  <div className="status-row muted">
                    <span>No data</span>
                    <strong>0</strong>
                  </div>
                )}
              </div>
            </article>
          ))}
        </section>

        <section className="content-grid">
          <form className="entry-panel" onSubmit={(event) => submitResource(event, active)}>
            <h3>New {active.title.slice(0, -1) || active.title}</h3>
            <div className="field-grid">
              {active.fields
                .filter(([field]) => !active.readOnlyFields?.includes(field))
                .map(([field, label]) => (
                <label key={field}>
                  <span>{label}</span>
                  <input
                    onChange={(event) => updateForm(active.key, field, event.target.value)}
                    type={
                      field.includes("date")
                        ? "date"
                        : field.endsWith("_id") ||
                            [
                              "capacity",
                              "distance_km",
                              "estimated_duration_hours",
                              "weight",
                              "cost",
                              "is_read",
                            ].includes(field)
                          ? "number"
                          : "text"
                    }
                    value={forms[active.key]?.[field] || ""}
                  />
                </label>
              ))}
            </div>
            <button className="primary" type="submit">
              Save
            </button>
          </form>

          <section className="table-panel">
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    {active.fields
                      .filter(([field]) => !active.hiddenTableFields?.includes(field))
                      .map(([field, label]) => (
                        <th key={field}>{label}</th>
                      ))}
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {(rows[active.key] || []).map((row) => (
                    <tr key={row.id}>
                      <td>{row.id}</td>
                      {active.fields
                        .filter(([field]) => !active.hiddenTableFields?.includes(field))
                        .map(([field]) => (
                          <td key={field}>{row[field] ?? ""}</td>
                        ))}
                      <td>
                        <button
                          className="danger"
                          onClick={() => removeResource(active, row.id)}
                          type="button"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {(rows[active.key] || []).length === 0 && (
                    <tr>
                      <td className="empty" colSpan={active.fields.length + 2}>
                        No records yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </section>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
