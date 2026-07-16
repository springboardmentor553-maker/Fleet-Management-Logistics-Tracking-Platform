import React from "react";

const LoadingSpinner = ({ fullPage = false }) => {
  const spinner = (
    <div className="spinner-container">
      <div className="spinner"></div>
      <p className="spinner-text">Loading FleetFlow...</p>
    </div>
  );

  if (fullPage) {
    return <div className="spinner-full-page">{spinner}</div>;
  }

  return spinner;
};

export default LoadingSpinner;
