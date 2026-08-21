import React, { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";

import {
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    ResponsiveContainer
} from "recharts";
const BASE_URL =
"https://fleetflow-backend-90o5.onrender.com/dashboard";



function OperationalAnalyticsPage() {


    const [analytics, setAnalytics] = useState({
  vehicleUtilization: {},
  driverWorkload: [],
  shipmentPerformance: [],
  deliverySuccess: {
    total_deliveries: 0,
    delivered: 0,
    pending: 0,
    returned: 0,
    success_rate: 0,
  },
  routeAnalytics: {},
});


    const [loading, setLoading] = useState(true);




    useEffect(() => {

        fetchAnalytics();

    }, []);




    const fetchAnalytics = async () => {


        try {


            const [
                vehicle,
                driver,
                shipment,
                delivery,
                route

            ] = await Promise.all([


                axios.get(
                `${BASE_URL}/vehicle-utilization`
                ),


                axios.get(
                `${BASE_URL}/driver-workload`
                ),


                axios.get(
                `${BASE_URL}/shipment-performance`
                ),


                axios.get(
                `${BASE_URL}/delivery-success`
                ),


                axios.get(
                `${BASE_URL}/route-analytics`
                )


            ]);

            console.log(
                "Shipment Performance:",
                shipment.data
            );




            setAnalytics({

                vehicleUtilization:
                vehicle.data,


                driverWorkload:
                driver.data,


                shipmentPerformance:
                shipment.data,


                deliverySuccess:
                delivery.data,


                routeAnalytics:
                route.data


            });



        }

        catch(error){


            console.error(error);

            alert(
                "Unable to load operational analytics"
            );


        }

        finally{


            setLoading(false);


        }


    };




    if(loading){


        return (

        <>

        <Navbar />

        <div className="container mt-4">

            <h4>
                Loading Analytics...
            </h4>

        </div>

        </>


        );

    }





    return (

    <>


    <Navbar />


    <div
  className="container mt-4"
  style={{
    marginLeft: "280px",
    padding: "20px",
    width: "calc(100% - 300px)"
  }}
>


        <h2 className="mb-4">

            Operational Analytics Dashboard

        </h2>





        {/* Delivery Success */}


        <div className="card shadow mb-4">


            <div className="card-header bg-success text-white">

                Delivery Performance

            </div>


            <div className="card-body">


                <div className="row">


                    <div className="col-md-4 text-center">

                        <h5>
                            Total Deliveries
                        </h5>

                        <h2>
                        {
                        analytics.deliverySuccess
                        .total_deliveries || 0
                        }
                        </h2>

                    </div>



                    <div className="col-md-4 text-center">

                        <h5>
                            Successful
                        </h5>

                        <h2 className="text-success">

                        {
                        analytics.deliverySuccess
                        .delivered || 0
                        }

                        </h2>

                    </div>




                    <div className="col-md-4 text-center">

                        <h5>
                            Success Rate
                        </h5>

                        <h2 className="text-primary">

                        {
                        analytics.deliverySuccess
                        .success_rate || 0
                        }%

                        </h2>


                    </div>



                </div>


            </div>


        </div>





        {/* Vehicle Utilization */}


        <div className="card shadow mb-4">


            <div className="card-header bg-primary text-white">

                Vehicle Utilization

            </div>


            <div className="card-body table-responsive">


            <table className="table table-bordered">


            <thead className="table-dark">
    <tr>
        <th>Status</th>
        <th>Count</th>
    </tr>
</thead>



            <tbody>
  <tr>
    <td>Available</td>
    <td>{analytics.vehicleUtilization.Available}</td>
  </tr>

  <tr>
    <td>Active</td>
    <td>{analytics.vehicleUtilization.Active}</td>
  </tr>

  <tr>
    <td>Maintenance</td>
    <td>{analytics.vehicleUtilization.Maintenance}</td>
  </tr>

  <tr>
    <td>Inactive</td>
    <td>{analytics.vehicleUtilization.Inactive}</td>
  </tr>

  <tr className="table-primary">
    <td><strong>Total</strong></td>
    <td><strong>{analytics.vehicleUtilization.Total}</strong></td>
  </tr>
</tbody>


            </table>


            </div>


        </div>






        {/* Driver Workload */}


        <div className="card shadow mb-4">


        <div className="card-header bg-warning">

            Driver Workload

        </div>


        <div className="card-body table-responsive">


        <table className="table table-bordered">


        <thead className="table-dark">
<tr>
    <th>Driver ID</th>
    <th>Driver Name</th>
    <th>Total Shipments</th>
</tr>
</thead>



        <tbody>
        {
        analytics.driverWorkload.map((item, index) => (
        <tr key={index}>
            <td>{item.driver_id}</td>
            <td>{item.driver_name}</td>
            <td>{item.total_shipments}</td>
        </tr>
        )
        )
        }
        </tbody>


                </table>


                </div>


                </div>


                <div className="card shadow mb-4">
            <div className="card-header bg-secondary text-white">
                Route Analytics
            </div>

            <div className="card-body table-responsive">
                <table className="table table-bordered">
                    <thead className="table-dark">
                        <tr>
                            <th>Metric</th>
                            <th>Value</th>
                        </tr>
                    </thead>

                    <tbody>
                        <tr>
                            <td>Total Routes</td>
                            <td>{analytics.routeAnalytics.total_routes}</td>
                        </tr>

                        <tr>
                            <td>Active Routes</td>
                            <td>{analytics.routeAnalytics.active_routes}</td>
                        </tr>

                        <tr>
                            <td>Inactive Routes</td>
                            <td>{analytics.routeAnalytics.inactive_routes}</td>
                        </tr>

                        <tr>
                            <td>Closed Routes</td>
                            <td>{analytics.routeAnalytics.closed_routes}</td>
                        </tr>

                        <tr>
                            <td>Completion Rate</td>
                            <td>{analytics.routeAnalytics.completion_rate}%</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>







        {/* Shipment Performance */}

        <div className="card shadow mb-4">

            <div className="card-header bg-info text-white">
                Shipment Performance
            </div>


            <div className="card-body">


                {
                analytics.shipmentPerformance.length === 0 ? (

                    <p>No shipment performance data available</p>

                ) : (

                    <>
                
                    {/* Table */}

                    <div className="table-responsive">

                        <table className="table table-bordered">

                            <thead className="table-dark">

                                <tr>
                                    <th>Status</th>
                                    <th>Total Shipments</th>
                                </tr>

                            </thead>


                            <tbody>

                            {
                                analytics.shipmentPerformance.map(
                                    (item,index)=>(

                                    <tr key={index}>

                                        <td>
                                            {item.status}
                                        </td>

                                        <td>
                                            {item.total_shipments}
                                        </td>

                                    </tr>

                                )
                            )
                            }

                            </tbody>

                        </table>

                        </div>



            {/* Pie Chart */}

            <div 
                className="mt-4"
                style={{
                    width:"100%",
                    height:"300px"
                }}
            >


            <ResponsiveContainer 
                width="100%" 
                height="100%"
            >

            <PieChart>


                <Pie
                    data={analytics.shipmentPerformance}
                    dataKey="total_shipments"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                >

                {
                analytics.shipmentPerformance.map(
                    (entry,index)=>(
                        <Cell
                            key={`cell-${index}`}
                            fill={
                                [
                                    "#28a745",
                                    "#ffc107",
                                    "#dc3545",
                                    "#17a2b8"
                                ][index % 4]
                            }
                        />
                    )
                )
                }


                </Pie>


                <Tooltip />

                <Legend />


            </PieChart>


            </ResponsiveContainer>


            </div>


            </>

        )
        }


    </div>


</div>



    </div>


    </>

    );


}



export default OperationalAnalyticsPage;