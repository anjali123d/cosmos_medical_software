import { useEffect, useState } from "react";
import API from "../api";
import "./AddItem.css";
import {
    Plus, Edit2, Trash2, Package, X
} from "react-feather";

const AddItem = () => {

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
    const [showForm, setShowForm] = useState(false);

    /* =========================
       FETCH ITEMS
    ========================= */

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

    /* =========================
       FORM CHANGE
    ========================= */

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const resetForm = () => {
        setForm({
            itemName: "",
            totalStock: "",
            depositPerItem: ""
        });
        setEditingId(null);
        setError("");
    };

    /* =========================
       SUBMIT
    ========================= */

    const handleSubmit = async (e) => {

        e.preventDefault();

        setError("");
        setSuccess("");

        if (!form.itemName || !form.totalStock || !form.depositPerItem) {
            setError("Please fill all fields");
            return;
        }

        try {

            setLoading(true);

            const payload = {
                itemName: form.itemName,
                totalStock: Number(form.totalStock),
                depositPerItem: Number(form.depositPerItem)
            };

            if (editingId) {

                await API.put(`/items/${editingId}`, payload);
                setSuccess("Item updated successfully");

            } else {

                await API.post("/items", payload);
                setSuccess("Item added successfully");

            }

            fetchItems();
            resetForm();
            setShowForm(false);

            setTimeout(() => setSuccess(""), 3000);

        } catch {

            setError("Operation failed. Check server.");

        } finally {

            setLoading(false);

        }

    };

    /* =========================
       EDIT
    ========================= */

    const handleEdit = (item) => {

        setForm({
            itemName: item.itemName,
            totalStock: item.totalStock,
            depositPerItem: item.depositPerItem
        });

        setEditingId(item._id);
        setShowForm(true);

    };

    /* =========================
       DELETE
    ========================= */

    const handleDelete = async (id) => {

        if (!window.confirm("Delete this item?")) return;

        try {

            await API.delete(`/items/${id}`);
            fetchItems();

        } catch {

            setError("Delete failed");

        }

    };

    return (

        <div className="add-item-container">

            {/* ADD / EDIT MODAL */}

            {showForm && (

                <div className="modal-overlay">

                    <div className="modal-card">

                        <div className="modal-header">

                            <h3>{editingId ? "Edit Item" : "Add Item"}</h3>

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

            {/* PAGE HEADER */}

            <div className="page-header">

                <h1>Inventory Management</h1>

                <button
                    className="add-btn"
                    onClick={() => {
                        resetForm();
                        setShowForm(true);
                    }}
                >
                    <Plus size={16} /> Add Item
                </button>

            </div>

            {/* ITEM LIST */}

            <div className="items-grid">

                {items.map((item) => (

                    <div
                        key={item._id}
                        className={`item-card ${item.totalStock <= 5 ? "low-stock" : ""}`}
                    >

                        <div className="item-card-header">

                            <div className="item-title">

                                <Package size={18} />

                                <h4>{item.itemName}</h4>

                            </div>

                            <div className="item-actions">

                                <button
                                    className="icon-btn edit"
                                    onClick={() => handleEdit(item)}
                                >
                                    <Edit2 size={16} />
                                </button>

                                <button
                                    className="icon-btn delete"
                                    onClick={() => handleDelete(item._id)}
                                >
                                    <Trash2 size={16} />
                                </button>

                            </div>

                        </div>

                        <div className="item-details">

                            <div className="detail-row">

                                <span>Stock</span>

                                <span className={item.totalStock <= 5 ? "low" : ""}>
                                    {item.totalStock}
                                </span>

                            </div>

                            <div className="detail-row">

                                <span>Deposit</span>

                                <span>₹{item.depositPerItem}</span>

                            </div>

                        </div>

                    </div>

                ))}

                {items.length === 0 && (

                    <div className="empty-state">

                        <Package size={48} />

                        <p>No items found</p>

                    </div>

                )}

            </div>

        </div>

    );

};

export default AddItem;