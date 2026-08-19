import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../services/api";

function AddDriverPerformance() {
  const navigate = useNavigate();

  const [performance, setPerformance] = useState({
    driver_id: "",
    total_trips: "",
    completed_trips: "",
    performance_rating: "",
    remarks: "",
  });

  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    setPerformance({
      ...performance,
      [e.target.name]: e.target.value,
    });
  };

  const savePerformance = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);

      await api.post("/driver-performance", performance);

      alert("Performance Saved Successfully");

      navigate("/driver-performance");
    } catch (err) {
      console.log(err);

      alert(
        err.response?.data?.detail ||
        "Failed to save performance"
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
          Add Driver Performance
        </h1>

        <p className="text-slate-400 mt-2">
          Record driver performance and trip statistics
        </p>

      </div>


      {/* Form */}

      <form
        onSubmit={savePerformance}
        className="bg-slate-900/75 backdrop-blur-xl border border-slate-700/60 rounded-2xl shadow-2xl p-8"
      >

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Driver ID */}

          <FormField
            label="Driver ID"
            name="driver_id"
            type="number"
            placeholder="Enter driver ID"
            value={performance.driver_id}
            onChange={handleChange}
            required
          />


          {/* Total Trips */}

          <FormField
            label="Total Trips"
            name="total_trips"
            type="number"
            placeholder="Enter total trips"
            value={performance.total_trips}
            onChange={handleChange}
            required
          />


          {/* Completed Trips */}

          <FormField
            label="Completed Trips"
            name="completed_trips"
            type="number"
            placeholder="Enter completed trips"
            value={performance.completed_trips}
            onChange={handleChange}
            required
          />


          {/* Performance Rating */}

          <FormField
            label="Performance Rating"
            name="performance_rating"
            type="number"
            placeholder="Enter rating"
            value={performance.performance_rating}
            onChange={handleChange}
            required
          />


          {/* Remarks */}

          <div className="md:col-span-2">

            <label className="block text-sm font-medium text-slate-300 mb-2">
              Remarks
            </label>

            <textarea
              name="remarks"
              placeholder="Enter performance remarks"
              value={performance.remarks}
              onChange={handleChange}
              rows="4"
              className="w-full bg-slate-950 border border-slate-700 text-white placeholder-slate-500 px-4 py-3 rounded-xl outline-none resize-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
            />

          </div>

        </div>


        {/* Buttons */}

        <div className="flex justify-end gap-4 mt-8">

          <button
            type="button"
            onClick={() => navigate("/driver-performance")}
            className="px-6 py-3 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white transition"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-900/30 transition disabled:opacity-50"
          >
            {saving
              ? "Saving..."
              : "Save Performance"}
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
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full bg-slate-950 border border-slate-700 text-white placeholder-slate-500 px-4 py-3 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
      />

    </div>
  );
}

export default AddDriverPerformance;