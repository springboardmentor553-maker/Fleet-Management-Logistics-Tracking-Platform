import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

import polyline from "@mapbox/polyline";

import {
    MapContainer,
    TileLayer,
    Marker,
    Polyline,
    Popup,
    useMap
} from "react-leaflet";

import "leaflet/dist/leaflet.css";

import L from "leaflet";


// ======================================================
// LEAFLET ICON FIX
// ======================================================

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({

    iconRetinaUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",

    iconUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",

    shadowUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"

});


// ======================================================
// FIT ROUTE
// ======================================================

function FitRoute({
    route,
    vehiclePosition
}) {

    const map = useMap();

    useEffect(() => {

        if (
            !route ||
            route.length === 0
        ) {

            return;
        }

        try {

            const points = [
                ...route
            ];

            if (vehiclePosition) {

                points.push(
                    vehiclePosition
                );

            }

            const bounds =
                L.latLngBounds(
                    points
                );

            map.fitBounds(
                bounds,
                {
                    padding: [
                        60,
                        60
                    ]
                }
            );

        } catch (error) {

            console.error(
                "Fit route error:",
                error
            );

        }

    }, [
        route,
        vehiclePosition,
        map
    ]);

    return null;
}


// ======================================================
// LIVE TRACKING
// ======================================================

