import { useState } from "react";
import Navbar from "../components/Navbar";
import {
  geocode,
  generateRoute,
} from "../services/mapService";
import MapView from "./MapView";

function RoutePlanner() {
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [routeData, setRouteData] = useState(null);

  async function findRoute() {
    try {
      const start = await geocode(source);
      const end = await geocode(destination);

      const result = await generateRoute(start, end);

      setRouteData(result);
    } catch (error) {
      console.error("Route generation failed:", error);
      alert("Unable to generate route.");
    }
  }

  return (
    <>
      <Navbar />

      <div
        className="container mt-4"
        style={{
          marginLeft: "270px",
          padding: "20px",
        }}
      >
        <div className="card shadow">
          <div className="card-header bg-primary text-white">
            <h3 className="mb-0">🗺️ Route Generation</h3>
          </div>

          <div className="card-body">
            <div className="row mb-3">
              <div className="col-md-5">
                <label className="form-label">Source</label>

                <input
                  className="form-control"
                  placeholder="Enter Source"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                />
              </div>

              <div className="col-md-5">
                <label className="form-label">
                  Destination
                </label>

                <input
                  className="form-control"
                  placeholder="Enter Destination"
                  value={destination}
                  onChange={(e) =>
                    setDestination(e.target.value)
                  }
                />
              </div>

              <div className="col-md-2 d-flex align-items-end">
                <button
                  className="btn btn-success w-100"
                  onClick={findRoute}
                >
                  Generate
                </button>
              </div>
            </div>

            {routeData && (
              <div className="alert alert-info">
                <h5>Route Information</h5>

                <p>
                  <strong>Distance:</strong>{" "}
                  {routeData.distance} km
                </p>

                <p>
                  <strong>Estimated Time:</strong>{" "}
                  {routeData.duration} minutes
                </p>
              </div>
            )}

            <div
              className="card mt-3"
              style={{ height: "500px" }}
            >
              <div className="card-header bg-secondary text-white">
                Route Map
              </div>

              <div className="card-body">
                <MapView
                  route={routeData?.coordinates || []}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default RoutePlanner;