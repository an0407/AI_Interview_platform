import axios from "axios";

const API_BASE = "http://127.0.0.1:8000/users";

export const getUsers = async () => {
  const response = await axios.get(`${API_BASE}/`);
  return response.data;
};

export const createUser = async (userData) => {
  const response = await axios.post(`${API_BASE}/`, userData);
  return response.data;
};
