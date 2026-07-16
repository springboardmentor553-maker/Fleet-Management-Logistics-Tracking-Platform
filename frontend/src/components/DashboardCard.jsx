import React from "react";

const DashboardCard = ({ title, value, subtext, icon, color = "primary" }) => {
  return (
    <div className={`dashboard-card card-${color}`}>
      <div className="card-header">
        <span className="card-icon">{icon}</span>
        <span className="card-title">{title}</span>
      </div>
      <div className="card-body">
        <h3 className="card-value">{value}</h3>
        {subtext && <p className="card-subtext">{subtext}</p>}
      </div>
    </div>
  );
};

export default DashboardCard;
