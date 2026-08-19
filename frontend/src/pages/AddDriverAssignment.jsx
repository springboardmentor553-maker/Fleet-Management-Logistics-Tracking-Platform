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

      {/* ================= HEADER ================= */}

      <div className="mb-8">

        <p className="text-teal-300 text-sm font-medium mb-2">
          FleetFlow • Operations Center
        </p>

        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-teal-300 via-cyan-300 to-teal-400 bg-clip-text text-transparent">
          Assign Driver
        </h1>

        <p className="text-teal-100/70 mt-2">
          Assign a driver, vehicle and trip for fleet operations
        </p>

      </div>


      {/* ================= FORM ================= */}

      <form
        onSubmit={saveAssignment}
        className="bg-[#062126]/80 backdrop-blur-xl border border-teal-900/60 rounded-2xl shadow-2xl p-8"
      >

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* ================= DRIVER ID ================= */}

          <FormField
            label="Driver ID"
            name="driver_id"
            type="number"
            placeholder="Enter driver ID"
            value={assignment.driver_id}
            onChange={handleChange}
            required
          />


          {/* ================= VEHICLE ID ================= */}

          <FormField
            label="Vehicle ID"
            name="vehicle_id"
            type="number"
            placeholder="Enter vehicle ID"
            value={assignment.vehicle_id}
            onChange={handleChange}
            required
          />


          {/* ================= TRIP ID ================= */}

          <FormField
            label="Trip ID"
            name="trip_id"
            type="number"
            placeholder="Enter trip ID"
            value={assignment.trip_id}
            onChange={handleChange}
            required
          />


          {/* ================= STATUS ================= */}

          <div>

            <label className="block text-sm font-medium text-teal-50/80 mb-2">
              Assignment Status
            </label>

            <select
              name="assignment_status"
              value={assignment.assignment_status}
              onChange={handleChange}
              className="w-full bg-[#03181b] border border-teal-900/60 text-teal-50 px-4 py-3 rounded-xl outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 transition"
            >

              <option
                value="Assigned"
                className="bg-[#062126]"
              >
                Assigned
              </option>

              <option
                value="Completed"
                className="bg-[#062126]"
              >
                Completed
              </option>

            </select>

          </div>


          {/* ================= REMARKS ================= */}

          <div className="md:col-span-2">

            <label className="block text-sm font-medium text-teal-50/80 mb-2">
              Remarks
            </label>

            <textarea
              name="remarks"
              placeholder="Enter remarks or additional information"
              value={assignment.remarks}
              onChange={handleChange}
              rows="4"
              className="w-full bg-[#03181b] border border-teal-900/60 text-teal-50 placeholder-teal-200/40 px-4 py-3 rounded-xl outline-none resize-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 transition"
            />

          </div>

        </div>


        {/* ================= BUTTONS ================= */}

        <div className="flex justify-end gap-4 mt-8">

          {/* CANCEL */}

          <button
            type="button"
            onClick={() =>
              navigate("/driver-assignments")
            }
            className="px-6 py-3 rounded-xl border border-teal-900/60 text-teal-100/70 hover:bg-[#0a2b30] hover:text-teal-50 transition"
          >
            Cancel
          </button>


          {/* ASSIGN */}

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-teal-400 to-cyan-400 text-[#03181b] font-semibold hover:from-teal-300 hover:to-cyan-300 shadow-lg shadow-teal-900/30 transition disabled:opacity-50"
          >
            {saving
              ? "Assigning..."
              : "Assign Driver"}
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

      <label className="block text-sm font-medium text-teal-50/80 mb-2">
        {label}
      </label>

      <input
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full bg-[#03181b] border border-teal-900/60 text-teal-50 placeholder-teal-200/40 px-4 py-3 rounded-xl outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 transition"
      />

    </div>
  );
}

export default AddDriverAssignment;