import { useEffect, useState } from "react";
import Layout from "../components/Layout";

import {
    getAlerts,
    createAlert,
    updateAlert,
    deleteAlert
} from "../services/maintenanceAlertService";

import { getVehicles } from "../services/vehicleService";

import axios from "axios";

import "../styles/maintenanceAlerts.css";

const API = "http://127.0.0.1:8000";

const getHeaders = () => ({
    headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`
    }
});

function MaintenanceAlerts() {

    // =====================================================
    // STATE
    // =====================================================

    const [alerts, setAlerts] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [maintenanceRecords, setMaintenanceRecords] = useState([]);

    const [search, setSearch] = useState("");

    const [currentPage, setCurrentPage] = useState(1);

    const rowsPerPage = 5;

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [form, setForm] = useState({
        vehicle_id: "",
        maintenance_id: "",
        alert_message: "",
        alert_type: "Reminder",
        generated_date: new Date()
            .toISOString()
            .split("T")[0],
        next_service_date: ""
    });


    // =====================================================
    // LOAD DATA
    // =====================================================

    useEffect(() => {
        loadData();
    }, []);


    const loadData = async () => {

        try {

            setLoading(true);

            const [
                alertsData,
                vehiclesData,
                maintenanceData
            ] = await Promise.all([
                getAlerts(),
                getVehicles(),
                getMaintenanceRecords()
            ]);

            setAlerts(alertsData || []);
            setVehicles(vehiclesData || []);

            /*
             * Some APIs return:
             *     [...]
             *
             * Others return:
             *     { maintenance: [...] }
             *
             * Handle both.
             */

            if (Array.isArray(maintenanceData)) {

                setMaintenanceRecords(
                    maintenanceData
                );

            } else {

                setMaintenanceRecords(
                    maintenanceData?.maintenance || []
                );

            }

        } catch (error) {

            console.error(
                "Failed to load maintenance alerts data:",
                error
            );

        } finally {

            setLoading(false);

        }

    };


    // =====================================================
    // LOAD MAINTENANCE RECORDS
    // =====================================================

    const getMaintenanceRecords = async () => {

        const response = await axios.get(
            `${API}/maintenance`,
            getHeaders()
        );

        return response.data;

    };


    // =====================================================
    // FORM CHANGE
    // =====================================================

    const handleChange = (e) => {

        const {
            name,
            value
        } = e.target;

        setForm((previous) => ({
            ...previous,
            [name]: value
        }));


        /*
         * When maintenance is selected,
         * automatically fill the next service date.
         */

        if (name === "maintenance_id") {

            const selectedMaintenance =
                maintenanceRecords.find(
                    (item) =>
                        String(item.id) === String(value)
                );

            if (selectedMaintenance) {

                setForm((previous) => ({
                    ...previous,
                    maintenance_id: value,
                    next_service_date:
                        selectedMaintenance.next_service_date ||
                        ""
                }));

            }

        }

    };


    // =====================================================
    // CREATE ALERT
    // =====================================================

    const handleSubmit = async (e) => {

        e.preventDefault();

        if (!form.vehicle_id) {

            alert("Please select a vehicle.");

            return;

        }

        if (!form.maintenance_id) {

            alert("Please select a maintenance record.");

            return;

        }

        try {

            setSubmitting(true);

            await createAlert({

                vehicle_id: Number(
                    form.vehicle_id
                ),

                maintenance_id: Number(
                    form.maintenance_id
                ),

                alert_message:
                    form.alert_message.trim(),

                alert_type:
                    form.alert_type,

                generated_date:
                    form.generated_date,

                next_service_date:
                    form.next_service_date

            });

            alert(
                "Maintenance alert created successfully."
            );


            // Reset form

            setForm({
                vehicle_id: "",
                maintenance_id: "",
                alert_message: "",
                alert_type: "Reminder",
                generated_date: new Date()
                    .toISOString()
                    .split("T")[0],
                next_service_date: ""
            });

            setCurrentPage(1);

            await loadData();

        } catch (error) {

            console.error(
                "Failed to create alert:",
                error
            );

            if (error.response?.data?.detail) {

                alert(
                    typeof error.response.data.detail ===
                        "string"
                        ? error.response.data.detail
                        : JSON.stringify(
                              error.response.data.detail
                          )
                );

            } else {

                alert(
                    "Unable to create maintenance alert."
                );

            }

        } finally {

            setSubmitting(false);

        }

    };


    // =====================================================
    // COMPLETE ALERT
    // =====================================================

    const changeStatus = async (id) => {

        try {

            await updateAlert(id, {
                alert_status: "Completed"
            });

            await loadData();

        } catch (error) {

            console.error(
                "Failed to update alert:",
                error
            );

            alert(
                "Unable to update alert status."
            );

        }

    };


    // =====================================================
    // DELETE ALERT
    // =====================================================

    const removeAlert = async (id) => {

        const confirmed = window.confirm(
            "Are you sure you want to delete this maintenance alert?"
        );

        if (!confirmed) {
            return;
        }

        try {

            await deleteAlert(id);

            await loadData();

        } catch (error) {

            console.error(
                "Failed to delete alert:",
                error
            );

            alert(
                "Unable to delete alert."
            );

        }

    };


    // =====================================================
    // SEARCH
    // =====================================================

    const filtered = alerts.filter((item) => {

        const searchValue =
            search.toLowerCase().trim();

        if (!searchValue) {
            return true;
        }

        return (

            String(
                item.vehicle_id ?? ""
            )
                .toLowerCase()
                .includes(searchValue)

            ||

            String(
                item.maintenance_id ?? ""
            )
                .toLowerCase()
                .includes(searchValue)

            ||

            String(
                item.alert_type ?? ""
            )
                .toLowerCase()
                .includes(searchValue)

            ||

            String(
                item.alert_status ?? ""
            )
                .toLowerCase()
                .includes(searchValue)

            ||

            String(
                item.alert_message ?? ""
            )
                .toLowerCase()
                .includes(searchValue)

        );

    });


    // =====================================================
    // PAGINATION
    // =====================================================

    const totalPages = Math.ceil(
        filtered.length / rowsPerPage
    );

    const safePage =
        totalPages > 0
            ? Math.min(currentPage, totalPages)
            : 1;

    const firstIndex =
        (safePage - 1) * rowsPerPage;

    const lastIndex =
        firstIndex + rowsPerPage;

    const currentAlerts =
        filtered.slice(
            firstIndex,
            lastIndex
        );


    // =====================================================
    // VEHICLE DISPLAY
    // =====================================================

    const getVehicleName = (vehicleId) => {

        const vehicle =
            vehicles.find(
                (item) =>
                    String(item.id) ===
                    String(vehicleId)
            );

        if (!vehicle) {
            return `Vehicle #${vehicleId}`;
        }

        return (
            vehicle.vehicle_number ||
            vehicle.registration_number ||
            vehicle.number_plate ||
            `Vehicle #${vehicle.id}`
        );

    };


    // =====================================================
    // MAINTENANCE DISPLAY
    // =====================================================

    const getMaintenanceName = (
        maintenanceId
    ) => {

        const maintenance =
            maintenanceRecords.find(
                (item) =>
                    String(item.id) ===
                    String(maintenanceId)
            );

        if (!maintenance) {
            return `Maintenance #${maintenanceId}`;
        }

        return (
            maintenance.maintenance_category ||
            maintenance.category ||
            `Maintenance #${maintenance.id}`
        );

    };


    // =====================================================
    // LOADING
    // =====================================================

    if (loading) {

        return (

            <Layout>

                <div className="maintenance-alert-page">

                    <div className="page-loading">

                        <div className="loading-spinner"></div>

                        <h3>
                            Loading maintenance alerts...
                        </h3>

                        <p>
                            Please wait while we load
                            your fleet data.
                        </p>

                    </div>

                </div>

            </Layout>

        );

    }


    // =====================================================
    // UI
    // =====================================================

    return (

        <Layout>

            <div className="maintenance-alert-page">

                {/* =================================================
                    HEADER
                ================================================= */}

                <div className="alerts-header">

                    <div>

                        <div className="page-title-row">

                            <div className="page-title-icon">
                                🔔
                            </div>

                            <div>

                                <h1>
                                    Maintenance Alerts
                                </h1>

                                <p>
                                    Create, monitor and manage
                                    vehicle maintenance alerts.
                                </p>

                            </div>

                        </div>

                    </div>

                    <div className="alert-count">

                        <span>
                            Total Alerts
                        </span>

                        <strong>
                            {alerts.length}
                        </strong>

                    </div>

                </div>


                {/* =================================================
                    CREATE ALERT CARD
                ================================================= */}

                <div className="create-alert-card">

                    <div className="section-heading">

                        <div>

                            <h2>
                                Create Maintenance Alert
                            </h2>

                            <p>
                                Select the vehicle and
                                maintenance record associated
                                with this alert.
                            </p>

                        </div>

                    </div>


                    <form
                        className="alert-form"
                        onSubmit={handleSubmit}
                    >

                        {/* Vehicle */}

                        <div className="form-group">

                            <label>
                                Vehicle
                                <span>*</span>
                            </label>

                            <select
                                name="vehicle_id"
                                value={form.vehicle_id}
                                onChange={handleChange}
                                required
                            >

                                <option value="">
                                    Select vehicle
                                </option>

                                {vehicles.map(
                                    (vehicle) => (

                                        <option
                                            key={vehicle.id}
                                            value={vehicle.id}
                                        >

                                            {vehicle.vehicle_number ||
                                                vehicle.registration_number ||
                                                vehicle.number_plate ||
                                                `Vehicle #${vehicle.id}`}

                                        </option>

                                    )
                                )}

                            </select>

                        </div>


                        {/* Maintenance */}

                        <div className="form-group">

                            <label>
                                Maintenance Record
                                <span>*</span>
                            </label>

                            <select
                                name="maintenance_id"
                                value={form.maintenance_id}
                                onChange={handleChange}
                                required
                            >

                                <option value="">
                                    Select maintenance record
                                </option>

                                {maintenanceRecords.map(
                                    (maintenance) => (

                                        <option
                                            key={
                                                maintenance.id
                                            }
                                            value={
                                                maintenance.id
                                            }
                                        >

                                            {maintenance.maintenance_category ||
                                                maintenance.category ||
                                                `Maintenance #${maintenance.id}`}

                                            {" — "}

                                            {maintenance.vehicle_id
                                                ? getVehicleName(
                                                      maintenance.vehicle_id
                                                  )
                                                : ""}

                                        </option>

                                    )
                                )}

                            </select>

                        </div>


                        {/* Alert Type */}

                        <div className="form-group">

                            <label>
                                Alert Type
                            </label>

                            <select
                                name="alert_type"
                                value={form.alert_type}
                                onChange={handleChange}
                            >

                                <option value="Reminder">
                                    Reminder
                                </option>

                                <option value="Warning">
                                    Warning
                                </option>

                                <option value="Urgent">
                                    Urgent
                                </option>

                            </select>

                        </div>


                        {/* Generated Date */}

                        <div className="form-group">

                            <label>
                                Generated Date
                            </label>

                            <input
                                type="date"
                                name="generated_date"
                                value={
                                    form.generated_date
                                }
                                onChange={handleChange}
                                required
                            />

                        </div>


                        {/* Next Service */}

                        <div className="form-group">

                            <label>
                                Next Service Date
                            </label>

                            <input
                                type="date"
                                name="next_service_date"
                                value={
                                    form.next_service_date
                                }
                                onChange={handleChange}
                                required
                            />

                        </div>


                        {/* Message */}

                        <div className="form-group form-group-wide">

                            <label>
                                Alert Message
                                <span>*</span>
                            </label>

                            <input
                                type="text"
                                name="alert_message"
                                placeholder="Enter maintenance alert message..."
                                value={
                                    form.alert_message
                                }
                                onChange={handleChange}
                                required
                            />

                        </div>


                        {/* Submit */}

                        <div className="form-submit">

                            <button
                                type="submit"
                                disabled={submitting}
                                className="create-alert-btn"
                            >

                                {submitting
                                    ? "Creating..."
                                    : "+ Create Alert"}

                            </button>

                        </div>

                    </form>

                </div>


                {/* =================================================
                    ALERT LIST HEADER
                ================================================= */}

                <div className="alerts-list-card">

                    <div className="list-header">

                        <div>

                            <h2>
                                Alert History
                            </h2>

                            <p>
                                Review and manage maintenance
                                notifications.
                            </p>

                        </div>

                        <div className="list-tools">

                            <div className="search-wrapper">

                                <span>
                                    🔍
                                </span>

                                <input
                                    type="text"
                                    placeholder="Search alerts..."
                                    value={search}
                                    onChange={(e) => {

                                        setSearch(
                                            e.target.value
                                        );

                                        setCurrentPage(1);

                                    }}
                                />

                            </div>

                        </div>

                    </div>


                    {/* =================================================
                        TABLE
                    ================================================= */}

                    <div className="table-container">

                        <table>

                            <thead>

                                <tr>

                                    <th>ID</th>

                                    <th>Vehicle</th>

                                    <th>Maintenance</th>

                                    <th>Alert Message</th>

                                    <th>Type</th>

                                    <th>Status</th>

                                    <th>Generated</th>

                                    <th>Next Service</th>

                                    <th>Actions</th>

                                </tr>

                            </thead>


                            <tbody>

                                {currentAlerts.length === 0 ? (

                                    <tr>

                                        <td
                                            colSpan="9"
                                            className="empty-state"
                                        >

                                            <div>
                                                🔔
                                            </div>

                                            <strong>
                                                No alerts found
                                            </strong>

                                            <p>
                                                Try changing your
                                                search or create a
                                                new maintenance alert.
                                            </p>

                                        </td>

                                    </tr>

                                ) : (

                                    currentAlerts.map(
                                        (alert) => (

                                            <tr
                                                key={
                                                    alert.id
                                                }
                                            >

                                                <td>

                                                    <span className="id-badge">
                                                        #{alert.id}
                                                    </span>

                                                </td>


                                                <td>

                                                    <strong>
                                                        {getVehicleName(
                                                            alert.vehicle_id
                                                        )}
                                                    </strong>

                                                </td>


                                                <td>

                                                    {getMaintenanceName(
                                                        alert.maintenance_id
                                                    )}

                                                </td>


                                                <td>

                                                    <div className="message-cell">

                                                        {alert.alert_message ||
                                                            "-"}

                                                    </div>

                                                </td>


                                                <td>

                                                    <span
                                                        className={`type-badge ${String(
                                                            alert.alert_type ||
                                                                ""
                                                        ).toLowerCase()}`}
                                                    >

                                                        {alert.alert_type ||
                                                            "Reminder"}

                                                    </span>

                                                </td>


                                                <td>

                                                    <span
                                                        className={`status-badge ${String(
                                                            alert.alert_status ||
                                                                ""
                                                        ).toLowerCase()}`}
                                                    >

                                                        {alert.alert_status ||
                                                            "Pending"}

                                                    </span>

                                                </td>


                                                <td>
                                                    {alert.generated_date ||
                                                        "-"}
                                                </td>


                                                <td>
                                                    {alert.next_service_date ||
                                                        "-"}
                                                </td>


                                                <td>

                                                    <div className="action-buttons">

                                                        {alert.alert_status !==
                                                            "Completed" && (

                                                            <button
                                                                className="complete-btn"
                                                                onClick={() =>
                                                                    changeStatus(
                                                                        alert.id
                                                                    )
                                                                }
                                                            >
                                                                ✓ Complete
                                                            </button>

                                                        )}


                                                        <button
                                                            className="delete-btn"
                                                            onClick={() =>
                                                                removeAlert(
                                                                    alert.id
                                                                )
                                                            }
                                                        >
                                                            Delete
                                                        </button>

                                                    </div>

                                                </td>

                                            </tr>

                                        )
                                    )

                                )}

                            </tbody>

                        </table>

                    </div>


                    {/* =================================================
                        PAGINATION
                    ================================================= */}

                    <div className="pagination">

                        <span className="pagination-info">

                            Showing{" "}
                            {filtered.length === 0
                                ? 0
                                : firstIndex + 1}
                            -
                            {Math.min(
                                lastIndex,
                                filtered.length
                            )}{" "}
                            of {filtered.length} alerts

                        </span>


                        <div className="pagination-controls">

                            <button
                                disabled={
                                    safePage === 1
                                }
                                onClick={() =>
                                    setCurrentPage(
                                        safePage - 1
                                    )
                                }
                            >
                                ← Previous
                            </button>


                            <span className="page-number">

                                Page {safePage} of{" "}
                                {totalPages || 1}

                            </span>


                            <button
                                disabled={
                                    safePage >=
                                        totalPages ||
                                    totalPages === 0
                                }
                                onClick={() =>
                                    setCurrentPage(
                                        safePage + 1
                                    )
                                }
                            >
                                Next →
                            </button>

                        </div>

                    </div>

                </div>

            </div>

        </Layout>

    );

}

export default MaintenanceAlerts;