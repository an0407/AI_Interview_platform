import React, { useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import {
  Typography,
  Button,
  TextField,
  Box,
  MenuItem,
  Paper,
  CircularProgress,
  Alert,
} from "@mui/material";
import axios from "axios";
import ManagerDashboard from "./ManagerDashboard";

export default function App() {
  const [form, setForm] = useState({
    user_id: "",
    name: "",
    email: "",
    password: "",
    role: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isLogin, setIsLogin] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      if (isLogin) {
        const res = await axios.post("http://127.0.0.1:8000/users/login/", {
          email: form.email,
          password: form.password,
        });

        setMessage(res.data.message);

        if (res.data.role === "manager") {
          navigate("/manager-dashboard");
        } else {
          setMessage("Login successful! You are an employee.");
        }
      } else {
        const res = await axios.post("http://127.0.0.1:8000/users/", form);
        setMessage(res.data.message || "User registered successfully!");
        setForm({ user_id: "", name: "", email: "", password: "", role: "" });
      }
    } catch (err) {
      setMessage(err.response?.data?.detail || "Operation failed!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Routes>
      <Route
        path="/"
        element={
          <Box
            sx={{
              minHeight: "100vh",
              background: "linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              p: 2,
            }}
          >
            <Paper
              elevation={6}
              sx={{
                width: 400,
                p: 4,
                borderRadius: 4,
                textAlign: "center",
                backdropFilter: "blur(10px)",
                background: "rgba(255, 255, 255, 0.85)",
              }}
            >
              <Typography variant="h4" fontWeight="bold" gutterBottom color="primary">
                {isLogin ? "Login" : "Create Account"}
              </Typography>

              <form onSubmit={handleSubmit}>
                {!isLogin && (
                  <>
                    <TextField
                      label="User ID"
                      name="user_id"
                      value={form.user_id}
                      onChange={handleChange}
                      fullWidth
                      margin="normal"
                      required
                    />
                    <TextField
                      label="Name"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      fullWidth
                      margin="normal"
                      required
                    />
                    <TextField
                      select
                      label="Role"
                      name="role"
                      value={form.role}
                      onChange={handleChange}
                      fullWidth
                      margin="normal"
                      required
                    >
                      <MenuItem value="manager">Manager</MenuItem>
                      <MenuItem value="employee">Employee</MenuItem>
                    </TextField>
                  </>
                )}

                <TextField
                  label="Email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                  required
                />
                <TextField
                  label="Password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                  required
                />

                {message && (
                  <Alert
                    severity={message.includes("success") ? "success" : "error"}
                    sx={{ mt: 2 }}
                  >
                    {message}
                  </Alert>
                )}

                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                  size="large"
                  sx={{
                    mt: 3,
                    py: 1.2,
                    fontWeight: "bold",
                    borderRadius: 3,
                    textTransform: "none",
                    background: "linear-gradient(90deg, #2575fc 0%, #6a11cb 100%)",
                    "&:hover": { opacity: 0.9 },
                  }}
                  disabled={loading}
                >
                  {loading ? (
                    <CircularProgress size={26} sx={{ color: "white" }} />
                  ) : isLogin ? (
                    "Login"
                  ) : (
                    "Register"
                  )}
                </Button>

                <Button
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setMessage("");
                  }}
                  color="secondary"
                  sx={{ mt: 2, textTransform: "none" }}
                >
                  {isLogin
                    ? "Don't have an account? Register"
                    : "Already have an account? Login"}
                </Button>
              </form>
            </Paper>
          </Box>
        }
      />

      <Route path="/manager-dashboard" element={<ManagerDashboard />} />
    </Routes>
  );
}
