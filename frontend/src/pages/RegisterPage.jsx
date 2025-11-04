import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '../context/AuthContext';
import './AuthPages.css';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, isLoading } = useAuth();
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    user_id: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'employee',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    const dataToSend = {
      user_id: uuidv4(),
      name: formData.name,
      email: formData.email,
      password: formData.password,
      role: formData.role,
    };

    const result = await register(dataToSend);

    if (result.success) {
      setShowSuccess(true);
      setFormData({
        user_id: '',
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'employee',
      });
      // Auto redirect after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } else {
      setError(result.error);
    }
  };

  if (showSuccess) {
    const handleGoToLogin = () => {
      navigate('/login');
    };

    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-card">
            <h1 className="auth-title">✨ Welcome!</h1>
            <p className="success-message">
              Registration successful! Redirecting to login...
            </p>
            <div style={{ textAlign: 'center', marginTop: '30px' }}>
              <p style={{ color: '#666', marginBottom: '15px' }}>
                If not redirected automatically:
              </p>
              <button
                onClick={handleGoToLogin}
                className="back-to-login-btn"
                style={{
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                Go to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <h1 className="auth-title">🚀 Create Account</h1>
          <p className="auth-subtitle">Join as a Manager or Employee</p>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                name="name"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
                disabled={isLoading}
                required
              />
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                name="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
                placeholder="At least 6 characters"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
                required
              />
            </div>

            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={isLoading}
                required
              />
            </div>

            <div className="form-group">
              <label>Role</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                disabled={isLoading}
                required
              >
                <option value="employee">👤 Employee</option>
                <option value="manager">👨‍💼 Manager</option>
              </select>
            </div>

            <button type="submit" className="auth-button" disabled={isLoading}>
              {isLoading ? '🔄 Creating Account...' : '🎉 Create Account'}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Already have an account?{' '}
              <Link to="/login" className="auth-link">
                Login here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
