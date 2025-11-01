import React from 'react';

function InterviewDetails({ interview }) {
  return (
    <div>
      <h2>Interview Details</h2>
      <p><strong>Manager ID:</strong> {interview.manager_id}</p>
      <p><strong>Employees:</strong> {interview.employee_ids.join(', ')}</p>
      <p><strong>Instructions:</strong> {interview.instructions}</p>
    </div>
  );
}

export default InterviewDetails;
