import { useEffect, useState } from "react";
import {
  FaTools,
  FaTruck,
} from "react-icons/fa";

import {
  getDriverDashboard,
} from "../services/driverDashboardService";


function DriverMaintenance() {

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  useEffect(() => {

    const loadData = async () => {

      try {

        const result =
          await getDriverDashboard();

        setData(result);

      } catch (err) {

        console.error(err);

        setError(
          err.response?.data?.detail ||
          "Failed to load maintenance history."
        );

      } finally {

        setLoading(false);

      }

    };

    loadData();

  }, []);


  if (loading) {

    return (
      <div className="min-h-full bg-slate-950 text-white flex items-center justify-center">
        Loading maintenance history...
      </div>
    );

  }


  if (error) {

    return (
      <div className="min-h-full bg-slate-950 p-6 text-red-400">
        {error}
      </div>
    );

  }


  const vehicle = data?.assigned_vehicle;
  const records = data?.maintenance || [];


  return (
    <div className="min-h-full bg-slate-950 text-slate-100 p-6">


      <div className="mb-8">

        <div className="flex items-center gap-3">

          <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <FaTools />
          </div>

          <div>

            <h1 className="text-3xl font-bold">
              My Vehicle Maintenance
            </h1>

            <p className="text-slate-400 mt-1">
              Maintenance history of your assigned vehicle.
            </p>

          </div>

        </div>

      </div>


      {/* VEHICLE */}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6">

        <div className="flex items-center gap-4">

          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <FaTruck />
          </div>

          <div>

            <p className="text-xs text-slate-500 uppercase">
              Assigned Vehicle
            </p>

            <p className="text-xl font-bold text-white mt-1">
              {vehicle?.vehicle_number || "No vehicle assigned"}
            </p>

          </div>

        </div>

      </div>


      {/* HISTORY */}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">

        <div className="p-6 border-b border-slate-800">

          <h2 className="text-lg font-semibold">
            Maintenance History
          </h2>

        </div>


        {records.length === 0 ? (

          <div className="p-12 text-center text-slate-500">
            No maintenance history available.
          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full min-w-[850px] text-sm">

              <thead className="bg-slate-800/60">

                <tr>

                  <th className="text-left px-5 py-4 text-slate-400">
                    Category
                  </th>

                  <th className="text-left px-5 py-4 text-slate-400">
                    Service Date
                  </th>

                  <th className="text-left px-5 py-4 text-slate-400">
                    Next Service
                  </th>

                  <th className="text-left px-5 py-4 text-slate-400">
                    Provider
                  </th>

                  <th className="text-left px-5 py-4 text-slate-400">
                    Cost
                  </th>

                  <th className="text-left px-5 py-4 text-slate-400">
                    Status
                  </th>

                </tr>

              </thead>


              <tbody className="divide-y divide-slate-800">

                {records.map((record) => (

                  <tr
                    key={record.id}
                    className="hover:bg-slate-800/30"
                  >

                    <td className="px-5 py-4 text-white">
                      {record.maintenance_category}
                    </td>

                    <td className="px-5 py-4 text-slate-300">
                      {record.service_date
                        ? new Date(
                            record.service_date
                          ).toLocaleDateString()
                        : "-"}
                    </td>

                    <td className="px-5 py-4 text-slate-300">
                      {record.next_service_date
                        ? new Date(
                            record.next_service_date
                          ).toLocaleDateString()
                        : "-"}
                    </td>

                    <td className="px-5 py-4 text-slate-300">
                      {record.service_provider}
                    </td>

                    <td className="px-5 py-4 text-slate-300">
                      ₹{Number(
                        record.service_cost || 0
                      ).toLocaleString()}
                    </td>

                    <td className="px-5 py-4">

                      <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs">
                        {record.maintenance_status}
                      </span>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </div>

    </div>
  );
}


export default DriverMaintenance;