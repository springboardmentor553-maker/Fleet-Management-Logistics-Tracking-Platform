import React, { useEffect, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";

import {
  FiBarChart2,
  FiCheckCircle,
  FiClock,
  FiDollarSign,
  FiRefreshCw,
  FiTool,
  FiTruck,
  FiAlertTriangle,
  FiDroplet,
  FiUsers,
  FiPackage,
  FiActivity,
} from "react-icons/fi";


const API = axios.create({
  baseURL: "http://127.0.0.1:8000",
});


const getAuthHeaders = () => {
  const token = localStorage.getItem("token");

  return {
    Authorization: `Bearer ${token}`,
  };
};


function Reports() {
  const [activeReport, setActiveReport] =
    useState("maintenance");

  const [reports, setReports] = useState({
    maintenance: null,
    fleet: null,
    fuel: null,
    driver: null,
    delivery: null,
  });

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");


  // ==========================================================
  // ERROR HANDLER
  // ==========================================================

  const getErrorMessage = (err) => {
    const detail =
      err?.response?.data?.detail;

    if (typeof detail === "string") {
      return detail;
    }

    if (Array.isArray(detail)) {
      return detail
        .map(
          (item) =>
            item?.msg ||
            String(item)
        )
        .join(", ");
    }

    return "Unable to load reports.";
  };


  // ==========================================================
  // LOAD ALL REPORTS
  // ==========================================================

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError("");

      const headers =
        getAuthHeaders();

      const [
        maintenance,
        fleet,
        fuel,
        driver,
        delivery,
      ] = await Promise.all([
        API.get(
          "/reports/maintenance",
          { headers }
        ),

        API.get(
          "/reports/fleet-utilization",
          { headers }
        ),

        API.get(
          "/reports/fuel-consumption",
          { headers }
        ),

        API.get(
          "/reports/driver-performance",
          { headers }
        ),

        API.get(
          "/reports/delivery-performance",
          { headers }
        ),
      ]);


      setReports({
        maintenance:
          maintenance.data,

        fleet:
          fleet.data,

        fuel:
          fuel.data,

        driver:
          driver.data,

        delivery:
          delivery.data,
      });

    } catch (err) {
      console.error(
        "Error loading reports:",
        err
      );

      setError(
        getErrorMessage(err)
      );

    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchReports();
  }, []);


  // ==========================================================
  // EXCEL - ALL REPORTS
  // ==========================================================

  const exportAllToExcel = () => {
    if (
      !reports.maintenance ||
      !reports.fleet ||
      !reports.fuel ||
      !reports.driver ||
      !reports.delivery
    ) {
      setError(
        "Reports are still loading. Please try again."
      );
      return;
    }


    const workbook =
      XLSX.utils.book_new();


    // --------------------------------------------------------
    // MAINTENANCE SHEET
    // --------------------------------------------------------

    const maintenanceRows = [
      ["Maintenance Report", ""],
      [""],
      [
        "Metric",
        "Value",
      ],
      [
        "Total Maintenance Records",
        reports.maintenance
          .totalMaintenanceRecords,
      ],
      [
        "Vehicles Under Maintenance",
        reports.maintenance
          .vehiclesUnderMaintenance,
      ],
      [
        "Completed Services",
        reports.maintenance
          .completedServices,
      ],
      [
        "Overdue Services",
        reports.maintenance
          .overdueServices,
      ],
      [
        "Total Maintenance Cost",
        reports.maintenance
          .totalMaintenanceCost,
      ],
      [
        "Most Frequent Category",
        reports.maintenance
          .mostFrequentMaintenanceCategory,
      ],
    ];


    const maintenanceSheet =
      XLSX.utils.aoa_to_sheet(
        maintenanceRows
      );

    XLSX.utils.book_append_sheet(
      workbook,
      maintenanceSheet,
      "Maintenance"
    );


    // --------------------------------------------------------
    // FLEET UTILIZATION SHEET
    // --------------------------------------------------------

    const fleetRows = [
      ["Fleet Utilization Report", ""],
      [""],
      [
        "Metric",
        "Value",
      ],
      [
        "Total Vehicles",
        reports.fleet.totalVehicles,
      ],
      [
        "Available Vehicles",
        reports.fleet.availableVehicles,
      ],
      [
        "Vehicles On Trip",
        reports.fleet.vehiclesOnTrip,
      ],
      [
        "Vehicles Under Maintenance",
        reports.fleet
          .vehiclesUnderMaintenance,
      ],
      [
        "Inactive Vehicles",
        reports.fleet.inactiveVehicles,
      ],
      [
        "Utilization Rate",
        `${reports.fleet.utilizationRate}%`,
      ],
    ];


    const fleetSheet =
      XLSX.utils.aoa_to_sheet(
        fleetRows
      );

    XLSX.utils.book_append_sheet(
      workbook,
      fleetSheet,
      "Fleet Utilization"
    );


    // --------------------------------------------------------
    // FUEL CONSUMPTION SHEET
    // --------------------------------------------------------

    const fuelRows = [
      ["Fuel Consumption Report", ""],
      [""],
      [
        "Metric",
        "Value",
      ],
      [
        "Total Fuel Records",
        reports.fuel.totalFuelRecords,
      ],
      [
        "Total Fuel Quantity",
        reports.fuel.totalFuelQuantity,
      ],
      [
        "Total Fuel Cost",
        reports.fuel.totalFuelCost,
      ],
      [
        "Average Fuel Cost",
        reports.fuel.averageFuelCost,
      ],
      [""],
      [
        "Vehicle ID",
        "Fuel Quantity (L)",
        "Fuel Cost",
      ],
    ];


    reports.fuel.vehicleBreakdown?.forEach(
      (vehicle) => {
        fuelRows.push([
          `Vehicle #${vehicle.vehicleId}`,
          vehicle.fuelQuantity,
          vehicle.fuelCost,
        ]);
      }
    );


    const fuelSheet =
      XLSX.utils.aoa_to_sheet(
        fuelRows
      );

    XLSX.utils.book_append_sheet(
      workbook,
      fuelSheet,
      "Fuel Consumption"
    );


    // --------------------------------------------------------
    // DRIVER PERFORMANCE SHEET
    // --------------------------------------------------------

    const driverRows = [
      ["Driver Performance Report", ""],
      [""],
      [
        "Metric",
        "Value",
      ],
      [
        "Total Drivers",
        reports.driver.totalDrivers,
      ],
      [
        "Total Trips",
        reports.driver.totalTrips,
      ],
      [
        "Completed Trips",
        reports.driver.completedTrips,
      ],
      [
        "Active Trips",
        reports.driver.activeTrips,
      ],
      [
        "Cancelled Trips",
        reports.driver.cancelledTrips,
      ],
      [
        "Best Performing Driver",
        reports.driver.bestPerformingDriver,
      ],
      [""],
      [
        "Driver",
        "Total Trips",
        "Completed Trips",
        "Active Trips",
        "Cancelled Trips",
      ],
    ];


    reports.driver.drivers?.forEach(
      (driver) => {
        driverRows.push([
          driver.driverName,
          driver.totalTrips,
          driver.completedTrips,
          driver.activeTrips,
          driver.cancelledTrips,
        ]);
      }
    );


    const driverSheet =
      XLSX.utils.aoa_to_sheet(
        driverRows
      );

    XLSX.utils.book_append_sheet(
      workbook,
      driverSheet,
      "Driver Performance"
    );


    // --------------------------------------------------------
    // DELIVERY PERFORMANCE SHEET
    // --------------------------------------------------------

    const deliveryRows = [
      ["Delivery Performance Report", ""],
      [""],
      [
        "Metric",
        "Value",
      ],
      [
        "Total Shipments",
        reports.delivery.totalShipments,
      ],
      [
        "Delivered Shipments",
        reports.delivery.deliveredShipments,
      ],
      [
        "In Transit Shipments",
        reports.delivery.inTransitShipments,
      ],
      [
        "Delayed Shipments",
        reports.delivery.delayedShipments,
      ],
      [
        "Cancelled Shipments",
        reports.delivery.cancelledShipments,
      ],
      [
        "Pending Shipments",
        reports.delivery.pendingShipments,
      ],
      [
        "Delivery Completion Rate",
        `${reports.delivery.deliveryCompletionRate}%`,
      ],
    ];


    const deliverySheet =
      XLSX.utils.aoa_to_sheet(
        deliveryRows
      );

    XLSX.utils.book_append_sheet(
      workbook,
      deliverySheet,
      "Delivery Performance"
    );


    // --------------------------------------------------------
    // COLUMN WIDTHS
    // --------------------------------------------------------

    workbook.SheetNames.forEach(
      (sheetName) => {

        const sheet =
          workbook.Sheets[sheetName];

        sheet["!cols"] = [
          { wch: 32 },
          { wch: 24 },
          { wch: 24 },
          { wch: 20 },
          { wch: 20 },
        ];
      }
    );


    XLSX.writeFile(
      workbook,
      "FleetFlow_All_Reports.xlsx"
    );
  };


  // ==========================================================
  // PDF - ALL REPORTS
  // ==========================================================

  const exportAllToPDF = () => {
    if (
      !reports.maintenance ||
      !reports.fleet ||
      !reports.fuel ||
      !reports.driver ||
      !reports.delivery
    ) {
      setError(
        "Reports are still loading. Please try again."
      );
      return;
    }


    const doc =
      new jsPDF();


    // --------------------------------------------------------
    // HELPERS
    // --------------------------------------------------------

    const addTitle = (
      title,
      subtitle = ""
    ) => {

      doc.setFontSize(20);

      doc.setFont(undefined, "bold");

      doc.text(
        title,
        20,
        20
      );

      doc.setFontSize(10);

      doc.setFont(undefined, "normal");

      doc.setTextColor(100);

      if (subtitle) {
        doc.text(
          subtitle,
          20,
          28
        );
      }

      doc.setTextColor(0);
    };


    const addMetric = (
      metric,
      value,
      y
    ) => {

      doc.setFontSize(10);

      doc.setFont(undefined, "bold");

      doc.text(
        String(metric),
        20,
        y
      );

      doc.setFont(undefined, "normal");

      doc.text(
        String(value),
        125,
        y
      );

      doc.line(
        20,
        y + 3,
        190,
        y + 3
      );

      return y + 10;
    };


    // --------------------------------------------------------
    // COVER / HEADER
    // --------------------------------------------------------

    addTitle(
      "FleetFlow - Complete Reports",
      "Fleet Management & Logistics Tracking System"
    );


    doc.setFontSize(11);

    doc.text(
      "Complete operational report package",
      20,
      45
    );

    doc.text(
      `Generated: ${new Date().toLocaleString("en-IN")}`,
      20,
      53
    );


    doc.setFontSize(10);

    doc.text(
      "This document contains all FleetFlow reports.",
      20,
      70
    );


    // ========================================================
    // MAINTENANCE
    // ========================================================

    doc.addPage();

    addTitle(
      "1. Maintenance Report"
    );


    let y = 42;


    y = addMetric(
      "Total Maintenance Records",
      reports.maintenance
        .totalMaintenanceRecords,
      y
    );

    y = addMetric(
      "Vehicles Under Maintenance",
      reports.maintenance
        .vehiclesUnderMaintenance,
      y
    );

    y = addMetric(
      "Completed Services",
      reports.maintenance
        .completedServices,
      y
    );

    y = addMetric(
      "Overdue Services",
      reports.maintenance
        .overdueServices,
      y
    );

    y = addMetric(
      "Total Maintenance Cost",
      `Rs. ${Number(
        reports.maintenance
          .totalMaintenanceCost
      ).toLocaleString("en-IN")}`,
      y
    );

    y = addMetric(
      "Most Frequent Category",
      reports.maintenance
        .mostFrequentMaintenanceCategory,
      y
    );


    // ========================================================
    // FLEET UTILIZATION
    // ========================================================

    doc.addPage();

    addTitle(
      "2. Fleet Utilization Report"
    );


    y = 42;


    y = addMetric(
      "Total Vehicles",
      reports.fleet.totalVehicles,
      y
    );

    y = addMetric(
      "Available Vehicles",
      reports.fleet.availableVehicles,
      y
    );

    y = addMetric(
      "Vehicles On Trip",
      reports.fleet.vehiclesOnTrip,
      y
    );

    y = addMetric(
      "Vehicles Under Maintenance",
      reports.fleet
        .vehiclesUnderMaintenance,
      y
    );

    y = addMetric(
      "Inactive Vehicles",
      reports.fleet.inactiveVehicles,
      y
    );

    y = addMetric(
      "Fleet Utilization Rate",
      `${reports.fleet.utilizationRate}%`,
      y
    );


    // ========================================================
    // FUEL CONSUMPTION
    // ========================================================

    doc.addPage();

    addTitle(
      "3. Fuel Consumption Report"
    );


    y = 42;


    y = addMetric(
      "Total Fuel Records",
      reports.fuel.totalFuelRecords,
      y
    );

    y = addMetric(
      "Total Fuel Quantity",
      `${reports.fuel.totalFuelQuantity} L`,
      y
    );

    y = addMetric(
      "Total Fuel Cost",
      `Rs. ${Number(
        reports.fuel.totalFuelCost
      ).toLocaleString("en-IN")}`,
      y
    );

    y = addMetric(
      "Average Fuel Cost",
      `Rs. ${Number(
        reports.fuel.averageFuelCost
      ).toFixed(2)}`,
      y
    );


    y += 8;


    doc.setFontSize(12);

    doc.setFont(undefined, "bold");

    doc.text(
      "Vehicle-wise Fuel Consumption",
      20,
      y
    );


    y += 10;


    doc.setFontSize(9);

    doc.text(
      "Vehicle",
      20,
      y
    );

    doc.text(
      "Quantity (L)",
      80,
      y
    );

    doc.text(
      "Cost",
      140,
      y
    );


    y += 8;


    doc.setFont(undefined, "normal");


    reports.fuel.vehicleBreakdown?.forEach(
      (vehicle) => {

        if (y > 270) {

          doc.addPage();

          y = 20;

        }

        doc.text(
          `Vehicle #${vehicle.vehicleId}`,
          20,
          y
        );

        doc.text(
          `${vehicle.fuelQuantity}`,
          80,
          y
        );

        doc.text(
          `Rs. ${Number(
            vehicle.fuelCost
          ).toLocaleString("en-IN")}`,
          140,
          y
        );

        y += 8;
      }
    );


    // ========================================================
    // DRIVER PERFORMANCE
    // ========================================================

    doc.addPage();

    addTitle(
      "4. Driver Performance Report"
    );


    y = 42;


    y = addMetric(
      "Total Drivers",
      reports.driver.totalDrivers,
      y
    );

    y = addMetric(
      "Total Trips",
      reports.driver.totalTrips,
      y
    );

    y = addMetric(
      "Completed Trips",
      reports.driver.completedTrips,
      y
    );

    y = addMetric(
      "Active Trips",
      reports.driver.activeTrips,
      y
    );

    y = addMetric(
      "Cancelled Trips",
      reports.driver.cancelledTrips,
      y
    );

    y = addMetric(
      "Best Performing Driver",
      reports.driver.bestPerformingDriver,
      y
    );


    y += 8;


    doc.setFontSize(12);

    doc.setFont(undefined, "bold");

    doc.text(
      "Driver-wise Performance",
      20,
      y
    );


    y += 10;


    doc.setFontSize(8);

    doc.text(
      "Driver",
      20,
      y
    );

    doc.text(
      "Total",
      90,
      y
    );

    doc.text(
      "Completed",
      115,
      y
    );

    doc.text(
      "Active",
      150,
      y
    );

    doc.text(
      "Cancelled",
      175,
      y
    );


    y += 8;

    doc.setFont(undefined, "normal");


    reports.driver.drivers?.forEach(
      (driver) => {

        if (y > 270) {

          doc.addPage();

          y = 20;

        }

        doc.text(
          String(driver.driverName).substring(
            0,
            30
          ),
          20,
          y
        );

        doc.text(
          String(driver.totalTrips),
          90,
          y
        );

        doc.text(
          String(driver.completedTrips),
          115,
          y
        );

        doc.text(
          String(driver.activeTrips),
          150,
          y
        );

        doc.text(
          String(driver.cancelledTrips),
          175,
          y
        );

        y += 8;
      }
    );


    // ========================================================
    // DELIVERY PERFORMANCE
    // ========================================================

    doc.addPage();

    addTitle(
      "5. Delivery Performance Report"
    );


    y = 42;


    y = addMetric(
      "Total Shipments",
      reports.delivery.totalShipments,
      y
    );

    y = addMetric(
      "Delivered Shipments",
      reports.delivery.deliveredShipments,
      y
    );

    y = addMetric(
      "In Transit Shipments",
      reports.delivery.inTransitShipments,
      y
    );

    y = addMetric(
      "Delayed Shipments",
      reports.delivery.delayedShipments,
      y
    );

    y = addMetric(
      "Cancelled Shipments",
      reports.delivery.cancelledShipments,
      y
    );

    y = addMetric(
      "Pending Shipments",
      reports.delivery.pendingShipments,
      y
    );

    y = addMetric(
      "Delivery Completion Rate",
      `${reports.delivery.deliveryCompletionRate}%`,
      y
    );


    // ========================================================
    // FOOTER ON EVERY PAGE
    // ========================================================

    const pageCount =
      doc.internal.getNumberOfPages();


    for (
      let page = 1;
      page <= pageCount;
      page++
    ) {

      doc.setPage(page);

      doc.setFontSize(8);

      doc.setTextColor(120);

      doc.text(
        `FleetFlow | Page ${page} of ${pageCount}`,
        20,
        290
      );

      doc.setTextColor(0);
    }


    doc.save(
      "FleetFlow_All_Reports.pdf"
    );
  };


  // ==========================================================
  // REPORT DEFINITIONS
  // ==========================================================

  const reportTitles = {

    maintenance:
      "Maintenance Report",

    fleet:
      "Fleet Utilization Report",

    fuel:
      "Fuel Consumption Report",

    driver:
      "Driver Performance Report",

    delivery:
      "Delivery Performance Report",

  };


  const reportTabs = [

    {
      id: "maintenance",
      title: "Maintenance",
      icon: FiTool,
    },

    {
      id: "fleet",
      title: "Fleet Utilization",
      icon: FiTruck,
    },

    {
      id: "fuel",
      title: "Fuel Consumption",
      icon: FiDroplet,
    },

    {
      id: "driver",
      title: "Driver Performance",
      icon: FiUsers,
    },

    {
      id: "delivery",
      title: "Delivery Performance",
      icon: FiPackage,
    },

  ];


  const report =
    reports[activeReport];


  // ==========================================================
  // STAT CARD
  // ==========================================================

  const StatCard = ({
    title,
    value,
    icon: Icon,
    iconClass = "text-blue-400",
    bgClass = "bg-blue-500/10",
  }) => (

    <div className="bg-[#0d1525] border border-gray-800 rounded-xl p-5">

      <div className="flex items-center justify-between gap-4">

        <div className="min-w-0">

          <p className="text-gray-400 text-sm">
            {title}
          </p>

          <p className="text-3xl font-bold mt-2 break-words">
            {value}
          </p>

        </div>

        <div
          className={`shrink-0 p-3 rounded-xl ${bgClass}`}
        >
          <Icon
            className={`w-6 h-6 ${iconClass}`}
          />
        </div>

      </div>

    </div>

  );


  // ==========================================================
  // REPORT CONTENT
  // ==========================================================

  const renderReport = () => {

    if (!report) {
      return null;
    }


    // ========================================================
    // MAINTENANCE
    // ========================================================

    if (
      activeReport ===
      "maintenance"
    ) {

      return (

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">

          <StatCard
            title="Total Maintenance Records"
            value={
              report.totalMaintenanceRecords
            }
            icon={FiTool}
          />

          <StatCard
            title="Vehicles Under Maintenance"
            value={
              report.vehiclesUnderMaintenance
            }
            icon={FiTruck}
            iconClass="text-yellow-400"
            bgClass="bg-yellow-500/10"
          />

          <StatCard
            title="Completed Services"
            value={
              report.completedServices
            }
            icon={FiCheckCircle}
            iconClass="text-emerald-400"
            bgClass="bg-emerald-500/10"
          />

          <StatCard
            title="Overdue Services"
            value={
              report.overdueServices
            }
            icon={FiAlertTriangle}
            iconClass="text-red-400"
            bgClass="bg-red-500/10"
          />

          <StatCard
            title="Total Maintenance Cost"
            value={`Rs. ${Number(
              report.totalMaintenanceCost
            ).toLocaleString("en-IN")}`}
            icon={FiDollarSign}
            iconClass="text-emerald-400"
            bgClass="bg-emerald-500/10"
          />

          <StatCard
            title="Most Frequent Category"
            value={
              report.mostFrequentMaintenanceCategory ||
              "—"
            }
            icon={FiBarChart2}
            iconClass="text-purple-400"
            bgClass="bg-purple-500/10"
          />

        </div>

      );

    }


    // ========================================================
    // FLEET UTILIZATION
    // ========================================================

    if (
      activeReport ===
      "fleet"
    ) {

      return (

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">

          <StatCard
            title="Total Vehicles"
            value={
              report.totalVehicles
            }
            icon={FiTruck}
          />

          <StatCard
            title="Available Vehicles"
            value={
              report.availableVehicles
            }
            icon={FiCheckCircle}
            iconClass="text-emerald-400"
            bgClass="bg-emerald-500/10"
          />

          <StatCard
            title="Vehicles On Trip"
            value={
              report.vehiclesOnTrip
            }
            icon={FiActivity}
            iconClass="text-blue-400"
            bgClass="bg-blue-500/10"
          />

          <StatCard
            title="Under Maintenance"
            value={
              report.vehiclesUnderMaintenance
            }
            icon={FiTool}
            iconClass="text-yellow-400"
            bgClass="bg-yellow-500/10"
          />

          <StatCard
            title="Inactive Vehicles"
            value={
              report.inactiveVehicles
            }
            icon={FiClock}
            iconClass="text-red-400"
            bgClass="bg-red-500/10"
          />

          <StatCard
            title="Fleet Utilization Rate"
            value={`${report.utilizationRate}%`}
            icon={FiBarChart2}
            iconClass="text-purple-400"
            bgClass="bg-purple-500/10"
          />

        </div>

      );

    }


    // ========================================================
    // FUEL
    // ========================================================

    if (
      activeReport ===
      "fuel"
    ) {

      return (

        <>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">

            <StatCard
              title="Total Fuel Records"
              value={
                report.totalFuelRecords
              }
              icon={FiDroplet}
            />

            <StatCard
              title="Total Fuel Quantity"
              value={`${report.totalFuelQuantity} L`}
              icon={FiDroplet}
              iconClass="text-cyan-400"
              bgClass="bg-cyan-500/10"
            />

            <StatCard
              title="Total Fuel Cost"
              value={`Rs. ${Number(
                report.totalFuelCost
              ).toLocaleString("en-IN")}`}
              icon={FiDollarSign}
              iconClass="text-emerald-400"
              bgClass="bg-emerald-500/10"
            />

            <StatCard
              title="Average Cost per Liter"
              value={`Rs. ${Number(
                report.averageFuelCost
              ).toFixed(2)}`}
              icon={FiBarChart2}
              iconClass="text-purple-400"
              bgClass="bg-purple-500/10"
            />

          </div>


          <div className="bg-[#0d1525] border border-gray-800 rounded-xl overflow-hidden">

            <div className="px-5 py-4 border-b border-gray-800">

              <h3 className="font-semibold">
                Fuel Consumption by Vehicle
              </h3>

            </div>


            <div className="overflow-x-auto">

              <table className="w-full min-w-[650px] text-sm">

                <thead className="bg-gray-900/50">

                  <tr>

                    <th className="text-left px-5 py-4 text-gray-400">
                      Vehicle ID
                    </th>

                    <th className="text-left px-5 py-4 text-gray-400">
                      Fuel Quantity
                    </th>

                    <th className="text-left px-5 py-4 text-gray-400">
                      Fuel Cost
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-gray-800">

                  {report.vehicleBreakdown?.map(
                    (vehicle) => (

                      <tr
                        key={
                          vehicle.vehicleId
                        }
                        className="hover:bg-white/5"
                      >

                        <td className="px-5 py-4">
                          Vehicle #{vehicle.vehicleId}
                        </td>

                        <td className="px-5 py-4">
                          {vehicle.fuelQuantity} L
                        </td>

                        <td className="px-5 py-4">
                          Rs.{" "}
                          {Number(
                            vehicle.fuelCost
                          ).toLocaleString(
                            "en-IN"
                          )}
                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          </div>

        </>

      );

    }


    // ========================================================
    // DRIVER
    // ========================================================

    if (
      activeReport ===
      "driver"
    ) {

      return (

        <>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">

            <StatCard
              title="Total Drivers"
              value={
                report.totalDrivers
              }
              icon={FiUsers}
            />

            <StatCard
              title="Total Trips"
              value={
                report.totalTrips
              }
              icon={FiActivity}
            />

            <StatCard
              title="Completed Trips"
              value={
                report.completedTrips
              }
              icon={FiCheckCircle}
              iconClass="text-emerald-400"
              bgClass="bg-emerald-500/10"
            />

            <StatCard
              title="Best Performing Driver"
              value={
                report.bestPerformingDriver ||
                "—"
              }
              icon={FiUsers}
              iconClass="text-purple-400"
              bgClass="bg-purple-500/10"
            />

          </div>


          <div className="bg-[#0d1525] border border-gray-800 rounded-xl overflow-hidden">

            <div className="px-5 py-4 border-b border-gray-800">

              <h3 className="font-semibold">
                Driver Performance
              </h3>

            </div>


            <div className="overflow-x-auto">

              <table className="w-full min-w-[800px] text-sm">

                <thead className="bg-gray-900/50">

                  <tr>

                    <th className="text-left px-5 py-4 text-gray-400">
                      Driver
                    </th>

                    <th className="text-left px-5 py-4 text-gray-400">
                      Total Trips
                    </th>

                    <th className="text-left px-5 py-4 text-gray-400">
                      Completed
                    </th>

                    <th className="text-left px-5 py-4 text-gray-400">
                      Active
                    </th>

                    <th className="text-left px-5 py-4 text-gray-400">
                      Cancelled
                    </th>

                  </tr>

                </thead>


                <tbody className="divide-y divide-gray-800">

                  {report.drivers?.map(
                    (driver) => (

                      <tr
                        key={
                          driver.driverId
                        }
                        className="hover:bg-white/5"
                      >

                        <td className="px-5 py-4 font-medium">
                          {driver.driverName}
                        </td>

                        <td className="px-5 py-4">
                          {driver.totalTrips}
                        </td>

                        <td className="px-5 py-4 text-emerald-400">
                          {driver.completedTrips}
                        </td>

                        <td className="px-5 py-4 text-blue-400">
                          {driver.activeTrips}
                        </td>

                        <td className="px-5 py-4 text-red-400">
                          {driver.cancelledTrips}
                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          </div>

        </>

      );

    }


    // ========================================================
    // DELIVERY
    // ========================================================

    if (
      activeReport ===
      "delivery"
    ) {

      return (

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">

          <StatCard
            title="Total Shipments"
            value={
              report.totalShipments
            }
            icon={FiPackage}
          />

          <StatCard
            title="Delivered"
            value={
              report.deliveredShipments
            }
            icon={FiCheckCircle}
            iconClass="text-emerald-400"
            bgClass="bg-emerald-500/10"
          />

          <StatCard
            title="In Transit"
            value={
              report.inTransitShipments
            }
            icon={FiTruck}
            iconClass="text-blue-400"
            bgClass="bg-blue-500/10"
          />

          <StatCard
            title="Delayed"
            value={
              report.delayedShipments
            }
            icon={FiClock}
            iconClass="text-yellow-400"
            bgClass="bg-yellow-500/10"
          />

          <StatCard
            title="Cancelled"
            value={
              report.cancelledShipments
            }
            icon={FiAlertTriangle}
            iconClass="text-red-400"
            bgClass="bg-red-500/10"
          />

          <StatCard
            title="Pending"
            value={
              report.pendingShipments
            }
            icon={FiClock}
          />

          <StatCard
            title="Delivery Completion Rate"
            value={`${report.deliveryCompletionRate}%`}
            icon={FiBarChart2}
            iconClass="text-purple-400"
            bgClass="bg-purple-500/10"
          />

        </div>

      );

    }


    return null;
  };


  // ==========================================================
  // PAGE
  // ==========================================================

  return (

    <div className="min-h-screen w-full max-w-full bg-[#0b1120] text-white p-4 md:p-6 lg:p-8 overflow-x-hidden">

      {/* HEADER */}

      <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5 mb-7">

        <div className="min-w-0">

          <div className="flex items-center gap-3">

            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 shrink-0">

              <FiBarChart2 className="w-6 h-6 text-blue-400" />

            </div>

            <div>

              <h1 className="text-2xl md:text-3xl font-bold">
                Reports & Export
              </h1>

              <p className="text-gray-400 mt-1">
                Fleet · Fuel · Drivers · Deliveries · Maintenance
              </p>

            </div>

          </div>

        </div>


        {/* EXPORT ACTIONS */}

        <div className="flex flex-col sm:flex-row gap-3 shrink-0">

          <button
            onClick={exportAllToPDF}
            disabled={
              !reports.maintenance ||
              !reports.fleet ||
              !reports.fuel ||
              !reports.driver ||
              !reports.delivery ||
              loading
            }
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium transition disabled:opacity-50"
          >

            Export All PDF

          </button>


          <button
            onClick={exportAllToExcel}
            disabled={
              !reports.maintenance ||
              !reports.fleet ||
              !reports.fuel ||
              !reports.driver ||
              !reports.delivery ||
              loading
            }
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-green-600 hover:bg-green-500 text-white font-medium transition disabled:opacity-50"
          >

            Export All Excel

          </button>


          <button
            onClick={fetchReports}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-gray-700 bg-[#111827] text-gray-300 hover:bg-white/5 transition disabled:opacity-50"
          >

            <FiRefreshCw
              className={
                loading
                  ? "animate-spin"
                  : ""
              }
            />

            Refresh

          </button>

        </div>

      </div>


      {/* ERROR */}

      {error && (

        <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-red-400">

          <FiAlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />

          <span className="break-words">
            {error}
          </span>

        </div>

      )}


      {/* REPORT TABS */}

      <div className="w-full max-w-full overflow-x-auto mb-6">

        <div className="flex gap-2 min-w-max">

          {reportTabs.map(
            (tab) => {

              const Icon =
                tab.icon;

              const active =
                activeReport ===
                tab.id;

              return (

                <button
                  key={tab.id}
                  onClick={() =>
                    setActiveReport(
                      tab.id
                    )
                  }
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition whitespace-nowrap ${
                    active
                      ? "bg-blue-600 border-blue-500 text-white"
                      : "bg-[#111827] border-gray-800 text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >

                  <Icon />

                  {tab.title}

                </button>

              );

            }
          )}

        </div>

      </div>


      {/* REPORT CONTENT */}

      <div className="bg-[#111827] border border-gray-800 rounded-2xl overflow-hidden">

        <div className="px-5 md:px-6 py-5 border-b border-gray-800">

          <h2 className="text-xl font-semibold">
            {reportTitles[activeReport]}
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            FleetFlow operational analytics and reporting
          </p>

        </div>


        {loading ? (

          <div className="flex items-center justify-center py-20 text-gray-400">

            <FiRefreshCw className="w-5 h-5 animate-spin mr-3" />

            Loading reports...

          </div>

        ) : (

          <div className="p-5 md:p-6">

            {renderReport()}

          </div>

        )}

      </div>

    </div>

  );
}


export default Reports;