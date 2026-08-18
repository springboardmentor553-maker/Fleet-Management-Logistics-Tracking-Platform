import React, { useEffect, useState } from "react";
import { driversApi, routesApi, shipmentsApi, vehiclesApi } from "../api/fleetApi.js";
import { Badge } from "../components/common/Badge.jsx";
import { EmptyState } from "../components/common/EmptyState.jsx";
import { Modal } from "../components/common/Modal.jsx";
import { SkeletonRows } from "../components/common/Skeleton.jsx";

export function ShipmentsPage({ showToast }) {
  const [shipments, setShipments] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [routes, setRoutes] = useState([]);

  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Tracking query state
  const [trackingNumberInput, setTrackingNumberInput] = useState("");
  const [trackedStatus, setTrackedStatus] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);

  const [formData, setFormData] = useState({
    customer_name: "",
    source: "",
    destination: "",
    cargo_description: "",
    weight: "",
    status: "Created",
    vehicle_id: "",
    driver_id: "",
    route_id: "",
  });

  async function loadData() {
    setLoading(true);
    try {
      const [shipmentList, vehicleList, driverList, routeList] = await Promise.all([
        shipmentsApi.getAll(),
        vehiclesApi.getAll(),
        driversApi.getAll(),
        routesApi.getAll(),
      ]);
      setShipments(shipmentList);
      setVehicles(vehicleList);
      setDrivers(driverList);
      setRoutes(routeList);
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
      customer_name: "",
      source: "",
      destination: "",
      cargo_description: "",
      weight: "",
      status: "Created",
      vehicle_id: vehicles.length > 0 ? String(vehicles[0].id) : "",
      driver_id: drivers.length > 0 ? String(drivers[0].id) : "",
      route_id: routes.length > 0 ? String(routes[0].id) : "",
    });
    setIsModalOpen(true);
  }

  function handleOpenEdit(item) {
    setEditingItem(item);
    setFormData({
      customer_name: item.customer_name || "",
      source: item.source || "",
      destination: item.destination || "",
      cargo_description: item.cargo_description || "",
      weight: item.weight ?? "",
      status: item.status || "Created",
      vehicle_id: item.vehicle_id ? String(item.vehicle_id) : "",
      driver_id: item.driver_id ? String(item.driver_id) : "",
      route_id: item.route_id ? String(item.route_id) : "",
    });
    setIsModalOpen(true);
  }

  function handleRouteSelect(e) {
    const routeId = e.target.value;
    const selectedRoute = routes.find((r) => String(r.id) === String(routeId));
    if (selectedRoute) {
      setFormData((prev) => ({
        ...prev,
        route_id: routeId,
        source: selectedRoute.source,
        destination: selectedRoute.destination,
      }));
    } else {
      setFormData((prev) => ({ ...prev, route_id: routeId }));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.customer_name.trim() || !formData.source.trim() || !formData.destination.trim()) {
      showToast("Customer Name, Source, and Destination are required.", "error");
      return;
    }

    const payload = {
      customer_name: formData.customer_name,
      source: formData.source,
      destination: formData.destination,
      cargo_description: formData.cargo_description || null,
      weight: formData.weight !== "" ? Number(formData.weight) : null,
      status: formData.status,
      vehicle_id: formData.vehicle_id ? Number(formData.vehicle_id) : null,
      driver_id: formData.driver_id ? Number(formData.driver_id) : null,
      route_id: formData.route_id ? Number(formData.route_id) : null,
    };

    try {
      if (editingItem) {
        await shipmentsApi.update(editingItem.id, payload);
        showToast("Shipment updated successfully!", "success");
      } else {
        const created = await shipmentsApi.create(payload);
        showToast(`Shipment created! Tracking: ${created.tracking_number}`, "success");
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to cancel and delete this shipment?")) return;
    try {
      await shipmentsApi.delete(id);
      showToast("Shipment record deleted.", "success");
      loadData();
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  async function handleTrackLookup(e) {
    e.preventDefault();
    if (!trackingNumberInput.trim()) return;
    setTrackingLoading(true);
    setTrackedStatus(null);
    try {
      const res = await shipmentsApi.track(trackingNumberInput.trim());
      setTrackedStatus(res);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setTrackingLoading(false);
    }
  }

  const filtered = shipments.filter(
    (s) =>
      s.tracking_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.source?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.destination?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.status?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <h1>Shipments & Freight Dispatch</h1>
          <p className="subtitle">Create shipments, assign drivers & vehicles, and track live status</p>
        </div>
        <div className="header-actions">
          <input
            className="search-input"
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="🔍 Search tracking, customer..."
            type="text"
            value={searchTerm}
          />
          <button className="btn primary" onClick={handleOpenCreate} type="button">
            + New Shipment
          </button>
        </div>
      </header>

      {/* Public Tracking Bar */}
      <div className="panel tracking-bar-panel">
        <form className="tracking-form" onSubmit={handleTrackLookup}>
          <span>🔍 Public Tracking Lookup:</span>
          <input
            onChange={(e) => setTrackingNumberInput(e.target.value)}
            placeholder="e.g. FLT100001"
            type="text"
            value={trackingNumberInput}
          />
          <button className="btn outline sm" disabled={trackingLoading} type="submit">
            {trackingLoading ? "Searching..." : "Track Package"}
          </button>
        </form>

        {trackedStatus && (
          <div className="tracked-result-card">
            <h4>Tracking: {trackedStatus.tracking_number}</h4>
            <div className="tracked-details">
              <span>Status: <Badge status={trackedStatus.status} /></span>
              <span>Driver: <strong>{trackedStatus.driver_name || "Unassigned"}</strong></span>
              <span>Vehicle: <strong>{trackedStatus.vehicle_registration_number || "Unassigned"}</strong></span>
              <span>Pickup: <strong>{trackedStatus.pickup_location}</strong></span>
              <span>Destination: <strong>{trackedStatus.destination}</strong></span>
              <span>ETA: <strong>{trackedStatus.eta || "N/A"}</strong></span>
            </div>
          </div>
        )}
      </div>

      <div className="panel table-panel">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Tracking #</th>
                <th>Customer</th>
                <th>Origin ➔ Destination</th>
                <th>Assigned Vehicle</th>
                <th>Assigned Driver</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows cols={8} rows={4} />
              ) : filtered.length > 0 ? (
                filtered.map((s) => {
                  const assignedVeh = vehicles.find((v) => v.id === s.vehicle_id);
                  const assignedDrv = drivers.find((d) => d.id === s.driver_id);
                  return (
                    <tr key={s.id}>
                      <td>#{s.id}</td>
                      <td>
                        <code className="tracking-code">{s.tracking_number}</code>
                      </td>
                      <td>
                        <strong>{s.customer_name}</strong>
                      </td>
                      <td>
                        <span className="route-flow">
                          {s.source} ➔ {s.destination}
                        </span>
                      </td>
                      <td>{assignedVeh ? `${assignedVeh.vehicle_number} (${assignedVeh.vehicle_type})` : "Unassigned"}</td>
                      <td>{assignedDrv ? assignedDrv.name : "Unassigned"}</td>
                      <td>
                        <Badge status={s.status} />
                      </td>
                      <td className="text-right action-cells">
                        <button
                          className="btn sm outline"
                          onClick={() => handleOpenEdit(s)}
                          type="button"
                        >
                          Edit
                        </button>
                        <button
                          className="btn sm danger"
                          onClick={() => handleDelete(s.id)}
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
                  <td colSpan={8}>
                    <EmptyState
                      actionText="New Shipment"
                      description="No active shipments recorded in database."
                      onAction={handleOpenCreate}
                      title="No Shipments Found"
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
        title={editingItem ? `Edit Shipment #${editingItem.id}` : "Dispatch New Shipment"}
      >
        <form className="form-grid" onSubmit={handleSubmit}>
          <label className="col-span-2">
            <span>Customer / Sender Name *</span>
            <input
              onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
              placeholder="e.g. Apex Logistics Inc."
              required
              type="text"
              value={formData.customer_name}
            />
          </label>

          <label className="col-span-2">
            <span>Select Pre-configured Route (Optional auto-fill)</span>
            <select onChange={handleRouteSelect} value={formData.route_id}>
              <option value="">-- Custom Route --</option>
              {routes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.source} ➔ {r.destination})
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Source Origin *</span>
            <input
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              placeholder="e.g. Chicago Port"
              required
              type="text"
              value={formData.source}
            />
          </label>

          <label>
            <span>Destination *</span>
            <input
              onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
              placeholder="e.g. Dallas Hub"
              required
              type="text"
              value={formData.destination}
            />
          </label>

          <label>
            <span>Assign Vehicle</span>
            <select
              onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
              value={formData.vehicle_id}
            >
              <option value="">-- Unassigned --</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.vehicle_number} — {v.vehicle_type} ({v.status})
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Assign Driver</span>
            <select
              onChange={(e) => setFormData({ ...formData, driver_id: e.target.value })}
              value={formData.driver_id}
            >
              <option value="">-- Unassigned --</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.status})
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Cargo Weight (tons)</span>
            <input
              onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
              placeholder="e.g. 12.5"
              step="0.1"
              type="number"
              value={formData.weight}
            />
          </label>

          <label>
            <span>Shipment Status *</span>
            <select
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              value={formData.status}
            >
              <option value="Created">Created</option>
              <option value="Assigned">Assigned</option>
              <option value="Picked Up">Picked Up</option>
              <option value="In Transit">In Transit</option>
              <option value="Out for Delivery">Out for Delivery</option>
              <option value="Delivered">Delivered</option>
              <option value="Delayed">Delayed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </label>

          <label className="col-span-2">
            <span>Cargo Description</span>
            <input
              onChange={(e) => setFormData({ ...formData, cargo_description: e.target.value })}
              placeholder="e.g. Industrial machinery parts"
              type="text"
              value={formData.cargo_description}
            />
          </label>

          <div className="form-actions col-span-2">
            <button className="btn outline" onClick={() => setIsModalOpen(false)} type="button">
              Cancel
            </button>
            <button className="btn primary" type="submit">
              {editingItem ? "Update Shipment" : "Generate & Dispatch"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
