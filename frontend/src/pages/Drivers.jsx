import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../services/api";

function Drivers() {
  const [drivers, setDrivers] = useState([]);

  // Get logged-in user's role
  const userRole =
  localStorage
    .getItem("role")
    ?.toLowerCase()
    .replace(/\s+/g, "_") || "";

  // Only Administrator and Fleet Manager can manage drivers
  const canManageDrivers =
    userRole === "administrator" ||
    userRole === "fleet_manager";

  useEffect(() => {
    loadDrivers();
  }, []);

  const loadDrivers = async () => {
    try {
      const res = await api.get("/drivers/");
      setDrivers(res.data);
    } catch (err) {
      console.log("Drivers Error:", err);

      console.log(
        err.response?.data?.detail ||
          "Failed to load drivers"
      );
    }
  };

  const deleteDriver = async (id) => {
    if (!canManageDrivers) return;

    if (!window.confirm("Delete Driver?")) return;

    try {
      await api.delete(`/drivers/${id}`);

      loadDrivers();
    } catch (err) {
      console.log(err);

      alert(
        err.response?.data?.detail ||
          "Failed to delete driver"
      );
    }
  };

  return (
    <Layout>

      {/* ================= PAGE HEADER ================= */}

      <div className="flex justify-between items-center mb-8">

        <div>

          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent">
            Drivers
          </h1>

          <p className="text-slate-400 mt-2">
            Manage drivers and monitor fleet personnel
          </p>

        </div>

        {/* Add Driver - Admin / Fleet Manager only */}

        {canManageDrivers && (
          <Link
            to="/add-driver"
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-3 rounded-xl font-semibold shadow-lg shadow-blue-900/30 hover:from-blue-500 hover:to-indigo-500 hover:-translate-y-0.5 transition-all"
          >
            + Add Driver
          </Link>
        )}

      </div>


      {/* ================= DRIVER SUMMARY ================= */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">

        {/* Total */}

        <div className="bg-slate-900/70 backdrop-blur-xl border border-blue-400/20 rounded-2xl p-5 shadow-xl">

          <p className="text-slate-400">
            Total Drivers
          </p>

          <p className="text-3xl font-bold text-blue-400 mt-2">
            {drivers.length}
          </p>

        </div>


        {/* Registered */}

        <div className="bg-slate-900/70 backdrop-blur-xl border border-green-400/20 rounded-2xl p-5 shadow-xl">

          <p className="text-slate-400">
            Registered Drivers
          </p>

          <p className="text-3xl font-bold text-green-400 mt-2">
            {drivers.length}
          </p>

        </div>


        {/* Management */}

        <div className="bg-slate-900/70 backdrop-blur-xl border border-purple-400/20 rounded-2xl p-5 shadow-xl">

          <p className="text-slate-400">
            Driver Management
          </p>

          <p className="text-lg font-semibold text-purple-400 mt-3">
            Active
          </p>

        </div>

      </div>


      {/* ================= DRIVER TABLE ================= */}

      <div className="bg-slate-900/75 backdrop-blur-xl border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden">

        {/* Table Header */}

        <div className="p-6 border-b border-slate-800">

          <h2 className="text-xl font-bold text-white">
            Driver List
          </h2>

          <p className="text-sm text-slate-500 mt-1">
            All registered drivers in the fleet
          </p>

        </div>


        <div className="overflow-x-auto">

          <table className="w-full">

            {/* ================= TABLE HEAD ================= */}

            <thead className="bg-blue-600/20">

              <tr>

                <th className="p-4 text-left text-blue-300">
                  ID
                </th>

                <th className="p-4 text-left text-blue-300">
                  Name
                </th>

                <th className="p-4 text-left text-blue-300">
                  Phone
                </th>

                <th className="p-4 text-left text-blue-300">
                  License
                </th>

                <th className="p-4 text-left text-blue-300">
                  Status
                </th>

                {canManageDrivers && (
                  <th className="p-4 text-left text-blue-300">
                    Actions
                  </th>
                )}

              </tr>

            </thead>


            {/* ================= TABLE BODY ================= */}

            <tbody>

              {drivers.length === 0 ? (

                <tr>

                  <td
                    colSpan={canManageDrivers ? 6 : 5}
                    className="text-center p-10 text-slate-500"
                  >
                    No drivers found
                  </td>

                </tr>

              ) : (

                drivers.map((driver) => (

                  <tr
                    key={driver.driver_id}
                    className="border-t border-slate-800 hover:bg-blue-500/5 transition"
                  >

                    {/* ID */}

                    <td className="p-4 text-slate-400">
                      {driver.driver_id}
                    </td>


                    {/* Name */}

                    <td className="p-4">

                      <div className="flex items-center gap-3">

                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                          {driver.name
                            ? driver.name
                                .charAt(0)
                                .toUpperCase()
                            : "D"}
                        </div>

                        <span className="font-semibold text-white">
                          {driver.name}
                        </span>

                      </div>

                    </td>


                    {/* Phone */}

                    <td className="p-4 text-slate-300">
                      {driver.phone || "-"}
                    </td>


                    {/* License */}

                    <td className="p-4">

                      <span className="bg-blue-500/10 text-blue-300 border border-blue-500/20 px-3 py-1 rounded-lg text-sm">
                        {driver.license_number || "-"}
                      </span>

                    </td>


                    {/* ================= STATUS ================= */}

                    <td className="p-4">

                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold border ${
                          driver.status === "Available"
                            ? "bg-green-500/20 text-green-400 border-green-500/30"
                            : driver.status === "Assigned"
                            ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                            : "bg-red-500/20 text-red-400 border-red-500/30"
                        }`}
                      >
                        {driver.status || "Unknown"}
                      </span>

                    </td>


                    {/* ================= ACTIONS ================= */}

                    {canManageDrivers && (

                      <td className="p-4">

                        <div className="flex gap-2">

                          <Link
                            to={`/edit-driver/${driver.driver_id}`}
                            className="bg-green-500/10 text-green-400 border border-green-500/20 px-3 py-1.5 rounded-lg hover:bg-green-500/20 transition"
                          >
                            Edit
                          </Link>

                          <button
                            onClick={() =>
                              deleteDriver(
                                driver.driver_id
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

export default Drivers;