import React, { useState, useEffect } from 'react';
import { getInterviewsByManagerId, getEmployees } from './services/api';
import AssignInterviewForm from './components/AssignInterviewForm';

function ManagerDashboard({ user }) {
  const [interviews, setInterviews] = useState([]);
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const [interviewData, employeeData] = await Promise.all([
        getInterviewsByManagerId(user._id),
        getEmployees(),
      ]);
      setInterviews(interviewData);
      setEmployees(employeeData);
    };

    fetchDashboardData();
  }, [user]);

  return (
    <div>
      <h2>Manager Dashboard</h2>
      <p>You have created {interviews.length} interviews.</p>
      <AssignInterviewForm managerId={user._id} employees={employees} />
      <h3>Your Interviews:</h3>
      {interviews.length === 0 ? (
        <p>You have not created any interviews yet.</p>
      ) : (
        <ul>
          {interviews.map((interview) => (
            <li key={interview._id}>
              <p>Status: {interview.status}</p>
              <p>Assigned to: {interview.employee_ids.join(', ')}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ManagerDashboard;
