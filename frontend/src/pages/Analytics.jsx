import { useEffect, useState } from "react";

import {
  FaGasPump,
  FaTruck,
  FaChartLine,
  FaRoute,
  FaCheckCircle,
  FaClock,
  FaTimesCircle,
} from "react-icons/fa";

import {
  getFuelAnalytics,
  getOperationsAnalytics,
} from "../services/analyticsService";

function Analytics() {
  const [fuel, setFuel] = useState(null);
  const [operations, setOperations] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        setError("");

        const [fuelData, operationsData] =
          await Promise.all([
            getFuelAnalytics(),
            getOperationsAnalytics(),
          ]);

        setFuel(fuelData);
        setOperations(operationsData);
      } catch (err) {
        console.error(err);

        setError(
          err.response?.data?.detail ||
            "Failed to load analytics."
        );
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="min-h-full bg-slate-950 text-slate-100 flex items-center justify-center">
        <p className="text-lg font-medium">
          Loading analytics...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-full bg-slate-950 text-slate-100 p-6">
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-4">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-950 text-slate-100 p-6">

      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">
          Fleet Analytics
        </h1>

        <p className="text-slate-400 mt-2">
          Fuel usage and operational performance overview.
        </p>
      </div>

      {/* ============================= */}
      {/* FUEL ANALYTICS */}
      {/* ============================= */}

      <section className="mb-10">

        <div className="mb-5">
          <h2 className="text-xl font-semibold text-white">
            Fuel Analytics
          </h2>

          <p className="text-sm text-slate-500 mt-1">
            Fuel consumption and cost analysis.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">

          {/* TOTAL FUEL */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-slate-400">
                  Total Fuel Consumed
                </p>

                <p className="text-3xl font-bold text-white mt-2">
                  {fuel?.totalFuelConsumed ?? 0}
                </p>

                <p className="text-xs text-slate-500 mt-2">
                  Liters
                </p>
              </div>

              <div className="w-11 h-11 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <FaGasPump />
              </div>

            </div>
          </div>

          {/* TOTAL COST */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-slate-400">
                  Total Fuel Cost
                </p>

                <p className="text-3xl font-bold text-white mt-2">
                  ₹{fuel?.totalFuelCost ?? 0}
                </p>

                <p className="text-xs text-slate-500 mt-2">
                  Total expenditure
                </p>
              </div>

              <div className="w-11 h-11 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <FaChartLine />
              </div>

            </div>
          </div>

          {/* AVERAGE CONSUMPTION */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-slate-400">
                  Average Fuel Consumption
                </p>

                <p className="text-3xl font-bold text-white mt-2">
                  {fuel?.averageFuelConsumption ?? 0}
                </p>

                <p className="text-xs text-slate-500 mt-2">
                  Average consumption
                </p>
              </div>

              <div className="w-11 h-11 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center">
                <FaGasPump />
              </div>

            </div>
          </div>

        </div>

        {/* HIGHEST / LOWEST */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">

            <p className="text-sm text-slate-400">
              Vehicle with Highest Fuel Usage
            </p>

            <p className="text-xl font-semibold text-white mt-3">
              {fuel?.highestFuelUsageVehicle || "N/A"}
            </p>

          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">

            <p className="text-sm text-slate-400">
              Vehicle with Lowest Fuel Usage
            </p>

            <p className="text-xl font-semibold text-white mt-3">
              {fuel?.lowestFuelUsageVehicle || "N/A"}
            </p>

          </div>

        </div>

      </section>


      {/* ============================= */}
      {/* OPERATIONS ANALYTICS */}
      {/* ============================= */}

      <section>

        <div className="mb-5">
          <h2 className="text-xl font-semibold text-white">
            Operational Analytics
          </h2>

          <p className="text-sm text-slate-500 mt-1">
            Delivery and trip performance overview.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">

          {/* TOTAL DELIVERIES */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-slate-400">
                  Total Deliveries
                </p>

                <p className="text-3xl font-bold text-white mt-2">
                  {operations?.totalDeliveries ?? 0}
                </p>
              </div>

              <div className="w-11 h-11 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <FaTruck />
              </div>

            </div>

          </div>


          {/* SUCCESSFUL */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-slate-400">
                  Successful Deliveries
                </p>

                <p className="text-3xl font-bold text-white mt-2">
                  {operations?.successfulDeliveries ?? 0}
                </p>
              </div>

              <div className="w-11 h-11 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <FaCheckCircle />
              </div>

            </div>

          </div>


          {/* DELAYED */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-slate-400">
                  Delayed Deliveries
                </p>

                <p className="text-3xl font-bold text-white mt-2">
                  {operations?.delayedDeliveries ?? 0}
                </p>
              </div>

              <div className="w-11 h-11 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center">
                <FaClock />
              </div>

            </div>

          </div>


          {/* CANCELLED */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-slate-400">
                  Cancelled Deliveries
                </p>

                <p className="text-3xl font-bold text-white mt-2">
                  {operations?.cancelledDeliveries ?? 0}
                </p>
              </div>

              <div className="w-11 h-11 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center">
                <FaTimesCircle />
              </div>

            </div>

          </div>


          {/* AVERAGE DISTANCE */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-slate-400">
                  Average Trip Distance
                </p>

                <p className="text-3xl font-bold text-white mt-2">
                  {operations?.averageTripDistance ?? 0}
                </p>

                <p className="text-xs text-slate-500 mt-2">
                  Distance per trip
                </p>
              </div>

              <div className="w-11 h-11 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <FaRoute />
              </div>

            </div>

          </div>


          {/* AVERAGE DELIVERY TIME */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-slate-400">
                  Average Delivery Time
                </p>

                <p className="text-3xl font-bold text-white mt-2">
                  {operations?.averageDeliveryTime ?? 0}
                </p>

                <p className="text-xs text-slate-500 mt-2">
                  Average time per delivery
                </p>
              </div>

              <div className="w-11 h-11 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <FaClock />
              </div>

            </div>

          </div>

        </div>

      </section>

    </div>
  );
}

export default Analytics;
