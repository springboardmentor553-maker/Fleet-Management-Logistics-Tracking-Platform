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

  return (
    <Layout>

      {/* ================= HEADER ================= */}

      <div className="mb-8">

        <p className="text-teal-300 text-sm font-medium mb-2">
          FleetFlow • People Center
        </p>

        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-teal-300 via-cyan-300 to-teal-400 bg-clip-text text-transparent">
          Driver Performance
        </h1>

        <p className="text-teal-100/70 mt-2">
          Review driver trip performance and
          operational activity
        </p>

      </div>


      {/* ================= SEARCH CARD ================= */}

      <div className="bg-[#062126]/80 backdrop-blur-xl border border-teal-900/60 rounded-2xl shadow-2xl p-8">

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
            className="flex-1 bg-[#03181b] border border-teal-900/60 text-teal-50 placeholder-teal-200/40 px-4 py-3 rounded-xl outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 transition"
          />


          <button
            onClick={getPerformance}
            disabled={loading}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-teal-400 to-cyan-400 text-[#03181b] font-semibold hover:from-teal-300 hover:to-cyan-300 shadow-lg shadow-teal-900/30 transition disabled:opacity-50"
          >
            {loading ? "Searching..." : "Search"}
          </button>

        </div>


        {/* DRIVER MESSAGE */}

        {isDriver && (
          <p className="text-xs text-teal-200/50 mt-3">
            You can view your own performance only.
          </p>
        )}


        {/* ================= PERFORMANCE RESULT ================= */}

        {performance && (

          <div className="mt-10">

            {/* DRIVER HEADER */}

            <div className="bg-gradient-to-r from-teal-500/10 via-cyan-500/10 to-teal-500/10 border border-teal-400/20 rounded-2xl p-6 mb-6">

              <div className="flex items-center gap-4">

                <div className="w-14 h-14 rounded-xl bg-teal-500/10 border border-teal-400/20 flex items-center justify-center text-3xl">
                  👨‍✈️
                </div>

                <div>

                  <p className="text-sm text-teal-100/70">
                    Driver
                  </p>

                  <h2 className="text-2xl font-bold text-teal-50">
                    {performance.driver_name}
                  </h2>

                  <p className="text-sm text-teal-300 mt-1">
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
                color="teal"
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

            <div className="mt-8 bg-[#03181b]/80 border border-teal-900/60 rounded-2xl p-6">

              <h3 className="text-lg font-bold text-teal-50 mb-5">
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
                  color="bg-emerald-400"
                />

                <ProgressRow
                  label="Active"
                  value={
                    performance.active_trips || 0
                  }
                  total={
                    performance.total_trips || 0
                  }
                  color="bg-cyan-400"
                />

                <ProgressRow
                  label="Cancelled"
                  value={
                    performance.cancelled_trips || 0
                  }
                  total={
                    performance.total_trips || 0
                  }
                  color="bg-red-400"
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

    teal: {
      border: "border-teal-400/20",
      text: "text-teal-300",
      bg: "bg-teal-500/10",
    },

    green: {
      border: "border-emerald-400/20",
      text: "text-emerald-300",
      bg: "bg-emerald-500/10",
    },

    cyan: {
      border: "border-cyan-400/20",
      text: "text-cyan-300",
      bg: "bg-cyan-500/10",
    },

    red: {
      border: "border-red-400/20",
      text: "text-red-300",
      bg: "bg-red-500/10",
    },

  };

  const style =
    styles[color] || styles.teal;

  return (

    <div
      className={`bg-[#062126]/80 backdrop-blur-xl border ${style.border} rounded-2xl p-5 shadow-xl hover:-translate-y-1 transition-all duration-200`}
    >

      <div className="flex items-center justify-between">

        <div>

          <p className="text-teal-100/70 text-sm">
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
      ? Math.min(
          Math.round((value / total) * 100),
          100
        )
      : 0;

  return (

    <div>

      <div className="flex justify-between mb-2">

        <span className="text-teal-100/70 text-sm">
          {label}
        </span>

        <span className="text-teal-50 text-sm font-semibold">
          {value} / {total}
        </span>

      </div>


      <div className="w-full h-2 bg-[#0a2b30] rounded-full overflow-hidden">

        <div
          className={`h-full ${color} rounded-full transition-all duration-700`}
          style={{
            width: `${percentage}%`,
          }}
        />

      </div>


      <p className="text-xs text-teal-200/50 mt-1">
        {percentage}%
      </p>

    </div>

  );
}

export default DriverPerformance;