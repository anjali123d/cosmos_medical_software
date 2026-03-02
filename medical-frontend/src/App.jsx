import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useState } from "react";
import Dashboard from "./pages/Dashboard";
import AddItem from "./pages/AddItem";
import AddPatient from "./pages/AddPatient";
import IssueItem from "./pages/IssueItem";
import ReturnItem from "./pages/ReturnItem";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";   // ✅ Add Navbar
import "./App.css";

function App() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  return (
    <Router>
      <div className="app-layout">

        {/* Sidebar */}
        <Sidebar
          isOpen={isSidebarOpen}
          toggleSidebar={toggleSidebar}
        />

        {/* Main Content */}
        <div className="main-wrapper">

          {/* Navbar at top */}
          <Navbar toggleSidebar={toggleSidebar} />

          {/* Page Content */}
          <div className="page-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/add-item" element={<AddItem />} />
              <Route path="/add-patient" element={<AddPatient />} />
              <Route path="/issue" element={<IssueItem />} />
              <Route path="/return" element={<ReturnItem />} />
            </Routes>
          </div>

        </div>
      </div>
    </Router>
  );
}

export default App;