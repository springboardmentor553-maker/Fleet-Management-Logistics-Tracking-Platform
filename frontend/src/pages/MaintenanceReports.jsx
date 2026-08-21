import { useEffect, useState } from "react";
import Layout from "../components/Layout";

import {
    FaTools,
    FaCalendarAlt,
    FaCheckCircle,
    FaTimesCircle,
    FaRupeeSign,
    FaFileAlt,
    FaFilePdf,
    FaFileExcel,
    FaExclamationTriangle,
    FaClock,
    FaSyncAlt
} from "react-icons/fa";

import {
    getMaintenanceReport,
    getMaintenanceRecords,
    getUpcomingMaintenance,
    getOverdueMaintenance
} from "../services/maintenanceReportService";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

import "../styles/maintenanceReports.css";


function MaintenanceReports() {

    const [report, setReport] = useState({
        total_records: 0,
        scheduled: 0,
        completed: 0,
        cancelled: 0,
        total_service_cost: 0
    });

    const [records, setRecords] = useState([]);
    const [upcoming, setUpcoming] = useState([]);
    const [overdue, setOverdue] = useState([]);

    const [loading, setLoading] = useState(true);


    // =====================================================
    // LOAD DATA
    // =====================================================

    useEffect(() => {
        loadReport();
    }, []);


    const loadReport = async () => {

        try {

            setLoading(true);

            const [
                reportData,
                maintenanceData,
                upcomingData,
                overdueData
            ] = await Promise.all([
                getMaintenanceReport(),
                getMaintenanceRecords(),
                getUpcomingMaintenance(),
                getOverdueMaintenance()
            ]);

            setReport(reportData || {});

            setRecords(
                Array.isArray(maintenanceData)
                    ? maintenanceData
                    : []
            );

            setUpcoming(
                upcomingData?.maintenance || []
            );

            setOverdue(
                overdueData?.maintenance || []
            );

        } catch (error) {

            console.error(
                "Failed to load maintenance report:",
                error
            );

        } finally {

            setLoading(false);

        }
    };


    // =====================================================
    // HELPERS
    // =====================================================

    const formatCurrency = (value) => {

        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 2
        }).format(Number(value || 0));

    };


    const formatDate = (date) => {

        if (!date) {
            return "-";
        }

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return date;
        }

        return parsedDate.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });

    };


    const getStatusClass = (status) => {

        const value = String(
            status || ""
        ).toLowerCase();

        if (
            value.includes("complete") ||
            value.includes("completed")
        ) {
            return "status-completed";
        }

        if (
            value.includes("cancel")
        ) {
            return "status-cancelled";
        }

        if (
            value.includes("schedule")
        ) {
            return "status-scheduled";
        }

        return "status-default";

    };


    const getCategoryLabel = (category) => {

        if (!category) {
            return "-";
        }

        return String(category)
            .replaceAll("_", " ")
            .replaceAll("-", " ")
            .toLowerCase()
            .replace(/\b\w/g, (char) =>
                char.toUpperCase()
            );

    };


    // =====================================================
    // DOWNLOAD PDF
    // =====================================================

    const downloadPDF = () => {

        const doc = new jsPDF();

        doc.setFontSize(20);

        doc.text(
            "FLEETFLOW",
            14,
            20
        );

        doc.setFontSize(16);

        doc.text(
            "Maintenance Report",
            14,
            30
        );

        doc.setFontSize(9);

        doc.text(
            `Generated on: ${new Date().toLocaleString("en-IN")}`,
            14,
            38
        );


        // Summary

        doc.setFontSize(13);

        doc.text(
            "Maintenance Summary",
            14,
            50
        );


        autoTable(doc, {

            startY: 55,

            head: [
                [
                    "Metric",
                    "Value"
                ]
            ],

            body: [

                [
                    "Total Maintenance Records",
                    report.total_records || 0
                ],

                [
                    "Scheduled",
                    report.scheduled || 0
                ],

                [
                    "Completed",
                    report.completed || 0
                ],

                [
                    "Cancelled",
                    report.cancelled || 0
                ],

                [
                    "Total Service Cost",
                    formatCurrency(
                        report.total_service_cost
                    )
                ]

            ],

            theme: "grid",

            headStyles: {
                fillColor: [37, 99, 235]
            }

        });


        // Maintenance records

        let currentY =
            doc.lastAutoTable.finalY + 15;


        doc.setFontSize(13);

        doc.text(
            "Maintenance Records",
            14,
            currentY
        );


        const tableData = records.map(
            (item) => [

                item.id ?? "",

                item.vehicle_id ?? "",

                getCategoryLabel(
                    item.maintenance_category
                ),

                item.service_date ?? "",

                item.next_service_date ?? "",

                formatCurrency(
                    item.service_cost
                ),

                item.service_provider ?? "-",

                item.status ?? "-"

            ]
        );


        autoTable(doc, {

            startY: currentY + 5,

            head: [[
                "ID",
                "Vehicle ID",
                "Category",
                "Service Date",
                "Next Service",
                "Cost",
                "Provider",
                "Status"
            ]],

            body: tableData,

            theme: "grid",

            styles: {
                fontSize: 7
            },

            headStyles: {
                fillColor: [37, 99, 235],
                fontSize: 7
            }

        });


        // Upcoming maintenance

        if (upcoming.length > 0) {

            const upcomingY =
                doc.lastAutoTable.finalY + 15;

            doc.setFontSize(13);

            doc.text(
                "Upcoming Maintenance",
                14,
                upcomingY
            );


            autoTable(doc, {

                startY: upcomingY + 5,

                head: [[
                    "Vehicle",
                    "Category",
                    "Next Service",
                    "Status",
                    "Provider"
                ]],

                body: upcoming.map(
                    (item) => [

                        item.vehicle_number ??
                            item.vehicle_id ??
                            "-",

                        getCategoryLabel(
                            item.category
                        ),

                        item.next_service_date ??
                            "-",

                        item.status ??
                            "-",

                        item.service_provider ??
                            "-"

                    ]
                ),

                theme: "grid",

                styles: {
                    fontSize: 8
                },

                headStyles: {
                    fillColor: [16, 185, 129]
                }

            });

        }


        // Overdue maintenance

        if (overdue.length > 0) {

            const overdueY =
                doc.lastAutoTable.finalY + 15;

            doc.setFontSize(13);

            doc.text(
                "Overdue Maintenance",
                14,
                overdueY
            );


            autoTable(doc, {

                startY: overdueY + 5,

                head: [[
                    "Vehicle",
                    "Category",
                    "Next Service",
                    "Status",
                    "Provider"
                ]],

                body: overdue.map(
                    (item) => [

                        item.vehicle_number ??
                            item.vehicle_id ??
                            "-",

                        getCategoryLabel(
                            item.category
                        ),

                        item.next_service_date ??
                            "-",

                        item.status ??
                            "-",

                        item.service_provider ??
                            "-"

                    ]
                ),

                theme: "grid",

                styles: {
                    fontSize: 8
                },

                headStyles: {
                    fillColor: [239, 68, 68]
                }

            });

        }


        doc.save(
            "FleetFlow_Maintenance_Report.pdf"
        );

    };


    // =====================================================
    // DOWNLOAD EXCEL
    // =====================================================

    const downloadExcel = () => {

        const workbook =
            XLSX.utils.book_new();


        // Summary

        const summaryData = [

            {
                Metric:
                    "Total Maintenance Records",
                Value:
                    report.total_records || 0
            },

            {
                Metric: "Scheduled",
                Value:
                    report.scheduled || 0
            },

            {
                Metric: "Completed",
                Value:
                    report.completed || 0
            },

            {
                Metric: "Cancelled",
                Value:
                    report.cancelled || 0
            },

            {
                Metric: "Total Service Cost",
                Value:
                    Number(
                        report.total_service_cost || 0
                    )
            }

        ];


        const summarySheet =
            XLSX.utils.json_to_sheet(
                summaryData
            );


        XLSX.utils.book_append_sheet(
            workbook,
            summarySheet,
            "Summary"
        );


        // Maintenance records

        const maintenanceData =
            records.map((item) => ({

                ID: item.id,

                "Vehicle ID":
                    item.vehicle_id,

                Category:
                    getCategoryLabel(
                        item.maintenance_category
                    ),

                "Service Date":
                    item.service_date,

                "Next Service Date":
                    item.next_service_date,

                "Service Cost":
                    item.service_cost,

                "Service Provider":
                    item.service_provider,

                Notes:
                    item.notes,

                Status:
                    item.status

            }));


        const maintenanceSheet =
            XLSX.utils.json_to_sheet(
                maintenanceData
            );


        XLSX.utils.book_append_sheet(
            workbook,
            maintenanceSheet,
            "Maintenance Records"
        );


        // Upcoming

        const upcomingData =
            upcoming.map((item) => ({

                "Maintenance ID":
                    item.maintenance_id,

                "Vehicle ID":
                    item.vehicle_id,

                "Vehicle Number":
                    item.vehicle_number,

                Category:
                    item.category,

                "Next Service Date":
                    item.next_service_date,

                Status:
                    item.status,

                "Service Provider":
                    item.service_provider

            }));


        const upcomingSheet =
            XLSX.utils.json_to_sheet(
                upcomingData
            );


        XLSX.utils.book_append_sheet(
            workbook,
            upcomingSheet,
            "Upcoming"
        );


        // Overdue

        const overdueData =
            overdue.map((item) => ({

                "Maintenance ID":
                    item.maintenance_id,

                "Vehicle ID":
                    item.vehicle_id,

                "Vehicle Number":
                    item.vehicle_number,

                Category:
                    item.category,

                "Next Service Date":
                    item.next_service_date,

                Status:
                    item.status,

                "Service Provider":
                    item.service_provider

            }));


        const overdueSheet =
            XLSX.utils.json_to_sheet(
                overdueData
            );


        XLSX.utils.book_append_sheet(
            workbook,
            overdueSheet,
            "Overdue"
        );


        XLSX.writeFile(
            workbook,
            "FleetFlow_Maintenance_Report.xlsx"
        );

    };


    // =====================================================
    // UI
    // =====================================================

    return (

        <Layout>

            <div className="maintenance-report-page">

                {/* ========================================
                    HEADER
                ======================================== */}

                <div className="maintenance-report-header">

                    <div>

                        <div className="page-title-row">

                            <div className="page-title-icon">
                                <FaTools />
                            </div>

                            <div>

                                <h1>
                                    Maintenance Reports
                                </h1>

                                <p>
                                    Monitor maintenance activity,
                                    service costs and upcoming
                                    vehicle servicing.
                                </p>

                            </div>

                        </div>

                    </div>


                    <div className="report-actions">

                        <button
                            className="report-btn pdf-btn"
                            onClick={downloadPDF}
                            disabled={loading}
                        >

                            <FaFilePdf />

                            Download PDF

                        </button>


                        <button
                            className="report-btn excel-btn"
                            onClick={downloadExcel}
                            disabled={loading}
                        >

                            <FaFileExcel />

                            Download Excel

                        </button>


                        <button
                            className="refresh-btn"
                            onClick={loadReport}
                            disabled={loading}
                            title="Refresh report"
                        >

                            <FaSyncAlt
                                className={
                                    loading
                                        ? "spin"
                                        : ""
                                }
                            />

                        </button>

                    </div>

                </div>


                {/* ========================================
                    SUMMARY
                ======================================== */}

                <section className="report-section">

                    <div className="section-heading">

                        <div>

                            <h2>
                                Maintenance Overview
                            </h2>

                            <p>
                                Current maintenance statistics
                            </p>

                        </div>

                    </div>


                    <div className="maintenance-summary-grid">


                        <div className="report-stat-card">

                            <div className="stat-icon blue">
                                <FaFileAlt />
                            </div>

                            <div className="stat-content">

                                <span>
                                    Total Records
                                </span>

                                <strong>
                                    {report.total_records || 0}
                                </strong>

                                <small>
                                    All maintenance records
                                </small>

                            </div>

                        </div>


                        <div className="report-stat-card">

                            <div className="stat-icon orange">
                                <FaCalendarAlt />
                            </div>

                            <div className="stat-content">

                                <span>
                                    Scheduled
                                </span>

                                <strong>
                                    {report.scheduled || 0}
                                </strong>

                                <small>
                                    Planned services
                                </small>

                            </div>

                        </div>


                        <div className="report-stat-card">

                            <div className="stat-icon green">
                                <FaCheckCircle />
                            </div>

                            <div className="stat-content">

                                <span>
                                    Completed
                                </span>

                                <strong>
                                    {report.completed || 0}
                                </strong>

                                <small>
                                    Successfully completed
                                </small>

                            </div>

                        </div>


                        <div className="report-stat-card">

                            <div className="stat-icon red">
                                <FaTimesCircle />
                            </div>

                            <div className="stat-content">

                                <span>
                                    Cancelled
                                </span>

                                <strong>
                                    {report.cancelled || 0}
                                </strong>

                                <small>
                                    Cancelled services
                                </small>

                            </div>

                        </div>


                        <div className="report-stat-card cost-card">

                            <div className="stat-icon purple">
                                <FaRupeeSign />
                            </div>

                            <div className="stat-content">

                                <span>
                                    Total Service Cost
                                </span>

                                <strong>
                                    {formatCurrency(
                                        report.total_service_cost
                                    )}
                                </strong>

                                <small>
                                    Total maintenance expenditure
                                </small>

                            </div>

                        </div>


                        <div className="report-stat-card">

                            <div className="stat-icon cyan">
                                <FaTools />
                            </div>

                            <div className="stat-content">

                                <span>
                                    Records in Report
                                </span>

                                <strong>
                                    {records.length}
                                </strong>

                                <small>
                                    Records currently loaded
                                </small>

                            </div>

                        </div>

                    </div>

                </section>


                {/* ========================================
                    ALERT SUMMARY
                ======================================== */}

                <div className="maintenance-alert-grid">


                    <div className="maintenance-alert-card upcoming-card">

                        <div className="alert-icon">
                            <FaClock />
                        </div>

                        <div>

                            <span>
                                Upcoming Maintenance
                            </span>

                            <strong>
                                {upcoming.length}
                            </strong>

                            <p>
                                Services scheduled soon
                            </p>

                        </div>

                    </div>


                    <div className="maintenance-alert-card overdue-card">

                        <div className="alert-icon">
                            <FaExclamationTriangle />
                        </div>

                        <div>

                            <span>
                                Overdue Maintenance
                            </span>

                            <strong>
                                {overdue.length}
                            </strong>

                            <p>
                                Services requiring attention
                            </p>

                        </div>

                    </div>

                </div>


                {/* ========================================
                    MAINTENANCE RECORDS
                ======================================== */}

                <section className="report-table-section">

                    <div className="table-header">

                        <div>

                            <h2>
                                Maintenance Records
                            </h2>

                            <p>
                                Detailed service history for
                                your fleet.
                            </p>

                        </div>

                        <span className="record-count">
                            {records.length} Records
                        </span>

                    </div>


                    {loading ? (

                        <div className="report-loading">

                            <FaSyncAlt className="spin" />

                            <span>
                                Loading maintenance report...
                            </span>

                        </div>

                    ) : records.length === 0 ? (

                        <div className="empty-report">

                            <FaFileAlt />

                            <h3>
                                No maintenance records
                            </h3>

                            <p>
                                There are no maintenance records
                                available at the moment.
                            </p>

                        </div>

                    ) : (

                        <div className="maintenance-table-wrapper">

                            <table className="maintenance-table">

                                <thead>

                                    <tr>

                                        <th>ID</th>

                                        <th>Vehicle</th>

                                        <th>Category</th>

                                        <th>Service Date</th>

                                        <th>Next Service</th>

                                        <th>Cost</th>

                                        <th>Provider</th>

                                        <th>Status</th>

                                    </tr>

                                </thead>


                                <tbody>

                                    {records.map((item) => (

                                        <tr key={item.id}>

                                            <td>
                                                <span className="record-id">
                                                    #{item.id}
                                                </span>
                                            </td>

                                            <td>

                                                <span className="vehicle-badge">
                                                    Vehicle {item.vehicle_id}
                                                </span>

                                            </td>

                                            <td>

                                                <span className="category-text">
                                                    {getCategoryLabel(
                                                        item.maintenance_category
                                                    )}
                                                </span>

                                            </td>

                                            <td>
                                                {formatDate(
                                                    item.service_date
                                                )}
                                            </td>

                                            <td>
                                                {formatDate(
                                                    item.next_service_date
                                                )}
                                            </td>

                                            <td>

                                                <strong className="cost-text">
                                                    {formatCurrency(
                                                        item.service_cost
                                                    )}
                                                </strong>

                                            </td>

                                            <td>
                                                {item.service_provider || "-"}
                                            </td>

                                            <td>

                                                <span
                                                    className={`status-badge ${getStatusClass(
                                                        item.status
                                                    )}`}
                                                >
                                                    {item.status || "Unknown"}
                                                </span>

                                            </td>

                                        </tr>

                                    ))}

                                </tbody>

                            </table>

                        </div>

                    )}

                </section>


                {/* ========================================
                    UPCOMING + OVERDUE
                ======================================== */}

                <div className="maintenance-detail-grid">


                    {/* Upcoming */}

                    <section className="detail-card">

                        <div className="detail-card-header">

                            <div className="detail-heading upcoming-heading">

                                <div className="small-icon">
                                    <FaClock />
                                </div>

                                <div>

                                    <h2>
                                        Upcoming Maintenance
                                    </h2>

                                    <p>
                                        Scheduled vehicle services
                                    </p>

                                </div>

                            </div>

                            <span>
                                {upcoming.length}
                            </span>

                        </div>


                        {upcoming.length === 0 ? (

                            <div className="no-data">
                                No upcoming maintenance.
                            </div>

                        ) : (

                            <div className="maintenance-list">

                                {upcoming.map(
                                    (item, index) => (

                                        <div
                                            className="maintenance-list-item"
                                            key={
                                                item.maintenance_id ??
                                                index
                                            }
                                        >

                                            <div>

                                                <strong>
                                                    {item.vehicle_number ??
                                                        `Vehicle ${item.vehicle_id ??
                                                            "-"}`}
                                                </strong>

                                                <span>
                                                    {getCategoryLabel(
                                                        item.category
                                                    )}
                                                </span>

                                            </div>

                                            <div className="service-date">

                                                <small>
                                                    Next service
                                                </small>

                                                <strong>
                                                    {formatDate(
                                                        item.next_service_date
                                                    )}
                                                </strong>

                                            </div>

                                        </div>

                                    )
                                )}

                            </div>

                        )}

                    </section>


                    {/* Overdue */}

                    <section className="detail-card">

                        <div className="detail-card-header">

                            <div className="detail-heading overdue-heading">

                                <div className="small-icon">
                                    <FaExclamationTriangle />
                                </div>

                                <div>

                                    <h2>
                                        Overdue Maintenance
                                    </h2>

                                    <p>
                                        Services requiring immediate attention
                                    </p>

                                </div>

                            </div>

                            <span>
                                {overdue.length}
                            </span>

                        </div>


                        {overdue.length === 0 ? (

                            <div className="no-data success-message">

                                <FaCheckCircle />

                                No overdue maintenance.

                            </div>

                        ) : (

                            <div className="maintenance-list">

                                {overdue.map(
                                    (item, index) => (

                                        <div
                                            className="maintenance-list-item overdue-item"
                                            key={
                                                item.maintenance_id ??
                                                index
                                            }
                                        >

                                            <div>

                                                <strong>
                                                    {item.vehicle_number ??
                                                        `Vehicle ${item.vehicle_id ??
                                                            "-"}`}
                                                </strong>

                                                <span>
                                                    {getCategoryLabel(
                                                        item.category
                                                    )}
                                                </span>

                                            </div>

                                            <div className="service-date">

                                                <small>
                                                    Due date
                                                </small>

                                                <strong>
                                                    {formatDate(
                                                        item.next_service_date
                                                    )}
                                                </strong>

                                            </div>

                                        </div>

                                    )
                                )}

                            </div>

                        )}

                    </section>

                </div>

            </div>

        </Layout>

    );

}


export default MaintenanceReports;