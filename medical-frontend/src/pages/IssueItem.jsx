import { useEffect, useState } from "react";
import API from "../api";
import "./IssueItem.css";

const IssueItem = () => {
    const [patients, setPatients] = useState([]);
    const [items, setItems] = useState([]);
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [form, setForm] = useState({
        patient: "",
        item: "",
        qty: 1
    });

    const selectedItem = items.find(i => i._id === form.item);

    /* ================= FETCH DATA ================= */
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
            setError("Failed to load data");
        }
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    /* ================= ISSUE ITEM ================= */
    const handleSubmit = async () => {
        setError("");

        if (!form.patient || !form.item) {
            setError("Please select patient and item");
            return;
        }

        if (form.qty < 1) {
            setError("Quantity must be at least 1");
            return;
        }

        if (selectedItem && form.qty > selectedItem.totalStock) {
            setError("Quantity exceeds available stock");
            return;
        }

        try {
            setLoading(true);

            await API.post("/issues", {
                patient: form.patient,
                item: form.item,
                qty: Number(form.qty)
            });

            alert("✅ Item Issued Successfully");

            setForm({ patient: "", item: "", qty: 1 });
            fetchAllData();
        } catch (err) {
            setError(err.response?.data?.message || "Issue failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page">

            {/* ================= ISSUE HISTORY ================= */}
            <div className="card">
                <h2>Issued Items History</h2>

                {issues.length === 0 ? (
                    <p>No items issued yet</p>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Patient</th>
                                <th>Item</th>
                                <th>Qty</th>
                                <th>Deposit (₹)</th>
                                <th>Status</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {issues.map((i, index) => (
                                <tr
                                    key={i._id}
                                    className={i.isReturned ? "returned-row" : ""}
                                >
                                    <td>{index + 1}</td>
                                    <td>{i.patient?.patientName}</td>
                                    <td>{i.item?.itemName}</td>
                                    <td>{i.qty}</td>
                                    <td>₹ {i.totalDeposit}</td>
                                    <td>
                                        {i.isReturned ? (
                                            <span className="status returned">Returned</span>
                                        ) : (
                                            <span className="status issued">Issued</span>
                                        )}
                                    </td>
                                    <td>{new Date(i.createdAt).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* ================= ISSUE FORM ================= */}
            <div className="card">
                <h2>Issue Medical Item</h2>

                {error && <p className="error">{error}</p>}

                <select
                    value={form.patient}
                    onChange={(e) =>
                        setForm({ ...form, patient: e.target.value })
                    }
                >
                    <option value="">Select Patient</option>
                    {patients.map(p => (
                        <option key={p._id} value={p._id}>
                            {p.patientName}
                        </option>
                    ))}
                </select>

                <select
                    value={form.item}
                    onChange={(e) =>
                        setForm({ ...form, item: e.target.value })
                    }
                >
                    <option value="">Select Item</option>
                    {items.map(i => (
                        <option key={i._id} value={i._id}>
                            {i.itemName} (Stock: {i.totalStock})
                        </option>
                    ))}
                </select>

                <input
                    type="number"
                    min="1"
                    value={form.qty}
                    onChange={(e) =>
                        setForm({ ...form, qty: e.target.value })
                    }
                />

                {selectedItem && (
                    <div className="info-box">
                        <p><strong>Available Stock:</strong> {selectedItem.totalStock}</p>
                        <p><strong>Deposit / Item:</strong> ₹{selectedItem.depositPerItem}</p>
                        <p className="total">
                            <strong>Total Deposit:</strong> ₹
                            {form.qty * selectedItem.depositPerItem}
                        </p>
                    </div>
                )}

                <button onClick={handleSubmit} disabled={loading}>
                    {loading ? "Issuing..." : "Issue Item"}
                </button>
            </div>
        </div>
    );
};

export default IssueItem;