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

    const handleEdit = (item) => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setForm({
            itemName: item.itemName,
            totalStock: item.totalStock,
            depositPerItem: item.depositPerItem
        });
        setEditingId(item._id);
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
            {/* Header Area */}
            <div className="page-header">
                <div className="header-left">
                    <button className="back-btn" onClick={() => navigate("/")}>
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h1>Inventory Management</h1>
                        <p>Add or update medical supplies and equipment</p>
                    </div>
                </div>
            </div>

            <div className="content-layout">
                {/* Left Side: Form */}
                <div className="form-section">
                    <div className="glass-card">
                        <div className="card-header">
                            <div className="icon-box">
                                {editingId ? <Edit2 size={20} /> : <Plus size={20} />}
                            </div>
                            <h3>{editingId ? "Update Item" : "Create New Item"}</h3>
                        </div>

                        <form onSubmit={handleSubmit}>
                            {error && <div className="alert error"><AlertCircle size={18} /> {error}</div>}
                            {success && <div className="alert success"><CheckCircle size={18} /> {success}</div>}

                            <div className="input-group">
                                <label>Item Name</label>
                                <input
                                    name="itemName"
                                    placeholder="e.g. Oxygen Cylinder"
                                    value={form.itemName}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="input-row">
                                <div className="input-group">
                                    <label>Total Stock</label>
                                    <input
                                        name="totalStock"
                                        type="number"
                                        placeholder="0"
                                        value={form.totalStock}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="input-group">
                                    <label>Deposit (₹)</label>
                                    <input
                                        name="depositPerItem"
                                        type="number"
                                        placeholder="500"
                                        value={form.depositPerItem}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div className="form-actions">
                                <button type="submit" className="primary-btn" disabled={loading}>
                                    {loading ? "Processing..." : editingId ? "Save Changes" : "Add to Inventory"}
                                </button>
                                {editingId && (
                                    <button type="button" className="cancel-btn" onClick={resetForm}>
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>

                {/* Right Side: List */}
                <div className="list-section">
                    <div className="glass-card">
                        <div className="list-header">
                            <h3>Current Inventory</h3>
                            <span className="count-badge">{items.length} Items</span>
                        </div>

                        <div className="table-wrapper">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Item Detail</th>
                                        <th>Stock</th>
                                        <th>Deposit</th>
                                        <th className="text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item) => (
                                        <tr key={item._id} className={item.totalStock <= 5 ? "low-stock-row" : ""}>
                                            <td>
                                                <div className="item-info">
                                                    <div className="item-icon"><Package size={14} /></div>
                                                    <span>{item.itemName}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`stock-tag ${item.totalStock <= 5 ? 'low' : ''}`}>
                                                    {item.totalStock}
                                                </span>
                                            </td>
                                            <td className="price-col">₹{item.depositPerItem}</td>
                                            <td className="text-right">
                                                <div className="action-btns">
                                                    <button className="icon-btn edit" onClick={() => handleEdit(item)}>
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button className="icon-btn delete" onClick={() => handleDelete(item._id)}>
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {items.length === 0 && <div className="empty-state">No medical items found in records.</div>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddItem;