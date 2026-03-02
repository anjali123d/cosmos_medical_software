import { useEffect, useState } from "react";
import API from "../api";
import "./AddItem.css";

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

    /* ================= FETCH ITEMS ================= */
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

    /* ================= FORM HANDLING ================= */
    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const resetForm = () => {
        setForm({ itemName: "", totalStock: "", depositPerItem: "" });
        setEditingId(null);
    };

    /* ================= ADD / UPDATE ================= */
    const handleSubmit = async () => {
        setError("");

        if (!form.itemName || !form.totalStock || !form.depositPerItem) {
            setError("All fields are required");
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
                alert("✅ Item Updated");
            } else {
                await API.post("/items", {
                    itemName: form.itemName,
                    totalStock: Number(form.totalStock),
                    depositPerItem: Number(form.depositPerItem)
                });
                alert("✅ Item Added");
            }

            resetForm();
            fetchItems();
        } catch {
            setError("Operation failed");
        } finally {
            setLoading(false);
        }
    };

    /* ================= EDIT ================= */
    const handleEdit = (item) => {
        setForm({
            itemName: item.itemName,
            totalStock: item.totalStock,
            depositPerItem: item.depositPerItem
        });
        setEditingId(item._id);
    };

    /* ================= DELETE ================= */
    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this item?")) return;

        try {
            await API.delete(`/items/${id}`);
            fetchItems();
        } catch {
            alert("Delete failed");
        }
    };

    return (
        <div className="page">

            {/* ================= ITEM LIST ================= */}
            <div className="card">
                <h2>Medical Items</h2>

                {items.length === 0 ? (
                    <p className="info">No items found</p>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Item</th>
                                <th>Stock</th>
                                <th>Deposit</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, index) => (
                                <tr key={item._id}>
                                    <td>{index + 1}</td>
                                    <td>{item.itemName}</td>
                                    <td>{item.totalStock}</td>
                                    <td>₹ {item.depositPerItem}</td>
                                    <td>
                                        <button
                                            className="btn edit"
                                            onClick={() => handleEdit(item)}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            className="btn delete"
                                            onClick={() => handleDelete(item._id)}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* ================= ADD / EDIT FORM ================= */}
            <div className="card">
                <h2>{editingId ? "Edit Item" : "Add New Item"}</h2>

                {error && <p className="error">{error}</p>}

                <input
                    name="itemName"
                    placeholder="Item Name"
                    value={form.itemName}
                    onChange={handleChange}
                />

                <input
                    name="totalStock"
                    type="number"
                    placeholder="Total Stock"
                    value={form.totalStock}
                    onChange={handleChange}
                />

                <input
                    name="depositPerItem"
                    type="number"
                    placeholder="Deposit Per Item (₹)"
                    value={form.depositPerItem}
                    onChange={handleChange}
                />

                <button onClick={handleSubmit} disabled={loading}>
                    {loading
                        ? "Saving..."
                        : editingId
                            ? "Update Item"
                            : "Add Item"}
                </button>

                {editingId && (
                    <button className="secondary" onClick={resetForm}>
                        Cancel Edit
                    </button>
                )}
            </div>
        </div>
    );
};

export default AddItem;