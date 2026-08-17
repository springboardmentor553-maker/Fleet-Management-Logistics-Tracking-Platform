import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../services/api";

function EditMaintenance() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [maintenance, setMaintenance] = useState({
    vehicle_id: "",
    maintenance_category: "",
    service_date: "",
    next_service_date: "",
    service_cost: "",
    service_provider: "",
    maintenance_status: "",
    notes: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadMaintenance();
  }, [id]);

  const loadMaintenance = async () => {
    try {
      setLoading(true);

      const res = await api.get(`/maintenance/${id}`);

      setMaintenance({
        vehicle_id: res.data.vehicle_id || "",
        maintenance_category:
          res.data.maintenance_category ||
          res.data.maintenance_type ||
          "",
        service_date:
          res.data.service_date?.slice(0, 16) || "",
        next_service_date:
          res.data.next_service_date?.slice(0, 16) || "",
        service_cost:
          res.data.service_cost ??
          res.data.maintenance_cost ??
          "",
        service_provider:
          res.data.service_provider || "",
        maintenance_status:
          res.data.maintenance_status || "Pending",
        notes: res.data.notes || "",
      });
    } catch (err) {
      console.log(err);

      alert(
        err.response?.data?.detail ||
          "Failed to load maintenance record"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setMaintenance({
      ...maintenance,
      [e.target.name]: e.target.value,
    });
  };

  const updateMaintenance = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);

      await api.put(`/maintenance/${id}`, maintenance);

      alert("Maintenance Updated Successfully");

      navigate("/maintenance");
    } catch (err) {
      console.log(err);

      alert(
        err.response?.data?.detail ||
          "Failed to update maintenance record"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center py-20">
          <p className="text-blue-400 text-lg">
            Loading maintenance record...
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>

      {/* Header */}

      <div className="mb-8">

        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent">
          Edit Maintenance
        </h1>

        <p className="text-slate-400 mt-2">
          Update vehicle maintenance and service details
        </p>

      </div>


      {/* Form */}

      <form
        onSubmit={updateMaintenance}
        className="bg-slate-900/75 backdrop-blur-xl border border-slate-700/60 rounded-2xl shadow-2xl p-8"
      >

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Vehicle ID */}

          <FormField
            label="Vehicle ID"
            name="vehicle_id"
            type="number"
            value={maintenance.vehicle_id}
            placeholder="Enter vehicle ID"
            onChange={handleChange}
            required
          />


          {/* Maintenance Category */}

          <FormField
            label="Maintenance Category"
            name="maintenance_category"
            type="text"
            value={maintenance.maintenance_category}
            placeholder="e.g. Engine, Brake, Tyre"
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
            value={maintenance.service_cost}
            placeholder="Enter service cost"
            onChange={handleChange}
            required
          />


          {/* Service Provider */}

          <FormField
            label="Service Provider"
            name="service_provider"
            type="text"
            value={maintenance.service_provider}
            placeholder="Enter service provider"
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
              <option value="In Progress">
                In Progress
              </option>
              <option value="Completed">
                Completed
              </option>
            </select>

          </div>


          {/* Notes */}

          <div>

            <label className="block text-sm font-medium text-slate-300 mb-2">
              Notes
            </label>

            <textarea
              name="notes"
              value={maintenance.notes}
              onChange={handleChange}
              placeholder="Enter maintenance notes"
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
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold hover:from-green-500 hover:to-emerald-500 shadow-lg shadow-green-900/20 transition disabled:opacity-50"
          >
            {saving
              ? "Updating..."
              : "Update Maintenance"}
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
  value,
  placeholder,
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
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        required={required}
        className="w-full bg-slate-950 border border-slate-700 text-white placeholder-slate-500 px-4 py-3 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
      />

    </div>
  );
}

export default EditMaintenance;