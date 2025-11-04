import React, { useState } from 'react';
import { assignInterview } from '../services/api.js';

function AssignInterviewForm({ managerId, employees }) {
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [instructions, setInstructions] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = {
      manager_id: managerId,
      employee_ids: selectedEmployees,
      interview_instructions: {
        time: '30 minutes', // You can make this dynamic
        tech_stacks: ['React', 'Node.js'], // You can make this dynamic
        notes: instructions,
      },
    };

    const result = await assignInterview(data);
    alert(result.message || 'Interview assigned successfully!');
  };

  return (
    <div>
      <h2>Assign Interview</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Assign to:</label><br />
          <select
            multiple
            value={selectedEmployees}
            onChange={(e) =>
              setSelectedEmployees(
                Array.from(e.target.selectedOptions, (option) => option.value)
              )
            }
            required
          >
            {employees.map((employee) => (
              <option key={employee._id} value={employee._id}>
                {employee.name}
              </option>
            ))}
          </select>
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