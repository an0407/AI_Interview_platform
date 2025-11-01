import React, { useState } from "react";

function InterviewDetails() {
  const [id, setId] = useState("");
  const [details, setDetails] = useState(null);

  const handleSearch = async () => {
    const res = await fetch(`http://localhost:8000/interviews/${id}`);
    const data = await res.json();
    setDetails(data);
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 text-blue-700">🔍 Search Interview by ID</h2>
      <div className="flex gap-2">
        <input
          value={id}
          onChange={(e) => setId(e.target.value)}
          placeholder="Enter Interview ID"
          className="border rounded-md px-3 py-2 flex-grow"
        />
        <button
          onClick={handleSearch}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-600"
        >
          Search
        </button>
      </div>

      {details && (
        <div className="mt-4 bg-gray-50 border p-4 rounded-md">
          <p><strong>Manager:</strong> {details.manager_id}</p>
          <p><strong>Employees:</strong> {details.employee_ids.join(", ")}</p>
          <p><strong>Instructions:</strong> {details.instructions}</p>
        </div>
      )}
    </div>
  );
}

export default InterviewDetails;
