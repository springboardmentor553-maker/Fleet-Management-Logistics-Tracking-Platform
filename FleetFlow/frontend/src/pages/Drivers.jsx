import { useEffect, useState } from "react";
import api from "../services/api";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";


const emptyForm = {
  name: "",
  email: "",
  phone_number: "",
  license_number: "",
  status: "Available",
};


function Drivers() {

  const [drivers, setDrivers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);

  const [form, setForm] = useState(emptyForm);

  const [saving, setSaving] = useState(false);


  const fetchDrivers = async () => {

    try {

      setLoading(true);
      setError("");

      const response = await api.get("/drivers/");

      setDrivers(response.data);

    } catch (err) {

      console.error(err);

      setError(
        err.response?.data?.detail ||
        "Unable to load drivers."
      );

    } finally {

      setLoading(false);

    }

  };


  useEffect(() => {

    fetchDrivers();

  }, []);


  const handleChange = (event) => {

    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

  };


  const openAddForm = () => {

    setEditingDriver(null);

    setForm(emptyForm);

    setShowForm(true);

    setError("");

  };


  const openEditForm = (driver) => {

    setEditingDriver(driver);

    setForm({
      name: driver.name,
      email: driver.email,
      phone_number: driver.phone_number,
      license_number: driver.license_number,
      status: driver.status,
    });

    setShowForm(true);

    setError("");

  };


  const closeForm = () => {

    if (saving) {
      return;
    }

    setShowForm(false);

    setEditingDriver(null);

    setForm(emptyForm);

  };


  const handleSubmit = async (event) => {

    event.preventDefault();

    try {

      setSaving(true);
      setError("");

      const payload = {
        name: form.name,
        email: form.email,
        phone_number: form.phone_number,
        license_number: form.license_number,
        status: form.status,
      };


      if (editingDriver) {

        await api.put(
          `/drivers/${editingDriver.id}`,
          payload
        );

      } else {

        await api.post(
          "/drivers/",
          payload
        );

      }


      setShowForm(false);

      setEditingDriver(null);

      setForm(emptyForm);

      await fetchDrivers();

    } catch (err) {

      console.error(err);

      setError(
        err.response?.data?.detail ||
        "Unable to save driver."
      );

    } finally {

      setSaving(false);

    }

  };


  const handleDelete = async (driver) => {

    const confirmed = window.confirm(
      `Delete driver ${driver.name}?`
    );

    if (!confirmed) {
      return;
    }


    try {

      setError("");

      await api.delete(
        `/drivers/${driver.id}`
      );

      await fetchDrivers();

    } catch (err) {

      console.error(err);

      setError(
        err.response?.data?.detail ||
        "Unable to delete driver."
      );

    }

  };


  const getStatusVariant = (status) => {

    if (status === "Available") {
      return "default";
    }

    if (
      status === "Unavailable" ||
      status === "Inactive"
    ) {
      return "destructive";
    }

    return "secondary";

  };


  return (

    <div>

      <div className="page-heading">

        <div>

          <h1>
            Drivers
          </h1>

          <p>
            Manage drivers registered in your fleet.
          </p>

        </div>


        <Button onClick={openAddForm}>
          + Add Driver
        </Button>

      </div>


      {error && (

        <div className="error-message">
          {error}
        </div>

      )}


      <Card>

        <CardHeader>

          <CardTitle>
            Fleet Drivers ({drivers.length})
          </CardTitle>

        </CardHeader>


        <CardContent>

          {loading ? (

            <div className="empty-state">
              Loading drivers...
            </div>

          ) : drivers.length === 0 ? (

            <div className="empty-state">

              <div
                className="empty-icon"
              >
                👤
              </div>

              <h3>
                No drivers yet
              </h3>

              <p>
                Add your first driver to start
                managing your fleet.
              </p>

              <Button
                onClick={openAddForm}
              >
                Add Driver
              </Button>

            </div>

          ) : (

            <div className="table-wrapper">

              <table className="fleet-table">

                <thead>

                  <tr>

                    <th>
                      Name
                    </th>

                    <th>
                      Email
                    </th>

                    <th>
                      Phone
                    </th>

                    <th>
                      License
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Actions
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {drivers.map((driver) => (

                    <tr
                      key={driver.id}
                    >

                      <td>

                        <strong>
                          {driver.name}
                        </strong>

                      </td>


                      <td>
                        {driver.email}
                      </td>


                      <td>
                        {driver.phone_number}
                      </td>


                      <td>
                        {driver.license_number}
                      </td>


                      <td>

                        <Badge
                          variant={
                            getStatusVariant(
                              driver.status
                            )
                          }
                        >
                          {driver.status}
                        </Badge>

                      </td>


                      <td>

                        <div className="table-actions">

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              openEditForm(driver)
                            }
                          >
                            Edit
                          </Button>


                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() =>
                              handleDelete(driver)
                            }
                          >
                            Delete
                          </Button>

                        </div>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}

        </CardContent>

      </Card>


      {showForm && (

        <div className="modal-backdrop">

          <div className="vehicle-modal">

            <div className="modal-header">

              <div>

                <h2>

                  {editingDriver
                    ? "Edit Driver"
                    : "Add Driver"}

                </h2>

                <p>

                  {editingDriver
                    ? "Update driver information."
                    : "Register a new driver."}

                </p>

              </div>


              <button
                className="modal-close"
                onClick={closeForm}
                disabled={saving}
              >
                ×
              </button>

            </div>


            <form
              onSubmit={handleSubmit}
              className="vehicle-form"
            >

              <div className="form-field">

                <label>
                  Full Name
                </label>

                <Input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  required
                />

              </div>


              <div className="form-row">

                <div className="form-field">

                  <label>
                    Email
                  </label>

                  <Input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="john@example.com"
                    required
                  />

                </div>


                <div className="form-field">

                  <label>
                    Phone Number
                  </label>

                  <Input
                    name="phone_number"
                    value={form.phone_number}
                    onChange={handleChange}
                    placeholder="+91 9876543210"
                    required
                  />

                </div>

              </div>


              <div className="form-row">

                <div className="form-field">

                  <label>
                    License Number
                  </label>

                  <Input
                    name="license_number"
                    value={form.license_number}
                    onChange={handleChange}
                    placeholder="KA0120240012345"
                    required
                  />

                </div>


                <div className="form-field">

                  <label>
                    Status
                  </label>

                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="form-select"
                  >

                    <option value="Available">
                      Available
                    </option>

                    <option value="Unavailable">
                      Unavailable
                    </option>

                    <option value="On Duty">
                      On Duty
                    </option>

                    <option value="Inactive">
                      Inactive
                    </option>

                  </select>

                </div>

              </div>


              <div className="modal-actions">

                <Button
                  type="button"
                  variant="outline"
                  onClick={closeForm}
                  disabled={saving}
                >
                  Cancel
                </Button>


                <Button
                  type="submit"
                  disabled={saving}
                >

                  {saving
                    ? "Saving..."
                    : editingDriver
                      ? "Update Driver"
                      : "Add Driver"}

                </Button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>

  );

}


export default Drivers;