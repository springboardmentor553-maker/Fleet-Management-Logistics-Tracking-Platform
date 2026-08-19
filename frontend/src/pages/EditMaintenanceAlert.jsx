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

      const res = await api.get(
        `/maintenance-alerts/${id}`
      );

      setAlertData({
        alert_status:
          res.data.alert_status || "Pending",
      });
    } catch (err) {
      console.log("Load error:", err);

      const detail =
        err.response?.data?.detail;

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
          alert_status:
            alertData.alert_status,
        }
      );

      alert(
        "Maintenance Alert Updated Successfully"
      );

      navigate("/maintenance-alerts");
    } catch (err) {
      console.log(
        "Update error:",
        err.response?.data || err
      );

      const detail =
        err.response?.data?.detail;

      let message =
        "Failed to update maintenance alert";

      if (typeof detail === "string") {
        message = detail;
      } else if (Array.isArray(detail)) {
        message = detail
          .map(
            (item) =>
              item.msg ||
              JSON.stringify(item)
          )
          .join("\n");
      } else if (
        detail &&
        typeof detail === "object"
      ) {
        message = JSON.stringify(detail);
      }

      alert(message);
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <Layout>

        <div className="flex justify-center items-center py-20">

          <p className="text-cyan-400 text-lg">
            Loading maintenance alert...
          </p>

        </div>

      </Layout>
    );
  }

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <Layout>

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="mb-8">

        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-cyan-300 via-cyan-400 to-teal-300 bg-clip-text text-transparent">
          Update Alert Status
        </h1>

        <p className="text-slate-400 mt-2">
          Update the current status of maintenance alert #{id}
        </p>

      </div>


      {/* =================================================
          FORM
      ================================================= */}

      <form
        onSubmit={updateAlert}
        className="max-w-3xl bg-slate-900/75 backdrop-blur-xl border border-cyan-500/20 rounded-2xl shadow-2xl p-10"
      >

        {/* =================================================
            ALERT HEADER
        ================================================= */}

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


        {/* =================================================
            STATUS
        ================================================= */}

        <div>

          <label className="block text-sm font-medium text-slate-300 mb-2">
            Alert Status
          </label>

          <select
            name="alert_status"
            value={alertData.alert_status}
            onChange={handleChange}
            required
            className="w-full bg-slate-950 border border-slate-700 text-white px-4 py-4 rounded-xl outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition"
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


        {/* =================================================
            SELECTED STATUS
        ================================================= */}

        <div className="mt-8">

          <p className="text-sm text-slate-400 mb-2">
            Selected Status
          </p>

          <span className="inline-block px-5 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-semibold">
            {alertData.alert_status}
          </span>

        </div>


        {/* =================================================
            BUTTONS
        ================================================= */}

        <div className="flex justify-end gap-4 mt-10">

          {/* CANCEL */}

          <button
            type="button"
            onClick={() =>
              navigate("/maintenance-alerts")
            }
            className="px-6 py-3 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white transition"
          >
            Cancel
          </button>


          {/* UPDATE */}

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-semibold hover:from-cyan-400 hover:to-teal-400 shadow-lg shadow-cyan-900/20 transition disabled:opacity-50"
          >
            {saving
              ? "Updating..."
              : "Update Alert"}
          </button>

        </div>

      </form>

    </Layout>
  );
}

export default EditMaintenanceAlert;