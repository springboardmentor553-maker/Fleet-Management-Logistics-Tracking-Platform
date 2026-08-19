import React from "react";
import RoutePlanner from "../components/RoutePlanner";
import Navbar from "../components/Navbar";

function RoutePage() {
  return (
    <>
      <Navbar />

      <div className="route-page">
        <div className="route-content">

          <h1 className="route-title">
            Route Management
          </h1>

          <RoutePlanner />

        </div>
      </div>
    </>
  );
}

export default RoutePage;