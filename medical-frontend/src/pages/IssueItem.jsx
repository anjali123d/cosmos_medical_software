import { useEffect, useState, useMemo, useRef } from "react";
import API from "../api";
import "./IssueItem.css";
import { FileText, RefreshCcw, X } from "react-feather";
const IssueItem = () => {
    const [patients, setPatients] = useState([]);
    const [items, setItems] = useState([]);
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [showForm, setShowForm] = useState(false);

    const [searchTerm, setSearchTerm] = useState("");
    const [showSuggestions, setShowSuggestions] = useState(false);
    const wrapperRef = useRef(null);

    // Date filter
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const [editingId, setEditingId] = useState(null);

    const [form, setForm] = useState({
        receiptNo: "",
        reference: "",
        remarks: "",
        patientName: "",
        mobile: "",
        address: "",
        renewDate: "",
        selectedItems: [],
        totalDeposit: 0
    });

    // ===============================
    // Fetch all data
    // ===============================
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
            setError("Failed to fetch data");
        }
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    // ===============================
    // Patient autocomplete
    // ===============================
    const filteredPatients = useMemo(() => {
        if (!searchTerm) return [];
        return patients.filter(p =>
            p.patientName?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [patients, searchTerm]);

    const handleSelectPatient = (patient) => {
        setForm({
            ...form,
            patientName: patient.patientName,
            mobile: patient.mobile,
            address: patient.address
        });
        setSearchTerm(patient.patientName);
        setShowSuggestions(false);
    };

    // ===============================
    // Add / remove item rows
    // ===============================
    const addItemRow = () => {
        setForm(prev => ({
            ...prev,
            selectedItems: [...prev.selectedItems, { itemId: "", qty: 1 }]
        }));
    };

    const removeItemRow = (index) => {
        const updated = [...form.selectedItems];
        updated.splice(index, 1);
        setForm(prev => ({ ...prev, selectedItems: updated }));
    };

    const handleItemChange = (index, field, value) => {
        const updated = [...form.selectedItems];
        updated[index][field] = value;
        setForm(prev => ({ ...prev, selectedItems: updated }));
    };

    // ===============================
    // Auto calculate total deposit
    // ===============================
    useEffect(() => {
        const total = form.selectedItems.reduce((sum, entry) => {
            const item = items.find(i => i._id === entry.itemId);
            const qty = Number(entry.qty) || 0;
            return sum + ((item?.depositPerItem || 0) * qty);
        }, 0);
        setForm(prev => ({ ...prev, totalDeposit: total }));
    }, [form.selectedItems, items]);

    // ===============================
    // Submit form
    // ===============================
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!form.receiptNo || !form.patientName || !form.mobile || !form.address || form.selectedItems.length === 0) {
            setError("All fields are required");
            return;
        }

        try {
            setLoading(true);

            let existingPatient = patients.find(p => p.mobile === form.mobile);
            let patientId;

            if (!existingPatient) {

                const newPatient = await API.post("/patients", {
                    patientName: form.patientName,
                    mobile: form.mobile,
                    address: form.address
                });

                patientId = newPatient.data._id;
                setPatients(prev => [...prev, newPatient.data]);

            } else {
                patientId = existingPatient._id;
            }

            const issueData = {
                receiptNo: form.receiptNo,
                reference: form.reference,
                remarks: form.remarks,
                patient: patientId,
                items: form.selectedItems.map(i => ({
                    item: i.itemId,
                    qty: Number(i.qty)
                })),
                renewDate: form.renewDate || null
            };

            if (editingId) {
                await API.put(`/issues/${editingId}`, issueData);
            } else {
                await API.post("/issues", issueData);
            }

            setSuccess(editingId ? "Issue updated successfully" : "Issue created successfully");

            setForm({
                receiptNo: "",
                reference: "",
                remarks: "",
                patientName: "",
                mobile: "",
                address: "",
                renewDate: "",
                selectedItems: [],
                totalDeposit: 0
            });

            setEditingId(null);
            setShowForm(false);

            fetchAllData();

            setTimeout(() => setSuccess(""), 3000);

        } catch {
            setError("Transaction failed");
        } finally {
            setLoading(false);
        }
    };

    // ===============================
    // Edit / Delete
    // ===============================
    const handleEdit = (issue) => {
        setEditingId(issue._id);
        setForm({
            receiptNo: issue.receiptNo,
            reference: issue.reference,
            remarks: issue.remarks,
            patientName: issue.patient?.patientName || "",
            mobile: issue.patient?.mobile || "",
            address: issue.patient?.address || "",
            renewDate: issue.renewDate ? issue.renewDate.split("T")[0] : "",
            selectedItems: issue.items.map(i => ({
                itemId: i.item._id,
                qty: i.qty
            })),
            totalDeposit: issue.totalDeposit
        });
        setShowForm(true);
    };

    const handleDelete = async (issue) => {

        if (!window.confirm("Are you sure you want to delete this issue?")) return;

        try {

            await API.delete(`/issues/${issue._id}`);

            fetchAllData();

        } catch {

            setError("Could not delete issue");

        }
    };

    // ===============================
    // Date filtering
    // ===============================
    const filteredIssues = issues.filter(issue => {
        const issueDate = new Date(issue.createdAt);
        if (startDate && issueDate < new Date(startDate)) return false;
        if (endDate && issueDate > new Date(endDate)) return false;
        return true;
    });

    return (
        <div className="issue-container">
            <div className="history-header">
                <h2>Transaction History</h2>
                <button className="add-btn" onClick={() => { setShowForm(true); setEditingId(null); }}>
                    + New Issue
                </button>
            </div>

            {/* Date Filter */}
            <div className="date-filter">
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>

            {/* Issue List */}
            <div className="history-card">
                <div className="history-list">
                    {filteredIssues.map(issue => (
                        <div key={issue._id} className="history-item">

                            <div>

                                <div className="receipt-no">
                                    Receipt: {issue.receiptNo || "-"}
                                </div>

                                <strong>{issue.patient?.patientName || "Unknown"}</strong>

                                <span className={issue.isReturned ? "returned-badge" : "issued-badge"}>
                                    {issue.isReturned ? "Returned" : "Issued"}
                                </span>

                                <div className="issue-date">
                                    {new Date(issue.createdAt).toLocaleDateString()}
                                </div>

                                <div>
                                    {issue.items?.map(i => `${i.item?.itemName} x ${i.qty}`).join(", ")}
                                </div>

                                {issue.remarks && (
                                    <div className="remarks">
                                        <FileText size={14} /> {issue.remarks}
                                    </div>
                                )}

                                {issue.renewDate && (
                                    <div className="renew-date">
                                        <RefreshCcw size={14} /> Renew: {issue.renewDate.split("T")[0]}
                                    </div>
                                )}

                            </div>

                            <div>

                                ₹{issue.totalDeposit}

                                <div className="action-buttons">
                                    <button className="edit-btn" onClick={() => handleEdit(issue)}>
                                        Edit
                                    </button>

                                    <button className="delete-btn" onClick={() => handleDelete(issue)}>
                                        Delete
                                    </button>
                                </div>

                            </div>

                        </div>
                    ))}
                </div>
            </div>

            {/* Modal */}
            {showForm && (
                <div className="modal-overlay">
                    <div className="modal-card">
                        <div className="modal-header">
                            <h3>{editingId ? "Edit Issue" : "New Issue Entry"}</h3>
                            <button className="close-btn" onClick={() => setShowForm(false)}>
                                <X size={18} />
                            </button>
                        </div>

                        <form className="modal-form" onSubmit={handleSubmit}>
                            {/* Patient Autocomplete */}
                            <div className="form-group">
                                <label>Patient Name</label>
                                <input
                                    type="text"
                                    value={form.patientName}
                                    onChange={e => { setForm({ ...form, patientName: e.target.value }); setSearchTerm(e.target.value); setShowSuggestions(true); }}
                                    autoComplete="off"
                                />
                                {showSuggestions && filteredPatients.length > 0 && (
                                    <div className="suggestion-box">
                                        {filteredPatients.map(p => (
                                            <div key={p._id} className="suggestion-item" onClick={() => handleSelectPatient(p)}>
                                                {p.patientName} ({p.mobile})
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="form-group"><label>Mobile</label>
                                <input type="text" value={form.mobile} onChange={e => setForm({ ...form, mobile: e.target.value })} />
                            </div>

                            <div className="form-group full"><label>Address</label>
                                <textarea value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}></textarea>
                            </div>
                            <div className="form-group full">
                                <label>Receipt Number</label>
                                <input
                                    type="text"
                                    value={form.receiptNo}
                                    onChange={e => setForm({ ...form, receiptNo: e.target.value })}
                                    placeholder="Enter Receipt Number"
                                />
                            </div>
                            <div className="form-group"><label>Reference</label>
                                <input type="text" value={form.reference} onChange={e => setForm({ ...form, reference: e.target.value })} />
                            </div>

                            <div className="form-group"><label>Remarks</label>
                                <input type="text" value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} />
                            </div>

                            <div className="form-group"><label>Renew Date</label>
                                <input type="date" value={form.renewDate} onChange={e => setForm({ ...form, renewDate: e.target.value })} />
                            </div>

                            {/* Items */}
                            <div className="form-group full">
                                <label>Items</label>
                                {form.selectedItems.map((entry, index) => (
                                    <div key={index} className="item-row">
                                        <select value={entry.itemId} onChange={e => handleItemChange(index, "itemId", e.target.value)}>
                                            <option value="">Select Item</option>
                                            {items.map(i => (
                                                <option key={i._id} value={i._id}>{i.itemName} (Stock: {i.totalStock})</option>
                                            ))}
                                        </select>
                                        <input type="number" min="1" value={entry.qty} onChange={e => handleItemChange(index, "qty", Number(e.target.value))} />
                                        <button type="button" onClick={() => removeItemRow(index)}>Remove</button>
                                    </div>
                                ))}
                                <button type="button" onClick={addItemRow}>+ Add Item</button>
                            </div>

                            <div className="form-group"><label>Total Deposit</label>
                                <input type="number" value={form.totalDeposit} readOnly />
                            </div>

                            <button type="submit" className="submit-btn" disabled={loading}>
                                {loading ? "Processing..." : editingId ? "Update Issue" : "Confirm Issue"}
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