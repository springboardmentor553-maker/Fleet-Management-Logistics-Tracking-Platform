import axios from "axios";


const API = axios.create({

  baseURL:
    "http://127.0.0.1:8000",

  headers: {

    "Content-Type":
      "application/json",

  },

});


// ==========================================================
// GET ALL TRIPS
// ==========================================================

export const getTrips =
  async () => {

    try {

      const response =
        await API.get(
          "/trips/"
        );

      return response.data;

    } catch (error) {

      console.error(
        "Get Trips Error:",
        error
      );

      throw new Error(

        error?.response?.data?.detail ||

        "Unable to load trips."

      );

    }

  };


// ==========================================================
// GET SINGLE TRIP
// ==========================================================

export const getTrip =
  async (tripId) => {

    try {

      const response =
        await API.get(
          `/trips/${tripId}`
        );

      return response.data;

    } catch (error) {

      console.error(
        "Get Trip Error:",
        error
      );

      throw new Error(

        error?.response?.data?.detail ||

        "Unable to load trip."

      );

    }

  };


// ==========================================================
// GET SELECTED TRIP ROUTE
//
// Backend automatically geocodes missing coordinates.
// ==========================================================

export const getTripRoute =
  async (tripId) => {

    try {

      const response =
        await API.get(
          `/map/trip/${tripId}`
        );

      return response.data;

    } catch (error) {

      console.error(
        "Trip Route Error:",
        error
      );

      throw new Error(

        error?.response?.data?.detail ||

        "Unable to generate trip route."

      );

    }

  };


// ==========================================================
// MANUAL GEOCODING
// ==========================================================

export const geocodeLocation =
  async (location) => {

    if (
      !location ||
      !location.trim()
    ) {

      throw new Error(
        "Location cannot be empty."
      );

    }


    try {

      const response =
        await API.post(

          "/map/geocode",

          {

            location:
              location.trim(),

          }

        );


      return response.data;

    } catch (error) {

      console.error(
        "Geocoding Error:",
        error
      );


      throw new Error(

        error?.response?.data?.detail ||

        "Unable to find location."

      );

    }

  };


// ==========================================================
// MANUAL ROUTE
// ==========================================================

export const generateRoute =
  async (

    pickupLatitude,

    pickupLongitude,

    destinationLatitude,

    destinationLongitude

  ) => {

    try {

      const response =
        await API.post(

          "/map/route",

          {

            pickup_latitude:
              Number(
                pickupLatitude
              ),

            pickup_longitude:
              Number(
                pickupLongitude
              ),

            destination_latitude:
              Number(
                destinationLatitude
              ),

            destination_longitude:
              Number(
                destinationLongitude
              ),

          }

        );


      return response.data;

    } catch (error) {

      console.error(
        "Route Error:",
        error
      );


      throw new Error(

        error?.response?.data?.detail ||

        "Unable to generate route."

      );

    }

  };