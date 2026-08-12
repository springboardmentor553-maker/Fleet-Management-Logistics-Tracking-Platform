import "./Driver.css";

function DriverSearch({ search, setSearch }) {

    return (

        <div className="search-container">

            <input
                type="text"
                placeholder="Search Driver by Name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-input"
            />

        </div>

    );

}

export default DriverSearch;