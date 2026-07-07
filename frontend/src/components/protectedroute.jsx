function Dashboard() {
  return (
    <div style={{ padding: "20px" }}>
      <h1>FleetFlow Dashboard</h1>

      <h3>Welcome to Fleet Management System 🚚</h3>

      <div
        style={{
          display: "flex",
          gap: "20px",
          marginTop: "30px",
          flexWrap: "wrap",
        }}
      >
        <div style={cardStyle}>
          <h2>Drivers</h2>
          <h1>12</h1>
        </div>

        <div style={cardStyle}>
          <h2>Vehicles</h2>
          <h1>25</h1>
        </div>

        <div style={cardStyle}>
          <h2>Shipments</h2>
          <h1>45</h1>
        </div>

        <div style={cardStyle}>
          <h2>Fuel Alerts</h2>
          <h1>3</h1>
        </div>
      </div>
    </div>
  );
}

const cardStyle = {
  width: "220px",
  height: "140px",
  background: "#1976d2",
  color: "white",
  borderRadius: "10px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
};

export default Dashboard;