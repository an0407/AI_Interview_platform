import React, { useEffect, useState } from 'react';
import { getAllInterviews } from '../services/api.js';

function InterviewList({ onSelect }) {
  const [interviews, setInterviews] = useState([]);

  useEffect(() => {
    async function loadData() {
      const data = await getAllInterviews();
      setInterviews(data);
    }
    loadData();
  }, []);

  return (
    <div>
      <h2>All Interviews</h2>
      {interviews.length === 0 ? (
        <p>No interviews found.</p>
      ) : (
        <ul>
          {interviews.map((i) => (
            <li key={i._id}>
              <button onClick={() => onSelect(i)}>
                View Interview (Manager: {i.manager_id})
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default InterviewList;
