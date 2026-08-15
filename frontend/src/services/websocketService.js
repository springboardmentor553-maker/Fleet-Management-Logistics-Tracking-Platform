// ==========================================================
// FleetFlow WebSocket Service
// ==========================================================

let socket = null;

let currentTripId = null;


// ==========================================================
// CONNECTION GENERATION
// ==========================================================

let connectionGeneration = 0;


// ==========================================================
// WEBSOCKET BASE URL
// ==========================================================

const WS_BASE_URL =
    "ws://127.0.0.1:8000";


// ==========================================================
// CONNECT TO TRIP
// ==========================================================

export const connectWebSocket = (
    tripId,
    onMessage = null,
    onOpen = null,
    onClose = null,
    onError = null
) => {

    // ------------------------------------------------------
    // Validate Trip ID
    // ------------------------------------------------------

    if (
        tripId === undefined ||
        tripId === null ||
        tripId === ""
    ) {

        console.error(
            "❌ Cannot connect WebSocket: Trip ID is missing."
        );

        return null;
    }


    const normalizedTripId =
        String(tripId);


    // ------------------------------------------------------
    // Already connected to same trip
    // ------------------------------------------------------

    if (
        socket &&
        socket.readyState === WebSocket.OPEN &&
        currentTripId === normalizedTripId
    ) {

        console.log(
            `ℹ️ Already connected to Trip ${normalizedTripId}`
        );

        return socket;
    }


    // ------------------------------------------------------
    // Close existing socket
    // ------------------------------------------------------

    if (socket) {

        try {

            socket.onopen = null;
            socket.onmessage = null;
            socket.onerror = null;
            socket.onclose = null;


            if (
                socket.readyState ===
                    WebSocket.OPEN ||
                socket.readyState ===
                    WebSocket.CONNECTING
            ) {

                socket.close(
                    1000,
                    "Switching trip"
                );
            }

        } catch (error) {

            console.error(
                "❌ Error closing previous WebSocket:",
                error
            );
        }


        socket = null;
    }


    // ------------------------------------------------------
    // New connection generation
    // ------------------------------------------------------

    connectionGeneration += 1;

    const thisGeneration =
        connectionGeneration;


    currentTripId =
        normalizedTripId;


    // ------------------------------------------------------
    // Create URL
    // ------------------------------------------------------

    const websocketUrl =
        `${WS_BASE_URL}/ws/tracking/${normalizedTripId}`;


    console.log(
        `🔌 Connecting WebSocket: ${websocketUrl}`
    );


    // ------------------------------------------------------
    // Create socket
    // ------------------------------------------------------

    const newSocket =
        new WebSocket(
            websocketUrl
        );


    socket =
        newSocket;


    // ======================================================
    // OPEN
    // ======================================================

    newSocket.onopen = () => {

        // --------------------------------------------------
        // Ignore stale connection
        // --------------------------------------------------

        if (
            thisGeneration !==
            connectionGeneration
        ) {

            try {

                newSocket.close(
                    1000,
                    "Stale connection"
                );

            } catch {
                // Ignore
            }

            return;
        }


        console.log(
            `✅ WebSocket connected to Trip ${normalizedTripId}`
        );


        if (onOpen) {

            onOpen();
        }
    };


    // ======================================================
    // MESSAGE
    // ======================================================

    newSocket.onmessage = (
        event
    ) => {

        try {

            const data =
                JSON.parse(
                    event.data
                );


            console.log(
                "📡 FleetFlow Live Update:",
                data
            );


            // ------------------------------------------------
            // LOCATION UPDATE
            // ------------------------------------------------

            if (
                data.type ===
                "location_update"
            ) {

                console.log(
                    "🚚 Vehicle Location:",
                    data.latitude,
                    data.longitude
                );


                console.log(
                    "📍 Remaining Distance:",
                    data.remaining_distance_km,
                    "km"
                );


                console.log(
                    "⏱️ Remaining ETA:",
                    data.remaining_duration_minutes,
                    "minutes"
                );


                console.log(
                    "📊 Progress:",
                    data.progress,
                    "%"
                );
            }


            // ------------------------------------------------
            // TRIP COMPLETED
            // ------------------------------------------------

            if (
                data.type ===
                "trip_completed"
            ) {

                console.log(
                    `🏁 Trip ${normalizedTripId} completed.`
                );


                console.log(
                    "Final location:",
                    data.latitude,
                    data.longitude
                );


                console.log(
                    "Remaining distance:",
                    data.remaining_distance_km
                );


                console.log(
                    "Remaining ETA:",
                    data.remaining_duration_minutes
                );


                if (onMessage) {

                    onMessage(data);
                }


                return;
            }


            // ------------------------------------------------
            // TRIP UNAVAILABLE
            // ------------------------------------------------

            if (
                data.type ===
                "trip_unavailable"
            ) {

                console.warn(
                    `⚠️ Trip ${normalizedTripId} is no longer available.`
                );


                if (onMessage) {

                    onMessage(data);
                }


                return;
            }


            // ------------------------------------------------
            // SIMULATION ERROR
            // ------------------------------------------------

            if (
                data.type ===
                "simulation_error"
            ) {

                console.error(
                    "❌ Simulation error:",
                    data.message
                );
            }


            // ------------------------------------------------
            // PASS DATA TO REACT
            // ------------------------------------------------

            if (onMessage) {

                onMessage(data);
            }

        } catch (error) {

            console.error(
                "❌ Invalid WebSocket message:",
                error
            );


            console.error(
                "Raw WebSocket message:",
                event.data
            );
        }
    };


    // ======================================================
    // CLOSE
    // ======================================================

    newSocket.onclose = (
        event
    ) => {

        const isCurrentConnection =
            thisGeneration ===
            connectionGeneration;


        // --------------------------------------------------
        // Normal intentional close
        // --------------------------------------------------

        if (
            event.code === 1000
        ) {

            console.log(
                `🔌 WebSocket closed normally for Trip ${normalizedTripId}`
            );

        } else {

            console.warn(
                `⚠️ WebSocket disconnected from Trip ${normalizedTripId}`
            );


            console.warn(
                "WebSocket close code:",
                event.code
            );


            if (event.reason) {

                console.warn(
                    "WebSocket close reason:",
                    event.reason
                );
            }
        }


        // --------------------------------------------------
        // Only clear current socket if this is active
        // --------------------------------------------------

        if (
            isCurrentConnection
        ) {

            socket = null;

            currentTripId = null;
        }


        if (onClose) {

            onClose(event);
        }
    };


    // ======================================================
    // ERROR
    // ======================================================

    newSocket.onerror = (
        error
    ) => {

        console.error(
            "❌ FleetFlow WebSocket Error:",
            error
        );


        if (onError) {

            onError(error);
        }
    };


    return newSocket;
};


