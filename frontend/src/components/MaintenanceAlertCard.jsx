import { useEffect, useState } from "react";
import api from "../services/api";

function MaintenanceAlertCard() {

  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      const res = await api.get("/maintenance-alerts");
      setAlerts(res.data.slice(0, 5));
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow p-6 mt-8">

      <h2 className="text-2xl font-bold mb-4">
        Maintenance Alerts
      </h2>

      {alerts.map((alert) => (

        <div
          key={alert.alert_id}
          className="border rounded-lg p-4 mb-3"
        >

          <h3 className="font-bold">
            Vehicle {alert.vehicle_id}
          </h3>

          <p>{alert.alert_message}</p>

          <p className="text-red-600">
            {alert.alert_status}
          </p>

        </div>

      ))}

    </div>
  );
}

export default MaintenanceAlertCard;