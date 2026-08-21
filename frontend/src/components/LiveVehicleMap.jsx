import { useEffect, useState } from "react";
import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    Polyline
} from "react-leaflet";
import L from "leaflet";

import {
    getTracking,
    getRoute,
    updateLocation
} from "../services/tripService";

import "leaflet/dist/leaflet.css";

// Vehicle icon
const vehicleIcon = new L.Icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/3448/3448339.png",
    iconSize: [40, 40]
});

// Destination icon
const destinationIcon = new L.Icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
    iconSize: [35, 35]
});

function LiveVehicleMap({ tripId }) {

    const [current, setCurrent] = useState([0, 0]);
    const [destination, setDestination] = useState([0, 0]);
    const [route, setRoute] = useState([]);

    useEffect(() => {

        loadTracking();

        const interval = setInterval(() => {

            simulateMovement();

        }, 3000);

        return () => clearInterval(interval);

    }, []);

    const loadTracking = async () => {

        try {

            const tracking = await getTracking(tripId);

            const cur = [
                Number(tracking.current_location.latitude),
                Number(tracking.current_location.longitude)
            ];

            const dest = [
                Number(tracking.destination.latitude),
                Number(tracking.destination.longitude)
            ];

            setCurrent(cur);
            setDestination(dest);

            const routeData = await getRoute(tripId);

            if (routeData.polyline) {

                setRoute(routeData.polyline);

            }

        } catch (err) {

            console.log(err);

        }

    };

    const simulateMovement = async () => {

        let lat = current[0];
        let lng = current[1];

        if (
            lat === destination[0] &&
            lng === destination[1]
        ) {
            return;
        }

        if (lat < destination[0]) lat += 0.001;
        if (lat > destination[0]) lat -= 0.001;

        if (lng < destination[1]) lng += 0.001;
        if (lng > destination[1]) lng -= 0.001;

        setCurrent([lat, lng]);

        try {

            await updateLocation(
                tripId,
                lat,
                lng
            );

        } catch (err) {

            console.log(err);

        }

    };

    return (

        <MapContainer
            center={current}
            zoom={12}
            style={{
                height: "600px",
                width: "100%"
            }}
        >

            <TileLayer
                attribution="© OpenStreetMap"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <Marker
                position={current}
                icon={vehicleIcon}
            >
                <Popup>
                    Vehicle
                </Popup>
            </Marker>

            <Marker
                position={destination}
                icon={destinationIcon}
            >
                <Popup>
                    Destination
                </Popup>
            </Marker>

            {

                route.length > 0 &&

                <Polyline
                    positions={route}
                />

            }

        </MapContainer>

    );
}

export default LiveVehicleMap;