import "./Shipment.css";

import { FaEdit, FaTrash } from "react-icons/fa";
function ShipmentTable({ shipments, onEdit, onDelete }) {

    return (

        <div className="table-container">

            <table className="shipment-table">

                <thead>

                    <tr>

                        <th>ID</th>
                        <th>Shipment</th>
                        <th>Source</th>
                        <th>Destination</th>
                        <th>Status</th>
                        <th>Vehicle ID</th>
                        <th>Actions</th>

                    </tr>

                </thead>

                <tbody>

                    {shipments.length === 0 ? (

                        <tr>

                            <td colSpan="7">
                                No Shipments Found
                            </td>

                        </tr>

                    ) : (

                        shipments.map((shipment) => (

                            <tr key={shipment.id}>

                                <td>{shipment.id}</td>

                                <td>{shipment.shipment_name}</td>

                                <td>{shipment.source}</td>

                                <td>{shipment.destination}</td>

                                <td>{shipment.status}</td>

                                <td>{shipment.vehicle_id}</td>

                                <td>

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

                                </td>

                            </tr>

                        ))

                    )}

                </tbody>

            </table>

        </div>

    );

}

export default ShipmentTable;