import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import VehicleForm from "../components/VehicleForm";
import VehicleTable from "../components/VehicleTable";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from "recharts";
import {
  getVehicles,
  addVehicle,
  updateVehicle,
  deleteVehicle,
} from "../services/vehicleService";

export default function VehiclePage() {
  const [vehicles, setVehicles] = useState([]);
  const [editingVehicle, setEditingVehicle] = useState(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Load vehicles when page opens
  useEffect(() => {
    loadVehicles();
  }, []);

  // Fetch all vehicles
  const loadVehicles = async () => {
    try {
      const data = await getVehicles();
      setVehicles(data);
    } catch (err) {
      setError("Failed to load vehicles.");
    }
  };

  // Add or Update vehicle
  const handleSubmit = async (vehicle) => {
    try {
      setError("");

      if (editingVehicle) {
        await updateVehicle(editingVehicle.id, vehicle);
        setMessage("Vehicle updated successfully.");
      } else {
        await addVehicle(vehicle);
        setMessage("Vehicle added successfully.");
      }

      setEditingVehicle(null);

      loadVehicles();

      setTimeout(() => {
        setMessage("");
      }, 3000);

    } catch (err) {
      setError("Operation failed.");

      setTimeout(() => {
        setError("");
      }, 3000);
    }
  };

  // Edit vehicle
  const handleEdit = (vehicle) => {
    setEditingVehicle(vehicle);
  };

  // Delete vehicle
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Delete this vehicle?"
    );

    if (!confirmDelete) return;

    try {
      await deleteVehicle(id);

      setMessage("Vehicle deleted successfully.");

      loadVehicles();

      setTimeout(() => {
        setMessage("");
      }, 3000);

    } catch (err) {
      setError("Delete failed.");

      setTimeout(() => {
        setError("");
      }, 3000);
    }
  };
  const vehicleChartData = [
  {
    status: "Available",
    count: vehicles.filter(v => v.status === "Available").length,
    fill: "#28a745", // Green
  },
  {
    status: "On Trip",
    count: vehicles.filter(v => v.status === "On Trip").length,
    fill: "#007bff", // Blue
  },
  {
    status: "Under Maintenance",
    count: vehicles.filter(v => v.status === "Under Maintenance").length,
    fill: "#ffc107", // Yellow
  },
  {
    status: "Inactive",
    count: vehicles.filter(v => v.status === "Inactive").length,
    fill: "#dc3545", // Red
  },
];

  return (
    <>
      <Navbar />

      <div
      className="container-fluid"
      style={{
        marginLeft: "260px",
        width: "calc(100% - 260px)",
        padding: "25px",
        background: "#f4f6f9",
        minHeight: "100vh",
      }}
      >
        <h2>Vehicle Management</h2>

        {message && (
          <p style={{ color: "green" }}>
            {message}
          </p>
        )}

        {error && (
          <p style={{ color: "red" }}>
            {error}
          </p>
        )}

        <VehicleForm
          onSubmit={handleSubmit}
          editingVehicle={editingVehicle}
        />

        <VehicleTable
          vehicles={vehicles}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
        <div className="row mb-4">

  <div className="col-md-6">
    <div className="card shadow">
      <div className="card-header bg-primary text-white">
        Vehicle Status Distribution
      </div>

      <div className="card-body">

        <ResponsiveContainer width="100%" height={300}>
          <PieChart>

            <Pie
              data={vehicleChartData}
              dataKey="count"
              nameKey="status"
              outerRadius={100}
              label
            >
              {vehicleChartData.map((entry, index) => (
                <Cell key={index} fill={entry.fill} />
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
        Vehicle Status Comparison
      </div>

      <div className="card-body">

        <ResponsiveContainer width="100%" height={300}>

          <BarChart data={vehicleChartData}>

            <XAxis dataKey="status" />
            <YAxis />
            <Tooltip />
            <Legend />

            <Bar dataKey="count" />

          </BarChart>

        </ResponsiveContainer>

      </div>
    </div>
  </div>

</div>
      </div>
    </>
  );
}