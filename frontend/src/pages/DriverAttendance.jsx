import { useEffect, useState } from "react";
import Layout from "../components/Layout";

import {
    getAttendance,
    createAttendance,
    deleteAttendance
} from "../services/driverAttendanceService";

function DriverAttendance() {

    const [attendance, setAttendance] = useState([]);

    const [form, setForm] = useState({

        driver_id: "",

        date: "",

        attendance_status: "Present",

        check_in_time: "",

        check_out_time: ""

    });

    useEffect(() => {

        loadAttendance();

    }, []);

    const loadAttendance = async () => {

        try {

            const data = await getAttendance();

            setAttendance(data);

        } catch (error) {

            console.error(error);

        }

    };

    const handleChange = (e) => {

        setForm({

            ...form,

            [e.target.name]: e.target.value

        });

    };

    const handleSubmit = async (e) => {

        e.preventDefault();

        try {

            await createAttendance(form);

            alert("Attendance Recorded Successfully");

            setForm({

                driver_id: "",

                date: "",

                attendance_status: "Present",

                check_in_time: "",

                check_out_time: ""

            });

            loadAttendance();

        } catch (error) {

            console.error(error);

        }

    };

    const removeAttendance = async (id) => {

        if (!window.confirm("Delete attendance?")) return;

        await deleteAttendance(id);

        loadAttendance();

    };

    return (

        <Layout>

            <div className="dashboard">

                <h1>Driver Attendance</h1>

                <form
                    onSubmit={handleSubmit}
                    className="form-grid"
                >

                    <input
                        type="number"
                        name="driver_id"
                        placeholder="Driver ID"
                        value={form.driver_id}
                        onChange={handleChange}
                        required
                    />

                    <input
                        type="date"
                        name="date"
                        value={form.date}
                        onChange={handleChange}
                        required
                    />

                    <select
                        name="attendance_status"
                        value={form.attendance_status}
                        onChange={handleChange}
                    >
                        <option>Present</option>
                        <option>Absent</option>
                        <option>Late</option>
                    </select>

                    <input
                        type="time"
                        name="check_in_time"
                        value={form.check_in_time}
                        onChange={handleChange}
                    />

                    <input
                        type="time"
                        name="check_out_time"
                        value={form.check_out_time}
                        onChange={handleChange}
                    />

                    <button type="submit">
                        Save Attendance
                    </button>

                </form>

                <br />

                <table className="table">

                    <thead>

                        <tr>

                            <th>ID</th>

                            <th>Driver</th>

                            <th>Date</th>

                            <th>Status</th>

                            <th>Check In</th>

                            <th>Check Out</th>

                            <th>Action</th>

                        </tr>

                    </thead>

                    <tbody>

                        {attendance.map((item) => (

                            <tr key={item.id}>

                                <td>{item.id}</td>

                                <td>{item.driver_id}</td>

                                <td>{item.date}</td>

                                <td>{item.attendance_status}</td>

                                <td>{item.check_in_time}</td>

                                <td>{item.check_out_time}</td>

                                <td>

                                    <button
                                        onClick={() =>
                                            removeAttendance(item.id)
                                        }
                                    >
                                        Delete
                                    </button>

                                </td>

                            </tr>

                        ))}

                    </tbody>

                </table>

            </div>

        </Layout>

    );

}

export default DriverAttendance;