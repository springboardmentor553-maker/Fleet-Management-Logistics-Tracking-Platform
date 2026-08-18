import React, { useEffect, useState } from "react";
import { driversApi, fuelApi, vehiclesApi } from "../api/fleetApi.js";
import { EmptyState } from "../components/common/EmptyState.jsx";
import { Modal } from "../components/common/Modal.jsx";
import { SkeletonRows } from "../components/common/Skeleton.jsx";

export function FuelPage({ showToast }) {
  const [records, setRecords] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const today = new Date().toISOString().split("T")[0];

  const [formData, setFormData] = useState({
    vehicle_id: "",
    driver_id: "",
    liters: "",
    cost_per_liter: "",
    total_cost: "",
    odometer_reading: "",
    log_date: today,
    fuel_station: "",
  });

  async function loadData() {
    setLoading(true);
    try {
      const [fList, vList, dList] = await Promise.all([
        fuelApi.getAll(),
        vehiclesApi.getAll(),
        driversApi.getAll(),
      ]);
      setRecords(fList);
      setVehicles(vList);
      setDrivers(dList);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function handleLitersOrCostChange(litersVal, costPerLiterVal, currentTotalCost) {
    let calculatedTotal = currentTotalCost;
    if (litersVal && costPerLiterVal) {
      calculatedTotal = (Number(litersVal) * Number(costPerLiterVal)).toFixed(2);
    }
    setFormData((prev) => ({
      ...prev,
      liters: litersVal,
      cost_per_liter: costPerLiterVal,
      total_cost: calculatedTotal,
    }));
  }

  function handleOpenCreate() {
    setEditingItem(null);
    setFormData({
      vehicle_id: vehicles.length > 0 ? String(vehicles[0].id) : "",
      driver_id: drivers.length > 0 ? String(drivers[0].id) : "",
      liters: "",
      cost_per_liter: "",
      total_cost: "",
      odometer_reading: "",
      log_date: today,
      fuel_station: "",
    });
    setIsModalOpen(true);
  }

  function handleOpenEdit(item) {
    setEditingItem(item);
    setFormData({
      vehicle_id: item.vehicle_id ? String(item.vehicle_id) : "",
      driver_id: item.driver_id ? String(item.driver_id) : "",
      liters: item.liters ?? "",
      cost_per_liter: item.cost_per_liter ?? "",
      total_cost: item.total_cost ?? "",
      odometer_reading: item.odometer_reading ?? "",
      log_date: item.log_date || today,
      fuel_station: item.fuel_station || "",
    });
    setIsModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.vehicle_id || !formData.liters || !formData.total_cost) {
      showToast("Vehicle, Liters, and Total Cost are required fields.", "error");
      return;
    }

    const payload = {
      vehicle_id: Number(formData.vehicle_id),
      driver_id: formData.driver_id ? Number(formData.driver_id) : null,
      liters: Number(formData.liters),
      cost_per_liter: formData.cost_per_liter ? Number(formData.cost_per_liter) : null,
      total_cost: Number(formData.total_cost),
      odometer_reading: formData.odometer_reading ? Number(formData.odometer_reading) : null,
      log_date: formData.log_date,
      fuel_station: formData.fuel_station || null,
    };

    try {
      if (editingItem) {
        await fuelApi.update(editingItem.id, payload);
        showToast("Fuel log updated!", "success");
      } else {
        await fuelApi.create(payload);
        showToast("Fuel transaction logged successfully!", "success");
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this fuel record?")) return;
    try {
      await fuelApi.delete(id);
      showToast("Fuel log deleted.", "success");
      loadData();
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <h1>Fuel & Refueling Logs</h1>
          <p className="subtitle">Track fuel consumption, cost per liter, and odometer readings</p>
        </div>
        <button className="btn primary" onClick={handleOpenCreate} type="button">
          + Add Fuel Log
        </button>
      </header>

      <div className="panel table-panel">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Vehicle</th>
                <th>Driver</th>
                <th>Liters</th>
                <th>Cost / Liter ($)</th>
                <th>Total Cost ($)</th>
                <th>Odometer (km)</th>
                <th>Log Date</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows cols={9} rows={4} />
              ) : records.length > 0 ? (
                records.map((r) => {
                  const veh = vehicles.find((v) => v.id === r.vehicle_id);
                  const drv = drivers.find((d) => d.id === r.driver_id);
                  return (
                    <tr key={r.id}>
                      <td>#{r.id}</td>
                      <td>
                        <strong>{veh ? `${veh.vehicle_number}` : `Vehicle #${r.vehicle_id}`}</strong>
                      </td>
                      <td>{drv ? drv.name : "N/A"}</td>
                      <td>⛽ {r.liters} L</td>
                      <td>{r.cost_per_liter ? `$${r.cost_per_liter}` : "N/A"}</td>
                      <td>
                        <strong>${r.total_cost?.toLocaleString()}</strong>
                      </td>
                      <td>{r.odometer_reading ? `${r.odometer_reading.toLocaleString()} km` : "N/A"}</td>
                      <td>{r.log_date}</td>
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
                      actionText="Add Fuel Log"
                      description="No fuel transactions in PostgreSQL."
                      onAction={handleOpenCreate}
                      title="No Fuel Logs"
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
        title={editingItem ? "Edit Fuel Log" : "Log Refueling Transaction"}
      >
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            <span>Vehicle *</span>
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
            <span>Driver</span>
            <select
              onChange={(e) => setFormData({ ...formData, driver_id: e.target.value })}
              value={formData.driver_id}
            >
              <option value="">-- Unassigned --</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Fuel Volume (Liters) *</span>
            <input
              onChange={(e) =>
                handleLitersOrCostChange(e.target.value, formData.cost_per_liter, formData.total_cost)
              }
              placeholder="e.g. 150"
              required
              step="0.1"
              type="number"
              value={formData.liters}
            />
          </label>

          <label>
            <span>Cost per Liter ($)</span>
            <input
              onChange={(e) =>
                handleLitersOrCostChange(formData.liters, e.target.value, formData.total_cost)
              }
              placeholder="e.g. 3.45"
              step="0.01"
              type="number"
              value={formData.cost_per_liter}
            />
          </label>

          <label>
            <span>Total Fuel Cost ($) *</span>
            <input
              onChange={(e) => setFormData({ ...formData, total_cost: e.target.value })}
              placeholder="e.g. 517.50"
              required
              step="0.01"
              type="number"
              value={formData.total_cost}
            />
          </label>

          <label>
            <span>Odometer Reading (km)</span>
            <input
              onChange={(e) => setFormData({ ...formData, odometer_reading: e.target.value })}
              placeholder="e.g. 45820"
              step="1"
              type="number"
              value={formData.odometer_reading}
            />
          </label>

          <label>
            <span>Transaction Date *</span>
            <input
              onChange={(e) => setFormData({ ...formData, log_date: e.target.value })}
              required
              type="date"
              value={formData.log_date}
            />
          </label>

          <label>
            <span>Station / Vendor</span>
            <input
              onChange={(e) => setFormData({ ...formData, fuel_station: e.target.value })}
              placeholder="e.g. Shell Plaza #42"
              type="text"
              value={formData.fuel_station}
            />
          </label>

          <div className="form-actions col-span-2">
            <button className="btn outline" onClick={() => setIsModalOpen(false)} type="button">
              Cancel
            </button>
            <button className="btn primary" type="submit">
              {editingItem ? "Update Fuel Log" : "Save Transaction"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
