import { useEffect, useState } from "react";
import API from "../api";
import "./AddPatient.css";
import {
    UserPlus, Search, Phone, MapPin,
    Trash2, User, ArrowLeft, CheckCircle, AlertCircle
} from 'react-feather';
import { useNavigate } from "react-router-dom";

const AddPatient = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        patientName: "",
        mobile: "",
        address: ""
    });

    const [patients, setPatients] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

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
        if (!form.patientName.trim() || !form.mobile.trim() || !form.address.trim()) {
            return "All fields are required";
        }
        if (!/^[0-9]{10}$/.test(form.mobile)) {
            return "Mobile number must be exactly 10 digits";
        }
        return "";
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationError = validate();
        if (validationError) {
            setError(validationError);
            return;
        }

        try {
            setLoading(true);
            setError("");
            await API.post("/patients", form);

            setSuccess("Patient registered successfully!");
            setForm({ patientName: "", mobile: "", address: "" });
            fetchPatients();

            setTimeout(() => setSuccess(""), 3000);
        } catch (err) {
            setError("❌ Failed to add patient. Mobile might already exist.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this patient record?")) return;
        try {
            await API.delete(`/patients/${id}`);
            fetchPatients();
        } catch (err) {
            setError("Could not delete record.");
        }
    };

    const filteredPatients = patients.filter(p =>
        p.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.mobile.includes(searchTerm)
    );

    return (
        <div className="add-patient-container">
            <div className="page-header">
                <div className="header-left">

                    <div>
                        <h1>Patient Directory</h1>
                        <p>Manage medical patient registrations and records</p>
                    </div>
                </div>
            </div>

            <div className="content-layout">
                

                {/* Patient List */}
                <div className="list-section">
                    <div className="glass-card">
                        <div className="list-controls">
                            <h3>Registered Patients</h3>
                            <div className="search-bar">
                                <Search size={16} />
                                <input
                                    placeholder="Search by name or phone..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="patient-list">
                            {filteredPatients.length === 0 && (
                                <div className="empty-state">No matching records found.</div>
                            )}

                            {filteredPatients.map((p) => (
                                <div key={p._id} className="patient-card">
                                    <div className="patient-left">
                                        <div className="avatar-small">
                                            {p.patientName.charAt(0).toUpperCase()}
                                        </div>

                                        <div className="patient-details">
                                            <div className="p-name">{p.patientName}</div>
                                            <div className="p-phone">{p.mobile}</div>
                                            <div className="p-address">{p.address}</div>
                                        </div>
                                    </div>

                                    <div className="patient-actions">
                                        <button
                                            className="delete-icon-btn"
                                            onClick={() => handleDelete(p._id)}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                {error && <div className="alert error"><AlertCircle size={18} /> {error}</div>}
                {success && <div className="alert success"><CheckCircle size={18} /> {success}</div>}

            </div>
        </div>
    );
};

export default AddPatient;