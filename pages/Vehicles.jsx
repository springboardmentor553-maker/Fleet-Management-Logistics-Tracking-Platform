import { useEffect, useState } from "react";


import VehicleForm from "../components/Vehicle/VehicleForm";
import VehicleSearch from "../components/Vehicle/VehicleSearch";
import VehicleTable from "../components/Vehicle/VehicleTable";

import api from "../services/api";

import "../components/Vehicle/Vehicle.css";

function Vehicles() {

    const [vehicles, setVehicles] = useState([]);

    const [search, setSearch] = useState("");

    const [selectedVehicle, setSelectedVehicle] = useState(null);

    useEffect(() => {

        fetchVehicles();

    }, []);

    const fetchVehicles = async () => {

        try {

            const response = await api.get("/vehicles");

            setVehicles(response.data);

        }

        catch (error) {

            console.log(error);

        }

    };

    const handleDelete = async (id) => {

        const confirmDelete = window.confirm(
            "Are you sure you want to delete this vehicle?"
        );

        if (!confirmDelete) return;

        try {

            await api.delete(`/vehicles/${id}`);

            alert("Vehicle Deleted Successfully");

            fetchVehicles();

        }

        catch (error) {

            console.log(error);

            alert("Unable to delete vehicle.");

        }

    };

    const filteredVehicles = vehicles.filter((vehicle) =>

        vehicle.vehicle_number
            .toLowerCase()
            .includes(search.toLowerCase())

    );

    return (



                <div className="vehicle-page">

                    <div className="vehicle-header">

                        <h1>Vehicle Management</h1>

                    </div>

                    <VehicleSearch

                        search={search}

                        setSearch={setSearch}

                    />

                    <VehicleForm

                        selectedVehicle={selectedVehicle}

                        fetchVehicles={fetchVehicles}

                    />

                    <VehicleTable

                        vehicles={filteredVehicles}

                        onEdit={setSelectedVehicle}

                        onDelete={handleDelete}

                    />

                </div>

    );

}

export default Vehicles;