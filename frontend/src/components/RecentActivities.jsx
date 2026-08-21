import { useEffect, useState } from "react";

import {
    FaTruck,
    FaUser,
    FaBoxOpen,
    FaRoute,
    FaGasPump,
    FaTools,
    FaUserCheck,
    FaClipboardList,
    FaInfoCircle
} from "react-icons/fa";

import { getActivities } from "../services/activityService";

import "../styles/recentActivities.css";


const getRelativeTime = (timestamp) => {

    if (!timestamp) {
        return "Unknown time";
    }

    const date = new Date(timestamp);
    const now = new Date();

    const difference =
        Math.floor((now.getTime() - date.getTime()) / 1000);

    if (difference < 0) {
        return "Just now";
    }

    if (difference < 60) {
        return "Just now";
    }

    const minutes = Math.floor(difference / 60);

    if (minutes < 60) {
        return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
    }

    const hours = Math.floor(minutes / 60);

    if (hours < 24) {
        return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
    }

    const days = Math.floor(hours / 24);

    if (days === 1) {
        return "Yesterday";
    }

    if (days < 7) {
        return `${days} days ago`;
    }

    return date.toLocaleDateString(
        "en-IN",
        {
            day: "numeric",
            month: "short",
            year: "numeric"
        }
    );
};


const getActivityIcon = (module) => {

    const name = module?.toLowerCase() || "";

    if (name.includes("vehicle")) {
        return <FaTruck />;
    }

    if (name.includes("driver assignment")) {
        return <FaUserCheck />;
    }

    if (name.includes("driver attendance")) {
        return <FaClipboardList />;
    }

    if (name.includes("driver")) {
        return <FaUser />;
    }

    if (name.includes("shipment")) {
        return <FaBoxOpen />;
    }

    if (name.includes("trip")) {
        return <FaRoute />;
    }

    if (name.includes("fuel")) {
        return <FaGasPump />;
    }

    if (name.includes("maintenance")) {
        return <FaTools />;
    }

    return <FaInfoCircle />;
};


const getActionClass = (action) => {

    switch (action?.toUpperCase()) {

        case "CREATE":
            return "activity-create";

        case "UPDATE":
            return "activity-update";

        case "DELETE":
            return "activity-delete";

        default:
            return "activity-default";
    }
};


const getActionLabel = (action) => {

    switch (action?.toUpperCase()) {

        case "CREATE":
            return "Created";

        case "UPDATE":
            return "Updated";

        case "DELETE":
            return "Deleted";

        default:
            return action || "Activity";
    }
};


function RecentActivities() {

    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadActivities = async () => {

        try {

            setError("");

            const data = await getActivities();

            setActivities(
                Array.isArray(data)
                    ? data.slice(0, 8)
                    : []
            );

        } catch (err) {

            console.error(
                "Failed to load activities:",
                err
            );

            setError(
                err?.response?.data?.detail ||
                "Unable to load recent activities."
            );

        } finally {

            setLoading(false);
        }
    };


    useEffect(() => {

        loadActivities();

        // Refresh activity list every 30 seconds
        const interval = setInterval(
            loadActivities,
            30000
        );

        return () => clearInterval(interval);

    }, []);


    return (

        <section className="recent-activities">

            <div className="recent-activities-header">

                <div>

                    <h2>
                        Recent Activities
                    </h2>

                    <p>
                        Latest actions performed in FleetFlow
                    </p>

                </div>

                <span className="activity-live-indicator">

                    <span></span>

                    Live

                </span>

            </div>


            {loading && (

                <div className="activity-loading">

                    <div className="activity-spinner"></div>

                    <span>
                        Loading recent activities...
                    </span>

                </div>

            )}


            {!loading && error && (

                <div className="activity-error">

                    <FaInfoCircle />

                    <span>
                        {error}
                    </span>

                    <button
                        onClick={loadActivities}
                    >
                        Retry
                    </button>

                </div>

            )}


            {!loading &&
                !error &&
                activities.length === 0 && (

                    <div className="activity-empty">

                        <FaClipboardList />

                        <h3>
                            No recent activities
                        </h3>

                        <p>
                            Fleet activities will appear here.
                        </p>

                    </div>

                )}


            {!loading &&
                !error &&
                activities.length > 0 && (

                    <div className="activity-list">

                        {activities.map((activity) => (

                            <div
                                className="activity-item"
                                key={activity.id}
                            >

                                <div
                                    className={`activity-icon ${getActionClass(
                                        activity.action
                                    )}`}
                                >
                                    {getActivityIcon(
                                        activity.module
                                    )}
                                </div>


                                <div className="activity-content">

                                    <div className="activity-title-row">

                                        <h3>
                                            {activity.module}
                                        </h3>

                                        <span
                                            className={`activity-action ${getActionClass(
                                                activity.action
                                            )}`}
                                        >
                                            {getActionLabel(
                                                activity.action
                                            )}
                                        </span>

                                    </div>

                                    <p>
                                        {activity.details}
                                    </p>

                                    {activity.username && (

                                        <span className="activity-user">

                                            By{" "}
                                            <strong>
                                                {activity.username}
                                            </strong>

                                        </span>

                                    )}

                                </div>


                                <div className="activity-time">

                                    {getRelativeTime(
                                        activity.created_at
                                    )}

                                </div>

                            </div>

                        ))}

                    </div>
                )}

        </section>
    );
}

export default RecentActivities;