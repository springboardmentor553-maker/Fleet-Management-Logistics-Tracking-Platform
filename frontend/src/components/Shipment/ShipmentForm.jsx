import { useEffect, useState } from "react";

import api from "../../services/api";

import {
    shipmentStatuses,
    SHIPMENT_STATUS,
    normalizeShipmentStatus,
} from "../../constants/shipmentStatus";

import "./Shipment.css";


function ShipmentForm({
    shipment,
    onSuccess,
    onCancel,
}) {

    // ==========================================================
    // FORM STATE
    // ==========================================================

    const [formData, setFormData] = useState({

        tracking_number: "",

        sender_name: "",

        receiver_name: "",

        pickup_location: "",

        delivery_location: "",

        weight: "",

        current_status:
            SHIPMENT_STATUS.CREATED,

    });


    const [loading, setLoading] =
        useState(false);


    const [error, setError] =
        useState("");


    // ==========================================================
    // LOAD SHIPMENT FOR EDIT
    // ==========================================================

    useEffect(() => {

        if (shipment) {

            setFormData({

                tracking_number:
                    shipment.tracking_number || "",

                sender_name:
                    shipment.sender_name || "",

                receiver_name:
                    shipment.receiver_name || "",

                pickup_location:
                    shipment.pickup_location || "",

                delivery_location:
                    shipment.delivery_location ||
                    shipment.destination ||
                    "",

                weight:
                    shipment.weight ?? "",

                current_status:
                    normalizeShipmentStatus(
                        shipment.current_status ||
                        shipment.status
                    ),

            });

        } else {

            resetForm();

        }

    }, [shipment]);


    // ==========================================================
    // RESET
    // ==========================================================

    const resetForm = () => {

        setFormData({

            tracking_number: "",

            sender_name: "",

            receiver_name: "",

            pickup_location: "",

            delivery_location: "",

            weight: "",

            current_status:
                SHIPMENT_STATUS.CREATED,

        });

        setError("");

    };


    // ==========================================================
    // INPUT CHANGE
    // ==========================================================

    const handleChange = (event) => {

        const {
            name,
            value,
        } = event.target;


        setFormData(
            (previous) => ({

                ...previous,

                [name]: value,

            })
        );


        setError("");

    };


    // ==========================================================
    // VALIDATION
    // ==========================================================

    const validateForm = () => {

        if (
            !formData.sender_name.trim()
        ) {

            return "Sender name is required.";

        }


        if (
            !formData.receiver_name.trim()
        ) {

            return "Receiver name is required.";

        }


        if (
            !formData.pickup_location.trim()
        ) {

            return "Pickup location is required.";

        }


        if (
            !formData.delivery_location.trim()
        ) {

            return "Delivery location is required.";

        }


        if (
            formData.weight === "" ||
            formData.weight === null ||
            formData.weight === undefined
        ) {

            return "Weight is required.";

        }


        const weight =
            Number(formData.weight);


        if (
            Number.isNaN(weight)
        ) {

            return "Weight must be a valid number.";

        }


        if (
            weight <= 0
        ) {

            return "Weight must be greater than 0.";

        }


        return "";

    };


    // ==========================================================
    // SUBMIT
    // ==========================================================

    const handleSubmit = async (
        event
    ) => {

        event.preventDefault();

        setError("");


        const validationError =
            validateForm();


        if (validationError) {

            setError(
                validationError
            );

            return;

        }


        setLoading(true);


        try {

            // --------------------------------------------------
            // PAYLOAD
            // --------------------------------------------------

            const payload = {

                sender_name:
                    formData.sender_name.trim(),

                receiver_name:
                    formData.receiver_name.trim(),

                pickup_location:
                    formData.pickup_location.trim(),

                delivery_location:
                    formData.delivery_location.trim(),

                current_status:
                    normalizeShipmentStatus(
                        formData.current_status
                    ),

                weight:
                    Number(formData.weight),

            };


            console.log(
                "Sending shipment:",
                payload
            );


            // --------------------------------------------------
            // CREATE
            // --------------------------------------------------

            if (!shipment) {

                const response =
                    await api.post(
                        "/shipments/",
                        payload
                    );


                console.log(
                    "Shipment created:",
                    response.data
                );


                alert(
                    `Shipment ${response.data.tracking_number} created successfully.`
                );

            }


            // --------------------------------------------------
            // UPDATE
            // --------------------------------------------------

            else {

                const response =
                    await api.put(
                        `/shipments/${shipment.id}`,
                        payload
                    );


                console.log(
                    "Shipment updated:",
                    response.data
                );


                alert(
                    "Shipment updated successfully."
                );

            }


            // --------------------------------------------------
            // REFRESH LIST
            // --------------------------------------------------

            if (onSuccess) {

                await onSuccess();

            }


            // --------------------------------------------------
            // RESET CREATE FORM
            // --------------------------------------------------

            if (!shipment) {

                resetForm();

            }

        }

        catch (err) {

            console.error(
                "Shipment save error:",
                err
            );


            const detail =
                err?.response?.data?.detail;


            let message =
                "Unable to save shipment.";


            if (
                Array.isArray(detail)
            ) {

                message =
                    detail
                        .map(
                            (item) =>
                                item?.msg ||
                                String(item)
                        )
                        .join(", ");

            }

            else if (
                detail
            ) {

                message =
                    String(detail);

            }

            else if (
                err?.response?.data?.message
            ) {

                message =
                    String(
                        err.response.data.message
                    );

            }


            setError(message);

        }

        finally {

            setLoading(false);

        }

    };


    // ==========================================================
    // CANCEL
    // ==========================================================

    const handleCancel = () => {

        resetForm();

        if (onCancel) {

            onCancel();

        }

    };


    // ==========================================================
    // JSX
    // ==========================================================

    return (

        <div className="shipment-form-card">

            <h2>

                {shipment
                    ? "Edit Shipment"
                    : "Add New Shipment"}

            </h2>


            {error && (

                <div
                    className="shipment-form-error"
                    role="alert"
                >

                    {error}

                </div>

            )}


            <form
                className="shipment-form"
                onSubmit={handleSubmit}
            >

                {/* ==================================================
                    TRACKING NUMBER
                ================================================== */}

                {shipment && (

                    <div className="form-group">

                        <label>
                            Tracking Number
                        </label>

                        <input
                            type="text"
                            value={
                                formData.tracking_number
                            }
                            disabled
                            readOnly
                        />

                    </div>

                )}


                {/* ==================================================
                    SENDER
                ================================================== */}

                <div className="form-group">

                    <label>
                        Sender Name
                    </label>

                    <input
                        type="text"
                        name="sender_name"
                        placeholder="Enter sender name"
                        value={
                            formData.sender_name
                        }
                        onChange={
                            handleChange
                        }
                        required
                    />

                </div>


                {/* ==================================================
                    RECEIVER
                ================================================== */}

                <div className="form-group">

                    <label>
                        Receiver Name
                    </label>

                    <input
                        type="text"
                        name="receiver_name"
                        placeholder="Enter receiver name"
                        value={
                            formData.receiver_name
                        }
                        onChange={
                            handleChange
                        }
                        required
                    />

                </div>


                {/* ==================================================
                    PICKUP
                ================================================== */}

                <div className="form-group">

                    <label>
                        Pickup Location
                    </label>

                    <input
                        type="text"
                        name="pickup_location"
                        placeholder="Enter pickup location"
                        value={
                            formData.pickup_location
                        }
                        onChange={
                            handleChange
                        }
                        required
                    />

                </div>


                {/* ==================================================
                    DELIVERY
                ================================================== */}

                <div className="form-group">

                    <label>
                        Delivery Location
                    </label>

                    <input
                        type="text"
                        name="delivery_location"
                        placeholder="Enter delivery location"
                        value={
                            formData.delivery_location
                        }
                        onChange={
                            handleChange
                        }
                        required
                    />

                </div>


                {/* ==================================================
                    WEIGHT
                ================================================== */}

                <div className="form-group">

                    <label>
                        Weight (kg)
                    </label>

                    <input
                        type="number"
                        name="weight"
                        placeholder="Enter weight"
                        min="0.01"
                        step="0.01"
                        value={
                            formData.weight
                        }
                        onChange={
                            handleChange
                        }
                        required
                    />

                </div>


                {/* ==================================================
                    STATUS
                ================================================== */}

                <div className="form-group">

                    <label>
                        Shipment Status
                    </label>

                    <select
                        name="current_status"
                        value={
                            formData.current_status
                        }
                        onChange={
                            handleChange
                        }
                    >

                        {shipmentStatuses.map(
                            (status) => (

                                <option
                                    key={status}
                                    value={status}
                                >

                                    {status}

                                </option>

                            )
                        )}

                    </select>

                </div>


                {/* ==================================================
                    BUTTONS
                ================================================== */}

                <div className="button-group">

                    <button
                        type="submit"
                        className="save-btn"
                        disabled={loading}
                    >

                        {loading
                            ? "Saving..."
                            : shipment
                                ? "Update Shipment"
                                : "Create Shipment"}

                    </button>


                    {shipment && (

                        <button
                            type="button"
                            className="cancel-btn"
                            onClick={
                                handleCancel
                            }
                            disabled={loading}
                        >

                            Cancel

                        </button>

                    )}

                </div>

            </form>

        </div>

    );

}


export default ShipmentForm;