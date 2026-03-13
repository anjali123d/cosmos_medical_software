import { useEffect, useState, useMemo } from "react";
import API from "../api";
import "./IssueItem.css";
import {
    FileText,
    RefreshCcw,
    X,
    Plus,
    Search,
    Calendar,
    User,
    Phone,
    MapPin,
    Hash,
    // FileSignature,
    Edit,
    Trash2,
    Download,
    Filter,
    ChevronDown,
    DollarSign,
    Package,
    Clock,
    CheckCircle,
    AlertCircle
} from "react-feather";

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

    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const [editingId, setEditingId] = useState(null);

    const [manualDeposit, setManualDeposit] = useState(false);
    const [historySearch, setHistorySearch] = useState("");

    const [filterStatus, setFilterStatus] = useState("all"); // all, active, returned
    const [showFilters, setShowFilters] = useState(false);

    const initialForm = {
        receiptNo: "",
        reference: "",
        remarks: "",
        patientName: "",
        mobile: "",
        address: "",
        renewDate: "",
        selectedItems: [],
        totalDeposit: 0
    };

    const [form, setForm] = useState(initialForm);

    const resetForm = () => {
        setForm(initialForm);
        setManualDeposit(false);
        setEditingId(null);
    };

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
        } catch (err) {
            setError("Failed to fetch data");
        }
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    const filteredPatients = useMemo(() => {
        if (!searchTerm) return [];
        return patients.filter(p =>
            p.patientName?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [patients, searchTerm]);

    const handleSelectPatient = (patient) => {
        setForm(prev => ({
            ...prev,
            patientName: patient.patientName,
            mobile: patient.mobile,
            address: patient.address
        }));
        setSearchTerm(patient.patientName);
        setShowSuggestions(false);
    };

    const addItemRow = () => {
        setManualDeposit(false);
        setForm(prev => ({
            ...prev,
            selectedItems: [...prev.selectedItems, { itemId: "", qty: 1 }]
        }));
    };

    const removeItemRow = (index) => {
        setManualDeposit(false);
        const updated = [...form.selectedItems];
        updated.splice(index, 1);
        setForm(prev => ({
            ...prev,
            selectedItems: updated
        }));
    };

    const handleItemChange = (index, field, value) => {
        setManualDeposit(false);
        const updated = [...form.selectedItems];
        updated[index][field] = value;
        if (field === "itemId") {
            updated[index].qty = 1;
        }
        setForm(prev => ({
            ...prev,
            selectedItems: updated
        }));
    };

    useEffect(() => {
        if (manualDeposit) return;
        const total = form.selectedItems.reduce((sum, entry) => {
            const item = items.find(i => i._id === entry.itemId);
            const qty = Number(entry.qty) || 0;
            return sum + ((item?.depositPerItem || 0) * qty);
        }, 0);
        setForm(prev => ({
            ...prev,
            totalDeposit: total
        }));
    }, [form.selectedItems, items, manualDeposit]);

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
                renewDate: form.renewDate || null,
                totalDeposit: form.totalDeposit
            };

            if (editingId) {
                await API.put(`/issues/${editingId}`, issueData);
            } else {
                await API.post("/issues", issueData);
            }

            setSuccess(editingId ? "Issue updated successfully" : "Issue created successfully");
            resetForm();
            setShowForm(false);
            fetchAllData();
            setTimeout(() => setSuccess(""), 3000);
        } catch {
            setError("Transaction failed");
        } finally {
            setLoading(false);
        }
    };

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
        setManualDeposit(true);
        setShowForm(true);
    };

    const handleDelete = async (issue) => {
        if (!window.confirm("Delete this issue?")) return;
        try {
            await API.delete(`/issues/${issue._id}`);
            fetchAllData();
        } catch {
            setError("Could not delete issue");
        }
    };

    const handleReturn = async (issue, item) => {
        const returned = item.returnedQty || 0;
        const remaining = item.qty - returned;
        const qty = prompt(`Return quantity (max ${remaining})`);
        if (!qty) return;
        if (Number(qty) > remaining) {
            alert("Return qty cannot exceed remaining quantity");
            return;
        }
        const damageCharge = prompt("Damage charge (optional)") || 0;
        try {
            await API.post("/issues/return", {
                issueId: issue._id,
                items: [
                    {
                        itemId: item.item._id,
                        qty: Number(qty),
                        damageCharge: Number(damageCharge)
                    }
                ]
            });
            setSuccess("Return successful");
            fetchAllData();
        } catch {
            setError("Return failed");
        }
    };

    const filteredIssues = issues.filter(issue => {
        const issueDate = new Date(issue.createdAt);
        if (startDate && issueDate < new Date(startDate)) return false;
        if (endDate && issueDate > new Date(endDate)) return false;

        if (filterStatus !== "all") {
            if (filterStatus === "active" && issue.isReturned) return false;
            if (filterStatus === "returned" && !issue.isReturned) return false;
        }

        if (historySearch) {
            const patientMatch = issue.patient?.patientName
                ?.toLowerCase()
                .includes(historySearch.toLowerCase());
            const itemMatch = issue.items?.some(i =>
                i.item?.itemName
                    ?.toLowerCase()
                    .includes(historySearch.toLowerCase())
            );
            if (!patientMatch && !itemMatch) return false;
        }
        return true;
    });

    const getSummaryStats = () => {
        const totalDeposits = issues.reduce((sum, issue) => sum + (issue.totalDeposit || 0), 0);
        const activeIssues = issues.filter(i => !i.isReturned).length;
        const returnedIssues = issues.filter(i => i.isReturned).length;
        return { totalDeposits, activeIssues, returnedIssues, totalIssues: issues.length };
    };

    const stats = getSummaryStats();

    return (
        <div className="issue-container">
            {/* Header Section with Stats */}
            <div className="dashboard-header">
                <div className="header-title">
                    <h1>Issue Management</h1>
                    <p>Track and manage all issue transactions</p>
                </div>
                <button
                    className="primary-btn"
                    onClick={() => {
                        resetForm();
                        setShowForm(true);
                    }}
                >
                    <Plus size={18} />
                    <span>New Issue</span>
                </button>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon blue">
                        <Package />
                    </div>
                    <div className="stat-details">
                        <span className="stat-label">Total Issues</span>
                        <span className="stat-value">{stats.totalIssues}</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon green">
                        <CheckCircle />
                    </div>
                    <div className="stat-details">
                        <span className="stat-label">Active Issues</span>
                        <span className="stat-value">{stats.activeIssues}</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon orange">
                        <RefreshCcw />
                    </div>
                    <div className="stat-details">
                        <span className="stat-label">Returned</span>
                        <span className="stat-value">{stats.returnedIssues}</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon purple">
                        <DollarSign />
                    </div>
                    <div className="stat-details">
                        <span className="stat-label">Total Deposit</span>
                        <span className="stat-value">₹{stats.totalDeposits.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* Filters Section */}
            <div className="filters-section">
                <div className="filters-header">
                    <div className="filters-title">
                        <Filter size={18} />
                        <h3>Filters</h3>
                    </div>
                    <button
                        className="toggle-filters"
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <ChevronDown size={18} className={showFilters ? "rotated" : ""} />
                    </button>
                </div>

                {showFilters && (
                    <div className="filters-grid">
                        <div className="filter-group">
                            <label>Date Range</label>
                            <div className="date-inputs">
                                <div className="input-with-icon">
                                    <Calendar size={16} />
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        placeholder="Start Date"
                                    />
                                </div>
                                <span>to</span>
                                <div className="input-with-icon">
                                    <Calendar size={16} />
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        placeholder="End Date"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="filter-group">
                            <label>Status</label>
                            <div className="status-filters">
                                <button
                                    className={`status-btn ${filterStatus === 'all' ? 'active' : ''}`}
                                    onClick={() => setFilterStatus('all')}
                                >
                                    All
                                </button>
                                <button
                                    className={`status-btn ${filterStatus === 'active' ? 'active' : ''}`}
                                    onClick={() => setFilterStatus('active')}
                                >
                                    Active
                                </button>
                                <button
                                    className={`status-btn ${filterStatus === 'returned' ? 'active' : ''}`}
                                    onClick={() => setFilterStatus('returned')}
                                >
                                    Returned
                                </button>
                            </div>
                        </div>

                        <div className="filter-group search-filter">
                            <label>Search</label>
                            <div className="input-with-icon">
                                <Search size={16} />
                                <input
                                    type="text"
                                    placeholder="Search by patient or item..."
                                    value={historySearch}
                                    onChange={(e) => setHistorySearch(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Issues List */}
            <div className="issues-list">
                {filteredIssues.length === 0 ? (
                    <div className="empty-state">
                        <Package size={48} />
                        <h3>No Issues Found</h3>
                        <p>Get started by creating a new issue</p>
                        <button className="primary-btn" onClick={() => setShowForm(true)}>
                            <Plus size={18} />
                            <span>Create Issue</span>
                        </button>
                    </div>
                ) : (
                    filteredIssues.map((issue) => (
                        <div key={issue._id} className={`issue-card ${issue.isReturned ? 'returned' : 'active'}`}>
                            <div className="issue-card-header">
                                <div className="receipt-info">
                                    <Hash size={16} />
                                    <span className="receipt-number">Receipt: {issue.receiptNo || "-"}</span>
                                </div>
                                <span className={`status-badge ${issue.isReturned ? 'returned' : 'active'}`}>
                                    {issue.isReturned ? 'Returned' : 'Active'}
                                </span>
                            </div>

                            <div className="issue-card-body">
                                <div className="patient-info">
                                    <div className="info-row">
                                        <User size={16} />
                                        <h4>{issue.patient?.patientName}</h4>
                                    </div>
                                    <div className="info-row">
                                        <Phone size={16} />
                                        <span>{issue.patient?.mobile}</span>
                                    </div>
                                    <div className="info-row">
                                        <MapPin size={16} />
                                        <span>{issue.patient?.address}</span>
                                    </div>
                                    <div className="info-row">
                                        <Calendar size={16} />
                                        <span>Issued: {new Date(issue.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                <div className="items-section">
                                    <h5>Items Issued</h5>
                                    {issue.items?.map((item, index) => {
                                        const returned = item.returnedQty || 0;
                                        const remaining = item.qty - returned;
                                        return (
                                            <div key={index} className="item-detail">
                                                <div className="item-name">{item.item?.itemName}</div>
                                                <div className="item-quantities">
                                                    <span className="qty-badge issued">Issued: {item.qty}</span>
                                                    <span className="qty-badge returned">Returned: {returned}</span>
                                                    <span className="qty-badge remaining">Remaining: {remaining}</span>
                                                </div>
                                                <div className="item-amounts">
                                                    <span>Deposit: ₹{item.deposit || 0}</span>
                                                    <span>Refund: ₹{(item.deposit || 0) * returned}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {issue.remarks && (
                                    <div className="remarks-section">
                                        <FileText size={14} />
                                        <span>{issue.remarks}</span>
                                    </div>
                                )}

                                {issue.renewDate && (
                                    <div className="renew-section">
                                        <RefreshCcw size={14} />
                                        <span>Renew Date: {new Date(issue.renewDate).toLocaleDateString()}</span>
                                    </div>
                                )}
                            </div>

                            <div className="issue-card-footer">
                                <div className="deposit-amount">

                                    <span>Total Deposit: <strong>₹{issue.totalDeposit?.toLocaleString()}</strong></span>
                                </div>
                                <div className="action-buttons">
                                    <button
                                        className="icon-btn edit"
                                        onClick={() => handleEdit(issue)}
                                        title="Edit Issue"
                                    >
                                        <Edit size={16} />
                                    </button>
                                    <button
                                        className="icon-btn delete"
                                        onClick={() => handleDelete(issue)}
                                        title="Delete Issue"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                    {/* {!issue.isReturned && (
                                        <button
                                            className="return-btn"
                                            onClick={() => handleReturn(issue, issue.items[0])}
                                        >
                                            <RefreshCcw size={14} />
                                            <span>Return Item</span>
                                        </button>
                                    )} */}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>{editingId ? 'Edit Issue' : 'Create New Issue'}</h2>
                            <button className="close-btn" onClick={() => setShowForm(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="modal-form">
                            <div className="form-sections">
                                {/* Patient Information */}
                                <div className="form-section">
                                    <h3>Patient Information</h3>
                                    <div className="form-grid">
                                        <div className="form-field full-width">
                                            <label>Patient Name *</label>
                                            <div className="input-with-icon">
                                                <User size={16} />
                                                <input
                                                    type="text"
                                                    value={form.patientName}
                                                    onChange={(e) => {
                                                        setForm({ ...form, patientName: e.target.value });
                                                        setSearchTerm(e.target.value);
                                                        setShowSuggestions(true);
                                                    }}
                                                    placeholder="Enter patient name"
                                                />
                                            </div>
                                            {showSuggestions && filteredPatients.length > 0 && (
                                                <div className="suggestions-dropdown">
                                                    {filteredPatients.map((p) => (
                                                        <div
                                                            key={p._id}
                                                            className="suggestion-item"
                                                            onClick={() => handleSelectPatient(p)}
                                                        >
                                                            <strong>{p.patientName}</strong>
                                                            <span>{p.mobile}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="form-field">
                                            <label>Mobile *</label>
                                            <div className="input-with-icon">
                                                <Phone size={16} />
                                                <input
                                                    type="text"
                                                    value={form.mobile}
                                                    onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                                                    placeholder="Enter mobile number"
                                                />
                                            </div>
                                        </div>

                                        <div className="form-field full-width">
                                            <label>Address *</label>
                                            <div className="input-with-icon">
                                                <MapPin size={16} />
                                                <textarea
                                                    value={form.address}
                                                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                                                    placeholder="Enter complete address"
                                                    rows="3"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Issue Details */}
                                <div className="form-section">
                                    <h3>Issue Details</h3>
                                    <div className="form-grid">
                                        <div className="form-field">
                                            <label>Receipt Number *</label>
                                            <div className="input-with-icon">
                                                <Hash size={16} />
                                                <input
                                                    type="text"
                                                    value={form.receiptNo}
                                                    onChange={(e) => setForm({ ...form, receiptNo: e.target.value })}
                                                    placeholder="Enter receipt number"
                                                />
                                            </div>
                                        </div>

                                        <div className="form-field">
                                            <label>Reference</label>
                                            <div className="input-with-icon">

                                                <input
                                                    type="text"
                                                    value={form.reference}
                                                    onChange={(e) => setForm({ ...form, reference: e.target.value })}
                                                    placeholder="Reference (optional)"
                                                />
                                            </div>
                                        </div>

                                        <div className="form-field">
                                            <label>Remarks</label>
                                            <div className="input-with-icon">
                                                <FileText size={16} />
                                                <input
                                                    type="text"
                                                    value={form.remarks}
                                                    onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                                                    placeholder="Add remarks"
                                                />
                                            </div>
                                        </div>

                                        <div className="form-field">
                                            <label>Renew Date</label>
                                            <div className="input-with-icon">
                                                <RefreshCcw size={16} />
                                                <input
                                                    type="date"
                                                    value={form.renewDate}
                                                    onChange={(e) => setForm({ ...form, renewDate: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Items Section */}
                                <div className="form-section">
                                    <div className="section-header">
                                        <h3>Items *</h3>
                                        <button type="button" className="add-item-btn" onClick={addItemRow}>
                                            <Plus size={16} />
                                            <span>Add Item</span>
                                        </button>
                                    </div>

                                    <div className="items-container">
                                        {form.selectedItems.map((entry, index) => (
                                            <div key={index} className="item-row">
                                                <div className="item-select">
                                                    <select
                                                        value={entry.itemId}
                                                        onChange={(e) => handleItemChange(index, "itemId", e.target.value)}
                                                    >
                                                        <option value="">Select Item</option>
                                                        {items.map((i) => (
                                                            <option key={i._id} value={i._id}>
                                                                {i.itemName} (Stock: {i.totalStock})
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="item-qty">
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={entry.qty}
                                                        onChange={(e) => handleItemChange(index, "qty", Number(e.target.value))}
                                                        placeholder="Qty"
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    className="remove-item-btn"
                                                    onClick={() => removeItemRow(index)}
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ))}

                                        {form.selectedItems.length === 0 && (
                                            <div className="empty-items">
                                                <Package size={24} />
                                                <p>No items added yet</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Deposit Section */}
                                <div className="form-section deposit-section">
                                    <h3>Deposit Information</h3>
                                    <div className="deposit-field">
                                        <label>Total Deposit Amount</label>
                                        <div className="deposit-input">
                                            <span className="currency">₹</span>
                                            <input
                                                type="number"
                                                value={form.totalDeposit}
                                                onChange={(e) => {
                                                    setManualDeposit(true);
                                                    setForm({ ...form, totalDeposit: Number(e.target.value) });
                                                }}
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Form Actions */}
                            <div className="form-actions">
                                <button type="button" className="secondary-btn" onClick={() => setShowForm(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="primary-btn" disabled={loading}>
                                    {loading ? (
                                        <>Processing...</>
                                    ) : (
                                        <>{editingId ? 'Update Issue' : 'Create Issue'}</>
                                    )}
                                </button>
                            </div>

                            {/* Alerts */}
                            {error && (
                                <div className="alert error">
                                    <AlertCircle size={16} />
                                    <span>{error}</span>
                                </div>
                            )}
                            {success && (
                                <div className="alert success">
                                    <CheckCircle size={16} />
                                    <span>{success}</span>
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default IssueItem;