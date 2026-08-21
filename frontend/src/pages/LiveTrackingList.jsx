import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import {
    FaMapMarkerAlt,
    FaTruck,
    FaArrowRight,
    FaSyncAlt
} from "react-icons/fa";


export default function LiveTrackingList() {

    const navigate =
        useNavigate();

    const [trips, setTrips] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");


    const loadTrips = async () => {

        try {

            setLoading(true);

            setError("");

            const token =
                localStorage.getItem(
                    "token"
                );

            if (!token) {

                navigate(
                    "/",
                    {
                        replace: true
                    }
                );

                return;
            }

            const response =
                await axios.get(
                    "http://127.0.0.1:8000/trips/",
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );

            console.log(
                "TRACKING TRIPS:",
                response.data
            );

            if (
                Array.isArray(
                    response.data
                )
            ) {

                setTrips(
                    response.data
                );

            } else {

                setTrips(
                    response.data?.trips ||
                    response.data?.data ||
                    []
                );

            }

        } catch (err) {

            console.error(
                "TRACKING LIST ERROR:",
                err
            );

            if (
                err.response?.status === 401
            ) {

                localStorage.clear();

                navigate(
                    "/",
                    {
                        replace: true
                    }
                );

                return;
            }

            setError(
                err.response?.data?.detail ||
                "Unable to load trips."
            );

        } finally {

            setLoading(false);

        }

    };


    useEffect(() => {

        loadTrips();

    }, []);


    const openTracking = (
        tripId
    ) => {

        navigate(
            `/tracking/${tripId}`
        );

    };


    if (loading) {

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
                    Loading trips...
                </h2>

            </div>

        );

    }


    return (

        <div
            style={{
                minHeight:
                    "100vh",
                padding:
                    "30px",
                background:
                    "#f8fafc"
            }}
        >

            <div
                style={{
                    display:
                        "flex",
                    justifyContent:
                        "space-between",
                    alignItems:
                        "center",
                    marginBottom:
                        "30px"
                }}
            >

                <div>

                    <h1
                        style={{
                            margin:
                                0,
                            color:
                                "#0f172a"
                        }}
                    >
                        <FaMapMarkerAlt />
                        {" "}
                        Live Tracking
                    </h1>

                    <p
                        style={{
                            color:
                                "#64748b"
                        }}
                    >
                        Select a trip to view live
                        vehicle tracking.
                    </p>

                </div>


                <button
                    onClick={
                        loadTrips
                    }
                    style={{
                        padding:
                            "10px 16px",
                        border:
                            "1px solid #dbe2ea",
                        borderRadius:
                            "8px",
                        background:
                            "white",
                        cursor:
                            "pointer",
                        fontWeight:
                            600
                    }}
                >

                    <FaSyncAlt />
                    {" "}
                    Refresh

                </button>

            </div>


            {error && (

                <div
                    style={{
                        padding:
                            "15px",
                        background:
                            "#fef2f2",
                        color:
                            "#b91c1c",
                        borderRadius:
                            "10px",
                        marginBottom:
                            "20px"
                    }}
                >
                    {error}
                </div>

            )}


            {trips.length === 0 && (

                <div
                    style={{
                        background:
                            "white",
                        padding:
                            "50px",
                        textAlign:
                            "center",
                        borderRadius:
                            "12px"
                    }}
                >

                    <h2>
                        No trips available
                    </h2>

                    <p>
                        Create a trip first.
                    </p>

                </div>

            )}


            <div
                style={{
                    display:
                        "grid",
                    gridTemplateColumns:
                        "repeat(auto-fill, minmax(300px, 1fr))",
                    gap:
                        "20px"
                }}
            >

                {trips.map(
                    trip => {

                        const tripId =
                            trip.id;

                        const pickup =
                            trip.start_location ||
                            "Not specified";

                        const destination =
                            trip.end_location ||
                            "Not specified";

                        const vehicle =
                            trip.vehicle_number ||
                            trip.vehicle?.vehicle_number ||
                            `Vehicle #${trip.vehicle_id}`;

                        const status =
                            trip.status ||
                            "Scheduled";

                        return (

                            <div
                                key={
                                    tripId
                                }
                                style={{
                                    background:
                                        "white",
                                    padding:
                                        "22px",
                                    borderRadius:
                                        "14px",
                                    border:
                                        "1px solid #e2e8f0",
                                    boxShadow:
                                        "0 3px 12px rgba(0,0,0,0.05)"
                                }}
                            >

                                <div
                                    style={{
                                        display:
                                            "flex",
                                        justifyContent:
                                            "space-between",
                                        marginBottom:
                                            "20px"
                                    }}
                                >

                                    <div>

                                        <strong>
                                            <FaTruck />
                                            {" "}
                                            {vehicle}
                                        </strong>

                                        <div
                                            style={{
                                                color:
                                                    "#64748b",
                                                fontSize:
                                                    "13px"
                                            }}
                                        >
                                            Trip #{tripId}
                                        </div>

                                    </div>

                                    <span>
                                        {status}
                                    </span>

                                </div>


                                <p>

                                    <FaMapMarkerAlt />

                                    {" "}

                                    <strong>
                                        Pickup:
                                    </strong>

                                    {" "}

                                    {pickup}

                                </p>


                                <p>

                                    <FaMapMarkerAlt />

                                    {" "}

                                    <strong>
                                        Destination:
                                    </strong>

                                    {" "}

                                    {destination}

                                </p>


                                <button
                                    onClick={() =>
                                        openTracking(
                                            tripId
                                        )
                                    }
                                    style={{
                                        width:
                                            "100%",
                                        padding:
                                            "12px",
                                        border:
                                            "none",
                                        borderRadius:
                                            "8px",
                                        background:
                                            "#2563eb",
                                        color:
                                            "white",
                                        fontWeight:
                                            700,
                                        cursor:
                                            "pointer"
                                    }}
                                >

                                    <FaMapMarkerAlt />

                                    {" "}

                                    View Live Tracking

                                    {" "}

                                    <FaArrowRight />

                                </button>

                            </div>

                        );

                    }
                )}

            </div>

        </div>

    );

}