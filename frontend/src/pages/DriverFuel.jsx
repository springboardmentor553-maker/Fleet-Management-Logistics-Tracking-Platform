import { useEffect, useState } from "react";
import {
  FaGasPump,
  FaTruck,
} from "react-icons/fa";

import {
  getDriverDashboard,
} from "../services/driverDashboardService";


function DriverFuel() {

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
          "Failed to load fuel records."
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
        Loading fuel records...
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
  const records = data?.fuel || [];


  const totalFuel = records.reduce(
    (sum, record) =>
      sum + Number(
        record.fuel_quantity || 0
      ),
    0
  );


  const totalCost = records.reduce(
    (sum, record) =>
      sum + Number(
        record.fuel_cost || 0
      ),
    0
  );


  return (
    <div className="min-h-full bg-slate-950 text-slate-100 p-6">


      <div className="mb-8">

        <div className="flex items-center gap-3">

          <div className="w-11 h-11 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
            <FaGasPump />
          </div>

          <div>

            <h1 className="text-3xl font-bold">
              My Vehicle Fuel
            </h1>

            <p className="text-slate-400 mt-1">
              Fuel records of your assigned vehicle.
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


      {/* SUMMARY */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">

          <p className="text-sm text-slate-500">
            Total Fuel
          </p>

          <p className="text-3xl font-bold text-white mt-2">
            {totalFuel.toFixed(2)}
          </p>

          <p className="text-xs text-slate-600 mt-1">
            Litres
          </p>

        </div>


        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">

          <p className="text-sm text-slate-500">
            Total Fuel Cost
          </p>

          <p className="text-3xl font-bold text-white mt-2">
            ₹{totalCost.toLocaleString()}
          </p>

        </div>

      </div>


      {/* RECORDS */}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">

        <div className="p-6 border-b border-slate-800">

          <h2 className="text-lg font-semibold">
            Fuel History
          </h2>

        </div>


        {records.length === 0 ? (

          <div className="p-12 text-center text-slate-500">
            No fuel records available.
          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full min-w-[850px] text-sm">

              <thead className="bg-slate-800/60">

                <tr>

                  <th className="text-left px-5 py-4 text-slate-400">
                    Date
                  </th>

                  <th className="text-left px-5 py-4 text-slate-400">
                    Fuel Station
                  </th>

                  <th className="text-left px-5 py-4 text-slate-400">
                    Quantity
                  </th>

                  <th className="text-left px-5 py-4 text-slate-400">
                    Cost
                  </th>

                  <th className="text-left px-5 py-4 text-slate-400">
                    Odometer
                  </th>

                </tr>

              </thead>


              <tbody className="divide-y divide-slate-800">

                {records.map((record) => (

                  <tr
                    key={record.id}
                    className="hover:bg-slate-800/30"
                  >

                    <td className="px-5 py-4 text-slate-300">
                      {record.fuel_date
                        ? new Date(
                            record.fuel_date
                          ).toLocaleDateString()
                        : "-"}
                    </td>

                    <td className="px-5 py-4 text-white">
                      {record.fuel_station}
                    </td>

                    <td className="px-5 py-4 text-slate-300">
                      {Number(
                        record.fuel_quantity || 0
                      ).toFixed(2)} L
                    </td>

                    <td className="px-5 py-4 text-slate-300">
                      ₹{Number(
                        record.fuel_cost || 0
                      ).toLocaleString()}
                    </td>

                    <td className="px-5 py-4 text-slate-300">
                      {record.odometer_reading}
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


export default DriverFuel;