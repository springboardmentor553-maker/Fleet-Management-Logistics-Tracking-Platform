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

      {/* ================= HEADER ================= */}

      <div className="mb-8">

        <p className="text-teal-300 text-sm font-medium mb-2">
          FleetFlow • Logistics Center
        </p>

        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-teal-300 via-cyan-300 to-teal-400 bg-clip-text text-transparent">
          Shipment Tracking
        </h1>

        <p className="text-teal-100/70 mt-2">
          Track shipment status and delivery information
        </p>

      </div>


      {/* ================= TRACKING SEARCH ================= */}

      <div className="bg-[#062126]/80 backdrop-blur-xl border border-teal-900/60 rounded-2xl shadow-2xl p-8">

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
            className="flex-1 bg-[#03181b] border border-teal-900/60 text-teal-50 placeholder-teal-200/50 px-4 py-3 rounded-xl outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 transition"
          />

          <button
            onClick={trackShipment}
            disabled={loading}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-teal-400 to-cyan-400 text-[#03181b] font-semibold hover:from-teal-300 hover:to-cyan-300 shadow-lg shadow-teal-900/30 transition disabled:opacity-50"
          >
            {loading
              ? "Tracking..."
              : "Track Shipment"}
          </button>

        </div>


        {/* ================= TRACKING RESULT ================= */}

        {tracking && (

          <div className="mt-10">

            {/* ================= STATUS HEADER ================= */}

            <div className="bg-gradient-to-r from-teal-500/15 via-cyan-500/10 to-teal-500/15 border border-teal-400/30 rounded-2xl p-6 mb-6">

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                {/* Tracking Number */}

                <div>

                  <p className="text-sm text-teal-200/50">
                    Tracking Number
                  </p>

                  <h2 className="text-2xl font-bold text-teal-300 mt-1">
                    {tracking.tracking_number}
                  </h2>

                </div>


                {/* Current Status */}

                <div>

                  <p className="text-sm text-teal-200/50">
                    Current Status
                  </p>

                  <span className="inline-block mt-2 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-400/30 text-teal-300 font-semibold">
                    {tracking.current_shipment_status}
                  </span>

                </div>

              </div>

            </div>


            {/* ================= DETAILS ================= */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              <TrackingCard
                title="Driver"
                value={tracking.driver_name}
                icon="👨‍✈️"
              />

              <TrackingCard
                title="Vehicle"
                value={
                  tracking.vehicle_registration_number
                }
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
      className={`bg-[#03181b]/80 border border-teal-900/60 rounded-xl p-5 ${
        fullWidth ? "md:col-span-2" : ""
      }`}
    >

      <div className="flex items-center gap-3 mb-3">

        <div className="w-10 h-10 rounded-lg bg-teal-500/10 border border-teal-400/30 flex items-center justify-center text-xl">
          {icon}
        </div>

        <h3 className="text-sm font-semibold text-teal-100/70">
          {title}
        </h3>

      </div>

      <p className="text-lg font-semibold text-teal-50">
        {value || "Not Available"}
      </p>

    </div>
  );
}

export default ShipmentTracking;