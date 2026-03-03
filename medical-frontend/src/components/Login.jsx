import { useState, useEffect } from "react";
import "./Login.css";
import { Mail, Lock } from "react-feather";
import { useNavigate } from "react-router-dom";

const Login = () => {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        email: "",
        password: ""
    });

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const STATIC_EMAIL = "admin@cosmosmedical.com";
    const STATIC_PASSWORD = "Cosmos@2026";

    const handleSubmit = (e) => {
        e.preventDefault();
        setError("");

        if (!form.email || !form.password) {
            setError("All fields are required");
            return;
        }

        setLoading(true);

        setTimeout(() => {
            if (
                form.email === STATIC_EMAIL &&
                form.password === STATIC_PASSWORD
            ) {
                // Fake token store
                localStorage.setItem("token", "static-login-success");
                navigate("/");
            } else {
                setError("Invalid email or password");
            }

            setLoading(false);
        }, 800); // small delay for better UX
    };
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            navigate("/");
        }
    }, []);
    return (
        <div className="login-container">
            <div className="login-card">

                <div className="login-header">
                    <h2>Cosmos Medical</h2>
                    <p>Stock Management System</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">



                    <div className="input-group">
                        <Mail size={18} />
                        <input
                            type="email"
                            placeholder="Enter Email"
                            value={form.email}
                            onChange={(e) =>
                                setForm({ ...form, email: e.target.value })
                            }
                        />
                    </div>

                    <div className="input-group">
                        <Lock size={18} />
                        <input
                            type="password"
                            placeholder="Enter Password"
                            value={form.password}
                            onChange={(e) =>
                                setForm({ ...form, password: e.target.value })
                            }
                        />
                    </div>

                    <button className="login-btn" disabled={loading}>
                        {loading ? "Signing In..." : "Login"}
                    </button>
                    {error && <div className="login-error">{error}</div>}
                </form>


            </div>
        </div>
    );
};

export default Login;