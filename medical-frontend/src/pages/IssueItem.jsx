import { useEffect, useState, useMemo } from "react";
import API from "../api";
import {
    Clipboard, User, Package, Hash,
    AlertCircle, CheckCircle, Filter
} from 'react-feather';
import "./IssueItem.css";

const IssueItem = () => {
    const [patients, setPatients] = useState([]);
    const [items, setItems] = useState([]);
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const [form, setForm] = useState({
        patientName: "",
        mobile: "",
        address: "",
        item: "",
        qty: 1
    });

    const selectedItem = items.find(i => i._id === form.item);
    const totalDeposit = selectedItem ? form.qty * selectedItem.depositPerItem : 0;

    const fetchAllData = async () => {
        try {
            const [pRes, iRes, issueRes] = await Promise.all([
                API.get("/patients"),
                API.get("/items"),
                API.get("/issues")
            ]);
            setPatients(pRes.data);
            setItems(iRes.data);
            setIssues(issueRes.data);
        } catch {
            setError("Failed to sync data");
        }
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    const filteredIssues = useMemo(() => {
        return issues.filter(issue => {
            const issueDate = new Date(issue.createdAt).setHours(0, 0, 0, 0);
            const start = startDate ? new Date(startDate).setHours(0, 0, 0, 0) : null;
            const end = endDate ? new Date(endDate).setHours(23, 59, 59, 999) : null;

            if (start && issueDate < start) return false;
            if (end && issueDate > end) return false;
            return true;
        });
    }, [issues, startDate, endDate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!form.patientName || !form.mobile || !form.address || !form.item) {
            setError("All fields are required");
            return;
        }

        if (!/^[0-9]{10}$/.test(form.mobile)) {
            setError("Mobile must be 10 digits");
            return;
        }

        if (selectedItem && form.qty > selectedItem.totalStock) {
            setError(`Only ${selectedItem.totalStock} items available`);
            return;
        }

        try {
            setLoading(true);

            // 1️⃣ Check if patient exists
            let existingPatient = patients.find(
                p => p.mobile === form.mobile
            );

            let patientId;

            if (!existingPatient) {
                const newPatient = await API.post("/patients", {
                    patientName: form.patientName,
                    mobile: form.mobile,
                    address: form.address
                });
                patientId = newPatient.data._id;
            } else {
                patientId = existingPatient._id;
            }

            // 2️⃣ Create Issue
            await API.post("/issues", {
                patient: patientId,
                item: form.item,
                qty: Number(form.qty)
            });

            setSuccess("Patient added & item issued successfully");

            setForm({
                patientName: "",
                mobile: "",
                address: "",
                item: "",
                qty: 1
            });

            fetchAllData();

        } catch (err) {
            setError("Transaction failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="issue-container">
            <h1>Stock Distribution</h1>

            <div className="issue-grid">

                {/* FORM */}
                <section className="form-card">
                    <h3>New Issue Entry</h3>

                    <form onSubmit={handleSubmit}>
                        {error && <div className="alert error">{error}</div>}
                        {success && <div className="alert success">{success}</div>}

                        <div className="input-field">
                            <label>Patient Name</label>
                            <input
                                type="text"
                                value={form.patientName}
                                onChange={e => setForm({ ...form, patientName: e.target.value })}
                            />
                        </div>

                        <div className="input-field">
                            <label>Mobile</label>
                            <input
                                type="text"
                                maxLength="10"
                                value={form.mobile}
                                onChange={e => setForm({ ...form, mobile: e.target.value })}
                            />
                        </div>

                        <div className="input-field">
                            <label>Address</label>
                            <textarea
                                rows="2"
                                value={form.address}
                                onChange={e => setForm({ ...form, address: e.target.value })}
                            />
                        </div>

                        <div className="input-field">
                            <label>Item</label>
                            <select
                                value={form.item}
                                onChange={e => setForm({ ...form, item: e.target.value })}
                            >
                                <option value="">Select Item</option>
                                {items.map(i => (
                                    <option key={i._id} value={i._id} disabled={i.totalStock === 0}>
                                        {i.itemName} ({i.totalStock} available)
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="input-field">
                            <label>Quantity</label>
                            <input
                                type="number"
                                min="1"
                                value={form.qty}
                                onChange={e => setForm({ ...form, qty: e.target.value })}
                            />
                        </div>

                        {selectedItem && (
                            <div className="billing-box">
                                Total: ₹{totalDeposit}
                            </div>
                        )}

                        <button className="submit-btn" disabled={loading}>
                            {loading ? "Processing..." : "Confirm Issue"}
                        </button>
                    </form>
                </section>

                {/* HISTORY */}
                <section className="history-card">
                    <h3>Transaction History</h3>

                    <div className="history-list">
                        {filteredIssues.map(issue => (
                            <div key={issue._id} className="history-item">
                                <div>
                                    <strong>{issue.patient?.patientName}</strong>
                                    <div>
                                        {issue.item?.itemName} (x{issue.qty})
                                    </div>

                                    {/* ✅ STATUS LABEL */}
                                    <div className={`status-badge ${issue.isReturned ? "returned" : "issued"}`}>
                                        {issue.isReturned ? "Returned" : "Issued"}
                                    </div>
                                </div>

                                <div>
                                    ₹{issue.totalDeposit}
                                </div>
                            </div>
                        ))}

                        {filteredIssues.length === 0 &&
                            <div className="empty">No transactions found</div>
                        }
                    </div>
                </section>

            </div>
        </div>
    );
};

export default IssueItem;