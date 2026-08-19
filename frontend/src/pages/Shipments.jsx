import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../services/api";

function Shipments() {
  const [shipments, setShipments] = useState([]);

  // ================= ROLE =================

  const userRole = localStorage.getItem("role") || "";

  const normalizedRole = userRole
    .toLowerCase()
    .replace(/\s+/g, "_");

  const canManageShipments = [
    "administrator",
    "fleet_manager",
    "dispatcher",
  ].includes(normalizedRole);

  // ================= LOAD SHIPMENTS =================

  useEffect(() => {
    loadShipments();
  }, []);

  const loadShipments = async () => {
    try {
      const res = await api.get("/shipments/");
      setShipments(res.data);
    } catch (err) {
      console.log(err);

      alert(
        err.response?.data?.detail ||
          "Failed to load shipments"
      );
    }
  };

  // ================= DELETE SHIPMENT =================

  const deleteShipment = async (id) => {
    if (!window.confirm("Delete Shipment?")) return;

    try {
      await api.delete(`/shipments/${id}`);

      alert("Shipment Deleted Successfully");

      loadShipments();
    } catch (err) {
      console.log(err);

      alert(
        err.response?.data?.detail ||
          "Failed to delete shipment"
      );
    }
  };

  // ================= STATUS STYLE =================

  const getStatusStyle = (status) => {
    const value = status?.toLowerCase() || "";

    if (value.includes("delivered")) {
      return "bg-emerald-500/10 text-emerald-300 border-emerald-400/20";
    }

    if (value.includes("transit")) {
      return "bg-cyan-500/10 text-cyan-300 border-cyan-400/20";
    }

    if (value.includes("assigned")) {
      return "bg-teal-500/10 text-teal-300 border-teal-400/20";
    }

    if (value.includes("delayed")) {
      return "bg-amber-500/10 text-amber-300 border-amber-400/20";
    }

    if (value.includes("cancel")) {
      return "bg-red-500/10 text-red-300 border-red-400/20";
    }

    return "bg-teal-500/10 text-teal-100/70 border-teal-900/60";
  };

  // ================= UI =================

  return (
    <Layout>

      {/* ================= HEADER ================= */}

      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">

        <div>

          <p className="text-teal-300 text-sm font-medium mb-2">
            FleetFlow • Logistics Center
          </p>

          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-teal-300 via-cyan-300 to-teal-400 bg-clip-text text-transparent">
            Shipments
          </h1>

          <p className="text-teal-100/70 mt-2">
            Manage shipment movement and delivery progress
          </p>

        </div>

        {/* ADD SHIPMENT */}

        {canManageShipments && (
          <Link
            to="/add-shipment"
            className="w-fit bg-gradient-to-r from-teal-400 to-cyan-400 text-[#03181b] px-5 py-3 rounded-xl font-semibold shadow-lg shadow-teal-900/30 hover:from-teal-300 hover:to-cyan-300 hover:-translate-y-0.5 transition-all"
          >
            + Add Shipment
          </Link>
        )}

      </div>


      {/* ================= SUMMARY CARDS ================= */}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">

        <SummaryCard
          title="Total Shipments"
          value={shipments.length}
          color="teal"
        />

        <SummaryCard
          title="In Transit"
          value={
            shipments.filter(
              (s) =>
                s.current_status?.toLowerCase() ===
                "in transit"
            ).length
          }
          color="cyan"
        />

        <SummaryCard
          title="Delivered"
          value={
            shipments.filter(
              (s) =>
                s.current_status?.toLowerCase() ===
                "delivered"
            ).length
          }
          color="green"
        />

        <SummaryCard
          title="Delayed"
          value={
            shipments.filter(
              (s) =>
                s.current_status?.toLowerCase() ===
                "delayed"
            ).length
          }
          color="yellow"
        />

      </div>


      {/* ================= SHIPMENT TABLE ================= */}

      <div className="bg-[#062126]/80 backdrop-blur-xl border border-teal-900/60 rounded-2xl shadow-2xl overflow-hidden">

        {/* TABLE HEADER */}

        <div className="p-6 border-b border-teal-900/60">

          <h2 className="text-xl font-bold text-teal-50">
            Shipment List
          </h2>

          <p className="text-sm text-teal-200/50 mt-1">
            All shipments registered in the system
          </p>

        </div>


        <div className="overflow-x-auto">

          <table className="w-full min-w-[1100px]">

            {/* ================= TABLE HEAD ================= */}

            <thead className="bg-teal-500/10">

              <tr>

                <th className="p-4 text-left text-teal-300">
                  ID
                </th>

                <th className="p-4 text-left text-teal-300">
                  Tracking No
                </th>

                <th className="p-4 text-left text-teal-300">
                  Sender
                </th>

                <th className="p-4 text-left text-teal-300">
                  Receiver
                </th>

                <th className="p-4 text-left text-teal-300">
                  Driver
                </th>

                <th className="p-4 text-left text-teal-300">
                  Vehicle
                </th>

                <th className="p-4 text-left text-teal-300">
                  Status
                </th>

                <th className="p-4 text-left text-teal-300">
                  Actions
                </th>

              </tr>

            </thead>


            {/* ================= TABLE BODY ================= */}

            <tbody>

              {shipments.length === 0 ? (

                <tr>

                  <td
                    colSpan="8"
                    className="text-center p-10 text-teal-200/50"
                  >
                    No shipments found
                  </td>

                </tr>

              ) : (

                shipments.map((shipment) => (

                  <tr
                    key={shipment.shipment_id}
                    className="border-t border-teal-900/60 hover:bg-teal-500/5 transition"
                  >

                    {/* ID */}

                    <td className="p-4 text-teal-100/70">
                      {shipment.shipment_id}
                    </td>


                    {/* TRACKING NUMBER */}

                    <td className="p-4">

                      <span className="font-semibold text-cyan-300">
                        {shipment.tracking_number || "-"}
                      </span>

                    </td>


                    {/* SENDER */}

                    <td className="p-4 text-teal-50/80">
                      {shipment.sender_name || "-"}
                    </td>


                    {/* RECEIVER */}

                    <td className="p-4 text-teal-50/80">
                      {shipment.receiver_name || "-"}
                    </td>


                    {/* DRIVER */}

                    <td className="p-4">

                      <span className="bg-teal-500/10 text-teal-300 border border-teal-400/20 px-3 py-1 rounded-lg text-sm">
                        {shipment.driver_id ?? "Not Assigned"}
                      </span>

                    </td>


                    {/* VEHICLE */}

                    <td className="p-4">

                      <span className="bg-cyan-500/10 text-cyan-300 border border-cyan-400/20 px-3 py-1 rounded-lg text-sm">
                        {shipment.vehicle_id ?? "Not Assigned"}
                      </span>

                    </td>


                    {/* STATUS */}

                    <td className="p-4">

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusStyle(
                          shipment.current_status
                        )}`}
                      >
                        {shipment.current_status ||
                          "Unknown"}
                      </span>

                    </td>


                    {/* ACTIONS */}

                    <td className="p-4">

                      <div className="flex gap-2 flex-wrap">

                        {/* EDIT */}

                        {canManageShipments && (
                          <Link
                            to={`/edit-shipment/${shipment.shipment_id}`}
                            className="bg-teal-500/10 text-teal-300 border border-teal-400/20 px-3 py-1.5 rounded-lg hover:bg-teal-500/20 transition"
                          >
                            Edit
                          </Link>
                        )}


                        {/* TRACK */}

                        <Link
                          to={`/track-shipment/${shipment.tracking_number}`}
                          className="bg-cyan-500/10 text-cyan-300 border border-cyan-400/20 px-3 py-1.5 rounded-lg hover:bg-cyan-500/20 transition"
                        >
                          Track
                        </Link>


                        {/* DELETE */}

                        {canManageShipments && (
                          <button
                            onClick={() =>
                              deleteShipment(
                                shipment.shipment_id
                              )
                            }
                            className="bg-red-500/10 text-red-300 border border-red-400/20 px-3 py-1.5 rounded-lg hover:bg-red-500/20 transition"
                          >
                            Delete
                          </button>
                        )}

                      </div>

                    </td>

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


/* ================= SUMMARY CARD ================= */

function SummaryCard({
  title,
  value,
  color,
}) {

  const styles = {

    teal: {
      border: "border-teal-400/20",
      text: "text-teal-300",
    },

    cyan: {
      border: "border-cyan-400/20",
      text: "text-cyan-300",
    },

    green: {
      border: "border-emerald-400/20",
      text: "text-emerald-300",
    },

    yellow: {
      border: "border-amber-400/20",
      text: "text-amber-300",
    },

  };

  const style =
    styles[color] || styles.teal;

  return (

    <div
      className={`bg-[#062126]/80 backdrop-blur-xl border ${style.border} rounded-2xl p-5 shadow-xl hover:-translate-y-1 transition-all duration-200`}
    >

      <p className="text-teal-100/70 text-sm">
        {title}
      </p>

      <p
        className={`text-3xl font-bold ${style.text} mt-2`}
      >
        {value}
      </p>

    </div>

  );
}

export default Shipments;