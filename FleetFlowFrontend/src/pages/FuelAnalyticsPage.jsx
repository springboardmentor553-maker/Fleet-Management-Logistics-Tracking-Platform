import React, { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";

import "./FuelAnalyticsPage.css";

const API_URL = "http://127.0.0.1:8000/analytics";

function FuelAnalyticsPage() {
  const [fuelRecords, setFuelRecords] = useState([]);

  const [summary, setSummary] = useState({
    total_fuel_consumed: 0,
    total_fuel_cost: 0,
    average_consumption: 0,
    highest_vehicle: "-",
    lowest_vehicle: "-",
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFuelAnalytics();
  }, []);

  const fetchFuelAnalytics = async () => {
    try {
      const response = await axios.get(`${API_URL}/fuel`);

      setSummary({
        total_fuel_consumed:
          response.data.total_fuel_consumed || 0,

        total_fuel_cost:
          response.data.total_fuel_cost || 0,

        average_consumption:
          response.data.average_fuel_consumption || 0,

        highest_vehicle:
          response.data.highest_fuel_usage_vehicle || "-",

        lowest_vehicle:
          response.data.lowest_fuel_usage_vehicle || "-",
      });

      setFuelRecords(
        response.data.fuel_records || []
      );
    } catch (error) {
      console.error("Fuel analytics error:", error);

      alert("Unable to load fuel analytics.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />

        <main className="fuel-page">
          <div className="fuel-header">
            <h2>Fuel Monitoring Analytics</h2>
            <p>Loading fuel analytics...</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <main className="fuel-page">

        {/* PAGE HEADER */}
        <div className="fuel-header">
          <h2>Fuel Monitoring Analytics</h2>

          <p>
            Monitor fuel consumption, fuel costs and vehicle
            fuel performance.
          </p>
        </div>

        {/* ============================= */}
        {/* SUMMARY CARDS */}
        {/* ============================= */}

        <div className="fuel-summary">

          {/* Total Fuel Consumed */}
          <div className="fuel-card primary-card">
            <h5>Total Fuel Consumed</h5>

            <h2>
              {summary.total_fuel_consumed} L
            </h2>
          </div>


          {/* Total Fuel Cost */}
          <div className="fuel-card success-card">
            <h5>Total Fuel Cost</h5>

            <h2>
              ₹ {summary.total_fuel_cost}
            </h2>
          </div>


          {/* Average Consumption */}
          <div className="fuel-card warning-card">
            <h5>Average Consumption</h5>

            <h2>
              {summary.average_consumption} km/L
            </h2>
          </div>


          {/* Highest Vehicle */}
          <div className="fuel-card danger-card">
            <h5>Highest Fuel Usage Vehicle</h5>

            <h4>
              {summary.highest_vehicle}
            </h4>
          </div>


          {/* Lowest Vehicle */}
          <div className="fuel-card info-card">
            <h5>Lowest Fuel Usage Vehicle</h5>

            <h4>
              {summary.lowest_vehicle}
            </h4>
          </div>

        </div>


        {/* ============================= */}
        {/* FUEL RECORDS */}
        {/* ============================= */}

        <div className="fuel-table-card">

          <div className="fuel-table-header">
            Fuel Consumption Records
          </div>

          <div className="fuel-table-body">

            <div className="fuel-table-wrapper">

              <table className="fuel-table">

                <thead>
                  <tr>
                    <th>Vehicle ID</th>
                    <th>Fuel Date</th>
                    <th>Fuel Amount</th>
                    <th>Cost</th>
                    <th>Mileage</th>
                  </tr>
                </thead>

                <tbody>

                  {fuelRecords.length === 0 ? (

                    <tr>
                      <td
                        colSpan="5"
                        className="empty-fuel"
                      >
                        No Fuel Records Found
                      </td>
                    </tr>

                  ) : (

                    fuelRecords.map((fuel, index) => (

                      <tr key={index}>

                        <td>
                          {fuel.vehicle_id}
                        </td>

                        <td>
                          {fuel.fuel_date}
                        </td>

                        <td>
                          {fuel.fuel_amount} L
                        </td>

                        <td>
                          ₹ {fuel.fuel_cost}
                        </td>

                        <td>
                          {fuel.mileage}
                        </td>

                      </tr>

                    ))

                  )}

                </tbody>

              </table>

            </div>

          </div>

        </div>

      </main>
    </>
  );
}

export default FuelAnalyticsPage;