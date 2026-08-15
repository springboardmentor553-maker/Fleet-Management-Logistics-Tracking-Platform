import {
    useEffect,
    useState,
} from "react";

import api from "../../services/api";


function RecentDeliveredShipments() {

    const [
        shipments,
        setShipments,
    ] = useState([]);


    const fetchDeliveredShipments =
        async () => {

            try {

                const response =
                    await api.get(
                        "/shipments"
                    );


                const data =
                    Array.isArray(
                        response.data
                    )
                        ? response.data
                        : [];


                const delivered =
                    data
                        .filter(
                            shipment =>
                                shipment.current_status
                                === "Delivered"
                        )
                        .sort(
                            (a, b) =>
                                Number(b.id) -
                                Number(a.id)
                        )
                        .slice(
                            0,
                            5
                        );


                setShipments(
                    delivered
                );

            } catch (error) {

                console.error(
                    "Failed to load delivered shipments:",
                    error
                );

            }

        };


    useEffect(() => {

        fetchDeliveredShipments();


        const interval =
            setInterval(
                () => {

                    fetchDeliveredShipments();

                },
                10000
            );


        return () => {

            clearInterval(
                interval
            );

        };

    }, []);


    return (

        <div className="dashboard-table">

            <h2>
                Recent Delivered Shipments
            </h2>


            <table>

                <thead>

                    <tr>

                        <th>
                            Tracking
                        </th>

                        <th>
                            Sender
                        </th>

                        <th>
                            Receiver
                        </th>

                    </tr>

                </thead>


                <tbody>

                    {shipments.length === 0 ? (

                        <tr>

                            <td
                                colSpan="3"
                            >
                                No Delivered Shipments
                            </td>

                        </tr>

                    ) : (

                        shipments.map(
                            (shipment) => (

                                <tr
                                    key={shipment.id}
                                >

                                    <td>
                                        {
                                            shipment.tracking_number
                                        }
                                    </td>

                                    <td>
                                        {
                                            shipment.sender_name
                                        }
                                    </td>

                                    <td>
                                        {
                                            shipment.receiver_name
                                        }
                                    </td>

                                </tr>

                            )
                        )

                    )}

                </tbody>

            </table>

        </div>

    );
}


export default RecentDeliveredShipments;