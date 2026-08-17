import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../services/api";

function AddVehicle() {
  const navigate = useNavigate();

  const [vehicle, setVehicle] = useState({
    vehicle_number: "",
    vehicle_type: "",
    capacity: "",
    fuel_type: "",
    fuel_level: "",
    fuel_status: "",
    status: "Available",
  });

  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    setVehicle({
      ...vehicle,
      [e.target.name]: e.target.value,
    });
  };

  const saveVehicle = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);

      await api.post("/vehicles", null, {
        params: {
          vehicle_number: vehicle.vehicle_number,
          vehicle_type: vehicle.vehicle_type,
          capacity: vehicle.capacity,
          fuel_type: vehicle.fuel_type,
          fuel_level: vehicle.fuel_level,
          fuel_status: vehicle.fuel_status,
          status: vehicle.status,
        },
      });

      window.alert("Vehicle Added Successfully");

      navigate("/vehicles");
    } catch (err) {
      console.log(err);

      window.alert(
        err.response?.data?.detail ||
          "Failed to Add Vehicle"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>

      {/* Header */}

      <div className="mb-8">

        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent">
          Add Vehicle
        </h1>

        <p className="text-slate-400 mt-2">
          Register a new vehicle into the FleetFlow fleet
        </p>

      </div>


      {/* Form */}

      <form
        onSubmit={saveVehicle}
        className="bg-slate-900/75 backdrop-blur-xl border border-slate-700/60 rounded-2xl shadow-2xl p-8"
      >

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Vehicle Number */}

          <FormField
            label="Vehicle Number"
            name="vehicle_number"
            placeholder="e.g. AP 01 AB 1234"
            value={vehicle.vehicle_number}
            onChange={handleChange}
            required
          />


          {/* Vehicle Type */}

          <FormField
            label="Vehicle Type"
            name="vehicle_type"
            placeholder="e.g. Truck, Van, Container"
            value={vehicle.vehicle_type}
            onChange={handleChange}
            required
          />


          {/* Capacity */}

          <FormField
            label="Capacity"
            name="capacity"
            placeholder="Enter vehicle capacity"
            value={vehicle.capacity}
            onChange={handleChange}
            required
          />


          {/* Fuel Type */}

          <FormField
            label="Fuel Type"
            name="fuel_type"
            placeholder="e.g. Diesel, Petrol"
            value={vehicle.fuel_type}
            onChange={handleChange}
            required
          />


          {/* Fuel Level */}

          <FormField
            label="Fuel Level (%)"
            name="fuel_level"
            type="number"
            min="0"
            max="100"
            placeholder="0 - 100"
            value={vehicle.fuel_level}
            onChange={handleChange}
            required
          />


          {/* Fuel Status */}

          <FormField
            label="Fuel Status"
            name="fuel_status"
            placeholder="e.g. Normal, Low, Critical"
            value={vehicle.fuel_status}
            onChange={handleChange}
            required
          />


          {/* Vehicle Status */}

          <div>

            <label className="block text-sm font-medium text-slate-300 mb-2">
              Vehicle Status
            </label>

            <select
              name="status"
              value={vehicle.status}
              onChange={handleChange}
              className="w-full bg-slate-950 border border-slate-700 text-white px-4 py-3 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
            >
              <option value="Available">
                Available
              </option>

              <option value="Assigned">
                Assigned
              </option>

              <option value="Under Maintenance">
                Under Maintenance
              </option>
            </select>

          </div>

        </div>


        {/* Buttons */}

        <div className="flex justify-end gap-4 mt-8">

          <button
            type="button"
            onClick={() => navigate("/vehicles")}
            className="px-6 py-3 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white transition"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-900/30 transition disabled:opacity-50"
          >
            {saving ? "Adding..." : "Add Vehicle"}
          </button>

        </div>

      </form>

    </Layout>
  );
}


/* ================= FORM FIELD ================= */

function FormField({
  label,
  name,
  type = "text",
  min,
  max,
  placeholder,
  value,
  onChange,
  required = false,
}) {
  return (
    <div>

      <label className="block text-sm font-medium text-slate-300 mb-2">
        {label}
      </label>

      <input
        type={type}
        name={name}
        min={min}
        max={max}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full bg-slate-950 border border-slate-700 text-white placeholder-slate-500 px-4 py-3 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
      />

    </div>
  );
}

export default AddVehicle;