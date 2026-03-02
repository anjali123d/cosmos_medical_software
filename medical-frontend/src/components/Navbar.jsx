import { NavLink } from "react-router-dom";
import { FaHome, FaBoxOpen, FaUserPlus, FaExchangeAlt, FaUndo } from "react-icons/fa";
import "./Navbar.css";

const Navbar = () => {
    return (
        <nav className="bottom-nav">
            <NavLink to="/" className="nav-item">
                <FaHome />
                <span>Home</span>
            </NavLink>

            <NavLink to="/add-item" className="nav-item">
                <FaBoxOpen />
                <span>Item</span>
            </NavLink>

            <NavLink to="/add-patient" className="nav-item">
                <FaUserPlus />
                <span>Patient</span>
            </NavLink>

            <NavLink to="/issue" className="nav-item">
                <FaExchangeAlt />
                <span>Issue</span>
            </NavLink>

            <NavLink to="/return" className="nav-item">
                <FaUndo />
                <span>Return</span>
            </NavLink>
        </nav>
    );
};

export default Navbar;