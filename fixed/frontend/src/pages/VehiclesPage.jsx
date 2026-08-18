import React, { useEffect, useState } from "react";
import { vehiclesApi } from "../api/fleetApi.js";
import { Badge } from "../components/common/Badge.jsx";
import { EmptyState } from "../components/common/EmptyState.jsx";
import { Modal } from "../components/common/Modal.jsx";
import { SkeletonRows } from "../components/common/Skeleton.jsx";

export function VehiclesPage({ showToast }) {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    vehicle_number: "",
    vehicle_type: "Heavy Truck",
    capacity: "",
    status: "available",
    current_location: "",
  });

  async function loadVehicles() {
    setLoading(true);
    try {
      const data = await vehiclesApi.getAll();
      setVehicles(data);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadVehicles();
  }, []);

  function handleOpenCreate() {
    setEditingItem(null);
    setFormData({
      vehicle_number: "",
      vehicle_type: "Heavy Truck",
      capacity: "",
      status: "available",
      current_location: "",
    });
    setIsModalOpen(true);
  }

  function handleOpenEdit(vehicle) {
    setEditingItem(vehicle);
    setFormData({
      vehicle_number: vehicle.vehicle_number || "",
      vehicle_type: vehicle.vehicle_type || "Heavy Truck",
      capacity: vehicle.capacity ?? "",
      status: vehicle.status || "available",
      current_location: vehicle.current_location || "",
    });
    setIsModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.vehicle_number.trim()) {
      showToast("Vehicle Registration Number is required.", "error");
      return;
    }

    const payload = {
      ...formData,
      capacity: formData.capacity !== "" ? Number(formData.capacity) : null,
    };

    try {
      if (editingItem) {
        await vehiclesApi.update(editingItem.id, payload);
        showToast("Vehicle updated successfully!", "success");
      } else {
        await vehiclesApi.create(payload);
        showToast("Vehicle created successfully!", "success");
      }
      setIsModalOpen(false);
      loadVehicles();
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this vehicle?")) return;
    try {
      await vehiclesApi.delete(id);
      showToast("Vehicle deleted successfully.", "success");
      loadVehicles();
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  const filteredVehicles = vehicles.filter(
    (v) =>
      v.vehicle_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.vehicle_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.current_location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <h1>Vehicle Fleet Catalog</h1>
          <p className="subtitle">Manage company vehicles, operational availability, and physical specs</p>
        </div>
        <div className="header-actions">
          <input
            className="search-input"
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="🔍 Search vehicles..."
            type="text"
            value={searchTerm}
          />
          <button className="btn primary" onClick={handleOpenCreate} type="button">
            + Add Vehicle
          </button>
        </div>
      </header>

      <div className="panel table-panel">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Vehicle No.</th>
                <th>Type</th>
                <th>Capacity (tons)</th>
                <th>Status</th>
                <th>Current Location</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows cols={7} rows={4} />
              ) : filteredVehicles.length > 0 ? (
                filteredVehicles.map((v) => (
                  <tr key={v.id}>
                    <td>#{v.id}</td>
                    <td>
                      <strong>{v.vehicle_number}</strong>
                    </td>
                    <td>{v.vehicle_type}</td>
                    <td>{v.capacity ? `${v.capacity} tons` : "N/A"}</td>
                    <td>
                      <Badge status={v.status} />
                    </td>
                    <td>{v.current_location || "Depot"}</td>
                    <td className="text-right action-cells">
                      <button
                        className="btn sm outline"
                        onClick={() => handleOpenEdit(v)}
                        type="button"
                      >
                        Edit
                      </button>
                      <button
                        className="btn sm danger"
                        onClick={() => handleDelete(v.id)}
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
                      actionText="Add Vehicle"
                      description="No vehicles match your query in PostgreSQL."
                      onAction={handleOpenCreate}
                      title="No Vehicles Registered"
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
        title={editingItem ? "Edit Vehicle" : "Register New Vehicle"}
      >
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            <span>Vehicle Registration Number *</span>
            <input
              onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value })}
              placeholder="e.g. TRK-8821"
              required
              type="text"
              value={formData.vehicle_number}
            />
          </label>

          <label>
            <span>Vehicle Type *</span>
            <select
              onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
              value={formData.vehicle_type}
            >
              <option value="Heavy Truck">Heavy Truck</option>
              <option value="Cargo Van">Cargo Van</option>
              <option value="Flatbed Trailer">Flatbed Trailer</option>
              <option value="Refrigerated Truck">Refrigerated Truck</option>
              <option value="Pickup Truck">Pickup Truck</option>
            </select>
          </label>

          <label>
            <span>Load Capacity (tons)</span>
            <input
              onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              placeholder="e.g. 15.5"
              step="0.1"
              type="number"
              value={formData.capacity}
            />
          </label>

          <label>
            <span>Current Status *</span>
            <select
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              value={formData.status}
            >
              <option value="available">Available</option>
              <option value="in_transit">In Transit</option>
              <option value="maintenance">Under Maintenance</option>
            </select>
          </label>

          <label className="col-span-2">
            <span>Current Location</span>
            <input
              onChange={(e) => setFormData({ ...formData, current_location: e.target.value })}
              placeholder="e.g. Central Warehouse / Chicago Hub"
              type="text"
              value={formData.current_location}
            />
          </label>

          <div className="form-actions col-span-2">
            <button className="btn outline" onClick={() => setIsModalOpen(false)} type="button">
              Cancel
            </button>
            <button className="btn primary" type="submit">
              {editingItem ? "Save Changes" : "Register Vehicle"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
