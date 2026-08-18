import React, { useEffect, useState } from "react";
import { routesApi } from "../api/fleetApi.js";
import { EmptyState } from "../components/common/EmptyState.jsx";
import { Modal } from "../components/common/Modal.jsx";
import { SkeletonRows } from "../components/common/Skeleton.jsx";

export function RoutesPage({ showToast }) {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    source: "",
    destination: "",
    distance_km: "",
    estimated_duration_hours: "",
  });

  async function loadRoutes() {
    setLoading(true);
    try {
      const data = await routesApi.getAll();
      setRoutes(data);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRoutes();
  }, []);

  function handleOpenCreate() {
    setEditingItem(null);
    setFormData({
      name: "",
      source: "",
      destination: "",
      distance_km: "",
      estimated_duration_hours: "",
    });
    setIsModalOpen(true);
  }

  function handleOpenEdit(route) {
    setEditingItem(route);
    setFormData({
      name: route.name || "",
      source: route.source || "",
      destination: route.destination || "",
      distance_km: route.distance_km ?? "",
      estimated_duration_hours: route.estimated_duration_hours ?? "",
    });
    setIsModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.name.trim() || !formData.source.trim() || !formData.destination.trim()) {
      showToast("Route Name, Source, and Destination are required.", "error");
      return;
    }

    const payload = {
      ...formData,
      distance_km: formData.distance_km !== "" ? Number(formData.distance_km) : null,
      estimated_duration_hours:
        formData.estimated_duration_hours !== ""
          ? Number(formData.estimated_duration_hours)
          : null,
    };

    try {
      if (editingItem) {
        await routesApi.update(editingItem.id, payload);
        showToast("Route updated!", "success");
      } else {
        await routesApi.create(payload);
        showToast("Route created successfully!", "success");
      }
      setIsModalOpen(false);
      loadRoutes();
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this route?")) return;
    try {
      await routesApi.delete(id);
      showToast("Route deleted.", "success");
      loadRoutes();
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  const filtered = routes.filter(
    (r) =>
      r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.source?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.destination?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <h1>Logistics Routes</h1>
          <p className="subtitle">Pre-defined transit corridors, distances, and duration targets</p>
        </div>
        <div className="header-actions">
          <input
            className="search-input"
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="🔍 Search routes..."
            type="text"
            value={searchTerm}
          />
          <button className="btn primary" onClick={handleOpenCreate} type="button">
            + Create Route
          </button>
        </div>
      </header>

      <div className="panel table-panel">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Route Name</th>
                <th>Source Origin</th>
                <th>Destination</th>
                <th>Distance (km)</th>
                <th>Est. Hours</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows cols={7} rows={4} />
              ) : filtered.length > 0 ? (
                filtered.map((r) => (
                  <tr key={r.id}>
                    <td>#{r.id}</td>
                    <td>
                      <strong>{r.name}</strong>
                    </td>
                    <td>📍 {r.source}</td>
                    <td>🏁 {r.destination}</td>
                    <td>{r.distance_km ? `${r.distance_km} km` : "N/A"}</td>
                    <td>{r.estimated_duration_hours ? `${r.estimated_duration_hours} hrs` : "N/A"}</td>
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
                ))
              ) : (
                <tr>
                  <td colSpan={7}>
                    <EmptyState
                      actionText="Create Route"
                      description="No routes defined in PostgreSQL."
                      onAction={handleOpenCreate}
                      title="No Routes Configured"
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
        title={editingItem ? "Edit Route Corridor" : "Create New Route"}
      >
        <form className="form-grid" onSubmit={handleSubmit}>
          <label className="col-span-2">
            <span>Route Name *</span>
            <input
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Midwest Freight Corridor A"
              required
              type="text"
              value={formData.name}
            />
          </label>

          <label>
            <span>Source Origin *</span>
            <input
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              placeholder="e.g. Chicago Depot"
              required
              type="text"
              value={formData.source}
            />
          </label>

          <label>
            <span>Destination *</span>
            <input
              onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
              placeholder="e.g. Detroit Terminal"
              required
              type="text"
              value={formData.destination}
            />
          </label>

          <label>
            <span>Distance (km)</span>
            <input
              onChange={(e) => setFormData({ ...formData, distance_km: e.target.value })}
              placeholder="e.g. 450"
              step="0.1"
              type="number"
              value={formData.distance_km}
            />
          </label>

          <label>
            <span>Estimated Duration (hours)</span>
            <input
              onChange={(e) =>
                setFormData({ ...formData, estimated_duration_hours: e.target.value })
              }
              placeholder="e.g. 6.5"
              step="0.1"
              type="number"
              value={formData.estimated_duration_hours}
            />
          </label>

          <div className="form-actions col-span-2">
            <button className="btn outline" onClick={() => setIsModalOpen(false)} type="button">
              Cancel
            </button>
            <button className="btn primary" type="submit">
              {editingItem ? "Save Changes" : "Create Route"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
