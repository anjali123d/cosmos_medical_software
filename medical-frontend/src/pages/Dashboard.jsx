import { useEffect, useState } from "react";
import API from "../api";
import "./Dashboard2.css";
import { Package, Plus, X } from "react-feather";

const Dashboard = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);

    const [form, setForm] = useState({
        itemName: "",
        totalStock: "",
        depositPerItem: ""
    });

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        try {
            const res = await API.get("/items");
            setItems(res.data);
        } catch (err) {
            setError("Failed to load inventory data. Check API connection.");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await API.post("/items", form);
            setForm({ itemName: "", totalStock: "", depositPerItem: "" });
            setShowModal(false);
            fetchItems();
        } catch (err) {
            alert("Failed to add item");
        }
    };

    const filteredItems = items.filter(item =>
        item.itemName.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="dashboard-container">
            <main className="main-content">
                <section className="content-body">

                    {/* HEADER */}
                    <div className="section-header">
                        <h2>Inventory Status</h2>
                        <input
                            type="text"
                            placeholder="Search item..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="search-input"
                        />
                    </div>

                    {/* ITEMS */}
                    {loading ? (
                        <div className="loader-container">
                            <div className="spinner"></div>
                            <p>Loading medical inventory...</p>
                        </div>
                    ) : (
                        <div className="inventory-simple-grid">
                            {filteredItems.map(item => (
                                <div
                                    key={item._id}
                                    className={`inventory-simple-card ${item.totalStock <= 5 ? "low-stock" : ""}`}
                                >
                                    <h4 className="item-name">
                                        <Package size={18} style={{ marginRight: "6px" }} />
                                        {item.itemName}
                                    </h4>
                                    <p className="stock-text">
                                        Stock: <span>{item.totalStock}</span>
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}

                    {error && <div className="error-message">{error}</div>}
                </section>
            </main>

            {/* FLOATING BUTTON */}
            <button className="floating-btn" onClick={() => setShowModal(true)}>
                <Plus size={24} />
            </button>

            {/* MODAL */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h3>Add New Inventory</h3>
                            <X size={20} onClick={() => setShowModal(false)} className="close-icon" />
                        </div>

                        <form onSubmit={handleSubmit} className="modal-form">
                            <input
                                type="text"
                                placeholder="Item Name"
                                value={form.itemName}
                                onChange={(e) => setForm({ ...form, itemName: e.target.value })}
                                required
                            />
                            <input
                                type="number"
                                placeholder="Total Stock"
                                value={form.totalStock}
                                onChange={(e) => setForm({ ...form, totalStock: e.target.value })}
                                required
                            />
                            <input
                                type="number"
                                placeholder="Deposit Per Item"
                                value={form.depositPerItem}
                                onChange={(e) => setForm({ ...form, depositPerItem: e.target.value })}
                                required
                            />

                            <button type="submit" className="submit-btn">
                                Add Item
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;