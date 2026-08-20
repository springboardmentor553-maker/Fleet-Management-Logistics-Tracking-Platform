import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

function DeliveryPerformance() {
  const [deliveryData, setDeliveryData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
  .get("http://127.0.0.1:8000/dashboard/delivery-performance")
      .then((response) => {
        setDeliveryData(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching delivery data:", error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <h2>Loading...</h2>;
  }

  if (!deliveryData) {
    return <h2>No data found.</h2>;
  }
  const chartData = [
  { name: "Pending", value: deliveryData.pending },
  { name: "Delivered", value: deliveryData.delivered },
  { name: "Returned", value: deliveryData.returned },
];
  const COLORS = ["#ffc107", "#198754", "#dc3545"];
  

  return (
  <div className="container mt-5">
    <h2 className="text-center mb-4">FleetFlow Dashboard</h2>

    <div className="row">
      <div className="col-md-4 mb-3">
        <div className="card text-center shadow">
          <div className="card-body">
            <h5>Total Deliveries</h5>
            <h2>{deliveryData.total_deliveries}</h2>
          </div>
        </div>
      </div>

      <div className="col-md-4 mb-3">
        <div className="card text-center shadow">
          <div className="card-body">
            <h5>Pending</h5>
            <h2>{deliveryData.pending}</h2>
          </div>
        </div>
      </div>

      <div className="col-md-4 mb-3">
        <div className="card text-center shadow">
          <div className="card-body">
            <h5>Delivered</h5>
            <h2>{deliveryData.delivered}</h2>
          </div>
        </div>
      </div>

      <div className="col-md-6 mb-3">
        <div className="card text-center shadow">
          <div className="card-body">
            <h5>Returned</h5>
            <h2>{deliveryData.returned}</h2>
          </div>
        </div>
      </div>

      <div className="col-md-6 mb-3">
        <div className="card text-center shadow">
          <div className="card-body">
            <h5>Success Rate</h5>
            <h2>{deliveryData.success_rate}%</h2>
          </div>
        </div>
      </div>
    </div>
    
    <div className="card shadow mt-4">
     <div className="card-body">
      <h4 className="text-center mb-3">Delivery Status</h4>

      <ResponsiveContainer width="100%" height={300}>
       <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="value" fill="#0d6efd" />
       </BarChart>
      </ResponsiveContainer>
     </div>
    </div>
    <div className="card shadow mt-4">
     <div className="card-body">
      <h4 className="text-center mb-4">Delivery Distribution</h4>

      <ResponsiveContainer width="100%" height={350}>
       <PieChart>
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={120}
          label
        >
          {chartData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={COLORS[index % COLORS.length]}
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
  

  
);
}

export default DeliveryPerformance;