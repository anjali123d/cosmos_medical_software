import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useState } from "react";
import Dashboard from "./pages/Dashboard";
import AddItem from "./pages/AddItem";
import AddPatient from "./pages/AddPatient";
import IssueItem from "./pages/IssueItem";
import ReturnItem from "./pages/ReturnItem";
import Sidebar from "./components/Sidebar"; // Renamed from Navbar for clarity
import "./App.css";

function App() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

  return (
    <Router>
      <div className="app-layout">
        {/* The Sidebar stays fixed */}
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

        {/* The Main Content area scrolls independently */}
        <div className="main-wrapper">
          <Routes>
            <Route path="/" element={<Dashboard toggleSidebar={toggleSidebar} />} />
            <Route path="/add-item" element={<AddItem />} />
            <Route path="/add-patient" element={<AddPatient />} />
            <Route path="/issue" element={<IssueItem />} />
            <Route path="/return" element={<ReturnItem />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;