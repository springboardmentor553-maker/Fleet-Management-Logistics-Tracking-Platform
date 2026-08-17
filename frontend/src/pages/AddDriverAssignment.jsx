import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../services/api";

function AddDriverAssignment() {
  const navigate = useNavigate();

  const [assignment, setAssignment] = useState({
    driver_id: "",
    vehicle_id: "",
    trip_id: "",
    assignment_status: "Assigned",
    remarks: "",
  });

  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    setAssignment({
      ...assignment,
      [e.target.name]: e.target.value,
    });
  };

  const saveAssignment = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);

      await api.post("/driver-assignments", assignment);

      alert("Driver Assigned Successfully");

      navigate("/driver-assignments");
    } catch (err) {
      console.log(err);

      alert(
        err.response?.data?.detail ||
        "Failed to assign driver"
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
          Assign Driver
        </h1>

        <p className="text-slate-400 mt-2">
          Assign a driver, vehicle and trip for fleet operations
        </p>

      </div>


      {/* Form */}

      <form
        onSubmit={saveAssignment}
        className="bg-slate-900/75 backdrop-blur-xl border border-slate-700/60 rounded-2xl shadow-2xl p-8"
      >

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Driver ID */}

          <FormField
            label="Driver ID"
            name="driver_id"
            type="number"
            placeholder="Enter driver ID"
            value={assignment.driver_id}
            onChange={handleChange}
            required
          />


          {/* Vehicle ID */}

          <FormField
            label="Vehicle ID"
            name="vehicle_id"
            type="number"
            placeholder="Enter vehicle ID"
            value={assignment.vehicle_id}
            onChange={handleChange}
            required
          />


          {/* Trip ID */}

          <FormField
            label="Trip ID"
            name="trip_id"
            type="number"
            placeholder="Enter trip ID"
            value={assignment.trip_id}
            onChange={handleChange}
            required
          />


          {/* Assignment Status */}

          <div>

            <label className="block text-sm font-medium text-slate-300 mb-2">
              Assignment Status
            </label>

            <select
              name="assignment_status"
              value={assignment.assignment_status}
              onChange={handleChange}
              className="w-full bg-slate-950 border border-slate-700 text-white px-4 py-3 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
            >

              <option value="Assigned">
                Assigned
              </option>

              <option value="Completed">
                Completed
              </option>

            </select>

          </div>


          {/* Remarks */}

          <div className="md:col-span-2">

            <label className="block text-sm font-medium text-slate-300 mb-2">
              Remarks
            </label>

            <textarea
              name="remarks"
              placeholder="Enter remarks or additional information"
              value={assignment.remarks}
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
            onClick={() => navigate("/driver-assignments")}
            className="px-6 py-3 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white transition"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-900/30 transition disabled:opacity-50"
          >
            {saving ? "Assigning..." : "Assign Driver"}
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

export default AddDriverAssignment;