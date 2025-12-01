// ==========================================
// PCU INVENTORY FRONTEND SCRIPT (V2) - FINAL CORRECTED PASSWORD LOGIN
// ==========================================

const BACKEND_URL = 'https://pcu-inventory-backend-production.up.railway.app'; 

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
});

async function handleLogin(event) {
    event.preventDefault();
    const pin = document.getElementById('pinInput').value; // 'pin' is now the password
    const messageDiv = document.getElementById('message');
    
    // Clear previous credentials on new login attempt
    localStorage.clear();
    
    messageDiv.textContent = 'Authenticating... Please wait.';
    messageDiv.style.color = '#f1faee'; 

    if (!pin) { 
        messageDiv.textContent = 'Password cannot be empty.';
        messageDiv.style.color = '#e63946';
        return;
    }

    let success = false;
    let role = null;
    let username = null;

    const sendLoginRequest = async (endpoint) => {
        return fetch(`${BACKEND_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ pin: pin }) 
        });
    };

    // 1. Try MASTER ADMIN Login 
    try {
        const masterResponse = await sendLoginRequest('/api/master-login');
        const data = await masterResponse.json();

        if (masterResponse.ok && data.role === 'master') {
            success = true;
            role = 'master';
            username = 'Master Admin'; 
            // Store the PIN for Master Admin API access (User Management)
            localStorage.setItem('masterPin', pin); 
        } 
    } catch (e) {
        // Console warning only, as we continue to try regular login
        console.warn("Master Login attempt failed (Network error or invalid password).");
    }

    // 2. Try REGULAR User Login
    if (!success) {
        try {
            const userResponse = await sendLoginRequest('/api/login');
            const data = await userResponse.json();

            if (userResponse.ok) {
                success = true;
                role = data.role;
                username = data.username;
                // Store regular user details for session management
                localStorage.setItem('userRole', role);
                localStorage.setItem('username', username);
                localStorage.setItem('userPin', pin); // Using 'pin' for simple session re-use/access
            } else {
                // If both attempts fail, show the user login error message
                messageDiv.textContent = data.message || 'Invalid Password or unknown error.';
                messageDiv.style.color = '#e63946'; 
            }
        } catch (e) {
            messageDiv.textContent = 'Network Error! Failed to connect to backend.';
            messageDiv.style.color = '#e63946'; 
            console.error("User Login Network Error:", e);
        }
    }

    // 3. Handle Navigation
    if (success) {
        messageDiv.textContent = `Login Successful! Welcome, ${username}.`;
        messageDiv.style.color = '#64ffda'; 
        await new Promise(r => setTimeout(r, 500)); 

        if (role === 'master' || role === 'admin') {
            window.location.href = 'user_management.html';
        } else {
            // Standard User (role === 'user')
            window.location.href = 'inventory_dashboard.html'; 
        }
    }
}
