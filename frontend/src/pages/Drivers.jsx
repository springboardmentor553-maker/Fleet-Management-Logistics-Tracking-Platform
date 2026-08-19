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

      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">

        <div>

          <p className="text-teal-300 text-sm font-medium mb-2">
            FleetFlow • People Center
          </p>

          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-teal-300 via-cyan-300 to-teal-400 bg-clip-text text-transparent">
            Fleet Drivers
          </h1>

          <p className="text-teal-100/70 mt-2">
            Manage drivers and monitor fleet personnel
          </p>

        </div>


        {/* Add Driver */}

        {canManageDrivers && (
          <Link
            to="/add-driver"
            className="w-fit bg-gradient-to-r from-teal-400 to-cyan-400 text-[#03181b] px-5 py-3 rounded-xl font-semibold shadow-lg shadow-teal-900/30 hover:from-teal-300 hover:to-cyan-300 hover:-translate-y-0.5 transition-all"
          >
            + Add Driver
          </Link>
        )}

      </div>


      {/* ================= DRIVER SUMMARY ================= */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">

        {/* TOTAL */}

        <div className="bg-[#062126]/80 backdrop-blur-xl border border-teal-400/20 rounded-2xl p-5 shadow-xl">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-teal-100/70">
                Total Drivers
              </p>

              <p className="text-3xl font-bold text-teal-300 mt-2">
                {drivers.length}
              </p>

            </div>

            <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center text-2xl">
              👥
            </div>

          </div>

        </div>


        {/* REGISTERED */}

        <div className="bg-[#062126]/80 backdrop-blur-xl border border-cyan-400/20 rounded-2xl p-5 shadow-xl">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-teal-100/70">
                Registered Drivers
              </p>

              <p className="text-3xl font-bold text-cyan-300 mt-2">
                {drivers.length}
              </p>

            </div>

            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-2xl">
              ✓
            </div>

          </div>

        </div>


        {/* MANAGEMENT */}

        <div className="bg-[#062126]/80 backdrop-blur-xl border border-teal-400/20 rounded-2xl p-5 shadow-xl">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-teal-100/70">
                Driver Management
              </p>

              <p className="text-lg font-semibold text-teal-300 mt-3">
                Active
              </p>

            </div>

            <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center text-2xl">
              🧑‍✈️
            </div>

          </div>

        </div>

      </div>


      {/* ================= DRIVER TABLE ================= */}

      <div className="bg-[#062126]/80 backdrop-blur-xl border border-teal-900/60 rounded-2xl shadow-2xl overflow-hidden">

        {/* TABLE HEADER */}

        <div className="p-6 border-b border-teal-900/60">

          <h2 className="text-xl font-bold text-teal-50">
            Driver Registry
          </h2>

          <p className="text-sm text-teal-200/50 mt-1">
            All registered drivers in your fleet
          </p>

        </div>


        <div className="overflow-x-auto">

          <table className="w-full">

            {/* ================= TABLE HEAD ================= */}

            <thead className="bg-teal-500/10">

              <tr>

                <th className="p-4 text-left text-teal-300">
                  ID
                </th>

                <th className="p-4 text-left text-teal-300">
                  Name
                </th>

                <th className="p-4 text-left text-teal-300">
                  Phone
                </th>

                <th className="p-4 text-left text-teal-300">
                  License
                </th>

                <th className="p-4 text-left text-teal-300">
                  Status
                </th>

                {canManageDrivers && (
                  <th className="p-4 text-left text-teal-300">
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
                    className="text-center p-10 text-teal-200/50"
                  >
                    No drivers found
                  </td>

                </tr>

              ) : (

                drivers.map((driver) => (

                  <tr
                    key={driver.driver_id}
                    className="border-t border-teal-900/60 hover:bg-teal-500/5 transition"
                  >

                    {/* ID */}

                    <td className="p-4 text-teal-100/70">
                      {driver.driver_id}
                    </td>


                    {/* NAME */}

                    <td className="p-4">

                      <div className="flex items-center gap-3">

                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-cyan-400 flex items-center justify-center text-[#03181b] font-bold">
                          {driver.name
                            ? driver.name
                                .charAt(0)
                                .toUpperCase()
                            : "D"}
                        </div>

                        <span className="font-semibold text-teal-50">
                          {driver.name}
                        </span>

                      </div>

                    </td>


                    {/* PHONE */}

                    <td className="p-4 text-teal-100/70">
                      {driver.phone || "-"}
                    </td>


                    {/* LICENSE */}

                    <td className="p-4">

                      <span className="bg-teal-500/10 text-teal-300 border border-teal-400/20 px-3 py-1 rounded-lg text-sm">
                        {driver.license_number || "-"}
                      </span>

                    </td>


                    {/* STATUS */}

                    <td className="p-4">

                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold border ${
                          driver.status === "Available"
                            ? "bg-teal-500/10 text-teal-300 border-teal-400/20"
                            : driver.status === "Assigned"
                            ? "bg-cyan-500/10 text-cyan-300 border-cyan-400/20"
                            : "bg-rose-500/10 text-rose-300 border-rose-400/20"
                        }`}
                      >
                        {driver.status || "Unknown"}
                      </span>

                    </td>


                    {/* ACTIONS */}

                    {canManageDrivers && (

                      <td className="p-4">

                        <div className="flex gap-2">

                          <Link
                            to={`/edit-driver/${driver.driver_id}`}
                            className="bg-teal-500/10 text-teal-300 border border-teal-400/20 px-3 py-1.5 rounded-lg hover:bg-teal-500/20 transition"
                          >
                            Edit
                          </Link>

                          <button
                            onClick={() =>
                              deleteDriver(
                                driver.driver_id
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

export default Drivers;