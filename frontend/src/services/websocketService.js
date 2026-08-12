// ==========================================================
// FleetFlow WebSocket Service
// ==========================================================

let socket = null;
let currentTripId = null;

// ==========================================================
// WEBSOCKET BASE URL
// ==========================================================

const WS_BASE_URL = "ws://127.0.0.1:8000";

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

    if (!tripId) {

        console.error(
            "❌ Cannot connect WebSocket: Trip ID is missing."
        );

        return null;
    }

    // ------------------------------------------------------
    // Convert Trip ID to number/string consistently
    // ------------------------------------------------------

    const normalizedTripId = String(tripId);

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

            socket.close();

        } catch (error) {

            console.error(
                "❌ Error closing previous WebSocket:",
                error
            );
        }

        socket = null;
    }

    currentTripId = normalizedTripId;

    // ------------------------------------------------------
    // Create WebSocket URL
    // ------------------------------------------------------

    const websocketUrl =
        `${WS_BASE_URL}/ws/tracking/${normalizedTripId}`;

    console.log(
        `🔌 Connecting WebSocket: ${websocketUrl}`
    );

    // ------------------------------------------------------
    // Create WebSocket
    // ------------------------------------------------------

    socket = new WebSocket(
        websocketUrl
    );

    // ======================================================
    // OPEN
    // ======================================================

    socket.onopen = () => {

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

    socket.onmessage = (event) => {

        try {

            const data = JSON.parse(
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
                data.type === "location_update"
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
                data.type === "trip_completed"
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
            }

            // ------------------------------------------------
            // SIMULATION ERROR
            // ------------------------------------------------

            if (
                data.type === "simulation_error"
            ) {

                console.error(
                    "❌ Simulation error:",
                    data.message
                );
            }

            // ------------------------------------------------
            // Pass data to React component
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

    socket.onclose = (event) => {

        console.log(
            `❌ WebSocket disconnected from Trip ${normalizedTripId}`
        );

        console.log(
            "WebSocket close code:",
            event.code
        );

        console.log(
            "WebSocket close reason:",
            event.reason
        );

        socket = null;
        currentTripId = null;

        if (onClose) {

            onClose(event);
        }
    };

    // ======================================================
    // ERROR
    // ======================================================

    socket.onerror = (error) => {

        console.error(
            "❌ FleetFlow WebSocket Error:",
            error
        );

        if (onError) {

            onError(error);
        }
    };

    return socket;
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
// CHECK WHETHER SOCKET IS CONNECTED
// ==========================================================

export const isWebSocketConnected = () => {

    return (
        socket !== null &&
        socket.readyState === WebSocket.OPEN
    );
};


// ==========================================================
// DISCONNECT WEBSOCKET
// ==========================================================

export const disconnectWebSocket = () => {

    if (socket) {

        console.log(
            `🔌 Disconnecting from Trip ${currentTripId}`
        );

        try {

            socket.close(
                1000,
                "Client disconnected"
            );

        } catch (error) {

            console.error(
                "❌ WebSocket disconnect error:",
                error
            );
        }
    }

    socket = null;
    currentTripId = null;
};


// ==========================================================
// SEND MESSAGE
// ==========================================================

export const sendWebSocketMessage = (
    message
) => {

    if (
        !socket ||
        socket.readyState !== WebSocket.OPEN
    ) {

        console.error(
            "❌ WebSocket is not connected."
        );

        return false;
    }

    try {

        socket.send(
            JSON.stringify(message)
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