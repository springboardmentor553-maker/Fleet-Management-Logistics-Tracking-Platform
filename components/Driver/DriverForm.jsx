import { useState, useEffect } from "react";
import api from "../../services/api";
import "./Driver.css";
import { FaPlus, FaEdit } from "react-icons/fa";
function DriverForm({ selectedDriver, fetchDrivers }) {
  const [formData, setFormData] = useState({
    name: "",
    license_number: "",
    phone: "",
    status: "Available",
  });

  useEffect(() => {
    if (selectedDriver) {
      setFormData({
        name: selectedDriver.name || "",
        license_number: selectedDriver.license_number || "",
        phone: selectedDriver.phone || "",
        status: selectedDriver.status || "Available",
      });
    } else {
      resetForm();
    }
  }, [selectedDriver]);

  const resetForm = () => {
    setFormData({
      name: "",
      license_number: "",
      phone: "",
      status: "Available",
    });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (selectedDriver) {
        await api.put(`/drivers/${selectedDriver.id}`, formData);
        alert("Driver Updated Successfully");
      } else {
        await api.post("/drivers", formData);
        alert("Driver Added Successfully");
      }

      fetchDrivers();
      resetForm();
    } catch (error) {
      console.error(error);
      alert("Something went wrong!");
    }
  };

  return (
    <div className="driver-form-card">
      <h2>
        {selectedDriver ? "Update Driver" : "Add New Driver"}
      </h2>

      <form className="driver-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Driver Name</label>

          <input
            type="text"
            name="name"
            placeholder="Enter Driver Name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>License Number</label>

          <input
            type="text"
            name="license_number"
            placeholder="Enter License Number"
            value={formData.license_number}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Phone Number</label>

          <input
            type="text"
            name="phone"
            placeholder="Enter Phone Number"
            value={formData.phone}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Status</label>

          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
          >
            <option value="Available">Available</option>
            <option value="Busy">Busy</option>
            <option value="On Leave">On Leave</option>
          </select>
        </div>

        <div className="button-container">

            <button
  type="submit"
  className={`save-btn ${
    selectedDriver ? "update-btn" : "add-btn"
  }`}
>
  {selectedDriver ? (
    <>
      <FaEdit className="btn-icon" />
    </>
  ) : (
    <>
      <FaPlus className="btn-icon" />
    </>
  )}
</button>

        </div>
      </form>
    </div>
  );
}

export default DriverForm;