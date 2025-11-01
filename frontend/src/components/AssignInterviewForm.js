import React, { useState } from 'react';
import { assignInterview } from '../services/api.js';

function AssignInterviewForm() {
  const [managerId, setManagerId] = useState('');
  const [employeeIds, setEmployeeIds] = useState('');
  const [instructions, setInstructions] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = {
      manager_id: managerId,
      employee_ids: employeeIds.split(',').map(id => id.trim()),
      instructions,
    };

    const result = await assignInterview(data);
    alert(result.message || 'Interview assigned successfully!');
  };

  return (
    <div>
      <h2>Assign Interview</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Manager ID:</label><br />
          <input
            type="text"
            value={managerId}
            onChange={(e) => setManagerId(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Employee IDs (comma separated):</label><br />
          <input
            type="text"
            value={employeeIds}
            onChange={(e) => setEmployeeIds(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Instructions:</label><br />
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            required
          ></textarea>
        </div>

        <button type="submit" style={{ marginTop: '1rem' }}>Assign</button>
      </form>
    </div>
  );
}

export default AssignInterviewForm;
