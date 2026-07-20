import { useEffect, useState } from "react";

import api from "../services/api";

import TripForm from "../components/Trips/TripForm";
import TripTable from "../components/Trips/TripTable";

import "../components/Trips/Trip.css";

function Trips() {

    const [trips, setTrips] = useState([]);

    const [selectedTrip, setSelectedTrip] = useState(null);

    useEffect(() => {

        fetchTrips();

    }, []);

    const fetchTrips = async () => {

        try {

            const response = await api.get("/trips");

            setTrips(response.data);

        }

        catch (error) {

            console.log(error);

        }

    };

    const handleEdit = (trip) => {

        setSelectedTrip(trip);

        window.scrollTo({

            top: 0,

            behavior: "smooth"

        });

    };

    const handleDelete = async (id) => {

        const confirmDelete = window.confirm(

            "Are you sure you want to delete this Trip?"

        );

        if (!confirmDelete) return;

        try {

            await api.delete(`/trips/${id}`);

            fetchTrips();

        }

        catch (error) {

            console.log(error);

            alert("Unable to delete Trip.");

        }

    };

    return (

        <div className="trip-page">

            <TripForm

                selectedTrip={selectedTrip}

                fetchTrips={fetchTrips}

                setSelectedTrip={setSelectedTrip}

            />

            <TripTable

                trips={trips}

                onEdit={handleEdit}

                onDelete={handleDelete}

            />

        </div>

    );

}

export default Trips;