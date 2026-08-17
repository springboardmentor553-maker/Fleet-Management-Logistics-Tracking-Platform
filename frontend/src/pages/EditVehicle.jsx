import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../services/api";

function EditVehicle() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [vehicle, setVehicle] = useState({
    vehicle_number: "",
    vehicle_type: "",
    capacity: "",
    fuel_type: "",
    fuel_level: "",
    fuel_status: "",
    status: "",
  });

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadVehicle();
  }, [id]);

  const loadVehicle = async () => {
    try {
      setLoading(true);

      const res = await api.get(`/vehicles/${id}`);

      setVehicle({
        vehicle_number: res.data.vehicle_number || "",
        vehicle_type: res.data.vehicle_type || "",
        capacity: res.data.capacity || "",
        fuel_type: res.data.fuel_type || "",
        fuel_level: res.data.fuel_level ?? "",
        fuel_status: res.data.fuel_status || "",
        status: res.data.status || "Available",
      });
    } catch (err) {
      console.log(err);

      window.alert(
        err.response?.data?.detail ||
          "Failed to Load Vehicle"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setVehicle({
      ...vehicle,
      [e.target.name]: e.target.value,
    });
  };

  const updateVehicle = async (e) => {
    e.preventDefault();

    try {
      setUpdating(true);

      await api.put(`/vehicles/${id}`, null, {
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

      window.alert("Vehicle Updated Successfully");

      navigate("/vehicles");
    } catch (err) {
      console.log(err);

      window.alert(
        err.response?.data?.detail ||
          "Update Failed"
      );
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center py-24">
          <div className="text-center">
            <div className="text-5xl mb-4">
              🚛
            </div>

            <p className="text-blue-400 text-lg font-semibold">
              Loading Vehicle...
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>

      {/* Header */}

      <div className="mb-8">

        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent">
          Edit Vehicle
        </h1>

        <p className="text-slate-400 mt-2">
          Update vehicle information and fleet status
        </p>

      </div>


      {/* Form */}

      <form
        onSubmit={updateVehicle}
        className="bg-slate-900/75 backdrop-blur-xl border border-slate-700/60 rounded-2xl shadow-2xl p-8"
      >

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <FormField
            label="Vehicle Number"
            name="vehicle_number"
            value={vehicle.vehicle_number}
            onChange={handleChange}
            placeholder="e.g. AP 01 AB 1234"
          />

          <FormField
            label="Vehicle Type"
            name="vehicle_type"
            value={vehicle.vehicle_type}
            onChange={handleChange}
            placeholder="e.g. Truck, Van, Container"
          />

          <FormField
            label="Capacity"
            name="capacity"
            value={vehicle.capacity}
            onChange={handleChange}
            placeholder="Enter vehicle capacity"
          />

          <FormField
            label="Fuel Type"
            name="fuel_type"
            value={vehicle.fuel_type}
            onChange={handleChange}
            placeholder="e.g. Diesel, Petrol"
          />

          <FormField
            label="Fuel Level (%)"
            name="fuel_level"
            type="number"
            min="0"
            max="100"
            value={vehicle.fuel_level}
            onChange={handleChange}
            placeholder="0 - 100"
          />

          <FormField
            label="Fuel Status"
            name="fuel_status"
            value={vehicle.fuel_status}
            onChange={handleChange}
            placeholder="e.g. Normal, Low, Critical"
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
            disabled={updating}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold hover:from-green-500 hover:to-emerald-500 shadow-lg shadow-green-900/20 transition disabled:opacity-50"
          >
            {updating
              ? "Updating..."
              : "Update Vehicle"}
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
  value,
  onChange,
  placeholder,
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
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full bg-slate-950 border border-slate-700 text-white placeholder-slate-500 px-4 py-3 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
      />

    </div>
  );
}

export default EditVehicle;