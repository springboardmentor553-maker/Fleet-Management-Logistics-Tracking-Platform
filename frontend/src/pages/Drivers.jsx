import { useEffect, useState } from "react";
import {
    FaUsers,
    FaSearch,
    FaPlus,
    FaTrash
} from "react-icons/fa";

import Layout from "../components/Layout";

import {
    getDrivers,
    addDriver,
    deleteDriver
} from "../services/driverService";

import "../styles/driver.css";

function Drivers() {

    const [drivers, setDrivers] = useState([]);

    const [search, setSearch] = useState("");

    const [form, setForm] = useState({
        name: "",
        license_number: "",
        phone: "",
        email: "",
        status: "Available"
    });

    useEffect(() => {
        loadDrivers();
    }, []);

    const loadDrivers = async () => {
        const data = await getDrivers();
        setDrivers(data);
    };

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {

        e.preventDefault();

        await addDriver(form);

        setForm({
            name: "",
            license_number: "",
            phone: "",
            email: "",
            status: "Available"
        });

        loadDrivers();
    };

    const handleDelete = async (id) => {

        if (!window.confirm("Delete this driver?"))
            return;

        await deleteDriver(id);

        loadDrivers();
    };

    const filteredDrivers = drivers.filter(driver =>
        driver.name.toLowerCase().includes(search.toLowerCase()) ||
        driver.license_number.toLowerCase().includes(search.toLowerCase())
    );

    return (

        <Layout>

            <div className="driver-page">

                <div className="page-header">

                    <div>

                        <h1>

                            <FaUsers />

                            Driver Management

                        </h1>

                        <p>
                            Manage all fleet drivers
                        </p>

                    </div>

                </div>

                <div className="search-box">

                    <FaSearch />

                    <input
                        placeholder="Search driver..."
                        value={search}
                        onChange={(e) =>
                            setSearch(e.target.value)
                        }
                    />

                </div>

                <form
                    className="driver-form"
                    onSubmit={handleSubmit}
                >

                    <input
                        name="name"
                        placeholder="Driver Name"
                        value={form.name}
                        onChange={handleChange}
                        required
                    />

                    <input
                        name="license_number"
                        placeholder="License Number"
                        value={form.license_number}
                        onChange={handleChange}
                        required
                    />

                    <input
                        name="phone"
                        placeholder="Phone"
                        value={form.phone}
                        onChange={handleChange}
                        required
                    />

                    <input
                        name="email"
                        type="email"
                        placeholder="Email"
                        value={form.email}
                        onChange={handleChange}
                        required
                    />

                    <select
                        name="status"
                        value={form.status}
                        onChange={handleChange}
                    >

                        <option>Available</option>
                        <option>On Trip</option>
                        <option>Leave</option>

                    </select>

                    <button type="submit">

                        <FaPlus />

                        Add Driver

                    </button>

                </form>

                <div className="table-container">

                    <table>

                        <thead>

                            <tr>

                                <th>ID</th>
                                <th>Name</th>
                                <th>License</th>
                                <th>Phone</th>
                                <th>Email</th>
                                <th>Status</th>
                                <th>Action</th>

                            </tr>

                        </thead>

                        <tbody>

                            {filteredDrivers.map(driver => (

                                <tr key={driver.id}>

                                    <td>{driver.id}</td>

                                    <td>{driver.name}</td>

                                    <td>{driver.license_number}</td>

                                    <td>{driver.phone}</td>

                                    <td>{driver.email}</td>

                                    <td>

                                        <span
                                            className={`status ${driver.status.replace(/\s/g, "")}`}
                                        >
                                            {driver.status}
                                        </span>

                                    </td>

                                    <td>

                                        <button
                                            className="delete-btn"
                                            onClick={() =>
                                                handleDelete(driver.id)
                                            }
                                        >

                                            <FaTrash />

                                        </button>

                                    </td>

                                </tr>

                            ))}

                        </tbody>

                    </table>

                </div>

            </div>

        </Layout>

    );

}

export default Drivers;