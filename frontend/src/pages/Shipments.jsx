import { useEffect, useState } from "react";
import {
    FaBoxOpen,
    FaSearch,
    FaPlus,
    FaTrash,
    FaTruck
} from "react-icons/fa";

import Layout from "../components/Layout";

import {
    getShipments,
    addShipment,
    deleteShipment,
    trackShipment
} from "../services/shipmentService";

import "../styles/shipment.css";

function Shipments() {

    const [shipments, setShipments] = useState([]);
    const [search, setSearch] = useState("");
    const [trackingId, setTrackingId] = useState("");
    const [trackingResult, setTrackingResult] = useState(null);

    const [form, setForm] = useState({
        tracking_id: "",
        sender_name: "",
        receiver_name: "",
        origin: "",
        destination: "",
        current_location: "Warehouse",
        status: "Created"
    });

    useEffect(() => {
        loadShipments();
    }, []);

    const loadShipments = async () => {
        const data = await getShipments();
        setShipments(data);
    };

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        await addShipment(form);

        setForm({
            tracking_id: "",
            sender_name: "",
            receiver_name: "",
            origin: "",
            destination: "",
            current_location: "Warehouse",
            status: "Created"
        });

        loadShipments();
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this shipment?"))
            return;

        await deleteShipment(id);

        loadShipments();
    };

    const handleTrack = async () => {
        try {
            const data = await trackShipment(trackingId);
            setTrackingResult(data);
        } catch {
            alert("Tracking ID not found");
            setTrackingResult(null);
        }
    };

    const filteredShipments = shipments.filter((shipment) =>
        shipment.tracking_id.toLowerCase().includes(search.toLowerCase()) ||
        shipment.sender_name.toLowerCase().includes(search.toLowerCase()) ||
        shipment.receiver_name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <Layout>

            <div className="shipment-page">

                <div className="page-header">
                    <div>
                        <h1>
                            <FaBoxOpen />
                            Shipment Management
                        </h1>
                        <p>
                            Create, monitor and manage shipments
                        </p>
                    </div>
                </div>

                <div className="search-box">
                    <FaSearch />
                    <input
                        placeholder="Search shipment..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <form
                    className="shipment-form"
                    onSubmit={handleSubmit}
                >

                    <input
                        name="tracking_id"
                        placeholder="Tracking ID"
                        value={form.tracking_id}
                        onChange={handleChange}
                        required
                    />

                    <input
                        name="sender_name"
                        placeholder="Sender Name"
                        value={form.sender_name}
                        onChange={handleChange}
                        required
                    />

                    <input
                        name="receiver_name"
                        placeholder="Receiver Name"
                        value={form.receiver_name}
                        onChange={handleChange}
                        required
                    />

                    <input
                        name="origin"
                        placeholder="Origin"
                        value={form.origin}
                        onChange={handleChange}
                        required
                    />

                    <input
                        name="destination"
                        placeholder="Destination"
                        value={form.destination}
                        onChange={handleChange}
                        required
                    />

                    <input
                        name="current_location"
                        placeholder="Current Location"
                        value={form.current_location}
                        onChange={handleChange}
                    />

                    <select
                        name="status"
                        value={form.status}
                        onChange={handleChange}
                    >
                        <option value="Created">Created</option>
                        <option value="Assigned">Assigned</option>
                        <option value="Picked Up">Picked Up</option>
                        <option value="In Transit">In Transit</option>
                        <option value="Delivered">Delivered</option>
                    </select>

                    <button type="submit">
                        <FaPlus />
                        Add Shipment
                    </button>

                </form>

                <div className="tracking-box">

                    <h3>
                        <FaTruck />
                        Track Shipment
                    </h3>

                    <div className="tracking-input">

                        <input
                            placeholder="Enter Tracking ID"
                            value={trackingId}
                            onChange={(e) =>
                                setTrackingId(e.target.value)
                            }
                        />

                        <button onClick={handleTrack}>
                            Track
                        </button>

                    </div>

                    {trackingResult && (

                        <div className="tracking-result">

                            <p>
                                <strong>Tracking ID:</strong>{" "}
                                {trackingResult.tracking_id}
                            </p>

                            <p>
                                <strong>Origin:</strong>{" "}
                                {trackingResult.origin}
                            </p>

                            <p>
                                <strong>Destination:</strong>{" "}
                                {trackingResult.destination}
                            </p>

                            <p>
                                <strong>Current Location:</strong>{" "}
                                {trackingResult.current_location}
                            </p>

                            <p>
                                <strong>Status:</strong>{" "}
                                <span
                                    className={`status ${trackingResult.status.replace(/\s/g, "")}`}
                                >
                                    {trackingResult.status}
                                </span>
                            </p>

                        </div>

                    )}

                </div>

                <div className="table-container">

                    <table>

                        <thead>

                            <tr>
                                <th>ID</th>
                                <th>Tracking</th>
                                <th>Sender</th>
                                <th>Receiver</th>
                                <th>Origin</th>
                                <th>Destination</th>
                                <th>Current Location</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>

                        </thead>

                        <tbody>

                            {filteredShipments.map((shipment) => (

                                <tr key={shipment.id}>

                                    <td>{shipment.id}</td>

                                    <td>{shipment.tracking_id}</td>

                                    <td>{shipment.sender_name}</td>

                                    <td>{shipment.receiver_name}</td>

                                    <td>{shipment.origin}</td>

                                    <td>{shipment.destination}</td>

                                    <td>{shipment.current_location}</td>

                                    <td>

                                        <span
                                            className={`status ${shipment.status.replace(/\s/g, "")}`}
                                        >
                                            {shipment.status}
                                        </span>

                                    </td>

                                    <td>

                                        <button
                                            className="delete-btn"
                                            onClick={() =>
                                                handleDelete(shipment.id)
                                            }
                                        >
                                            <FaTrash />
                                        </button>

                                    </td>

                                </tr>

                            ))}

                        </tbody>

                    </table>

                </div>

            </div>

        </Layout>
    );
}

export default Shipments;