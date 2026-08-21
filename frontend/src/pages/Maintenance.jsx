import { useEffect, useState } from "react";
import Layout from "../components/Layout";

import {
    FaTools,
    FaSearch,
    FaPlus,
    FaRupeeSign,
    FaClipboardList
} from "react-icons/fa";

import {
    getAllMaintenance,
    addMaintenance,
    removeMaintenance,
} from "../services/maintenanceService";

import "../styles/maintenance.css";

export default function Maintenance() {

    const [records, setRecords] = useState([]);

    const [search, setSearch] = useState("");

    const [form, setForm] = useState({
        vehicle_id: "",
        maintenance_category: "",
        service_date: "",
        next_service_date: "",
        service_cost: "",
        service_provider: "",
        notes: "",
    });

    useEffect(() => {
        loadMaintenance();
    }, []);

    const loadMaintenance = async () => {
        try {
            const data = await getAllMaintenance();
            setRecords(data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {

        e.preventDefault();

        try {

            await addMaintenance({
                vehicle_id: Number(form.vehicle_id),
                maintenance_category: form.maintenance_category,
                service_date: form.service_date,
                next_service_date: form.next_service_date,
                service_cost: Number(form.service_cost),
                service_provider: form.service_provider,
                notes: form.notes,
            });

            setForm({
                vehicle_id: "",
                maintenance_category: "",
                service_date: "",
                next_service_date: "",
                service_cost: "",
                service_provider: "",
                notes: "",
            });

            loadMaintenance();

        } catch (err) {

            console.error(err);

            alert("Failed to create maintenance record.");

        }
    };

    const handleDelete = async (id) => {

        if (!window.confirm("Delete this maintenance record?"))
            return;

        try {

            await removeMaintenance(id);

            loadMaintenance();

        } catch (err) {

            console.error(err);

        }

    };

    const filteredRecords = records.filter((item) =>
        item.maintenance_category
            ?.toLowerCase()
            .includes(search.toLowerCase()) ||

        item.service_provider
            ?.toLowerCase()
            .includes(search.toLowerCase()) ||

        item.vehicle_id
            .toString()
            .includes(search)
    );

    const totalCost = records.reduce(
        (sum, item) => sum + Number(item.service_cost || 0),
        0
    );

    return (

        <Layout>

            <div className="maintenance-page">

                <div className="page-header">

                    <div>

                        <h1>

                            <FaTools />

                            Maintenance Management

                        </h1>

                        <p>

                            Monitor vehicle maintenance records

                        </p>

                    </div>

                </div>

                <div className="summary-grid">

                    <div className="summary-card">

                        <FaClipboardList />

                        <h3>Total Records</h3>

                        <h2>{records.length}</h2>

                    </div>

                    <div className="summary-card">

                        <FaRupeeSign />

                        <h3>Total Cost</h3>

                        <h2>₹ {totalCost}</h2>

                    </div>

                </div>

                <div className="search-box">

                    <FaSearch />

                    <input
                        type="text"
                        placeholder="Search Vehicle, Category or Provider..."
                        value={search}
                        onChange={(e) =>
                            setSearch(e.target.value)
                        }
                    />

                </div>

                <form
                    className="maintenance-form"
                    onSubmit={handleSubmit}
                >

                    <input
                        type="number"
                        name="vehicle_id"
                        placeholder="Vehicle ID"
                        value={form.vehicle_id}
                        onChange={handleChange}
                        required
                    />

                    <select
                        name="maintenance_category"
                        value={form.maintenance_category}
                        onChange={handleChange}
                        required
                    >
                        <option value="">Category</option>
                        <option>Oil Change</option>
                        <option>Tyre Replacement</option>
                        <option>Brake Service</option>
                        <option>Engine Service</option>
                        <option>General Inspection</option>
                    </select>

                    <input
                        type="date"
                        name="service_date"
                        value={form.service_date}
                        onChange={handleChange}
                        required
                    />

                    <input
                        type="date"
                        name="next_service_date"
                        value={form.next_service_date}
                        onChange={handleChange}
                        required
                    />

                    <input
                        type="number"
                        name="service_cost"
                        placeholder="Service Cost"
                        value={form.service_cost}
                        onChange={handleChange}
                        required
                    />

                    <input
                        type="text"
                        name="service_provider"
                        placeholder="Service Provider"
                        value={form.service_provider}
                        onChange={handleChange}
                        required
                    />

                    <input
                        type="text"
                        name="notes"
                        placeholder="Notes"
                        value={form.notes}
                        onChange={handleChange}
                    />

                    <button type="submit">

                        <FaPlus />

                        Add Maintenance

                    </button>

                </form>

                <div className="table-container">

                    <table>

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
                                <th>Notes</th>
                                <th>Action</th>

                            </tr>

                        </thead>

                        <tbody>
                                                    {filteredRecords.length === 0 ? (

                            <tr>

                                <td colSpan="10">

                                    No Maintenance Records Found

                                </td>

                            </tr>

                        ) : (

                            filteredRecords.map((item) => (

                                <tr key={item.id}>

                                    <td>{item.id}</td>

                                    <td>{item.vehicle_id}</td>

                                    <td>{item.maintenance_category}</td>

                                    <td>{item.service_date}</td>

                                    <td>{item.next_service_date}</td>

                                    <td>

                                        <span className="price">

                                            ₹ {item.service_cost}

                                        </span>

                                    </td>

                                    <td>{item.service_provider}</td>

                                    <td>

                                        <span
                                            className={`status-badge ${
                                                item.status === "Completed"
                                                    ? "completed"
                                                    : item.status === "In Progress"
                                                    ? "progress"
                                                    : item.status === "Overdue"
                                                    ? "overdue"
                                                    : "scheduled"
                                            }`}
                                        >
                                            {item.status}
                                        </span>

                                    </td>

                                    <td>{item.notes}</td>

                                    <td>

                                        <button
                                            className="delete-btn"
                                            onClick={() =>
                                                handleDelete(item.id)
                                            }
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

        </Layout>

    );

}
