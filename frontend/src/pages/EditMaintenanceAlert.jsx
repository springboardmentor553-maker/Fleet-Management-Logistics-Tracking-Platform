import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../services/api";

function EditMaintenanceAlert() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [alertData, setAlertData] = useState({
    alert_status: "Pending",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAlert();
  }, [id]);

  const loadAlert = async () => {
    try {
      setLoading(true);

      const res = await api.get(`/maintenance-alerts/${id}`);

      setAlertData({
        alert_status: res.data.alert_status || "Pending",
      });
    } catch (err) {
      console.log("Load error:", err);

      const detail = err.response?.data?.detail;

      alert(
        typeof detail === "string"
          ? detail
          : "Failed to load maintenance alert"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setAlertData({
      ...alertData,
      [e.target.name]: e.target.value,
    });
  };

  const updateAlert = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);

      await api.put(
        `/maintenance-alerts/${id}`,
        {
          alert_status: alertData.alert_status,
        }
      );

      alert("Maintenance Alert Updated Successfully");

      navigate("/maintenance-alerts");
    } catch (err) {
      console.log("Update error:", err.response?.data || err);

      const detail = err.response?.data?.detail;

      let message = "Failed to update maintenance alert";

      if (typeof detail === "string") {
        message = detail;
      } else if (Array.isArray(detail)) {
        message = detail
          .map((item) => item.msg || JSON.stringify(item))
          .join("\n");
      } else if (detail && typeof detail === "object") {
        message = JSON.stringify(detail);
      }

      alert(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center py-20">
          <p className="text-blue-400 text-lg">
            Loading maintenance alert...
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
          Update Alert Status
        </h1>

        <p className="text-slate-400 mt-2">
          Update the current status of maintenance alert #{id}
        </p>
      </div>

      {/* Form */}
      <form
        onSubmit={updateAlert}
        className="max-w-3xl bg-slate-900/75 backdrop-blur-xl border border-slate-700/60 rounded-2xl shadow-2xl p-10"
      >

        {/* Alert Header */}
        <div className="flex items-center gap-5 mb-8">

          <div className="w-16 h-16 flex items-center justify-center rounded-xl bg-orange-500/10 border border-orange-500/20 text-3xl">
            🔔
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white">
              Maintenance Alert
            </h2>

            <p className="text-slate-400">
              Alert ID: #{id}
            </p>
          </div>

        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Alert Status
          </label>

          <select
            name="alert_status"
            value={alertData.alert_status}
            onChange={handleChange}
            required
            className="w-full bg-slate-950 border border-slate-700 text-white px-4 py-4 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
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

        {/* Selected Status */}
        <div className="mt-8">

          <p className="text-sm text-slate-400 mb-2">
            Selected Status
          </p>

          <span className="inline-block px-5 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-semibold">
            {alertData.alert_status}
          </span>

        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-4 mt-10">

          <button
            type="button"
            onClick={() => navigate("/maintenance-alerts")}
            className="px-6 py-3 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white transition"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold hover:from-green-500 hover:to-emerald-500 shadow-lg shadow-green-900/20 transition disabled:opacity-50"
          >
            {saving ? "Updating..." : "Update Alert"}
          </button>

        </div>

      </form>

    </Layout>
  );
}

export default EditMaintenanceAlert;