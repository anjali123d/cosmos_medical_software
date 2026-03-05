import { useEffect, useState, useMemo, useRef } from "react";
import API from "../api";
import { Search, AlertCircle, CheckCircle } from "react-feather";
import "./ReturnItem.css";

const ReturnItem = () => {
    const [issues, setIssues] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [returns, setReturns] = useState([]);
    const [form, setForm] = useState({
        issueId: "",
        damageCharge: 0
    });
    const fetchReturnHistory = async () => {
        try {
            const res = await API.get("/returns");
            setReturns(res.data);
        } catch {
            setError("Failed to load return history");
        }
    };
    const wrapperRef = useRef(null);

    const fetchIssues = async () => {
        try {
            const res = await API.get("/issues/active");
            setIssues(res.data);
        } catch {
            setError("Failed to load active issued items");
        }
    };

    useEffect(() => {
        fetchIssues();
        fetchReturnHistory();
    }, []);

    // Close suggestion if click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredIssues = useMemo(() => {
        if (!searchTerm) return [];
        return issues.filter(issue =>
            issue.patient?.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            issue.item?.itemName?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [issues, searchTerm]);

    const handleSelect = (issue) => {
        setForm({ ...form, issueId: issue._id });
        setSearchTerm(`${issue.patient?.patientName} - ${issue.item?.itemName}`);
        setShowSuggestions(false);
    };

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
            fetchReturnHistory(); // history refresh
            setSuccess("✅ Item Returned Successfully");
            fetchIssues();
            setForm({ issueId: "", damageCharge: 0 });
            setSearchTerm("");

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

                    {/* 🔍 AUTOCOMPLETE SEARCH */}
                    <div className="input-field" ref={wrapperRef}>
                        <label>
                            <Search size={14} /> Search Patient / Item
                        </label>

                        <input
                            type="text"
                            placeholder="Type patient name..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setShowSuggestions(true);
                                setForm({ ...form, issueId: "" });
                            }}
                            onFocus={() => setShowSuggestions(true)}
                        />

                        {showSuggestions && filteredIssues.length > 0 && (
                            <div className="suggestion-box">
                                {filteredIssues.map(issue => (
                                    <div
                                        key={issue._id}
                                        className="suggestion-item"
                                        onClick={() => handleSelect(issue)}
                                    >
                                        <div className="suggestion-main">
                                            {issue.patient?.patientName}
                                        </div>
                                        <div className="suggestion-sub">
                                            {issue.item?.itemName} (Qty: {issue.qty})
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {showSuggestions && searchTerm && filteredIssues.length === 0 && (
                            <div className="suggestion-box">
                                <div className="suggestion-item no-result">
                                    No matching records found
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="input-field">
                        <label>Damage / Deduction Charge (₹)</label>
                        <input
                            type="number"
                            min="0"
                            value={form.damageCharge}
                            onChange={(e) =>
                                setForm({ ...form, damageCharge: e.target.value })
                            }
                        />
                    </div>

                    <button type="submit" className="submit-btn" disabled={loading}>
                        {loading ? "Processing..." : "Confirm Return"}
                    </button>
                    {error && <div className="alert error-alert"><AlertCircle size={16} /> {error}</div>}
                    {success && <div className="alert success-alert"><CheckCircle size={16} /> {success}</div>}

                </form>
            </div>
            <div className="card">
                <h2>Return History</h2>
                <div className="return-history-list">
                    {returns.length === 0 && (
                        <div className="no-history">No return history found</div>
                    )}

                    {returns.map((r) => (
                        <div key={r._id} className="return-history-card">

                            <div className="history-row">
                                <span className="label">Patient</span>
                                <span>{r.issue?.patient?.patientName}</span>
                            </div>

                            <div className="history-row">
                                <span className="label">Item</span>
                                <span>{r.issue?.item?.itemName}</span>
                            </div>

                            <div className="history-row">
                                <span className="label">Qty</span>
                                <span>{r.issue?.qty}</span>
                            </div>

                            <div className="history-row">
                                <span className="label">Deposit</span>
                                <span>₹{r.issue?.totalDeposit}</span>
                            </div>

                            <div className="history-row">
                                <span className="label">Damage</span>
                                <span>₹{r.damageCharge}</span>
                            </div>

                            <div className="history-row">
                                <span className="label">Refund</span>
                                <span className="refund">₹{r.refundAmount}</span>
                            </div>

                            <div className="history-row">
                                <span className="label">Date</span>
                                <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                            </div>

                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
};

export default ReturnItem;