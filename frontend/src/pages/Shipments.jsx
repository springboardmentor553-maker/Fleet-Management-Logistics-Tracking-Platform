import { useEffect, useMemo, useState } from "react";

import api from "../services/api";

import ShipmentForm from "../components/Shipment/ShipmentForm";
import ShipmentSearch from "../components/Shipment/ShipmentSearch";
import ShipmentTable from "../components/Shipment/ShipmentTable";

import "../components/Shipment/Shipment.css";


function Shipments() {

    // ==========================================================
    // STATE
    // ==========================================================

    const [shipments, setShipments] = useState([]);

    const [selectedShipment, setSelectedShipment] =
        useState(null);

    const [search, setSearch] =
        useState("");

    const [loading, setLoading] =
        useState(true);


    // ==========================================================
    // FETCH SHIPMENTS
    // ==========================================================

    const fetchShipments = async () => {

        try {

            setLoading(true);


            const response =
                await api.get(
                    "/shipments"
                );


            const data =
                Array.isArray(response.data)
                    ? response.data
                    : [];


            setShipments(
                data
            );


        } catch (error) {

            console.error(
                "Error fetching shipments:",
                error
            );


            setShipments([]);


            alert(
                "Failed to load shipments."
            );


        } finally {

            setLoading(false);

        }

    };


    // ==========================================================
    // INITIAL LOAD
    // ==========================================================

    useEffect(() => {

        fetchShipments();

    }, []);


    // ==========================================================
    // EDIT
    // ==========================================================

    const handleEdit = (
        shipment
    ) => {

        if (!shipment) {

            return;

        }


        setSelectedShipment(
            shipment
        );


        window.scrollTo({

            top: 0,

            behavior: "smooth",

        });

    };


    // ==========================================================
    // CANCEL EDIT
    // ==========================================================

    const handleCancelEdit = () => {

        setSelectedShipment(
            null
        );

    };


    // ==========================================================
    // DELETE
    // ==========================================================

    const handleDelete = async (
        shipmentOrId
    ) => {

        // ------------------------------------------------------
        // GET ID
        // ------------------------------------------------------

        let shipmentId;

        let shipment;


        if (
            typeof shipmentOrId === "object" &&
            shipmentOrId !== null
        ) {

            shipment =
                shipmentOrId;


            shipmentId =
                shipmentOrId.id;


        } else {

            shipmentId =
                shipmentOrId;


            shipment =
                shipments.find(
                    (item) =>
                        String(item.id) ===
                        String(shipmentId)
                );

        }


        // ------------------------------------------------------
        // VALIDATE ID
        // ------------------------------------------------------

        if (
            shipmentId === undefined ||
            shipmentId === null ||
            shipmentId === ""
        ) {

            alert(
                "Unable to delete shipment because the shipment ID is missing."
            );


            return;

        }


        // ------------------------------------------------------
        // TRACKING NUMBER
        // ------------------------------------------------------

        const trackingNumber =
            shipment?.tracking_number ||
            `Shipment #${shipmentId}`;


        // ------------------------------------------------------
        // CONFIRMATION
        // ------------------------------------------------------

        const confirmed =
            window.confirm(
                `Are you sure you want to delete ${trackingNumber}?`
            );


        if (!confirmed) {

            return;

        }


        // ------------------------------------------------------
        // DELETE REQUEST
        // ------------------------------------------------------

        try {

            await api.delete(
                `/shipments/${shipmentId}`
            );


            // --------------------------------------------------
            // REMOVE FROM FRONTEND IMMEDIATELY
            // --------------------------------------------------

            setShipments(
                (previous) =>
                    previous.filter(
                        (item) =>
                            String(item.id) !==
                            String(shipmentId)
                    )
            );


            // --------------------------------------------------
            // CLOSE EDIT FORM IF NEEDED
            // --------------------------------------------------

            if (
                selectedShipment &&
                String(
                    selectedShipment.id
                ) ===
                    String(shipmentId)
            ) {

                setSelectedShipment(
                    null
                );

            }


            alert(
                "Shipment deleted successfully."
            );


            // --------------------------------------------------
            // REFRESH DATA
            // --------------------------------------------------

            await fetchShipments();


        } catch (error) {

            console.error(
                "Delete shipment error:",
                error
            );


            // ==================================================
            // GET REAL BACKEND ERROR
            // ==================================================

            const responseData =
                error?.response?.data;


            const detail =
                responseData?.detail;


            if (
                Array.isArray(detail)
            ) {

                alert(
                    detail
                        .map(
                            (item) =>
                                item?.msg ||
                                String(item)
                        )
                        .join("\n")
                );


            } else if (
                detail
            ) {

                alert(
                    String(detail)
                );


            } else {

                alert(
                    "Unable to delete shipment."
                );

            }

        }

    };


    // ==========================================================
    // SEARCH
    // ==========================================================

    const filteredShipments =
        useMemo(() => {

            const value =
                search
                    .trim()
                    .toLowerCase();


            if (!value) {

                return shipments;

            }


            return shipments.filter(
                (shipment) => {

                    const tracking =
                        String(
                            shipment.tracking_number ||
                            ""
                        ).toLowerCase();


                    const sender =
                        String(
                            shipment.sender_name ||
                            ""
                        ).toLowerCase();


                    const receiver =
                        String(
                            shipment.receiver_name ||
                            ""
                        ).toLowerCase();


                    const pickup =
                        String(
                            shipment.pickup_location ||
                            ""
                        ).toLowerCase();


                    const destination =
                        String(
                            shipment.destination ||
                            shipment.delivery_location ||
                            ""
                        ).toLowerCase();


                    const status =
                        String(
                            shipment.status ||
                            shipment.current_status ||
                            ""
                        ).toLowerCase();


                    return (

                        tracking.includes(
                            value
                        ) ||

                        sender.includes(
                            value
                        ) ||

                        receiver.includes(
                            value
                        ) ||

                        pickup.includes(
                            value
                        ) ||

                        destination.includes(
                            value
                        ) ||

                        status.includes(
                            value
                        )

                    );

                }
            );

        }, [
            shipments,
            search
        ]);


    // ==========================================================
    // FORM SUCCESS
    // ==========================================================

    const handleFormSuccess =
        async () => {

            setSelectedShipment(
                null
            );


            await fetchShipments();

        };


    // ==========================================================
    // JSX
    // ==========================================================

    return (

        <div className="shipment-page">


            {/* ==================================================
                HEADER
            ================================================== */}

            <div className="shipment-header">

                <div>

                    <h1>
                        Shipment Management
                    </h1>


                    <p>
                        Manage all shipments in your
                        logistics platform.
                    </p>

                </div>

            </div>


            {/* ==================================================
                SEARCH
            ================================================== */}

            <ShipmentSearch

                search={
                    search
                }

                setSearch={
                    setSearch
                }

            />


            {/* ==================================================
                FORM
            ================================================== */}

            <ShipmentForm

                shipment={
                    selectedShipment
                }

                onSuccess={
                    handleFormSuccess
                }

                onCancel={
                    handleCancelEdit
                }

            />


            {/* ==================================================
                TABLE
            ================================================== */}

            {loading ? (

                <div className="loading">

                    Loading Shipments...

                </div>

            ) : (

                <ShipmentTable

                    shipments={
                        filteredShipments
                    }

                    onEdit={
                        handleEdit
                    }

                    onDelete={
                        handleDelete
                    }

                />

            )}

        </div>

    );

}


export default Shipments;