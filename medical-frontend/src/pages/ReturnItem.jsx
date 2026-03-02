import { useEffect, useState } from "react";
import API from "../api";
import "./ReturnItem.css";

const ReturnItem = () => {
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [form, setForm] = useState({
        issueId: "",
        damageCharge: 0
    });

    const [refund, setRefund] = useState(null);

    const selectedIssue = issues.find(i => i._id === form.issueId);
    const fetchIssues = async () => {
        try {
            // ✅ fetch only NOT returned issues
            const res = await API.get("/issues/active");
            setIssues(res.data);
        } catch {
            setError("Failed to load issued items");
        }
    };
    useEffect(() => {

        fetchIssues();
    }, []);
    const handleCalculate = () => {
        if (!selectedIssue) {
            setError("Please select an issue");
            return;
        }

        if (form.damageCharge < 0) {
            setError("Damage charge cannot be negative");
            return;
        }

        const calculatedRefund =
            selectedIssue.totalDeposit - Number(form.damageCharge);

        setRefund(calculatedRefund < 0 ? 0 : calculatedRefund);
        setError("");
    };

    const handleSubmit = async () => {
        if (!selectedIssue) {
            setError("Select issue before confirming return");
            return;
        }

        try {
            setLoading(true);
            await API.post("/returns", {
                issueId: form.issueId,
                damageCharge: Number(form.damageCharge)
            });

            alert("✅ Item Returned Successfully");
            fetchIssues();
            setForm({ issueId: "", damageCharge: 0 });
            setRefund(null);
        } catch {
            setError("Return failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page">
            <div className="card">
                <h2>Return Medical Item</h2>

                {error && <p className="error">{error}</p>}

                <select
                    value={form.issueId}
                    onChange={(e) => {
                        setForm({ ...form, issueId: e.target.value });
                        setRefund(null);
                    }}
                >
                    <option value="">Select Issued Item</option>
                    {issues.map(issue => (
                        <option key={issue._id} value={issue._id}>
                            {issue.patient?.patientName} - {issue.item?.itemName} (Qty: {issue.qty})
                        </option>
                    ))}
                </select>

                {selectedIssue && (
                    <div className="info-box">
                        <p><strong>Patient:</strong> {selectedIssue.patient?.patientName}</p>
                        <p><strong>Item:</strong> {selectedIssue.item?.itemName}</p>
                        <p><strong>Quantity:</strong> {selectedIssue.qty}</p>
                        <p><strong>Total Deposit:</strong> ₹{selectedIssue.totalDeposit}</p>
                    </div>
                )}

                <input
                    type="number"
                    min="0"
                    placeholder="Damage Charge"
                    value={form.damageCharge}
                    onChange={(e) =>
                        setForm({ ...form, damageCharge: e.target.value })
                    }
                />

                <button className="secondary" onClick={handleCalculate}>
                    Calculate Refund
                </button>

                {refund !== null && (
                    <div className="refund-box">
                        <h4>Refund Amount: ₹{refund}</h4>
                    </div>
                )}

                <button onClick={handleSubmit} disabled={loading}>
                    {loading ? "Processing..." : "Confirm Return"}
                </button>
            </div>
        </div>
    );
};

export default ReturnItem;