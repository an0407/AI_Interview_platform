import React, { useState } from "react";
import "./App.css";

function App() {
  const [managerId, setManagerId] = useState("");
  const [employeeIds, setEmployeeIds] = useState("");
  const [instructions, setInstructions] = useState("");
  const [interviews, setInterviews] = useState([]);
  const [searchId, setSearchId] = useState("");
  const [searchResult, setSearchResult] = useState(null);

  const handleAssign = () => {
    if (!managerId || !employeeIds) {
      alert("Please fill Manager ID and Employee IDs");
      return;
    }

    const newInterview = {
      id: Date.now(),
      managerId,
      employeeIds: employeeIds.split(",").map((id) => id.trim()),
      instructions,
    };

    setInterviews([...interviews, newInterview]);
    setManagerId("");
    setEmployeeIds("");
    setInstructions("");
  };

  const handleSearch = () => {
    const found = interviews.find((i) => i.id.toString() === searchId);
    setSearchResult(found || null);
  };

  return (
    <div className="container">
      {/* Assign Interview Section */}
      <div className="card">
        <h2>🎯 Assign Interview</h2>
        <div className="form-group">
          <label>Manager ID</label>
          <input
            value={managerId}
            onChange={(e) => setManagerId(e.target.value)}
            placeholder="Enter Manager ID"
          />
        </div>
        <div className="form-group">
          <label>Employee IDs</label>
          <input
            value={employeeIds}
            onChange={(e) => setEmployeeIds(e.target.value)}
            placeholder="Comma-separated IDs"
          />
        </div>
        <div className="form-group">
          <label>Instructions</label>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Enter any interview instructions"
          />
        </div>
        <button className="btn" onClick={handleAssign}>
          Assign Interview
        </button>
      </div>

      {/* All Interviews */}
      <div className="card">
        <h2>🗂️ All Interviews</h2>
        {interviews.length === 0 ? (
          <p className="empty">No interviews found.</p>
        ) : (
          <ul>
            {interviews.map((intv) => (
              <li key={intv.id}>
                <strong>ID:</strong> {intv.id} | <strong>Manager:</strong>{" "}
                {intv.managerId} | <strong>Employees:</strong>{" "}
                {intv.employeeIds.join(", ")}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Search Interview */}
      <div className="card">
        <h2>🔍 Search Interview</h2>
        <div className="search">
          <input
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            placeholder="Enter Interview ID"
          />
          <button className="btn" onClick={handleSearch}>
            Search
          </button>
        </div>
        {searchResult && (
          <div className="result">
            <p>
              <strong>Manager:</strong> {searchResult.managerId}
            </p>
            <p>
              <strong>Employees:</strong>{" "}
              {searchResult.employeeIds.join(", ")}
            </p>
            <p>
              <strong>Instructions:</strong> {searchResult.instructions}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
