import "./Shipment.css";

import {
    FaEdit,
    FaTrash,
} from "react-icons/fa";

import {
    getShipmentStatusClass,
    getShipmentStatusText,
} from "../../constants/shipmentStatus";


function ShipmentTable({
    shipments = [],
    onEdit,
    onDelete,
}) {

    // ==========================================================
    // SAFE SHIPMENT ARRAY
    // ==========================================================

    const shipmentList =
        Array.isArray(shipments)
            ? shipments
            : [];


    // ==========================================================
    // EDIT
    // ==========================================================

    const handleEdit = (
        shipment
    ) => {

        if (
            typeof onEdit === "function"
        ) {

            onEdit(shipment);

        }

    };


    // ==========================================================
    // DELETE
    // ==========================================================

    const handleDelete = (
        shipmentId
    ) => {

        if (
            typeof onDelete === "function"
        ) {

            onDelete(shipmentId);

        }

    };


    // ==========================================================
    // JSX
    // ==========================================================

    return (

        <div className="table-card">

            {/* ==================================================
                TABLE HEADER
            ================================================== */}

            <div className="table-header">

                <h2>
                    Shipment List
                </h2>

            </div>


            {/* ==================================================
                RESPONSIVE TABLE
            ================================================== */}

            <div className="table-responsive">

                <table className="shipment-table">

                    {/* ==================================================
                        TABLE HEAD
                    ================================================== */}

                    <thead>

                        <tr>

                            <th>
                                #
                            </th>

                            <th>
                                Tracking No.
                            </th>

                            <th>
                                Sender
                            </th>

                            <th>
                                Receiver
                            </th>

                            <th>
                                Pickup
                            </th>

                            <th>
                                Delivery
                            </th>

                            <th>
                                Status
                            </th>

                            <th>
                                Weight
                            </th>

                            <th>
                                Driver ID
                            </th>

                            <th>
                                Vehicle ID
                            </th>

                            <th>
                                Actions
                            </th>

                        </tr>

                    </thead>


                    {/* ==================================================
                        TABLE BODY
                    ================================================== */}

                    <tbody>

                        {shipmentList.length === 0 ? (

                            <tr>

                                <td
                                    colSpan="11"
                                    className="no-data"
                                >

                                    No Shipments Available

                                </td>

                            </tr>

                        ) : (

                            shipmentList.map(
                                (
                                    shipment,
                                    index
                                ) => (

                                    <tr
                                        key={
                                            shipment.id ??
                                            `shipment-${index}`
                                        }
                                    >

                                        {/* ==================================================
                                            ID
                                        ================================================== */}

                                        <td>

                                            {index + 1}

                                        </td>


                                        {/* ==================================================
                                            TRACKING NUMBER
                                        ================================================== */}

                                        <td>

                                            {shipment.tracking_number ||
                                                "-"}

                                        </td>


                                        {/* ==================================================
                                            SENDER
                                        ================================================== */}

                                        <td>

                                            {shipment.sender_name ||
                                                "-"}

                                        </td>


                                        {/* ==================================================
                                            RECEIVER
                                        ================================================== */}

                                        <td>

                                            {shipment.receiver_name ||
                                                "-"}

                                        </td>


                                        {/* ==================================================
                                            PICKUP
                                        ================================================== */}

                                        <td>

                                            {shipment.pickup_location ||
                                                "-"}

                                        </td>


                                        {/* ==================================================
                                            DELIVERY
                                        ================================================== */}

                                        <td>

                                            {shipment.delivery_location ||
                                                "-"}

                                        </td>


                                        {/* ==================================================
                                            STATUS
                                        ================================================== */}

                                        <td>

                                            <span
                                                className={
                                                    getShipmentStatusClass(
                                                        shipment.current_status
                                                    )
                                                }
                                            >

                                                {
                                                    getShipmentStatusText(
                                                        shipment.current_status
                                                    )
                                                }

                                            </span>

                                        </td>


                                        {/* ==================================================
                                            WEIGHT
                                        ================================================== */}

                                        <td>

                                            {
                                                shipment.weight !==
                                                    null &&
                                                shipment.weight !==
                                                    undefined &&
                                                shipment.weight !==
                                                    ""
                                                    ? `${shipment.weight} kg`
                                                    : "-"
                                            }

                                        </td>


                                        {/* ==================================================
                                            DRIVER
                                        ================================================== */}

                                        <td>

                                            {
                                                shipment.assigned_driver_id ||
                                                "-"
                                            }

                                        </td>


                                        {/* ==================================================
                                            VEHICLE
                                        ================================================== */}

                                        <td>

                                            {
                                                shipment.assigned_vehicle_id ||
                                                "-"
                                            }

                                        </td>


                                        {/* ==================================================
                                            ACTIONS
                                        ================================================== */}

                                        <td>

                                            <div
                                                className="action-buttons"
                                            >

                                                {/* EDIT */}

                                                <button
                                                    type="button"
                                                    className="edit-btn"
                                                    onClick={() =>
                                                        handleEdit(
                                                            shipment
                                                        )
                                                    }
                                                    title="Edit Shipment"
                                                    aria-label="Edit Shipment"
                                                >

                                                    <FaEdit />

                                                </button>


                                                {/* DELETE */}

                                                <button
                                                    type="button"
                                                    className="delete-btn"
                                                    onClick={() =>
                                                        handleDelete(
                                                            shipment.id
                                                        )
                                                    }
                                                    title="Delete Shipment"
                                                    aria-label="Delete Shipment"
                                                >

                                                    <FaTrash />

                                                </button>

                                            </div>

                                        </td>

                                    </tr>

                                )
                            )

                        )}

                    </tbody>

                </table>

            </div>

        </div>

    );

}


export default ShipmentTable;