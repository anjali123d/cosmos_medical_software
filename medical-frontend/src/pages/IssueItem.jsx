import { useEffect, useState, useMemo } from "react";
import API from "../api";
import "./IssueItem.css";

const IssueItem = () => {
    const [patients, setPatients] = useState([]);
    const [items, setItems] = useState([]);
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [showForm, setShowForm] = useState(false);

    const [form, setForm] = useState({
        receiptNo: "",
        reference: "",
        patientName: "",
        mobile: "",
        address: "",
        selectedItems: [],
        totalDeposit: 0
    });

    // Fetch Data
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

    // Auto deposit calculation for multiple items
    useEffect(() => {
        if (form.selectedItems.length > 0) {
            const total = form.selectedItems.reduce((sum, itemId) => {
                const item = items.find(i => i._id === itemId);
                return sum + (item?.depositPerItem || 0);
            }, 0);

            setForm(prev => ({
                ...prev,
                totalDeposit: total
            }));
        }
    }, [form.selectedItems, items]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!form.patientName || !form.mobile || !form.address || form.selectedItems.length === 0) {
            setError("All fields are required");
            return;
        }

        try {
            setLoading(true);

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

            await API.post("/issues", {
                receiptNo: form.receiptNo,
                reference: form.reference,
                patient: patientId,
                items: form.selectedItems,
                totalDeposit: Number(form.totalDeposit)
            });

            setSuccess("Issue created successfully");
            setShowForm(false);

            setForm({
                receiptNo: "",
                reference: "",
                patientName: "",
                mobile: "",
                address: "",
                selectedItems: [],
                totalDeposit: 0
            });

            fetchAllData();

        } catch {
            setError("Transaction failed");
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    };

    return (
        <div className="issue-container">
            <div className="history-header">
                <h2>Transaction History</h2>
                <button className="add-btn" onClick={() => setShowForm(true)}>
                    + New Issue
                </button>
            </div>

            {/* History List */}
            <div className="history-card">
                <div className="history-list">
                    {issues.map(issue => (
                        <div key={issue._id} className="history-item">
                            <div>
                                <strong>{issue.patient?.patientName}</strong>
                                <div className="issue-date">
                                    {formatDate(issue.createdAt)}
                                </div>

                                <div>
                                    {issue.items?.map(i => i.itemName).join(", ")}
                                </div>

                                <div className={`status-badge ${issue.isReturned ? "returned" : "issued"}`}>
                                    {issue.isReturned ? "Returned" : "Issued"}
                                </div>
                            </div>

                            <div>
                                ₹{issue.totalDeposit}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Floating Modal */}
            {showForm && (
                <div className="modal-overlay">
                    <div className="modal-card">

                        <div className="modal-header">
                            <h3>New Issue Entry</h3>
                            <button className="close-btn" onClick={() => setShowForm(false)}>✕</button>
                        </div>

                        <form className="modal-form" onSubmit={handleSubmit}>

                            <div className="form-grid">

                                <div className="form-group">
                                    <label>Receipt Number</label>
                                    <input
                                        type="text"
                                        placeholder="Enter receipt number"
                                        value={form.receiptNo}
                                        onChange={e => setForm({ ...form, receiptNo: e.target.value })}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Patient Name</label>
                                    <input
                                        type="text"
                                        placeholder="Enter patient name"
                                        value={form.patientName}
                                        onChange={e => setForm({ ...form, patientName: e.target.value })}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Mobile</label>
                                    <input
                                        type="text"
                                        placeholder="Enter mobile number"
                                        value={form.mobile}
                                        onChange={e => setForm({ ...form, mobile: e.target.value })}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Reference</label>
                                    <input
                                        type="text"
                                        placeholder="Doctor / Reference"
                                        value={form.reference}
                                        onChange={e => setForm({ ...form, reference: e.target.value })}
                                    />
                                </div>

                                <div className="form-group full">
                                    <label>Address</label>
                                    <textarea
                                        placeholder="Enter address"
                                        value={form.address}
                                        onChange={e => setForm({ ...form, address: e.target.value })}
                                    />
                                </div>

                                <div className="form-group full">
                                    <label>Select Items</label>
                                    <select
                                        multiple
                                        className="multi-select"
                                        onChange={(e) => {
                                            const selected = Array.from(
                                                e.target.selectedOptions,
                                                option => option.value
                                            );
                                            setForm({ ...form, selectedItems: selected });
                                        }}
                                    >
                                        {items.map(item => (
                                            <option key={item._id} value={item._id}>
                                                {item.itemName}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Total Deposit</label>
                                    <input
                                        type="number"
                                        placeholder="₹ Amount"
                                        value={form.totalDeposit}
                                        onChange={e => setForm({ ...form, totalDeposit: e.target.value })}
                                    />
                                </div>

                            </div>

                            <button className="submit-btn" disabled={loading}>
                                {loading ? "Processing..." : "Confirm Issue"}
                            </button>

                            {error && <div className="alert error">{error}</div>}
                            {success && <div className="alert success">{success}</div>}

                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default IssueItem;