import { useEffect, useState, useMemo } from "react";
import API from "../api";
import "./ReturnItem.css";
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
    Edit,
    Filter,
    ChevronDown,
    DollarSign,
    Package,
    CheckCircle,
    AlertCircle,
    RotateCcw,
    Archive,
    TrendingUp, Clock
} from "react-feather";


const IssueItem = () => {
    const [patients, setPatients] = useState([]);
    const [items, setItems] = useState([]);
    const [issues, setIssues] = useState([]);
    const [returns, setReturns] = useState([]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [showForm, setShowForm] = useState(false);
    const [showReturnModal, setShowReturnModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedIssue, setSelectedIssue] = useState(null);
    const [selectedReturn, setSelectedReturn] = useState(null);

    const [searchTerm, setSearchTerm] = useState("");
    const [showSuggestions, setShowSuggestions] = useState(false);

    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const [editingId, setEditingId] = useState(null);

    const [manualDeposit, setManualDeposit] = useState(false);
    const [historySearch, setHistorySearch] = useState("");

    const [filterStatus, setFilterStatus] = useState("all"); // all, active, returned, partially
    const [showFilters, setShowFilters] = useState(false);
    // const [viewMode, setViewMode] = useState("cards"); // cards or table
    const [activeTab, setActiveTab] = useState("issues"); // issues or returns

    // Return form state
    const [returnForm, setReturnForm] = useState({
        issueId: "",
        items: [],
        totalRefund: 0,
        totalDamageCharge: 0
    });

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

    // Helper function to normalize return data (handle both old and new structure)
    const normalizeReturnData = (returnData) => {
        // Check if it's old structure (has itemId directly)
        if (returnData.itemId) {
            return {
                _id: returnData._id,
                issue: returnData.issue,
                patient: returnData.patient,
                items: [{
                    itemId: returnData.itemId,
                    itemName: returnData.itemName,
                    qty: returnData.qty,
                    depositPerItem: returnData.depositPerItem,
                    damageCharge: returnData.damageCharge || 0,
                    refundAmount: returnData.refundAmount || 0
                }],
                totalRefund: returnData.refundAmount || 0,
                totalDamageCharge: returnData.damageCharge || 0,
                returnDate: returnData.createdAt || returnData.returnDate,
                createdAt: returnData.createdAt,
                updatedAt: returnData.updatedAt
            };
        }
        // New structure (has items array)
        return returnData;
    };

    const fetchAllData = async () => {
        try {
            setLoading(true);
            const [pRes, iRes, issueRes, returnRes] = await Promise.all([
                API.get("/patients"),
                API.get("/items"),
                API.get("/issues"),
                API.get("/returns")
            ]);

            setPatients(pRes.data);
            setItems(iRes.data);
            setIssues(issueRes.data);

            // Normalize return data for backward compatibility
            const normalizedReturns = returnRes.data.map(normalizeReturnData);
            setReturns(normalizedReturns);

        } catch (err) {
            setError("Failed to fetch data" + err);
        } finally {
            setLoading(false);
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



    const handleReturnClick = (issue) => {
        setSelectedIssue(issue);
        // Initialize return form with issue items
        const returnItems = issue.items.map(item => ({
            itemId: item.item._id,
            itemName: item.item.itemName,
            originalQty: item.qty,
            returnedQty: item.returnedQty || 0,
            remainingQty: item.qty - (item.returnedQty || 0),
            depositPerItem: item.deposit || 0,
            returnQty: 0,
            damageCharge: 0
        }));

        setReturnForm({
            issueId: issue._id,
            items: returnItems,
            totalRefund: 0,
            totalDamageCharge: 0
        });
        setShowReturnModal(true);
    };

    const handleReturnItemChange = (index, field, value) => {
        const updatedItems = [...returnForm.items];
        updatedItems[index][field] = value === "" ? 0 : Number(value);

        // Calculate totals
        const totalRefund = updatedItems.reduce((sum, item) => {
            const refundAmount = (item.returnQty || 0) * (item.depositPerItem || 0);
            return sum + refundAmount;
        }, 0);

        const totalDamage = updatedItems.reduce((sum, item) => sum + (item.damageCharge || 0), 0);

        setReturnForm({
            ...returnForm,
            items: updatedItems,
            totalRefund,
            totalDamageCharge: totalDamage
        });
    };

    const handleSubmitReturn = async () => {
        try {
            setLoading(true);

            // Filter items with return quantity > 0
            const returnItems = returnForm.items
                .filter(item => item.returnQty > 0)
                .map(item => ({
                    itemId: item.itemId,
                    qty: item.returnQty,
                    damageCharge: item.damageCharge || 0
                }));

            if (returnItems.length === 0) {
                setError("Please select at least one item to return");
                return;
            }

            // Submit return (your API will handle both old and new structure)
            await API.post("/issues/return", {
                issueId: selectedIssue._id,
                items: returnItems
            });

            setSuccess("Return processed successfully");
            setShowReturnModal(false);
            fetchAllData();
            setTimeout(() => setSuccess(""), 3000);
        } catch (err) {
            setError("Return failed"+err);
        } finally {
            setLoading(false);
        }
    };

    const handleViewReturns = (issue) => {
        // Find all returns for this issue (both old and new structure)
        const issueReturns = returns.filter(r => {
            if (r.issue === issue._id) return true;
            if (r.issue?._id === issue._id) return true;
            return false;
        });

        setSelectedIssue(issue);
        setSelectedReturn(issueReturns);
        setShowDetailsModal(true);
    };

    const filteredIssues = issues.filter(issue => {
        const issueDate = new Date(issue.createdAt);
        if (startDate && issueDate < new Date(startDate)) return false;
        if (endDate && issueDate > new Date(endDate)) return false;

        if (filterStatus !== "all") {
            if (filterStatus === "active" && issue.isReturned) return false;
            if (filterStatus === "returned" && !issue.isReturned) return false;
            if (filterStatus === "partially") {
                const partiallyReturned = issue.items?.some(item =>
                    (item.returnedQty || 0) > 0 && (item.returnedQty || 0) < item.qty
                );
                if (!partiallyReturned) return false;
            }
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

    const filteredReturns = returns.filter(ret => {
        const returnDate = new Date(ret.returnDate || ret.createdAt);
        if (startDate && returnDate < new Date(startDate)) return false;
        if (endDate && returnDate > new Date(endDate)) return false;

        if (historySearch) {
            const patientMatch = ret.patient?.patientName
                ?.toLowerCase()
                .includes(historySearch.toLowerCase());
            const itemMatch = ret.items?.some(i =>
                i.itemName?.toLowerCase().includes(historySearch.toLowerCase())
            );
            if (!patientMatch && !itemMatch) return false;
        }
        return true;
    });

    const getSummaryStats = () => {
        const totalDeposits = issues.reduce((sum, issue) => sum + (issue.totalDeposit || 0), 0);
        const totalReturns = returns.reduce((sum, ret) => sum + (ret.totalRefund || 0), 0);
        const totalDamage = returns.reduce((sum, ret) => sum + (ret.totalDamageCharge || 0), 0);

        const activeIssues = issues.filter(i => !i.isReturned).length;
        const partiallyReturned = issues.filter(i =>
            i.items?.some(item => (item.returnedQty || 0) > 0 && (item.returnedQty || 0) < item.qty)
        ).length;
        const fullyReturned = issues.filter(i => i.isReturned).length;

        return {
            totalDeposits,
            totalReturns,
            totalDamage,
            activeIssues,
            partiallyReturned,
            fullyReturned,
            totalIssues: issues.length,
            totalReturns_count: returns.length
        };
    };

    const stats = getSummaryStats();

    return (
        <div className="issue-container">
            {/* Header Section with Stats */}
            <div className="dashboard-header">
                <div className="header-title">
                    <h1>Issue & Return Management</h1>
                    <p>Comprehensive tracking of all transactions</p>
                </div>

            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card gradient-blue">
                    <div className="stat-icon">
                        <Package />
                    </div>
                    <div className="stat-details">
                        <span className="stat-label">Total Issues</span>
                        <span className="stat-value">{stats.totalIssues}</span>
                    </div>
                </div>
                <div className="stat-card gradient-green">
                    <div className="stat-icon">
                        <CheckCircle />
                    </div>
                    <div className="stat-details">
                        <span className="stat-label">Active</span>
                        <span className="stat-value">{stats.activeIssues}</span>
                    </div>
                </div>
                <div className="stat-card gradient-orange">
                    <div className="stat-icon">
                        <TrendingUp />
                    </div>
                    <div className="stat-details">
                        <span className="stat-label">Partially Returned</span>
                        <span className="stat-value">{stats.partiallyReturned}</span>
                    </div>
                </div>
                <div className="stat-card gradient-purple">
                    <div className="stat-icon">
                        <Archive />
                    </div>
                    <div className="stat-details">
                        <span className="stat-label">Fully Returned</span>
                        <span className="stat-value">{stats.fullyReturned}</span>
                    </div>
                </div>
                <div className="stat-card gradient-teal">
                    <div className="stat-icon">
                        <RotateCcw />
                    </div>
                    <div className="stat-details">
                        <span className="stat-label">Total Returns</span>
                        <span className="stat-value">{stats.totalReturns_count}</span>
                    </div>
                </div>
                <div className="stat-card gradient-indigo">
                    <div className="stat-icon">
                        <DollarSign />
                    </div>
                    <div className="stat-details">
                        <span className="stat-label">Net Deposit</span>
                        <span className="stat-value">₹{(stats.totalDeposits - stats.totalReturns).toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="tabs-container">
                <div className="tabs">
                    <button
                        className={`tab ${activeTab === 'issues' ? 'active' : ''}`}
                        onClick={() => setActiveTab('issues')}
                    >
                        <Package size={16} />
                        <span>Issues</span>
                    </button>
                    <button
                        className={`tab ${activeTab === 'returns' ? 'active' : ''}`}
                        onClick={() => setActiveTab('returns')}
                    >
                        <RotateCcw size={16} />
                        <span>Returns</span>
                    </button>
                </div>
            </div>

            {/* Filters Section */}
            <div className="filters-section">
                <div className="filters-header" onClick={() => setShowFilters(!showFilters)}>
                    <div className="filters-title">
                        <Filter size={18} />
                        <h3>Advanced Filters</h3>
                    </div>
                    <ChevronDown size={18} className={showFilters ? "rotated" : ""} />
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
                                    className={`status-btn ${filterStatus === 'partially' ? 'active' : ''}`}
                                    onClick={() => setFilterStatus('partially')}
                                >
                                    Partial
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

            {/* Content based on active tab */}
            {activeTab === 'issues' ? (
                <>
                    {/* Issues List */}
                    <div className="issues-list">
                        {filteredIssues.length === 0 ? (
                            <div className="empty-state">
                                <Package size={48} />
                                <h3>No Issues Found</h3>
                                <p>Get started by creating a new issue</p>

                            </div>
                        ) : (
                            filteredIssues.map((issue) => {
                                const totalReturned = issue.items?.reduce((sum, item) =>
                                    sum + (item.returnedQty || 0), 0
                                ) || 0;
                                const totalIssued = issue.items?.reduce((sum, item) =>
                                    sum + item.qty, 0
                                ) || 0;
                                const returnPercentage = totalIssued ? (totalReturned / totalIssued) * 100 : 0;

                                return (
                                    <div key={issue._id} className={`issue-card ${issue.isReturned ? 'returned' : 'active'}`}>
                                        <div className="issue-card-header">
                                            <div className="receipt-info">
                                                <Hash size={16} />
                                                <span className="receipt-number">Receipt: {issue.receiptNo || "-"}</span>
                                            </div>
                                            <div className="header-badges">
                                                <span className={`status-badge ${issue.isReturned ? 'returned' : 'active'}`}>
                                                    {issue.isReturned ? 'Returned' : 'Active'}
                                                </span>
                                                {returnPercentage > 0 && returnPercentage < 100 && (
                                                    <span className="status-badge partial">
                                                        Partial Return
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="issue-card-body">
                                            <div className="patient-info-compact">
                                                <div className="patient-avatar">
                                                    <User size={20} />
                                                </div>
                                                <div className="patient-details">
                                                    <h4>{issue.patient?.patientName}</h4>
                                                    <div className="patient-meta">
                                                        <span><Phone size={12} /> {issue.patient?.mobile}</span>
                                                        <span><Calendar size={12} /> {new Date(issue.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Progress Bar */}
                                            {!issue.isReturned && totalIssued > 0 && (
                                                <div className="return-progress">
                                                    <div className="progress-bar">
                                                        <div
                                                            className="progress-fill"
                                                            style={{ width: `${returnPercentage}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="progress-text">
                                                        {totalReturned} of {totalIssued} items returned
                                                    </span>
                                                </div>
                                            )}

                                            <div className="items-preview">
                                                {issue.items?.slice(0, 2).map((item, idx) => (
                                                    <div key={idx} className="preview-item">
                                                        <span className="item-name">{item.item?.itemName}</span>
                                                        <span className="item-qty">Qty: {item.qty}</span>
                                                        {(item.returnedQty || 0) > 0 && (
                                                            <span className="item-returned">(Returned: {item.returnedQty})</span>
                                                        )}
                                                    </div>
                                                ))}
                                                {issue.items?.length > 2 && (
                                                    <div className="more-items">+{issue.items.length - 2} more</div>
                                                )}
                                            </div>

                                            {issue.remarks && (
                                                <div className="remarks-tag">
                                                    <FileText size={12} />
                                                    <span>{issue.remarks}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="issue-card-footer">
                                            <div className="deposit-info">
                                                <span className="label">Deposit:</span>
                                                <span className="amount">₹{issue.totalDeposit?.toLocaleString()}</span>
                                            </div>
                                            <div className="card-actions">
                                                <button
                                                    className="icon-btn view"
                                                    onClick={() => handleViewReturns(issue)}
                                                    title="View Returns"
                                                >
                                                    <Clock size={16} />
                                                </button>
                                                <button
                                                    className="icon-btn edit"
                                                    onClick={() => handleEdit(issue)}
                                                    title="Edit Issue"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                {!issue.isReturned && (
                                                    <button
                                                        className="action-btn return"
                                                        onClick={() => handleReturnClick(issue)}
                                                    >
                                                        <RotateCcw size={14} />
                                                        <span>Return</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </>
            ) : (
                <>
                    {/* Returns List */}
                    <div className="returns-list">
                        {filteredReturns.length === 0 ? (
                            <div className="empty-state">
                                <RotateCcw size={48} />
                                <h3>No Returns Found</h3>
                                <p>Returns will appear here once processed</p>
                            </div>
                        ) : (
                            filteredReturns.map((ret) => (
                                <div key={ret._id} className="return-card">
                                    <div className="return-card-header">
                                        <div className="return-title">
                                            <RotateCcw size={16} />
                                            <span>Return #{ret._id.slice(-6)}</span>
                                        </div>
                                        <span className="return-date">
                                            {new Date(ret.returnDate || ret.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>

                                    <div className="return-card-body">
                                        <div className="return-patient">
                                            <User size={14} />
                                            <span>{ret.patient?.patientName || 'N/A'}</span>
                                        </div>

                                        <div className="return-items">
                                            {ret.items?.map((item, idx) => (
                                                <div key={idx} className="return-item">
                                                    <div className="return-item-name">
                                                        <Package size={12} />
                                                        <span>{item.itemName || 'Item'}</span>
                                                    </div>
                                                    <div className="return-item-details">
                                                        <span className="return-qty">Qty: {item.qty}</span>
                                                        {item.damageCharge > 0 && (
                                                            <span className="damage-charge">Damage: ₹{item.damageCharge}</span>
                                                        )}
                                                        <span className="refund-amount">Refund: ₹{item.refundAmount || 0}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="return-summary">
                                            <div className="summary-row">
                                                <span>Total Refund:</span>
                                                <span className="refund-total">₹{ret.totalRefund?.toLocaleString() || 0}</span>
                                            </div>
                                            {ret.totalDamageCharge > 0 && (
                                                <div className="summary-row damage">
                                                    <span>Damage Charges:</span>
                                                    <span>-₹{ret.totalDamageCharge?.toLocaleString()}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </>
            )}

            {/* Return Modal */}
            {showReturnModal && selectedIssue && (
                <div className="modal-overlay">
                    <div className="modal-content large">
                        <div className="modal-header">
                            <h2>Process Return</h2>
                            <button className="close-btn" onClick={() => setShowReturnModal(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="return-info">
                                <div className="info-block">
                                    <label>Patient</label>
                                    <span>{selectedIssue.patient?.patientName}</span>
                                </div>
                                <div className="info-block">
                                    <label>Receipt No</label>
                                    <span>{selectedIssue.receiptNo}</span>
                                </div>
                            </div>

                            <div className="return-items-list">
                                <h3>Select Items to Return</h3>
                                {returnForm.items.map((item, index) => (
                                    <div key={index} className="return-item-row">
                                        <div className="item-info">
                                            <strong>{item.itemName}</strong>
                                            <div className="item-stats">
                                                <span className="issued">Issued: {item.originalQty}</span>
                                                <span className="returned">Returned: {item.returnedQty}</span>
                                                <span className="remaining">Remaining: {item.remainingQty}</span>
                                            </div>
                                        </div>

                                        {item.remainingQty > 0 && (
                                            <div className="return-inputs">
                                                <div className="input-group">
                                                    <label>Return Qty</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max={item.remainingQty}
                                                        value={item.returnQty}
                                                        onChange={(e) => handleReturnItemChange(index, 'returnQty', e.target.value)}
                                                    />
                                                </div>
                                                <div className="input-group">
                                                    <label>Damage Charge</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={item.damageCharge}
                                                        onChange={(e) => handleReturnItemChange(index, 'damageCharge', e.target.value)}
                                                    />
                                                </div>
                                                <div className="input-group">
                                                    <label>Refund</label>
                                                    <input
                                                        type="text"
                                                        value={`₹${(item.returnQty * item.depositPerItem).toFixed(2)}`}
                                                        disabled
                                                        className="refund-preview"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="return-summary-card">
                                <div className="summary-row">
                                    <span>Total Refund Amount:</span>
                                    <span className="amount">₹{returnForm.totalRefund.toLocaleString()}</span>
                                </div>
                                <div className="summary-row damage">
                                    <span>Total Damage Charges:</span>
                                    <span className="amount">-₹{returnForm.totalDamageCharge.toLocaleString()}</span>
                                </div>
                                <div className="summary-row total">
                                    <span>Net Refund:</span>
                                    <span className="amount">₹{(returnForm.totalRefund - returnForm.totalDamageCharge).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="secondary-btn" onClick={() => setShowReturnModal(false)}>
                                Cancel
                            </button>
                            <button
                                className="primary-btn"
                                onClick={handleSubmitReturn}
                                disabled={loading}
                            >
                                {loading ? 'Processing...' : 'Confirm Return'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Details Modal for Viewing Returns */}
            {showDetailsModal && selectedIssue && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Return History</h2>
                            <button className="close-btn" onClick={() => setShowDetailsModal(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="issue-summary">
                                <h3>{selectedIssue.patient?.patientName}</h3>
                                <p>Receipt: {selectedIssue.receiptNo}</p>
                            </div>

                            {selectedReturn && selectedReturn.length > 0 ? (
                                <div className="returns-timeline">
                                    {selectedReturn.map((ret, idx) => (
                                        <div key={idx} className="timeline-item">
                                            <div className="timeline-marker"></div>
                                            <div className="timeline-content">
                                                <div className="timeline-header">
                                                    <span className="timeline-date">
                                                        {new Date(ret.returnDate || ret.createdAt).toLocaleString()}
                                                    </span>
                                                </div>
                                                {ret.items?.map((item, itemIdx) => (
                                                    <div key={itemIdx} className="timeline-item-detail">
                                                        <span className="item-name">{item.itemName}</span>
                                                        <span className="item-qty">Qty: {item.qty}</span>
                                                        {item.damageCharge > 0 && (
                                                            <span className="item-damage">Damage: ₹{item.damageCharge}</span>
                                                        )}
                                                        <span className="item-refund">Refund: ₹{item.refundAmount || 0}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-returns">
                                    <RotateCcw size={32} />
                                    <p>No returns found for this issue</p>
                                </div>
                            )}
                        </div>

                        <div className="modal-footer">
                            <button className="primary-btn" onClick={() => setShowDetailsModal(false)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Form Modal (existing) */}
            {showForm && (
                <div className="modal-overlay">
                    <div className="modal-content large">
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
                                                    rows="2"
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
                                                <FileSignature size={16} />
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
                                        {form.selectedItems.map((entry, index) => {
                                            const selectedItem = items.find(i => i._id === entry.itemId);
                                            return (
                                                <div key={index} className="item-row enhanced">
                                                    <div className="item-select">
                                                        <select
                                                            value={entry.itemId}
                                                            onChange={(e) => handleItemChange(index, "itemId", e.target.value)}
                                                        >
                                                            <option value="">Select Item</option>
                                                            {items.map((i) => (
                                                                <option key={i._id} value={i._id}>
                                                                    {i.itemName} (₹{i.depositPerItem} | Stock: {i.totalStock})
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
                                                    {selectedItem && (
                                                        <div className="item-preview">
                                                            <span>Deposit: ₹{selectedItem.depositPerItem * entry.qty}</span>
                                                        </div>
                                                    )}
                                                    <button
                                                        type="button"
                                                        className="remove-item-btn"
                                                        onClick={() => removeItemRow(index)}
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            );
                                        })}

                                        {form.selectedItems.length === 0 && (
                                            <div className="empty-items">
                                                <Package size={24} />
                                                <p>No items added yet. Click "Add Item" to start.</p>
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
                                        {!manualDeposit && (
                                            <small className="auto-calc">Auto-calculated from items</small>
                                        )}
                                    </div>
                                </div>
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
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default IssueItem;   