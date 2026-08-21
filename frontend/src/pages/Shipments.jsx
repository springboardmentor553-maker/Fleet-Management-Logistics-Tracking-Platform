import { useEffect, useState } from "react";

import api from "../api/api";

import { toast } from "react-toastify";

import {
    FaBoxOpen,
    FaSearch,
    FaPlus,
    FaEdit,
    FaTrash,
    FaClock,
    FaTruck,
    FaCheckCircle,
    FaShippingFast,
    FaMapMarkerAlt,
} from "react-icons/fa";

function Shipments() {

    // =====================================================
    // EMPTY SHIPMENT
    // =====================================================

    const emptyShipment = {
        tracking_number: "",
        sender_name: "",
        receiver_name: "",
        pickup_location: "",
        delivery_location: "",
        current_status: "Created",
        assigned_vehicle_id: "",
        assigned_driver_id: "",
        weight: "",
    };


    // =====================================================
    // STATE
    // =====================================================

    const [shipments, setShipments] =
        useState([]);

    const [vehicles, setVehicles] =
        useState([]);

    const [drivers, setDrivers] =
        useState([]);

    const [shipment, setShipment] =
        useState(emptyShipment);

    const [editShipment, setEditShipment] =
        useState(emptyShipment);

    const [editId, setEditId] =
        useState(null);

    const [search, setSearch] =
        useState("");
    const [showAddModal, setShowAddModal] =
        useState(false);

    const [showEditModal, setShowEditModal] =
        useState(false);


    // =====================================================
    // FETCH INITIAL DATA
    // =====================================================

    useEffect(() => {

        fetchShipments();
        fetchVehicles();
        fetchDrivers();

    }, []);


    // =====================================================
    // FETCH SHIPMENTS
    // =====================================================

    const fetchShipments = async () => {

        try {

            const res =
                await api.get("/shipments/");

            setShipments(
                Array.isArray(res.data)
                    ? res.data
                    : []
            );

        } catch (error) {

            console.error(
                "Fetch Shipments Error:",
                error
            );

            toast.error(
                "Failed to Load Shipments"
            );

        }

    };


    // =====================================================
    // FETCH VEHICLES
    // =====================================================

    const fetchVehicles = async () => {

        try {

            const res =
                await api.get("/vehicles");

            setVehicles(
                Array.isArray(res.data)
                    ? res.data
                    : []
            );

        } catch (error) {

            console.error(
                "Fetch Vehicles Error:",
                error
            );

            toast.error(
                "Failed to Load Vehicles"
            );

        }

    };


    // =====================================================
    // FETCH DRIVERS
    // =====================================================

    const fetchDrivers = async () => {

        try {

            const res =
                await api.get("/drivers");

            setDrivers(
                Array.isArray(res.data)
                    ? res.data
                    : []
            );

        } catch (error) {

            console.error(
                "Fetch Drivers Error:",
                error
            );

            toast.error(
                "Failed to Load Drivers"
            );

        }

    };


    // =====================================================
    // ADD FORM CHANGE
    // =====================================================

    const handleChange = (e) => {

        const {
            name,
            value,
        } = e.target;

        setShipment(
            (previous) => ({
                ...previous,
                [name]: value,
            })
        );

    };


    // =====================================================
    // EDIT FORM CHANGE
    // =====================================================

    const handleEditChange = (e) => {

        const {
            name,
            value,
        } = e.target;

        setEditShipment(
            (previous) => ({
                ...previous,
                [name]: value,
            })
        );

    };


    // =====================================================
    // ADD SHIPMENT
    // =====================================================

    const addShipment = async (e) => {
        console.log("SAVE SHIPMENT BUTTON CLICKED");

        e.preventDefault();

        try {

            const payload = {
                ...shipment,

                weight:
                    shipment.weight !== ""
                        ? Number(
                            shipment.weight
                        )
                        : 0,

                assigned_vehicle_id:
                    shipment.assigned_vehicle_id
                        ? Number(
                            shipment.assigned_vehicle_id
                        )
                        : null,

                assigned_driver_id:
                    shipment.assigned_driver_id
                        ? Number(
                            shipment.assigned_driver_id
                        )
                        : null,
            };

            console.log(
                "Create Shipment Payload:",
                payload
            );

            await api.post(
                "/shipments/",
                payload
            );

            toast.success(
                "Shipment Added Successfully"
            );

            setShipment(
                { ...emptyShipment }
            );

            await fetchShipments();

            closeAddModal();

        } catch (error) {

            console.error(
                "Add Shipment Error:",
                error
            );

            console.error(
                "Backend Response:",
                error?.response?.data
            );

            const detail =
                error?.response?.data?.detail;

            toast.error(
                detail
                    ? typeof detail === "string"
                        ? detail
                        : JSON.stringify(detail)
                    : "Failed to Add Shipment"
            );

        }

    };


    // =====================================================
    // OPEN EDIT MODAL
    // =====================================================

    const openEditModal = (s) => {

        setEditShipment({

            tracking_number:
                s.tracking_number || "",

            sender_name:
                s.sender_name || "",

            receiver_name:
                s.receiver_name || "",

            pickup_location:
                s.pickup_location || "",

            delivery_location:
                s.delivery_location || "",

            current_status:
                s.current_status ||
                "Created",

            assigned_vehicle_id:
                s.assigned_vehicle_id
                    ? String(
                        s.assigned_vehicle_id
                    )
                    : "",

            assigned_driver_id:
                s.assigned_driver_id
                    ? String(
                        s.assigned_driver_id
                    )
                    : "",

            weight:
                s.weight ?? "",
        });

        setEditId(
            s.id
        );

        openEditModalManually();

    };


    // =====================================================
    // UPDATE SHIPMENT
    // =====================================================

    const updateShipment = async (e) => {

        e.preventDefault();

        if (!editId) {

            toast.error(
                "Shipment ID is missing"
            );

            return;

        }

        try {

            const payload = {

                ...editShipment,

                weight:
                    editShipment.weight !== ""
                        ? Number(
                            editShipment.weight
                        )
                        : 0,

                assigned_vehicle_id:
                    editShipment.assigned_vehicle_id
                        ? Number(
                            editShipment.assigned_vehicle_id
                        )
                        : null,

                assigned_driver_id:
                    editShipment.assigned_driver_id
                        ? Number(
                            editShipment.assigned_driver_id
                        )
                        : null,
            };

            console.log(
                "Update Shipment Payload:",
                payload
            );

            await api.put(
                `/shipments/${editId}`,
                payload
            );

            toast.success(
                "Shipment Updated Successfully"
            );

            await fetchShipments();

            closeEditModal();

        } catch (error) {

            console.error(
                "Update Shipment Error:",
                error
            );

            console.error(
                "Backend Response:",
                error?.response?.data
            );

            const detail =
                error?.response?.data?.detail;

            toast.error(
                detail
                    ? typeof detail === "string"
                        ? detail
                        : JSON.stringify(detail)
                    : "Shipment Update Failed"
            );

        }

    };


    // =====================================================
    // DELETE SHIPMENT
    // =====================================================

    const deleteShipment = async (id) => {

        const confirmed =
            window.confirm(
                "Are you sure you want to delete this shipment?"
            );

        if (!confirmed) {
            return;
        }

        try {

            await api.delete(
                `/shipments/${id}`
            );

            toast.success(
                "Shipment Deleted Successfully"
            );

            await fetchShipments();

        } catch (error) {

            console.error(
                "Delete Shipment Error:",
                error
            );

            console.error(
                "Backend Response:",
                error?.response?.data
            );

            const detail =
                error?.response?.data?.detail;

            toast.error(
                detail
                    ? typeof detail === "string"
                        ? detail
                        : JSON.stringify(detail)
                    : "Shipment Delete Failed"
            );

        }

    };


    // =====================================================
    // STATUS COUNTS
    // =====================================================

    const pendingCount =
        shipments.filter(
            (s) =>
                s.current_status ===
                    "Created" ||
                s.current_status ===
                    "Assigned"
        ).length;


    const transitCount =
        shipments.filter(
            (s) =>
                s.current_status ===
                    "Picked Up" ||
                s.current_status ===
                    "In Transit" ||
                s.current_status ===
                    "Out for Delivery"
        ).length;


    const deliveredCount =
        shipments.filter(
            (s) =>
                s.current_status ===
                "Delivered"
        ).length;


    // =====================================================
    // STATUS STYLE
    // =====================================================

    const getStatusStyle = (
        status
    ) => {

        switch (status) {

            case "Created":

                return {
                    background: "#f1f5f9",
                    color: "#475569",
                    dot: "#64748b",
                };


            case "Assigned":

                return {
                    background: "#e0f2fe",
                    color: "#0369a1",
                    dot: "#0ea5e9",
                };


            case "Picked Up":

                return {
                    background: "#dbeafe",
                    color: "#1d4ed8",
                    dot: "#3b82f6",
                };


            case "In Transit":

                return {
                    background: "#fef3c7",
                    color: "#b45309",
                    dot: "#f59e0b",
                };


            case "Out for Delivery":

                return {
                    background: "#ede9fe",
                    color: "#6d28d9",
                    dot: "#8b5cf6",
                };


            case "Delivered":

                return {
                    background: "#dcfce7",
                    color: "#15803d",
                    dot: "#22c55e",
                };


            case "Delayed":

                return {
                    background: "#fee2e2",
                    color: "#b91c1c",
                    dot: "#ef4444",
                };


            case "Cancelled":

                return {
                    background: "#fee2e2",
                    color: "#991b1b",
                    dot: "#dc2626",
                };


            default:

                return {
                    background: "#f1f5f9",
                    color: "#475569",
                    dot: "#64748b",
                };

        }

    };


    // =====================================================
    // FILTER SHIPMENTS
    // =====================================================

    const filteredShipments =
        shipments.filter(
            (s) => {

                const vehicle =
                    vehicles.find(
                        (v) =>
                            String(v.id) ===
                            String(
                                s.assigned_vehicle_id
                            )
                    )?.vehicle_number ||
                    "";

                const driver =
                    drivers.find(
                        (d) =>
                            String(d.id) ===
                            String(
                                s.assigned_driver_id
                            )
                    )?.name ||
                    "";

                const searchText =
                    search
                        .toLowerCase()
                        .trim();

                if (!searchText) {
                    return true;
                }

                const values = [

                    s.tracking_number,

                    s.sender_name,

                    s.receiver_name,

                    s.pickup_location,

                    s.delivery_location,

                    s.current_status,

                    vehicle,

                    driver,

                ];

                return values.some(
                    (value) =>
                        String(
                            value || ""
                        )
                            .toLowerCase()
                            .includes(
                                searchText
                            )
                );

            }
        );


    // =====================================================
    // MODAL HELPERS
    // =====================================================

// =====================================================
// MODAL HELPERS
// =====================================================

const openAddModalManually = () => {
    setShipment({ ...emptyShipment });
    setShowAddModal(true);
};

const openEditModalManually = () => {
    setShowEditModal(true);
};

const closeAddModal = () => {
    setShowAddModal(false);
};

const closeEditModal = () => {
    setShowEditModal(false);
    setEditId(null);
};

    // =====================================================
    // RENDER
    // =====================================================

    return (

        <main
            className="shipments-page"
            style={{
                minHeight: "100vh",
                background: "#f4f7fb",
            }}
        >

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
                            Shipment Management
                        </h2>

                        <p
                            className="text-muted mb-0"
                            style={{
                                fontSize: "15px",
                            }}
                        >
                            Manage and track all shipments
                            across your fleet.
                        </p>

                    </div>


                    <button
                        type="button"
                        className="btn"
                        onClick={
                            openAddModalManually
                        }
                        style={{
                            background:
                                "#2563eb",
                            color:
                                "white",
                            borderRadius:
                                "10px",
                            padding:
                                "11px 20px",
                            fontWeight:
                                "600",
                            boxShadow:
                                "0 5px 15px rgba(37,99,235,0.25)",
                        }}
                    >

                        <FaPlus className="me-2" />

                        Add Shipment

                    </button>

                </div>


                {/* =================================================
                    STAT CARDS
                ================================================= */}

                <div className="row g-4 mb-4">

                    {/* TOTAL */}

                    <div className="col-lg-3 col-md-6">

                        <div
                            className="card border-0 h-100"
                            style={{
                                borderRadius:
                                    "16px",
                                boxShadow:
                                    "0 6px 20px rgba(15,23,42,0.08)",
                            }}
                        >

                            <div
                                className="card-body d-flex align-items-center"
                            >

                                <div
                                    style={{
                                        width:
                                            "55px",
                                        height:
                                            "55px",
                                        borderRadius:
                                            "14px",
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
                                            "24px",
                                        marginRight:
                                            "15px",
                                    }}
                                >

                                    <FaBoxOpen />

                                </div>

                                <div>

                                    <small className="text-muted">
                                        Total Shipments
                                    </small>

                                    <h3 className="fw-bold mb-0">
                                        {shipments.length}
                                    </h3>

                                </div>

                            </div>

                        </div>

                    </div>


                    {/* PENDING */}

                    <div className="col-lg-3 col-md-6">

                        <div
                            className="card border-0 h-100"
                            style={{
                                borderRadius:
                                    "16px",
                                boxShadow:
                                    "0 6px 20px rgba(15,23,42,0.08)",
                            }}
                        >

                            <div
                                className="card-body d-flex align-items-center"
                            >

                                <div
                                    style={{
                                        width:
                                            "55px",
                                        height:
                                            "55px",
                                        borderRadius:
                                            "14px",
                                        background:
                                            "#fff7ed",
                                        color:
                                            "#f59e0b",
                                        display:
                                            "flex",
                                        alignItems:
                                            "center",
                                        justifyContent:
                                            "center",
                                        fontSize:
                       
                                        "24px",
                                        marginRight:
                                            "15px",
                                    }}
                                >

                                    <FaClock />

                                </div>

                                <div>

                                    <small className="text-muted">
                                        Pending
                                    </small>

                                    <h3 className="fw-bold mb-0">
                                        {pendingCount}
                                    </h3>

                                </div>

                            </div>

                        </div>

                    </div>


                    {/* IN TRANSIT */}

                    <div className="col-lg-3 col-md-6">

                        <div
                            className="card border-0 h-100"
                            style={{
                                borderRadius:
                                    "16px",
                                boxShadow:
                                    "0 6px 20px rgba(15,23,42,0.08)",
                            }}
                        >

                            <div
                                className="card-body d-flex align-items-center"
                            >

                                <div
                                    style={{
                                        width:
                                            "55px",
                                        height:
                                            "55px",
                                        borderRadius:
                                            "14px",
                                        background:
                                            "#dbeafe",
                                        color:
                                            "#2563eb",
                                        display:
                                            "flex",
                                        alignItems:
                                            "center",
                                        justifyContent:
                                            "center",
                                        fontSize:
                                            "24px",
                                        marginRight:
                                            "15px",
                                    }}
                                >

                                    <FaShippingFast />

                                </div>

                                <div>

                                    <small className="text-muted">
                                        In Transit
                                    </small>

                                    <h3 className="fw-bold mb-0">
                                        {transitCount}
                                    </h3>

                                </div>

                            </div>

                        </div>

                    </div>


                    {/* DELIVERED */}

                    <div className="col-lg-3 col-md-6">

                        <div
                            className="card border-0 h-100"
                            style={{
                                borderRadius:
                                    "16px",
                                boxShadow:
                                    "0 6px 20px rgba(15,23,42,0.08)",
                            }}
                        >

                            <div
                                className="card-body d-flex align-items-center"
                            >

                                <div
                                    style={{
                                        width:
                                            "55px",
                                        height:
                                            "55px",
                                        borderRadius:
                                            "14px",
                                        background:
                                            "#dcfce7",
                                        color:
                                            "#10b981",
                                        display:
                                            "flex",
                                        alignItems:
                                            "center",
                                        justifyContent:
                                            "center",
                                        fontSize:
                                            "24px",
                                        marginRight:
                                            "15px",
                                    }}
                                >

                                    <FaCheckCircle />

                                </div>

                                <div>

                                    <small className="text-muted">
                                        Delivered
                                    </small>

                                    <h3 className="fw-bold mb-0">
                                        {deliveredCount}
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
                        borderRadius:
                            "15px",
                        boxShadow:
                            "0 5px 18px rgba(15,23,42,0.07)",
                    }}
                >

                    <div className="card-body">

                        <div
                            className="position-relative"
                            style={{
                                maxWidth:
                                    "500px",
                            }}
                        >

                            <FaSearch
                                style={{
                                    position:
                                        "absolute",
                                    left:
                                        "16px",
                                    top:
                                        "50%",
                                    transform:
                                        "translateY(-50%)",
                                    color:
                                        "#94a3b8",
                                }}
                            />

                            <input
                                type="text"
                                className="form-control"
                                placeholder="Search tracking number, location, vehicle or driver..."
                                value={
                                    search
                                }
                                onChange={
                                    (e) =>
                                        setSearch(
                                            e.target.value
                                        )
                                }
                                style={{
                                    paddingLeft:
                                        "45px",
                                    height:
                                        "48px",
                                    borderRadius:
                                        "10px",
                                    border:
                                        "1px solid #e2e8f0",
                                    boxShadow:
                                        "none",
                                }}
                            />

                        </div>

                    </div>

                </div>


                {/* =================================================
                    SHIPMENT TABLE
                ================================================= */}

                <div
                    className="card border-0"
                    style={{
                        borderRadius:
                            "16px",
                        overflow:
                            "hidden",
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
                                    background:
                                        "#0f172a",
                                    color:
                                        "white",
                                }}
                            >

                                <tr>

                                    <th
                                        style={{
                                            padding:
                                                "17px 20px",
                                        }}
                                    >
                                        Shipment
                                    </th>

                                    <th>
                                        Route
                                    </th>

                                    <th>
                                        Vehicle
                                    </th>

                                    <th>
                                        Driver
                                    </th>

                                    <th>
                                        Weight
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

                                {filteredShipments.length === 0 ? (

                                    <tr>

                                        <td
                                            colSpan="7"
                                            className="text-center py-5 text-muted"
                                        >

                                            <FaBoxOpen
                                                style={{
                                                    fontSize:
                                                        "40px",
                                                    color:
                                                        "#cbd5e1",
                                                    marginBottom:
                                                        "10px",
                                                }}
                                            />

                                            <div>
                                                No shipments found.
                                            </div>

                                        </td>

                                    </tr>

                                ) : (

                                    filteredShipments.map(
                                        (s) => {

                                            const vehicle =
                                                vehicles.find(
                                                    (v) =>
                                                        String(
                                                            v.id
                                                        ) ===
                                                        String(
                                                            s.assigned_vehicle_id
                                                        )
                                                );

                                            const driver =
                                                drivers.find(
                                                    (d) =>
                                                        String(
                                                            d.id
                                                        ) ===
                                                        String(
                                                            s.assigned_driver_id
                                                        )
                                                );

                                            const status =
                                                getStatusStyle(
                                                    s.current_status
                                                );

                                            return (

                                                <tr
                                                    key={
                                                        s.id
                                                    }
                                                >

                                                    {/* SHIPMENT */}

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
                                                                    width:
                                                                        "45px",
                                                                    height:
                                                                        "45px",
                                                                    borderRadius:
                                                                        "12px",
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
                                                                        "19px",
                                                                    marginRight:
                                                                        "12px",
                                                                }}
                                                            >

                                                                <FaBoxOpen />

                                                            </div>

                                                            <div>

                                                                <div
                                                                    className="fw-bold"
                                                                    style={{
                                                                        color:
                                                                            "#172033",
                                                                    }}
                                                                >
                                                                    {
                                                                        s.tracking_number
                                                                    }
                                                                </div>

                                                                <small className="text-muted">
                                                                    Shipment #
                                                                    {
                                                                        s.id
                                                                    }
                                                                </small>

                                                            </div>

                                                        </div>

                                                    </td>


                                                    {/* ROUTE */}

                                                    <td>

                                                        <div
                                                            style={{
                                                                minWidth:
                                                                    "190px",
                                                            }}
                                                        >

                                                            <div
                                                                className="d-flex align-items-center mb-1"
                                                            >

                                                                <FaMapMarkerAlt
                                                                    style={{
                                                                        color:
                                                                            "#10b981",
                                                                        marginRight:
                                                                            "7px",
                                                                    }}
                                                                />

                                                                <span>
                                                                    {
                                                                        s.pickup_location
                                                                    }
                                                                </span>

                                                            </div>

                                                            <div
                                                                style={{
                                                                    borderLeft:
                                                                        "2px solid #dbe3ef",
                                                                    marginLeft:
                                                                        "5px",
                                                                    paddingLeft:
                                                                        "13px",
                                                                    fontSize:
                                                                        "12px",
                                                                    color:
                                                                        "#94a3b8",
                                                                }}
                                                            >
                                                                To
                                                            </div>

                                                            <div
                                                                className="d-flex align-items-center"
                                                            >

                                                                <FaMapMarkerAlt
                                                                    style={{
                                                                        color:
                                                                            "#ef4444",
                                                                        marginRight:
                                                                            "7px",
                                                                    }}
                                                                />

                                                                <span>
                                                                    {
                                                                        s.delivery_location
                                                                    }
                                                                </span>

                                                            </div>

                                                        </div>

                                                    </td>


                                                    {/* VEHICLE */}

                                                    <td>

                                                        <div
                                                            className="d-flex align-items-center"
                                                        >

                                                            <FaTruck
                                                                className="me-2"
                                                                style={{
                                                                    color:
                                                                        "#2563eb",
                                                                }}
                                                            />

                                                            <span>
                                                                {
                                                                    vehicle?.vehicle_number ||
                                                                    "Not Assigned"
                                                                }
                                                            </span>

                                                        </div>

                                                    </td>


                                                    {/* DRIVER */}

                                                    <td>

                                                        {
                                                            driver?.name ||
                                                            "Not Assigned"
                                                        }

                                                    </td>


                                                    {/* WEIGHT */}

                                                    <td>

                                                        <strong>
                                                            {
                                                                s.weight ??
                                                                0
                                                            }{" "}
                                                            Kg
                                                        </strong>

                                                    </td>


                                                    {/* STATUS */}

                                                    <td>

                                                        <span
                                                            style={{
                                                                display:
                                                                    "inline-flex",
                                                                alignItems:
                                                                    "center",
                                                                gap:
                                                                    "7px",
                                                                padding:
                                                                    "7px 12px",
                                                                borderRadius:
                                                                    "20px",
                                                                fontSize:
                                                                    "12px",
                                                                fontWeight:
                                                                    "700",
                                                                background:
                                                                    status.background,
                                                                color:
                                                                    status.color,
                                                                whiteSpace:
                                                                    "nowrap",
                                                            }}
                                                        >

                                                            <span
                                                                style={{
                                                                    width:
                                                                        "7px",
                                                                    height:
                                                                        "7px",
                                                                    borderRadius:
                                                                        "50%",
                                                                    background:
                                                                        status.dot,
                                                                }}
                                                            />

                                                            {
                                                                s.current_status
                                                            }

                                                        </span>

                                                    </td>


                                                    {/* ACTIONS */}

                                                    <td className="text-center">

                                                        <button
                                                            type="button"
                                                            className="btn btn-sm me-2"
                                                            onClick={() =>
                                                                openEditModal(
                                                                    s
                                                                )
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
                                                                    "7px 11px",
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
                                                                deleteShipment(
                                                                    s.id
                                                                )
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
                                                                    "7px 11px",
                                                                fontWeight:
                                                                    "600",
                                                            }}
                                                        >

                                                            <FaTrash className="me-1" />

                                                            Delete

                                                        </button>

                                                    </td>

                                                </tr>

                                            );

                                        }
                                    )

                                )}

                            </tbody>

                        </table>

                    </div>

                </div>

            </div>


            {/* =====================================================
                ADD SHIPMENT MODAL
            ====================================================== */}

            {showAddModal && (
                <div
                    className="shipment-modal-overlay"
                    
                >

                <div className="modal-dialog modal-dialog-centered modal-lg">

                    <div
                        className="modal-content border-0"
                        style={{
                            borderRadius:
                                "16px",
                            overflow:
                                "hidden",
                        }}
                    >

                        <div
                            className="modal-header"
                            style={{
                                background:
                                    "#2563eb",
                                color:
                                    "white",
                            }}
                        >

                            <h5 className="modal-title fw-bold">

                                <FaBoxOpen className="me-2" />

                                Add Shipment

                            </h5>

                            <button
                                type="button"
                                className="btn-close btn-close-white"
                                onClick={
                                    closeAddModal
                                }
                            />

                        </div>


                        <form
                            onSubmit={
                                addShipment
                            }
                        >

                            <div className="modal-body p-4">

                                <div className="row">

                                    {/* TRACKING */}

                                    <div className="col-md-6">

                                        <label className="form-label fw-semibold">
                                            Tracking Number
                                        </label>

                                        <input
                                            className="form-control mb-3"
                                            placeholder="Tracking Number"
                                            name="tracking_number"
                                            value={
                                                shipment.tracking_number
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            required
                                        />

                                    </div>


                                    {/* WEIGHT */}

                                    <div className="col-md-6">

                                        <label className="form-label fw-semibold">
                                            Weight (Kg)
                                        </label>

                                        <input
                                            className="form-control mb-3"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            placeholder="Weight"
                                            name="weight"
                                            value={
                                                shipment.weight
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            required
                                        />

                                    </div>


                                    {/* SENDER */}

                                    <div className="col-md-6">

                                        <label className="form-label fw-semibold">
                                            Sender Name
                                        </label>

                                        <input
                                            className="form-control mb-3"
                                            placeholder="Sender Name"
                                            name="sender_name"
                                            value={
                                                shipment.sender_name
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            required
                                        />

                                    </div>


                                    {/* RECEIVER */}

                                    <div className="col-md-6">

                                        <label className="form-label fw-semibold">
                                            Receiver Name
                                        </label>

                                        <input
                                            className="form-control mb-3"
                                            placeholder="Receiver Name"
                                            name="receiver_name"
                                            value={
                                                shipment.receiver_name
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            required
                                        />

                                    </div>


                                    {/* PICKUP */}

                                    <div className="col-md-6">

                                        <label className="form-label fw-semibold">
                                            Pickup Location
                                        </label>

                                        <input
                                            className="form-control mb-3"
                                            placeholder="Pickup Location"
                                            name="pickup_location"
                                            value={
                                                shipment.pickup_location
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            required
                                        />

                                    </div>


                                    {/* DELIVERY */}

                                    <div className="col-md-6">

                                        <label className="form-label fw-semibold">
                                            Delivery Location
                                        </label>

                                        <input
                                            className="form-control mb-3"
                                            placeholder="Delivery Location"
                                            name="delivery_location"
                                            value={
                                                shipment.delivery_location
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            required
                                        />

                                    </div>


                                    {/* VEHICLE */}

                                    <div className="col-md-6">

                                        <label className="form-label fw-semibold">
                                            Assign Vehicle
                                        </label>

                                        <select
                                            className="form-select mb-3"
                                            name="assigned_vehicle_id"
                                            value={
                                                shipment.assigned_vehicle_id
                                            }
                                            onChange={
                                                handleChange
                                            }
                                        >

                                            <option value="">
                                                Select Vehicle
                                            </option>

                                            {vehicles.map(
                                                (v) => (

                                                    <option
                                                        key={
                                                            v.id
                                                        }
                                                        value={
                                                            v.id
                                                        }
                                                    >
                                                        {
                                                            v.vehicle_number
                                                        }
                                                    </option>

                                                )
                                            )}

                                        </select>

                                    </div>


                                    {/* DRIVER */}

                                    <div className="col-md-6">

                                        <label className="form-label fw-semibold">
                                            Assign Driver
                                        </label>

                                        <select
                                            className="form-select mb-3"
                                            name="assigned_driver_id"
                                            value={
                                                shipment.assigned_driver_id
                                            }
                                            onChange={
                                                handleChange
                                            }
                                        >

                                            <option value="">
                                                Select Driver
                                            </option>

                                            {drivers.map(
                                                (d) => (

                                                    <option
                                                        key={
                                                            d.id
                                                        }
                                                        value={
                                                            d.id
                                                        }
                                                    >
                                                        {
                                                            d.name
                                                        }
                                                    </option>

                                                )
                                            )}

                                        </select>

                                    </div>


                                    {/* STATUS */}

                                    <div className="col-12">

                                        <label className="form-label fw-semibold">
                                            Shipment Status
                                        </label>

                                        <select
                                            className="form-select"
                                            name="current_status"
                                            value={
                                                shipment.current_status
                                            }
                                            onChange={
                                                handleChange
                                            }
                                        >

                                            <option value="Created">
                                                Created
                                            </option>

                                            <option value="Assigned">
                                                Assigned
                                            </option>

                                            <option value="Picked Up">
                                                Picked Up
                                            </option>

                                            <option value="In Transit">
                                                In Transit
                                            </option>

                                            <option value="Out for Delivery">
                                                Out for Delivery
                                            </option>

                                            <option value="Delivered">
                                                Delivered
                                            </option>

                                            <option value="Delayed">
                                                Delayed
                                            </option>

                                            <option value="Cancelled">
                                                Cancelled
                                            </option>

                                        </select>

                                    </div>

                                </div>

                            </div>


                            <div className="modal-footer">

                                <button
                                    type="button"
                                    className="btn btn-light"
                                    onClick={
                                        closeAddModal
                                    }
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    onClick={addShipment}
                                >

                                    <FaPlus className="me-2" />

                                    Save Shipment

                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            </div>
            )}


            {/* =====================================================
                EDIT SHIPMENT MODAL
            ====================================================== */}

            {showEditModal && (
    <div
        className="shipment-modal-overlay"
        
    >

                <div className="modal-dialog modal-dialog-centered modal-lg">

                    <div
                        className="modal-content border-0"
                        style={{
                            borderRadius:
                                "16px",
                            overflow:
                                "hidden",
                        }}
                    >

                        <div
                            className="modal-header"
                            style={{
                                background:
                                    "#0f172a",
                                color:
                                    "white",
                            }}
                        >

                            <h5 className="modal-title fw-bold">

                                <FaEdit className="me-2" />

                                Edit Shipment

                            </h5>

                            <button
                                type="button"
                                className="btn-close btn-close-white"
                                onClick={
                                    closeEditModal
                                }
                            />

                        </div>


                        <form
                            onSubmit={
                                updateShipment
                            }
                        >

                            <div className="modal-body p-4">

                                <div className="row">

                                    {/* TRACKING */}

                                    <div className="col-md-6">

                                        <label className="form-label fw-semibold">
                                            Tracking Number
                                        </label>

                                        <input
                                            className="form-control mb-3"
                                            name="tracking_number"
                                            value={
                                                editShipment.tracking_number ||
                                                ""
                                            }
                                            onChange={
                                                handleEditChange
                                            }
                                            required
                                        />

                                    </div>


                                    {/* WEIGHT */}

                                    <div className="col-md-6">

                                        <label className="form-label fw-semibold">
                                            Weight (Kg)
                                        </label>

                                        <input
                                            className="form-control mb-3"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            name="weight"
                                            value={
                                                editShipment.weight ??
                                                ""
                                            }
                                            onChange={
                                                handleEditChange
                                            }
                                            required
                                        />

                                    </div>


                                    {/* SENDER */}

                                    <div className="col-md-6">

                                        <label className="form-label fw-semibold">
                                            Sender Name
                                        </label>

                                        <input
                                            className="form-control mb-3"
                                            name="sender_name"
                                            value={
                                                editShipment.sender_name ||
                                                ""
                                            }
                                            onChange={
                                                handleEditChange
                                            }
                                            required
                                        />

                                    </div>


                                    {/* RECEIVER */}

                                    <div className="col-md-6">

                                        <label className="form-label fw-semibold">
                                            Receiver Name
                                        </label>

                                        <input
                                            className="form-control mb-3"
                                            name="receiver_name"
                                            value={
                                                editShipment.receiver_name ||
                                                ""
                                            }
                                            onChange={
                                                handleEditChange
                                            }
                                            required
                                        />

                                    </div>


                                    {/* PICKUP */}

                                    <div className="col-md-6">

                                        <label className="form-label fw-semibold">
                                            Pickup Location
                                        </label>

                                        <input
                                            className="form-control mb-3"
                                            name="pickup_location"
                                            value={
                                                editShipment.pickup_location ||
                                                ""
                                            }
                                            onChange={
                                                handleEditChange
                                            }
                                            required
                                        />

                                    </div>


                                    {/* DELIVERY */}

                                    <div className="col-md-6">

                                        <label className="form-label fw-semibold">
                                            Delivery Location
                                        </label>

                                        <input
                                            className="form-control mb-3"
                                            name="delivery_location"
                                            value={
                                                editShipment.delivery_location ||
                                                ""
                                            }
                                            onChange={
                                                handleEditChange
                                            }
                                            required
                                        />

                                    </div>


                                    {/* VEHICLE */}

                                    <div className="col-md-6">

                                        <label className="form-label fw-semibold">
                                            Assign Vehicle
                                        </label>

                                        <select
                                            className="form-select mb-3"
                                            name="assigned_vehicle_id"
                                            value={
                                                editShipment.assigned_vehicle_id ||
                                                ""
                                            }
                                            onChange={
                                                handleEditChange
                                            }
                                        >

                                            <option value="">
                                                Select Vehicle
                                            </option>

                                            {vehicles.map(
                                                (v) => (

                                                    <option
                                                        key={
                                                            v.id
                                                        }
                                                        value={
                                                            v.id
                                                        }
                                                    >
                                                        {
                                                            v.vehicle_number
                                                        }
                                                    </option>

                                                )
                                            )}

                                        </select>

                                    </div>


                                    {/* DRIVER */}

                                    <div className="col-md-6">

                                        <label className="form-label fw-semibold">
                                            Assign Driver
                                        </label>

                                        <select
                                            className="form-select mb-3"
                                            name="assigned_driver_id"
                                            value={
                                                editShipment.assigned_driver_id ||
                                                ""
                                            }
                                            onChange={
                                                handleEditChange
                                            }
                                        >

                                            <option value="">
                                                Select Driver
                                            </option>

                                            {drivers.map(
                                                (d) => (

                                                    <option
                                                        key={
                                                            d.id
                                                        }
                                                        value={
                                                            d.id
                                                        }
                                                    >
                                                        {
                                                            d.name
                                                        }
                                                    </option>

                                                )
                                            )}

                                        </select>

                                    </div>


                                    {/* STATUS */}

                                    <div className="col-12">

                                        <label className="form-label fw-semibold">
                                            Shipment Status
                                        </label>

                                        <select
                                            className="form-select"
                                            name="current_status"
                                            value={
                                                editShipment.current_status ||
                                                "Created"
                                            }
                                            onChange={
                                                handleEditChange
                                            }
                                        >

                                            <option value="Created">
                                                Created
                                            </option>

                                            <option value="Assigned">
                                                Assigned
                                            </option>

                                            <option value="Picked Up">
                                                Picked Up
                                            </option>

                                            <option value="In Transit">
                                                In Transit
                                            </option>

                                            <option value="Out for Delivery">
                                                Out for Delivery
                                            </option>

                                            <option value="Delivered">
                                                Delivered
                                            </option>

                                            <option value="Delayed">
                                                Delayed
                                            </option>

                                            <option value="Cancelled">
                                                Cancelled
                                            </option>

                                        </select>

                                    </div>

                                </div>

                            </div>


                            <div className="modal-footer">

                                <button
                                    type="button"
                                    className="btn btn-light"
                                    onClick={
                                        closeEditModal
                                    }
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="btn btn-success"
                                >

                                    <FaEdit className="me-2" />

                                    Update Shipment

                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            </div>
            )}

        </main>
    );
}

export default Shipments;