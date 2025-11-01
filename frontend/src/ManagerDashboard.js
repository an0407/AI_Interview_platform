import React, { useEffect, useState } from "react";
import { Box, Typography, Paper, CircularProgress, List, ListItem, ListItemText, Button } from "@mui/material";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function ManagerDashboard() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await axios.get("http://127.0.0.1:8000/users/employees/");
        const employeeList = res.data.filter((u) => u.role === "employee");
        setEmployees(employeeList);
      } catch (err) {
        console.error("Failed to fetch employees:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #2575fc 0%, #6a11cb 100%)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        p: 3,
      }}
    >
      <Paper
        elevation={6}
        sx={{
          width: 500,
          p: 4,
          borderRadius: 4,
          background: "rgba(255,255,255,0.9)",
        }}
      >
        <Typography variant="h4" textAlign="center" gutterBottom fontWeight="bold" color="primary">
          Manager Dashboard
        </Typography>

        {loading ? (
          <CircularProgress sx={{ display: "block", m: "auto", mt: 3 }} />
        ) : (
          <List>
            {employees.map((emp) => (
              <ListItem key={emp._id} divider>
                <ListItemText primary={emp.name} secondary={emp.email} />
              </ListItem>
            ))}
          </List>
        )}

        <Button
          onClick={() => navigate("/")}
          variant="contained"
          color="secondary"
          fullWidth
          sx={{ mt: 3, textTransform: "none" }}
        >
          Logout
        </Button>
      </Paper>
    </Box>
  );
}
