import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup
} from "react-leaflet";

import "leaflet/dist/leaflet.css";


function RouteMap({route}) {

  const center = [
    17.3850,
    78.4867
  ];


  return (

    <MapContainer
      center={center}
      zoom={6}
      style={{
        height:"500px",
        width:"100%"
      }}
    >

      <TileLayer

        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"

        attribution='&copy; OpenStreetMap contributors'

      />


      {
        route.length > 0 &&
        <Polyline
          positions={route}
        />
      }


      {
        route.length > 0 &&
        <>
        <Marker position={route[0]}>
          <Popup>
            Starting Point
          </Popup>
        </Marker>


        <Marker position={route[route.length-1]}>
          <Popup>
            Destination
          </Popup>
        </Marker>

        </>
      }


    </MapContainer>

  )
}


export default RouteMap;
