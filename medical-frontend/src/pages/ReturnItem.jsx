import { useEffect, useState } from "react";
import API from "../api";
import { RefreshCcw, AlertCircle, CheckCircle } from 'react-feather';
import "./ReturnItem.css";

const ReturnItem = () => {
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [form, setForm] = useState({
        issueId: "",
        damageCharge: 0
    });

    const fetchIssues = async () => {
        try {
            // Fetch only NOT returned issues
            const res = await API.get("/issues/active");
            setIssues(res.data);
        } catch {
            setError("Failed to load active issued items");
        }
    };

    useEffect(() => {
        fetchIssues();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!form.issueId) {
            setError("Please select an issued item to return");
            return;
        }

        try {
            setLoading(true);
            await API.post("/returns", {
                issueId: form.issueId,
                damageCharge: Number(form.damageCharge)
            });

            setSuccess("✅ Item Returned Successfully");
            fetchIssues();
            setForm({ issueId: "", damageCharge: 0 });

            setTimeout(() => setSuccess(""), 3000);
        } catch (err) {
            setError(err.response?.data?.message || "Return process failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="return-container">
            <header className="page-header">
                <h1>Item Return</h1>

            </header>

            <div className="card">
                <h2>Return Medical Item</h2>

                <form onSubmit={handleSubmit}>
                    {error && <div className="alert error-alert"><AlertCircle size={16} /> {error}</div>}
                    {success && <div className="alert success-alert"><CheckCircle size={16} /> {success}</div>}

                    <div className="input-field">
                        <label>Select Issued Item</label>
                        <select
                            value={form.issueId}
                            onChange={(e) => setForm({ ...form, issueId: e.target.value })}
                        >
                            <option value="">Select...</option>
                            {issues.map(issue => (
                                <option key={issue._id} value={issue._id}>
                                    {issue.patient?.patientName} - {issue.item?.itemName} (Qty: {issue.qty})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="input-field">
                        <label>Damage / Deduction Charge (₹)</label>
                        <input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={form.damageCharge}
                            onChange={(e) => setForm({ ...form, damageCharge: e.target.value })}
                        />
                    </div>

                    <button type="submit" className="submit-btn" disabled={loading}>
                        {loading ? "Processing..." : "Confirm Return"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ReturnItem;