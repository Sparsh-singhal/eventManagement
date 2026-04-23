import { useState, useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import AuthModal from "../Auth/AuthModal";
import { FaCalendarAlt, FaUserCircle } from "react-icons/fa";
import "./Navbar.css";

export default function Navbar() {
    const { user, logout } = useContext(AuthContext);
    const [isAuthModalOpen, setAuthModalOpen] = useState(false);

    return (
        <>
            <nav className="navbar-modern">
                <div className="nav-container">
                    <Link to="/" className="nav-logo">
                        <FaCalendarAlt size={24} color="var(--accent)" />
                        <span>Eventify</span>
                    </Link>
                    
                    <div className="nav-links">
                        <Link to="/">Home</Link>
                        <Link to="/events">Events</Link>
                        {user && <Link to="/dashboard">Dashboard</Link>}
                    </div>

                    <div className="nav-auth">
                        {user ? (
                            <div className="user-menu">
                                <FaUserCircle size={24} color="var(--muted-foreground)"/>
                                <span style={{fontWeight:500, marginRight: '1rem'}}>{user.username}</span>
                                <button className="btn btn-secondary" onClick={logout}>Logout</button>
                            </div>
                        ) : (
                            <button className="btn btn-primary" onClick={() => setAuthModalOpen(true)}>
                                Login / Register
                            </button>
                        )}
                    </div>
                </div>
            </nav>
            <AuthModal isOpen={isAuthModalOpen} onClose={() => setAuthModalOpen(false)} />
        </>
    );
}
