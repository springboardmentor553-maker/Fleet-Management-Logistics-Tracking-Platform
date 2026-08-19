import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../services/api";

function EditDriverAssignment() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [assignment, setAssignment] = useState({
    driver_id: "",
    vehicle_id: "",
    trip_id: "",
    assignment_status: "Assigned",
    remarks: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAssignment();
  }, [id]);

  const loadAssignment = async () => {
    try {
      setLoading(true);

      const res = await api.get("/driver-assignments");

      const data = res.data.find(
        (item) =>
          item.assignment_id === Number(id)
      );

      if (!data) {
        alert("Assignment not found");
        navigate("/driver-assignments");
        return;
      }

      setAssignment({
        driver_id: data.driver_id || "",
        vehicle_id: data.vehicle_id || "",
        trip_id: data.trip_id || "",
        assignment_status:
          data.assignment_status || "Assigned",
        remarks: data.remarks || "",
      });

    } catch (err) {
      console.log(err);

      alert(
        err.response?.data?.detail ||
        "Failed to load assignment"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setAssignment({
      ...assignment,
      [e.target.name]: e.target.value,
    });
  };

  const updateAssignment = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);

      await api.put(
        `/driver-assignments/${id}`,
        assignment
      );

      alert("Assignment Updated Successfully");

      navigate("/driver-assignments");

    } catch (err) {
      console.log(err);

      alert(
        err.response?.data?.detail ||
        "Failed to update assignment"
      );
    } finally {
      setSaving(false);
    }
  };

  /* ================= LOADING ================= */

  if (loading) {
    return (
      <Layout>

        <div className="flex justify-center items-center py-20">

          <div className="text-center">

            <div className="text-5xl mb-4">
              📋
            </div>

            <p className="text-teal-300 text-lg font-semibold">
              Loading assignment...
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
          FleetFlow • Operations Center
        </p>

        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-teal-300 via-cyan-300 to-teal-400 bg-clip-text text-transparent">
          Edit Driver Assignment
        </h1>

        <p className="text-teal-100/70 mt-2">
          Update driver, vehicle and trip assignment details
        </p>

      </div>


      {/* ================= FORM ================= */}

      <form
        onSubmit={updateAssignment}
        className="bg-[#062126]/80 backdrop-blur-xl border border-teal-900/60 rounded-2xl shadow-2xl p-8"
      >

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Driver ID */}

          <FormField
            label="Driver ID"
            name="driver_id"
            type="number"
            value={assignment.driver_id}
            placeholder="Enter driver ID"
            onChange={handleChange}
          />


          {/* Vehicle ID */}

          <FormField
            label="Vehicle ID"
            name="vehicle_id"
            type="number"
            value={assignment.vehicle_id}
            placeholder="Enter vehicle ID"
            onChange={handleChange}
          />


          {/* Trip ID */}

          <FormField
            label="Trip ID"
            name="trip_id"
            type="number"
            value={assignment.trip_id}
            placeholder="Enter trip ID"
            onChange={handleChange}
          />


          {/* Status */}

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


          {/* Remarks */}

          <div className="md:col-span-2">

            <label className="block text-sm font-medium text-teal-50/80 mb-2">
              Remarks
            </label>

            <textarea
              name="remarks"
              value={assignment.remarks}
              onChange={handleChange}
              placeholder="Enter remarks"
              rows="4"
              className="w-full bg-[#03181b] border border-teal-900/60 text-teal-50 placeholder-teal-200/40 px-4 py-3 rounded-xl outline-none resize-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 transition"
            />

          </div>

        </div>


        {/* ================= BUTTONS ================= */}

        <div className="flex justify-end gap-4 mt-8">

          {/* Cancel */}

          <button
            type="button"
            onClick={() =>
              navigate("/driver-assignments")
            }
            className="px-6 py-3 rounded-xl border border-teal-900/60 text-teal-100/70 hover:bg-[#0a2b30] hover:text-teal-50 transition"
          >
            Cancel
          </button>


          {/* Update */}

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-teal-400 to-cyan-400 text-[#03181b] font-semibold hover:from-teal-300 hover:to-cyan-300 shadow-lg shadow-teal-900/30 transition disabled:opacity-50"
          >
            {saving
              ? "Updating..."
              : "Update Assignment"}
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
  value,
  placeholder,
  onChange,
}) {
  return (
    <div>

      <label className="block text-sm font-medium text-teal-50/80 mb-2">
        {label}
      </label>

      <input
        type={type}
        name={name}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        className="w-full bg-[#03181b] border border-teal-900/60 text-teal-50 placeholder-teal-200/40 px-4 py-3 rounded-xl outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 transition"
      />

    </div>
  );
}

export default EditDriverAssignment;