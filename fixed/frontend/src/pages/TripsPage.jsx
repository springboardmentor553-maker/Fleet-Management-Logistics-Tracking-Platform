import React, { useEffect, useState } from "react";
import { driversApi, shipmentsApi, tripsApi, vehiclesApi } from "../api/fleetApi.js";
import { Badge } from "../components/common/Badge.jsx";
import { EmptyState } from "../components/common/EmptyState.jsx";
import { Modal } from "../components/common/Modal.jsx";
import { SkeletonRows } from "../components/common/Skeleton.jsx";

export function TripsPage({ showToast }) {
  const [trips, setTrips] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [formData, setFormData] = useState({
    shipment_id: "",
    driver_id: "",
    vehicle_id: "",
    pickup_location: "",
    destination: "",
    status: "Scheduled",
  });

  async function loadData() {
    setLoading(true);
    try {
      const [tList, sList, dList, vList] = await Promise.all([
        tripsApi.getAll(),
        shipmentsApi.getAll(),
        driversApi.getAll(),
        vehiclesApi.getAll(),
      ]);
      setTrips(tList);
      setShipments(sList);
      setDrivers(dList);
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
      shipment_id: shipments.length > 0 ? String(shipments[0].id) : "",
      driver_id: drivers.length > 0 ? String(drivers[0].id) : "",
      vehicle_id: vehicles.length > 0 ? String(vehicles[0].id) : "",
      pickup_location: "",
      destination: "",
      status: "Scheduled",
    });
    setIsModalOpen(true);
  }

  function handleShipmentSelect(e) {
    const sId = e.target.value;
    const selectedShipment = shipments.find((s) => String(s.id) === String(sId));
    if (selectedShipment) {
      setFormData((prev) => ({
        ...prev,
        shipment_id: sId,
        pickup_location: selectedShipment.source || prev.pickup_location,
        destination: selectedShipment.destination || prev.destination,
        vehicle_id: selectedShipment.vehicle_id ? String(selectedShipment.vehicle_id) : prev.vehicle_id,
        driver_id: selectedShipment.driver_id ? String(selectedShipment.driver_id) : prev.driver_id,
      }));
    } else {
      setFormData((prev) => ({ ...prev, shipment_id: sId }));
    }
  }

  function handleOpenEdit(item) {
    setEditingItem(item);
    setFormData({
      shipment_id: item.shipment_id ? String(item.shipment_id) : "",
      driver_id: item.driver_id ? String(item.driver_id) : "",
      vehicle_id: item.vehicle_id ? String(item.vehicle_id) : "",
      pickup_location: item.pickup_location || "",
      destination: item.destination || "",
      status: item.status || "Scheduled",
    });
    setIsModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.shipment_id || !formData.driver_id || !formData.vehicle_id) {
      showToast("Shipment, Driver, and Vehicle are required.", "error");
      return;
    }
    if (!formData.pickup_location.trim() || !formData.destination.trim()) {
      showToast("Pickup Location and Destination are required.", "error");
      return;
    }

    const payload = {
      shipment_id: Number(formData.shipment_id),
      driver_id: Number(formData.driver_id),
      vehicle_id: Number(formData.vehicle_id),
      pickup_location: formData.pickup_location,
      destination: formData.destination,
      status: formData.status,
    };

    try {
      if (editingItem) {
        await tripsApi.update(editingItem.id, payload);
        showToast("Trip updated!", "success");
      } else {
        await tripsApi.create(payload);
        showToast("Active trip dispatched successfully!", "success");
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to cancel this trip?")) return;
    try {
      await tripsApi.delete(id);
      showToast("Trip deleted.", "success");
      loadData();
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <h1>Active Trips & Transit Dispatch</h1>
          <p className="subtitle">Coordinate active driver assignments, shipment dispatch, and live trip status</p>
        </div>
        <button className="btn primary" onClick={handleOpenCreate} type="button">
          + Dispatch Trip
        </button>
      </header>

      <div className="panel table-panel">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Shipment Tracking</th>
                <th>Driver</th>
                <th>Vehicle</th>
                <th>Origin ➔ Destination</th>
                <th>Trip Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows cols={7} rows={4} />
              ) : trips.length > 0 ? (
                trips.map((t) => {
                  const shp = shipments.find((s) => s.id === t.shipment_id);
                  const drv = drivers.find((d) => d.id === t.driver_id);
                  const veh = vehicles.find((v) => v.id === t.vehicle_id);
                  return (
                    <tr key={t.id}>
                      <td>#{t.id}</td>
                      <td>
                        <code className="tracking-code">
                          {shp ? shp.tracking_number : `Shipment #${t.shipment_id}`}
                        </code>
                      </td>
                      <td>{drv ? drv.name : `Driver #${t.driver_id}`}</td>
                      <td>{veh ? veh.vehicle_number : `Vehicle #${t.vehicle_id}`}</td>
                      <td>
                        <span className="route-flow">
                          {t.pickup_location} ➔ {t.destination}
                        </span>
                      </td>
                      <td>
                        <Badge status={t.status} />
                      </td>
                      <td className="text-right action-cells">
                        <button
                          className="btn sm outline"
                          onClick={() => handleOpenEdit(t)}
                          type="button"
                        >
                          Edit
                        </button>
                        <button
                          className="btn sm danger"
                          onClick={() => handleDelete(t.id)}
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
                  <td colSpan={7}>
                    <EmptyState
                      actionText="Dispatch Trip"
                      description="No trips created in PostgreSQL."
                      onAction={handleOpenCreate}
                      title="No Active Trips"
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
        title={editingItem ? "Edit Trip Details" : "Dispatch New Trip"}
      >
        <form className="form-grid" onSubmit={handleSubmit}>
          <label className="col-span-2">
            <span>Target Shipment *</span>
            <select onChange={handleShipmentSelect} required value={formData.shipment_id}>
              <option value="">-- Select Shipment --</option>
              {shipments.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.tracking_number} — {s.customer_name} ({s.status})
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Assign Driver *</span>
            <select
              onChange={(e) => setFormData({ ...formData, driver_id: e.target.value })}
              required
              value={formData.driver_id}
            >
              <option value="">-- Select Driver --</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.status})
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Assign Vehicle *</span>
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
            <span>Pickup Location *</span>
            <input
              onChange={(e) => setFormData({ ...formData, pickup_location: e.target.value })}
              placeholder="e.g. Origin Port"
              required
              type="text"
              value={formData.pickup_location}
            />
          </label>

          <label>
            <span>Destination *</span>
            <input
              onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
              placeholder="e.g. Regional Hub"
              required
              type="text"
              value={formData.destination}
            />
          </label>

          <label className="col-span-2">
            <span>Trip Status *</span>
            <select
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              value={formData.status}
            >
              <option value="Scheduled">Scheduled</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </label>

          <div className="form-actions col-span-2">
            <button className="btn outline" onClick={() => setIsModalOpen(false)} type="button">
              Cancel
            </button>
            <button className="btn primary" type="submit">
              {editingItem ? "Update Trip" : "Dispatch Trip"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
