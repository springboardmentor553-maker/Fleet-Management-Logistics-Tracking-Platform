import React, { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import "./OperationalAnalyticsPage.css";

const BASE_URL = "https://fleetflow-backend-90o5.onrender.com/dashboard";

const defaultDeliverySuccess = {
  total_deliveries: 0,
  delivered: 0,
  pending: 0,
  returned: 0,
  success_rate: 0,
};

function OperationalAnalyticsPage() {
  const [analytics, setAnalytics] = useState({
    vehicleUtilization: {},
    driverWorkload: [],
    shipmentPerformance: [],
    deliverySuccess: defaultDeliverySuccess,
    routeAnalytics: {},
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        vehicle,
        driver,
        shipment,
        delivery,
        route,
      ] = await Promise.all([
        axios.get(`${BASE_URL}/vehicle-utilization`),
        axios.get(`${BASE_URL}/driver-workload`),
        axios.get(`${BASE_URL}/shipment-performance`),
        axios.get(`${BASE_URL}/delivery-success`),
        axios.get(`${BASE_URL}/route-analytics`),
      ]);

      setAnalytics({
        vehicleUtilization: vehicle.data || {},
        driverWorkload: Array.isArray(driver.data)
          ? driver.data
          : [],
        shipmentPerformance: Array.isArray(shipment.data)
          ? shipment.data
          : [],
        deliverySuccess:
          delivery.data || defaultDeliverySuccess,
        routeAnalytics: route.data || {},
      });
    } catch (err) {
      console.error("Analytics error:", err);

      setError(
        err.response?.data?.detail ||
          "Unable to load operational analytics."
      );
    } finally {
      setLoading(false);
    }
  };

  const shipmentColors = [
    "#28a745",
    "#ffc107",
    "#dc3545",
    "#17a2b8",
    "#6f42c1",
    "#fd7e14",
  ];

  if (loading) {
    return (
      <>
        <Navbar />

        <main className="operational-page">
          <div className="analytics-loading">
            <div className="spinner-border text-primary"></div>
            <h4>Loading Analytics...</h4>
          </div>
        </main>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />

        <main className="operational-page">
          <div className="analytics-error">
            <h4>Unable to Load Analytics</h4>

            <p>{error}</p>

            <button
              className="retry-button"
              onClick={fetchAnalytics}
            >
              🔄 Try Again
            </button>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <main className="operational-page">

        {/* =====================================
            HEADER
        ===================================== */}

        <div className="operational-header">

          <div>
            <h2>Operational Analytics Dashboard</h2>

            <p>
              Fleet, driver, shipment and route
              performance overview
            </p>
          </div>

          <button
            className="refresh-button"
            onClick={fetchAnalytics}
          >
            🔄 Refresh
          </button>

        </div>


        {/* =====================================
            DELIVERY PERFORMANCE
        ===================================== */}

        <div className="analytics-card">

          <div className="analytics-card-header success-header">
            Delivery Performance
          </div>

          <div className="analytics-card-body">

            <div className="delivery-summary">

              <div className="delivery-item">

                <h5>Total Deliveries</h5>

                <h2>
                  {analytics.deliverySuccess
                    .total_deliveries || 0}
                </h2>

              </div>


              <div className="delivery-item">

                <h5>Successful</h5>

                <h2 className="success-text">
                  {analytics.deliverySuccess
                    .delivered || 0}
                </h2>

              </div>


              <div className="delivery-item">

                <h5>Success Rate</h5>

                <h2 className="primary-text">
                  {analytics.deliverySuccess
                    .success_rate || 0}%
                </h2>

              </div>

            </div>

          </div>

        </div>


        {/* =====================================
            VEHICLE UTILIZATION
        ===================================== */}

        <div className="analytics-card">

          <div className="analytics-card-header primary-header">
            Vehicle Utilization
          </div>

          <div className="analytics-card-body">

            <div className="table-wrapper">

              <table className="analytics-table">

                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Count</th>
                  </tr>
                </thead>

                <tbody>

                  <tr>
                    <td>Available</td>
                    <td>
                      {analytics.vehicleUtilization
                        .Available || 0}
                    </td>
                  </tr>

                  <tr>
                    <td>Active</td>
                    <td>
                      {analytics.vehicleUtilization
                        .Active || 0}
                    </td>
                  </tr>

                  <tr>
                    <td>Maintenance</td>
                    <td>
                      {analytics.vehicleUtilization
                        .Maintenance || 0}
                    </td>
                  </tr>

                  <tr>
                    <td>Inactive</td>
                    <td>
                      {analytics.vehicleUtilization
                        .Inactive || 0}
                    </td>
                  </tr>

                  <tr className="total-row">
                    <td>
                      <strong>Total</strong>
                    </td>

                    <td>
                      <strong>
                        {analytics.vehicleUtilization
                          .Total || 0}
                      </strong>
                    </td>
                  </tr>

                </tbody>

              </table>

            </div>

          </div>

        </div>


        {/* =====================================
            DRIVER WORKLOAD
        ===================================== */}

        <div className="analytics-card">

          <div className="analytics-card-header warning-header">
            Driver Workload
          </div>

          <div className="analytics-card-body">

            <div className="table-wrapper">

              <table className="analytics-table">

                <thead>
                  <tr>
                    <th>Driver ID</th>
                    <th>Driver Name</th>
                    <th>Total Shipments</th>
                  </tr>
                </thead>

                <tbody>

                  {analytics.driverWorkload.length === 0 ? (

                    <tr>
                      <td
                        colSpan="3"
                        className="empty-cell"
                      >
                        No driver workload data available
                      </td>
                    </tr>

                  ) : (

                    analytics.driverWorkload.map(
                      (item, index) => (

                        <tr key={index}>

                          <td>
                            {item.driver_id}
                          </td>

                          <td>
                            {item.driver_name}
                          </td>

                          <td>
                            {item.total_shipments}
                          </td>

                        </tr>

                      )
                    )

                  )}

                </tbody>

              </table>

            </div>

          </div>

        </div>


        {/* =====================================
            ROUTE ANALYTICS
        ===================================== */}

        <div className="analytics-card">

          <div className="analytics-card-header secondary-header">
            Route Analytics
          </div>

          <div className="analytics-card-body">

            <div className="table-wrapper">

              <table className="analytics-table">

                <thead>
                  <tr>
                    <th>Metric</th>
                    <th>Value</th>
                  </tr>
                </thead>

                <tbody>

                  <tr>
                    <td>Total Routes</td>
                    <td>
                      {analytics.routeAnalytics
                        .total_routes || 0}
                    </td>
                  </tr>

                  <tr>
                    <td>Active Routes</td>
                    <td>
                      {analytics.routeAnalytics
                        .active_routes || 0}
                    </td>
                  </tr>

                  <tr>
                    <td>Inactive Routes</td>
                    <td>
                      {analytics.routeAnalytics
                        .inactive_routes || 0}
                    </td>
                  </tr>

                  <tr>
                    <td>Closed Routes</td>
                    <td>
                      {analytics.routeAnalytics
                        .closed_routes || 0}
                    </td>
                  </tr>

                  <tr>
                    <td>Completion Rate</td>
                    <td>
                      {analytics.routeAnalytics
                        .completion_rate || 0}%
                    </td>
                  </tr>

                </tbody>

              </table>

            </div>

          </div>

        </div>


        {/* =====================================
            SHIPMENT PERFORMANCE
        ===================================== */}

        <div className="analytics-card">

          <div className="analytics-card-header info-header">
            Shipment Performance
          </div>

          <div className="analytics-card-body">

            {analytics.shipmentPerformance.length === 0 ? (

              <p className="empty-message">
                No shipment performance data available.
              </p>

            ) : (

              <>

                {/* TABLE */}

                <div className="table-wrapper">

                  <table className="analytics-table">

                    <thead>
                      <tr>
                        <th>Status</th>
                        <th>Total Shipments</th>
                      </tr>
                    </thead>

                    <tbody>

                      {analytics.shipmentPerformance.map(
                        (item, index) => (

                          <tr key={index}>

                            <td>
                              {item.status}
                            </td>

                            <td>
                              {item.total_shipments}
                            </td>

                          </tr>

                        )
                      )}

                    </tbody>

                  </table>

                </div>


                {/* =================================
                    PIE CHART
                ================================= */}

                <div className="shipment-chart">

                  <h4>
                    Shipment Status Distribution
                  </h4>

                  <div className="pie-chart-container">

                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >

                      <PieChart>

                        <Pie
                          data={
                            analytics.shipmentPerformance
                          }
                          dataKey="total_shipments"
                          nameKey="status"
                          cx="50%"
                          cy="45%"
                          outerRadius="65%"
                          labelLine={false}
                          label={({
                            name,
                            percent,
                          }) =>
                            `${name} ${(percent * 100).toFixed(
                              0
                            )}%`
                          }
                        >

                          {analytics.shipmentPerformance.map(
                            (entry, index) => (

                              <Cell
                                key={`cell-${index}`}
                                fill={
                                  shipmentColors[
                                    index %
                                      shipmentColors.length
                                  ]
                                }
                              />

                            )
                          )}

                        </Pie>

                        <Tooltip />

                        <Legend
                          verticalAlign="bottom"
                          height={36}
                          wrapperStyle={{
                            fontSize: "13px",
                          }}
                        />

                      </PieChart>

                    </ResponsiveContainer>

                  </div>

                </div>

              </>

            )}

          </div>

        </div>

      </main>
    </>
  );
}

export default OperationalAnalyticsPage;