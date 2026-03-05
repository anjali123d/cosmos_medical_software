import { useEffect, useState } from "react";
import API from "../api";
import "./AddItem.css";
import {
    Plus, Edit2, Trash2, Package,
    ArrowLeft, CheckCircle, AlertCircle, X
} from 'react-feather';
import { useNavigate } from "react-router-dom";

const AddItem = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        itemName: "",
        totalStock: "",
        depositPerItem: ""
    });

    const [items, setItems] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const fetchItems = async () => {
        try {
            const res = await API.get("/items");
            setItems(res.data);
        } catch {
            setError("Failed to load items");
        }
    };

    useEffect(() => {
        fetchItems();
    }, []);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const resetForm = () => {
        setForm({ itemName: "", totalStock: "", depositPerItem: "" });
        setEditingId(null);
        setError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!form.itemName || !form.totalStock || !form.depositPerItem) {
            setError("Please fill in all medical item details");
            return;
        }

        try {
            setLoading(true);
            if (editingId) {
                await API.put(`/items/${editingId}`, {
                    itemName: form.itemName,
                    totalStock: Number(form.totalStock),
                    depositPerItem: Number(form.depositPerItem)
                });
                setSuccess("Item updated successfully!");
            } else {
                await API.post("/items", {
                    itemName: form.itemName,
                    totalStock: Number(form.totalStock),
                    depositPerItem: Number(form.depositPerItem)
                });
                setSuccess("New item added to inventory!");
            }

            setTimeout(() => setSuccess(""), 3000);
            resetForm();
            fetchItems();
        } catch {
            setError("Operation failed. Check server connection.");
        } finally {
            setLoading(false);
        }
    };
    const [showForm, setShowForm] = useState(false);
    const handleEdit = (item) => {

        setForm({
            itemName: item.itemName,
            totalStock: item.totalStock,
            depositPerItem: item.depositPerItem
        });

        setEditingId(item._id);

        setShowForm(true); // modal open

    };
    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this item?")) return;
        try {
            await API.delete(`/items/${id}`);
            fetchItems();
        } catch {
            setError("Could not delete item.");
        }
    };

    return (
        <div className="add-item-container">
            {showForm && (

                <div className="modal-overlay">

                    <div className="modal-card">

                        <div className="modal-header">

                            <h3>{editingId ? "Edit Item" : "Add New Item"}</h3>

                            <button
                                className="close-btn"
                                onClick={() => setShowForm(false)}
                            >
                                <X size={18} />
                            </button>

                        </div>

                        <form onSubmit={handleSubmit} className="modal-form">

                            <div className="form-group">

                                <label>Item Name</label>

                                <input
                                    type="text"
                                    name="itemName"
                                    value={form.itemName}
                                    onChange={handleChange}
                                />

                            </div>

                            <div className="form-group">

                                <label>Total Stock</label>

                                <input
                                    type="number"
                                    name="totalStock"
                                    value={form.totalStock}
                                    onChange={handleChange}
                                />

                            </div>

                            <div className="form-group">

                                <label>Deposit Per Item</label>

                                <input
                                    type="number"
                                    name="depositPerItem"
                                    value={form.depositPerItem}
                                    onChange={handleChange}
                                />

                            </div>

                            <button
                                type="submit"
                                className="submit-btn"
                                disabled={loading}
                            >

                                {loading
                                    ? "Processing..."
                                    : editingId
                                        ? "Update Item"
                                        : "Add Item"}

                            </button>

                            {error && <div className="alert error">{error}</div>}
                            {success && <div className="alert success">{success}</div>}

                        </form>

                    </div>
                </div>

            )}
            {/* Header Area */}
            <div className="page-header">
                <div className="header-left">
                    <div>
                        <h1>Inventory Management</h1>

                    </div>
                </div>
            </div>

            <div className="content-layout">
                {/* Left Side: Form */}

                <button
                    className="add-btn"
                    onClick={() => {
                        resetForm();
                        setShowForm(true);
                    }}
                >
                    <Plus size={16} /> Add Item
                </button>
                {/* Right Side: List - Card Based Layout */}
                <div className="list-section">
                    <div className="glass-card">
                        <div className="list-header">
                            <h3>Current Inventory</h3>

                        </div>

                        <div className="items-grid">
                            {items.map((item) => (
                                <div
                                    key={item._id}
                                    className={`item-card ${item.totalStock <= 5 ? "low-stock" : ""}`}
                                >
                                    <div className="item-card-header">
                                        <div className="item-title">
                                            <div className="item-icon">
                                                <Package size={18} />
                                            </div>
                                            <h4>{item.itemName}</h4>
                                        </div>
                                        <div className="item-actions">
                                            <button
                                                className="icon-btn edit"
                                                onClick={() => handleEdit(item)}
                                                aria-label="Edit item"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                className="icon-btn delete"
                                                onClick={() => handleDelete(item._id)}
                                                aria-label="Delete item"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="item-details">
                                        <div className="detail-row">
                                            <span className="detail-label">Stock Quantity:</span>
                                            <span className={`detail-value stock-value ${item.totalStock <= 5 ? "low" : ""}`}>
                                                {item.totalStock} units
                                            </span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="detail-label">Deposit Amount:</span>
                                            <span className="detail-value deposit-value">
                                                ₹{item.depositPerItem}
                                            </span>
                                        </div>
                                    </div>


                                </div>
                            ))}

                            {items.length === 0 && (
                                <div className="empty-state">
                                    <Package size={48} />
                                    <p>No medical items found in records.</p>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddItem;