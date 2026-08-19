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

  /* ================= LOADING ================= */

  if (loading) {
    return (
      <Layout>

        <div className="flex justify-center items-center py-24">

          <div className="text-center">

            <div className="text-5xl mb-4">
              🚛
            </div>

            <p className="text-teal-300 text-lg font-semibold">
              Loading Vehicle...
            </p>

          </div>

        </div>

      </Layout>
    );
  }

  return (
    <Layout>

      {/* ================= HEADER ================= */}

      <div className="mb-8">

        <p className="text-teal-300 text-sm font-medium mb-2">
          FleetFlow • Vehicle Center
        </p>

        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-teal-300 via-cyan-300 to-teal-400 bg-clip-text text-transparent">
          Edit Vehicle
        </h1>

        <p className="text-teal-100/70 mt-2">
          Update vehicle information and fleet status
        </p>

      </div>


      {/* ================= FORM ================= */}

      <form
        onSubmit={updateVehicle}
        className="bg-[#062126]/80 backdrop-blur-xl border border-teal-900/60 rounded-2xl shadow-2xl p-8"
      >

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Vehicle Number */}

          <FormField
            label="Vehicle Number"
            name="vehicle_number"
            value={vehicle.vehicle_number}
            onChange={handleChange}
            placeholder="e.g. AP 01 AB 1234"
          />


          {/* Vehicle Type */}

          <FormField
            label="Vehicle Type"
            name="vehicle_type"
            value={vehicle.vehicle_type}
            onChange={handleChange}
            placeholder="e.g. Truck, Van, Container"
          />


          {/* Capacity */}

          <FormField
            label="Capacity"
            name="capacity"
            value={vehicle.capacity}
            onChange={handleChange}
            placeholder="Enter vehicle capacity"
          />


          {/* Fuel Type */}

          <FormField
            label="Fuel Type"
            name="fuel_type"
            value={vehicle.fuel_type}
            onChange={handleChange}
            placeholder="e.g. Diesel, Petrol"
          />


          {/* Fuel Level */}

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


          {/* Fuel Status */}

          <FormField
            label="Fuel Status"
            name="fuel_status"
            value={vehicle.fuel_status}
            onChange={handleChange}
            placeholder="e.g. Normal, Low, Critical"
          />


          {/* Vehicle Status */}

          <div>

            <label className="block text-sm font-medium text-teal-50/80 mb-2">
              Vehicle Status
            </label>

            <select
              name="status"
              value={vehicle.status}
              onChange={handleChange}
              className="w-full bg-[#03181b] border border-teal-900/60 text-teal-50 px-4 py-3 rounded-xl outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 transition"
            >

              <option
                value="Available"
                className="bg-[#062126]"
              >
                Available
              </option>

              <option
                value="Assigned"
                className="bg-[#062126]"
              >
                Assigned
              </option>

              <option
                value="Under Maintenance"
                className="bg-[#062126]"
              >
                Under Maintenance
              </option>

            </select>

          </div>

        </div>


        {/* ================= BUTTONS ================= */}

        <div className="flex justify-end gap-4 mt-8">

          {/* Cancel */}

          <button
            type="button"
            onClick={() => navigate("/vehicles")}
            className="px-6 py-3 rounded-xl border border-teal-900/60 text-teal-100/70 hover:bg-[#0a2b30] hover:text-teal-50 transition"
          >
            Cancel
          </button>


          {/* Update Vehicle */}

          <button
            type="submit"
            disabled={updating}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-teal-400 to-cyan-400 text-[#03181b] font-semibold hover:from-teal-300 hover:to-cyan-300 shadow-lg shadow-teal-900/30 transition disabled:opacity-50"
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

      <label className="block text-sm font-medium text-teal-50/80 mb-2">
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
        className="w-full bg-[#03181b] border border-teal-900/60 text-teal-50 placeholder-teal-200/40 px-4 py-3 rounded-xl outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 transition"
      />

    </div>
  );
}

export default EditVehicle;