import { useEffect, useState } from "react";

import {
  createMaintenance,
  updateMaintenance,
} from "../services/maintenanceService";

function MaintenanceModal({
  onClose,
  onSaved,
  vehicles,
  maintenanceToEdit,
}) {
  const [formData, setFormData] = useState({
    vehicle_id: "",
    maintenance_category: "",
    service_date: "",
    next_service_date: "",
    service_cost: "",
    service_provider: "",
    maintenance_status: "Pending",
    notes: "",
  });

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const categories = [
    "Oil Change",
    "Tyre Replacement",
    "Brake Service",
    "Engine Service",
    "General Inspection",
  ];

  const statuses = [
    "Pending",
    "In Progress",
    "Completed",
  ];

  useEffect(() => {
    if (maintenanceToEdit) {
      setFormData({
        vehicle_id: maintenanceToEdit.vehicle_id || "",
        maintenance_category:
          maintenanceToEdit.maintenance_category || "",

        service_date: maintenanceToEdit.service_date
          ? maintenanceToEdit.service_date.slice(0, 10)
          : "",

        next_service_date:
          maintenanceToEdit.next_service_date
            ? maintenanceToEdit.next_service_date.slice(0, 10)
            : "",

        service_cost:
          maintenanceToEdit.service_cost ?? "",

        service_provider:
          maintenanceToEdit.service_provider || "",

        maintenance_status:
          maintenanceToEdit.maintenance_status || "Pending",

        notes:
          maintenanceToEdit.notes || "",
      });
    }
  }, [maintenanceToEdit]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    if (error) {
      setError("");
    }
  };

  const handleSubmit = async () => {

    if (!formData.vehicle_id) {
      setError("Please select a vehicle.");
      return;
    }

    if (!formData.maintenance_category) {
      setError("Please select a maintenance category.");
      return;
    }

    if (!formData.service_date) {
      setError("Please select the service date.");
      return;
    }

    if (!formData.next_service_date) {
      setError("Please select the next service date.");
      return;
    }

    if (
      formData.next_service_date <
      formData.service_date
    ) {
      setError(
        "Next service date cannot be before the service date."
      );
      return;
    }

    if (
      formData.service_cost === "" ||
      Number(formData.service_cost) < 0
    ) {
      setError("Please enter a valid service cost.");
      return;
    }

    if (!formData.service_provider.trim()) {
      setError("Please enter the service provider.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const data = {
        ...formData,
        vehicle_id: Number(formData.vehicle_id),
        service_cost: Number(formData.service_cost),
      };

      if (maintenanceToEdit) {
        await updateMaintenance(
          maintenanceToEdit.id,
          data
        );
      } else {
        await createMaintenance(data);
      }

      onSaved();

    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Failed to save maintenance record."
      );

    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">

      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

        {/* HEADER */}
        <div className="px-7 py-5 border-b border-slate-800">

          <h2 className="text-xl font-semibold text-white">
            {maintenanceToEdit
              ? "Edit Maintenance Record"
              : "Add Maintenance Record"}
          </h2>

          <p className="text-xs text-slate-500 mt-1">
            Enter vehicle servicing and maintenance details.
          </p>

        </div>

        {/* FORM */}
        <div className="p-7">

          {error && (
            <div className="mb-5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* VEHICLE */}
            <div>

              <label className="block text-xs font-medium text-slate-400 mb-2">
                Vehicle
              </label>

              <select
                name="vehicle_id"
                value={formData.vehicle_id}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500"
              >

                <option value="">
                  Select Vehicle
                </option>

                {vehicles.map((vehicle) => (
                  <option
                    key={vehicle.id}
                    value={vehicle.id}
                  >
                    {vehicle.vehicle_number} — ID {vehicle.id}
                  </option>
                ))}

              </select>

            </div>

            {/* CATEGORY */}
            <div>

              <label className="block text-xs font-medium text-slate-400 mb-2">
                Maintenance Category
              </label>

              <select
                name="maintenance_category"
                value={formData.maintenance_category}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500"
              >

                <option value="">
                  Select Category
                </option>

                {categories.map((category) => (
                  <option
                    key={category}
                    value={category}
                  >
                    {category}
                  </option>
                ))}

              </select>

            </div>

            {/* SERVICE DATE */}
            <div>

              <label className="block text-xs font-medium text-slate-400 mb-2">
                Service Date
              </label>

              <input
                type="date"
                name="service_date"
                value={formData.service_date}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500"
              />

            </div>

            {/* NEXT SERVICE DATE */}
            <div>

              <label className="block text-xs font-medium text-slate-400 mb-2">
                Next Service Date
              </label>

              <input
                type="date"
                name="next_service_date"
                value={formData.next_service_date}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500"
              />

            </div>

            {/* COST */}
            <div>

              <label className="block text-xs font-medium text-slate-400 mb-2">
                Service Cost
              </label>

              <input
                type="number"
                name="service_cost"
                value={formData.service_cost}
                onChange={handleChange}
                placeholder="Enter service cost"
                min="0"
                className="w-full bg-slate-950 border border-slate-700 text-slate-200 placeholder-slate-600 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500"
              />

            </div>

            {/* PROVIDER */}
            <div>

              <label className="block text-xs font-medium text-slate-400 mb-2">
                Service Provider
              </label>

              <input
                type="text"
                name="service_provider"
                value={formData.service_provider}
                onChange={handleChange}
                placeholder="Enter service provider"
                className="w-full bg-slate-950 border border-slate-700 text-slate-200 placeholder-slate-600 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500"
              />

            </div>

            {/* STATUS */}
            <div>

              <label className="block text-xs font-medium text-slate-400 mb-2">
                Maintenance Status
              </label>

              <select
                name="maintenance_status"
                value={formData.maintenance_status}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500"
              >

                {statuses.map((status) => (
                  <option
                    key={status}
                    value={status}
                  >
                    {status}
                  </option>
                ))}

              </select>

            </div>

            {/* NOTES */}
            <div className="md:col-span-2">

              <label className="block text-xs font-medium text-slate-400 mb-2">
                Notes
              </label>

              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="4"
                placeholder="Add maintenance notes..."
                className="w-full bg-slate-950 border border-slate-700 text-slate-200 placeholder-slate-600 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500 resize-none"
              />

            </div>

          </div>

          {/* ACTIONS */}
          <div className="flex justify-end gap-3 mt-7 pt-5 border-t border-slate-800">

            <button
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-medium transition disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              onClick={handleSubmit}
              disabled={saving}
              className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : maintenanceToEdit
                ? "Update Maintenance"
                : "Save Maintenance"}
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}

export default MaintenanceModal;