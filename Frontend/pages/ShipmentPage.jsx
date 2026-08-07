import { useEffect, useState } from "react";
import {
  getShipments,
  updateShipmentStatus,
} from "../services/shipmentService";

import Navbar from "../components/Navbar";

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
      setShipments(res.data);
    } catch (error) {
      console.error("Error loading shipments:", error);
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

  const shipmentChartData = [
    {
      status: "Created",
      count: shipments.filter((s) => s.status === "CREATED").length,
    },
    {
      status: "Assigned",
      count: shipments.filter((s) => s.status === "ASSIGNED").length,
    },
    {
      status: "Picked Up",
      count: shipments.filter((s) => s.status === "PICKED_UP").length,
    },
    {
      status: "In Transit",
      count: shipments.filter((s) => s.status === "IN_TRANSIT").length,
    },
    {
      status: "Out for Delivery",
      count: shipments.filter(
        (s) => s.status === "OUT_FOR_DELIVERY"
      ).length,
    },
    {
      status: "Delivered",
      count: shipments.filter((s) => s.status === "DELIVERED").length,
    },
    {
      status: "Delayed",
      count: shipments.filter((s) => s.status === "DELAYED").length,
    },
    {
      status: "Cancelled",
      count: shipments.filter((s) => s.status === "CANCELLED").length,
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

  return (
    <>
      <Navbar />

<div
  className="container-fluid"
  style={{
    marginLeft: "260px",   // Change to your sidebar width
    width: "calc(100% - 260px)",
    padding: "25px",
    minHeight: "100vh",
    backgroundColor: "#f4f6f9",
  }}
>

        <h2 className="mb-4">
          📦 Shipment Management
        </h2>

        {/* Summary Cards */}

        <div className="row mb-4">

          <div className="col-md-3">
            <div className="card shadow text-center border-primary">
              <div className="card-body">
                <h5>Total Shipments</h5>
                <h2>{shipments.length}</h2>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card shadow text-center border-success">
              <div className="card-body">
                <h5>Delivered</h5>
                <h2>
                  {
                    shipments.filter(
                      (s) => s.status === "DELIVERED"
                    ).length
                  }
                </h2>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card shadow text-center border-warning">
              <div className="card-body">
                <h5>In Transit</h5>
                <h2>
                  {
                    shipments.filter(
                      (s) => s.status === "IN_TRANSIT"
                    ).length
                  }
                </h2>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card shadow text-center border-danger">
              <div className="card-body">
                <h5>Cancelled</h5>
                <h2>
                  {
                    shipments.filter(
                      (s) => s.status === "CANCELLED"
                    ).length
                  }
                </h2>
              </div>
            </div>
          </div>

        </div>

        {/* Charts */}

        <div className="row mb-4">

          <div className="col-md-6">

            <div className="card shadow">

              <div className="card-header bg-primary text-white">
                Shipment Status Distribution
              </div>

              <div className="card-body">

                <ResponsiveContainer width="100%" height={350}>

                  <PieChart>

                    <Pie
                      data={shipmentChartData}
                      dataKey="count"
                      nameKey="status"
                      outerRadius={120}
                      label
                    >
                      {shipmentChartData.map((entry, index) => (
                        <Cell
                          key={index}
                          fill={COLORS[index]}
                        />
                      ))}
                    </Pie>

                    <Tooltip />

                    <Legend />

                  </PieChart>

                </ResponsiveContainer>

              </div>

            </div>

          </div>
                    <div className="col-md-6">

            <div className="card shadow">

              <div className="card-header bg-success text-white">
                Shipment Status Overview
              </div>

              <div className="card-body">

                <ResponsiveContainer width="100%" height={350}>

                  <BarChart data={shipmentChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="status" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="count"
                      fill="#1976d2"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>

                </ResponsiveContainer>

              </div>

            </div>

          </div>

        </div>

        {/* Shipment Table */}

        <div className="card shadow">

          <div className="card-header bg-dark text-white">
            Shipment List
          </div>

          <div className="card-body table-responsive">

            <table className="table table-bordered table-hover">

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

                    <td>{ship.tracking_number}</td>

                    <td>{ship.sender_name}</td>

                    <td>{ship.receiver_name}</td>

                    <td>{ship.pickup_location}</td>

                    <td>{ship.delivery_location}</td>

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
                        <option value="CREATED">Created</option>
                        <option value="ASSIGNED">Assigned</option>
                        <option value="PICKED_UP">Picked Up</option>
                        <option value="IN_TRANSIT">In Transit</option>
                        <option value="OUT_FOR_DELIVERY">
                          Out for Delivery
                        </option>
                        <option value="DELIVERED">Delivered</option>
                        <option value="DELAYED">Delayed</option>
                        <option value="CANCELLED">Cancelled</option>
                      </select>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

            {shipments.length === 0 && (
              <div className="text-center text-muted mt-3">
                No shipments available.
              </div>
            )}

          </div>

        </div>

      </div>

    </>

  );
}

export default Shipments;