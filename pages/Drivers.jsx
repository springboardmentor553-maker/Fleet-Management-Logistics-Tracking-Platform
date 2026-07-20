import { useEffect, useState } from "react";

import DriverForm from "../components/Driver/DriverForm";
import DriverSearch from "../components/Driver/DriverSearch";
import DriverTable from "../components/Driver/DriverTable";

import api from "../services/api";

import "../components/Driver/Driver.css";

function Drivers() {

    const [drivers, setDrivers] = useState([]);

    const [selectedDriver, setSelectedDriver] = useState(null);

    const [search, setSearch] = useState("");

    useEffect(() => {

        fetchDrivers();

    }, []);

    const fetchDrivers = async () => {

        try {

            const response = await api.get("/drivers");

            setDrivers(response.data);

        }

        catch (error) {

            console.error(error);

        }

    };

    const handleDelete = async (id) => {

        const confirmDelete = window.confirm(

            "Are you sure you want to delete this driver?"

        );

        if (!confirmDelete) return;

        try {

            await api.delete(`/drivers/${id}`);

            alert("Driver Deleted Successfully");

            fetchDrivers();

        }

        catch (error) {

            console.error(error);

            alert("Unable to delete driver");

        }

    };

    const filteredDrivers = drivers.filter((driver) =>

        driver.name.toLowerCase().includes(search.toLowerCase()) ||

        driver.license_number.toLowerCase().includes(search.toLowerCase()) ||

        driver.phone.toLowerCase().includes(search.toLowerCase())

    );

    return (

        <div className="driver-page">

            <div className="driver-header">

                <div>

                    <h1>Driver Management</h1>

                    <p>

                        Manage all drivers in your fleet.

                    </p>

                </div>

            </div>

            <DriverSearch

                search={search}

                setSearch={setSearch}

            />

            <DriverForm

                selectedDriver={selectedDriver}

                fetchDrivers={fetchDrivers}

            />

            <DriverTable

                drivers={filteredDrivers}

                onEdit={setSelectedDriver}

                onDelete={handleDelete}

            />

        </div>

    );

}

export default Drivers;