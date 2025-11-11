import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import { v4 as uuidv4 } from 'uuid';
import './Dashboard.css';

const ManagerDashboard = () => {
  const { user } = useAuth();
  const [interviews, setInterviews] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    selectedEmployees: [],
    time: '',
    techStacks: '',
    notes: '',
  });

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [interviewsRes, employeesRes] = await Promise.all([
        fetch(`http://192.168.5.99:8000/interviews/manager/${user._id}`),
        fetch('http://192.168.5.99:8000/users/employees'),
      ]);

      if (!interviewsRes.ok || !employeesRes.ok) throw new Error('Failed to fetch data');

      const interviewsData = await interviewsRes.json();
      const employeesData = await employeesRes.json();

      setInterviews(interviewsData);
      setEmployees(employeesData);
      setError('');
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeToggle = (employeeId) => {
    setFormData(prev => ({
      ...prev,
      selectedEmployees: prev.selectedEmployees.includes(employeeId)
        ? prev.selectedEmployees.filter(id => id !== employeeId)
        : [...prev.selectedEmployees, employeeId]
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitInterview = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.selectedEmployees.length || !formData.time || !formData.techStacks) {
      setError('Please fill in all required fields');
      return;
    }

    const techStacksArray = formData.techStacks.split(',').map(s => s.trim());

    const interviewData = {
      interview_id: uuidv4(),
      manager_id: user._id,
      employee_ids: formData.selectedEmployees,
      interview_instructions: {
        time: formData.time,
        tech_stacks: techStacksArray,
        notes: formData.notes || null,
      },
    };

    try {
      const response = await fetch('http://192.168.5.99:8000/interviews/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(interviewData),
      });

      if (!response.ok) throw new Error('Failed to create interview');

      setSuccess('✅ Interview created and emails sent successfully!');
      setFormData({
        selectedEmployees: [],
        time: '',
        techStacks: '',
        notes: '',
      });
      setShowForm(false);
      fetchDashboardData();
    } catch (err) {
      setError('Failed to create interview: ' + err.message);
    }
  };

  if (loading) return <LoadingSpinner message="Loading your interviews..." />;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>👨‍💼 Manager Dashboard</h1>
        <div className="interview-count">
          <h2>Total Interviews Created: {interviews.length}</h2>
        </div>
      </div>

      {error && <div className="error-alert">{error}</div>}
      {success && <div className="success-alert">{success}</div>}

      <div className="dashboard-content">
        <div className="section">
          <div className="section-header">
            <h2>🎯 Create New Interview</h2>
            <button
              className="toggle-btn"
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? '✖️ Cancel' : '➕ Create Interview'}
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleSubmitInterview} className="interview-form">
              <div className="form-group">
                <label>Select Employees *</label>
                <div className="employee-list">
                  {employees.length === 0 ? (
                    <p className="no-data">No employees available</p>
                  ) : (
                    employees.map(emp => (
                      <label key={emp._id} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={formData.selectedEmployees.includes(emp._id)}
                          onChange={() => handleEmployeeToggle(emp._id)}
                        />
                        <span>{emp.name} ({emp.email})</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>Interview Time (e.g., 2 hours) *</label>
                <input
                  type="text"
                  name="time"
                  placeholder="e.g., 2 hours"
                  value={formData.time}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Tech Stacks (comma-separated) *</label>
                <input
                  type="text"
                  name="techStacks"
                  placeholder="e.g., React, Node.js, MongoDB"
                  value={formData.techStacks}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Additional Notes</label>
                <textarea
                  name="notes"
                  placeholder="Any additional instructions for the interview..."
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows="3"
                />
              </div>

              <button type="submit" className="submit-btn">
                🚀 Create & Send Interview
              </button>
            </form>
          )}
        </div>

        <div className="section">
          <h2>📋 Your Interviews</h2>
          {interviews.length === 0 ? (
            <p className="no-data">No interviews created yet. Create one to get started!</p>
          ) : (
            <div className="interviews-grid">
              {interviews.map(interview => (
                <div key={interview._id} className="interview-card">
                  <div className="card-header">
                    <StatusBadge status={interview.status} />
                  </div>
                  <div className="card-body">
                    <p className="card-label">Assigned to:</p>
                    <p className="card-value">
                      {employees
                        .filter(e => interview.employee_ids.includes(e._id))
                        .map(e => e.name)
                        .join(', ')}
                    </p>

                    <p className="card-label">Time:</p>
                    <p className="card-value">
                      {interview.interview_instructions?.time || 'N/A'}
                    </p>

                    <p className="card-label">Tech Stacks:</p>
                    <p className="card-value">
                      {interview.interview_instructions?.tech_stacks?.join(', ') || 'N/A'}
                    </p>

                    <p className="card-label">Notes:</p>
                    <p className="card-value">
                      {interview.interview_instructions?.notes || 'None'}
                    </p>
                  </div>
                  {interview.status === 'completed' && (
                    <div className="card-actions">
                      <a href={`/results/${interview._id}`} className="view-results-btn">
                        📊 View Results
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
