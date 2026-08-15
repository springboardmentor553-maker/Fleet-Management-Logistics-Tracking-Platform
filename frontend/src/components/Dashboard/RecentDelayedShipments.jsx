import {
    useEffect,
    useState,
} from "react";

import api from "../../services/api";


function RecentDelayedShipments() {

    const [
        shipments,
        setShipments,
    ] = useState([]);


    const fetchDelayedShipments =
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


                const delayed =
                    data
                        .filter(
                            shipment =>
                                shipment.current_status
                                === "Delayed"
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
                    delayed
                );

            } catch (error) {

                console.error(
                    "Failed to load delayed shipments:",
                    error
                );

            }

        };


    useEffect(() => {

        fetchDelayedShipments();


        const interval =
            setInterval(
                () => {

                    fetchDelayedShipments();

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
                Recent Delayed Shipments
            </h2>


            <table>

                <thead>

                    <tr>

                        <th>
                            Tracking
                        </th>

                        <th>
                            Pickup
                        </th>

                        <th>
                            Destination
                        </th>

                    </tr>

                </thead>


                <tbody>

                    {shipments.length === 0 ? (

                        <tr>

                            <td
                                colSpan="3"
                            >
                                No Delayed Shipments
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
                                            shipment.pickup_location
                                        }
                                    </td>

                                    <td>
                                        {
                                            shipment.delivery_location
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


export default RecentDelayedShipments;