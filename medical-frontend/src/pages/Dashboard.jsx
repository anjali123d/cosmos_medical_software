import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import API from "../api";
import "./Dashboard.css";
import {
    Home, Package, Users, FileText, Search,
    TrendingUp, ArrowUpCircle, AlertTriangle,
    Activity, Menu, X, Bell
} from 'react-feather';
import { FaBoxOpen, FaUserPlus, FaExchangeAlt, FaUndo } from "react-icons/fa";


const SidebarItem = ({ to, icon, label, onClick }) => (
    <NavLink
        to={to}
        className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
        onClick={onClick}
    >
        {icon}
        <span>{label}</span>
    </NavLink>
);

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
    const [isSidebarOpen, setSidebarOpen] = useState(false);

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
                setError("Failed to load dashboard data");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Calculations
    const totalStock = items.reduce((sum, i) => sum + i.totalStock, 0);
    const lowStockCount = items.filter(i => i.totalStock <= 5).length;
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
                <header className="top-bar">
                    <div className="top-left">
                        <button className="menu-toggle" onClick={() => setSidebarOpen(true)}>
                            <Menu />
                        </button>
                        <h1>Dashboard</h1>
                    </div>
                    <div className="top-right">
                        <div className="search-box">
                            <Search size={18} />
                            <input
                                placeholder="Search inventory..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <button className="icon-btn"><Bell size={20} /></button>
                    </div>
                </header>

                <section className="content-body">
                    <div className="stats-grid">
                        <StatCard icon={<Package />} label="Total Items" value={items.length} color="blue" />
                        <StatCard icon={<TrendingUp />} label="Total Stock" value={totalStock} color="green" />
                        <StatCard icon={<Activity />} label="Active Issues" value={activeIssues.length} color="orange" />
                        <StatCard icon={<ArrowUpCircle />} label="Net Deposit" value={`₹${netDeposit.toLocaleString()}`} color="purple" />
                        <StatCard icon={<AlertTriangle />} label="Low Stock" value={lowStockCount} color="red" />
                    </div>

                    <div className="section-header">
                        <h3>Inventory Overview</h3>
                        <span className="date-text">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                    </div>

                    {loading ? (
                        <div className="loader-container">
                            <div className="spinner"></div>
                            <p>Loading medical data...</p>
                        </div>
                    ) : (
                        <div className="inventory-grid">
                            {filteredItems.map(item => (
                                <div key={item._id} className={`inventory-card ${item.totalStock <= 5 ? 'critical' : ''}`}>
                                    <div className="card-top">
                                        <h4>{item.itemName}</h4>
                                        {item.totalStock <= 5 && <span className="low-badge">Critically Low</span>}
                                    </div>
                                    <div className="card-details">
                                        <div className="detail">
                                            <span>Available Stock</span>
                                            <strong>{item.totalStock}</strong>
                                        </div>
                                        <div className="detail">
                                            <span>Unit Deposit</span>
                                            <strong>₹{item.depositPerItem}</strong>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    {error && <div className="error-message">{error}</div>}
                </section>
            </main>
        </div>
    );
};

export default Dashboard;