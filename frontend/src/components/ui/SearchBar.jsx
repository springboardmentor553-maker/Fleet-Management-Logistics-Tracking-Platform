import { FaSearch } from "react-icons/fa";

import "../../styles/ui.css";

function SearchBar({
    value,
    onChange,
    placeholder
}) {

    return (

        <div className="search-wrapper">

            <FaSearch />

            <input
                type="text"
                value={value}
                onChange={onChange}
                placeholder={placeholder}
            />

        </div>

    );

}

export default SearchBar;