import { useState } from "react";
import Layout from "../components/Layout";
import api from "../services/api";

function DriverPerformance() {
  const [driverId, setDriverId] = useState("");
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(false);

  // ================= ROLE =================

  const userRole = localStorage.getItem("role") || "";
  const userEmail = localStorage.getItem("email") || "";

  const normalizedRole = userRole
    .toLowerCase()
    .replace(/\s+/g, "_");

  const canViewAllPerformance = [
    "administrator",
    "fleet_manager",
    "dispatcher",
  ].includes(normalizedRole);

  const isDriver = normalizedRole === "driver";

  // ================= GET PERFORMANCE =================

  const getPerformance = async () => {
    if (!driverId.trim()) {
      alert("Enter Driver ID");
      return;
    }

    // Driver should not search another driver's performance
    if (isDriver) {
      const loggedInDriverId =
        localStorage.getItem("driver_id");

      if (
        loggedInDriverId &&
        driverId !== loggedInDriverId
      ) {
        alert(
          "You can only view your own performance"
        );
        return;
      }
    }

    try {
      setLoading(true);

      const res = await api.get(
        `/driver/${driverId}/performance`
      );

      setPerformance(res.data);
    } catch (err) {
      console.log(err);

      setPerformance(null);

      alert(
        err.response?.data?.detail ||
          "Failed to load driver performance"
      );
    } finally {
      setLoading(false);
    }
  };

  // ================= UI =================

  return (
    <Layout>

      {/* ================= HEADER ================= */}

      <div className="mb-8">

        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent">
          Driver Performance
        </h1>

        <p className="text-slate-400 mt-2">
          Analyze driver trip performance and
          operational activity
        </p>

      </div>


      {/* ================= SEARCH CARD ================= */}

      <div className="bg-slate-900/75 backdrop-blur-xl border border-slate-700/60 rounded-2xl shadow-2xl p-8">

        <div className="flex flex-col md:flex-row gap-4">

          <input
            type="number"
            placeholder={
              isDriver
                ? "Enter Your Driver ID"
                : "Enter Driver ID"
            }
            value={driverId}
            onChange={(e) =>
              setDriverId(e.target.value)
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                getPerformance();
              }
            }}
            className="flex-1 bg-slate-950 border border-slate-700 text-white placeholder-slate-500 px-4 py-3 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
          />


          <button
            onClick={getPerformance}
            disabled={loading}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-900/30 transition disabled:opacity-50"
          >
            {loading ? "Searching..." : "Search"}
          </button>

        </div>


        {/* DRIVER MESSAGE */}

        {isDriver && (
          <p className="text-xs text-slate-500 mt-3">
            You can view your own performance only.
          </p>
        )}


        {/* ================= PERFORMANCE RESULT ================= */}

        {performance && (

          <div className="mt-10">

            {/* DRIVER HEADER */}

            <div className="bg-gradient-to-r from-blue-600/15 via-cyan-500/10 to-purple-600/15 border border-blue-500/20 rounded-2xl p-6 mb-6">

              <div className="flex items-center gap-4">

                <div className="w-14 h-14 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-3xl">
                  👨‍✈️
                </div>

                <div>

                  <p className="text-sm text-slate-400">
                    Driver
                  </p>

                  <h2 className="text-2xl font-bold text-white">
                    {performance.driver_name}
                  </h2>

                  <p className="text-sm text-cyan-400 mt-1">
                    Driver ID:{" "}
                    {performance.driver_id}
                  </p>

                </div>

              </div>

            </div>


            {/* ================= PERFORMANCE CARDS ================= */}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">

              <PerformanceCard
                title="Total Trips"
                value={performance.total_trips}
                icon="🛣️"
                color="blue"
              />

              <PerformanceCard
                title="Completed Trips"
                value={performance.completed_trips}
                icon="✅"
                color="green"
              />

              <PerformanceCard
                title="Active Trips"
                value={performance.active_trips}
                icon="🚚"
                color="cyan"
              />

              <PerformanceCard
                title="Cancelled Trips"
                value={performance.cancelled_trips}
                icon="❌"
                color="red"
              />

            </div>


            {/* ================= PERFORMANCE SUMMARY ================= */}

            <div className="mt-8 bg-slate-950/70 border border-slate-700/60 rounded-2xl p-6">

              <h3 className="text-lg font-bold text-white mb-5">
                Performance Summary
              </h3>

              <div className="space-y-5">

                <ProgressRow
                  label="Completed"
                  value={
                    performance.completed_trips || 0
                  }
                  total={
                    performance.total_trips || 0
                  }
                  color="bg-green-500"
                />

                <ProgressRow
                  label="Active"
                  value={
                    performance.active_trips || 0
                  }
                  total={
                    performance.total_trips || 0
                  }
                  color="bg-cyan-500"
                />

                <ProgressRow
                  label="Cancelled"
                  value={
                    performance.cancelled_trips || 0
                  }
                  total={
                    performance.total_trips || 0
                  }
                  color="bg-red-500"
                />

              </div>

            </div>

          </div>

        )}

      </div>

    </Layout>
  );
}


/* ================= PERFORMANCE CARD ================= */

function PerformanceCard({
  title,
  value,
  icon,
  color,
}) {

  const styles = {

    blue: {
      border: "border-blue-400/20",
      text: "text-blue-400",
      bg: "bg-blue-500/10",
    },

    green: {
      border: "border-green-400/20",
      text: "text-green-400",
      bg: "bg-green-500/10",
    },

    cyan: {
      border: "border-cyan-400/20",
      text: "text-cyan-400",
      bg: "bg-cyan-500/10",
    },

    red: {
      border: "border-red-400/20",
      text: "text-red-400",
      bg: "bg-red-500/10",
    },

  };

  const style =
    styles[color] || styles.blue;

  return (

    <div
      className={`bg-slate-900/70 backdrop-blur-xl border ${style.border} rounded-2xl p-5 shadow-xl`}
    >

      <div className="flex items-center justify-between">

        <div>

          <p className="text-slate-400 text-sm">
            {title}
          </p>

          <p
            className={`text-3xl font-bold ${style.text} mt-2`}
          >
            {value ?? 0}
          </p>

        </div>

        <div
          className={`w-12 h-12 rounded-xl ${style.bg} flex items-center justify-center text-2xl`}
        >
          {icon}
        </div>

      </div>

    </div>

  );
}


/* ================= PROGRESS ROW ================= */

function ProgressRow({
  label,
  value,
  total,
  color,
}) {

  const percentage =
    total > 0
      ? Math.round((value / total) * 100)
      : 0;

  return (

    <div>

      <div className="flex justify-between mb-2">

        <span className="text-slate-400 text-sm">
          {label}
        </span>

        <span className="text-white text-sm font-semibold">
          {value} / {total}
        </span>

      </div>

      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">

        <div
          className={`h-full ${color} rounded-full transition-all duration-700`}
          style={{
            width: `${percentage}%`,
          }}
        />

      </div>

      <p className="text-xs text-slate-500 mt-1">
        {percentage}%
      </p>

    </div>

  );
}

export default DriverPerformance;