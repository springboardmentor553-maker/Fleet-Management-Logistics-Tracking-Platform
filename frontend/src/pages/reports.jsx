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
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchMaintenanceReport = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("/reports/maintenance", {
        headers: getAuthHeaders(),
      });

      setReport(response.data);
    } catch (err) {
      console.error("Error fetching maintenance report:", err);

      const detail = err?.response?.data?.detail;

      if (typeof detail === "string") {
        setError(detail);
      } else if (Array.isArray(detail)) {
        setError(
          detail
            .map((item) => item?.msg || String(item))
            .join(", ")
        );
      } else {
        setError("Unable to load maintenance report.");
      }
    } finally {
      setLoading(false);
    }
  };

  // EXPORT MAINTENANCE REPORT TO EXCEL
  const exportToExcel = () => {
    if (!report) {
      return;
    }

    const data = [
      {
        Report: "Maintenance Report",
        Metric: "Total Maintenance Records",
        Value: report.totalMaintenanceRecords,
      },
      {
        Report: "Maintenance Report",
        Metric: "Vehicles Under Maintenance",
        Value: report.vehiclesUnderMaintenance,
      },
      {
        Report: "Maintenance Report",
        Metric: "Completed Services",
        Value: report.completedServices,
      },
      {
        Report: "Maintenance Report",
        Metric: "Overdue Services",
        Value: report.overdueServices,
      },
      {
        Report: "Maintenance Report",
        Metric: "Total Maintenance Cost",
        Value: report.totalMaintenanceCost,
      },
      {
        Report: "Maintenance Report",
        Metric: "Most Frequent Maintenance Category",
        Value: report.mostFrequentMaintenanceCategory,
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(data);

    worksheet["!cols"] = [
      { wch: 24 },
      { wch: 40 },
      { wch: 28 },
    ];

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Maintenance Report"
    );

    XLSX.writeFile(
      workbook,
      "Maintenance_Report.xlsx"
    );
  };

  // EXPORT MAINTENANCE REPORT TO PDF
  const exportToPDF = () => {
    if (!report) {
      return;
    }

    const doc = new jsPDF();

    // Title
    doc.setFontSize(20);
    doc.setTextColor(0, 0, 0);
    doc.text("Maintenance Report", 20, 20);

    // Subtitle
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(
      "FleetFlow - Maintenance Summary",
      20,
      28
    );

    // Reset text color
    doc.setTextColor(0);

    // Report data
    const rows = [
      [
        "Total Maintenance Records",
        String(report.totalMaintenanceRecords),
      ],
      [
        "Vehicles Under Maintenance",
        String(report.vehiclesUnderMaintenance),
      ],
      [
        "Completed Services",
        String(report.completedServices),
      ],
      [
        "Overdue Services",
        String(report.overdueServices),
      ],
      [
        "Total Maintenance Cost",
        `Rs. ${Number(
          report.totalMaintenanceCost
        ).toLocaleString("en-IN")}`,
      ],
      [
        "Most Frequent Maintenance Category",
        String(
          report.mostFrequentMaintenanceCategory || "—"
        ),
      ],
    ];

    // Table header
    let y = 45;

    doc.setFontSize(11);
    doc.setFont(undefined, "bold");

    doc.text("Metric", 20, y);
    doc.text("Value", 135, y);

    doc.setFont(undefined, "normal");

    // Horizontal line
    doc.line(20, y + 3, 190, y + 3);

    y += 13;

    // Table rows
    rows.forEach(([metric, value]) => {
      doc.text(metric, 20, y);
      doc.text(value, 135, y);

      doc.line(20, y + 3, 190, y + 3);

      y += 12;
    });

    // Footer
    doc.setFontSize(9);
    doc.setTextColor(100);

    doc.text(
      `Generated on: ${new Date().toLocaleString("en-IN")}`,
      20,
      285
    );

    doc.save("Maintenance_Report.pdf");
  };

  useEffect(() => {
    fetchMaintenanceReport();
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#0b1120] text-white p-6 md:p-8 overflow-x-hidden">

      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5 mb-8">

        <div>
          <div className="flex items-center gap-3">

            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
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

        {/* ACTION BUTTONS */}
        <div className="flex flex-col sm:flex-row gap-3">

          {/* EXPORT PDF */}
          <button
            onClick={exportToPDF}
            disabled={!report || loading}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiBarChart2 className="w-4 h-4" />
            Export PDF
          </button>

          {/* EXPORT EXCEL */}
          <button
            onClick={exportToExcel}
            disabled={!report || loading}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-green-600 hover:bg-green-500 text-white font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiBarChart2 className="w-4 h-4" />
            Export Excel
          </button>

          {/* REFRESH */}
          <button
            onClick={fetchMaintenanceReport}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-gray-700 bg-[#111827] text-gray-300 hover:bg-white/5 transition disabled:opacity-50"
          >
            <FiRefreshCw
              className={`w-4 h-4 ${
                loading ? "animate-spin" : ""
              }`}
            />

            Refresh
          </button>

        </div>

      </div>

      {/* MAINTENANCE REPORT */}
      <div className="bg-[#111827] border border-gray-800 rounded-2xl overflow-hidden">

        {/* SECTION HEADER */}
        <div className="px-6 py-5 border-b border-gray-800">

          <div className="flex items-center gap-3">

            <div className="p-2.5 rounded-lg bg-blue-500/10">
              <FiTool className="w-5 h-5 text-blue-400" />
            </div>

            <div>
              <h2 className="text-xl font-semibold">
                Maintenance Report
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Completed vs overdue services, total cost and maintenance category
              </p>
            </div>

          </div>

        </div>

        {/* ERROR */}
        {error && (
          <div className="mx-6 mt-6 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-red-400">

            <FiAlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />

            <span className="break-words">
              {error}
            </span>

          </div>
        )}

        {/* LOADING */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <FiRefreshCw className="w-5 h-5 animate-spin mr-3" />
            Loading maintenance report...
          </div>
        ) : (
          <div className="p-6">

            {/* REPORT CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">

              {/* TOTAL MAINTENANCE RECORDS */}
              <div className="bg-[#0d1525] border border-gray-800 rounded-xl p-5">

                <div className="flex items-center justify-between">

                  <div>
                    <p className="text-gray-400 text-sm">
                      Total Maintenance Records
                    </p>

                    <p className="text-3xl font-bold mt-2">
                      {report?.totalMaintenanceRecords ?? 0}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-blue-500/10">
                    <FiTool className="w-6 h-6 text-blue-400" />
                  </div>

                </div>

              </div>

              {/* VEHICLES UNDER MAINTENANCE */}
              <div className="bg-[#0d1525] border border-gray-800 rounded-xl p-5">

                <div className="flex items-center justify-between">

                  <div>
                    <p className="text-gray-400 text-sm">
                      Vehicles Under Maintenance
                    </p>

                    <p className="text-3xl font-bold mt-2 text-yellow-400">
                      {report?.vehiclesUnderMaintenance ?? 0}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-yellow-500/10">
                    <FiTruck className="w-6 h-6 text-yellow-400" />
                  </div>

                </div>

              </div>

              {/* COMPLETED SERVICES */}
              <div className="bg-[#0d1525] border border-gray-800 rounded-xl p-5">

                <div className="flex items-center justify-between">

                  <div>
                    <p className="text-gray-400 text-sm">
                      Completed Services
                    </p>

                    <p className="text-3xl font-bold mt-2 text-green-400">
                      {report?.completedServices ?? 0}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-green-500/10">
                    <FiCheckCircle className="w-6 h-6 text-green-400" />
                  </div>

                </div>

              </div>

              {/* OVERDUE SERVICES */}
              <div className="bg-[#0d1525] border border-gray-800 rounded-xl p-5">

                <div className="flex items-center justify-between">

                  <div>
                    <p className="text-gray-400 text-sm">
                      Overdue Services
                    </p>

                    <p className="text-3xl font-bold mt-2 text-red-400">
                      {report?.overdueServices ?? 0}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-red-500/10">
                    <FiClock className="w-6 h-6 text-red-400" />
                  </div>

                </div>

              </div>

              {/* TOTAL MAINTENANCE COST */}
              <div className="bg-[#0d1525] border border-gray-800 rounded-xl p-5">

                <div className="flex items-center justify-between">

                  <div>
                    <p className="text-gray-400 text-sm">
                      Total Maintenance Cost
                    </p>

                    <p className="text-3xl font-bold mt-2 text-emerald-400">
                      ₹
                      {Number(
                        report?.totalMaintenanceCost ?? 0
                      ).toLocaleString("en-IN")}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-500/10">
                    <FiDollarSign className="w-6 h-6 text-emerald-400" />
                  </div>

                </div>

              </div>

              {/* MOST FREQUENT CATEGORY */}
              <div className="bg-[#0d1525] border border-gray-800 rounded-xl p-5">

                <div className="flex items-center justify-between gap-4">

                  <div className="min-w-0">

                    <p className="text-gray-400 text-sm">
                      Most Frequent Maintenance Category
                    </p>

                    <p className="text-xl font-bold mt-3 text-purple-400 break-words">
                      {report?.mostFrequentMaintenanceCategory || "—"}
                    </p>

                  </div>

                  <div className="shrink-0 p-3 rounded-xl bg-purple-500/10">
                    <FiBarChart2 className="w-6 h-6 text-purple-400" />
                  </div>

                </div>

              </div>

            </div>

          </div>
        )}

      </div>

    </div>
  );
}

export default Reports;