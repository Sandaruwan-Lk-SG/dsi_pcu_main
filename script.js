// ==========================================
// USER MANAGEMENT SCRIPT (MASTER ADMIN ONLY) - FINAL CORRECTED VERSION
// ==========================================

const BACKEND_URL = 'https://pcu-inventory-backend-production.up.railway.app'; 
const masterPin = localStorage.getItem('masterPin');
const userListBody = document.querySelector('#userList tbody');
const addMessageDiv = document.getElementById('addMessage');
const listMessageDiv = document.getElementById('listMessage');

// ----------------------------------------------------
// INITIALIZATION CHECK
// ----------------------------------------------------
if (!masterPin) {
    alert('Unauthorized Access. Please login as Master Admin.');
    window.location.href = 'index.html';
}

// ----------------------------------------------------
// 1. Fetch and Display Users (GET /api/users)
// ----------------------------------------------------
async function fetchUsers() {
    listMessageDiv.textContent = 'Loading users...';
    listMessageDiv.style.color = '#f1faee';
    userListBody.innerHTML = ''; // Clear existing rows

    try {
        const response = await fetch(`${BACKEND_URL}/api/users`, {
            method: 'GET',
            headers: {
                'X-Master-Pin': masterPin 
            }
        });
        
        if (response.status === 403) {
             listMessageDiv.textContent = 'AUTHORIZATION FAILED: Check MASTER_ADMIN_PIN value in Railway Env Vars.';
             listMessageDiv.style.color = '#e63946';
             throw new Error('403 Forbidden: Master Admin PIN rejected by server.');
        }
        if (!response.ok) {
            throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
        }

        const users = await response.json();
        listMessageDiv.textContent = users.length === 0 ? 'No users found.' : '';
        listMessageDiv.style.color = users.length === 0 ? '#f1faee' : 'transparent';

        // === Logic to display users ===
        users.forEach(user => {
            const row = userListBody.insertRow();
            row.insertCell(0).textContent = user.id; 
            row.insertCell(1).textContent = user.username;
            row.insertCell(2).textContent = user.role.toUpperCase();

            const actionCell = row.insertCell(3);
            const removeButton = document.createElement('button');
            removeButton.textContent = 'Remove';
            removeButton.className = 'remove-btn';
            // Using username for the delete request (Backend will resolve ID)
            removeButton.onclick = () => removeUser(user.username); 
            actionCell.appendChild(removeButton);
        });
        
    } catch (error) {
        if (!error.message.includes('403 Forbidden')) {
            listMessageDiv.textContent = `Error loading users: ${error.message}`;
            listMessageDiv.style.color = '#e63946';
        }
        console.error("Fetch Users Error:", error);
    }
}

// ----------------------------------------------------
// 2. Add New User (POST /api/users) - Includes list refresh
// ----------------------------------------------------
document.getElementById('addUserForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    addMessageDiv.textContent = 'Adding user...';
    addMessageDiv.style.color = '#f1faee';

    const username = document.getElementById('newUsername').value.trim();
    const role = document.getElementById('newRole').value;
    const pin = document.getElementById('newPin').value; // Password

    if (pin.length < 8) { 
        addMessageDiv.textContent = 'Password must be at least 8 characters long.';
        addMessageDiv.style.color = '#e63946';
        return;
    }
    
    try {
        const response = await fetch(`${BACKEND_URL}/api/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Pin': masterPin 
            },
            body: JSON.stringify({ 
                username: username, 
                role: role, 
                pin: pin 
            }) 
        });

        const data = await response.json();
        
        if (response.ok) {
            addMessageDiv.textContent = `User ${username} created successfully!`;
            addMessageDiv.style.color = '#64ffda';
            document.getElementById('addUserForm').reset();
            fetchUsers(); // Refresh list (FIXED)
        } else if (response.status === 409) {
             addMessageDiv.textContent = `Error: Username '${username}' already exists.`;
             addMessageDiv.style.color = '#e63946';
        } else if (response.status === 403) {
             addMessageDiv.textContent = 'AUTHORIZATION FAILED: Check MASTER_ADMIN_PIN.';
             addMessageDiv.style.color = '#e63946';
        } else {
            addMessageDiv.textContent = `Failed to add user: ${data.message || response.statusText}`;
            addMessageDiv.style.color = '#e63946';
        }
    } catch (error) {
        addMessageDiv.textContent = 'Network Error! Failed to connect to backend.';
        addMessageDiv.style.color = '#e63946';
        console.error("Add User Network Error:", error);
    }
});


// ----------------------------------------------------
// 3. Remove Existing User (DELETE /api/users/:username) - Includes list refresh
// ----------------------------------------------------
async function removeUser(username) {
    if (!confirm(`Are you sure you want to remove the user: ${username}? This action is permanent.`)) {
        return;
    }

    try {
        listMessageDiv.textContent = `Attempting to remove user ${username}...`;
        listMessageDiv.style.color = '#f1faee';
        
        const response = await fetch(`${BACKEND_URL}/api/users/${username}`, {
            method: 'DELETE', 
            headers: {
                'X-Master-Pin': masterPin
            }
        });

        if (response.status === 403) {
            alert('AUTHORIZATION FAILED: Master Admin PIN rejected. User not deleted.');
            listMessageDiv.textContent = 'AUTHORIZATION FAILED: Check MASTER_ADMIN_PIN.';
            listMessageDiv.style.color = '#e63946';
            return;
        }

        if (response.ok || response.status === 204) {
            listMessageDiv.textContent = `User ${username} successfully removed.`;
            listMessageDiv.style.color = '#64ffda';
            
            fetchUsers(); // Refresh list (FIXED)
        } else if (response.status === 404) {
            alert(`User ${username} not found in the database.`);
            listMessageDiv.textContent = `User ${username} not found.`;
            listMessageDiv.style.color = '#e63946';
        } else {
            const errorText = await response.text();
            alert(`Failed to remove user: ${errorText || response.statusText}`);
            listMessageDiv.textContent = `Deletion failed: ${response.statusText}`;
            listMessageDiv.style.color = '#e63946';
        }
    } catch (error) {
        console.error("Remove User Error:", error);
        listMessageDiv.textContent = 'Network or Server Error during deletion.';
        listMessageDiv.style.color = '#e63946';
    }
}

// ----------------------------------------------------
// INITIAL EXECUTION
// ----------------------------------------------------
fetchUsers();
