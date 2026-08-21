import React, { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
const API_URL = "https://fleetflow-backend-90o5.onrender.com/reports/maintenance";

function MaintenanceReportPage() {

    const [report, setReport] = useState(null);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReport();
    }, []);

    const fetchReport = async () => {

        try {

            const response = await axios.get(API_URL);

            setReport(response.data);

        } catch (error) {

            console.error(error);

            alert("Unable to load maintenance report.");

        } finally {

            setLoading(false);

        }

    };

    if (loading) {

        return (
            <div className="container mt-4">
                <h3>Loading Maintenance Report...</h3>
            </div>
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
                Maintenance Analytics Report
            </h2>

            <div className="row">
                        <div className="col-md-4 mb-4">
                <div className="card text-center shadow border-primary">
                    <div className="card-body">
                        <h5>Total Maintenance Records</h5>
                        <h2 className="text-primary">
                            {report.total_maintenance_records}
                        </h2>
                    </div>
                </div>
            </div>

            <div className="col-md-4 mb-4">
                <div className="card text-center shadow border-warning">
                    <div className="card-body">
                        <h5>Vehicles Under Maintenance</h5>
                        <h2 className="text-warning">
                            {report.vehicles_under_maintenance}
                        </h2>
                    </div>
                </div>
            </div>

            <div className="col-md-4 mb-4">
                <div className="card text-center shadow border-success">
                    <div className="card-body">
                        <h5>Completed Services</h5>
                        <h2 className="text-success">
                            {report.completed_services}
                        </h2>
                    </div>
                </div>
            </div>

            <div className="col-md-4 mb-4">
                <div className="card text-center shadow border-danger">
                    <div className="card-body">
                        <h5>Overdue Services</h5>
                        <h2 className="text-danger">
                            {report.overdue_services}
                        </h2>
                    </div>
                </div>
            </div>

            <div className="col-md-4 mb-4">
                <div className="card text-center shadow border-info">
                    <div className="card-body">
                        <h5>Total Maintenance Cost</h5>
                        <h2 className="text-info">
                            ₹{report.total_maintenance_cost}
                        </h2>
                    </div>
                </div>
            </div>

            <div className="col-md-4 mb-4">
                <div className="card text-center shadow border-secondary">
                    <div className="card-body">
                        <h5>Most Frequent Category</h5>
                        <h4 className="text-secondary">
                            {report.most_frequent_maintenance_category}
                        </h4>
                    </div>
                </div>
            </div>
            </div>

        </div>
        </>

    );

}

export default MaintenanceReportPage;