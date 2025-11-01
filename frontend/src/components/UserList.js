import React, { useEffect, useState } from "react";
import { getUsers } from "../api";

function UserList() {
  const [users, setUsers] = useState([]);

  const fetchUsers = async () => {
    const data = await getUsers();
    setUsers(data);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div>
      <h2>Users</h2>
      {users.length === 0 ? (
        <p>No users found.</p>
      ) : (
        <ul>
          {users.map((user) => (
            <li key={user._id}>
              {user.name} ({user.role}) - {user.email}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default UserList;
