import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import api from '../../api/axiosConfig';
import { toast } from 'react-toastify';

export default function AuthModal({ isOpen, onClose }) {
  const [isLogin, setIsLogin] = useState(true);
  const { login } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    username: '', password: '', email: '', fullName: '', phone: '', role: 'attendee'
  });

  if (!isOpen) return null;

  const handleChange = (e) => setFormData({...formData, [e.target.name]: e.target.value});

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const endpoint = isLogin ? '/login' : '/register';
      const res = await api.post(endpoint, formData);
      login(res.data.token, res.data.user);
      toast.success(isLogin ? "Welcome back!" : "Registration successful!");
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || "An error occurred");
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isLogin ? 'Welcome Back' : 'Create an Account'}</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit} style={{display:'flex', flexDirection:'column', gap:'1rem'}}>
            {!isLogin && (
              <>
                <div className="form-group">
                  <label>Full Name</label>
                  <input name="fullName" required onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input name="email" type="email" required onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input name="phone" required onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <select name="role" value={formData.role} onChange={handleChange} style={{ padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}>
                    <option value="attendee">Attendee (Buy Tickets)</option>
                    <option value="organizer">Organizer (Create Events)</option>
                  </select>
                </div>
              </>
            )}
            <div className="form-group">
              <label>Username</label>
              <input name="username" required onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input name="password" type="password" required onChange={handleChange} />
            </div>
            <button type="submit" className="btn btn-primary" style={{marginTop:'1rem'}}>
              {isLogin ? 'Login' : 'Register'}
            </button>
          </form>
          <div style={{textAlign:'center', marginTop:'1rem', fontSize:'0.875rem'}}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button style={{color:'var(--accent)', textDecoration:'underline', fontWeight:600}} onClick={() => setIsLogin(!isLogin)}>
              {isLogin ? 'Sign up' : 'Log in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
