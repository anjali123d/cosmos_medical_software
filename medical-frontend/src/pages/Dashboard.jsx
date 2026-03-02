import { useEffect, useState } from "react";
import API from "../api";
import "./Dashboard.css";
import {
    Package, TrendingUp, Activity,
    Search, DollarSign
} from 'react-feather';

// --- SUB-COMPONENT: STAT CARD ---
const StatCard = ({ icon, label, value, color }) => (
    <div className={`stat-card ${color}`}>
        <div className="stat-icon-wrapper">{icon}</div>
        <div className="stat-info">
            <p>{label}</p>
            <h3>{value}</h3>
        </div>
    </div>
);

// --- MAIN DASHBOARD COMPONENT ---
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
            } catch (err) {
                setError("Failed to load dashboard data. Check API connection.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Calculations
    const totalStock = items.reduce((sum, i) => sum + i.totalStock, 0);
    const activeIssues = issues.filter(i => !i.isReturned);
    const totalDeposit = issues.reduce((sum, i) => sum + i.totalDeposit, 0);
    const totalRefund = returns.reduce((sum, r) => sum + r.refundAmount, 0);
    const netDeposit = totalDeposit - totalRefund;

    const filteredItems = items.filter(item =>
        item.itemName.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="dashboard-container">


            <main className="main-content">
                <section className="content-body">
                    {/* STATS GRID */}
                    <div className="stats-grid">
                        <StatCard icon={<Package size={24} />} label="Total Inventory" value={items.length} color="blue" />
                        <StatCard icon={<TrendingUp size={24} />} label="Total Stock Units" value={totalStock} color="green" />
                        <StatCard icon={<Activity size={24} />} label="Active Issues" value={activeIssues.length} color="orange" />
                        <StatCard icon={<DollarSign size={24} />} label="Net Security Deposit" value={`₹${netDeposit.toLocaleString()}`} color="purple" />
                    </div>

                    {/* INVENTORY TABLE */}
                    <div className="section-header">
                        <h3>Inventory Status</h3>
                        <span className="date-text">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
                    </div>

                    {loading ? (
                        <div className="loader-container">
                            <div className="spinner"></div>
                            <p>Loading medical data...</p>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table className="inventory-table">
                                <thead>
                                    <tr>
                                        <th>Item Name</th>
                                        <th>Current Stock</th>
                                        <th>Unit Deposit</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredItems.map(item => (
                                        <tr key={item._id}>
                                            <td>{item.itemName}</td>
                                            <td>{item.totalStock}</td>
                                            <td>₹{item.depositPerItem}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {error && <div className="error-message">{error}</div>}
                </section>
            </main>
        </div>
    );
};

export default Dashboard;