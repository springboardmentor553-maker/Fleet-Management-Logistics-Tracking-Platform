import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../services/api";

function DriverList() {
  const navigate = useNavigate();

  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDrivers = async () => {
    try {
      setLoading(true);

      const response = await api.get("/drivers/");

      setDrivers(response.data);
    } catch (error) {
      console.error("Error fetching drivers:", error);

      const detail = error.response?.data?.detail;

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

  const deleteDriver = async (driverId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this driver?"
    );

    if (!confirmDelete) {
      return;
    }

    try {
      await api.delete(`/drivers/${driverId}`);

      alert("Driver deleted successfully");

      fetchDrivers();
    } catch (error) {
      console.error("Delete error:", error);

      const detail = error.response?.data?.detail;

      alert(detail || "Failed to delete driver");
    }
  };

  const getStatusClass = (status) => {
    if (status === "Available") {
      return "bg-green-500/20 text-green-400 border-green-500/30";
    }

    if (status === "Assigned") {
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    }

    if (status === "Unavailable") {
      return "bg-red-500/20 text-red-400 border-red-500/30";
    }

    return "bg-slate-500/20 text-slate-400 border-slate-500/30";
  };

  return (
    <Layout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent">
          Driver List
        </h1>

        <p className="text-slate-400 mt-2">
          All registered drivers in the fleet
        </p>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="text-center text-slate-400 py-10">
          Loading drivers...
        </div>
      ) : drivers.length === 0 ? (
        <div className="text-center text-slate-400 py-10">
          No drivers found
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left border-collapse">
            {/* Table Header */}
            <thead>
              <tr className="bg-blue-900/60 text-blue-300">
                <th className="px-6 py-4 font-semibold">ID</th>

                <th className="px-6 py-4 font-semibold">
                  Name
                </th>

                <th className="px-6 py-4 font-semibold">
                  Phone
                </th>

                <th className="px-6 py-4 font-semibold">
                  License
                </th>

                <th className="px-6 py-4 font-semibold">
                  Status
                </th>

                <th className="px-6 py-4 font-semibold">
                  Actions
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody>
              {drivers.map((driver) => (
                <tr
                  key={driver.driver_id}
                  className="border-t border-slate-800 bg-slate-900/60 hover:bg-slate-800/70 transition"
                >
                  {/* ID */}
                  <td className="px-6 py-5 text-slate-400">
                    {driver.driver_id}
                  </td>

                  {/* Name */}
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                        {driver.name
                          ? driver.name.charAt(0).toUpperCase()
                          : "D"}
                      </div>

                      <span className="text-white font-semibold">
                        {driver.name}
                      </span>
                    </div>
                  </td>

                  {/* Phone */}
                  <td className="px-6 py-5 text-slate-300">
                    {driver.phone}
                  </td>

                  {/* License */}
                  <td className="px-6 py-5">
                    <span className="px-3 py-1 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-300">
                      {driver.license_number}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-5">
                    <span
                      className={`inline-block px-3 py-1 rounded-full border text-sm font-semibold ${getStatusClass(
                        driver.status
                      )}`}
                    >
                      {driver.status || "Unknown"}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-5">
                    <div className="flex gap-3">
                      <button
                        onClick={() =>
                          navigate(
                            `/drivers/edit/${driver.driver_id}`
                          )
                        }
                        className="px-4 py-2 rounded-lg border border-green-500/30 text-green-400 hover:bg-green-500/10 transition"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() =>
                          deleteDriver(driver.driver_id)
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
      )}
    </Layout>
  );
}

export default DriverList;