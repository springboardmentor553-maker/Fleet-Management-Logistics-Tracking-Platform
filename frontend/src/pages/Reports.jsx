import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../services/api";

import {
  exportPDF,
  exportExcel,
} from "../utils/exportUtils";


function Reports() {

  const [driverReport, setDriverReport] = useState(null);
  const [vehicleReport, setVehicleReport] = useState(null);
  const [shipmentReport, setShipmentReport] = useState(null);
  const [maintenanceReport, setMaintenanceReport] = useState(null);
  const [fuelAnalytics, setFuelAnalytics] = useState(null);

  const [loading, setLoading] = useState(true);


  useEffect(() => {
    loadReports();
  }, []);


  const loadReports = async () => {

    try {

      setLoading(true);

      const drivers = await api.get("/reports/drivers");
      const vehicles = await api.get("/reports/vehicles");
      const shipments = await api.get("/reports/shipments");
      const maintenance = await api.get("/reports/maintenance");
      const fuel = await api.get("/fuel-records/analytics/fuel");

      setDriverReport(drivers.data);
      setVehicleReport(vehicles.data);
      setShipmentReport(shipments.data);
      setMaintenanceReport(maintenance.data);
      setFuelAnalytics(fuel.data);

    } catch (err) {

      console.log(err);

      window.alert("Failed to Load Reports");

    } finally {

      setLoading(false);

    }

  };


  /* ================= PDF EXPORT ================= */

  const handlePDF = () => {

    const rows = [];


    driverReport?.drivers?.forEach((d) => {

      rows.push([
        "Driver",
        d.driver_id,
        d.name,
        d.phone,
        d.license_number,
      ]);

    });


    vehicleReport?.vehicles?.forEach((v) => {

      rows.push([
        "Vehicle",
        v.vehicle_id,
        v.vehicle_number,
        v.vehicle_type,
        v.status,
      ]);

    });


    exportPDF(
      "FleetFlow Operational Report",
      ["Type", "ID", "Name", "Value1", "Value2"],
      rows
    );

  };


  /* ================= EXCEL EXPORT ================= */

  const handleExcel = () => {

    exportExcel(
      "Driver Report",
      driverReport?.drivers || []
    );

  };


  /* ================= LOADING ================= */

  if (loading) {

    return (

      <Layout>

        <div className="flex justify-center items-center py-24">

          <div className="text-center">

            <div className="text-5xl mb-4">
              📊
            </div>

            <p className="text-blue-400 text-lg font-semibold">
              Loading Reports...
            </p>

            <p className="text-slate-500 text-sm mt-2">
              Fetching fleet operational analytics
            </p>

          </div>

        </div>

      </Layout>

    );

  }


  return (

    <Layout>

      {/* ================= HEADER ================= */}

      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-5 mb-8">

        <div>

          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent">
            Operational Reports
          </h1>

          <p className="text-slate-400 mt-2">
            Fleet Monitoring & Operational Analytics
          </p>

        </div>


        {/* Export Buttons */}

        <div className="flex gap-3">

          <button
            onClick={handlePDF}
            className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white px-5 py-3 rounded-xl font-semibold shadow-lg shadow-red-900/20 transition"
          >
            📄 Export PDF
          </button>


          <button
            onClick={handleExcel}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white px-5 py-3 rounded-xl font-semibold shadow-lg shadow-green-900/20 transition"
          >
            📊 Export Excel
          </button>

        </div>

      </div>


      {/* ================= SUMMARY ================= */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-8">

        <SummaryCard
          title="Drivers"
          value={driverReport?.total_drivers || 0}
          icon="👨‍✈️"
          color="blue"
        />


        <SummaryCard
          title="Vehicles"
          value={vehicleReport?.total_vehicles || 0}
          icon="🚛"
          color="green"
        />


        <SummaryCard
          title="Shipments"
          value={shipmentReport?.total_shipments || 0}
          icon="📦"
          color="orange"
        />


        <SummaryCard
          title="Maintenance"
          value={
            maintenanceReport?.total_maintenance_records || 0
          }
          icon="🔧"
          color="red"
        />


        <SummaryCard
          title="Fuel Used"
          value={`${fuelAnalytics?.total_fuel_consumed || 0} L`}
          icon="⛽"
          color="purple"
        />

      </div>


      {/* ================= DRIVER REPORT ================= */}

      {driverReport && (

        <ReportSection
          title="Driver Report"
          subtitle="Driver information and license details"
          icon="👨‍✈️"
        >

          <div className="overflow-x-auto">

            <table className="w-full min-w-[650px]">

              <thead className="bg-blue-500/10">

                <tr>

                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>License</TableHead>

                </tr>

              </thead>


              <tbody>

                {driverReport.drivers?.map((d) => (

                  <tr
                    key={d.driver_id}
                    className="border-t border-slate-800 hover:bg-blue-500/5 transition"
                  >

                    <TableCell>
                      {d.driver_id}
                    </TableCell>

                    <TableCell>
                      {d.name}
                    </TableCell>

                    <TableCell>
                      {d.phone}
                    </TableCell>

                    <TableCell>
                      <Badge color="blue">
                        {d.license_number}
                      </Badge>
                    </TableCell>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </ReportSection>

      )}


      {/* ================= VEHICLE REPORT ================= */}

      {vehicleReport && (

        <ReportSection
          title="Vehicle Report"
          subtitle="Fleet vehicle status and information"
          icon="🚛"
        >

          <div className="overflow-x-auto">

            <table className="w-full min-w-[650px]">

              <thead className="bg-green-500/10">

                <tr>

                  <TableHead>ID</TableHead>
                  <TableHead>Vehicle No</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>

                </tr>

              </thead>


              <tbody>

                {vehicleReport.vehicles?.map((v) => (

                  <tr
                    key={v.vehicle_id}
                    className="border-t border-slate-800 hover:bg-green-500/5 transition"
                  >

                    <TableCell>
                      {v.vehicle_id}
                    </TableCell>

                    <TableCell>
                      <Badge color="blue">
                        {v.vehicle_number}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      {v.vehicle_type}
                    </TableCell>

                    <TableCell>
                      <StatusBadge status={v.status} />
                    </TableCell>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </ReportSection>

      )}


      {/* ================= SHIPMENT REPORT ================= */}

      {shipmentReport && (

        <ReportSection
          title="Shipment Summary"
          subtitle="Current shipment operational status"
          icon="📦"
        >

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

            <MetricCard
              title="Total"
              value={shipmentReport.total_shipments}
              color="blue"
            />

            <MetricCard
              title="Created"
              value={shipmentReport.created}
              color="slate"
            />

            <MetricCard
              title="Assigned"
              value={shipmentReport.assigned}
              color="indigo"
            />

            <MetricCard
              title="In Transit"
              value={shipmentReport.in_transit}
              color="orange"
            />

            <MetricCard
              title="Delivered"
              value={shipmentReport.delivered}
              color="green"
            />

            <MetricCard
              title="Delayed"
              value={shipmentReport.delayed}
              color="red"
            />

            <MetricCard
              title="Cancelled"
              value={shipmentReport.cancelled}
              color="gray"
            />

          </div>

        </ReportSection>

      )}


      {/* ================= FUEL ANALYTICS ================= */}

      {fuelAnalytics && (

        <ReportSection
          title="Fuel Monitoring"
          subtitle="Fuel consumption and cost analytics"
          icon="⛽"
        >

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

            <AnalyticsCard
              title="Total Fuel Consumed"
              value={`${fuelAnalytics.total_fuel_consumed || 0} L`}
              color="blue"
            />

            <AnalyticsCard
              title="Total Fuel Cost"
              value={`₹${fuelAnalytics.total_fuel_cost || 0}`}
              color="green"
            />

            <AnalyticsCard
              title="Average Fuel"
              value={fuelAnalytics.average_fuel_consumption || 0}
              color="orange"
            />

            <AnalyticsCard
              title="Highest Usage"
              value={
                fuelAnalytics
                  .vehicle_with_highest_fuel_usage
                  ?.vehicle_number || "N/A"
              }
              color="red"
            />

            <AnalyticsCard
              title="Lowest Usage"
              value={
                fuelAnalytics
                  .vehicle_with_lowest_fuel_usage
                  ?.vehicle_number || "N/A"
              }
              color="purple"
            />

          </div>

        </ReportSection>

      )}


      {/* ================= MAINTENANCE REPORT ================= */}

      {maintenanceReport && (

        <ReportSection
          title="Maintenance Report"
          subtitle="Vehicle maintenance performance and costs"
          icon="🔧"
        >

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

            <AnalyticsCard
              title="Total Records"
              value={
                maintenanceReport.total_maintenance_records || 0
              }
              color="blue"
            />

            <AnalyticsCard
              title="Under Maintenance"
              value={
                maintenanceReport.vehicles_under_maintenance || 0
              }
              color="orange"
            />

            <AnalyticsCard
              title="Completed"
              value={
                maintenanceReport.completed_services || 0
              }
              color="green"
            />

            <AnalyticsCard
              title="Overdue"
              value={
                maintenanceReport.overdue_services || 0
              }
              color="red"
            />

            <AnalyticsCard
              title="Total Cost"
              value={`₹${
                maintenanceReport.total_maintenance_cost || 0
              }`}
              color="purple"
            />

            <AnalyticsCard
              title="Most Frequent Category"
              value={
                maintenanceReport
                  .most_frequent_maintenance_category || "N/A"
              }
              color="indigo"
            />

          </div>

        </ReportSection>

      )}

    </Layout>

  );

}


/* ================================================= */
/* SUMMARY CARD */
/* ================================================= */

function SummaryCard({
  title,
  value,
  icon,
  color,
}) {

  const styles = {

    blue: {
      border: "border-blue-400/20",
      text: "text-blue-400",
      bg: "bg-blue-500/10",
    },

    green: {
      border: "border-green-400/20",
      text: "text-green-400",
      bg: "bg-green-500/10",
    },

    orange: {
      border: "border-orange-400/20",
      text: "text-orange-400",
      bg: "bg-orange-500/10",
    },

    red: {
      border: "border-red-400/20",
      text: "text-red-400",
      bg: "bg-red-500/10",
    },

    purple: {
      border: "border-purple-400/20",
      text: "text-purple-400",
      bg: "bg-purple-500/10",
    },

  };

  const style = styles[color] || styles.blue;


  return (

    <div
      className={`bg-slate-900/70 backdrop-blur-xl border ${style.border} rounded-2xl p-5 shadow-xl`}
    >

      <div className="flex items-center justify-between">

        <div>

          <p className="text-slate-400 text-sm">
            {title}
          </p>

          <p
            className={`text-3xl font-bold ${style.text} mt-2`}
          >
            {value}
          </p>

        </div>


        <div
          className={`w-12 h-12 rounded-xl ${style.bg} flex items-center justify-center text-2xl`}
        >
          {icon}
        </div>

      </div>

    </div>

  );

}


/* ================================================= */
/* REPORT SECTION */
/* ================================================= */

function ReportSection({
  title,
  subtitle,
  icon,
  children,
}) {

  return (

    <div className="bg-slate-900/75 backdrop-blur-xl border border-slate-700/60 rounded-2xl shadow-2xl mb-8 overflow-hidden">

      <div className="p-6 border-b border-slate-800">

        <div className="flex items-center gap-4">

          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-2xl">
            {icon}
          </div>

          <div>

            <h2 className="text-xl font-bold text-white">
              {title}
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              {subtitle}
            </p>

          </div>

        </div>

      </div>


      <div className="p-6">

        {children}

      </div>

    </div>

  );

}


/* ================================================= */
/* TABLE HEAD */
/* ================================================= */

function TableHead({ children }) {

  return (

    <th className="p-4 text-left text-blue-300 font-semibold text-sm">
      {children}
    </th>

  );

}


/* ================================================= */
/* TABLE CELL */
/* ================================================= */

function TableCell({ children }) {

  return (

    <td className="p-4 text-slate-300">
      {children}
    </td>

  );

}


/* ================================================= */
/* BADGE */
/* ================================================= */

function Badge({
  children,
  color = "blue",
}) {

  const styles = {

    blue:
      "bg-blue-500/10 text-blue-400 border-blue-500/20",

    green:
      "bg-green-500/10 text-green-400 border-green-500/20",

    orange:
      "bg-orange-500/10 text-orange-400 border-orange-500/20",

    purple:
      "bg-purple-500/10 text-purple-400 border-purple-500/20",

  };

  return (

    <span
      className={`inline-flex px-3 py-1 rounded-lg text-xs font-semibold border ${
        styles[color] || styles.blue
      }`}
    >
      {children}
    </span>

  );

}


/* ================================================= */
/* STATUS BADGE */
/* ================================================= */

function StatusBadge({ status }) {

  const value = status?.toLowerCase() || "";

  let style =
    "bg-slate-500/10 text-slate-400 border-slate-500/20";


  if (
    value.includes("active") ||
    value.includes("available")
  ) {

    style =
      "bg-green-500/10 text-green-400 border-green-500/20";

  }


  if (
    value.includes("maintenance") ||
    value.includes("pending")
  ) {

    style =
      "bg-orange-500/10 text-orange-400 border-orange-500/20";

  }


  if (
    value.includes("inactive") ||
    value.includes("cancel")
  ) {

    style =
      "bg-red-500/10 text-red-400 border-red-500/20";

  }


  return (

    <span
      className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border ${style}`}
    >
      {status || "Unknown"}
    </span>

  );

}


/* ================================================= */
/* METRIC CARD */
/* ================================================= */

function MetricCard({
  title,
  value,
  color,
}) {

  const styles = {

    blue:
      "bg-blue-500/10 border-blue-500/20 text-blue-400",

    green:
      "bg-green-500/10 border-green-500/20 text-green-400",

    orange:
      "bg-orange-500/10 border-orange-500/20 text-orange-400",

    red:
      "bg-red-500/10 border-red-500/20 text-red-400",

    indigo:
      "bg-indigo-500/10 border-indigo-500/20 text-indigo-400",

    slate:
      "bg-slate-500/10 border-slate-500/20 text-slate-300",

    gray:
      "bg-gray-500/10 border-gray-500/20 text-gray-300",

  };


  return (

    <div
      className={`border rounded-xl p-5 ${
        styles[color] || styles.blue
      }`}
    >

      <p className="text-sm opacity-70">
        {title}
      </p>

      <p className="text-2xl font-bold mt-2">
        {value ?? 0}
      </p>

    </div>

  );

}


/* ================================================= */
/* ANALYTICS CARD */
/* ================================================= */

function AnalyticsCard({
  title,
  value,
  color,
}) {

  const styles = {

    blue:
      "border-blue-500/20 text-blue-400",

    green:
      "border-green-500/20 text-green-400",

    orange:
      "border-orange-500/20 text-orange-400",

    red:
      "border-red-500/20 text-red-400",

    purple:
      "border-purple-500/20 text-purple-400",

    indigo:
      "border-indigo-500/20 text-indigo-400",

  };


  return (

    <div
      className={`bg-slate-950/60 border rounded-xl p-5 ${
        styles[color] || styles.blue
      }`}
    >

      <p className="text-slate-400 text-sm">
        {title}
      </p>

      <p className="text-xl font-bold mt-2">
        {value ?? 0}
      </p>

    </div>

  );

}


export default Reports;