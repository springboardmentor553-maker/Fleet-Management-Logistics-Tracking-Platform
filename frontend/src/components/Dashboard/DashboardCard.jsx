import "./DashboardCard.css";

function DashboardCard({ title, value, icon }) {
    const safeValue =
        value === null ||
        value === undefined ||
        value === ""
            ? 0
            : Number(value);

    return (
        <div className="dashboard-card">

            <div className="dashboard-card-icon">
                {icon}
            </div>

            <div className="dashboard-card-content">

                <h3>
                    {title}
                </h3>

                <p>
                    {Number.isNaN(safeValue) ? 0 : safeValue}
                </p>

            </div>

        </div>
    );
}

export default DashboardCard;