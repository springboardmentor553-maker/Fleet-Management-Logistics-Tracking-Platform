import {
    useEffect,
    useState,
} from "react";

import api from "../../services/api";


function RecentActiveDeliveries() {

    const [
        shipments,
        setShipments,
    ] = useState([]);


    const load = async () => {

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


            const activeStatuses = [

                "Assigned",

                "Picked Up",

                "In Transit",

                "Out for Delivery",

            ];


            const activeShipments =
                data
                    .filter(
                        shipment =>
                            activeStatuses.includes(
                                shipment.current_status
                            )
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
                activeShipments
            );

        } catch (error) {

            console.error(
                "Failed to load active deliveries:",
                error
            );

        }

    };


    useEffect(() => {

        load();


        const interval =
            setInterval(
                () => {

                    load();

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

            <h3>
                Recent Active Deliveries
            </h3>


            <table>

                <thead>

                    <tr>

                        <th>
                            Tracking
                        </th>

                        <th>
                            Status
                        </th>

                    </tr>

                </thead>


                <tbody>

                    {shipments.length === 0 ? (

                        <tr>

                            <td
                                colSpan="2"
                            >
                                No Active Deliveries
                            </td>

                        </tr>

                    ) : (

                        shipments.map(
                            (item) => (

                                <tr
                                    key={item.id}
                                >

                                    <td>
                                        {
                                            item.tracking_number
                                        }
                                    </td>

                                    <td>
                                        {
                                            item.current_status
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


export default RecentActiveDeliveries;