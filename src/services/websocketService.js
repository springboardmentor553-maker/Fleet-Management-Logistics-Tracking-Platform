let socket = null;

export const connectWebSocket = (tripId = 1) => {
  if (socket) return socket;

  socket = new WebSocket(`ws://127.0.0.1:8000/ws/tracking/${tripId}`);

  socket.onopen = () => {
    console.log("✅ WebSocket Connected");
  };

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.type === "shipment_status") {
      console.log(
        "Shipment Updated",

        data.tracking_number,

        data.status,
      );
    }

    if (data.type === "shipment_deleted") {
      console.log(
        "Shipment Deleted",

        data.tracking_number,
      );
    }

    if (data.type === "location_update") {
      console.log(data);
    }
  };

  socket.onclose = () => {
    console.log("❌ WebSocket Disconnected");
  };

  socket.onerror = (error) => {
    console.error("WebSocket Error:", error);
  };

  return socket;
};

export const getSocket = () => socket;
