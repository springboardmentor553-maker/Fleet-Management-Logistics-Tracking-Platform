function SummaryCard({ title, value, icon, color, description }) {
    return (
        <div className="summary-card">
            
            <div
                className="summary-card-icon"
                style={{ backgroundColor: color }}
            >
                {icon}
            </div>

            <div className="summary-card-content">
                <h3>{title}</h3>

                <div className="summary-card-value">
                    {value}
                </div>

                <p>
                    {description || `Total ${title.toLowerCase()}`}
                </p>
            </div>

        </div>
    );
}

export default SummaryCard;