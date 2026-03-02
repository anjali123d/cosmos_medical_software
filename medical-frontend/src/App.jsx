import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import AddItem from "./pages/AddItem";
import AddPatient from "./pages/AddPatient";
import IssueItem from "./pages/IssueItem";
import ReturnItem from "./pages/ReturnItem";
import Navbar from "./components/Navbar";
import "./App.css";

function App() {
  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/add-item" element={<AddItem />} />
          <Route path="/add-patient" element={<AddPatient />} />
          <Route path="/issue" element={<IssueItem />} />
          <Route path="/return" element={<ReturnItem />} />
        </Routes>
        <Navbar />
      </div>
    </Router>
  );
}

export default App;