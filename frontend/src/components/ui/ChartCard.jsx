import "../../styles/ui.css";

function ChartCard({
    title,
    children
}) {

    return (

        <div className="chart-card">

            <h3>{title}</h3>

            {children}

        </div>

    );

}

export default ChartCard;