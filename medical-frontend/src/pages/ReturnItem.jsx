import { useEffect, useState, useMemo, useRef } from "react";
import API from "../api";
import { Search, AlertCircle, CheckCircle } from "react-feather";
import "./ReturnItem.css";

const ReturnItem = () => {

    const [issues, setIssues] = useState([]);
    const [returns, setReturns] = useState([]);

    const [searchTerm, setSearchTerm] = useState("");
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedIssue, setSelectedIssue] = useState(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const wrapperRef = useRef(null);

    const [form, setForm] = useState({
        issueId: "",
        itemId: "",
        qty: 1,
        damageCharge: 0
    });

    /* ======================
       FETCH DATA
    ====================== */

    const fetchIssues = async () => {
        const res = await API.get("/issues/active");
        setIssues(res.data);
    };

    const fetchReturns = async () => {
        const res = await API.get("/returns");
        setReturns(res.data);
    };

    useEffect(() => {
        fetchIssues();
        fetchReturns();
    }, []);

    /* ======================
       CLOSE SUGGESTION
    ====================== */

    useEffect(() => {

        const handleClickOutside = (event) => {

            if (
                wrapperRef.current &&
                !wrapperRef.current.contains(event.target)
            ) {
                setShowSuggestions(false);
            }

        };

        document.addEventListener("mousedown", handleClickOutside);

        return () =>
            document.removeEventListener("mousedown", handleClickOutside);

    }, []);

    /* ======================
       SEARCH PATIENT
    ====================== */

    const filteredIssues = useMemo(() => {

        if (!searchTerm) return [];

        return issues.filter(issue =>
            issue.patient?.patientName
                ?.toLowerCase()
                .includes(searchTerm.toLowerCase())
        );

    }, [issues, searchTerm]);

    const handleSelectIssue = (issue) => {

        setSelectedIssue(issue);

        setForm({
            issueId: issue._id,
            itemId: "",
            qty: 1,
            damageCharge: 0
        });

        setSearchTerm(issue.patient?.patientName || "");
        setShowSuggestions(false);

    };

    /* ======================
       RETURN SUBMIT
    ====================== */

    const handleSubmit = async (e) => {

        e.preventDefault();

        setError("");
        setSuccess("");

        if (!form.issueId || !form.itemId) {
            setError("Select patient and item");
            return;
        }

        const selectedItem = selectedIssue.items.find(
            i => i.item._id === form.itemId
        );

        if (!selectedItem) {
            setError("Item not found in issue");
            return;
        }

        if (Number(form.qty) > selectedItem.qty) {
            setError(
                `Max return allowed: ${selectedItem.qty}`
            );
            return;
        }

        try {

            setLoading(true);

            const refundAmount =
                (selectedItem.item.depositPerItem *
                    Number(form.qty)) -
                Number(form.damageCharge || 0);

            await API.post("/returns", {
                issueId: form.issueId,
                itemId: form.itemId,
                qty: Number(form.qty),
                damageCharge: Number(form.damageCharge),
                refundAmount: Number(refundAmount)
            });

            fetchReturns();
            fetchIssues();

            setForm({
                issueId: "",
                itemId: "",
                qty: 1,
                damageCharge: 0
            });

            setSelectedIssue(null);
            setSearchTerm("");

            setSuccess("Item returned successfully");

            setTimeout(() => setSuccess(""), 3000);

        } catch (err) {

            setError(
                err.response?.data?.message ||
                "Return failed"
            );

        } finally {

            setLoading(false);

        }

    };

    return (

        <div className="return-container">

            <header className="page-header">
                <h1>Item Return</h1>
            </header>

            {/* RETURN FORM */}

            <div className="card">

                <h2>Return Medical Item</h2>

                <form onSubmit={handleSubmit}>

                    {/* PATIENT SEARCH */}

                    <div className="input-field" ref={wrapperRef}>

                        <label>
                            <Search size={14} />
                            Search Patient
                        </label>

                        <input
                            type="text"
                            placeholder="Search patient"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setShowSuggestions(true);
                            }}
                        />

                        {showSuggestions &&
                            filteredIssues.length > 0 && (

                                <div className="suggestion-box">

                                    {filteredIssues.map(issue => (

                                        <div
                                            key={issue._id}
                                            className="suggestion-item"
                                            onClick={() =>
                                                handleSelectIssue(issue)
                                            }
                                        >

                                            {issue.patient?.patientName}

                                        </div>

                                    ))}

                                </div>

                            )}

                    </div>

                    {/* ITEM SELECT */}

                    <div className="input-field">

                        <label>Select Item</label>

                        <select
                            value={form.itemId}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    itemId: e.target.value
                                })
                            }
                            disabled={!selectedIssue}
                        >

                            <option value="">
                                Select Item
                            </option>

                            {selectedIssue?.items.map(i => (

                                <option
                                    key={i.item._id}
                                    value={i.item._id}
                                >

                                    {i.item.itemName}
                                    {" "}
                                    (Remaining:
                                    {" "}
                                    {i.qty})

                                </option>

                            ))}

                        </select>

                    </div>

                    {/* RETURN QTY */}

                    <div className="input-field">

                        <label>Return Quantity</label>

                        <input
                            type="number"
                            min="1"
                            max={
                                selectedIssue?.items.find(
                                    i =>
                                        i.item._id ===
                                        form.itemId
                                )?.qty || 1
                            }
                            value={form.qty}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    qty: parseInt(e.target.value) || 1
                                })
                            }
                        />

                    </div>

                    {/* DAMAGE */}

                    <div className="input-field">

                        <label>Damage Charge (₹)</label>

                        <input
                            type="number"
                            min="0"
                            value={form.damageCharge}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    damageCharge:
                                        parseInt(
                                            e.target.value
                                        ) || 0
                                })
                            }
                        />

                    </div>

                    <button
                        type="submit"
                        className="submit-btn"
                        disabled={loading}
                    >

                        {loading
                            ? "Processing..."
                            : "Confirm Return"}

                    </button>

                    {error && (

                        <div className="alert error-alert">

                            <AlertCircle size={16} />
                            {" "}
                            {error}

                        </div>

                    )}

                    {success && (

                        <div className="alert success-alert">

                            <CheckCircle size={16} />
                            {" "}
                            {success}

                        </div>

                    )}

                </form>

            </div>

            {/* RETURN HISTORY */}

            <div className="card">

                <h2>Return History</h2>

                <div className="return-history-list">

                    {returns.map(r => (

                        <div
                            key={r._id}
                            className="return-history-card"
                        >

                            <div>
                                <strong>Patient:</strong>
                                {" "}
                                {r.issue?.patient?.patientName}
                            </div>

                            <div>
                                <strong>Item:</strong>
                                {" "}
                                {r.itemId?.itemName}
                            </div>

                            <div>
                                <strong>Qty:</strong>
                                {" "}
                                {r.qty}
                            </div>

                            <div>
                                <strong>Damage:</strong>
                                {" "}
                                ₹{r.damageCharge}
                            </div>

                            <div>
                                <strong>Refund:</strong>
                                {" "}
                                ₹{r.refundAmount}
                            </div>

                            <div>
                                <strong>Date:</strong>
                                {" "}
                                {new Date(
                                    r.createdAt
                                ).toLocaleDateString()}
                            </div>

                        </div>

                    ))}

                </div>

            </div>

        </div>

    );

};

export default ReturnItem;