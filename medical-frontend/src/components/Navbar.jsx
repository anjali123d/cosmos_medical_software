import React from "react";
import { Menu, Search, Bell } from "react-feather";
import "./Navbar.css";

const Navbar = ({ toggleSidebar }) => {
    return (
        <header className="navbar">
            {/* Left Section */}
            <div className="navbar-left">
                <button className="menu-btn" onClick={toggleSidebar}>
                    <Menu size={22} />
                </button>

                <h2 className="navbar-title">Medical Stock Dashboard</h2>
            </div>

            

        </header>
    );
};

export default Navbar;