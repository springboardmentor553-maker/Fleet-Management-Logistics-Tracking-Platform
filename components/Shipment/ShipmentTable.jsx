import "./Shipment.css";

import {

    FaEdit,

    FaTrash

} from "react-icons/fa";

function ShipmentTable({

    shipments,

    onEdit,

    onDelete

}) {

    return (

        <div className="table-card">

            <div className="table-header">

                <h2>

                    Shipment List

                </h2>

            </div>

            <div className="table-responsive">

                <table className="shipment-table">

                    <thead>

                        <tr>

                            <th>#</th>

                            <th>Tracking No.</th>

                            <th>Sender</th>

                            <th>Receiver</th>

                            <th>Pickup</th>

                            <th>Delivery</th>

                            <th>Status</th>

                            <th>Weight</th>

                            <th>Driver ID</th>

                            <th>Vehicle ID</th>

                            <th>Actions</th>

                        </tr>

                    </thead>

                    <tbody>

                        {

                            shipments.length === 0 ?

                            (

                                <tr>

                                    <td

                                        colSpan="11"

                                        className="no-data"

                                    >

                                        No Shipments Available

                                    </td>

                                </tr>

                            )

                            :

                            (

                                shipments.map((shipment, index) => (

                                    <tr key={shipment.id}>

                                        <td>

                                            {index + 1}

                                        </td>

                                        <td>

                                            {shipment.tracking_number}

                                        </td>

                                        <td>

                                            {shipment.sender_name}

                                        </td>

                                        <td>

                                            {shipment.receiver_name}

                                        </td>

                                        <td>

                                            {shipment.pickup_location}

                                        </td>

                                        <td>

                                            {shipment.delivery_location}

                                        </td>

                                        <td>

                                            <span

                                                className={

                                                    shipment.current_status === "Created"

                                                        ? "status created"

                                                        : shipment.current_status === "Assigned"

                                                        ? "status assigned"

                                                        : shipment.current_status === "In Transit"

                                                        ? "status transit"

                                                        : shipment.current_status === "Delayed"

                                                        ? "status delayed"

                                                        : shipment.current_status === "Delivered"

                                                        ? "status delivered"

                                                        : "status cancelled"

                                                }

                                            >

                                                {shipment.current_status}

                                            </span>

                                        </td>

                                        <td>

                                            {shipment.weight} kg

                                        </td>

                                        <td>

                                            {

                                                shipment.assigned_driver_id

                                                    ?

                                                    shipment.assigned_driver_id

                                                    :

                                                    "-"

                                            }

                                        </td>

                                        <td>

                                            {

                                                shipment.assigned_vehicle_id

                                                    ?

                                                    shipment.assigned_vehicle_id

                                                    :

                                                    "-"

                                            }

                                        </td>

                                        <td>

                                            <div className="action-buttons">

                                                <button

                                                    className="edit-btn"

                                                    onClick={() => onEdit(shipment)}

                                                >

                                                    <FaEdit />

                                                </button>

                                                <button

                                                    className="delete-btn"

                                                    onClick={() => onDelete(shipment.id)}

                                                >

                                                    <FaTrash />

                                                </button>

                                            </div>

                                        </td>

                                    </tr>

                                ))

                            )

                        }

                    </tbody>

                </table>

            </div>

        </div>

    );

}

export default ShipmentTable;