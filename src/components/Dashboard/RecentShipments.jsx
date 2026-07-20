import { useEffect, useState } from "react";
import api from "../../services/api";
import "./Dashboard.css";

function RecentShipments() {

    const [shipments, setShipments] = useState([]);

    useEffect(() => {

        fetchShipments();

    }, []);

    const fetchShipments = async () => {

        try {

            const response = await api.get("/shipments");

            setShipments(response.data);

        }

        catch (error) {

            console.log(error);

        }

    };

    return (

        <div className="dashboard-table">

            <h2>Recent Shipments</h2>

            <table>

                <thead>

                    <tr>

                        <th>Tracking No.</th>

                        <th>Sender</th>

                        <th>Receiver</th>

                        <th>Status</th>

                    </tr>

                </thead>

                <tbody>

                    {

                        shipments.length === 0 ?

                        (

                            <tr>

                                <td colSpan="4">

                                    No Shipments Found

                                </td>

                            </tr>

                        )

                        :

                        (

                            shipments.slice(0,5).map((shipment)=>(

                                <tr key={shipment.id}>

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

                                        {shipment.current_status}

                                    </td>

                                </tr>

                            ))

                        )

                    }

                </tbody>

            </table>

        </div>

    );

}

export default RecentShipments;