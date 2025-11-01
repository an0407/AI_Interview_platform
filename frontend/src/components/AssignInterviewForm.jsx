import React, { useState } from "react";

function AssignInterviewForm() {
  const [managerId, setManagerId] = useState("");
  const [employeeIds, setEmployeeIds] = useState("");
  const [instructions, setInstructions] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const body = {
      manager_id: managerId,
      employee_ids: employeeIds.split(",").map((id) => id.trim()),
      instructions,
    };

    const res = await fetch("http://localhost:8000/interviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    setMessage(data.message || "Interview assigned successfully!");
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 text-pink-700">
        🎯 Assign Interview
      </h2>
      <form
        onSubmit={handleSubmit}
        className="space-y-4 text-gray-700"
      >
        <div>
          <label className="block font-medium">Manager ID:</label>
          <input
            value={managerId}
            onChange={(e) => setManagerId(e.target.value)}
            className="w-full border rounded-md px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block font-medium">Employee IDs (comma separated):</label>
          <input
            value={employeeIds}
            onChange={(e) => setEmployeeIds(e.target.value)}
            className="w-full border rounded-md px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block font-medium">Instructions:</label>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            className="w-full border rounded-md px-3 py-2"
            rows="3"
            required
          />
        </div>

        <button
          type="submit"
          className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-2 rounded-lg font-semibold shadow-md hover:opacity-90"
        >
          Assign Interview
        </button>
      </form>

      {message && (
        <p className="mt-4 text-green-600 font-semibold">{message}</p>
      )}
    </div>
  );
}

export default AssignInterviewForm;
