import "./FleetChart.css";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
} from "recharts";

function FleetChart({ dashboard }) {
  const data = [
    {
      name: "Total Drivers",
      count: dashboard.total_drivers,
      color: "#2563EB",
    },
    {
      name: "Total Vehicles",
      count: dashboard.total_vehicles,
      color: "#10B981",
    },
    {
      name: "Total Shipments",
      count: dashboard.total_shipments,
      color: "#F59E0B",
    },
    {
      name: "Available Drivers",
      count: dashboard.available_drivers,
      color: "#8B5CF6",
    },
    {
      name: "Available Vehicles",
      count: dashboard.available_vehicles,
      color: "#06B6D4",
    },
    {
      name: "Active Deliveries",
      count: dashboard.active_deliveries,
      color: "#F97316",
    },
    {
      name: "Delivered Shipments",
      count: dashboard.delivered_shipments,
      color: "#22C55E",
    },
    {
      name: "Delayed Shipments",
      count: dashboard.delayed_shipments,
      color: "#EF4444",
    },
  ];

  return (
    <div className="chart-container">
      <h2>Fleet Statistics</h2>

      <ResponsiveContainer width="100%" height={420}>
        <BarChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 10,
            bottom: 60,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis
            dataKey="name"
            angle={-20}
            textAnchor="end"
            interval={0}
          />

          <YAxis />

          <Tooltip />

          <Bar
            dataKey="count"
            radius={[8, 8, 0, 0]}
          >
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={entry.color}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default FleetChart;