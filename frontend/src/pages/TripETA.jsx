import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../services/api";

function TripETA() {
  const { id } = useParams();

  const [eta, setEta] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadETA();
  }, [id]);

  const loadETA = async () => {
    try {
      setLoading(true);

      const res = await api.get(`/trips/${id}/eta`);

      setEta(res.data);
    } catch (err) {
      console.log(err);

      alert(
        err.response?.data?.detail ||
        "Unable to fetch ETA"
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>

        <div className="flex justify-center items-center py-20">

          <div className="text-center">

            <div className="text-5xl mb-4">
              🛣️
            </div>

            <p className="text-blue-400 text-lg font-semibold">
              Calculating Trip ETA...
            </p>

          </div>

        </div>

      </Layout>
    );
  }

  if (!eta) {
    return (
      <Layout>

        <div className="bg-slate-900/75 border border-red-500/20 rounded-2xl p-8 text-center">

          <p className="text-red-400 text-lg">
            Unable to load trip ETA.
          </p>

        </div>

      </Layout>
    );
  }

  return (
    <Layout>

      {/* Header */}

      <div className="mb-8">

        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent">
          Trip ETA
        </h1>

        <p className="text-slate-400 mt-2">
          Estimated travel time and arrival information
        </p>

      </div>


      {/* Main ETA Card */}

      <div className="bg-slate-900/75 backdrop-blur-xl border border-slate-700/60 rounded-2xl shadow-2xl p-8">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Trip ID */}

          <ETACard
            icon="🛣️"
            title="Trip ID"
            value={eta.trip_id}
          />


          {/* Distance */}

          <ETACard
            icon="📍"
            title="Distance"
            value={eta.distance}
          />


          {/* Duration */}

          <ETACard
            icon="⏱️"
            title="Estimated Duration"
            value={eta.estimated_travel_duration}
          />


          {/* Arrival */}

          <ETACard
            icon="🏁"
            title="Estimated Arrival"
            value={eta.estimated_arrival_time}
            highlight
          />

        </div>


        {/* Arrival Highlight */}

        <div className="mt-8 bg-gradient-to-r from-blue-600/15 via-cyan-500/10 to-purple-600/15 border border-cyan-400/20 rounded-2xl p-6">

          <div className="flex items-center gap-4">

            <div className="w-14 h-14 rounded-xl bg-cyan-500/10 border border-cyan-400/20 flex items-center justify-center text-3xl">
              🕐
            </div>

            <div>

              <p className="text-sm text-slate-400">
                Estimated Arrival Time
              </p>

              <p className="text-2xl font-bold text-cyan-300 mt-1">
                {eta.estimated_arrival_time || "Not Available"}
              </p>

            </div>

          </div>

        </div>

      </div>

    </Layout>
  );
}


/* ================= ETA CARD ================= */

function ETACard({
  icon,
  title,
  value,
  highlight = false,
}) {
  return (
    <div
      className={`bg-slate-950/70 border rounded-xl p-6 transition hover:bg-slate-950 ${
        highlight
          ? "border-cyan-400/30"
          : "border-slate-700/60"
      }`}
    >

      <div className="flex items-center gap-4">

        <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-2xl">
          {icon}
        </div>

        <div>

          <p className="text-sm text-slate-400">
            {title}
          </p>

          <p
            className={`text-xl font-bold mt-1 ${
              highlight
                ? "text-cyan-300"
                : "text-white"
            }`}
          >
            {value ?? "Not Available"}
          </p>

        </div>

      </div>

    </div>
  );
}

export default TripETA;