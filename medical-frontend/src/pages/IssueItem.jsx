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

    // Date Filter State
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const [form, setForm] = useState({
        patient: "",
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
            setError("Critical: Failed to sync with medical database");
        }
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    // Filter Logic using useMemo for performance
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

        if (!form.patient || !form.item) {
            setError("Patient and Item selection are mandatory");
            return;
        }

        if (selectedItem && form.qty > selectedItem.totalStock) {
            setError(`Insufficient Stock: Only ${selectedItem.totalStock} units available`);
            return;
        }

        try {
            setLoading(true);
            await API.post("/issues", {
                patient: form.patient,
                item: form.item,
                qty: Number(form.qty)
            });

            setSuccess("Transaction processed successfully");
            setForm({ patient: "", item: "", qty: 1 });
            fetchAllData(); // Refresh stock counts and history

            setTimeout(() => setSuccess(""), 3000);
        } catch (err) {
            setError(err.response?.data?.message || "Internal transaction error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="issue-container">
            <header className="page-header">
                <h1>Stock Distribution</h1>

            </header>

            <div className="issue-grid">
                {/* TRANSACTION FORM */}
                <section className="form-card">
                    <div className="card-header">
                        <Clipboard size={20} />
                        <h3>New Issue Entry</h3>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {error && <div className="alert error-alert"><AlertCircle size={16} /> {error}</div>}
                        {success && <div className="alert success-alert"><CheckCircle size={16} /> {success}</div>}

                        <div className="input-field">
                            <label><User size={14} /> Recipient Patient</label>
                            <select
                                value={form.patient}
                                onChange={e => setForm({ ...form, patient: e.target.value })}
                                className={!form.patient ? "placeholder" : ""}
                            >
                                <option value="">Select Patient...</option>
                                {patients.map(p => (
                                    <option key={p._id} value={p._id}>{p.patientName} — {p.mobile}</option>
                                ))}
                            </select>
                        </div>

                        <div className="input-field">
                            <label><Package size={14} /> Medical Item</label>
                            <select
                                value={form.item}
                                onChange={e => setForm({ ...form, item: e.target.value })}
                                className={!form.item ? "placeholder" : ""}
                            >
                                <option value="">Select Item...</option>
                                {items.map(i => (
                                    <option key={i._id} value={i._id} disabled={i.totalStock === 0}>
                                        {i.itemName} {i.totalStock === 0 ? "(Out of Stock)" : `(${i.totalStock} available)`}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="input-field">
                            <label><Hash size={14} /> Quantity</label>
                            <input
                                type="number"
                                min="1"
                                value={form.qty}
                                onChange={e => setForm({ ...form, qty: e.target.value })}
                            />
                        </div>

                        {selectedItem && (
                            <div className="billing-summary">
                                <div className="bill-row">
                                    <span>Unit Deposit:</span>
                                    <span>₹{selectedItem.depositPerItem}</span>
                                </div>
                                <div className="bill-row">
                                    <span>Quantity:</span>
                                    <span>x {form.qty}</span>
                                </div>
                                <div className="bill-total">
                                    <span>Total Collection:</span>
                                    <span>₹{totalDeposit.toLocaleString()}</span>
                                </div>
                            </div>
                        )}

                        <button className="submit-btn" disabled={loading}>
                            {loading ? "Processing..." : "Confirm & Issue Item"}
                        </button>
                    </form>
                </section>

                {/* TRANSACTION HISTORY */}
                <section className="history-card">
                    <div className="card-header-flex">
                        <h3>Transaction History</h3>
                        <div className="date-filter">
                            <Filter size={16} />
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                title="Start Date"
                            />
                            <span>to</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                title="End Date"
                            />
                            {(startDate || endDate) && (
                                <button className="clear-filter" onClick={() => { setStartDate(""); setEndDate(""); }}>Clear</button>
                            )}
                        </div>
                    </div>

                    <div className="table-overflow">
                        <table>
                            <thead>
                                <tr>
                                    <th>Patient / Item</th>
                                    <th>Status</th>
                                    <th>Deposit</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredIssues.map((issue) => (
                                    <tr key={issue._id} className={issue.isReturned ? "row-returned" : ""}>
                                        <td>
                                            <div className="table-main-text">{issue.patient?.patientName}</div>
                                            <div className="table-sub-text">{issue.item?.itemName} (x{issue.qty})</div>
                                        </td>
                                        <td>
                                            <span className={`badge ${issue.isReturned ? "bg-gray" : "bg-blue"}`}>
                                                {issue.isReturned ? "Returned" : "Active Issue"}
                                            </span>
                                        </td>
                                        <td className="font-mono">₹{issue.totalDeposit}</td>
                                        <td className="table-sub-text">
                                            {new Date(issue.createdAt).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                                {filteredIssues.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="text-center">No transactions found for selected dates.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default IssueItem;