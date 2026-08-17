import { useState } from "react";
import Layout from "../components/Layout";
import api from "../services/api";

function ShipmentTracking() {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(false);

  const trackShipment = async () => {
    if (!trackingNumber.trim()) {
      alert("Enter Tracking Number");
      return;
    }

    try {
      setLoading(true);

      const res = await api.get(
        `/shipments/${trackingNumber.trim()}/status`
      );

      setTracking(res.data);
    } catch (err) {
      console.log(err);
      setTracking(null);

      alert(
        err.response?.data?.detail ||
        "Shipment Not Found"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>

      {/* Header */}

      <div className="mb-8">

        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent">
          Shipment Tracking
        </h1>

        <p className="text-slate-400 mt-2">
          Track shipment status and delivery information
        </p>

      </div>


      {/* Tracking Search */}

      <div className="bg-slate-900/75 backdrop-blur-xl border border-slate-700/60 rounded-2xl shadow-2xl p-8">

        <div className="flex flex-col md:flex-row gap-4">

          <input
            type="text"
            placeholder="Enter Tracking Number"
            value={trackingNumber}
            onChange={(e) =>
              setTrackingNumber(e.target.value)
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                trackShipment();
              }
            }}
            className="flex-1 bg-slate-950 border border-slate-700 text-white placeholder-slate-500 px-4 py-3 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
          />

          <button
            onClick={trackShipment}
            disabled={loading}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-900/30 transition disabled:opacity-50"
          >
            {loading ? "Tracking..." : "Track Shipment"}
          </button>

        </div>


        {/* Tracking Result */}

        {tracking && (

          <div className="mt-10">

            {/* Status Header */}

            <div className="bg-gradient-to-r from-blue-600/15 to-purple-600/15 border border-blue-500/20 rounded-2xl p-6 mb-6">

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                <div>

                  <p className="text-sm text-slate-500">
                    Tracking Number
                  </p>

                  <h2 className="text-2xl font-bold text-cyan-300 mt-1">
                    {tracking.tracking_number}
                  </h2>

                </div>


                <div>

                  <p className="text-sm text-slate-500">
                    Current Status
                  </p>

                  <span className="inline-block mt-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 font-semibold">
                    {tracking.current_shipment_status}
                  </span>

                </div>

              </div>

            </div>


            {/* Details */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              <TrackingCard
                title="Driver"
                value={tracking.driver_name}
                icon="👨‍✈️"
              />

              <TrackingCard
                title="Vehicle"
                value={tracking.vehicle_registration_number}
                icon="🚛"
              />

              <TrackingCard
                title="Pickup Location"
                value={tracking.pickup_location}
                icon="📍"
              />

              <TrackingCard
                title="Destination"
                value={tracking.destination}
                icon="🏁"
              />

              <TrackingCard
                title="Estimated Arrival"
                value={tracking.eta}
                icon="⏱️"
                fullWidth
              />

            </div>

          </div>

        )}

      </div>

    </Layout>
  );
}


/* ================= TRACKING CARD ================= */

function TrackingCard({
  title,
  value,
  icon,
  fullWidth = false,
}) {
  return (
    <div
      className={`bg-slate-950/70 border border-slate-700/60 rounded-xl p-5 ${
        fullWidth ? "md:col-span-2" : ""
      }`}
    >

      <div className="flex items-center gap-3 mb-3">

        <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-xl">
          {icon}
        </div>

        <h3 className="text-sm font-semibold text-slate-400">
          {title}
        </h3>

      </div>

      <p className="text-lg font-semibold text-white">
        {value || "Not Available"}
      </p>

    </div>
  );
}

export default ShipmentTracking;