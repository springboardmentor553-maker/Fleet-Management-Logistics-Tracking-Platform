import React, { useEffect, useState } from "react";
import { driversApi } from "../api/fleetApi.js";
import { Badge } from "../components/common/Badge.jsx";
import { EmptyState } from "../components/common/EmptyState.jsx";
import { Modal } from "../components/common/Modal.jsx";
import { SkeletonRows } from "../components/common/Skeleton.jsx";

export function DriversPage({ showToast }) {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    license_number: "",
    phone: "",
    status: "available",
  });

  async function loadDrivers() {
    setLoading(true);
    try {
      const data = await driversApi.getAll();
      setDrivers(data);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDrivers();
  }, []);

  function handleOpenCreate() {
    setEditingItem(null);
    setFormData({
      name: "",
      license_number: "",
      phone: "",
      status: "available",
    });
    setIsModalOpen(true);
  }

  function handleOpenEdit(driver) {
    setEditingItem(driver);
    setFormData({
      name: driver.name || "",
      license_number: driver.license_number || "",
      phone: driver.phone || "",
      status: driver.status || "available",
    });
    setIsModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.name.trim() || !formData.license_number.trim()) {
      showToast("Driver Name and License Number are required.", "error");
      return;
    }

    try {
      if (editingItem) {
        await driversApi.update(editingItem.id, formData);
        showToast("Driver record updated!", "success");
      } else {
        await driversApi.create(formData);
        showToast("Driver onboarded successfully!", "success");
      }
      setIsModalOpen(false);
      loadDrivers();
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to remove this driver record?")) return;
    try {
      await driversApi.delete(id);
      showToast("Driver removed successfully.", "success");
      loadDrivers();
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  const filtered = drivers.filter(
    (d) =>
      d.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.license_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.phone?.includes(searchTerm)
  );

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <h1>Driver Roster</h1>
          <p className="subtitle">Manage drivers, license verification, and duty status</p>
        </div>
        <div className="header-actions">
          <input
            className="search-input"
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="🔍 Search drivers..."
            type="text"
            value={searchTerm}
          />
          <button className="btn primary" onClick={handleOpenCreate} type="button">
            + Onboard Driver
          </button>
        </div>
      </header>

      <div className="panel table-panel">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Full Name</th>
                <th>License Number</th>
                <th>Phone Number</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows cols={6} rows={4} />
              ) : filtered.length > 0 ? (
                filtered.map((d) => (
                  <tr key={d.id}>
                    <td>#{d.id}</td>
                    <td>
                      <strong>{d.name}</strong>
                    </td>
                    <td>
                      <code>{d.license_number}</code>
                    </td>
                    <td>{d.phone || "N/A"}</td>
                    <td>
                      <Badge status={d.status} />
                    </td>
                    <td className="text-right action-cells">
                      <button
                        className="btn sm outline"
                        onClick={() => handleOpenEdit(d)}
                        type="button"
                      >
                        Edit
                      </button>
                      <button
                        className="btn sm danger"
                        onClick={() => handleDelete(d.id)}
                        type="button"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6}>
                    <EmptyState
                      actionText="Onboard Driver"
                      description="No drivers found in PostgreSQL."
                      onAction={handleOpenCreate}
                      title="No Drivers Registered"
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
        title={editingItem ? "Edit Driver Details" : "Onboard New Driver"}
      >
        <form className="form-grid" onSubmit={handleSubmit}>
          <label className="col-span-2">
            <span>Full Name *</span>
            <input
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Marcus Vance"
              required
              type="text"
              value={formData.name}
            />
          </label>

          <label>
            <span>Commercial License No. *</span>
            <input
              onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
              placeholder="e.g. CDL-994821"
              required
              type="text"
              value={formData.license_number}
            />
          </label>

          <label>
            <span>Phone Number</span>
            <input
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="e.g. +1 (555) 234-5678"
              type="text"
              value={formData.phone}
            />
          </label>

          <label className="col-span-2">
            <span>Availability Status *</span>
            <select
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              value={formData.status}
            >
              <option value="available">Available</option>
              <option value="assigned">Assigned</option>
              <option value="on_trip">On Active Trip</option>
              <option value="leave">On Leave</option>
            </select>
          </label>

          <div className="form-actions col-span-2">
            <button className="btn outline" onClick={() => setIsModalOpen(false)} type="button">
              Cancel
            </button>
            <button className="btn primary" type="submit">
              {editingItem ? "Save Changes" : "Onboard Driver"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
