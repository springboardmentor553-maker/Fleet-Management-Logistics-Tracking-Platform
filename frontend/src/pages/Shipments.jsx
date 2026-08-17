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

  // Administrator / Fleet Manager / Dispatcher
  // can create, edit and delete shipments
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
      return "bg-green-500/10 text-green-400 border-green-500/20";
    }

    if (value.includes("transit")) {
      return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    }

    if (value.includes("assigned")) {
      return "bg-purple-500/10 text-purple-400 border-purple-500/20";
    }

    if (value.includes("delayed")) {
      return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
    }

    if (value.includes("cancel")) {
      return "bg-red-500/10 text-red-400 border-red-500/20";
    }

    return "bg-slate-500/10 text-slate-300 border-slate-500/20";
  };

  // ================= UI =================

  return (
    <Layout>

      {/* ================= PAGE HEADER ================= */}

      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">

        <div>
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent">
            Shipments
          </h1>

          <p className="text-slate-400 mt-2">
            Manage shipments, tracking and delivery status
          </p>
        </div>

        {/* ADD SHIPMENT
            ADMIN / FLEET MANAGER / DISPATCHER ONLY
        */}

        {canManageShipments && (
          <Link
            to="/add-shipment"
            className="w-fit bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-3 rounded-xl font-semibold shadow-lg shadow-blue-900/30 hover:from-blue-500 hover:to-indigo-500 hover:-translate-y-0.5 transition-all"
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
          color="blue"
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

      <div className="bg-slate-900/75 backdrop-blur-xl border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden">

        <div className="p-6 border-b border-slate-800">

          <h2 className="text-xl font-bold text-white">
            Shipment List
          </h2>

          <p className="text-sm text-slate-500 mt-1">
            All shipments registered in the system
          </p>

        </div>


        <div className="overflow-x-auto">

          <table className="w-full min-w-[1100px]">

            <thead className="bg-blue-600/20">

              <tr>

                <th className="p-4 text-left text-blue-300">
                  ID
                </th>

                <th className="p-4 text-left text-blue-300">
                  Tracking No
                </th>

                <th className="p-4 text-left text-blue-300">
                  Sender
                </th>

                <th className="p-4 text-left text-blue-300">
                  Receiver
                </th>

                <th className="p-4 text-left text-blue-300">
                  Driver
                </th>

                <th className="p-4 text-left text-blue-300">
                  Vehicle
                </th>

                <th className="p-4 text-left text-blue-300">
                  Status
                </th>

                <th className="p-4 text-left text-blue-300">
                  Actions
                </th>

              </tr>

            </thead>


            <tbody>

              {shipments.length === 0 ? (

                <tr>

                  <td
                    colSpan="8"
                    className="text-center p-10 text-slate-500"
                  >
                    No shipments found
                  </td>

                </tr>

              ) : (

                shipments.map((shipment) => (

                  <tr
                    key={shipment.shipment_id}
                    className="border-t border-slate-800 hover:bg-blue-500/5 transition"
                  >

                    {/* ID */}

                    <td className="p-4 text-slate-400">
                      {shipment.shipment_id}
                    </td>


                    {/* TRACKING NUMBER */}

                    <td className="p-4">

                      <span className="font-semibold text-cyan-300">
                        {shipment.tracking_number || "-"}
                      </span>

                    </td>


                    {/* SENDER */}

                    <td className="p-4 text-slate-300">
                      {shipment.sender_name || "-"}
                    </td>


                    {/* RECEIVER */}

                    <td className="p-4 text-slate-300">
                      {shipment.receiver_name || "-"}
                    </td>


                    {/* DRIVER */}

                    <td className="p-4">

                      <span className="bg-purple-500/10 text-purple-300 border border-purple-500/20 px-3 py-1 rounded-lg text-sm">
                        {shipment.driver_id ?? "Not Assigned"}
                      </span>

                    </td>


                    {/* VEHICLE */}

                    <td className="p-4">

                      <span className="bg-blue-500/10 text-blue-300 border border-blue-500/20 px-3 py-1 rounded-lg text-sm">
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
                        {shipment.current_status || "Unknown"}
                      </span>

                    </td>


                    {/* ACTIONS */}

                    <td className="p-4">

                      <div className="flex gap-2 flex-wrap">

                        {/* EDIT
                            ADMIN / FLEET MANAGER / DISPATCHER
                        */}

                        {canManageShipments && (
                          <Link
                            to={`/edit-shipment/${shipment.shipment_id}`}
                            className="bg-green-500/10 text-green-400 border border-green-500/20 px-3 py-1.5 rounded-lg hover:bg-green-500/20 transition"
                          >
                            Edit
                          </Link>
                        )}


                        {/* TRACK
                            ALL ROLES
                        */}

                        <Link
                          to={`/track-shipment/${shipment.tracking_number}`}
                          className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1.5 rounded-lg hover:bg-indigo-500/20 transition"
                        >
                          Track
                        </Link>


                        {/* DELETE
                            ADMIN / FLEET MANAGER / DISPATCHER
                        */}

                        {canManageShipments && (
                          <button
                            onClick={() =>
                              deleteShipment(
                                shipment.shipment_id
                              )
                            }
                            className="bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1.5 rounded-lg hover:bg-red-500/20 transition"
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

    blue: {
      border: "border-blue-400/20",
      text: "text-blue-400",
    },

    cyan: {
      border: "border-cyan-400/20",
      text: "text-cyan-400",
    },

    green: {
      border: "border-green-400/20",
      text: "text-green-400",
    },

    yellow: {
      border: "border-yellow-400/20",
      text: "text-yellow-400",
    },

  };

  const style = styles[color] || styles.blue;

  return (

    <div
      className={`bg-slate-900/70 backdrop-blur-xl border ${style.border} rounded-2xl p-5 shadow-xl`}
    >

      <p className="text-slate-400 text-sm">
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