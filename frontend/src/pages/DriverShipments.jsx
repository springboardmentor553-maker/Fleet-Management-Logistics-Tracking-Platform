import { useEffect, useState } from "react";
import {
  FaBox,
  FaMapMarkerAlt,
  FaFlagCheckered,
} from "react-icons/fa";

import {
  getDriverDashboard,
} from "../services/driverDashboardService";


function DriverShipments() {

  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  useEffect(() => {

    const loadData = async () => {

      try {

        const data =
          await getDriverDashboard();

        setShipments(
          data?.shipments || []
        );

      } catch (err) {

        console.error(err);

        setError(
          err.response?.data?.detail ||
          "Failed to load shipments."
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
        Loading shipments...
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


  return (
    <div className="min-h-full bg-slate-950 text-slate-100 p-6">


      <div className="mb-8">

        <div className="flex items-center gap-3">

          <div className="w-11 h-11 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
            <FaBox />
          </div>

          <div>

            <h1 className="text-3xl font-bold">
              My Shipments
            </h1>

            <p className="text-slate-400 mt-1">
              Only shipments assigned to you.
            </p>

          </div>

        </div>

      </div>


      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">

        {shipments.length === 0 ? (

          <div className="p-12 text-center">

            <FaBox className="mx-auto text-5xl text-slate-700 mb-5" />

            <p className="text-slate-400">
              No shipments assigned.
            </p>

          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full min-w-[1000px] text-sm">

              <thead className="bg-slate-800/60">

                <tr>

                  <th className="text-left px-5 py-4 text-slate-400">
                    Tracking Number
                  </th>

                  <th className="text-left px-5 py-4 text-slate-400">
                    Receiver
                  </th>

                  <th className="text-left px-5 py-4 text-slate-400">
                    Pickup
                  </th>

                  <th className="text-left px-5 py-4 text-slate-400">
                    Destination
                  </th>

                  <th className="text-left px-5 py-4 text-slate-400">
                    Weight
                  </th>

                  <th className="text-left px-5 py-4 text-slate-400">
                    Status
                  </th>

                </tr>

              </thead>


              <tbody className="divide-y divide-slate-800">

                {shipments.map((shipment) => (

                  <tr
                    key={shipment.id}
                    className="hover:bg-slate-800/30"
                  >

                    <td className="px-5 py-5">

                      <div className="flex items-center gap-2">

                        <FaBox className="text-purple-400" />

                        <span className="font-semibold text-white">
                          {shipment.tracking_number}
                        </span>

                      </div>

                    </td>


                    <td className="px-5 py-5 text-slate-300">
                      {shipment.receiver_name}
                    </td>


                    <td className="px-5 py-5">

                      <div className="flex items-start gap-2">

                        <FaMapMarkerAlt className="text-emerald-400 mt-1" />

                        <span className="text-slate-300">
                          {shipment.pickup_location}
                        </span>

                      </div>

                    </td>


                    <td className="px-5 py-5">

                      <div className="flex items-start gap-2">

                        <FaFlagCheckered className="text-red-400 mt-1" />

                        <span className="text-slate-300">
                          {shipment.delivery_location}
                        </span>

                      </div>

                    </td>


                    <td className="px-5 py-5 text-slate-300">
                      {shipment.weight}
                    </td>


                    <td className="px-5 py-5">

                      <span className="inline-flex px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-medium">
                        {shipment.status}
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


export default DriverShipments;