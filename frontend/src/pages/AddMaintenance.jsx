import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../services/api";

function AddMaintenance() {
  const navigate = useNavigate();

  const [maintenance, setMaintenance] = useState({
    vehicle_id: "",
    maintenance_category: "",
    service_date: "",
    next_service_date: "",
    service_cost: "",
    service_provider: "",
    maintenance_status: "Pending",
    notes: "",
  });

  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    setMaintenance({
      ...maintenance,
      [e.target.name]: e.target.value,
    });
  };

  const saveMaintenance = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);

      await api.post("/maintenance", maintenance);

      alert("Maintenance Record Added Successfully");

      navigate("/maintenance");
    } catch (err) {
      console.log(err);

      alert(
        err.response?.data?.detail ||
          "Failed to add maintenance record"
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
          Add Maintenance
        </h1>

        <p className="text-slate-400 mt-2">
          Schedule and record vehicle maintenance services
        </p>

      </div>


      {/* Form */}

      <form
        onSubmit={saveMaintenance}
        className="bg-slate-900/75 backdrop-blur-xl border border-slate-700/60 rounded-2xl shadow-2xl p-8"
      >

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Vehicle ID */}

          <FormField
            label="Vehicle ID"
            name="vehicle_id"
            type="number"
            placeholder="Enter vehicle ID"
            value={maintenance.vehicle_id}
            onChange={handleChange}
            required
          />


          {/* Maintenance Category */}

          <FormField
            label="Maintenance Category"
            name="maintenance_category"
            type="text"
            placeholder="e.g. Engine, Brake, Tyre"
            value={maintenance.maintenance_category}
            onChange={handleChange}
            required
          />


          {/* Service Date */}

          <div>

            <label className="block text-sm font-medium text-slate-300 mb-2">
              Service Date
            </label>

            <input
              type="datetime-local"
              name="service_date"
              value={maintenance.service_date}
              onChange={handleChange}
              required
              className="w-full bg-slate-950 border border-slate-700 text-white px-4 py-3 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
            />

          </div>


          {/* Next Service Date */}

          <div>

            <label className="block text-sm font-medium text-slate-300 mb-2">
              Next Service Date
            </label>

            <input
              type="datetime-local"
              name="next_service_date"
              value={maintenance.next_service_date}
              onChange={handleChange}
              required
              className="w-full bg-slate-950 border border-slate-700 text-white px-4 py-3 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
            />

          </div>


          {/* Service Cost */}

          <FormField
            label="Service Cost (₹)"
            name="service_cost"
            type="number"
            step="0.01"
            placeholder="Enter service cost"
            value={maintenance.service_cost}
            onChange={handleChange}
            required
          />


          {/* Service Provider */}

          <FormField
            label="Service Provider"
            name="service_provider"
            type="text"
            placeholder="Enter service provider"
            value={maintenance.service_provider}
            onChange={handleChange}
            required
          />


          {/* Status */}

          <div>

            <label className="block text-sm font-medium text-slate-300 mb-2">
              Maintenance Status
            </label>

            <select
              name="maintenance_status"
              value={maintenance.maintenance_status}
              onChange={handleChange}
              className="w-full bg-slate-950 border border-slate-700 text-white px-4 py-3 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
            >
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>

          </div>


          {/* Notes */}

          <div>

            <label className="block text-sm font-medium text-slate-300 mb-2">
              Notes
            </label>

            <textarea
              name="notes"
              placeholder="Enter maintenance notes"
              value={maintenance.notes}
              onChange={handleChange}
              rows="3"
              className="w-full bg-slate-950 border border-slate-700 text-white placeholder-slate-500 px-4 py-3 rounded-xl outline-none resize-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
            />

          </div>

        </div>


        {/* Buttons */}

        <div className="flex justify-end gap-4 mt-8">

          <button
            type="button"
            onClick={() => navigate("/maintenance")}
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
              : "Save Maintenance"}
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
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full bg-slate-950 border border-slate-700 text-white placeholder-slate-500 px-4 py-3 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
      />

    </div>
  );
}

export default AddMaintenance;