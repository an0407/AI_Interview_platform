import React, { useState } from "react";
import { v4 as uuidv4 } from 'uuid';

const UserForm = () => {
  const [formData, setFormData] = useState({
    user_id: '',
    name: "",
    email: "",
    password: "",
    role: "employee",
  });

  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("Submitting...");

    const dataToSend = { ...formData, user_id: uuidv4() };

    try {
      const response = await fetch("http://192.168.1.10:8000/users/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });

      if (response.ok) {
        setMessage("✅ User created successfully!");
        setFormData({ user_id: '', name: "", email: "", password: "", role: "employee" });
      } else {
        const errorData = await response.json();
        setMessage(`❌ Failed to create user: ${errorData.detail[0].msg}`);
      }
    } catch (error) {
      setMessage("⚠️ Error connecting to server.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl p-10 w-[380px] text-white border border-white/20 transition-all duration-300 hover:scale-[1.02]">
        <h2 className="text-3xl font-bold mb-6 text-center">✨ Create User</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 rounded-lg bg-white/20 placeholder-gray-200 focus:bg-white/30 outline-none"
          />

          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 rounded-lg bg-white/20 placeholder-gray-200 focus:bg-white/30 outline-none"
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 rounded-lg bg-white/20 placeholder-gray-200 focus:bg-white/30 outline-none"
          />

          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-lg bg-white/20 text-white focus:bg-white/30 outline-none"
          >
            <option value="manager" className="text-black">Manager</option>
            <option value="employee" className="text-black">Employee</option>
          </select>

          <button
            type="submit"
            className="w-full py-3 rounded-lg bg-gradient-to-r from-pink-500 to-orange-400 hover:from-pink-600 hover:to-orange-500 font-semibold transition-all duration-200"
          >
            🚀 Create User
          </button>
        </form>

        {message && (
          <p className="mt-5 text-center text-sm font-medium text-white">
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default UserForm;