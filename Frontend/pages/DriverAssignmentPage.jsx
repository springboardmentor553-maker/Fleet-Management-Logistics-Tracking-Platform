import React, { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const API_URL = "https://fleetflow-backend-90o5.onrender.com/driver-assignments";

function DriverAssignmentPage() {

    const [assignments, setAssignments] = useState([]);

    const [loading, setLoading] = useState(true);

    const [editingId, setEditingId] = useState(null);

    const [formData, setFormData] = useState({
        driver_id: "",
        vehicle_id: "",
        trip_id: "",
        assignment_date: "",
        assignment_status: "Assigned",
        remarks: "",
    });

    useEffect(() => {
        fetchAssignments();
    }, []);

    const fetchAssignments = async () => {

        try {

            const response = await axios.get(API_URL + "/");

            setAssignments(response.data);

        } catch (error) {

            console.error(error);

            alert("Failed to load assignments.");

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
            driver_id: "",
            vehicle_id: "",
            trip_id: "",
            assignment_date: "",
            assignment_status: "Assigned",
            remarks: "",
        });

    };

    const handleSubmit = async (e) => {

        e.preventDefault();

        try {

            if (editingId === null) {

                await axios.post(API_URL + "/", formData);

                alert("Driver assigned successfully.");

            } else {

                await axios.put(
                    `${API_URL}/${editingId}`,
                    {
                        assignment_status: formData.assignment_status,
                        remarks: formData.remarks,
                    }
                );

                alert("Assignment updated successfully.");

            }

            clearForm();

            fetchAssignments();

        } catch (error) {

            console.error(error);

            alert(
                error.response?.data?.detail ||
                "Operation failed."
            );

        }

    };
        const handleEdit = (assignment) => {

        setEditingId(assignment.id);

        setFormData({
            driver_id: assignment.driver_id,
            vehicle_id: assignment.vehicle_id,
            trip_id: assignment.trip_id,
            assignment_date: assignment.assignment_date,
            assignment_status: assignment.assignment_status,
            remarks: assignment.remarks || "",
        });

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });

    };

    const handleDelete = async (id) => {

        if (!window.confirm("Delete this assignment?")) return;

        try {

            await axios.delete(`${API_URL}/${id}`);

            alert("Assignment deleted successfully.");

            fetchAssignments();

        } catch (error) {

            console.error(error);

            alert(
                error.response?.data?.detail ||
                "Delete failed."
            );

        }

    };
    const chartData = [
  {
    status: "Assigned",
    count: assignments.filter(
      (a) => a.assignment_status === "Assigned"
    ).length,
  },
  {
    status: "Completed",
    count: assignments.filter(
      (a) => a.assignment_status === "Completed"
    ).length,
  },
  {
    status: "Cancelled",
    count: assignments.filter(
      (a) => a.assignment_status === "Cancelled"
    ).length,
  },
];

