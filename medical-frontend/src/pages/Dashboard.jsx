import { useEffect, useState } from "react";
import API from "../api";
import "./Dashboard.css";

const Dashboard = () => {
    const [items, setItems] = useState([]);
    const [issues, setIssues] = useState([]);
    const [returns, setReturns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [itemRes, issueRes, returnRes] = await Promise.all([
                    API.get("/items"),
                    API.get("/issues"),
                    API.get("/returns")
                ]);

                setItems(itemRes.data);
                setIssues(issueRes.data);
                setReturns(returnRes.data);
            } catch {
                setError("Failed to load dashboard data");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    /* 🔢 Calculations */
    const totalStock = items.reduce((sum, i) => sum + i.totalStock, 0);
    const lowStockCount = items.filter(i => i.totalStock <= 5).length;

    const activeIssues = issues.filter(i => !i.isReturned);
    const returnedCount = issues.filter(i => i.isReturned).length;

    const totalDeposit = issues.reduce((sum, i) => sum + i.totalDeposit, 0);
    const totalRefund = returns.reduce((sum, r) => sum + r.refundAmount, 0);
    const netDeposit = totalDeposit - totalRefund;

    const filteredItems = items.filter(item =>
        item.itemName.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="dashboard-page">
            <h2>Medical Stock Dashboard</h2>

            {/* 🔹 SUMMARY CARDS */}
            <div className="summary">
                <div className="summary-card">
                    <h3>{items.length}</h3>
                    <p>Total Items</p>
                </div>

                <div className="summary-card success">
                    <h3>{totalStock}</h3>
                    <p>Total Stock</p>
                </div>

                <div className="summary-card warning">
                    <h3>{activeIssues.length}</h3>
                    <p>Issued (Active)</p>
                </div>

                <div className="summary-card">
                    <h3>{returnedCount}</h3>
                    <p>Returned</p>
                </div>

                <div className="summary-card success">
                    <h3>₹ {netDeposit}</h3>
                    <p>Net Deposit</p>
                </div>

                <div className="summary-card danger">
                    <h3>{lowStockCount}</h3>
                    <p>Low Stock</p>
                </div>
            </div>

            {/* 🔍 SEARCH */}
            <input
                className="search"
                placeholder="Search medical item..."
                value={search}
                onChange={e => setSearch(e.target.value)}
            />

            {loading && <p className="info">Loading dashboard...</p>}
            {error && <p className="error">{error}</p>}
            {!loading && filteredItems.length === 0 && (
                <p className="info">No items found</p>
            )}

            {/* 📦 ITEM GRID */}
            <div className="grid">
                {filteredItems.map(item => (
                    <div
                        key={item._id}
                        className={`item-card ${item.totalStock <= 5 ? "low-stock" : ""}`}
                    >
                        <div className="card-header">
                            <h4>{item.itemName}</h4>
                            {item.totalStock <= 5 && (
                                <span className="badge">Low</span>
                            )}
                        </div>

                        <p><strong>Stock:</strong> {item.totalStock}</p>
                        <p><strong>Deposit / Item:</strong> ₹{item.depositPerItem}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Dashboard;