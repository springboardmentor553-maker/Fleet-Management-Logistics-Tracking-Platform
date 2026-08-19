import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../services/api";

function FuelRecords() {
  const [fuelRecords, setFuelRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  // ================= USER ROLE =================

  const userRole = (
    localStorage.getItem("role") || ""
  )
    .toLowerCase()
    .trim()
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ");

  // Administrator and Fleet Manager can manage fuel
  const canManageFuel =
    userRole === "administrator" ||
    userRole === "fleet manager";

  // ================= LOAD FUEL RECORDS =================

  useEffect(() => {
    loadFuelRecords();
  }, []);

  const loadFuelRecords = async () => {
    try {
      setLoading(true);

      const res = await api.get("/fuel-records/");

      setFuelRecords(res.data);
    } catch (err) {
      console.log("Fuel Records Error:", err);

      alert(
        err.response?.data?.detail ||
          "Failed to load fuel records"
      );
    } finally {
      setLoading(false);
    }
  };

  // ================= DELETE =================

  const deleteFuel = async (id) => {
    if (!canManageFuel) return;

    if (!window.confirm("Delete this fuel record?")) {
      return;
    }

    try {
      await api.delete(`/fuel-records/${id}`);

      alert("Fuel record deleted successfully");

      loadFuelRecords();
    } catch (err) {
      console.log("Delete Fuel Error:", err);

      alert(
        err.response?.data?.detail ||
          "Failed to delete fuel record"
      );
    }
  };

  // ================= LOADING =================

  if (loading) {
    return (
      <Layout>

        <div className="flex justify-center items-center py-20">

          <p className="text-cyan-400 text-lg">
            Loading fuel records...
          </p>

        </div>

      </Layout>
    );
  }

  // ================= PAGE =================

  return (
    <Layout>

      {/* ================= HEADER ================= */}

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">

        <div className="min-w-0">

          <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-cyan-300 via-cyan-400 to-teal-300 bg-clip-text text-transparent">
            Fuel Records
          </h1>

          <p className="text-slate-400 mt-2 text-sm sm:text-base">
            Monitor vehicle fuel transactions and consumption
          </p>

        </div>


        {/* ADD FUEL */}

        {canManageFuel && (
          <Link
            to="/add-fuel"
            className="w-full sm:w-auto text-center bg-gradient-to-r from-cyan-500 to-teal-500 text-white px-5 py-3 rounded-xl font-semibold shadow-lg shadow-cyan-900/30 hover:from-cyan-400 hover:to-teal-400 transition whitespace-nowrap"
          >
            + Add Fuel Record
          </Link>
        )}

      </div>


      {/* ================= SUMMARY ================= */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mb-8">

        {/* TOTAL RECORDS */}

        <div className="bg-slate-900/70 border border-cyan-400/20 rounded-2xl p-5 shadow-xl min-w-0">

          <p className="text-slate-400">
            Total Records
          </p>

          <p className="text-3xl font-bold text-cyan-400 mt-2">
            {fuelRecords.length}
          </p>

        </div>


        {/* TOTAL FUEL */}

        <div className="bg-slate-900/70 border border-teal-400/20 rounded-2xl p-5 shadow-xl min-w-0">

          <p className="text-slate-400">
            Total Fuel
          </p>

          <p className="text-2xl sm:text-3xl font-bold text-teal-300 mt-2 break-words">

            {fuelRecords
              .reduce(
                (total, record) =>
                  total +
                  Number(
                    record.fuel_quantity || 0
                  ),
                0
              )
              .toFixed(2)}{" "}

            L

          </p>

        </div>


        {/* TOTAL COST */}

        <div className="bg-slate-900/70 border border-emerald-400/20 rounded-2xl p-5 shadow-xl min-w-0">

          <p className="text-slate-400">
            Total Cost
          </p>

          <p className="text-2xl sm:text-3xl font-bold text-emerald-400 mt-2 break-words">

            ₹
            {fuelRecords
              .reduce(
                (total, record) =>
                  total +
                  Number(
                    record.fuel_cost || 0
                  ),
                0
              )
              .toFixed(2)}

          </p>

        </div>

      </div>


      {/* ================= TABLE ================= */}

      <div className="bg-slate-900/75 backdrop-blur-xl border border-cyan-500/20 rounded-2xl shadow-2xl overflow-hidden w-full">

        {/* TABLE HEADER */}

        <div className="p-4 sm:p-6 border-b border-slate-800">

          <h2 className="text-xl font-bold text-white">
            Fuel Records
          </h2>

          <p className="text-sm text-slate-500 mt-1">
            Recent vehicle fuel transactions
          </p>

        </div>


        {/* ================= RESPONSIVE TABLE ================= */}

        <div className="w-full overflow-x-auto">

          <table className="w-full min-w-[900px]">

            <thead className="bg-cyan-500/10">

              <tr>

                <th className="p-4 text-left text-cyan-300 whitespace-nowrap">
                  ID
                </th>

                <th className="p-4 text-left text-cyan-300 whitespace-nowrap">
                  Vehicle
                </th>

                <th className="p-4 text-left text-cyan-300 whitespace-nowrap">
                  Driver
                </th>

                <th className="p-4 text-left text-cyan-300 whitespace-nowrap">
                  Quantity
                </th>

                <th className="p-4 text-left text-cyan-300 whitespace-nowrap">
                  Cost
                </th>

                <th className="p-4 text-left text-cyan-300 whitespace-nowrap">
                  Fuel Station
                </th>

                <th className="p-4 text-left text-cyan-300 whitespace-nowrap">
                  Date
                </th>

                {canManageFuel && (
                  <th className="p-4 text-left text-cyan-300 whitespace-nowrap">
                    Actions
                  </th>
                )}

              </tr>

            </thead>


            <tbody>

              {fuelRecords.length === 0 ? (

                <tr>

                  <td
                    colSpan={
                      canManageFuel ? 8 : 7
                    }
                    className="text-center p-10 text-slate-500"
                  >
                    No fuel records found
                  </td>

                </tr>

              ) : (

                fuelRecords.map((record) => (

                  <tr
                    key={record.fuel_record_id}
                    className="border-t border-slate-800 hover:bg-cyan-500/5 transition"
                  >

                    {/* ID */}

                    <td className="p-4 text-slate-400 whitespace-nowrap">
                      {record.fuel_record_id}
                    </td>


                    {/* VEHICLE */}

                    <td className="p-4 whitespace-nowrap">

                      <span className="bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 px-3 py-1.5 rounded-lg">
                        Vehicle #{record.vehicle_id}
                      </span>

                    </td>


                    {/* DRIVER */}

                    <td className="p-4 whitespace-nowrap">

                      <span className="bg-teal-500/10 text-teal-300 border border-teal-500/20 px-3 py-1.5 rounded-lg">
                        Driver #{record.driver_id}
                      </span>

                    </td>


                    {/* QUANTITY */}

                    <td className="p-4 whitespace-nowrap">

                      <span className="text-cyan-400 font-bold">
                        {record.fuel_quantity} L
                      </span>

                    </td>


                    {/* COST */}

                    <td className="p-4 whitespace-nowrap">

                      <span className="text-emerald-400 font-bold">
                        ₹{record.fuel_cost}
                      </span>

                    </td>


                    {/* FUEL STATION */}

                    <td className="p-4 text-slate-300 whitespace-nowrap">
                      {record.fuel_station || "-"}
                    </td>


                    {/* DATE */}

                    <td className="p-4 text-slate-400 whitespace-nowrap">

                      {record.fuel_date
                        ? new Date(
                            record.fuel_date
                          ).toLocaleString()
                        : "-"}

                    </td>


                    {/* ACTIONS */}

                    {canManageFuel && (

                      <td className="p-4 whitespace-nowrap">

                        <div className="flex gap-2">

                          {/* EDIT */}

                          <Link
                            to={`/edit-fuel/${record.fuel_record_id}`}
                            className="bg-teal-500/10 text-teal-300 border border-teal-500/20 px-3 py-1.5 rounded-lg hover:bg-teal-500/20 transition"
                          >
                            Edit
                          </Link>


                          {/* DELETE */}

                          <button
                            onClick={() =>
                              deleteFuel(
                                record.fuel_record_id
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

export default FuelRecords;