import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../services/api";

function DriverList() {
  const navigate = useNavigate();

  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);

  // =====================================================
  // FETCH DRIVERS
  // =====================================================

  const fetchDrivers = async () => {
    try {
      setLoading(true);

      const response = await api.get("/drivers/");

      setDrivers(response.data);
    } catch (error) {
      console.error(
        "Error fetching drivers:",
        error
      );

      const detail =
        error.response?.data?.detail;

      if (typeof detail === "string") {
        alert(detail);
      } else {
        alert("Failed to load drivers");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  // =====================================================
  // DELETE DRIVER
  // =====================================================

  const deleteDriver = async (driverId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this driver?"
    );

    if (!confirmDelete) {
      return;
    }

    try {
      await api.delete(
        `/drivers/${driverId}`
      );

      alert(
        "Driver deleted successfully"
      );

      fetchDrivers();
    } catch (error) {
      console.error(
        "Delete error:",
        error
      );

      const detail =
        error.response?.data?.detail;

      alert(
        detail ||
          "Failed to delete driver"
      );
    }
  };

  // =====================================================
  // STATUS COLOR
  // =====================================================

  const getStatusClass = (status) => {
    if (status === "Available") {
      return "bg-green-500/10 text-green-400 border-green-500/20";
    }

    if (status === "Assigned") {
      return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
    }

    if (status === "Unavailable") {
      return "bg-red-500/10 text-red-400 border-red-500/20";
    }

    return "bg-slate-500/10 text-slate-400 border-slate-500/20";
  };

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
          Driver List
        </h1>

        <p className="text-slate-400 mt-2">
          All registered drivers in the fleet
        </p>

      </div>


      {/* =================================================
          LOADING / EMPTY / TABLE
      ================================================= */}

      {loading ? (

        <div className="flex justify-center items-center py-16">

          <div className="text-center">

            <div className="text-4xl mb-3">
              👨‍✈️
            </div>

            <p className="text-cyan-400">
              Loading drivers...
            </p>

          </div>

        </div>

      ) : drivers.length === 0 ? (

        <div className="bg-slate-900/70 border border-cyan-500/10 rounded-2xl text-center py-16">

          <div className="text-5xl mb-4">
            👨‍✈️
          </div>

          <p className="text-slate-400">
            No drivers found
          </p>

        </div>

      ) : (

        <div className="bg-slate-900/75 backdrop-blur-xl border border-cyan-500/10 rounded-2xl shadow-2xl overflow-hidden">

          {/* TABLE HEADER */}

          <div className="p-6 border-b border-slate-800">

            <h2 className="text-xl font-bold text-white">
              Registered Drivers
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Driver information and availability
            </p>

          </div>


          {/* RESPONSIVE TABLE */}

          <div className="overflow-x-auto">

            <table className="w-full min-w-[900px] text-left border-collapse">

              <thead>

                <tr className="bg-cyan-500/10">

                  <th className="px-6 py-4 font-semibold text-cyan-300">
                    ID
                  </th>

                  <th className="px-6 py-4 font-semibold text-cyan-300">
                    Name
                  </th>

                  <th className="px-6 py-4 font-semibold text-cyan-300">
                    Phone
                  </th>

                  <th className="px-6 py-4 font-semibold text-cyan-300">
                    License
                  </th>

                  <th className="px-6 py-4 font-semibold text-cyan-300">
                    Status
                  </th>

                  <th className="px-6 py-4 font-semibold text-cyan-300">
                    Actions
                  </th>

                </tr>

              </thead>


              {/* TABLE BODY */}

              <tbody>

                {drivers.map((driver) => (

                  <tr
                    key={driver.driver_id}
                    className="border-t border-slate-800 bg-slate-900/60 hover:bg-cyan-500/5 transition"
                  >

                    {/* ID */}

                    <td className="px-6 py-5 text-slate-400">
                      {driver.driver_id}
                    </td>


                    {/* NAME */}

                    <td className="px-6 py-5">

                      <div className="flex items-center gap-4">

                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-cyan-900/20">

                          {driver.name
                            ? driver.name
                                .charAt(0)
                                .toUpperCase()
                            : "D"}

                        </div>

                        <span className="text-white font-semibold">
                          {driver.name}
                        </span>

                      </div>

                    </td>


                    {/* PHONE */}

                    <td className="px-6 py-5 text-slate-300">
                      {driver.phone}
                    </td>


                    {/* LICENSE */}

                    <td className="px-6 py-5">

                      <span className="px-3 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-300">
                        {driver.license_number}
                      </span>

                    </td>


                    {/* STATUS */}

                    <td className="px-6 py-5">

                      <span
                        className={`inline-block px-3 py-1 rounded-full border text-sm font-semibold ${getStatusClass(
                          driver.status
                        )}`}
                      >
                        {driver.status ||
                          "Unknown"}
                      </span>

                    </td>


                    {/* ACTIONS */}

                    <td className="px-6 py-5">

                      <div className="flex gap-3">

                        <button
                          onClick={() =>
                            navigate(
                              `/drivers/edit/${driver.driver_id}`
                            )
                          }
                          className="px-4 py-2 rounded-lg border border-teal-500/30 text-teal-400 hover:bg-teal-500/10 transition"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() =>
                            deleteDriver(
                              driver.driver_id
                            )
                          }
                          className="px-4 py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition"
                        >
                          Delete
                        </button>

                      </div>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </div>

      )}

    </Layout>
  );
}

export default DriverList;