import { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import { getAuditLogs } from "../services/auditService";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

import {
    FaSearch,
    FaSyncAlt,
    FaFilePdf,
    FaFileExcel,
    FaFilter,
    FaClipboardList,
    FaPlus,
    FaEdit,
    FaTrash,
    FaHistory,
} from "react-icons/fa";

import "../styles/audit.css";

function AuditLogs() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);

    const [search, setSearch] = useState("");
    const [moduleFilter, setModuleFilter] = useState("ALL");
    const [actionFilter, setActionFilter] = useState("ALL");

    const loadLogs = async () => {
        try {
            setLoading(true);

            const data = await getAuditLogs();

            if (Array.isArray(data)) {
                setLogs(data);
            } else {
                setLogs([]);
            }
        } catch (error) {
            console.error("Failed to load audit logs:", error);

            if (error.response?.status === 401) {
                console.error("Authentication token is missing or expired.");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLogs();
    }, []);

    /* -------------------------------------------------
       FILTER OPTIONS
    ------------------------------------------------- */

    const modules = useMemo(() => {
        const values = logs
            .map((log) => log.module)
            .filter(Boolean);

        return ["ALL", ...new Set(values)];
    }, [logs]);

    const actions = useMemo(() => {
        const values = logs
            .map((log) => log.action)
            .filter(Boolean);

        return ["ALL", ...new Set(values)];
    }, [logs]);

    /* -------------------------------------------------
       FILTERED LOGS
    ------------------------------------------------- */

    const filteredLogs = useMemo(() => {
        const query = search.trim().toLowerCase();

        return logs.filter((log) => {
            const matchesSearch =
                !query ||
                String(log.id || "")
                    .toLowerCase()
                    .includes(query) ||
                String(log.username || "")
                    .toLowerCase()
                    .includes(query) ||
                String(log.module || "")
                    .toLowerCase()
                    .includes(query) ||
                String(log.action || "")
                    .toLowerCase()
                    .includes(query) ||
                String(log.details || "")
                    .toLowerCase()
                    .includes(query);

            const matchesModule =
                moduleFilter === "ALL" ||
                log.module === moduleFilter;

            const matchesAction =
                actionFilter === "ALL" ||
                log.action === actionFilter;

            return (
                matchesSearch &&
                matchesModule &&
                matchesAction
            );
        });
    }, [
        logs,
        search,
        moduleFilter,
        actionFilter,
    ]);

    /* -------------------------------------------------
       SUMMARY
    ------------------------------------------------- */

    const summary = useMemo(() => {
        return {
            total: logs.length,

            creates: logs.filter(
                (log) => log.action === "CREATE"
            ).length,

            updates: logs.filter(
                (log) => log.action === "UPDATE"
            ).length,

            deletes: logs.filter(
                (log) => log.action === "DELETE"
            ).length,
        };
    }, [logs]);

    /* -------------------------------------------------
       DATE FORMAT
    ------------------------------------------------- */

    const formatDate = (date) => {
        if (!date) {
            return "-";
        }

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return date;
        }

        return parsedDate.toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    /* -------------------------------------------------
       ACTION ICON
    ------------------------------------------------- */

    const getActionIcon = (action) => {
        switch (action) {
            case "CREATE":
                return <FaPlus />;

            case "UPDATE":
                return <FaEdit />;

            case "DELETE":
                return <FaTrash />;

            default:
                return <FaHistory />;
        }
    };

    /* -------------------------------------------------
       CLEAR FILTERS
    ------------------------------------------------- */

    const clearFilters = () => {
        setSearch("");
        setModuleFilter("ALL");
        setActionFilter("ALL");
    };

    /* -------------------------------------------------
       EXPORT EXCEL
    ------------------------------------------------- */

    const exportExcel = () => {
        try {
            setExporting(true);

            const data = filteredLogs.map((log) => ({
                ID: log.id,
                User: log.username || "System",
                "User ID": log.user_id || "-",
                Module: log.module || "-",
                Action: log.action || "-",
                Details: log.details || "-",
                "Created At": formatDate(log.created_at),
            }));

            const worksheet = XLSX.utils.json_to_sheet(data);

            worksheet["!cols"] = [
                { wch: 8 },
                { wch: 20 },
                { wch: 12 },
                { wch: 24 },
                { wch: 14 },
                { wch: 70 },
                { wch: 25 },
            ];

            const workbook = XLSX.utils.book_new();

            XLSX.utils.book_append_sheet(
                workbook,
                worksheet,
                "Audit Logs"
            );

            XLSX.writeFile(
                workbook,
                `FleetFlow_Audit_Logs_${new Date()
                    .toISOString()
                    .slice(0, 10)}.xlsx`
            );
        } catch (error) {
            console.error(
                "Excel export failed:",
                error
            );
        } finally {
            setExporting(false);
        }
    };

    /* -------------------------------------------------
       EXPORT PDF
    ------------------------------------------------- */

    const exportPDF = () => {
        try {
            setExporting(true);

            const doc = new jsPDF({
                orientation: "landscape",
                unit: "mm",
                format: "a4",
            });

            const currentDate =
                new Date().toLocaleString("en-IN");

            doc.setFontSize(20);
            doc.setFont("helvetica", "bold");

            doc.text(
                "FleetFlow - Audit Log Report",
                14,
                18
            );

            doc.setFontSize(9);
            doc.setFont("helvetica", "normal");

            doc.text(
                `Generated: ${currentDate}`,
                14,
                25
            );

            doc.text(
                `Total Records: ${filteredLogs.length}`,
                14,
                30
            );

            const tableData = filteredLogs.map(
                (log) => [
                    log.id,
                    log.username || "System",
                    log.module || "-",
                    log.action || "-",
                    log.details || "-",
                    formatDate(log.created_at),
                ]
            );

            autoTable(doc, {
                startY: 36,

                head: [
                    [
                        "ID",
                        "User",
                        "Module",
                        "Action",
                        "Details",
                        "Date & Time",
                    ],
                ],

                body: tableData,

                theme: "grid",

                styles: {
                    fontSize: 7,
                    cellPadding: 2,
                    overflow: "linebreak",
                    valign: "middle",
                },

                headStyles: {
                    fontSize: 8,
                    fontStyle: "bold",
                },

                columnStyles: {
                    0: {
                        cellWidth: 12,
                    },
                    1: {
                        cellWidth: 28,
                    },
                    2: {
                        cellWidth: 30,
                    },
                    3: {
                        cellWidth: 22,
                    },
                    4: {
                        cellWidth: 120,
                    },
                    5: {
                        cellWidth: 35,
                    },
                },

                margin: {
                    left: 10,
                    right: 10,
                },
            });

            const pageCount =
                doc.internal.getNumberOfPages();

            for (
                let page = 1;
                page <= pageCount;
                page++
            ) {
                doc.setPage(page);

                doc.setFontSize(8);

                doc.text(
                    `Page ${page} of ${pageCount}`,
                    270,
                    200
                );
            }

            doc.save(
                `FleetFlow_Audit_Logs_${new Date()
                    .toISOString()
                    .slice(0, 10)}.pdf`
            );
        } catch (error) {
            console.error(
                "PDF export failed:",
                error
            );
        } finally {
            setExporting(false);
        }
    };

    return (
        <Layout>
            <div className="audit-page">

                {/* -----------------------------------------
                    HEADER
                ----------------------------------------- */}

                <div className="audit-header">

                    <div className="audit-title-section">

                        <div className="audit-title-icon">
                            <FaClipboardList />
                        </div>

                        <div>
                            <h1>Audit Logs</h1>

                            <p>
                                Monitor and track important
                                activities performed across
                                FleetFlow.
                            </p>
                        </div>

                    </div>

                    <button
                        className="audit-refresh-btn"
                        onClick={loadLogs}
                        disabled={loading}
                    >
                        <FaSyncAlt
                            className={
                                loading
                                    ? "audit-spin"
                                    : ""
                            }
                        />

                        Refresh
                    </button>

                </div>

                {/* -----------------------------------------
                    SUMMARY CARDS
                ----------------------------------------- */}

                <div className="audit-summary-grid">

                    <div className="audit-summary-card">

                        <div className="audit-card-icon total">
                            <FaClipboardList />
                        </div>

                        <div>
                            <span>Total Activities</span>
                            <strong>{summary.total}</strong>
                        </div>

                    </div>

                    <div className="audit-summary-card">

                        <div className="audit-card-icon create">
                            <FaPlus />
                        </div>

                        <div>
                            <span>Created</span>
                            <strong>{summary.creates}</strong>
                        </div>

                    </div>

                    <div className="audit-summary-card">

                        <div className="audit-card-icon update">
                            <FaEdit />
                        </div>

                        <div>
                            <span>Updated</span>
                            <strong>{summary.updates}</strong>
                        </div>

                    </div>

                    <div className="audit-summary-card">

                        <div className="audit-card-icon delete">
                            <FaTrash />
                        </div>

                        <div>
                            <span>Deleted</span>
                            <strong>{summary.deletes}</strong>
                        </div>

                    </div>

                </div>

                {/* -----------------------------------------
                    FILTER BAR
                ----------------------------------------- */}

                <div className="audit-toolbar">

                    <div className="audit-search">

                        <FaSearch />

                        <input
                            type="text"
                            placeholder="Search user, module, action or details..."
                            value={search}
                            onChange={(event) =>
                                setSearch(
                                    event.target.value
                                )
                            }
                        />

                    </div>

                    <div className="audit-filter">

                        <FaFilter />

                        <select
                            value={moduleFilter}
                            onChange={(event) =>
                                setModuleFilter(
                                    event.target.value
                                )
                            }
                        >
                            {modules.map((module) => (
                                <option
                                    key={module}
                                    value={module}
                                >
                                    {module === "ALL"
                                        ? "All Modules"
                                        : module}
                                </option>
                            ))}
                        </select>

                    </div>

                    <div className="audit-filter">

                        <select
                            value={actionFilter}
                            onChange={(event) =>
                                setActionFilter(
                                    event.target.value
                                )
                            }
                        >
                            {actions.map((action) => (
                                <option
                                    key={action}
                                    value={action}
                                >
                                    {action === "ALL"
                                        ? "All Actions"
                                        : action}
                                </option>
                            ))}
                        </select>

                    </div>

                    <button
                        className="audit-clear-btn"
                        onClick={clearFilters}
                    >
                        Clear
                    </button>

                    <button
                        className="audit-excel-btn"
                        onClick={exportExcel}
                        disabled={
                            exporting ||
                            filteredLogs.length === 0
                        }
                    >
                        <FaFileExcel />
                        Excel
                    </button>

                    <button
                        className="audit-pdf-btn"
                        onClick={exportPDF}
                        disabled={
                            exporting ||
                            filteredLogs.length === 0
                        }
                    >
                        <FaFilePdf />
                        PDF
                    </button>

                </div>

                {/* -----------------------------------------
                    TABLE
                ----------------------------------------- */}

                <div className="audit-table-card">

                    <div className="audit-table-header">

                        <div>
                            <h2>Activity History</h2>

                            <span>
                                Showing{" "}
                                <strong>
                                    {filteredLogs.length}
                                </strong>{" "}
                                of{" "}
                                <strong>
                                    {logs.length}
                                </strong>{" "}
                                records
                            </span>
                        </div>

                    </div>

                    {loading ? (

                        <div className="audit-state">
                            <FaSyncAlt className="audit-spin" />
                            <p>Loading audit logs...</p>
                        </div>

                    ) : filteredLogs.length === 0 ? (

                        <div className="audit-state">

                            <FaClipboardList />

                            <h3>
                                No audit logs found
                            </h3>

                            <p>
                                Try changing your search
                                or filter options.
                            </p>

                        </div>

                    ) : (

                        <div className="audit-table-wrapper">

                            <table className="audit-table">

                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>User</th>
                                        <th>Module</th>
                                        <th>Action</th>
                                        <th>Details</th>
                                        <th>Date & Time</th>
                                    </tr>
                                </thead>

                                <tbody>

                                    {filteredLogs.map(
                                        (log) => (
                                            <tr
                                                key={log.id}
                                            >

                                                <td>
                                                    <span className="audit-id">
                                                        #{log.id}
                                                    </span>
                                                </td>

                                                <td>
                                                    <div className="audit-user">

                                                        <div className="audit-avatar">
                                                            {(log.username ||
                                                                "S")
                                                                .charAt(
                                                                    0
                                                                )
                                                                .toUpperCase()}
                                                        </div>

                                                        <div>
                                                            <strong>
                                                                {log.username ||
                                                                    "System"}
                                                            </strong>

                                                            {log.user_id && (
                                                                <small>
                                                                    User ID:{" "}
                                                                    {
                                                                        log.user_id
                                                                    }
                                                                </small>
                                                            )}
                                                        </div>

                                                    </div>
                                                </td>

                                                <td>
                                                    <span className="audit-module">
                                                        {
                                                            log.module
                                                        }
                                                    </span>
                                                </td>

                                                <td>

                                                    <span
                                                        className={`audit-action ${String(
                                                            log.action ||
                                                                ""
                                                        ).toLowerCase()}`}
                                                    >
                                                        {getActionIcon(
                                                            log.action
                                                        )}

                                                        {
                                                            log.action
                                                        }
                                                    </span>

                                                </td>

                                                <td>
                                                    <div className="audit-details">
                                                        {
                                                            log.details
                                                        }
                                                    </div>
                                                </td>

                                                <td>
                                                    <span className="audit-date">
                                                        {formatDate(
                                                            log.created_at
                                                        )}
                                                    </span>
                                                </td>

                                            </tr>
                                        )
                                    )}

                                </tbody>

                            </table>

                        </div>

                    )}

                </div>

            </div>
        </Layout>
    );
}

export default AuditLogs;