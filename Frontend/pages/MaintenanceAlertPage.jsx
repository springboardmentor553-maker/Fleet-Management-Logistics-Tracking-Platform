import React, { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";

const API_URL = "http://127.0.0.1:8000/maintenance-alerts";

function MaintenanceAlertPage() {

    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);

    const [formData, setFormData] = useState({
        vehicle_id: "",
        maintenance_id: "",
        alert_message: "",
        alert_type: "Upcoming Service",
        next_service_date: "",
        alert_status: "Pending",
    });

    useEffect(() => {
        fetchAlerts();
    }, []);

    const fetchAlerts = async () => {

        try {

            const response = await axios.get(API_URL + "/");

            setAlerts(response.data);

        } catch (error) {

            console.log(error);

            alert("Unable to load alerts.");

        } finally {

            setLoading(false);

        }

    };

    const handleChange = (e) => {

        const { name, value } = e.target;

        setFormData({
            ...formData,
            [name]: value,
        });

    };

    const clearForm = () => {

        setEditingId(null);

        setFormData({
            vehicle_id: "",
            maintenance_id: "",
            alert_message: "",
            alert_type: "Upcoming Service",
            next_service_date: "",
            alert_status: "Pending",
        });

    };

    const handleSubmit = async (e) => {

        e.preventDefault();

        try {

            if (editingId === null) {

                await axios.post(API_URL + "/", {
                    vehicle_id: Number(formData.vehicle_id),
                    maintenance_id: Number(formData.maintenance_id),
                    alert_message: formData.alert_message,
                    alert_type: formData.alert_type,
                    next_service_date: formData.next_service_date,
                });

                alert("Maintenance Alert Created.");

            } else {

                await axios.put(
                    `${API_URL}/${editingId}`,
                    {
                        alert_status: formData.alert_status,
                    }
                );

                alert("Alert Updated.");

            }

            clearForm();

            fetchAlerts();

        } catch (error) {

            alert(
                error.response?.data?.detail ||
                "Operation Failed"
            );

        }

    };
        const handleEdit = (alert) => {

        setEditingId(alert.id);

        setFormData({
            vehicle_id: alert.vehicle_id,
            maintenance_id: alert.maintenance_id,
            alert_message: alert.alert_message,
            alert_type: alert.alert_type,
            next_service_date: alert.next_service_date,
            alert_status: alert.alert_status,
        });

    };

    const handleDelete = async (id) => {

        if (!window.confirm("Delete this alert?")) return;

        try {

            await axios.delete(`${API_URL}/${id}`);

            alert("Alert Deleted Successfully.");

            fetchAlerts();

        } catch (error) {

            alert("Delete Failed.");

        }

    };

    return (
    <>
    <Navbar />

        <div
  className="container mt-4"
  style={{
    marginLeft: "280px",
    padding: "20px",
    width: "calc(100% - 300px)"
  }}
>

            <h2 className="mb-4">
                Maintenance Alerts
            </h2>

            <div className="card mb-4">

                <div className="card-body">

                    <form onSubmit={handleSubmit}>

                        <div className="row">

                            <div className="col-md-6 mb-3">

                                <label>Vehicle ID</label>

                                <input
                                    type="number"
                                    className="form-control"
                                    name="vehicle_id"
                                    value={formData.vehicle_id}
                                    onChange={handleChange}
                                    disabled={editingId !== null}
                                    required
                                />

                            </div>

                            <div className="col-md-6 mb-3">

                                <label>Maintenance ID</label>

                                <input
                                    type="number"
                                    className="form-control"
                                    name="maintenance_id"
                                    value={formData.maintenance_id}
                                    onChange={handleChange}
                                    disabled={editingId !== null}
                                    required
                                />

                            </div>

                            <div className="col-md-12 mb-3">

                                <label>Alert Message</label>

                                <textarea
                                    className="form-control"
                                    rows="3"
                                    name="alert_message"
                                    value={formData.alert_message}
                                    onChange={handleChange}
                                    disabled={editingId !== null}
                                    required
                                />

                            </div>

                            <div className="col-md-6 mb-3">

                                <label>Alert Type</label>

                                <select
                                    className="form-control"
                                    name="alert_type"
                                    value={formData.alert_type}
                                    onChange={handleChange}
                                    disabled={editingId !== null}
                                >

                                    <option>Upcoming Service</option>
                                    <option>Overdue Service</option>
                                    <option>General</option>

                                </select>

                            </div>

                            <div className="col-md-6 mb-3">

                                <label>Next Service Date</label>

                                <input
                                    type="date"
                                    className="form-control"
                                    name="next_service_date"
                                    value={formData.next_service_date}
                                    onChange={handleChange}
                                    disabled={editingId !== null}
                                    required
                                />

                            </div>

                            {
                                editingId !== null && (

                                    <div className="col-md-6 mb-3">

                                        <label>Status</label>

                                        <select
                                            className="form-control"
                                            name="alert_status"
                                            value={formData.alert_status}
                                            onChange={handleChange}
                                        >

                                            <option>Pending</option>
                                            <option>Completed</option>

                                        </select>

                                    </div>

                                )
                            }

                            <div className="col-12">

                                <button
                                    className="btn btn-primary me-2"
                                >
                                    {editingId === null
                                        ? "Create Alert"
                                        : "Update Status"}
                                </button>

                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={clearForm}
                                >
                                    Clear
                                </button>

                            </div>

                        </div>

                    </form>

                </div>

            </div>
                        <div className="card">

                <div className="card-header">
                    <h4>Maintenance Alerts</h4>
                </div>

                <div className="card-body table-responsive">

                    <table className="table table-bordered table-hover">

                        <thead className="table-dark">

                            <tr>
                                <th>ID</th>
                                <th>Vehicle</th>
                                <th>Maintenance</th>
                                <th>Message</th>
                                <th>Type</th>
                                <th>Status</th>
                                <th>Next Service</th>
                                <th>Actions</th>
                            </tr>

                        </thead>

                        <tbody>

                            {alerts.length === 0 ? (

                                <tr>

                                    <td colSpan="8" className="text-center">
                                        No Alerts Found
                                    </td>

                                </tr>

                            ) : (

                                alerts.map((alert) => (

                                    <tr key={alert.id}>

                                        <td>{alert.id}</td>

                                        <td>{alert.vehicle_id}</td>

                                        <td>{alert.maintenance_id}</td>

                                        <td>{alert.alert_message}</td>

                                        <td>{alert.alert_type}</td>

                                        <td>{alert.alert_status}</td>

                                        <td>{alert.next_service_date}</td>

                                        <td>

                                            <button
                                                className="btn btn-warning btn-sm me-2"
                                                onClick={() => handleEdit(alert)}
                                            >
                                                Edit
                                            </button>

                                            <button
                                                className="btn btn-danger btn-sm"
                                                onClick={() => handleDelete(alert.id)}
                                            >
                                                Delete
                                            </button>

                                        </td>

                                    </tr>

                                ))

                            )}

                        </tbody>

                    </table>

                </div>

            </div>

        </div>
        </>

    );

}

export default MaintenanceAlertPage;