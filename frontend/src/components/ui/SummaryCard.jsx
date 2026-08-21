function SummaryCard({
    title,
    value,
    subtitle,
    icon,
    color
}) {

    return (

        <div className="summary-card">

            <div
                className="summary-card-icon"
                style={{
                    backgroundColor: color
                }}
            >
                {icon}
            </div>

            <div className="summary-card-content">

                <span className="summary-card-title">
                    {title}
                </span>

                <strong className="summary-card-value">
                    {value}
                </strong>

                <span className="summary-card-subtitle">
                    {subtitle}
                </span>

            </div>

        </div>

    );
}

export default SummaryCard;