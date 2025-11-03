import React, { useEffect, useState } from "react";

function InterviewList() {
  const [interviews, setInterviews] = useState([]);

  useEffect(() => {
    fetch("http://localhost:8000/interviews")
      .then((res) => res.json())
      .then((data) => setInterviews(data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 text-purple-700">📋 All Interviews</h2>
      {interviews.length === 0 ? (
        <p>No interviews found.</p>
      ) : (
        <ul className="space-y-3">
          {interviews.map((i) => (
            <li key={i.interview_id} className="border p-3 rounded-md bg-gray-50">
              <p>
                <strong>Manager:</strong> {i.manager_id}
              </p>
              <p>
                <strong>Employees:</strong> {i.employee_ids.join(", ")}
              </p>
              <p>
                <strong>Instructions:</strong> {i.instructions}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default InterviewList;
