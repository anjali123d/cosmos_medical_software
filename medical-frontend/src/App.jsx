import { BrowserRouter as Router, Routes, Route, useLocation,Navigate } from "react-router-dom";
import { useState } from "react";
import Dashboard from "./pages/Dashboard";
import AddItem from "./pages/AddItem";
import AddPatient from "./pages/AddPatient";
import IssueItem from "./pages/IssueItem";
import ReturnItem from "./pages/ReturnItem";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import Login from "./components/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import "./App.css";

function Layout() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  const isLoginPage = location.pathname === "/login";

  return (
    <div className="app-layout">

      {/* Sidebar only if NOT login */}
      {!isLoginPage && (
        <Sidebar
          isOpen={isSidebarOpen}
          toggleSidebar={toggleSidebar}
        />
      )}

      <div className={`main-wrapper ${isLoginPage ? "login-layout" : ""}`}>

        {/* Navbar only if NOT login */}
        {!isLoginPage && (
          <Navbar toggleSidebar={toggleSidebar} />
        )}

        <div className="page-content">
          <Routes>

            <Route path="/login" element={<Login />} />

            <Route path="/" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />

            <Route path="/add-item" element={
              <ProtectedRoute>
                <AddItem />
              </ProtectedRoute>
            } />

            <Route path="/add-patient" element={
              <ProtectedRoute>
                <AddPatient />
              </ProtectedRoute>
            } />

            <Route path="/issue" element={
              <ProtectedRoute>
                <IssueItem />
              </ProtectedRoute>
            } />

            <Route path="/return" element={
              <ProtectedRoute>
                <ReturnItem />
              </ProtectedRoute>
            } />

            {/* Redirect unknown routes */}
            <Route path="*" element={<Navigate to="/" />} />

          </Routes>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Layout />
    </Router>
  );
}

export default App;