// ==========================================================
// GET CURRENT SOCKET
// ==========================================================

export const getSocket = () => {

    return socket;
};


// ==========================================================
// GET CURRENT TRIP ID
// ==========================================================

export const getCurrentTripId = () => {

    return currentTripId;
};


// ==========================================================
// CHECK CONNECTION
// ==========================================================

export const isWebSocketConnected = () => {

    return (
        socket !== null &&
        socket.readyState ===
            WebSocket.OPEN
    );
};


// ==========================================================
// DISCONNECT
// ==========================================================

export const disconnectWebSocket = () => {

    connectionGeneration += 1;


    const socketToClose =
        socket;


    const tripToClose =
        currentTripId;


    socket = null;

    currentTripId = null;


    if (!socketToClose) {

        return;
    }


    console.log(
        `🔌 Disconnecting from Trip ${tripToClose}`
    );


    try {

        socketToClose.onopen = null;
        socketToClose.onmessage = null;
        socketToClose.onerror = null;
        socketToClose.onclose = null;


        if (
            socketToClose.readyState ===
                WebSocket.OPEN ||
            socketToClose.readyState ===
                WebSocket.CONNECTING
        ) {

            socketToClose.close(
                1000,
                "Client disconnected"
            );
        }

    } catch (error) {

        console.error(
            "❌ WebSocket disconnect error:",
            error
        );
    }
};


// ==========================================================
// SEND MESSAGE
// ==========================================================

export const sendWebSocketMessage = (
    message
) => {

    if (
        !socket ||
        socket.readyState !==
            WebSocket.OPEN
    ) {

        console.error(
            "❌ WebSocket is not connected."
        );

        return false;
    }


    try {

        socket.send(
            JSON.stringify(
                message
            )
        );


        return true;

    } catch (error) {

        console.error(
            "❌ Failed to send WebSocket message:",
            error
        );


        return false;
    }
};