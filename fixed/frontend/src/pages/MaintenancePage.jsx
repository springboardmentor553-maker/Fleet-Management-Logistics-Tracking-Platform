import React, { useEffect, useState } from "react";
import { maintenanceApi, vehiclesApi } from "../api/fleetApi.js";
import { Badge } from "../components/common/Badge.jsx";
import { EmptyState } from "../components/common/EmptyState.jsx";
import { Modal } from "../components/common/Modal.jsx";
import { SkeletonRows } from "../components/common/Skeleton.jsx";

export function MaintenancePage({ showToast }) {
  const [records, setRecords] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const today = new Date().toISOString().split("T")[0];

  const [formData, setFormData] = useState({
    vehicle_id: "",
    category: "General Inspection",
    service_date: today,
    next_service_date: "",
    cost: "",
    service_provider: "",
    status: "scheduled",
    notes: "",
  });

  async function loadData() {
    setLoading(true);
    try {
      const [mList, vList] = await Promise.all([
        maintenanceApi.getAll(),
        vehiclesApi.getAll(),
      ]);
      setRecords(mList);
      setVehicles(vList);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function handleOpenCreate() {
    setEditingItem(null);
    setFormData({
      vehicle_id: vehicles.length > 0 ? String(vehicles[0].id) : "",
      category: "General Inspection",
      service_date: today,
      next_service_date: "",
      cost: "",
      service_provider: "",
      status: "scheduled",
      notes: "",
    });
    setIsModalOpen(true);
  }

  function handleOpenEdit(item) {
    setEditingItem(item);
    setFormData({
      vehicle_id: item.vehicle_id ? String(item.vehicle_id) : "",
      category: item.category || "General Inspection",
      service_date: item.service_date || today,
      next_service_date: item.next_service_date || "",
      cost: item.cost ?? "",
      service_provider: item.service_provider || "",
      status: item.status || "scheduled",
      notes: item.notes || "",
    });
    setIsModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.vehicle_id) {
      showToast("Please select a target vehicle.", "error");
      return;
    }

    const payload = {
      vehicle_id: Number(formData.vehicle_id),
      category: formData.category,
      service_date: formData.service_date,
      next_service_date: formData.next_service_date || null,
      cost: formData.cost !== "" ? Number(formData.cost) : null,
      service_provider: formData.service_provider || null,
      status: formData.status,
      notes: formData.notes || null,
    };

    try {
      if (editingItem) {
        await maintenanceApi.update(editingItem.id, payload);
        showToast("Maintenance record updated!", "success");
      } else {
        await maintenanceApi.create(payload);
        showToast("Maintenance service logged successfully!", "success");
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to remove this maintenance record?")) return;
    try {
      await maintenanceApi.delete(id);
      showToast("Maintenance record removed.", "success");
      loadData();
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  const filtered = records.filter((r) => {
    const veh = vehicles.find((v) => v.id === r.vehicle_id);
    return (
      r.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.service_provider?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      veh?.vehicle_number?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <h1>Fleet Maintenance Management</h1>
          <p className="subtitle">Track vehicle servicing, oil changes, engine checks, and maintenance costs</p>
        </div>
        <div className="header-actions">
          <input
            className="search-input"
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="🔍 Search service provider..."
            type="text"
            value={searchTerm}
          />
          <button className="btn primary" onClick={handleOpenCreate} type="button">
            + Schedule Service
          </button>
        </div>
      </header>

      <div className="panel table-panel">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Vehicle</th>
                <th>Service Category</th>
                <th>Service Date</th>
                <th>Next Service</th>
                <th>Cost ($)</th>
                <th>Provider</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows cols={9} rows={4} />
              ) : filtered.length > 0 ? (
                filtered.map((r) => {
                  const veh = vehicles.find((v) => v.id === r.vehicle_id);
                  return (
                    <tr key={r.id}>
                      <td>#{r.id}</td>
                      <td>
                        <strong>{veh ? `${veh.vehicle_number}` : `Vehicle #${r.vehicle_id}`}</strong>
                      </td>
                      <td>🛠️ {r.category}</td>
                      <td>{r.service_date}</td>
                      <td>{r.next_service_date || "N/A"}</td>
                      <td>{r.cost ? `$${r.cost.toLocaleString()}` : "N/A"}</td>
                      <td>{r.service_provider || "Internal"}</td>
                      <td>
                        <Badge status={r.status} />
                      </td>
                      <td className="text-right action-cells">
                        <button
                          className="btn sm outline"
                          onClick={() => handleOpenEdit(r)}
                          type="button"
                        >
                          Edit
                        </button>
                        <button
                          className="btn sm danger"
                          onClick={() => handleDelete(r.id)}
                          type="button"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9}>
                    <EmptyState
                      actionText="Schedule Service"
                      description="No maintenance logs in PostgreSQL database."
                      onAction={handleOpenCreate}
                      title="No Maintenance Records"
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? "Edit Service Record" : "Schedule Maintenance Service"}
      >
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            <span>Target Vehicle *</span>
            <select
              onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
              required
              value={formData.vehicle_id}
            >
              <option value="">-- Select Vehicle --</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.vehicle_number} ({v.vehicle_type})
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Service Category *</span>
            <select
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              value={formData.category}
            >
              <option value="Oil Change">Oil Change</option>
              <option value="Tyre Replacement">Tyre Replacement</option>
              <option value="Brake Service">Brake Service</option>
              <option value="Engine Service">Engine Service</option>
              <option value="General Inspection">General Inspection</option>
            </select>
          </label>

          <label>
            <span>Service Date *</span>
            <input
              onChange={(e) => setFormData({ ...formData, service_date: e.target.value })}
              required
              type="date"
              value={formData.service_date}
            />
          </label>

          <label>
            <span>Next Service Due</span>
            <input
              onChange={(e) => setFormData({ ...formData, next_service_date: e.target.value })}
              type="date"
              value={formData.next_service_date}
            />
          </label>

          <label>
            <span>Total Service Cost ($)</span>
            <input
              onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
              placeholder="e.g. 450"
              step="0.01"
              type="number"
              value={formData.cost}
            />
          </label>

          <label>
            <span>Status</span>
            <select
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              value={formData.status}
            >
              <option value="scheduled">Scheduled</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </label>

          <label className="col-span-2">
            <span>Service Provider / Workshop</span>
            <input
              onChange={(e) => setFormData({ ...formData, service_provider: e.target.value })}
              placeholder="e.g. FleetCare Auto Center"
              type="text"
              value={formData.service_provider}
            />
          </label>

          <label className="col-span-2">
            <span>Notes / Diagnostics</span>
            <input
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g. Replaced synthetic oil filter"
              type="text"
              value={formData.notes}
            />
          </label>

          <div className="form-actions col-span-2">
            <button className="btn outline" onClick={() => setIsModalOpen(false)} type="button">
              Cancel
            </button>
            <button className="btn primary" type="submit">
              {editingItem ? "Update Record" : "Save Service Log"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
