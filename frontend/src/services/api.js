const BASE_URL = "http://localhost:8000/interviews";

export async function assignInterview(data) {
  const res = await fetch(`${BASE_URL}/assign`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return await res.json();
}

export async function getAllInterviews() {
  const res = await fetch(`${BASE_URL}/`);
  return await res.json();
}

export async function getInterviewById(id) {
  const res = await fetch(`${BASE_URL}/${id}`);
  return await res.json();
}

export async function getInterviewsByEmployeeId(employeeId) {
  const res = await fetch(`${BASE_URL}/employee/${employeeId}`);
  return await res.json();
}

export async function getInterviewsByManagerId(managerId) {
  const res = await fetch(`${BASE_URL}/manager/${managerId}`);
  return await res.json();
}
