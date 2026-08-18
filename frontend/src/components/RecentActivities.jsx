function RecentActivities() {

  const activities = [

    {
      icon: "🚚",
      text: "Vehicle AP39AB1234 added successfully.",
      time: "2 min ago",
    },

    {
      icon: "📦",
      text: "Shipment SHP-102 assigned to Driver Ramesh.",
      time: "15 min ago",
    },

    {
      icon: "🛣",
      text: "Trip TRP-204 started from Hyderabad.",
      time: "30 min ago",
    },

    {
      icon: "✅",
      text: "Shipment SHP-098 delivered successfully.",
      time: "1 hour ago",
    },

    {
      icon: "👨",
      text: "Driver Mahesh updated profile.",
      time: "2 hours ago",
    },

  ];

  return (

    <div className="card shadow border-0 rounded-4 mt-4">

      <div className="card-header bg-white">

        <h4 className="mb-0">
          Recent Activities
        </h4>

      </div>

      <div className="card-body">

        {activities.map((activity, index) => (

          <div
            key={index}
            className="d-flex justify-content-between align-items-center border-bottom py-3"
          >

            <div>

              <span style={{ fontSize: "24px" }}>
                {activity.icon}
              </span>

              <span className="ms-3">
                {activity.text}
              </span>

            </div>

            <small className="text-muted">
              {activity.time}
            </small>

          </div>

        ))}

      </div>

    </div>

  );

}

export default RecentActivities;