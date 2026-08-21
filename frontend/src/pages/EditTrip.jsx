import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import api from "../api/api";
import { toast } from "react-toastify";


function EditTrip() {

  // =====================================================
  // ROUTER
  // =====================================================

  const { id } =
    useParams();

  const navigate =
    useNavigate();


  // =====================================================
  // INITIAL TRIP
  // =====================================================

  const initialTrip = {

    shipment_id: "",

    driver_id: "",

    vehicle_id: "",

    pickup_location: "",

    destination: "",

    pickup_latitude: "",

    pickup_longitude: "",

    destination_latitude: "",

    destination_longitude: "",

    scheduled_start_time: "",

    scheduled_end_time: "",

    trip_status: "Scheduled",

  };


  // =====================================================
  // STATES
  // =====================================================

  const [trip, setTrip] =
    useState(initialTrip);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);


  // =====================================================
  // FETCH TRIP
  // =====================================================

  useEffect(() => {

    if (!id) {

      toast.error(
        "Trip ID is missing"
      );

      navigate("/trips");

      return;

    }


    fetchTrip();

  }, [id]);


  const fetchTrip = async () => {

    try {

      setLoading(true);


      const response =
        await api.get(
          `/trips/${id}`
        );


      console.log(
        "Trip Response:",
        response.data
      );


      const data =
        response.data;


      // Keep only the fields required
      // by this form.

      setTrip({

        shipment_id:
          data.shipment_id ??
          "",

        driver_id:
          data.driver_id ??
          "",

        vehicle_id:
          data.vehicle_id ??
          "",

        pickup_location:
          data.pickup_location ??
          "",

        destination:
          data.destination ??
          "",

        pickup_latitude:
          data.pickup_latitude ??
          "",

        pickup_longitude:
          data.pickup_longitude ??
          "",

        destination_latitude:
          data.destination_latitude ??
          "",

        destination_longitude:
          data.destination_longitude ??
          "",

        scheduled_start_time:
          formatDateTimeLocal(
            data.scheduled_start_time
          ),

        scheduled_end_time:
          formatDateTimeLocal(
            data.scheduled_end_time
          ),

        trip_status:
          data.trip_status ??
          "Scheduled",

      });


    } catch (error) {

      console.error(
        "Fetch Trip Error:",
        error
      );


      toast.error(
        error.response?.data?.detail ||
        "Unable to load trip."
      );

    } finally {

      setLoading(false);

    }

  };


  // =====================================================
  // DATETIME FORMATTER
  // =====================================================

  const formatDateTimeLocal = (
    value
  ) => {

    if (!value) {
      return "";
    }


    try {

      const date =
        new Date(value);


      if (
        Number.isNaN(
          date.getTime()
        )
      ) {

        return value
          .toString()
          .slice(0, 16);

      }


      const year =
        date.getFullYear();


      const month =
        String(
          date.getMonth() + 1
        ).padStart(2, "0");


      const day =
        String(
          date.getDate()
        ).padStart(2, "0");


      const hours =
        String(
          date.getHours()
        ).padStart(2, "0");


      const minutes =
        String(
          date.getMinutes()
        ).padStart(2, "0");


      return `${year}-${month}-${day}T${hours}:${minutes}`;

    } catch {

      return "";

    }

  };


  // =====================================================
  // HANDLE CHANGE
  // =====================================================

  const handleChange = (
    e
  ) => {

    const {
      name,
      value,
    } = e.target;


    setTrip(
      (previous) => ({

        ...previous,

        [name]:
          value,

      })
    );

  };


  // =====================================================
  // UPDATE TRIP
  // =====================================================

  const updateTrip = async (
    e
  ) => {

    e.preventDefault();


    // Basic validation

    if (
      !trip.pickup_location.trim()
    ) {

      toast.error(
        "Pickup location is required"
      );

      return;

    }


    if (
      !trip.destination.trim()
    ) {

      toast.error(
        "Destination is required"
      );

      return;

    }


    try {

      setSaving(true);


      // =================================================
      // BUILD UPDATE PAYLOAD
      // =================================================

      const payload = {

        shipment_id:
          trip.shipment_id
            ? Number(
                trip.shipment_id
              )
            : null,

        driver_id:
          trip.driver_id
            ? Number(
                trip.driver_id
              )
            : null,

        vehicle_id:
          trip.vehicle_id
            ? Number(
                trip.vehicle_id
              )
            : null,

        pickup_location:
          trip.pickup_location.trim(),

        destination:
          trip.destination.trim(),

        pickup_latitude:
          trip.pickup_latitude !== ""
            ? Number(
                trip.pickup_latitude
              )
            : null,

        pickup_longitude:
          trip.pickup_longitude !== ""
            ? Number(
                trip.pickup_longitude
              )
            : null,

        destination_latitude:
          trip.destination_latitude !== ""
            ? Number(
                trip.destination_latitude
              )
            : null,

        destination_longitude:
          trip.destination_longitude !== ""
            ? Number(
                trip.destination_longitude
              )
            : null,

        scheduled_start_time:
          trip.scheduled_start_time ||
          null,

        scheduled_end_time:
          trip.scheduled_end_time ||
          null,

        trip_status:
          trip.trip_status,

      };


      console.log(
        "Update Trip Payload:",
        payload
      );


      // =================================================
      // API
      // =================================================

      await api.put(
        `/trips/${id}`,
        payload
      );


      toast.success(
        "Trip updated successfully."
      );


      // =================================================
      // GO BACK TO TRIPS
      // =================================================

      navigate(
        "/trips",
        {
          replace: true,
        }
      );


    } catch (error) {

      console.error(
        "Update Trip Error:",
        error
      );


      toast.error(
        error.response?.data?.detail ||
        "Unable to update trip."
      );


    } finally {

      setSaving(false);

    }

  };


  // =====================================================
  // CANCEL
  // =====================================================

  const cancelEdit = () => {

    navigate(
      "/trips"
    );

  };


  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {

    return (

      <div
        className="container-fluid d-flex align-items-center justify-content-center"
        style={{
          minHeight:
            "70vh",
        }}
      >

        <div
          className="text-center"
        >

          <div
            className="spinner-border text-primary mb-3"
            role="status"
          />

          <div
            className="text-muted"
          >
            Loading trip...
          </div>

        </div>

      </div>

    );

  }


  // =====================================================
  // PAGE
  // =====================================================

  return (

    <div
      className="container-fluid"
      style={{
        padding:
          "30px",
      }}
    >


      {/* =================================================
          HEADER
      ================================================= */}

      <div
        className="d-flex justify-content-between align-items-center mb-4"
      >

        <div>

          <h2
            className="fw-bold mb-1"
            style={{
              color:
                "#172033",
            }}
          >
            ✏️ Edit Trip
          </h2>


          <p
            className="text-muted mb-0"
          >
            Update trip details and schedule.
          </p>

        </div>


        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={
            cancelEdit
          }
        >
          ← Back to Trips
        </button>

      </div>


      {/* =================================================
          FORM CARD
      ================================================= */}

      <div
        className="card border-0"
        style={{
          borderRadius:
            "16px",

          boxShadow:
            "0 6px 22px rgba(15,23,42,0.08)",
        }}
      >

        <div
          className="card-body p-4"
        >

          <form
            onSubmit={
              updateTrip
            }
          >


            {/* =================================================
                BASIC INFORMATION
            ================================================= */}

            <h5
              className="fw-bold mb-3"
            >
              Trip Information
            </h5>


            <div
              className="row"
            >


              {/* SHIPMENT ID */}

              <div
                className="col-md-4 mb-3"
              >

                <label
                  className="form-label fw-semibold"
                >
                  Shipment ID
                </label>


                <input
                  type="number"
                  className="form-control"
                  name="shipment_id"
                  value={
                    trip.shipment_id
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Shipment ID"
                />

              </div>


              {/* DRIVER ID */}

              <div
                className="col-md-4 mb-3"
              >

                <label
                  className="form-label fw-semibold"
                >
                  Driver ID
                </label>


                <input
                  type="number"
                  className="form-control"
                  name="driver_id"
                  value={
                    trip.driver_id
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Driver ID"
                />

              </div>


              {/* VEHICLE ID */}

              <div
                className="col-md-4 mb-3"
              >

                <label
                  className="form-label fw-semibold"
                >
                  Vehicle ID
                </label>


                <input
                  type="number"
                  className="form-control"
                  name="vehicle_id"
                  value={
                    trip.vehicle_id
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Vehicle ID"
                />

              </div>


              {/* PICKUP */}

              <div
                className="col-md-6 mb-3"
              >

                <label
                  className="form-label fw-semibold"
                >
                  Pickup Location
                </label>


                <input
                  type="text"
                  className="form-control"
                  name="pickup_location"
                  value={
                    trip.pickup_location
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Enter pickup location"
                  required
                />

              </div>


              {/* DESTINATION */}

              <div
                className="col-md-6 mb-3"
              >

                <label
                  className="form-label fw-semibold"
                >
                  Destination
                </label>


                <input
                  type="text"
                  className="form-control"
                  name="destination"
                  value={
                    trip.destination
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Enter destination"
                  required
                />

              </div>

            </div>


            {/* =================================================
                COORDINATES
            ================================================= */}

            <h5
              className="fw-bold mt-3 mb-3"
            >
              Location Coordinates
            </h5>


            <div
              className="row"
            >


              {/* PICKUP LATITUDE */}

              <div
                className="col-md-6 mb-3"
              >

                <label
                  className="form-label fw-semibold"
                >
                  Pickup Latitude
                </label>


                <input
                  type="number"
                  step="any"
                  className="form-control"
                  name="pickup_latitude"
                  value={
                    trip.pickup_latitude
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Example: 17.6868"
                />

              </div>


              {/* PICKUP LONGITUDE */}

              <div
                className="col-md-6 mb-3"
              >

                <label
                  className="form-label fw-semibold"
                >
                  Pickup Longitude
                </label>


                <input
                  type="number"
                  step="any"
                  className="form-control"
                  name="pickup_longitude"
                  value={
                    trip.pickup_longitude
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Example: 83.2185"
                />

              </div>


              {/* DESTINATION LATITUDE */}

              <div
                className="col-md-6 mb-3"
              >

                <label
                  className="form-label fw-semibold"
                >
                  Destination Latitude
                </label>


                <input
                  type="number"
                  step="any"
                  className="form-control"
                  name="destination_latitude"
                  value={
                    trip.destination_latitude
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Example: 17.3850"
                />

              </div>


              {/* DESTINATION LONGITUDE */}

              <div
                className="col-md-6 mb-3"
              >

                <label
                  className="form-label fw-semibold"
                >
                  Destination Longitude
                </label>


                <input
                  type="number"
                  step="any"
                  className="form-control"
                  name="destination_longitude"
                  value={
                    trip.destination_longitude
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Example: 78.4867"
                />

              </div>

            </div>


            {/* =================================================
                SCHEDULE
            ================================================= */}

            <h5
              className="fw-bold mt-3 mb-3"
            >
              Trip Schedule
            </h5>


            <div
              className="row"
            >


              {/* START */}

              <div
                className="col-md-6 mb-3"
              >

                <label
                  className="form-label fw-semibold"
                >
                  Scheduled Start
                </label>


                <input
                  type="datetime-local"
                  className="form-control"
                  name="scheduled_start_time"
                  value={
                    trip.scheduled_start_time
                  }
                  onChange={
                    handleChange
                  }
                />

              </div>


              {/* END */}

              <div
                className="col-md-6 mb-3"
              >

                <label
                  className="form-label fw-semibold"
                >
                  Scheduled End
                </label>


                <input
                  type="datetime-local"
                  className="form-control"
                  name="scheduled_end_time"
                  value={
                    trip.scheduled_end_time
                  }
                  onChange={
                    handleChange
                  }
                />

              </div>


              {/* STATUS */}

              <div
                className="col-md-6 mb-3"
              >

                <label
                  className="form-label fw-semibold"
                >
                  Trip Status
                </label>


                <select
                  className="form-select"
                  name="trip_status"
                  value={
                    trip.trip_status
                  }
                  onChange={
                    handleChange
                  }
                >

                  <option value="Scheduled">
                    Scheduled
                  </option>

                  <option value="Started">
                    Started
                  </option>

                  <option value="In Transit">
                    In Transit
                  </option>

                  <option value="Completed">
                    Completed
                  </option>

                </select>

              </div>

            </div>


            {/* =================================================
                BUTTONS
            ================================================= */}

            <div
              className="mt-4 pt-3 border-top"
            >

              <button
                type="submit"
                className="btn btn-success me-2"
                disabled={
                  saving
                }
              >

                {saving ? (

                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                    />

                    Updating...

                  </>

                ) : (

                  <>
                    ✓ Update Trip
                  </>

                )}

              </button>


              <button
                type="button"
                className="btn btn-secondary"
                onClick={
                  cancelEdit
                }
                disabled={
                  saving
                }
              >
                Cancel
              </button>

            </div>

          </form>

        </div>

      </div>

    </div>

  );

}


export default EditTrip;