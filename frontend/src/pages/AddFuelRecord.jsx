import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../services/api";

function AddFuelRecord() {
  const navigate = useNavigate();

  const [fuel, setFuel] = useState({
    vehicle_id: "",
    driver_id: "",
    fuel_quantity: "",
    fuel_cost: "",
    odometer_reading: "",
    fuel_date: "",
    fuel_station: "",
    remarks: "",
  });

  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    setFuel({
      ...fuel,
      [e.target.name]: e.target.value,
    });
  };

  const saveFuel = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);

      await api.post("/fuel-records", fuel);

      alert("Fuel Record Added Successfully");

      navigate("/fuel-records");
    } catch (err) {
      console.log(err);

      alert(
        err.response?.data?.detail ||
        "Failed to add fuel record"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>

      {/* ================= HEADER ================= */}

      <div className="mb-8">

        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-cyan-300 via-cyan-400 to-teal-300 bg-clip-text text-transparent">
          Add Fuel Record
        </h1>

        <p className="text-slate-400 mt-2">
          Record vehicle fuel consumption and operational cost
        </p>

      </div>


      {/* ================= FORM ================= */}

      <form
        onSubmit={saveFuel}
        className="bg-slate-900/75 backdrop-blur-xl border border-cyan-500/20 rounded-2xl shadow-2xl p-8"
      >

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* ================= VEHICLE ID ================= */}

          <FormField
            label="Vehicle ID"
            name="vehicle_id"
            type="number"
            placeholder="Enter vehicle ID"
            value={fuel.vehicle_id}
            onChange={handleChange}
            required
          />


          {/* ================= DRIVER ID ================= */}

          <FormField
            label="Driver ID"
            name="driver_id"
            type="number"
            placeholder="Enter driver ID"
            value={fuel.driver_id}
            onChange={handleChange}
            required
          />


          {/* ================= FUEL QUANTITY ================= */}

          <FormField
            label="Fuel Quantity (Litres)"
            name="fuel_quantity"
            type="number"
            step="0.01"
            min="0"
            placeholder="Enter fuel quantity"
            value={fuel.fuel_quantity}
            onChange={handleChange}
            required
          />


          {/* ================= FUEL COST ================= */}

          <FormField
            label="Fuel Cost (₹)"
            name="fuel_cost"
            type="number"
            step="0.01"
            min="0"
            placeholder="Enter fuel cost"
            value={fuel.fuel_cost}
            onChange={handleChange}
            required
          />


          {/* ================= ODOMETER ================= */}

          <FormField
            label="Odometer Reading"
            name="odometer_reading"
            type="number"
            step="0.01"
            min="0"
            placeholder="Enter odometer reading"
            value={fuel.odometer_reading}
            onChange={handleChange}
            required
          />


          {/* ================= FUEL DATE ================= */}

          <div>

            <label className="block text-sm font-medium text-slate-300 mb-2">
              Fuel Date
            </label>

            <input
              type="date"
              name="fuel_date"
              value={fuel.fuel_date}
              onChange={handleChange}
              required
              className="w-full bg-slate-950 border border-slate-700 text-white px-4 py-3 rounded-xl outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition"
            />

          </div>


          {/* ================= FUEL STATION ================= */}

          <FormField
            label="Fuel Station"
            name="fuel_station"
            type="text"
            placeholder="Enter fuel station"
            value={fuel.fuel_station}
            onChange={handleChange}
            required
          />


          {/* ================= REMARKS ================= */}

          <div className="md:col-span-2">

            <label className="block text-sm font-medium text-slate-300 mb-2">
              Remarks
            </label>

            <textarea
              name="remarks"
              placeholder="Enter remarks"
              value={fuel.remarks}
              onChange={handleChange}
              rows="4"
              className="w-full bg-slate-950 border border-slate-700 text-white placeholder-slate-500 px-4 py-3 rounded-xl outline-none resize-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition"
            />

          </div>

        </div>


        {/* ================= BUTTONS ================= */}

        <div className="flex justify-end gap-4 mt-8">

          {/* CANCEL */}

          <button
            type="button"
            onClick={() =>
              navigate("/fuel-records")
            }
            disabled={saving}
            className="px-6 py-3 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white transition disabled:opacity-50"
          >
            Cancel
          </button>


          {/* SAVE */}

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-semibold hover:from-cyan-400 hover:to-teal-400 shadow-lg shadow-cyan-900/30 transition disabled:opacity-50"
          >
            {saving
              ? "Saving..."
              : "Save Fuel Record"}
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
  step,
  min,
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
        step={step}
        min={min}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full bg-slate-950 border border-slate-700 text-white placeholder-slate-500 px-4 py-3 rounded-xl outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition"
      />

    </div>
  );
}

export default AddFuelRecord;