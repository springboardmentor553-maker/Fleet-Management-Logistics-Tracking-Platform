import { useEffect, useState } from "react";
import api from "../../services/api";

function RecentNotifications() {

    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {

        try {

            const response = await api.get("/notifications");

            setNotifications(
                response.data
                    .slice(-5)
                    .reverse()
            );

        } catch (error) {

            console.log(error);

        }

    };

    return (

        <div className="dashboard-table">

            <h2>Latest Notifications</h2>

            <table>

                <thead>

                    <tr>

                        <th>Title</th>

                        <th>Message</th>

                    </tr>

                </thead>

                <tbody>

                    {notifications.map((notification) => (

                        <tr key={notification.id}>

                            <td>{notification.title}</td>

                            <td>{notification.message}</td>

                        </tr>

                    ))}

                </tbody>

            </table>

        </div>

    );

}

export default RecentNotifications;