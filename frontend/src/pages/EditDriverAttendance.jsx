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

          <div className="text-center">

            <div className="text-5xl mb-4">
              📅
            </div>

            <p className="text-teal-300 text-lg font-semibold">
              Loading attendance...
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
          FleetFlow • People Center
        </p>

        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-teal-300 via-cyan-300 to-teal-400 bg-clip-text text-transparent">
          Edit Driver Attendance
        </h1>

        <p className="text-teal-100/70 mt-2">
          Update attendance and working hour details
        </p>

      </div>


      {/* ================= FORM ================= */}

      <form
        onSubmit={updateAttendance}
        className="bg-[#062126]/80 backdrop-blur-xl border border-teal-900/60 rounded-2xl shadow-2xl p-8"
      >

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* ================= DRIVER ID ================= */}

          <FormField
            label="Driver ID"
            name="driver_id"
            type="number"
            value={attendance.driver_id}
            placeholder="Enter driver ID"
            onChange={handleChange}
          />


          {/* ================= DATE ================= */}

          <div>

            <label className="block text-sm font-medium text-teal-50/80 mb-2">
              Attendance Date
            </label>

            <input
              type="date"
              name="date"
              value={attendance.date}
              onChange={handleChange}
              className="w-full bg-[#03181b] border border-teal-900/60 text-teal-50 px-4 py-3 rounded-xl outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 transition"
            />

          </div>


          {/* ================= STATUS ================= */}

          <div>

            <label className="block text-sm font-medium text-teal-50/80 mb-2">
              Attendance Status
            </label>

            <select
              name="attendance_status"
              value={attendance.attendance_status}
              onChange={handleChange}
              className="w-full bg-[#03181b] border border-teal-900/60 text-teal-50 px-4 py-3 rounded-xl outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 transition"
            >

              <option
                value="Present"
                className="bg-[#062126]"
              >
                Present
              </option>

              <option
                value="Absent"
                className="bg-[#062126]"
              >
                Absent
              </option>

              <option
                value="Leave"
                className="bg-[#062126]"
              >
                Leave
              </option>

            </select>

          </div>


          {/* ================= CHECK IN ================= */}

          <div>

            <label className="block text-sm font-medium text-teal-50/80 mb-2">
              Check In Time
            </label>

            <input
              type="time"
              name="check_in_time"
              value={attendance.check_in_time || ""}
              onChange={handleChange}
              className="w-full bg-[#03181b] border border-teal-900/60 text-teal-50 px-4 py-3 rounded-xl outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 transition"
            />

          </div>


          {/* ================= CHECK OUT ================= */}

          <div>

            <label className="block text-sm font-medium text-teal-50/80 mb-2">
              Check Out Time
            </label>

            <input
              type="time"
              name="check_out_time"
              value={attendance.check_out_time || ""}
              onChange={handleChange}
              className="w-full bg-[#03181b] border border-teal-900/60 text-teal-50 px-4 py-3 rounded-xl outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 transition"
            />

          </div>

        </div>


        {/* ================= BUTTONS ================= */}

        <div className="flex justify-end gap-4 mt-8">

          {/* CANCEL */}

          <button
            type="button"
            onClick={() =>
              navigate("/driver-attendance")
            }
            className="px-6 py-3 rounded-xl border border-teal-900/60 text-teal-100/70 hover:bg-[#0a2b30] hover:text-teal-50 transition"
          >
            Cancel
          </button>


          {/* UPDATE */}

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-teal-400 to-cyan-400 text-[#03181b] font-semibold hover:from-teal-300 hover:to-cyan-300 shadow-lg shadow-teal-900/30 transition disabled:opacity-50"
          >
            {saving
              ? "Updating..."
              : "Update Attendance"}
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

export default EditDriverAttendance;