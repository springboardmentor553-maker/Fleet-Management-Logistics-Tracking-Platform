import { useEffect, useState } from "react";
import {
  FaGasPump,
  FaPlus,
  FaEdit,
  FaTrash,
  FaTimes,
  FaSearch,
} from "react-icons/fa";

import {
  getFuelRecords,
  createFuelRecord,
  updateFuelRecord,
  deleteFuelRecord,
} from "../services/fuelService";

import { getVehicles } from "../services/vehicleService";
import { getDrivers } from "../services/driverService";

function Fuel() {
  const [fuelRecords, setFuelRecords] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [fuelToEdit, setFuelToEdit] = useState(null);
  const [saving, setSaving] = useState(false);

  const [vehicleSearch, setVehicleSearch] = useState("");

  const [formData, setFormData] = useState({
    vehicle_id: "",
    driver_id: "",
    fuel_quantity: "",
    fuel_cost: "",
    odometer_reading: "",
    fuel_date: new Date().toISOString().slice(0, 10),
    fuel_station: "",
    remarks: "",
  });

  // ==========================================
  // LOAD DATA
  // ==========================================

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        fuelData,
        vehicleData,
        driverData,
      ] = await Promise.all([
        getFuelRecords(),
        getVehicles(),
        getDrivers(),
      ]);

      setFuelRecords(fuelData || []);
      setVehicles(vehicleData || []);
      setDrivers(driverData || []);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Failed to load fuel records."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ==========================================
  // FORM HANDLERS
  // ==========================================

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    setError("");
    setSuccess("");
  };

  const openAddModal = () => {
    setFuelToEdit(null);

    setFormData({
      vehicle_id: "",
      driver_id: "",
      fuel_quantity: "",
      fuel_cost: "",
      odometer_reading: "",
      fuel_date: new Date().toISOString().slice(0, 10),
      fuel_station: "",
      remarks: "",
    });

    setError("");
    setSuccess("");
    setShowModal(true);
  };

  const openEditModal = (record) => {
    setFuelToEdit(record);

    setFormData({
      vehicle_id: record.vehicle_id || "",
      driver_id: record.driver_id || "",
      fuel_quantity: record.fuel_quantity || "",
      fuel_cost: record.fuel_cost || "",
      odometer_reading: record.odometer_reading || "",
      fuel_date: record.fuel_date
        ? record.fuel_date.slice(0, 10)
        : "",
      fuel_station: record.fuel_station || "",
      remarks: record.remarks || "",
    });

    setError("");
    setSuccess("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setFuelToEdit(null);
    setSaving(false);
    setError("");
  };

  // ==========================================
  // SAVE FUEL RECORD
  // ==========================================

  const handleSubmit = async () => {
    if (!formData.vehicle_id) {
      setError("Please select a vehicle.");
      return;
    }

    if (!formData.driver_id) {
      setError("Please select a driver.");
      return;
    }

    if (
      !formData.fuel_quantity ||
      Number(formData.fuel_quantity) <= 0
    ) {
      setError("Fuel quantity must be greater than zero.");
      return;
    }

    if (
      !formData.fuel_cost ||
      Number(formData.fuel_cost) <= 0
    ) {
      setError("Fuel cost must be greater than zero.");
      return;
    }

    if (!formData.odometer_reading) {
      setError("Please enter the odometer reading.");
      return;
    }

    if (!formData.fuel_date) {
      setError("Please select the fuel date.");
      return;
    }

    if (!formData.fuel_station.trim()) {
      setError("Please enter the fuel station.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const data = {
        vehicle_id: Number(formData.vehicle_id),
        driver_id: Number(formData.driver_id),
        fuel_quantity: Number(formData.fuel_quantity),
        fuel_cost: Number(formData.fuel_cost),
        odometer_reading: Number(
          formData.odometer_reading
        ),
        fuel_date: formData.fuel_date,
        fuel_station: formData.fuel_station.trim(),
        remarks: formData.remarks.trim() || null,
      };

      if (fuelToEdit) {
        await updateFuelRecord(
          fuelToEdit.id,
          data
        );

        setSuccess(
          "Fuel record updated successfully."
        );
      } else {
        await createFuelRecord(data);

        setSuccess(
          "Fuel record added successfully."
        );
      }

      await loadData();

      setTimeout(() => {
        closeModal();
        setSuccess("");
      }, 700);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Failed to save fuel record."
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // DELETE
  // ==========================================

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this fuel record?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      await deleteFuelRecord(id);

      setSuccess(
        "Fuel record deleted successfully."
      );

      await loadData();

      setTimeout(() => {
        setSuccess("");
      }, 2000);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Failed to delete fuel record."
      );
    }
  };

  // ==========================================
  // HELPERS
  // ==========================================

  const getVehicleNumber = (vehicleId) => {
    const vehicle = vehicles.find(
      (item) => item.id === vehicleId
    );

    return vehicle
      ? vehicle.vehicle_number
      : `Vehicle #${vehicleId}`;
  };

  const getDriverName = (driverId) => {
    const driver = drivers.find(
      (item) => item.id === driverId
    );

    if (!driver) {
      return `Driver #${driverId}`;
    }

    return (
      driver.name ||
      driver.full_name ||
      driver.driver_name ||
      `Driver #${driverId}`
    );
  };

  const formatDate = (date) => {
    if (!date) {
      return "-";
    }

    return new Date(date).toLocaleDateString();
  };

  // ==========================================
  // SUMMARY
  // ==========================================

  const totalRecords = fuelRecords.length;

  const totalFuel = fuelRecords.reduce(
    (sum, record) =>
      sum + Number(record.fuel_quantity || 0),
    0
  );

  const totalCost = fuelRecords.reduce(
    (sum, record) =>
      sum + Number(record.fuel_cost || 0),
    0
  );

  const averageCost =
    totalRecords > 0
      ? totalCost / totalRecords
      : 0;

  // ==========================================
  // VEHICLE SEARCH
  // ==========================================

  const filteredFuelRecords = fuelRecords.filter(
    (record) => {
      const query = vehicleSearch
        .trim()
        .toLowerCase();

      if (!query) {
        return true;
      }

      const vehicleNumber = getVehicleNumber(
        record.vehicle_id
      ).toLowerCase();

      const vehicleId = String(
        record.vehicle_id
      ).toLowerCase();

      return (
        vehicleNumber.includes(query) ||
        vehicleId.includes(query)
      );
    }
  );

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-xl font-semibold">
          Loading fuel records...
        </div>
      </div>
    );
  }

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">

      {/* HEADER */}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">

        <div>
          <h1 className="text-3xl font-bold text-white">
            Fuel Monitoring
          </h1>

          <p className="text-slate-400 mt-2">
            Track fuel consumption, costs and vehicle
            refuelling activity.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl transition"
        >
          <FaPlus />
          Add Fuel Record
        </button>

      </div>

      {/* ERROR */}

      {error && !showModal && (
        <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-4">
          {error}
        </div>
      )}

      {/* SUCCESS */}

      {success && !showModal && (
        <div className="mb-6 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl p-4">
          {success}
        </div>
      )}

      {/* SUMMARY */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-slate-400">
                Total Records
              </p>

              <p className="text-3xl font-bold text-white mt-2">
                {totalRecords}
              </p>
            </div>

            <div className="w-11 h-11 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <FaGasPump />
            </div>

          </div>

        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">

          <p className="text-sm text-slate-400">
            Fuel Consumed
          </p>

          <p className="text-3xl font-bold text-white mt-2">
            {totalFuel.toFixed(2)} L
          </p>

        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">

          <p className="text-sm text-slate-400">
            Total Fuel Cost
          </p>

          <p className="text-3xl font-bold text-white mt-2">
            ₹{totalCost.toFixed(2)}
          </p>

          <p className="text-xs text-slate-500 mt-1">
            Avg. ₹{averageCost.toFixed(2)} per record
          </p>

        </div>

      </div>

      {/* SEARCH VEHICLE */}

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6">

        <div className="flex flex-col md:flex-row md:items-center gap-3">

          <div className="flex-1 relative">

            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />

            <input
              type="text"
              value={vehicleSearch}
              onChange={(e) =>
                setVehicleSearch(e.target.value)
              }
              placeholder="Search vehicle number or vehicle ID..."
              className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg pl-11 pr-4 py-3 text-sm outline-none focus:border-blue-500"
            />

          </div>

          <button
            type="button"
            onClick={() => setVehicleSearch("")}
            className="px-5 py-3 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm"
          >
            Clear
          </button>

        </div>

        <p className="text-xs text-slate-500 mt-3">
          Showing {filteredFuelRecords.length} of{" "}
          {fuelRecords.length} fuel records
        </p>

      </div>

      {/* TABLE */}

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">

        <div className="px-6 py-5 border-b border-slate-800">

          <h2 className="text-lg font-semibold text-white">
            Fuel Records
          </h2>

          <p className="text-sm text-slate-500 mt-1">
            Fuel purchases and vehicle fuel history
          </p>

        </div>

        <div className="overflow-x-auto">

          <table className="w-full">

            <thead className="bg-slate-950">

              <tr>

                <th className="text-left px-6 py-4 text-xs uppercase tracking-wide text-slate-500">
                  ID
                </th>

                <th className="text-left px-6 py-4 text-xs uppercase tracking-wide text-slate-500">
                  Vehicle
                </th>

                <th className="text-left px-6 py-4 text-xs uppercase tracking-wide text-slate-500">
                  Driver
                </th>

                <th className="text-left px-6 py-4 text-xs uppercase tracking-wide text-slate-500">
                  Quantity
                </th>

                <th className="text-left px-6 py-4 text-xs uppercase tracking-wide text-slate-500">
                  Cost
                </th>

                <th className="text-left px-6 py-4 text-xs uppercase tracking-wide text-slate-500">
                  Odometer
                </th>

                <th className="text-left px-6 py-4 text-xs uppercase tracking-wide text-slate-500">
                  Date
                </th>

                <th className="text-left px-6 py-4 text-xs uppercase tracking-wide text-slate-500">
                  Station
                </th>

                <th className="text-left px-6 py-4 text-xs uppercase tracking-wide text-slate-500">
                  Action
                </th>

              </tr>

            </thead>

            <tbody>

              {filteredFuelRecords.map((record) => (

                <tr
                  key={record.id}
                  className="border-t border-slate-800 hover:bg-slate-800/40"
                >

                  <td className="px-6 py-4 text-sm text-slate-300">
                    #{record.id}
                  </td>

                  <td className="px-6 py-4">

                    <div className="text-sm text-white font-medium">
                      {getVehicleNumber(record.vehicle_id)}
                    </div>

                    <div className="text-xs text-slate-500 mt-1">
                      Vehicle ID: {record.vehicle_id}
                    </div>

                  </td>

                  <td className="px-6 py-4 text-sm text-slate-300">
                    {getDriverName(record.driver_id)}
                  </td>

                  <td className="px-6 py-4 text-sm text-slate-300">
                    {Number(
                      record.fuel_quantity
                    ).toFixed(2)}{" "}
                    L
                  </td>

                  <td className="px-6 py-4 text-sm text-slate-300">
                    ₹
                    {Number(
                      record.fuel_cost
                    ).toFixed(2)}
                  </td>

                  <td className="px-6 py-4 text-sm text-slate-300">
                    {Number(
                      record.odometer_reading
                    ).toLocaleString()}{" "}
                    km
                  </td>

                  <td className="px-6 py-4 text-sm text-slate-300">
                    {formatDate(record.fuel_date)}
                  </td>

                  <td className="px-6 py-4 text-sm text-slate-300">
                    {record.fuel_station}
                  </td>

                  <td className="px-6 py-4">

                    <div className="flex items-center gap-4">

                      <button
                        onClick={() =>
                          openEditModal(record)
                        }
                        className="flex items-center gap-2 text-blue-400 hover:text-blue-300"
                      >
                        <FaEdit />
                        Edit
                      </button>

                      <button
                        onClick={() =>
                          handleDelete(record.id)
                        }
                        className="flex items-center gap-2 text-red-400 hover:text-red-300"
                      >
                        <FaTrash />
                        Delete
                      </button>

                    </div>

                  </td>

                </tr>

              ))}

              {filteredFuelRecords.length === 0 && (

                <tr>

                  <td
                    colSpan="9"
                    className="text-center py-12 text-slate-500"
                  >
                    {vehicleSearch
                      ? "No fuel records found for this vehicle."
                      : "No fuel records found."}
                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

      </div>

      {/* ADD / EDIT MODAL */}

      {showModal && (

        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">

          <div className="w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto">

            {/* MODAL HEADER */}

            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">

              <div>

                <h2 className="text-xl font-semibold text-white">
                  {fuelToEdit
                    ? "Update Fuel Record"
                    : "Add Fuel Record"}
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  {fuelToEdit
                    ? "Update fuel transaction details."
                    : "Enter the fuel transaction details."}
                </p>

              </div>

              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-white"
              >
                <FaTimes size={20} />
              </button>

            </div>

            {/* MODAL BODY */}

            <div className="p-6">

              {error && (

                <div className="mb-5 p-3 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 text-sm">
                  {error}
                </div>

              )}

              {success && (

                <div className="mb-5 p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-sm">
                  {success}
                </div>

              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                {/* VEHICLE */}

                <div>

                  <label className="block text-sm text-slate-300 mb-2">
                    Vehicle
                  </label>

                  <select
                    name="vehicle_id"
                    value={formData.vehicle_id}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-3 focus:outline-none focus:border-blue-500"
                  >

                    <option value="">
                      Select Vehicle
                    </option>

                    {vehicles.map((vehicle) => (

                      <option
                        key={vehicle.id}
                        value={vehicle.id}
                      >
                        {vehicle.vehicle_number} — ID{" "}
                        {vehicle.id}
                      </option>

                    ))}

                  </select>

                </div>

                {/* DRIVER */}

                <div>

                  <label className="block text-sm text-slate-300 mb-2">
                    Driver
                  </label>

                  <select
                    name="driver_id"
                    value={formData.driver_id}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-3 focus:outline-none focus:border-blue-500"
                  >

                    <option value="">
                      Select Driver
                    </option>

                    {drivers.map((driver) => (

                      <option
                        key={driver.id}
                        value={driver.id}
                      >
                        {getDriverName(driver.id)} — ID{" "}
                        {driver.id}
                      </option>

                    ))}

                  </select>

                </div>

                {/* FUEL QUANTITY */}

                <div>

                  <label className="block text-sm text-slate-300 mb-2">
                    Fuel Quantity (Liters)
                  </label>

                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    name="fuel_quantity"
                    value={formData.fuel_quantity}
                    onChange={handleChange}
                    placeholder="Enter quantity"
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-3 focus:outline-none focus:border-blue-500"
                  />

                </div>

                {/* FUEL COST */}

                <div>

                  <label className="block text-sm text-slate-300 mb-2">
                    Fuel Cost
                  </label>

                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    name="fuel_cost"
                    value={formData.fuel_cost}
                    onChange={handleChange}
                    placeholder="Enter fuel cost"
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-3 focus:outline-none focus:border-blue-500"
                  />

                </div>

                {/* ODOMETER */}

                <div>

                  <label className="block text-sm text-slate-300 mb-2">
                    Odometer Reading
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    name="odometer_reading"
                    value={formData.odometer_reading}
                    onChange={handleChange}
                    placeholder="Enter odometer reading"
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-3 focus:outline-none focus:border-blue-500"
                  />

                </div>

                {/* FUEL DATE */}

                <div>

                  <label className="block text-sm text-slate-300 mb-2">
                    Fuel Date
                  </label>

                  <input
                    type="date"
                    name="fuel_date"
                    value={formData.fuel_date}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-3 focus:outline-none focus:border-blue-500"
                  />

                </div>

                {/* FUEL STATION */}

                <div className="md:col-span-2">

                  <label className="block text-sm text-slate-300 mb-2">
                    Fuel Station
                  </label>

                  <input
                    type="text"
                    name="fuel_station"
                    value={formData.fuel_station}
                    onChange={handleChange}
                    placeholder="Enter fuel station"
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-3 focus:outline-none focus:border-blue-500"
                  />

                </div>

                {/* REMARKS */}

                <div className="md:col-span-2">

                  <label className="block text-sm text-slate-300 mb-2">
                    Remarks
                  </label>

                  <textarea
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Optional remarks"
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-3 focus:outline-none focus:border-blue-500 resize-none"
                  />

                </div>

              </div>

              {/* BUTTONS */}

              <div className="flex justify-end gap-3 mt-7">

                <button
                  onClick={closeModal}
                  disabled={saving}
                  className="px-5 py-2.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="px-5 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : fuelToEdit
                    ? "Update Fuel Record"
                    : "Save Fuel Record"}
                </button>

              </div>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default Fuel;