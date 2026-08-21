import { useEffect, useState } from "react";
import Layout from "../components/Layout";

import {
    FaUserCheck,
    FaSearch,
    FaPlus,
    FaUsers,
    FaTruck
} from "react-icons/fa";

import {
    getAssignments,
    assignDriver,
    releaseDriver
} from "../services/driverAssignmentService";

import "../styles/driverAssignment.css";

function DriverAssignment() {

    const [assignments, setAssignments] = useState([]);

    const [search, setSearch] = useState("");

    const [form, setForm] = useState({
        driver_id: "",
        vehicle_id: "",
        trip_id: "",
        assignment_date: "",
        remarks: ""
    });

    useEffect(() => {
        loadAssignments();
    }, []);

    const loadAssignments = async () => {
        try {
            const data = await getAssignments();
            setAssignments(data);
        } catch (err) {
            console.log(err);
        }
    };

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {

        e.preventDefault();

        try {

            await assignDriver({
                driver_id: Number(form.driver_id),
                vehicle_id: Number(form.vehicle_id),
                trip_id: Number(form.trip_id),
                assignment_date: form.assignment_date,
                remarks: form.remarks
            });

            alert("Driver Assigned Successfully");

            setForm({
                driver_id: "",
                vehicle_id: "",
                trip_id: "",
                assignment_date: "",
                remarks: ""
            });

            loadAssignments();

        } catch (err) {

            alert(err.response?.data?.detail || "Assignment Failed");

        }

    };

    const handleRelease = async (id) => {

        const today = new Date()
            .toISOString()
            .split("T")[0];

        try {

            await releaseDriver(id, today);

            alert("Driver Released");

            loadAssignments();

        } catch (err) {

            console.log(err);

        }

    };

    const filtered = assignments.filter((item) =>
        item.driver_id.toString().includes(search) ||
        item.vehicle_id.toString().includes(search) ||
        item.trip_id.toString().includes(search)
    );

    const activeAssignments = assignments.filter(
        (a) => a.status === "Assigned"
    ).length;

    return (

        <Layout>

            <div className="driver-assignment-page">

                <div className="page-header">

                    <div>

                        <h1>

                            <FaUserCheck />

                            Driver Assignment

                        </h1>

                        <p>

                            Manage driver and vehicle assignments

                        </p>

                    </div>

                </div>

                <div className="summary-grid">

                    <div className="summary-card">

                        <FaUserCheck />

                        <h3>Total Assignments</h3>

                        <h2>{assignments.length}</h2>

                    </div>

                    <div className="summary-card">

                        <FaUsers />

                        <h3>Active Assignments</h3>

                        <h2>{activeAssignments}</h2>

                    </div>

                    <div className="summary-card">

                        <FaTruck />

                        <h3>Released</h3>

                        <h2>{assignments.length - activeAssignments}</h2>

                    </div>

                </div>

                <div className="search-box">

                    <FaSearch />

                    <input
                        type="text"
                        placeholder="Search Driver, Vehicle or Trip..."
                        value={search}
                        onChange={(e) =>
                            setSearch(e.target.value)
                        }
                    />

                </div>

                <form
                    className="assignment-form"
                    onSubmit={handleSubmit}
                >

                    <input
                        type="number"
                        name="driver_id"
                        placeholder="Driver ID"
                        value={form.driver_id}
                        onChange={handleChange}
                        required
                    />

                    <input
                        type="number"
                        name="vehicle_id"
                        placeholder="Vehicle ID"
                        value={form.vehicle_id}
                        onChange={handleChange}
                        required
                    />

                    <input
                        type="number"
                        name="trip_id"
                        placeholder="Trip ID"
                        value={form.trip_id}
                        onChange={handleChange}
                        required
                    />

                    <input
                        type="date"
                        name="assignment_date"
                        value={form.assignment_date}
                        onChange={handleChange}
                        required
                    />

                    <input
                        type="text"
                        name="remarks"
                        placeholder="Remarks"
                        value={form.remarks}
                        onChange={handleChange}
                    />

                    <button type="submit">

                        <FaPlus />

                        Assign Driver

                    </button>

                </form>

                <div className="table-container">

                    <table>

                        <thead>

                            <tr>

                                <th>ID</th>
                                <th>Driver</th>
                                <th>Vehicle</th>
                                <th>Trip</th>
                                <th>Assigned</th>
                                <th>Released</th>
                                <th>Status</th>
                                <th>Remarks</th>
                                <th>Action</th>

                            </tr>

                        </thead>

                        <tbody>

                            {filtered.length === 0 ? (

                                <tr>

                                    <td colSpan="9">

                                        No Assignments Found

                                    </td>

                                </tr>

                            ) : (

                                filtered.map((item) => (

                                    <tr key={item.id}>

                                        <td>{item.id}</td>

                                        <td>{item.driver_id}</td>

                                        <td>{item.vehicle_id}</td>

                                        <td>{item.trip_id}</td>

                                        <td>{item.assignment_date}</td>

                                        <td>{item.release_date || "-"}</td>

                                        <td>

                                            <span
                                                className={`status-badge ${
                                                    item.status === "Assigned"
                                                        ? "active"
                                                        : "released"
                                                }`}
                                            >
                                                {item.status}
                                            </span>

                                        </td>

                                        <td>{item.remarks || "-"}</td>

                                        <td>

                                            {item.status === "Assigned" && (

                                                <button
                                                    className="release-btn"
                                                    onClick={() =>
                                                        handleRelease(item.id)
                                                    }
                                                >

                                                    Release

                                                </button>

                                            )}

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

export default DriverAssignment;