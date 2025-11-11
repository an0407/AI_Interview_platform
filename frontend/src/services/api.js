import axios from 'axios';

const API_URL = 'http://192.168.5.99:8000';

// User-related API calls
export const getUsers = async () => {
  const response = await axios.get(`${API_URL}/users/`);
  return response.data;
};

export const createUser = async (userData) => {
  const response = await axios.post(`${API_URL}/users/`, userData);
  return response.data;
};

export const loginUser = async (credentials) => {
  const response = await axios.post(`${API_URL}/users/login/`, credentials);
  return response.data;
};

export const getEmployees = async () => {
  const response = await axios.get(`${API_URL}/users/employees`);
  return response.data;
};

// Interview-related API calls
export const assignInterview = async (interviewData) => {
  const response = await axios.post(`${API_URL}/interviews/assign`, interviewData);
  return response.data;
};

export const getAllInterviews = async () => {
  const response = await axios.get(`${API_URL}/interviews/`);
  return response.data;
};

export const getInterviewById = async (id) => {
  const response = await axios.get(`${API_URL}/interviews/${id}`);
  return response.data;
};

export const getInterviewsByEmployeeId = async (employeeId) => {
  const response = await axios.get(`${API_URL}/interviews/employee/${employeeId}`);
  return response.data;
};

export const getInterviewsByManagerId = async (managerId) => {
  const response = await axios.get(`${API_URL}/interviews/manager/${managerId}`);
  return response.data;
};

export const updateInterviewStatus = async (id, status) => {
  const response = await axios.put(`${API_URL}/interviews/${id}/status`, { status });
  return response.data;
};