export default function LiveTracking() {

    const { id } = useParams();

    const [route, setRoute] =
        useState([]);

    const [vehiclePosition, setVehiclePosition] =
        useState(null);

    const [destinationPosition, setDestinationPosition] =
        useState(null);

    const [pickup, setPickup] =
        useState("");

    const [destination, setDestination] =
        useState("");

    const [distance, setDistance] =
        useState("");

    const [time, setTime] =
        useState("");

    const [status, setStatus] =
        useState("Connecting...");

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");


    // ======================================================
    // LOAD ROUTE
    // ======================================================

    useEffect(() => {

        let cancelled = false;

        const loadRoute = async () => {

            try {

                setLoading(true);

                setError("");

                const token =
                    localStorage.getItem(
                        "token"
                    );

                if (!token) {

                    throw new Error(
                        "Authentication token not found."
                    );

                }

                const url =
                    `http://127.0.0.1:8000/trips/${id}/route`;

                console.log(
                    "================================"
                );

                console.log(
                    "LIVE TRACKING REQUEST"
                );

                console.log(
                    "URL:",
                    url
                );

                console.log(
                    "================================"
                );

                const response =
                    await axios.get(
                        url,
                        {
                            headers: {
                                Authorization:
                                    `Bearer ${token}`
                            }
                        }
                    );

                console.log(
                    "LIVE TRACKING RESPONSE:",
                    response.data
                );

                if (cancelled) {

                    return;
                }

                const data =
                    response.data;

                // =================================================
                // POLYLINE
                // =================================================

                if (!data.polyline) {

                    throw new Error(
                        "Backend did not return a route."
                    );

                }

                const decoded =
                    polyline.decode(
                        data.polyline
                    );

                if (
                    !decoded ||
                    decoded.length === 0
                ) {

                    throw new Error(
                        "Route contains no coordinates."
                    );

                }

                const coordinates =
                    decoded.map(
                        ([lat, lon]) => [
                            Number(lat),
                            Number(lon)
                        ]
                    );

                setRoute(
                    coordinates
                );


                // =================================================
                // CURRENT VEHICLE
                // =================================================

                if (
                    data.current_coordinates
                ) {

                    const latitude =
                        Number(
                            data
                                .current_coordinates
                                .latitude
                        );

                    const longitude =
                        Number(
                            data
                                .current_coordinates
                                .longitude
                        );

                    if (
                        Number.isFinite(
                            latitude
                        ) &&
                        Number.isFinite(
                            longitude
                        )
                    ) {

                        setVehiclePosition([
                            latitude,
                            longitude
                        ]);

                    }

                }


                // =================================================
                // DESTINATION
                // =================================================

                if (
                    data.destination_coordinates
                ) {

                    const latitude =
                        Number(
                            data
                                .destination_coordinates
                                .latitude
                        );

                    const longitude =
                        Number(
                            data
                                .destination_coordinates
                                .longitude
                        );

                    if (
                        Number.isFinite(
                            latitude
                        ) &&
                        Number.isFinite(
                            longitude
                        )
                    ) {

                        setDestinationPosition([
                            latitude,
                            longitude
                        ]);

                    }

                }


                // =================================================
                // INFORMATION
                // =================================================

                setPickup(
                    data.pickup_location ||
                    ""
                );

                setDestination(
                    data.destination ||
                    ""
                );

                setDistance(
                    data.distance ||
                    ""
                );

                setTime(
                    data.estimated_travel_time ||
                    ""
                );

                setStatus(
                    data.status ||
                    "Active"
                );

            } catch (err) {

                console.error(
                    "================================"
                );

                console.error(
                    "LIVE TRACKING ERROR"
                );

                console.error(
                    err
                );

                console.error(
                    "================================"
                );

                if (cancelled) {

                    return;
                }

                if (
                    err.response
                ) {

                    console.error(
                        "Status:",
                        err.response.status
                    );

                    console.error(
                        "Response:",
                        err.response.data
                    );

                    setError(
                        err.response.data?.detail ||
                        "Unable to load route."
                    );

                } else {

                    setError(
                        err.message ||
                        "Unable to load route."
                    );

                }

            } finally {

                if (!cancelled) {

                    setLoading(false);

                }

            }

        };

        if (id) {

            loadRoute();

        }

        return () => {

            cancelled = true;

        };

    }, [id]);


    // ======================================================
    // WEBSOCKET
    // ======================================================

    useEffect(() => {

        if (!id) {

            return;
        }

        const socket =
            new WebSocket(
                `ws://127.0.0.1:8000/ws/tracking/${id}`
            );

        socket.onopen = () => {

            console.log(
                "WebSocket connected"
            );

            setStatus(
                previous =>
                    previous === "Connecting..."
                        ? "Live"
                        : previous
            );

        };

        socket.onmessage = (
            event
        ) => {

            try {

                const data =
                    JSON.parse(
                        event.data
                    );

                console.log(
                    "LIVE VEHICLE UPDATE:",
                    data
                );

                if (
                    data.latitude !== undefined &&
                    data.longitude !== undefined
                ) {

                    const latitude =
                        Number(
                            data.latitude
                        );

                    const longitude =
                        Number(
                            data.longitude
                        );

                    if (
                        Number.isFinite(
                            latitude
                        ) &&
                        Number.isFinite(
                            longitude
                        )
                    ) {

                        setVehiclePosition([
                            latitude,
                            longitude
                        ]);

                    }

                }

                if (
                    data.status
                ) {

                    setStatus(
                        data.status
                    );

                }

            } catch (error) {

                console.error(
                    "WebSocket parse error:",
                    error
                );

            }

        };

        socket.onerror = (
            error
        ) => {

            console.error(
                "WebSocket error:",
                error
            );

            setStatus(
                "Connection error"
            );

        };

        socket.onclose = () => {

            console.log(
                "WebSocket disconnected"
            );

        };

        return () => {

            socket.close();

        };

    }, [id]);


    // ======================================================
    // LOADING
    // ======================================================

    if (loading) {

        return (

            <div
                style={{
                    minHeight:
                        "100vh",
                    display:
                        "flex",
                    alignItems:
                        "center",
                    justifyContent:
                        "center",
                    background:
                        "#f8fafc"
                }}
            >

                <h2>
                    Loading Live Tracking...
                </h2>

            </div>

        );

    }


    // ======================================================
    // ERROR
    // ======================================================

    if (error) {

        return (

            <div
                style={{
                    minHeight:
                        "100vh",
                    display:
                        "flex",
                    justifyContent:
                        "center",
                    alignItems:
                        "center",
                    background:
                        "#f8fafc",
                    padding:
                        "30px"
                }}
            >

                <div
                    style={{
                        background:
                            "white",
                        padding:
                            "30px",
                        borderRadius:
                            "14px",
                        maxWidth:
                            "600px",
                        width:
                            "100%",
                        boxShadow:
                            "0 5px 25px rgba(0,0,0,0.08)"
                    }}
                >

                    <h2>
                        Unable to Load Tracking
                    </h2>

                    <p
                        style={{
                            color:
                                "#dc2626",
                            fontWeight:
                                600
                        }}
                    >
                        {error}
                    </p>

                    <p
                        style={{
                            color:
                                "#64748b"
                        }}
                    >
                        Trip #{id}
                    </p>

                </div>

            </div>

        );

    }


    // ======================================================
    // NO ROUTE
    // ======================================================

    if (
        route.length === 0
    ) {

        return (

            <div
                style={{
                    padding:
                        "50px",
                    textAlign:
                        "center"
                }}
            >

                <h2>
                    No Route Available
                </h2>

            </div>

        );

    }


    // ======================================================
    // MAP CENTER
    // ======================================================

    const mapCenter =
        vehiclePosition ||
        route[0];


    // ======================================================
    // RENDER
    // ======================================================

    return (

        <div
            style={{
                minHeight:
                    "100vh",
                padding:
                    "25px",
                background:
                    "#f8fafc",
                boxSizing:
                    "border-box"
            }}
        >

            <h2
                style={{
                    marginBottom:
                        "5px",
                    color:
                        "#0f172a"
                }}
            >
                Live Vehicle Tracking
            </h2>

            <p
                style={{
                    color:
                        "#64748b"
                }}
            >
                Trip #{id}
            </p>


            {/* =================================================
                INFO
            ================================================= */}

            <div
                style={{
                    display:
                        "grid",
                    gridTemplateColumns:
                        "repeat(auto-fit, minmax(180px, 1fr))",
                    gap:
                        "15px",
                    marginBottom:
                        "20px"
                }}
            >

                <InfoCard
                    title="Pickup"
                    value={pickup}
                />

                <InfoCard
                    title="Destination"
                    value={destination}
                />

                <InfoCard
                    title="Distance"
                    value={distance}
                />

                <InfoCard
                    title="ETA"
                    value={time}
                />

                <InfoCard
                    title="Status"
                    value={status}
                />

            </div>


            {/* =================================================
                MAP
            ================================================= */}

            <div
                style={{
                    width:
                        "100%",
                    height:
                        "650px",
                    borderRadius:
                        "16px",
                    overflow:
                        "hidden",
                    background:
                        "#e2e8f0",
                    boxShadow:
                        "0 5px 25px rgba(15,23,42,0.10)"
                }}
            >

                <MapContainer
                    center={
                        mapCenter
                    }
                    zoom={
                        8
                    }
                    scrollWheelZoom={
                        true
                    }
                    style={{
                        width:
                            "100%",
                        height:
                            "100%"
                    }}
                >

                    <TileLayer
                        attribution="&copy; OpenStreetMap contributors"
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />


                    <FitRoute
                        route={
                            route
                        }
                        vehiclePosition={
                            vehiclePosition
                        }
                    />


                    {/* START */}

                    <Marker
                        position={
                            route[0]
                        }
                    >

                        <Popup>

                            <strong>
                                Pickup
                            </strong>

                            <br />

                            {pickup}

                        </Popup>

                    </Marker>


                    {/* DESTINATION */}

                    <Marker
                        position={
                            destinationPosition ||
                            route[
                                route.length - 1
                            ]
                        }
                    >

                        <Popup>

                            <strong>
                                Destination
                            </strong>

                            <br />

                            {destination}

                        </Popup>

                    </Marker>


                    {/* VEHICLE */}

                    {vehiclePosition && (

                        <Marker
                            position={
                                vehiclePosition
                            }
                        >

                            <Popup>

                                🚚{" "}

                                <strong>
                                    Live Vehicle
                                </strong>

                                <br />

                                Status:
                                {" "}
                                {status}

                            </Popup>

                        </Marker>

                    )}


                    {/* ROUTE */}

                    <Polyline
                        positions={
                            route
                        }
                        pathOptions={{
                            color:
                                "#2563eb",
                            weight:
                                6,
                            opacity:
                                0.85
                        }}
                    />

                </MapContainer>

            </div>

        </div>

    );

}


// ======================================================
// INFO CARD
// ======================================================

function InfoCard({
    title,
    value
}) {

    return (

        <div
            style={{
                background:
                    "white",
                padding:
                    "16px",
                borderRadius:
                    "12px",
                border:
                    "1px solid #e2e8f0"
            }}
        >

            <div
                style={{
                    fontSize:
                        "12px",
                    color:
                        "#64748b",
                    marginBottom:
                        "6px"
                }}
            >
                {title}
            </div>

            <div
                style={{
                    fontSize:
                        "15px",
                    fontWeight:
                        700,
                    color:
                        "#0f172a",
                    wordBreak:
                        "break-word"
                }}
            >
                {value || "-"}
            </div>

        </div>

    );

}