import { useEffect, useState } from "react";

import api from "../api/api";

import { toast } from "react-toastify";

import {
    FaUserTie,
    FaPhone,
    FaIdCard,
    FaSearch,
    FaPlus,
    FaEdit,
    FaTrash,
    FaCheckCircle,
    FaTruck,
    FaUsers,
} from "react-icons/fa";


function Drivers() {

    // =====================================================
    // EMPTY DRIVER
    // =====================================================

    const emptyDriver = {
        name: "",
        phone: "",
        license_number: "",
        status: "Available",
    };


    // =====================================================
    // STATE
    // =====================================================

    const [drivers, setDrivers] = useState([]);

    const [driver, setDriver] = useState(emptyDriver);

    const [editDriver, setEditDriver] = useState(emptyDriver);

    const [editId, setEditId] = useState(null);

    const [search, setSearch] = useState("");


    // =====================================================
    // FETCH DRIVERS
    // =====================================================

    useEffect(() => {

        fetchDrivers();

    }, []);


    const fetchDrivers = async () => {

        try {

            const response = await api.get("/drivers");

            setDrivers(response.data);

        } catch (error) {

            console.error(
                "Failed to fetch drivers:",
                error
            );

            toast.error("Failed to Load Drivers");

        }

    };


    // =====================================================
    // ADD DRIVER - INPUT CHANGE
    // =====================================================

    const handleChange = (e) => {

        const {
            name,
            value
        } = e.target;

        setDriver((previous) => ({
            ...previous,
            [name]: value,
        }));

    };


    // =====================================================
    // EDIT DRIVER - INPUT CHANGE
    // =====================================================

    const handleEditChange = (e) => {

        const {
            name,
            value
        } = e.target;

        setEditDriver((previous) => ({
            ...previous,
            [name]: value,
        }));

    };


    // =====================================================
    // ADD DRIVER
    // =====================================================

    const addDriver = async (e) => {

        e.preventDefault();

        try {

            await api.post(
                "/drivers",
                driver
            );

            await fetchDrivers();

            setDriver(emptyDriver);

            toast.success(
                "Driver Added Successfully"
            );

        } catch (error) {

            console.error(
                "Failed to add driver:",
                error
            );

            const message =
                error?.response?.data?.detail ||
                "Failed to Add Driver";

            toast.error(message);

        }

    };


    // =====================================================
    // OPEN EDIT MODAL
    // =====================================================

    const openEditModal = (d) => {

        setEditDriver({
            name: d.name || "",
            phone: d.phone || "",
            license_number:
                d.license_number || "",
            status:
                d.status || "Available",
        });

        setEditId(d.id);

    };


    // =====================================================
    // UPDATE DRIVER
    // =====================================================

    const updateDriver = async (e) => {

        e.preventDefault();

        if (!editId) {

            toast.error(
                "Driver ID is missing"
            );

            return;
        }


        try {

            await api.put(
                `/drivers/${editId}`,
                editDriver
            );

            await fetchDrivers();

            toast.success(
                "Driver Updated Successfully"
            );

        } catch (error) {

            console.error(
                "Failed to update driver:",
                error
            );

            const message =
                error?.response?.data?.detail ||
                "Driver Update Failed";

            toast.error(message);

        }

    };


    // =====================================================
    // DELETE DRIVER
    // =====================================================

    const deleteDriver = async (id) => {

        const confirmed = window.confirm(
            "Are you sure you want to delete this driver?"
        );

        if (!confirmed) {
            return;
        }


        try {

            await api.delete(
                `/drivers/${id}`
            );

            await fetchDrivers();

            toast.success(
                "Driver Deleted Successfully"
            );

        } catch (error) {

            console.error(
                "Failed to delete driver:",
                error
            );

            const message =
                error?.response?.data?.detail ||
                "Driver Delete Failed";

            toast.error(message);

        }

    };


    // =====================================================
    // SEARCH
    // =====================================================

    const searchText =
        search.toLowerCase().trim();


    const filteredDrivers =
        drivers.filter((d) => {

            const name =
                (d.name || "").toLowerCase();

            const phone =
                (d.phone || "").toLowerCase();

            const license =
                (d.license_number || "").toLowerCase();

            return (
                name.includes(searchText) ||
                phone.includes(searchText) ||
                license.includes(searchText)
            );

        });


    // =====================================================
    // STATISTICS
    // =====================================================

    const availableDrivers =
        drivers.filter(
            (d) => d.status === "Available"
        ).length;


    const busyDrivers =
        drivers.filter(
            (d) => d.status === "Busy"
        ).length;


    // =====================================================
    // UI
    // =====================================================

    return (

        <div className="drivers-page">

            {/* =================================================
                PAGE CONTENT
            ================================================= */}

            <div
                className="container-fluid"
                style={{
                    padding: "30px",
                }}
            >


                {/* =================================================
                    HEADER
                ================================================= */}

                <div
                    className="d-flex justify-content-between align-items-center mb-4"
                >

                    <div>

                        <h2
                            className="fw-bold mb-1"
                            style={{
                                color: "#172033",
                                fontSize: "30px",
                            }}
                        >
                            Driver Management
                        </h2>


                        <p
                            className="text-muted mb-0"
                            style={{
                                fontSize: "15px",
                            }}
                        >
                            Manage your fleet drivers and
                            their availability.
                        </p>

                    </div>


                    {/* ADD DRIVER */}

                    <button
                        type="button"
                        className="btn"
                        data-bs-toggle="modal"
                        data-bs-target="#addDriverModal"
                        style={{
                            background: "#2563eb",
                            color: "white",
                            borderRadius: "10px",
                            padding: "11px 20px",
                            fontWeight: "600",
                            boxShadow:
                                "0 5px 15px rgba(37,99,235,0.25)",
                        }}
                    >

                        <FaPlus className="me-2" />

                        Add Driver

                    </button>

                </div>


                {/* =================================================
                    STAT CARDS
                ================================================= */}

                <div className="row g-4 mb-4">


                    {/* TOTAL */}

                    <div className="col-lg-4 col-md-6">

                        <div
                            className="card border-0 h-100"
                            style={{
                                borderRadius: "16px",
                                boxShadow:
                                    "0 6px 20px rgba(15,23,42,0.08)",
                            }}
                        >

                            <div
                                className="card-body d-flex align-items-center"
                            >

                                <div
                                    style={{
                                        width: "55px",
                                        height: "55px",
                                        borderRadius: "14px",
                                        background: "#eff6ff",
                                        color: "#2563eb",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: "24px",
                                        marginRight: "15px",
                                    }}
                                >

                                    <FaUsers />

                                </div>


                                <div>

                                    <small className="text-muted">
                                        Total Drivers
                                    </small>

                                    <h3 className="fw-bold mb-0">
                                        {drivers.length}
                                    </h3>

                                </div>

                            </div>

                        </div>

                    </div>


                    {/* AVAILABLE */}

                    <div className="col-lg-4 col-md-6">

                        <div
                            className="card border-0 h-100"
                            style={{
                                borderRadius: "16px",
                                boxShadow:
                                    "0 6px 20px rgba(15,23,42,0.08)",
                            }}
                        >

                            <div
                                className="card-body d-flex align-items-center"
                            >

                                <div
                                    style={{
                                        width: "55px",
                                        height: "55px",
                                        borderRadius: "14px",
                                        background: "#ecfdf5",
                                        color: "#10b981",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: "24px",
                                        marginRight: "15px",
                                    }}
                                >

                                    <FaCheckCircle />

                                </div>


                                <div>

                                    <small className="text-muted">
                                        Available Drivers
                                    </small>

                                    <h3 className="fw-bold mb-0">
                                        {availableDrivers}
                                    </h3>

                                </div>

                            </div>

                        </div>

                    </div>


                    {/* BUSY */}

                    <div className="col-lg-4 col-md-6">

                        <div
                            className="card border-0 h-100"
                            style={{
                                borderRadius: "16px",
                                boxShadow:
                                    "0 6px 20px rgba(15,23,42,0.08)",
                            }}
                        >

                            <div
                                className="card-body d-flex align-items-center"
                            >

                                <div
                                    style={{
                                        width: "55px",
                                        height: "55px",
                                        borderRadius: "14px",
                                        background: "#fff7ed",
                                        color: "#f97316",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: "24px",
                                        marginRight: "15px",
                                    }}
                                >

                                    <FaTruck />

                                </div>


                                <div>

                                    <small className="text-muted">
                                        Busy Drivers
                                    </small>

                                    <h3 className="fw-bold mb-0">
                                        {busyDrivers}
                                    </h3>

                                </div>

                            </div>

                        </div>

                    </div>

                </div>


                {/* =================================================
                    SEARCH
                ================================================= */}

                <div
                    className="card border-0 mb-4"
                    style={{
                        borderRadius: "15px",
                        boxShadow:
                            "0 5px 18px rgba(15,23,42,0.07)",
                    }}
                >

                    <div className="card-body">

                        <div
                            className="position-relative"
                            style={{
                                maxWidth: "450px",
                            }}
                        >

                            <FaSearch
                                style={{
                                    position: "absolute",
                                    left: "16px",
                                    top: "50%",
                                    transform:
                                        "translateY(-50%)",
                                    color: "#94a3b8",
                                }}
                            />


                            <input
                                type="text"
                                className="form-control"
                                placeholder="Search driver, phone or license..."
                                value={search}
                                onChange={(e) =>
                                    setSearch(e.target.value)
                                }
                                style={{
                                    paddingLeft: "45px",
                                    height: "48px",
                                    borderRadius: "10px",
                                    border:
                                        "1px solid #e2e8f0",
                                    boxShadow: "none",
                                }}
                            />

                        </div>

                    </div>

                </div>


                {/* =================================================
                    DRIVER TABLE
                ================================================= */}

                <div
                    className="card border-0"
                    style={{
                        borderRadius: "16px",
                        overflow: "hidden",
                        boxShadow:
                            "0 6px 22px rgba(15,23,42,0.08)",
                    }}
                >

                    <div className="table-responsive">

                        <table
                            className="table table-hover align-middle mb-0"
                        >

                            <thead
                                style={{
                                    background: "#0f172a",
                                    color: "white",
                                }}
                            >

                                <tr>

                                    <th
                                        style={{
                                            padding:
                                                "17px 20px",
                                        }}
                                    >
                                        Driver
                                    </th>

                                    <th>
                                        Phone
                                    </th>

                                    <th>
                                        License
                                    </th>

                                    <th>
                                        Status
                                    </th>

                                    <th className="text-center">
                                        Actions
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                {filteredDrivers.length === 0 ? (

                                    <tr>

                                        <td
                                            colSpan="5"
                                            className="text-center py-5 text-muted"
                                        >
                                            No drivers found.
                                        </td>

                                    </tr>

                                ) : (

                                    filteredDrivers.map((d) => (

                                        <tr key={d.id}>

                                            {/* DRIVER */}

                                            <td
                                                style={{
                                                    padding:
                                                        "16px 20px",
                                                }}
                                            >

                                                <div
                                                    className="d-flex align-items-center"
                                                >

                                                    <div
                                                        style={{
                                                            width: "45px",
                                                            height: "45px",
                                                            borderRadius:
                                                                "50%",
                                                            background:
                                                                "#eff6ff",
                                                            color:
                                                                "#2563eb",
                                                            display:
                                                                "flex",
                                                            alignItems:
                                                                "center",
                                                            justifyContent:
                                                                "center",
                                                            fontSize:
                                                                "20px",
                                                            marginRight:
                                                                "12px",
                                                        }}
                                                    >

                                                        <FaUserTie />

                                                    </div>


                                                    <div>

                                                        <div
                                                            className="fw-bold"
                                                            style={{
                                                                color:
                                                                    "#172033",
                                                            }}
                                                        >
                                                            {d.name}
                                                        </div>


                                                        <small
                                                            className="text-muted"
                                                        >
                                                            Driver ID:{" "}
                                                            {d.id}
                                                        </small>

                                                    </div>

                                                </div>

                                            </td>


                                            {/* PHONE */}

                                            <td>

                                                <span
                                                    style={{
                                                        color:
                                                            "#475569",
                                                    }}
                                                >

                                                    <FaPhone
                                                        className="me-2"
                                                        style={{
                                                            color:
                                                                "#2563eb",
                                                        }}
                                                    />

                                                    {d.phone}

                                                </span>

                                            </td>


                                            {/* LICENSE */}

                                            <td>

                                                <span
                                                    style={{
                                                        display:
                                                            "inline-flex",
                                                        alignItems:
                                                            "center",
                                                        gap: "7px",
                                                        color:
                                                            "#475569",
                                                    }}
                                                >

                                                    <FaIdCard
                                                        style={{
                                                            color:
                                                                "#64748b",
                                                        }}
                                                    />

                                                    {d.license_number}

                                                </span>

                                            </td>


                                            {/* STATUS */}

                                            <td>

                                                <span
                                                    style={{
                                                        display:
                                                            "inline-flex",
                                                        alignItems:
                                                            "center",
                                                        gap: "7px",
                                                        padding:
                                                            "7px 13px",
                                                        borderRadius:
                                                            "20px",
                                                        fontSize:
                                                            "13px",
                                                        fontWeight:
                                                            "600",
                                                        background:
                                                            d.status ===
                                                            "Available"
                                                                ? "#dcfce7"
                                                                : "#dbeafe",
                                                        color:
                                                            d.status ===
                                                            "Available"
                                                                ? "#15803d"
                                                                : "#2563eb",
                                                    }}
                                                >

                                                    <span
                                                        style={{
                                                            width: "7px",
                                                            height: "7px",
                                                            borderRadius:
                                                                "50%",
                                                            background:
                                                                d.status ===
                                                                "Available"
                                                                    ? "#22c55e"
                                                                    : "#3b82f6",
                                                        }}
                                                    />

                                                    {d.status}

                                                </span>

                                            </td>


                                            {/* ACTIONS */}

                                            <td className="text-center">

                                                <button
                                                    type="button"
                                                    className="btn btn-sm me-2"
                                                    data-bs-toggle="modal"
                                                    data-bs-target="#editDriverModal"
                                                    onClick={() =>
                                                        openEditModal(d)
                                                    }
                                                    style={{
                                                        background:
                                                            "#fef3c7",
                                                        color:
                                                            "#d97706",
                                                        border:
                                                            "none",
                                                        borderRadius:
                                                            "8px",
                                                        padding:
                                                            "7px 12px",
                                                        fontWeight:
                                                            "600",
                                                    }}
                                                >

                                                    <FaEdit className="me-1" />

                                                    Edit

                                                </button>


                                                <button
                                                    type="button"
                                                    className="btn btn-sm"
                                                    onClick={() =>
                                                        deleteDriver(d.id)
                                                    }
                                                    style={{
                                                        background:
                                                            "#fee2e2",
                                                        color:
                                                            "#dc2626",
                                                        border:
                                                            "none",
                                                        borderRadius:
                                                            "8px",
                                                        padding:
                                                            "7px 12px",
                                                        fontWeight:
                                                            "600",
                                                    }}
                                                >

                                                    <FaTrash className="me-1" />

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


            {/* =====================================================
                ADD DRIVER MODAL
            ====================================================== */}

            <div
                className="modal fade"
                id="addDriverModal"
                tabIndex="-1"
            >

                <div className="modal-dialog modal-dialog-centered">

                    <div
                        className="modal-content border-0"
                        style={{
                            borderRadius: "16px",
                            overflow: "hidden",
                        }}
                    >

                        <div
                            className="modal-header"
                            style={{
                                background: "#2563eb",
                                color: "white",
                            }}
                        >

                            <h5 className="modal-title fw-bold">

                                <FaUserTie className="me-2" />

                                Add Driver

                            </h5>


                            <button
                                type="button"
                                className="btn-close btn-close-white"
                                data-bs-dismiss="modal"
                            />

                        </div>


                        <form onSubmit={addDriver}>

                            <div className="modal-body p-4">

                                <label className="form-label fw-semibold">
                                    Driver Name
                                </label>

                                <input
                                    className="form-control mb-3"
                                    placeholder="Enter driver name"
                                    name="name"
                                    value={driver.name}
                                    onChange={handleChange}
                                    required
                                />


                                <label className="form-label fw-semibold">
                                    Phone
                                </label>

                                <input
                                    className="form-control mb-3"
                                    placeholder="Enter phone number"
                                    name="phone"
                                    value={driver.phone}
                                    onChange={handleChange}
                                    required
                                />


                                <label className="form-label fw-semibold">
                                    License Number
                                </label>

                                <input
                                    className="form-control mb-3"
                                    placeholder="Enter license number"
                                    name="license_number"
                                    value={driver.license_number}
                                    onChange={handleChange}
                                    required
                                />


                                <label className="form-label fw-semibold">
                                    Status
                                </label>

                                <select
                                    className="form-select"
                                    name="status"
                                    value={driver.status}
                                    onChange={handleChange}
                                >

                                    <option value="Available">
                                        Available
                                    </option>

                                    <option value="Busy">
                                        Busy
                                    </option>

                                </select>

                            </div>


                            <div className="modal-footer">

                                <button
                                    type="button"
                                    className="btn btn-light"
                                    data-bs-dismiss="modal"
                                >
                                    Cancel
                                </button>


                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                >

                                    <FaPlus className="me-2" />

                                    Save Driver

                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            </div>


            {/* =====================================================
                EDIT DRIVER MODAL
            ====================================================== */}

            <div
                className="modal fade"
                id="editDriverModal"
                tabIndex="-1"
            >

                <div className="modal-dialog modal-dialog-centered">

                    <div
                        className="modal-content border-0"
                        style={{
                            borderRadius: "16px",
                            overflow: "hidden",
                        }}
                    >

                        <div
                            className="modal-header"
                            style={{
                                background: "#0f172a",
                                color: "white",
                            }}
                        >

                            <h5 className="modal-title fw-bold">

                                <FaEdit className="me-2" />

                                Edit Driver

                            </h5>


                            <button
                                type="button"
                                className="btn-close btn-close-white"
                                data-bs-dismiss="modal"
                            />

                        </div>


                        <form onSubmit={updateDriver}>

                            <div className="modal-body p-4">

                                <label className="form-label fw-semibold">
                                    Driver Name
                                </label>

                                <input
                                    className="form-control mb-3"
                                    name="name"
                                    value={editDriver.name}
                                    onChange={handleEditChange}
                                    required
                                />


                                <label className="form-label fw-semibold">
                                    Phone
                                </label>

                                <input
                                    className="form-control mb-3"
                                    name="phone"
                                    value={editDriver.phone}
                                    onChange={handleEditChange}
                                    required
                                />


                                <label className="form-label fw-semibold">
                                    License Number
                                </label>

                                <input
                                    className="form-control mb-3"
                                    name="license_number"
                                    value={editDriver.license_number}
                                    onChange={handleEditChange}
                                    required
                                />


                                <label className="form-label fw-semibold">
                                    Status
                                </label>

                                <select
                                    className="form-select"
                                    name="status"
                                    value={editDriver.status}
                                    onChange={handleEditChange}
                                >

                                    <option value="Available">
                                        Available
                                    </option>

                                    <option value="Busy">
                                        Busy
                                    </option>

                                </select>

                            </div>


                            <div className="modal-footer">

                                <button
                                    type="button"
                                    className="btn btn-light"
                                    data-bs-dismiss="modal"
                                >
                                    Cancel
                                </button>


                                <button
                                    type="submit"
                                    className="btn btn-success"
                                >

                                    <FaEdit className="me-2" />

                                    Update Driver

                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            </div>

        </div>

    );

}


export default Drivers;