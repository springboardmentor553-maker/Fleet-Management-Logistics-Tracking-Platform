import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../services/api";

function Vehicles() {
  const [vehicles, setVehicles] = useState([]);

  // Get logged-in user's role
  const userRole =
  localStorage
    .getItem("role")
    ?.toLowerCase()
    .replace(/\s+/g, "_") || "";

  // Only Administrator and Fleet Manager can manage vehicles
  const canManageVehicles =
    userRole === "administrator" ||
    userRole === "fleet_manager";

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      const res = await api.get("/vehicles/");
      setVehicles(res.data);
    } catch (err) {
      console.log("Vehicles Error:", err);

      // Don't show popup for view-only users
      console.log(
        err.response?.data?.detail ||
          "Failed to load vehicles"
      );
    }
  };

  const deleteVehicle = async (id) => {
    if (!canManageVehicles) return;

    if (!window.confirm("Delete Vehicle?")) return;

    try {
      await api.delete(`/vehicles/${id}`);

      loadVehicles();
    } catch (err) {
      console.log(err);

      alert(
        err.response?.data?.detail ||
          "Failed to delete vehicle"
      );
    }
  };

  return (
    <Layout>

      {/* ================= PAGE HEADER ================= */}

      <div className="flex justify-between items-center mb-8">

        <div>
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent">
            Vehicles
          </h1>

          <p className="text-slate-400 mt-2">
            Manage fleet vehicles and monitor their status
          </p>
        </div>

        {/* Add Vehicle - Admin / Fleet Manager only */}

        {canManageVehicles && (
          <Link
            to="/add-vehicle"
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-3 rounded-xl font-semibold shadow-lg shadow-blue-900/30 hover:from-blue-500 hover:to-indigo-500 hover:-translate-y-0.5 transition-all"
          >
            + Add Vehicle
          </Link>
        )}

      </div>


      {/* ================= VEHICLE SUMMARY ================= */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">

        {/* Total */}

        <div className="bg-slate-900/70 backdrop-blur-xl border border-blue-400/20 rounded-2xl p-5 shadow-xl">

          <p className="text-slate-400">
            Total Vehicles
          </p>

          <p className="text-3xl font-bold text-blue-400 mt-2">
            {vehicles.length}
          </p>

        </div>


        {/* Available */}

        <div className="bg-slate-900/70 backdrop-blur-xl border border-green-400/20 rounded-2xl p-5 shadow-xl">

          <p className="text-slate-400">
            Available Vehicles
          </p>

          <p className="text-3xl font-bold text-green-400 mt-2">

            {
              vehicles.filter(
                (vehicle) =>
                  vehicle.status?.toLowerCase() ===
                  "available"
              ).length
            }

          </p>

        </div>


        {/* Maintenance */}

        <div className="bg-slate-900/70 backdrop-blur-xl border border-red-400/20 rounded-2xl p-5 shadow-xl">

          <p className="text-slate-400">
            Under Maintenance
          </p>

          <p className="text-3xl font-bold text-red-400 mt-2">

            {
              vehicles.filter(
                (vehicle) =>
                  vehicle.status
                    ?.toLowerCase()
                    .includes("maintenance")
              ).length
            }

          </p>

        </div>

      </div>


      {/* ================= VEHICLE TABLE ================= */}

      <div className="bg-slate-900/75 backdrop-blur-xl border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden">

        {/* Table Header */}

        <div className="p-6 border-b border-slate-800">

          <h2 className="text-xl font-bold text-white">
            Vehicle List
          </h2>

          <p className="text-sm text-slate-500 mt-1">
            All registered vehicles in the fleet
          </p>

        </div>


        <div className="overflow-x-auto">

          <table className="w-full">

            <thead className="bg-blue-600/20">

              <tr>

                <th className="p-4 text-left text-blue-300">
                  ID
                </th>

                <th className="p-4 text-left text-blue-300">
                  Vehicle No
                </th>

                <th className="p-4 text-left text-blue-300">
                  Type
                </th>

                <th className="p-4 text-left text-blue-300">
                  Capacity
                </th>

                <th className="p-4 text-left text-blue-300">
                  Fuel
                </th>

                <th className="p-4 text-left text-blue-300">
                  Fuel Status
                </th>

                <th className="p-4 text-left text-blue-300">
                  Status
                </th>

                {/* Actions only for Admin/Fleet Manager */}

                {canManageVehicles && (
                  <th className="p-4 text-left text-blue-300">
                    Actions
                  </th>
                )}

              </tr>

            </thead>


            <tbody>

              {vehicles.length === 0 ? (

                <tr>

                  <td
                    colSpan={canManageVehicles ? 8 : 7}
                    className="text-center p-10 text-slate-500"
                  >
                    No vehicles found
                  </td>

                </tr>

              ) : (

                vehicles.map((vehicle) => (

                  <tr
                    key={vehicle.vehicle_id}
                    className="border-t border-slate-800 hover:bg-blue-500/5 transition"
                  >

                    {/* ID */}

                    <td className="p-4 text-slate-400">
                      {vehicle.vehicle_id}
                    </td>


                    {/* Vehicle Number */}

                    <td className="p-4">

                      <span className="font-semibold text-white">
                        {vehicle.vehicle_number}
                      </span>

                    </td>


                    {/* Type */}

                    <td className="p-4 text-slate-300">
                      {vehicle.vehicle_type}
                    </td>


                    {/* Capacity */}

                    <td className="p-4 text-slate-300">
                      {vehicle.capacity}
                    </td>


                    {/* Fuel */}

                    <td className="p-4">

                      <div className="flex items-center gap-2">

                        <div className="w-20 h-2 bg-slate-700 rounded-full overflow-hidden">

                          <div
                            className={`h-full rounded-full ${
                              vehicle.fuel_level < 20
                                ? "bg-red-500"
                                : vehicle.fuel_level < 50
                                ? "bg-yellow-400"
                                : "bg-green-500"
                            }`}
                            style={{
                              width: `${Math.min(
                                Math.max(
                                  vehicle.fuel_level || 0,
                                  0
                                ),
                                100
                              )}%`,
                            }}
                          />

                        </div>

                        <span className="text-slate-300 text-sm">
                          {vehicle.fuel_level ?? 0}%
                        </span>

                      </div>

                    </td>


                    {/* Fuel Status */}

                    <td className="p-4">

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                          vehicle.fuel_status
                            ?.toLowerCase()
                            .includes("low")
                            ? "bg-red-500/10 text-red-400 border-red-500/20"
                            : "bg-green-500/10 text-green-400 border-green-500/20"
                        }`}
                      >
                        {vehicle.fuel_status || "-"}
                      </span>

                    </td>


                    {/* Status */}

                    <td className="p-4">

                      <StatusBadge
                        status={vehicle.status}
                      />

                    </td>


                    {/* Actions */}

                    {canManageVehicles && (

                      <td className="p-4">

                        <div className="flex gap-2">

                          <Link
                            to={`/edit-vehicle/${vehicle.vehicle_id}`}
                            className="bg-green-500/10 text-green-400 border border-green-500/20 px-3 py-1.5 rounded-lg hover:bg-green-500/20 transition"
                          >
                            Edit
                          </Link>

                          <button
                            onClick={() =>
                              deleteVehicle(
                                vehicle.vehicle_id
                              )
                            }
                            className="bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1.5 rounded-lg hover:bg-red-500/20 transition"
                          >
                            Delete
                          </button>

                        </div>

                      </td>

                    )}

                  </tr>

                ))

              )}

            </tbody>

          </table>

        </div>

      </div>

    </Layout>
  );
}


/* ================= STATUS BADGE ================= */

function StatusBadge({ status }) {
  const normalizedStatus =
    status?.toLowerCase() || "";

  let classes =
    "bg-slate-500/10 text-slate-300 border-slate-500/20";

  if (normalizedStatus === "available") {
    classes =
      "bg-green-500/10 text-green-400 border-green-500/20";
  }

  if (normalizedStatus === "assigned") {
    classes =
      "bg-blue-500/10 text-blue-400 border-blue-500/20";
  }

  if (normalizedStatus.includes("maintenance")) {
    classes =
      "bg-red-500/10 text-red-400 border-red-500/20";
  }

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold border ${classes}`}
    >
      {status || "Unknown"}
    </span>
  );
}

export default Vehicles;