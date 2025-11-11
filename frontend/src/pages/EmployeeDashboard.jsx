import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import './Dashboard.css';

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [managers, setManagers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchInterviews();
  }, [user]);

  const fetchInterviews = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://192.168.5.99:8000/interviews/employee/${user._id}`);
      if (!response.ok) throw new Error('Failed to fetch interviews');

      const data = await response.json();
      console.log('Fetched interviews:', data);
      if (data && data.length > 0) {
        console.log('First interview _id:', data[0]._id);
      }
      setInterviews(data);
      setError('');
    } catch (err) {
      setError('Failed to load interviews');
      console.error('Fetch interviews error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartInterview = async (interviewId) => {
    // Update status to InProgress
    console.log('Starting interview with ID:', interviewId);
    try {
      const response = await fetch(
        `http://192.168.5.99:8000/interviews/${interviewId}/status`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'InProgress' }),
        }
      );

      const responseData = await response.json();
      console.log('Status update response:', responseData);

      if (response.ok) {
        navigate(`/interview/${interviewId}`);
      } else {
        setError('Failed to start interview: ' + (responseData?.detail || 'Unknown error'));
      }
    } catch (err) {
      setError('Error starting interview: ' + err.message);
      console.error('Error:', err);
    }
  };

  if (loading) return <LoadingSpinner message="Loading your interviews..." />;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>👤 Your Interviews</h1>
        <p style={{ margin: '10px 0 0 0', color: '#666' }}>
          {interviews.length} interview{interviews.length !== 1 ? 's' : ''} assigned to you
        </p>
      </div>

      {error && <div className="error-alert">{error}</div>}

      <div className="dashboard-content">
        <div className="section">
          {interviews.length === 0 ? (
            <p className="no-data">No interviews assigned yet. Check back later!</p>
          ) : (
            <div className="interviews-grid">
              {interviews.map(interview => (
                <div key={interview._id} className="interview-card">
                  <div className="card-header">
                    <StatusBadge status={interview.status} />
                  </div>
                  <div className="card-body">
                    <p className="card-label">Status:</p>
                    <p className="card-value">{interview.status}</p>

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

                  <div className="card-actions">
                    {interview.status === 'assigned' && (
                      <button
                        className="start-interview-btn"
                        onClick={() => handleStartInterview(interview._id)}
                        style={{ width: '100%', border: 'none', cursor: 'pointer' }}
                      >
                        ▶️ Start Interview
                      </button>
                    )}
                    {interview.status === 'InProgress' && (
                      <button
                        className="start-interview-btn"
                        onClick={() => navigate(`/interview/${interview._id}`)}
                        style={{ width: '100%', border: 'none', cursor: 'pointer' }}
                      >
                        ▶️ Continue Interview
                      </button>
                    )}
                    {interview.status === 'completed' && (
                      <a
                        href={`/results/${interview._id}`}
                        className="start-interview-btn"
                        style={{ display: 'block', textAlign: 'center' }}
                      >
                        📊 View Results
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
