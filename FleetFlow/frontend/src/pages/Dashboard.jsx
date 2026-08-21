import { useEffect, useState } from "react";

import api from "../services/api";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";


function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get("/dashboard/");

        setData(response.data);
      } catch (err) {
        console.error("Dashboard error:", err);

        setError(
          err.response?.data?.detail ||
          "Unable to load dashboard data."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);


  if (loading) {
    return (
      <div className="dashboard-header">
        <h1>FleetFlow Dashboard</h1>
        <p>Loading fleet information...</p>
      </div>
    );
  }


  if (error) {
    return (
      <div className="dashboard-header">
        <h1>FleetFlow Dashboard</h1>

        <p>
          {error}
        </p>
      </div>
    );
  }


  const stats = [
    {
      title: "Total Vehicles",
      value: data.total_vehicles,
      description: "Vehicles registered in the fleet",
      icon: "🚚",
    },
    {
      title: "Total Drivers",
      value: data.total_drivers,
      description: "Drivers registered",
      icon: "👤",
    },
    {
      title: "Total Shipments",
      value: data.total_shipments,
      description: "Shipments in the system",
      icon: "📦",
    },
    {
      title: "Active Deliveries",
      value: data.active_deliveries,
      description: "Currently in progress",
      icon: "🛣️",
    },
  ];


  return (
    <div>

      <div className="dashboard-header">
        <h1>FleetFlow Dashboard</h1>

        <p>
          Overview of your fleet and logistics operations.
        </p>
      </div>


      {/* Statistics */}

      <div className="stats-grid">

        {stats.map((stat) => (
          <Card key={stat.title}>

            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">

              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>

              <span className="text-xl">
                {stat.icon}
              </span>

            </CardHeader>

            <CardContent>

              <div className="text-3xl font-bold">
                {stat.value}
              </div>

              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>

            </CardContent>

          </Card>
        ))}

      </div>


      {/* Shipment Overview */}

      <div className="dashboard-grid">

        <Card>

          <CardHeader>

            <CardTitle>
              Shipment Overview
            </CardTitle>

          </CardHeader>

          <CardContent>

            <div className="status-list">

              <div className="status-row">

                <div className="status-info">
                  <span className="status-dot" />
                  <span className="status-name">
                    Active Deliveries
                  </span>
                </div>

                <Badge>
                  {data.active_deliveries}
                </Badge>

              </div>


              <div className="status-row">

                <div className="status-info">
                  <span className="status-dot" />
                  <span className="status-name">
                    Delivered Shipments
                  </span>
                </div>

                <Badge variant="secondary">
                  {data.delivered_shipments}
                </Badge>

              </div>


              <div className="status-row">

                <div className="status-info">
                  <span className="status-dot danger" />
                  <span className="status-name">
                    Delayed Shipments
                  </span>
                </div>

                <Badge variant="destructive">
                  {data.delayed_shipments}
                </Badge>

              </div>

            </div>

          </CardContent>

        </Card>


        {/* System Overview */}

        <Card>

          <CardHeader>

            <CardTitle>
              System Overview
            </CardTitle>

          </CardHeader>

          <CardContent>

            <div className="status-list">

              <div className="status-row">
                <span className="status-name">
                  Users
                </span>

                <strong>
                  {data.total_users}
                </strong>
              </div>


              <div className="status-row">
                <span className="status-name">
                  Drivers
                </span>

                <strong>
                  {data.total_drivers}
                </strong>
              </div>


              <div className="status-row">
                <span className="status-name">
                  Vehicles
                </span>

                <strong>
                  {data.total_vehicles}
                </strong>
              </div>


              <div className="status-row">
                <span className="status-name">
                  Shipments
                </span>

                <strong>
                  {data.total_shipments}
                </strong>
              </div>

            </div>

          </CardContent>

        </Card>

      </div>

    </div>
  );
}


export default Dashboard;