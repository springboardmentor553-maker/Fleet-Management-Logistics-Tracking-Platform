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

      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">

        <div>

          <p className="text-teal-300 text-sm font-medium mb-2">
            FleetFlow • Vehicle Center
          </p>

          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-teal-300 to-cyan-300 bg-clip-text text-transparent">
            Fleet Vehicles
          </h1>

          <p className="text-teal-100/70 mt-2">
            Manage vehicles and keep track of fleet availability
          </p>

        </div>


        {/* Add Vehicle */}

        {canManageVehicles && (
          <Link
            to="/add-vehicle"
            className="w-fit bg-gradient-to-r from-teal-400 to-cyan-400 text-[#03181b] px-5 py-3 rounded-xl font-semibold shadow-lg shadow-teal-900/30 hover:from-teal-300 hover:to-cyan-300 hover:-translate-y-0.5 transition-all"
          >
            + Add Vehicle
          </Link>
        )}

      </div>


      {/* ================= VEHICLE SUMMARY ================= */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">

        {/* TOTAL */}

        <div className="bg-[#062126]/80 backdrop-blur-xl border border-teal-400/20 rounded-2xl p-5 shadow-xl">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-teal-100/70">
                Fleet Vehicles
              </p>

              <p className="text-3xl font-bold text-teal-300 mt-2">
                {vehicles.length}
              </p>

            </div>

            <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center text-2xl">
              🚚
            </div>

          </div>

        </div>


        {/* AVAILABLE */}

        <div className="bg-[#062126]/80 backdrop-blur-xl border border-teal-400/20 rounded-2xl p-5 shadow-xl">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-teal-100/70">
                Available Vehicles
              </p>

              <p className="text-3xl font-bold text-cyan-300 mt-2">

                {
                  vehicles.filter(
                    (vehicle) =>
                      vehicle.status?.toLowerCase() ===
                      "available"
                  ).length
                }

              </p>

            </div>

            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-2xl">
              ✓
            </div>

          </div>

        </div>


        {/* MAINTENANCE */}

        <div className="bg-[#062126]/80 backdrop-blur-xl border border-teal-400/20 rounded-2xl p-5 shadow-xl">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-teal-100/70">
                Service Required
              </p>

              <p className="text-3xl font-bold text-rose-300 mt-2">

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

            <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center text-2xl">
              🔧
            </div>

          </div>

        </div>

      </div>


      {/* ================= VEHICLE TABLE ================= */}

      <div className="bg-[#062126]/80 backdrop-blur-xl border border-teal-900/60 rounded-2xl shadow-2xl overflow-hidden">

        {/* TABLE HEADER */}

        <div className="p-6 border-b border-teal-900/60">

          <h2 className="text-xl font-bold text-teal-50">
            Vehicle Registry
          </h2>

          <p className="text-sm text-teal-200/50 mt-1">
            All registered vehicles in your fleet
          </p>

        </div>


        <div className="overflow-x-auto">

          <table className="w-full">

            {/* TABLE HEAD */}

            <thead className="bg-teal-500/10">

              <tr>

                <th className="p-4 text-left text-teal-300">
                  ID
                </th>

                <th className="p-4 text-left text-teal-300">
                  Vehicle No
                </th>

                <th className="p-4 text-left text-teal-300">
                  Type
                </th>

                <th className="p-4 text-left text-teal-300">
                  Capacity
                </th>

                <th className="p-4 text-left text-teal-300">
                  Fuel
                </th>

                <th className="p-4 text-left text-teal-300">
                  Fuel Status
                </th>

                <th className="p-4 text-left text-teal-300">
                  Status
                </th>

                {canManageVehicles && (
                  <th className="p-4 text-left text-teal-300">
                    Actions
                  </th>
                )}

              </tr>

            </thead>


            {/* TABLE BODY */}

            <tbody>

              {vehicles.length === 0 ? (

                <tr>

                  <td
                    colSpan={canManageVehicles ? 8 : 7}
                    className="text-center p-10 text-teal-200/50"
                  >
                    No vehicles found
                  </td>

                </tr>

              ) : (

                vehicles.map((vehicle) => (

                  <tr
                    key={vehicle.vehicle_id}
                    className="border-t border-teal-900/60 hover:bg-teal-500/5 transition"
                  >

                    {/* ID */}

                    <td className="p-4 text-teal-100/70">
                      {vehicle.vehicle_id}
                    </td>


                    {/* VEHICLE NUMBER */}

                    <td className="p-4">

                      <span className="font-semibold text-teal-50">
                        {vehicle.vehicle_number}
                      </span>

                    </td>


                    {/* TYPE */}

                    <td className="p-4 text-teal-100/70">
                      {vehicle.vehicle_type}
                    </td>


                    {/* CAPACITY */}

                    <td className="p-4 text-teal-100/70">
                      {vehicle.capacity}
                    </td>


                    {/* FUEL */}

                    <td className="p-4">

                      <div className="flex items-center gap-2">

                        <div className="w-20 h-2 bg-[#0a2b30] rounded-full overflow-hidden">

                          <div
                            className={`h-full rounded-full ${
                              vehicle.fuel_level < 20
                                ? "bg-rose-400"
                                : vehicle.fuel_level < 50
                                ? "bg-amber-300"
                                : "bg-teal-300"
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

                        <span className="text-teal-100/70 text-sm">
                          {vehicle.fuel_level ?? 0}%
                        </span>

                      </div>

                    </td>


                    {/* FUEL STATUS */}

                    <td className="p-4">

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                          vehicle.fuel_status
                            ?.toLowerCase()
                            .includes("low")
                            ? "bg-rose-500/10 text-rose-300 border-rose-400/20"
                            : "bg-teal-500/10 text-teal-300 border-teal-400/20"
                        }`}
                      >
                        {vehicle.fuel_status || "-"}
                      </span>

                    </td>


                    {/* STATUS */}

                    <td className="p-4">

                      <StatusBadge
                        status={vehicle.status}
                      />

                    </td>


                    {/* ACTIONS */}

                    {canManageVehicles && (

                      <td className="p-4">

                        <div className="flex gap-2">

                          <Link
                            to={`/edit-vehicle/${vehicle.vehicle_id}`}
                            className="bg-teal-500/10 text-teal-300 border border-teal-400/20 px-3 py-1.5 rounded-lg hover:bg-teal-500/20 transition"
                          >
                            Edit
                          </Link>

                          <button
                            onClick={() =>
                              deleteVehicle(
                                vehicle.vehicle_id
                              )
                            }
                            className="bg-rose-500/10 text-rose-300 border border-rose-400/20 px-3 py-1.5 rounded-lg hover:bg-rose-500/20 transition"
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
    "bg-[#0a2b30] text-teal-100/70 border-teal-900/60";


  if (normalizedStatus === "available") {

    classes =
      "bg-teal-500/10 text-teal-300 border-teal-400/20";

  }


  if (normalizedStatus === "assigned") {

    classes =
      "bg-cyan-500/10 text-cyan-300 border-cyan-400/20";

  }


  if (normalizedStatus.includes("maintenance")) {

    classes =
      "bg-rose-500/10 text-rose-300 border-rose-400/20";

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