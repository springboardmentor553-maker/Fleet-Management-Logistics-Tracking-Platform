import { useEffect, useState } from "react";
import {
  getShipments,
  updateShipmentStatus,
} from "../services/shipmentService";

import Navbar from "../components/Navbar";
import "./ShipmentPage.css";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

function Shipments() {
  const [shipments, setShipments] = useState([]);

  useEffect(() => {
    loadShipments();
  }, []);

 const loadShipments = async () => {
  try {
    const res = await getShipments();

    console.log("Shipments API Response:", res.data);

    const shipmentData = Array.isArray(res.data)
      ? res.data
      : res.data?.value || [];

    setShipments(shipmentData);
  } catch (error) {
    console.error("Error loading shipments:", error);
    setShipments([]);
  }
};

  const handleStatusChange = async (shipmentId, status) => {
    try {
      await updateShipmentStatus(shipmentId, status);
      await loadShipments();

      alert("Shipment status updated successfully.");
    } catch (error) {
      console.error(error);
      alert("Failed to update shipment status.");
    }
  };

  // ============================
  // SHIPMENT CHART DATA
  // ============================

  const shipmentChartData = [
    {
      status: "Created",
      count: shipments.filter(
        (s) => s.status === "CREATED"
      ).length,
    },
    {
      status: "Assigned",
      count: shipments.filter(
        (s) => s.status === "ASSIGNED"
      ).length,
    },
    {
      status: "Picked Up",
      count: shipments.filter(
        (s) => s.status === "PICKED_UP"
      ).length,
    },
    {
      status: "In Transit",
      count: shipments.filter(
        (s) => s.status === "IN_TRANSIT"
      ).length,
    },
    {
      status: "Out for Delivery",
      count: shipments.filter(
        (s) => s.status === "OUT_FOR_DELIVERY"
      ).length,
    },
    {
      status: "Delivered",
      count: shipments.filter(
        (s) => s.status === "DELIVERED"
      ).length,
    },
    {
      status: "Delayed",
      count: shipments.filter(
        (s) => s.status === "DELAYED"
      ).length,
    },
    {
      status: "Cancelled",
      count: shipments.filter(
        (s) => s.status === "CANCELLED"
      ).length,
    },
  ];

  const COLORS = [
    "#3498db",
    "#f39c12",
    "#9b59b6",
    "#1abc9c",
    "#e67e22",
    "#2ecc71",
    "#e74c3c",
    "#7f8c8d",
  ];

  // ============================
  // COUNTS
  // ============================

  const totalShipments = shipments.length;

  const deliveredShipments = shipments.filter(
    (s) => s.status === "DELIVERED"
  ).length;

  const inTransitShipments = shipments.filter(
    (s) => s.status === "IN_TRANSIT"
  ).length;

  const cancelledShipments = shipments.filter(
    (s) => s.status === "CANCELLED"
  ).length;

  return (
    <>
      <Navbar />

      <main className="shipment-page">

        {/* ============================
            HEADER
        ============================ */}

        <div className="shipment-header">
          <h2>📦 Shipment Management</h2>
        </div>

        {/* ============================
            SUMMARY CARDS
        ============================ */}

        <div className="shipment-summary">

          <div className="shipment-summary-card shadow border-primary">
            <h5>Total Shipments</h5>
            <h2>{totalShipments}</h2>
          </div>

          <div className="shipment-summary-card shadow border-success">
            <h5>Delivered</h5>
            <h2>{deliveredShipments}</h2>
          </div>

          <div className="shipment-summary-card shadow border-warning">
            <h5>In Transit</h5>
            <h2>{inTransitShipments}</h2>
          </div>

          <div className="shipment-summary-card shadow border-danger">
            <h5>Cancelled</h5>
            <h2>{cancelledShipments}</h2>
          </div>

        </div>

        {/* ============================
            CHARTS
        ============================ */}

        <div className="shipment-charts">

          {/* PIE CHART */}

          <div className="shipment-chart-card shadow">

            <div className="card-header bg-primary text-white">
              Shipment Status Distribution
            </div>

            <div className="shipment-chart-body">

              <ResponsiveContainer
                width="100%"
                height={350}
              >

                <PieChart>

                  <Pie
                    data={shipmentChartData}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={110}
                    label
                  >

                    {shipmentChartData.map(
                      (entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index]}
                        />
                      )
                    )}

                  </Pie>

                  <Tooltip />

                  <Legend />

                </PieChart>

              </ResponsiveContainer>

            </div>

          </div>

          {/* BAR CHART */}

          <div className="shipment-chart-card shadow">

            <div className="card-header bg-success text-white">
              Shipment Status Overview
            </div>

            <div className="shipment-chart-body">

              <ResponsiveContainer
                width="100%"
                height={350}
              >

                <BarChart
                  data={shipmentChartData}
                  margin={{
                    top: 20,
                    right: 20,
                    left: 0,
                    bottom: 50,
                  }}
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                  />

                  <XAxis
                    dataKey="status"
                    angle={-25}
                    textAnchor="end"
                    interval={0}
                  />

                  <YAxis
                    allowDecimals={false}
                  />

                  <Tooltip />

                  <Legend />

                  <Bar
                    dataKey="count"
                    name="Shipments"
                    fill="#1976d2"
                    radius={[8, 8, 0, 0]}
                  />

                </BarChart>

              </ResponsiveContainer>

            </div>

          </div>

        </div>

        {/* ============================
            SHIPMENT TABLE
        ============================ */}

        <div className="shipment-table-card shadow">

          <div className="card-header bg-dark text-white">
            Shipment List
          </div>

          <div className="shipment-table-container">

            <table className="table table-bordered table-hover shipment-table">

              <thead className="table-dark">

                <tr>
                  <th>Tracking Number</th>
                  <th>Sender</th>
                  <th>Receiver</th>
                  <th>Pickup</th>
                  <th>Destination</th>
                  <th>Status</th>
                </tr>

              </thead>

              <tbody>

                {shipments.map((ship) => (

                  <tr key={ship.id}>

                    <td>
                      {ship.tracking_number}
                    </td>

                    <td>
                      {ship.sender_name}
                    </td>

                    <td>
                      {ship.receiver_name}
                    </td>

                    <td>
                      {ship.pickup_location}
                    </td>

                    <td>
                      {ship.delivery_location}
                    </td>

                    <td>

                      <select
                        className="form-select"
                        value={ship.status}
                        onChange={(e) =>
                          handleStatusChange(
                            ship.id,
                            e.target.value
                          )
                        }
                      >

                        <option value="CREATED">
                          Created
                        </option>

                        <option value="ASSIGNED">
                          Assigned
                        </option>

                        <option value="PICKED_UP">
                          Picked Up
                        </option>

                        <option value="IN_TRANSIT">
                          In Transit
                        </option>

                        <option value="OUT_FOR_DELIVERY">
                          Out for Delivery
                        </option>

                        <option value="DELIVERED">
                          Delivered
                        </option>

                        <option value="DELAYED">
                          Delayed
                        </option>

                        <option value="CANCELLED">
                          Cancelled
                        </option>

                      </select>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

            {shipments.length === 0 && (

              <div className="text-center text-muted p-4">
                No shipments available.
              </div>

            )}

          </div>

        </div>

      </main>
    </>
  );
}

export default Shipments;