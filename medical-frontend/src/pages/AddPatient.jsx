import { useEffect, useState } from "react";
import API from "../api";
import "./AddPatient.css";

const AddPatient = () => {
    const [form, setForm] = useState({
        patientName: "",
        mobile: "",
        address: ""
    });

    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // 🔹 Fetch all patients
    const fetchPatients = async () => {
        try {
            const res = await API.get("/patients");
            setPatients(res.data);
        } catch (err) {
            setError("❌ Failed to load patients");
        }
    };

    useEffect(() => {
        fetchPatients();
    }, []);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const validate = () => {
        if (!form.patientName || !form.mobile || !form.address) {
            return "All fields are required";
        }
        if (!/^[0-9]{10}$/.test(form.mobile)) {
            return "Mobile number must be 10 digits";
        }
        return "";
    };

    const handleSubmit = async () => {
        const validationError = validate();
        if (validationError) {
            setError(validationError);
            return;
        }

        try {
            setLoading(true);
            setError("");

            await API.post("/patients", form);

            alert("✅ Patient Added Successfully");

            setForm({
                patientName: "",
                mobile: "",
                address: ""
            });

            fetchPatients(); // 🔁 Refresh patient list
        } catch (err) {
            setError("❌ Failed to add patient");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page">

            {/* 🔹 PATIENT LIST */}
            <div className="card">
                <h2>Patient List</h2>

                {patients.length === 0 ? (
                    <p>No patients found</p>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Patient Name</th>
                                <th>Mobile</th>
                                <th>Address</th>
                            </tr>
                        </thead>
                        <tbody>
                            {patients.map((p, index) => (
                                <tr key={p._id}>
                                    <td>{index + 1}</td>
                                    <td>{p.patientName}</td>
                                    <td>{p.mobile}</td>
                                    <td>{p.address}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* 🔹 ADD PATIENT */}
            <div className="card">
                <h2>Add New Patient</h2>

                {error && <p className="error">{error}</p>}

                <input
                    name="patientName"
                    placeholder="Patient Name"
                    value={form.patientName}
                    onChange={handleChange}
                />

                <input
                    name="mobile"
                    placeholder="Mobile Number"
                    maxLength="10"
                    value={form.mobile}
                    onChange={handleChange}
                />

                <textarea
                    name="address"
                    placeholder="Address"
                    rows="3"
                    value={form.address}
                    onChange={handleChange}
                />

                <button onClick={handleSubmit} disabled={loading}>
                    {loading ? "Saving..." : "Add Patient"}
                </button>
            </div>

        </div>
    );
};

export default AddPatient;