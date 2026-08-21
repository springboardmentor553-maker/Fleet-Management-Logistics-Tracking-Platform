import { useEffect, useState } from "react";
import api from "../services/api";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function Analytics() {
  const [fleet, setFleet] = useState(null);
  const [operations, setOperations] = useState(null);
  const [fuel, setFuel] = useState(null);
  const [vehicles, setVehicles] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        fleetResponse,
        operationsResponse,
        fuelResponse,
        vehiclesResponse,
      ] = await Promise.all([
        api.get("/dashboard/fleet"),
        api.get("/analytics/operations"),
        api.get("/analytics/fuel"),
        api.get("/vehicles/"),
      ]);

      setFleet(fleetResponse.data);
      setOperations(operationsResponse.data);
      setFuel(fuelResponse.data);
      setVehicles(vehiclesResponse.data);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
        "Unable to load analytics."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const getVehicleName = (vehicleId) => {
    if (!vehicleId) {
      return "—";
    }

    const vehicle = vehicles.find(
      (item) => item.id === vehicleId
    );

    if (!vehicle) {
      return `Vehicle #${vehicleId}`;
    }

    return vehicle.registration_number;
  };

  const formatNumber = (value) => {
    if (value === null || value === undefined) {
      return "—";
    }

    return Number(value).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    });
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined) {
      return "—";
    }

    return `₹${Number(value).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })}`;
  };

  const formatMinutes = (value) => {
    if (value === null || value === undefined) {
      return "—";
    }

    const minutes = Math.round(Number(value));

    if (minutes < 60) {
      return `${minutes} min`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
      return `${hours} hr`;
    }

    return `${hours} hr ${remainingMinutes} min`;
  };

  if (loading) {
    return (
      <div className="empty-state">
        Loading analytics...
      </div>
    );
  }

  return (
    <div>

      <div className="page-heading">

        <div>
          <h1>Analytics</h1>

          <p>
            Fleet performance, operations and fuel
            analytics.
          </p>
        </div>

        <button
          className="analytics-refresh"
          onClick={fetchAnalytics}
        >
          ↻ Refresh
        </button>

      </div>


      {error && (
        <div className="error-message">
          {error}
        </div>
      )}


      {/* Fleet Overview */}

      <section className="analytics-section">

        <div className="analytics-section-header">

          <div>
            <h2>Fleet Overview</h2>

            <p>
              Current fleet and resource status.
            </p>
          </div>

        </div>


        <div className="analytics-grid">

          <Card>
            <CardContent className="analytics-card-content">
              <span className="analytics-icon">
                🚚
              </span>

              <div>
                <p className="analytics-label">
                  Total Vehicles
                </p>

                <h3>
                  {formatNumber(
                    fleet?.total_vehicles
                  )}
                </h3>
              </div>
            </CardContent>
          </Card>


          <Card>
            <CardContent className="analytics-card-content">
              <span className="analytics-icon">
                ✓
              </span>

              <div>
                <p className="analytics-label">
                  Active Vehicles
                </p>

                <h3>
                  {formatNumber(
                    fleet?.active_vehicles
                  )}
                </h3>
              </div>
            </CardContent>
          </Card>


          <Card>
            <CardContent className="analytics-card-content">
              <span className="analytics-icon">
                🔧
              </span>

              <div>
                <p className="analytics-label">
                  Under Maintenance
                </p>

                <h3>
                  {formatNumber(
                    fleet?.vehicles_under_maintenance
                  )}
                </h3>
              </div>
            </CardContent>
          </Card>


          <Card>
            <CardContent className="analytics-card-content">
              <span className="analytics-icon">
                👤
              </span>

              <div>
                <p className="analytics-label">
                  Total Drivers
                </p>

                <h3>
                  {formatNumber(
                    fleet?.total_drivers
                  )}
                </h3>
              </div>
            </CardContent>
          </Card>


          <Card>
            <CardContent className="analytics-card-content">
              <span className="analytics-icon">
                🟢
              </span>

              <div>
                <p className="analytics-label">
                  Available Drivers
                </p>

                <h3>
                  {formatNumber(
                    fleet?.available_drivers
                  )}
                </h3>
              </div>
            </CardContent>
          </Card>


          <Card>
            <CardContent className="analytics-card-content">
              <span className="analytics-icon">
                🚛
              </span>

              <div>
                <p className="analytics-label">
                  Assigned Drivers
                </p>

                <h3>
                  {formatNumber(
                    fleet?.assigned_drivers
                  )}
                </h3>
              </div>
            </CardContent>
          </Card>


          <Card>
            <CardContent className="analytics-card-content">
              <span className="analytics-icon">
                🛣
              </span>

              <div>
                <p className="analytics-label">
                  Total Trips
                </p>

                <h3>
                  {formatNumber(
                    fleet?.total_trips
                  )}
                </h3>
              </div>
            </CardContent>
          </Card>


          <Card>
            <CardContent className="analytics-card-content">
              <span className="analytics-icon">
                ✓
              </span>

              <div>
                <p className="analytics-label">
                  Completed Trips
                </p>

                <h3>
                  {formatNumber(
                    fleet?.completed_trips
                  )}
                </h3>
              </div>
            </CardContent>
          </Card>


          <Card>
            <CardContent className="analytics-card-content">
              <span className="analytics-icon">
                📦
              </span>

              <div>
                <p className="analytics-label">
                  Active Shipments
                </p>

                <h3>
                  {formatNumber(
                    fleet?.active_shipments
                  )}
                </h3>
              </div>
            </CardContent>
          </Card>

        </div>

      </section>


      {/* Operational Analytics */}

      <section className="analytics-section">

        <div className="analytics-section-header">

          <div>
            <h2>Operational Performance</h2>

            <p>
              Delivery and trip performance.
            </p>
          </div>

        </div>


        <div className="analytics-grid">

          <Card>
            <CardContent className="analytics-card-content">
              <span className="analytics-icon">
                📦
              </span>

              <div>
                <p className="analytics-label">
                  Total Deliveries
                </p>

                <h3>
                  {formatNumber(
                    operations?.total_deliveries
                  )}
                </h3>
              </div>
            </CardContent>
          </Card>


          <Card>
            <CardContent className="analytics-card-content">
              <span className="analytics-icon">
                ✓
              </span>

              <div>
                <p className="analytics-label">
                  Successful Deliveries
                </p>

                <h3>
                  {formatNumber(
                    operations?.successful_deliveries
                  )}
                </h3>
              </div>
            </CardContent>
          </Card>


          <Card>
            <CardContent className="analytics-card-content">
              <span className="analytics-icon">
                ⏱
              </span>

              <div>
                <p className="analytics-label">
                  Delayed Deliveries
                </p>

                <h3>
                  {formatNumber(
                    operations?.delayed_deliveries
                  )}
                </h3>
              </div>
            </CardContent>
          </Card>


          <Card>
            <CardContent className="analytics-card-content">
              <span className="analytics-icon">
                ✕
              </span>

              <div>
                <p className="analytics-label">
                  Cancelled Deliveries
                </p>

                <h3>
                  {formatNumber(
                    operations?.cancelled_deliveries
                  )}
                </h3>
              </div>
            </CardContent>
          </Card>


          <Card>
            <CardContent className="analytics-card-content">
              <span className="analytics-icon">
                🛣
              </span>

              <div>
                <p className="analytics-label">
                  Average Trip Distance
                </p>

                <h3>
                  {formatNumber(
                    operations?.average_trip_distance
                  )}
                  {" km"}
                </h3>
              </div>
            </CardContent>
          </Card>


          <Card>
            <CardContent className="analytics-card-content">
              <span className="analytics-icon">
                ⏱
              </span>

              <div>
                <p className="analytics-label">
                  Average Delivery Time
                </p>

                <h3>
                  {formatMinutes(
                    operations?.average_delivery_time_minutes
                  )}
                </h3>
              </div>
            </CardContent>
          </Card>

        </div>

      </section>


      {/* Fuel Analytics */}

      <section className="analytics-section">

        <div className="analytics-section-header">

          <div>
            <h2>Fuel Analytics</h2>

            <p>
              Fuel consumption and cost overview.
            </p>
          </div>

        </div>


        <div className="analytics-grid">

          <Card>
            <CardContent className="analytics-card-content">
              <span className="analytics-icon">
                ⛽
              </span>

              <div>
                <p className="analytics-label">
                  Total Fuel Consumed
                </p>

                <h3>
                  {formatNumber(
                    fuel?.total_fuel_consumed
                  )}
                  {" L"}
                </h3>
              </div>
            </CardContent>
          </Card>


          <Card>
            <CardContent className="analytics-card-content">
              <span className="analytics-icon">
                ₹
              </span>

              <div>
                <p className="analytics-label">
                  Total Fuel Cost
                </p>

                <h3>
                  {formatCurrency(
                    fuel?.total_fuel_cost
                  )}
                </h3>
              </div>
            </CardContent>
          </Card>


          <Card>
            <CardContent className="analytics-card-content">
              <span className="analytics-icon">
                📊
              </span>

              <div>
                <p className="analytics-label">
                  Average Fuel Consumption
                </p>

                <h3>
                  {formatNumber(
                    fuel?.average_fuel_consumption
                  )}
                  {" L"}
                </h3>
              </div>
            </CardContent>
          </Card>


          <Card>
            <CardContent className="analytics-card-content">

              <span className="analytics-icon">
                ↑
              </span>

              <div>

                <p className="analytics-label">
                  Highest Fuel Usage
                </p>

                <h3>
                  {getVehicleName(
                    fuel?.vehicle_with_highest_fuel_usage
                  )}
                </h3>

              </div>

            </CardContent>
          </Card>


          <Card>
            <CardContent className="analytics-card-content">

              <span className="analytics-icon">
                ↓
              </span>

              <div>

                <p className="analytics-label">
                  Lowest Fuel Usage
                </p>

                <h3>
                  {getVehicleName(
                    fuel?.vehicle_with_lowest_fuel_usage
                  )}
                </h3>

              </div>

            </CardContent>
          </Card>

        </div>

      </section>

    </div>
  );
}

export default Analytics;