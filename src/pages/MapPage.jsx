import GoogleMapComponent from "../components/Maps/GoogleMap";
import "../components/Maps/Map.css";

function MapPage() {
  return (
    <div className="map-page">

      <div className="map-card">

        <h2 className="map-title">
          FleetFlow Live Map
        </h2>

        <GoogleMapComponent />

      </div>

    </div>
  );
}

export default MapPage;