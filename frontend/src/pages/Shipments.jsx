import { useEffect, useState } from "react";
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

    const [form, setForm] = useState({
        tracking_id: "",
        sender_name: "",
        receiver_name: "",
        origin: "",
        destination: "",
        current_location: "Warehouse",
        status: "Pending"
    });

    const [trackingId, setTrackingId] = useState("");
    const [trackingResult, setTrackingResult] = useState(null);

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
            status: "Pending"
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

    return (

        <Layout>

            <div className="shipment-page">

                <h2>Shipment Management</h2>

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
                        <option>Pending</option>
                        <option>In Transit</option>
                        <option>Delivered</option>
                    </select>

                    <button type="submit">
                        Add Shipment
                    </button>

                </form>

                <div className="tracking-box">

                    <h3>Track Shipment</h3>

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
                                <strong>Status:</strong>{" "}
                                {trackingResult.status}
                            </p>

                        </div>

                    )}

                </div>

                <table>

                    <thead>

                        <tr>

                            <th>ID</th>
                            <th>Tracking ID</th>
                            <th>Sender</th>
                            <th>Receiver</th>
                            <th>Origin</th>
                            <th>Destination</th>
                            <th>Status</th>
                            <th>Action</th>

                        </tr>

                    </thead>

                    <tbody>

                        {shipments.map((shipment) => (

                            <tr key={shipment.id}>

                                <td>{shipment.id}</td>
                                <td>{shipment.tracking_id}</td>
                                <td>{shipment.sender_name}</td>
                                <td>{shipment.receiver_name}</td>
                                <td>{shipment.origin}</td>
                                <td>{shipment.destination}</td>
                                <td>{shipment.status}</td>

                                <td>

                                    <button
                                        className="delete-btn"
                                        onClick={() =>
                                            handleDelete(shipment.id)
                                        }
                                    >
                                        Delete
                                    </button>

                                </td>

                            </tr>

                        ))}

                    </tbody>

                </table>

            </div>

        </Layout>

    );
}

export default Shipments;