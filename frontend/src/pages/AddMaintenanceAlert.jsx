import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../services/api";

function AddMaintenanceAlert() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    vehicle_id: "",
    maintenance_id: "",
    alert_message: "",
    alert_type: "",
    alert_status: "Pending",
    next_service_date: "",
  });

  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const saveAlert = async (e) => {
    e.preventDefault();

    if (
      !formData.vehicle_id ||
      !formData.maintenance_id ||
      !formData.alert_type.trim() ||
      !formData.alert_message.trim() ||
      !formData.next_service_date
    ) {
      window.alert("Please fill all required fields");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        vehicle_id: Number(formData.vehicle_id),
        maintenance_id: Number(formData.maintenance_id),
        alert_message: formData.alert_message.trim(),
        alert_type: formData.alert_type.trim(),
        alert_status: formData.alert_status,

        next_service_date: new Date(
          formData.next_service_date
        ).toISOString(),
      };

      console.log(
        "Sending Maintenance Alert:",
        payload
      );

      const response = await api.post(
        "/maintenance-alerts",
        payload
      );

      console.log(
        "Maintenance Alert Created:",
        response.data
      );

      window.alert(
        "Maintenance Alert Created Successfully"
      );

      navigate("/maintenance-alerts");

    } catch (err) {
      console.error(
        "Create Maintenance Alert Error:",
        err.response?.data || err
      );

      const detail =
        err.response?.data?.detail;

      if (Array.isArray(detail)) {

        const message = detail
          .map((item) => {
            const field = item.loc
              ? item.loc[item.loc.length - 1]
              : "Field";

            return `${field}: ${item.msg}`;
          })
          .join("\n");

        window.alert(message);

      } else if (
        detail &&
        typeof detail === "object"
      ) {

        window.alert(
          JSON.stringify(detail, null, 2)
        );

      } else if (
        typeof detail === "string"
      ) {

        window.alert(detail);

      } else {

        window.alert(
          "Failed to create maintenance alert"
        );
      }

    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="mb-8">

        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-cyan-300 via-cyan-400 to-teal-300 bg-clip-text text-transparent">
          Add Maintenance Alert
        </h1>

        <p className="text-slate-400 mt-2">
          Create a maintenance notification for a vehicle
        </p>

      </div>


      {/* =================================================
          FORM
      ================================================= */}

      <form
        onSubmit={saveAlert}
        className="bg-slate-900/75 backdrop-blur-xl border border-cyan-500/20 rounded-2xl shadow-2xl p-8"
      >

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* =================================================
              VEHICLE ID
          ================================================= */}

          <FormField
            label="Vehicle ID"
            name="vehicle_id"
            type="number"
            min="1"
            placeholder="Enter vehicle ID"
            value={formData.vehicle_id}
            onChange={handleChange}
            required
          />


          {/* =================================================
              MAINTENANCE ID
          ================================================= */}

          <FormField
            label="Maintenance ID"
            name="maintenance_id"
            type="number"
            min="1"
            placeholder="Enter maintenance ID"
            value={formData.maintenance_id}
            onChange={handleChange}
            required
          />


          {/* =================================================
              ALERT TYPE
          ================================================= */}

          <FormField
            label="Alert Type"
            name="alert_type"
            type="text"
            placeholder="e.g. Service Due"
            value={formData.alert_type}
            onChange={handleChange}
            required
          />


          {/* =================================================
              NEXT SERVICE DATE
          ================================================= */}

          <div>

            <label className="block text-sm font-medium text-slate-300 mb-2">
              Next Service Date
            </label>

            <input
              type="datetime-local"
              name="next_service_date"
              value={formData.next_service_date}
              onChange={handleChange}
              required
              className="w-full bg-slate-950 border border-slate-700 text-white px-4 py-3 rounded-xl outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition"
            />

          </div>


          {/* =================================================
              ALERT MESSAGE
          ================================================= */}

          <div className="md:col-span-2">

            <label className="block text-sm font-medium text-slate-300 mb-2">
              Alert Message
            </label>

            <textarea
              name="alert_message"
              placeholder="Enter alert message"
              value={formData.alert_message}
              onChange={handleChange}
              rows="4"
              required
              className="w-full bg-slate-950 border border-slate-700 text-white placeholder-slate-500 px-4 py-3 rounded-xl outline-none resize-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition"
            />

          </div>


          {/* =================================================
              ALERT STATUS
          ================================================= */}

          <div>

            <label className="block text-sm font-medium text-slate-300 mb-2">
              Alert Status
            </label>

            <select
              name="alert_status"
              value={formData.alert_status}
              onChange={handleChange}
              required
              className="w-full bg-slate-950 border border-slate-700 text-white px-4 py-3 rounded-xl outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition"
            >

              <option value="Pending">
                Pending
              </option>

              <option value="Sent">
                Sent
              </option>

              <option value="Completed">
                Completed
              </option>

            </select>

          </div>

        </div>


        {/* =================================================
            BUTTONS
        ================================================= */}

        <div className="flex justify-end gap-4 mt-8">

          {/* CANCEL */}

          <button
            type="button"
            onClick={() =>
              navigate("/maintenance-alerts")
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
              ? "Creating..."
              : "Save Alert"}
          </button>

        </div>

      </form>

    </Layout>
  );
}


/* =========================================================
   FORM FIELD
========================================================= */

function FormField({
  label,
  name,
  type = "text",
  placeholder,
  value,
  onChange,
  required = false,
  min,
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
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full bg-slate-950 border border-slate-700 text-white placeholder-slate-500 px-4 py-3 rounded-xl outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition"
      />

    </div>
  );
}

export default AddMaintenanceAlert;