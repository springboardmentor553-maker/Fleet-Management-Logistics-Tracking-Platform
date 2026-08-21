import React, { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "https://fleetflow-backend-90o5.onrender.com/maintenance";

function MaintenancePage() {

    const [maintenanceRecords, setMaintenanceRecords] = useState([]);

    const [loading, setLoading] = useState(true);

    const [editingId, setEditingId] = useState(null);

    const [formData, setFormData] = useState({
        vehicle_id: "",
        maintenance_category: "Oil Change",
        service_date: "",
        next_service_date: "",
        service_cost: "",
        service_provider: "",
        maintenance_status: "Scheduled",
        notes: "",
    });

    useEffect(() => {
        fetchMaintenance();
    }, []);

    const fetchMaintenance = async () => {
        try {
            const response = await axios.get(API_URL + "/");
            setMaintenanceRecords(response.data);
        } catch (error) {
            console.error(error);
            alert("Failed to load maintenance records");
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
            maintenance_category: "Oil Change",
            service_date: "",
            next_service_date: "",
            service_cost: "",
            service_provider: "",
            maintenance_status: "Scheduled",
            notes: "",
        });

    };

    const handleSubmit = async (e) => {

        e.preventDefault();

        try {

            if (editingId === null) {

                await axios.post(API_URL + "/", formData);

                alert("Maintenance record added successfully.");

            } else {

                await axios.put(
                    `${API_URL}/${editingId}`,
                    formData
                );

                alert("Maintenance record updated successfully.");

            }

            clearForm();

            fetchMaintenance();

        } catch (error) {

            console.error(error);

            alert(
                error.response?.data?.detail ||
                "Operation failed"
            );

        }
    };
    const handleEdit = (record) => {

        setEditingId(record.id);            
        setFormData({
            vehicle_id: record.vehicle_id,
            maintenance_category: record.maintenance_category,
            service_date: record.service_date,
            next_service_date: record.next_service_date,
            service_cost: record.service_cost,
            service_provider: record.service_provider,
            maintenance_status: record.maintenance_status,
            notes: record.notes,
        });
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
        

    };
    const handleDelete = async (id) => {

        const confirmDelete = window.confirm(
            "Are you sure you want to delete this maintenance record?"
        );

        if (!confirmDelete) return;

        try {

            await axios.delete(`${API_URL}/${id}`);

            alert("Maintenance record deleted successfully.");

            fetchMaintenance();

        } catch (error) {

            console.error(error);

            alert(
                error.response?.data?.detail ||
                "Delete failed"
            );

        }

    };

    return (

        <div
  className="container mt-4"
  style={{
    marginLeft: "280px",
    padding: "20px",
    width: "calc(100% - 300px)"
  }}
>

            <h2 className="mb-4">
                Maintenance Management
            </h2>

            <div className="card shadow">

                <div className="card-header bg-primary text-white">

                    {editingId
                        ? "Update Maintenance"
                        : "Schedule Maintenance"}

                </div>

                <div className="card-body">

                    <form onSubmit={handleSubmit}>

                        <div className="row">

                            <div className="col-md-3 mb-3">

                                <label className="form-label">
                                    Vehicle ID
                                </label>

                                <input
                                    type="number"
                                    className="form-control"
                                    name="vehicle_id"
                                    value={formData.vehicle_id}
                                    onChange={handleChange}
                                    required
                                />

                            </div>

                            <div className="col-md-3 mb-3">

                                <label className="form-label">
                                    Category
                                </label>

                                <select
                                    className="form-select"
                                    name="maintenance_category"
                                    value={formData.maintenance_category}
                                    onChange={handleChange}
                                >

                                    <option>Oil Change</option>
                                    <option>Engine Service</option>
                                    <option>Brake Inspection</option>
                                    <option>Tire Replacement</option>
                                    <option>Battery Check</option>
                                    <option>General Service</option>

                                </select>

                            </div>

                            <div className="col-md-3 mb-3">

                                <label className="form-label">
                                    Service Date
                                </label>

                                <input
                                    type="date"
                                    className="form-control"
                                    name="service_date"
                                    value={formData.service_date}
                                    onChange={handleChange}
                                    required
                                />

                            </div>

                            <div className="col-md-3 mb-3">

                                <label className="form-label">
                                    Next Service
                                </label>

                                <input
                                    type="date"
                                    className="form-control"
                                    name="next_service_date"
                                    value={formData.next_service_date}
                                    onChange={handleChange}
                                />

                            </div>

                            <div className="col-md-3 mb-3">

                                <label className="form-label">
                                    Cost
                                </label>

                                <input
                                    type="number"
                                    className="form-control"
                                    name="service_cost"
                                    value={formData.service_cost}
                                    onChange={handleChange}
                                    required
                                />

                            </div>

                            <div className="col-md-3 mb-3">

                                <label className="form-label">
                                    Service Provider
                                </label>

                                <input
                                    type="text"
                                    className="form-control"
                                    name="service_provider"
                                    value={formData.service_provider}
                                    onChange={handleChange}
                                    required
                                />

                            </div>

                            <div className="col-md-3 mb-3">

                                <label className="form-label">
                                    Status
                                </label>

                                <select
                                    className="form-select"
                                    name="maintenance_status"
                                    value={formData.maintenance_status}
                                    onChange={handleChange}
                                >

                                    <option>Scheduled</option>
                                    <option>In Progress</option>
                                    <option>Completed</option>
                                    <option>Cancelled</option>

                                </select>

                            </div>

                            <div className="col-md-12 mb-3">

                                <label className="form-label">
                                    Notes
                                </label>

                                <textarea
                                    rows="3"
                                    className="form-control"
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleChange}
                                />

                            </div>

                            <div className="col-md-12">

                                <button
                                    className="btn btn-success me-2"
                                    type="submit"
                                >
                                    {editingId
                                        ? "Update Maintenance"
                                        : "Add Maintenance"}
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
                        <div className="card shadow mt-4">

                <div className="card-header bg-dark text-white">
                    Maintenance Records
                </div>

                <div className="card-body">

                    {loading ? (

                        <h5>Loading...</h5>

                    ) : (

                        <table className="table table-bordered table-hover">

                            <thead className="table-primary">

                                <tr>
                                    <th>ID</th>
                                    <th>Vehicle</th>
                                    <th>Category</th>
                                    <th>Service Date</th>
                                    <th>Next Service</th>
                                    <th>Cost</th>
                                    <th>Provider</th>
                                    <th>Status</th>
                                    <th>Notes</th>
                                    <th width="170">Actions</th>
                                </tr>

                            </thead>

                            <tbody>

                                {maintenanceRecords.length === 0 ? (

                                    <tr>
                                        <td colSpan="10" className="text-center">
                                            No Maintenance Records Found
                                        </td>
                                    </tr>

                                ) : (

                                    maintenanceRecords.map((record) => (

                                        <tr key={record.id}>

                                            <td>{record.id}</td>

                                            <td>{record.vehicle_id}</td>

                                            <td>{record.maintenance_category}</td>

                                            <td>{record.service_date}</td>

                                            <td>
                                                {record.next_service_date || "-"}
                                            </td>

                                            <td>₹ {record.service_cost}</td>

                                            <td>{record.service_provider}</td>

                                            <td>

                                                <span
                                                    className={
                                                        record.maintenance_status === "Completed"
                                                            ? "badge bg-success"
                                                            : record.maintenance_status === "Scheduled"
                                                            ? "badge bg-warning text-dark"
                                                            : record.maintenance_status === "In Progress"
                                                            ? "badge bg-primary"
                                                            : "badge bg-secondary"
                                                    }
                                                >
                                                    {record.maintenance_status}
                                                </span>

                                            </td>

                                            <td>{record.notes}</td>

                                            <td>

                                                <button
                                                    className="btn btn-warning btn-sm me-2"
                                                    onClick={() => handleEdit(record)}
                                                >
                                                    Edit
                                                </button>

                                                <button
                                                    className="btn btn-danger btn-sm"
                                                    onClick={() => handleDelete(record.id)}
                                                >
                                                    Delete
                                                </button>

                                            </td>

                                        </tr>

                                    ))

                                )}

                            </tbody>

                        </table>

                    )}

                </div>

            </div>

        </div>

    );

}

export default MaintenancePage;
