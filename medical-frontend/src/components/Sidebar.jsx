import React from 'react';
import { NavLink } from "react-router-dom";
import {
    FaHome, FaBoxOpen, FaUserPlus,
    FaExchangeAlt, FaUndo, FaSignOutAlt
} from "react-icons/fa";
import { Activity, X } from 'react-feather';
import './Sidebar.css'
const Sidebar = ({ isOpen, toggleSidebar }) => {
    // Add an overlay for mobile so users can click outside to close
    const handleClose = () => {
        if (window.innerWidth <= 992) toggleSidebar();
    };

    return (
        <>
            {/* Overlay for mobile view */}
            {isOpen && <div className="sidebar-overlay" onClick={toggleSidebar}></div>}

            <aside className={`sidebar-container ${isOpen ? "open" : ""}`}>
                <div className="sidebar-wrapper">

                    {/* Header Section */}
                    <div className="sidebar-brand">
                        <div className="brand-logo">
                            <Activity color="white" size={24} strokeWidth={3} />
                        </div>
                        <span className="brand-name">MedStock <small>v1.0</small></span>
                        <button className="mobile-close-btn" onClick={toggleSidebar}>
                            <X size={20} />
                        </button>
                    </div>

                    {/* Navigation Section */}
                    <nav className="sidebar-nav">
                        <div className="nav-group">
                            <span className="group-title">Main Menu</span>
                            <SidebarLink to="/" icon={<FaHome />} label="Dashboard" onClick={handleClose} />
                            <SidebarLink to="/add-item" icon={<FaBoxOpen />} label="Inventory" onClick={handleClose} />
                            <SidebarLink to="/add-patient" icon={<FaUserPlus />} label="Patients list" onClick={handleClose} />
                        </div>

                        <div className="nav-group">
                            <span className="group-title">Operations</span>
                            <SidebarLink to="/issue" icon={<FaExchangeAlt />} label="Issue Item" onClick={handleClose} />
                            <SidebarLink to="/return" icon={<FaUndo />} label="Return Item" onClick={handleClose} />
                        </div>
                    </nav>

                    {/* Footer Section */}
                    <div className="sidebar-profile">
                        <div className="profile-card">
                            <div className="avatar-circle">AD</div>
                            <div className="profile-details">
                                <p className="user-name">Admin User</p>
                                <p className="user-role">Medical Admin</p>
                            </div>
                            <button className="logout-btn" title="Logout">
                                <FaSignOutAlt />
                            </button>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
};

// Extracted Sub-component for cleaner code
const SidebarLink = ({ to, icon, label, onClick }) => (
    <NavLink
        to={to}
        onClick={onClick}
        className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
    >
        <span className="link-icon">{icon}</span>
        <span className="link-text">{label}</span>
    </NavLink>
);

export default Sidebar;