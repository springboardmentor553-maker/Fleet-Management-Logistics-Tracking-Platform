import { useEffect, useState } from "react";
import {
  FaTimes,
  FaTruck,
} from "react-icons/fa";

import {
  addVehicle,
  updateVehicle,
} from "../services/vehicleService";

const emptyVehicle = {
  vehicle_number: "",
  vehicle_type: "",
  capacity: "",
  status: "available",
  fuel_type: "Diesel",
  model: "",
  manufacturer: "",
};

function AddVehicleModal({
  onClose,
  onSaved,
  vehicleToEdit,
}) {

  const [vehicle, setVehicle] =
    useState(emptyVehicle);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {

    if (vehicleToEdit) {

      setVehicle({
        ...emptyVehicle,
        ...vehicleToEdit,
      });

    } else {

      setVehicle(emptyVehicle);

    }

    setError("");

  }, [vehicleToEdit]);

  const handleChange = (e) => {

    setVehicle((current) => ({
      ...current,
      [e.target.name]: e.target.value,
    }));

  };

  const handleSubmit = async (e) => {

    e.preventDefault();

    setError("");

    // Validation
    if (!vehicle.vehicle_number.trim()) {
      setError(
        "Vehicle number is required."
      );
      return;
    }

    if (!vehicle.vehicle_type.trim()) {
      setError(
        "Vehicle type is required."
      );
      return;
    }

    if (
      !vehicle.capacity ||
      Number(vehicle.capacity) <= 0
    ) {
      setError(
        "Enter a valid vehicle capacity."
      );
      return;
    }

    if (
      !vehicle.model.trim() ||
      !vehicle.manufacturer.trim()
    ) {
      setError(
        "Model and manufacturer are required."
      );
      return;
    }

    const payload = {
      vehicle_number:
        vehicle.vehicle_number.trim(),

      vehicle_type:
        vehicle.vehicle_type.trim(),

      capacity:
        Number(vehicle.capacity),

      status:
        vehicle.status,

      fuel_type:
        vehicle.fuel_type,

      model:
        vehicle.model.trim(),

      manufacturer:
        vehicle.manufacturer.trim(),
    };

    try {

      setSaving(true);

      if (vehicleToEdit) {

        await updateVehicle(
          vehicleToEdit.id,
          payload
        );

      } else {

        await addVehicle(payload);

      }

      await onSaved();

    } catch (err) {

      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Unable to save vehicle. Please check the entered details."
      );

    } finally {

      setSaving(false);

    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"

      onMouseDown={(e) => {

        if (
          e.target === e.currentTarget &&
          !saving
        ) {
          onClose();
        }

      }}
    >

      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">

        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-5">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              <FaTruck />
            </div>

            <div>

              <h2 className="text-xl font-bold text-white">
                {vehicleToEdit
                  ? "Edit Vehicle"
                  : "Register Vehicle"}
              </h2>

              <p className="text-sm text-slate-500">
                {vehicleToEdit
                  ? "Update the vehicle information below."
                  : "Add a vehicle to the FleetFlow registry."}
              </p>

            </div>

          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-800 hover:text-white disabled:opacity-50"
          >
            <FaTimes />
          </button>

        </div>

        {/* FORM */}
        <form
          onSubmit={handleSubmit}
          className="p-6"
        >

          {error && (

            <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>

          )}

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

            <Field
              label="Vehicle Number"
              name="vehicle_number"
              value={vehicle.vehicle_number}
              onChange={handleChange}
              placeholder="e.g. KA01AB1234"
              required
            />

            <Field
              label="Vehicle Type"
              name="vehicle_type"
              value={vehicle.vehicle_type}
              onChange={handleChange}
              placeholder="e.g. Truck"
              required
            />

            <Field
              label="Capacity (kg)"
              name="capacity"
              type="number"
              min="1"
              value={vehicle.capacity}
              onChange={handleChange}
              placeholder="e.g. 5000"
              required
            />

            <SelectField
              label="Status"
              name="status"
              value={vehicle.status}
              onChange={handleChange}
              options={[
                "available",
                "on trip",
                "maintenance",
                "inactive",
              ]}
            />

            <SelectField
              label="Fuel Type"
              name="fuel_type"
              value={vehicle.fuel_type}
              onChange={handleChange}
              options={[
                "Diesel",
                "Petrol",
                "CNG",
                "Electric",
                "Hybrid",
              ]}
            />

            <Field
              label="Model"
              name="model"
              value={vehicle.model}
              onChange={handleChange}
              placeholder="e.g. BharatBenz 2823R"
              required
            />

            <div className="md:col-span-2">

              <Field
                label="Manufacturer"
                name="manufacturer"
                value={vehicle.manufacturer}
                onChange={handleChange}
                placeholder="e.g. Tata Motors"
                required
              />

            </div>

          </div>

          {/* BUTTONS */}
          <div className="mt-7 flex justify-end gap-3 border-t border-slate-800 pt-5">

            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? "Saving..."
                : vehicleToEdit
                ? "Update Vehicle"
                : "Register Vehicle"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}


/* -----------------------------
   INPUT COMPONENT
----------------------------- */

function Field({
  label,
  name,
  type = "text",
  ...props
}) {

  return (
    <label className="block">

      <span className="mb-2 block text-sm font-medium text-slate-300">
        {label}
      </span>

      <input
        type={type}
        name={name}
        {...props}
        className="w-full rounded-xl border border-slate-700 bg-slate-800/70 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
      />

    </label>
  );
}


/* -----------------------------
   SELECT COMPONENT
----------------------------- */

function SelectField({
  label,
  name,
  options,
  ...props
}) {

  return (
    <label className="block">

      <span className="mb-2 block text-sm font-medium text-slate-300">
        {label}
      </span>

      <select
        name={name}
        {...props}
        className="w-full rounded-xl border border-slate-700 bg-slate-800/70 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
      >

        {options.map((option) => (

          <option
            key={option}
            value={option}
          >
            {option.charAt(0).toUpperCase() +
              option.slice(1)}
          </option>

        ))}

      </select>

    </label>
  );
}

export default AddVehicleModal;