import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getInterviewsByEmployeeId, updateInterviewStatus } from './services/api';

function EmployeeDashboard({ user }) {
  const [interviews, setInterviews] = useState([]);

  useEffect(() => {
    const fetchInterviews = async () => {
      const data = await getInterviewsByEmployeeId(user._id);
      setInterviews(data);
    };
    fetchInterviews();
  }, [user]);

  const handleStartInterview = async (interviewId) => {
    await updateInterviewStatus(interviewId, 'InProgress');
    // Navigate to the interview page (to be implemented)
  };

  return (
    <div>
      <h2>Your Interviews</h2>
      {interviews.length === 0 ? (
        <p>No interviews assigned to you.</p>
      ) : (
        <ul>
          {interviews.map((interview) => (
            <li key={interview._id}>
              <p>Status: {interview.status}</p>
              {interview.status === 'assigned' && (
                <Link to={`/interview/${interview._id}`}>
                  <button>Start Interview</button>
                </Link>
              )}
              {interview.status === 'completed' && (
                <button>
                  View Results
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default EmployeeDashboard;