const COLORS = [
  "#0d6efd",
  "#198754",
  "#dc3545",
];

    return (
        <>
    <Navbar />

        <div
  className="container-fluid mt-4"
  style={{
    marginLeft: "270px",
    padding: "20px",
    width: "calc(100% - 270px)"
  }}
>

            <h2 className="mb-4">
                Driver Assignment Management
            </h2>
            {/* Summary Cards */}

    <div className="row mb-4">

        <div className="col-md-3">
            <div className="card shadow text-center bg-primary text-white">
                <div className="card-body">
                    <h5>Total Assignments</h5>
                    <h2>{assignments.length}</h2>
                </div>
            </div>
        </div>


        <div className="col-md-3">
            <div className="card shadow text-center bg-success text-white">
                <div className="card-body">
                    <h5>Assigned</h5>
                    <h2>
                        {
                        assignments.filter(
                          (a)=>a.assignment_status==="Assigned"
                        ).length
                        }
                    </h2>
                </div>
            </div>
        </div>


        <div className="col-md-3">
            <div className="card shadow text-center bg-warning">
                <div className="card-body">
                    <h5>Completed</h5>
                    <h2>
                        {
                        assignments.filter(
                          (a)=>a.assignment_status==="Completed"
                        ).length
                        }
                    </h2>
                </div>
            </div>
        </div>


        <div className="col-md-3">
            <div className="card shadow text-center bg-danger text-white">
                <div className="card-body">
                    <h5>Cancelled</h5>
                    <h2>
                        {
                        assignments.filter(
                          (a)=>a.assignment_status==="Cancelled"
                        ).length
                        }
                    </h2>
                </div>
            </div>
        </div>

    </div>


            <div className="card shadow">

                <div className="card-header bg-primary text-white">

                    {editingId
                        ? "Update Driver Assignment"
                        : "Assign Driver"}

                </div>

                <div className="card-body">

                    <form onSubmit={handleSubmit}>

                        <div className="row">

                            <div className="col-md-3 mb-3">

                                <label className="form-label">
                                    Driver ID
                                </label>

                                <input
                                    type="number"
                                    className="form-control"
                                    name="driver_id"
                                    value={formData.driver_id}
                                    onChange={handleChange}
                                    required
                                    disabled={editingId !== null}
                                />

                            </div>

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
                                    disabled={editingId !== null}
                                />

                            </div>

                            <div className="col-md-3 mb-3">

                                <label className="form-label">
                                    Trip ID
                                </label>

                                <input
                                    type="number"
                                    className="form-control"
                                    name="trip_id"
                                    value={formData.trip_id}
                                    onChange={handleChange}
                                    required
                                    disabled={editingId !== null}
                                />

                            </div>

                            <div className="col-md-3 mb-3">

                                <label className="form-label">
                                    Assignment Date
                                </label>

                                <input
                                    type="date"
                                    className="form-control"
                                    name="assignment_date"
                                    value={formData.assignment_date}
                                    onChange={handleChange}
                                    required
                                    disabled={editingId !== null}
                                />

                            </div>

                            <div className="col-md-4 mb-3">

                                <label className="form-label">
                                    Assignment Status
                                </label>

                                <select
                                    className="form-select"
                                    name="assignment_status"
                                    value={formData.assignment_status}
                                    onChange={handleChange}
                                >
                                    <option>Assigned</option>
                                    <option>Completed</option>
                                    <option>Cancelled</option>
                                </select>

                            </div>

                            <div className="col-md-8 mb-3">

                                <label className="form-label">
                                    Remarks
                                </label>

                                <input
                                    type="text"
                                    className="form-control"
                                    name="remarks"
                                    value={formData.remarks}
                                    onChange={handleChange}
                                />

                            </div>

                            <div className="col-md-12">

                                <button
                                    className="btn btn-success me-2"
                                    type="submit"
                                >
                                    {editingId
                                        ? "Update Assignment"
                                        : "Assign Driver"}
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
                    Driver Assignments
                </div>

                <div className="card-body">

                    {loading ? (

                        <h5>Loading...</h5>

                    ) : (

                        <table className="table table-bordered table-hover">

                            <thead className="table-primary">

                                <tr>
                                    <th>ID</th>
                                    <th>Driver</th>
                                    <th>Vehicle</th>
                                    <th>Trip</th>
                                    <th>Assignment Date</th>
                                    <th>Status</th>
                                    <th>Remarks</th>
                                    <th width="170">Actions</th>
                                </tr>

                            </thead>

                            <tbody>

                                {assignments.length === 0 ? (

                                    <tr>

                                        <td
                                            colSpan="8"
                                            className="text-center"
                                        >
                                            No Driver Assignments Found
                                        </td>

                                    </tr>

                                ) : (

                                    assignments.map((assignment) => (

                                        <tr key={assignment.id}>

                                            <td>{assignment.id}</td>

                                            <td>{assignment.driver_id}</td>

                                            <td>{assignment.vehicle_id}</td>

                                            <td>{assignment.trip_id}</td>

                                            <td>{assignment.assignment_date}</td>

                                            <td>

                                                <span
                                                    className={
                                                        assignment.assignment_status === "Completed"
                                                            ? "badge bg-success"
                                                            : assignment.assignment_status === "Assigned"
                                                            ? "badge bg-primary"
                                                            : "badge bg-danger"
                                                    }
                                                >
                                                    {assignment.assignment_status}
                                                </span>

                                            </td>

                                            <td>
                                                {assignment.remarks || "-"}
                                            </td>

                                            <td>

                                                <button
                                                    className="btn btn-warning btn-sm me-2"
                                                    onClick={() =>
                                                        handleEdit(assignment)
                                                    }
                                                >
                                                    Edit
                                                </button>

                                                <button
                                                    className="btn btn-danger btn-sm"
                                                    onClick={() =>
                                                        handleDelete(
                                                            assignment.id
                                                        )
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

                    )}

                </div>

            </div>

        </div>
         {/* Assignment Analytics Charts */}

    <div 
  className="row mt-4"
  style={{
    marginLeft: "260px"
  }}
>

        <div className="col-md-5">

            <div className="card shadow">

                <div className="card-header bg-info text-white">
                    Assignment Status Distribution
                </div>


                <div className="card-body">

                    <ResponsiveContainer
                        width="90%"
                        height={250}
                    >

                        <PieChart>

                            <Pie
                                data={chartData}
                                dataKey="count"
                                nameKey="status"
                                outerRadius={100}
                                label
                            >

                                {chartData.map(
                                    (entry,index)=>(
                                        <Cell
                                            key={index}
                                            fill={COLORS[index]}
                                        />
                                    )
                                )}

                            </Pie>


                            <Tooltip />

                            <Legend />


                        </PieChart>

                    </ResponsiveContainer>


                </div>

            </div>

        </div>





        <div className="col-md-5">


            <div className="card shadow">


                <div className="card-header bg-success text-white">

                    Assignment Status Overview

                </div>


                <div className="card-body">


                    <ResponsiveContainer
                            width="90%"
                            height={250}
                        >
                                            

                        <BarChart data={chartData}>


                            <CartesianGrid
                                strokeDasharray="3 3"
                            />


                            <XAxis
                                dataKey="status"
                            />


                            <YAxis />


                            <Tooltip />


                            <Legend />


                            <Bar
                                dataKey="count"
                                fill="#198754"
                            />


                        </BarChart>


                    </ResponsiveContainer>


                </div>


            </div>


        </div>


        </div>
  </>
);

}

export default DriverAssignmentPage;