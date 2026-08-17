import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../services/api";

function EditDriverAttendance() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [attendance, setAttendance] = useState({
    driver_id: "",
    date: "",
    attendance_status: "Present",
    check_in_time: "",
    check_out_time: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAttendance();
  }, [id]);

  const loadAttendance = async () => {
    try {
      setLoading(true);

      const res = await api.get(`/driver-attendance/${id}`);

      setAttendance({
        driver_id: res.data.driver_id || "",
        date: res.data.date || "",
        attendance_status:
          res.data.attendance_status || "Present",
        check_in_time: res.data.check_in_time || "",
        check_out_time: res.data.check_out_time || "",
      });
    } catch (err) {
      console.log(err);

      alert(
        err.response?.data?.detail ||
        "Failed to load attendance"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setAttendance({
      ...attendance,
      [e.target.name]: e.target.value,
    });
  };

  const updateAttendance = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);

      await api.put(
        `/driver-attendance/${id}`,
        attendance
      );

      alert("Attendance Updated Successfully");

      navigate("/driver-attendance");
    } catch (err) {
      console.log(err);

      alert(
        err.response?.data?.detail ||
        "Failed to update attendance"
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
            Loading attendance...
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
          Edit Driver Attendance
        </h1>

        <p className="text-slate-400 mt-2">
          Update attendance and working hour details
        </p>

      </div>


      {/* Form */}

      <form
        onSubmit={updateAttendance}
        className="bg-slate-900/75 backdrop-blur-xl border border-slate-700/60 rounded-2xl shadow-2xl p-8"
      >

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Driver ID */}

          <FormField
            label="Driver ID"
            name="driver_id"
            type="number"
            value={attendance.driver_id}
            placeholder="Enter driver ID"
            onChange={handleChange}
          />


          {/* Date */}

          <div>

            <label className="block text-sm font-medium text-slate-300 mb-2">
              Attendance Date
            </label>

            <input
              type="date"
              name="date"
              value={attendance.date}
              onChange={handleChange}
              className="w-full bg-slate-950 border border-slate-700 text-white px-4 py-3 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
            />

          </div>


          {/* Status */}

          <div>

            <label className="block text-sm font-medium text-slate-300 mb-2">
              Attendance Status
            </label>

            <select
              name="attendance_status"
              value={attendance.attendance_status}
              onChange={handleChange}
              className="w-full bg-slate-950 border border-slate-700 text-white px-4 py-3 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
            >

              <option value="Present">
                Present
              </option>

              <option value="Absent">
                Absent
              </option>

              <option value="Leave">
                Leave
              </option>

            </select>

          </div>


          {/* Check In */}

          <div>

            <label className="block text-sm font-medium text-slate-300 mb-2">
              Check In Time
            </label>

            <input
              type="time"
              name="check_in_time"
              value={attendance.check_in_time || ""}
              onChange={handleChange}
              className="w-full bg-slate-950 border border-slate-700 text-white px-4 py-3 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
            />

          </div>


          {/* Check Out */}

          <div>

            <label className="block text-sm font-medium text-slate-300 mb-2">
              Check Out Time
            </label>

            <input
              type="time"
              name="check_out_time"
              value={attendance.check_out_time || ""}
              onChange={handleChange}
              className="w-full bg-slate-950 border border-slate-700 text-white px-4 py-3 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
            />

          </div>

        </div>


        {/* Buttons */}

        <div className="flex justify-end gap-4 mt-8">

          <button
            type="button"
            onClick={() => navigate("/driver-attendance")}
            className="px-6 py-3 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white transition"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold hover:from-green-500 hover:to-emerald-500 shadow-lg shadow-green-900/20 transition disabled:opacity-50"
          >
            {saving ? "Updating..." : "Update Attendance"}
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

      <label className="block text-sm font-medium text-slate-300 mb-2">
        {label}
      </label>

      <input
        type={type}
        name={name}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        className="w-full bg-slate-950 border border-slate-700 text-white placeholder-slate-500 px-4 py-3 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
      />

    </div>
  );
}

export default EditDriverAttendance;