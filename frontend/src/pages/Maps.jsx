import Layout from "../components/Layout";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const truckIcon = new L.Icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/3448/3448339.png",
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -35]
});

function Maps() {

    const vehiclePosition = [12.9141, 74.8560];

    return (
        <Layout>
            <div style={{ padding: "20px" }}>

                <h2>FleetFlow Live Map</h2>

                <MapContainer
                    center={vehiclePosition}
                    zoom={13}
                    style={{
                        height: "600px",
                        width: "100%",
                        borderRadius: "10px"
                    }}
                >

                    <TileLayer
                        attribution="© OpenStreetMap contributors"
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    <Marker
                        position={vehiclePosition}
                        icon={truckIcon}
                    >
                        <Popup>
                            🚚 Vehicle KA-19 AB-1234
                            <br />
                            Driver: John
                            <br />
                            Status: On Trip
                        </Popup>
                    </Marker>

                </MapContainer>

            </div>
        </Layout>
    );
}

export default Maps;