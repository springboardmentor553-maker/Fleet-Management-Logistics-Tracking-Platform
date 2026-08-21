import { useEffect, useState } from "react";

import Layout from "../components/Layout";

import {
    FaGasPump,
    FaSearch,
    FaPlus,
    FaMoneyBillWave,
    FaTrash,
    FaTint,
    FaChartBar
} from "react-icons/fa";

import {
    getAllFuel,
    addFuel,
    deleteFuel,
    getFuelAnalytics,
    getVehicleFuelAnalytics
} from "../services/fuelService";

import "../styles/fuel.css";


function Fuel() {

    // =====================================================
    // STATES
    // =====================================================

    const [fuelRecords, setFuelRecords] = useState([]);

    const [search, setSearch] = useState("");

    const [vehicleId, setVehicleId] = useState("");

    const [analytics, setAnalytics] = useState({

        total_cost: 0,

        total_liters: 0,

        total_records: 0,

        average_bill: 0
    });

    const [vehicleAnalytics, setVehicleAnalytics] =
        useState(null);


    const [form, setForm] = useState({

        vehicle_id: "",

        fuel_date: "",

        liters: "",

        cost: "",

        odometer: "",

        fuel_station: ""
    });


    const [loading, setLoading] = useState(false);


    // =====================================================
    // LOAD DATA WHEN PAGE OPENS
    // =====================================================

    useEffect(() => {

        loadFuel();

        loadAnalytics();

    }, []);


    // =====================================================
    // LOAD ALL FUEL RECORDS
    // =====================================================

    const loadFuel = async () => {

        try {

            const data = await getAllFuel();

            setFuelRecords(data);

        } catch (error) {

            console.error(
                "Failed to load fuel records:",
                error
            );

        }
    };


    // =====================================================
    // LOAD OVERALL ANALYTICS
    // =====================================================

    const loadAnalytics = async () => {

        try {

            const data = await getFuelAnalytics();

            setAnalytics({

                total_cost:
                    Number(data.total_fuel_cost) || 0,

                total_liters:
                    Number(data.total_fuel_consumed) || 0,

                total_records:
                    Number(data.total_records) || 0,

                average_bill:
                    Number(data.average_fuel_bill) || 0
            });

        } catch (error) {

            console.error(
                "Failed to load fuel analytics:",
                error
            );

        }
    };


    // =====================================================
    // INPUT CHANGE
    // =====================================================

    const handleChange = (e) => {

        setForm({

            ...form,

            [e.target.name]:
                e.target.value
        });
    };


    // =====================================================
    // ADD FUEL RECORD
    // =====================================================

    const handleSubmit = async (e) => {

        e.preventDefault();

        setLoading(true);

        try {

            // -------------------------------------------------
            // VALIDATION
            // -------------------------------------------------

            if (!form.vehicle_id) {

                alert("Please enter Vehicle ID");

                return;
            }

            if (!form.fuel_date) {

                alert("Please select fuel date");

                return;
            }

            if (!form.liters || Number(form.liters) <= 0) {

                alert("Please enter valid liters");

                return;
            }

            if (!form.cost || Number(form.cost) <= 0) {

                alert("Please enter valid cost");

                return;
            }

            if (!form.odometer || Number(form.odometer) < 0) {

                alert("Please enter valid odometer");

                return;
            }

            if (!form.fuel_station.trim()) {

                alert("Please enter fuel station");

                return;
            }


            // -------------------------------------------------
            // SEND TO BACKEND
            // -------------------------------------------------

            await addFuel({

                vehicle_id:
                    Number(form.vehicle_id),

                fuel_date:
                    form.fuel_date,

                liters:
                    Number(form.liters),

                cost:
                    Number(form.cost),

                odometer:
                    Number(form.odometer),

                fuel_station:
                    form.fuel_station.trim()
            });


            // -------------------------------------------------
            // SUCCESS
            // -------------------------------------------------

            alert(
                "Fuel Record Added Successfully"
            );


            // -------------------------------------------------
            // CLEAR FORM
            // -------------------------------------------------

            setForm({

                vehicle_id: "",

                fuel_date: "",

                liters: "",

                cost: "",

                odometer: "",

                fuel_station: ""
            });


            // -------------------------------------------------
            // REFRESH DATA
            // -------------------------------------------------

            await loadFuel();

            await loadAnalytics();


        } catch (error) {

            console.error(
                "Failed to add fuel:",
                error
            );


            const message =
                error.response?.data?.detail ||
                "Failed to Add Fuel Record";


            alert(message);

        } finally {

            setLoading(false);
        }
    };


    // =====================================================
    // DELETE FUEL RECORD
    // =====================================================

    const handleDelete = async (id) => {

        const confirmed = window.confirm(
            "Are you sure you want to delete this fuel record?"
        );

        if (!confirmed) {

            return;
        }


        try {

            await deleteFuel(id);

            alert(
                "Fuel Record Deleted Successfully"
            );


            await loadFuel();

            await loadAnalytics();


        } catch (error) {

            console.error(
                "Failed to delete fuel record:",
                error
            );


            alert(
                error.response?.data?.detail ||
                "Failed to delete fuel record"
            );
        }
    };


    // =====================================================
    // VEHICLE ANALYTICS
    // =====================================================

    const loadVehicleAnalytics = async () => {

        if (!vehicleId) {

            alert(
                "Please enter Vehicle ID"
            );

            return;
        }


        try {

            const data =
                await getVehicleFuelAnalytics(
                    Number(vehicleId)
                );


            setVehicleAnalytics(data);


        } catch (error) {

            console.error(
                "Vehicle analytics error:",
                error
            );


            alert(
                error.response?.data?.detail ||
                "Failed to load vehicle analytics"
            );


            setVehicleAnalytics(null);
        }
    };


    // =====================================================
    // SEARCH
    // =====================================================

    const filteredFuel = fuelRecords.filter(
        (fuel) => {

            const station =
                fuel.fuel_station
                    ?.toLowerCase() || "";

            const vehicle =
                fuel.vehicle_id
                    ?.toString() || "";

            const searchText =
                search.toLowerCase();


            return (
                station.includes(searchText) ||
                vehicle.includes(searchText)
            );
        }
    );


    // =====================================================
    // RETURN UI
    // =====================================================

    return (

        <Layout>

            <div className="fuel-page">


                {/* =================================================
                    HEADER
                ================================================= */}

                <div className="page-header">

                    <div>

                        <h1>

                            <FaGasPump />

                            Fuel Management

                        </h1>

                        <p>

                            Monitor fuel usage and
                            vehicle expenses

                        </p>

                    </div>

                </div>


                {/* =================================================
                    SUMMARY CARDS
                ================================================= */}

                <div className="summary-grid">


                    {/* TOTAL COST */}

                    <div className="summary-card">

                        <FaMoneyBillWave />

                        <h3>
                            Total Fuel Cost
                        </h3>

                        <h2>

                            ₹{" "}

                            {analytics.total_cost
                                .toLocaleString("en-IN")}

                        </h2>

                    </div>


                    {/* TOTAL LITERS */}

                    <div className="summary-card">

                        <FaTint />

                        <h3>
                            Total Fuel Used
                        </h3>

                        <h2>

                            {analytics.total_liters}

                            {" "}L

                        </h2>

                    </div>


                    {/* TOTAL RECORDS */}

                    <div className="summary-card">

                        <FaGasPump />

                        <h3>
                            Total Records
                        </h3>

                        <h2>

                            {analytics.total_records}

                        </h2>

                    </div>


                </div>


                {/* =================================================
                    SEARCH
                ================================================= */}

                <div className="search-box">

                    <FaSearch />

                    <input

                        type="text"

                        placeholder={
                            "Search Vehicle ID or Fuel Station..."
                        }

                        value={search}

                        onChange={(e) =>
                            setSearch(
                                e.target.value
                            )
                        }

                    />

                </div>


                {/* =================================================
                    ADD FUEL FORM
                ================================================= */}

                <form

                    className="fuel-form"

                    onSubmit={handleSubmit}

                >


                    <input

                        type="number"

                        name="vehicle_id"

                        placeholder="Vehicle ID"

                        value={
                            form.vehicle_id
                        }

                        onChange={
                            handleChange
                        }

                        required

                    />


                    <input

                        type="date"

                        name="fuel_date"

                        value={
                            form.fuel_date
                        }

                        onChange={
                            handleChange
                        }

                        required

                    />


                    <input

                        type="number"

                        name="liters"

                        placeholder="Liters"

                        min="0"

                        step="0.01"

                        value={
                            form.liters
                        }

                        onChange={
                            handleChange
                        }

                        required

                    />


                    <input

                        type="number"

                        name="cost"

                        placeholder="Cost"

                        min="0"

                        step="0.01"

                        value={
                            form.cost
                        }

                        onChange={
                            handleChange
                        }

                        required

                    />


                    <input

                        type="number"

                        name="odometer"

                        placeholder="Odometer"

                        min="0"

                        value={
                            form.odometer
                        }

                        onChange={
                            handleChange
                        }

                        required

                    />


                    <input

                        type="text"

                        name="fuel_station"

                        placeholder="Fuel Station"

                        value={
                            form.fuel_station
                        }

                        onChange={
                            handleChange
                        }

                        required

                    />


                    <button

                        type="submit"

                        disabled={loading}

                    >

                        <FaPlus />

                        {loading
                            ? "Adding..."
                            : "Add Fuel Record"}

                    </button>


                </form>


                {/* =================================================
                    VEHICLE ANALYTICS
                ================================================= */}

                <div className="analytics-box">

                    <h3>

                        <FaChartBar />

                        Vehicle Fuel Analytics

                    </h3>


                    <div className="analytics-input">

                        <input

                            type="number"

                            placeholder="Enter Vehicle ID"

                            value={vehicleId}

                            onChange={(e) =>
                                setVehicleId(
                                    e.target.value
                                )
                            }

                        />


                        <button
                            onClick={
                                loadVehicleAnalytics
                            }
                        >

                            Get Analytics

                        </button>

                    </div>


                    {/* VEHICLE RESULT */}

                    {vehicleAnalytics && (

                        <div className="vehicle-analytics-result">


                            <div>

                                <strong>
                                    Vehicle ID
                                </strong>

                                <span>
                                    {
                                        vehicleAnalytics.vehicle_id
                                    }
                                </span>

                            </div>


                            <div>

                                <strong>
                                    Total Records
                                </strong>

                                <span>
                                    {
                                        vehicleAnalytics.total_records
                                    }
                                </span>

                            </div>


                            <div>

                                <strong>
                                    Total Liters
                                </strong>

                                <span>
                                    {
                                        vehicleAnalytics.total_liters
                                    } L
                                </span>

                            </div>


                            <div>

                                <strong>
                                    Total Cost
                                </strong>

                                <span>
                                    ₹{" "}
                                    {
                                        Number(
                                            vehicleAnalytics.total_cost
                                        ).toLocaleString(
                                            "en-IN"
                                        )
                                    }
                                </span>

                            </div>


                            <div>

                                <strong>
                                    Average Bill
                                </strong>

                                <span>
                                    ₹{" "}
                                    {
                                        Number(
                                            vehicleAnalytics.average_bill
                                        ).toLocaleString(
                                            "en-IN"
                                        )
                                    }
                                </span>

                            </div>


                        </div>

                    )}

                </div>


                {/* =================================================
                    FUEL TABLE
                ================================================= */}

                <div className="table-container">

                    <table>

                        <thead>

                            <tr>

                                <th>
                                    ID
                                </th>

                                <th>
                                    Vehicle
                                </th>

                                <th>
                                    Date
                                </th>

                                <th>
                                    Liters
                                </th>

                                <th>
                                    Cost
                                </th>

                                <th>
                                    Odometer
                                </th>

                                <th>
                                    Fuel Station
                                </th>

                                <th>
                                    Action
                                </th>

                            </tr>

                        </thead>


                        <tbody>


                            {filteredFuel.length === 0 ? (

                                <tr>

                                    <td
                                        colSpan="8"
                                    >

                                        No Fuel Records Found

                                    </td>

                                </tr>

                            ) : (

                                filteredFuel.map(
                                    (fuel) => (

                                        <tr
                                            key={fuel.id}
                                        >


                                            <td>
                                                {fuel.id}
                                            </td>


                                            <td>
                                                {fuel.vehicle_id}
                                            </td>


                                            <td>
                                                {fuel.fuel_date}
                                            </td>


                                            <td>

                                                <span
                                                    className="liters"
                                                >

                                                    {fuel.liters}
                                                    {" "}L

                                                </span>

                                            </td>


                                            <td>

                                                <span
                                                    className="price"
                                                >

                                                    ₹{" "}

                                                    {Number(
                                                        fuel.cost
                                                    ).toLocaleString(
                                                        "en-IN"
                                                    )}

                                                </span>

                                            </td>


                                            <td>
                                                {fuel.odometer}
                                            </td>


                                            <td>
                                                {fuel.fuel_station}
                                            </td>


                                            <td>

                                                <button

                                                    type="button"

                                                    className="delete-btn"

                                                    onClick={() =>
                                                        handleDelete(
                                                            fuel.id
                                                        )
                                                    }

                                                >

                                                    <FaTrash />

                                                </button>

                                            </td>


                                        </tr>

                                    )
                                )

                            )}

                        </tbody>

                    </table>

                </div>


            </div>

        </Layout>
    );
}


export default Fuel;