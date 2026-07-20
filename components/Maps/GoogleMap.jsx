import {
  GoogleMap,
  LoadScript,
  Marker,
} from "@react-google-maps/api";

import "./Map.css";

const center = {
  lat: 18.5204,
  lng: 73.8567,
};

function GoogleMapComponent() {
  return (
    <LoadScript
      googleMapsApiKey={
        import.meta.env.VITE_GOOGLE_MAPS_API_KEY
      }
    >
      <GoogleMap
        mapContainerClassName="google-map"
        center={center}
        zoom={12}
      >
        <Marker position={center} />
      </GoogleMap>
    </LoadScript>
  );
}

export default GoogleMapComponent;