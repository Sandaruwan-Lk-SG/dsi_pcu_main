// ==========================================
// PCU INVENTORY FRONTEND SCRIPT (V2) - FINAL LOGIN LOGIC
// ==========================================

// ඔබ ලබා දුන් නිවැරදි Backend URL එක මෙහි ඇත
const BACKEND_URL = 'https://pcu-inventory-backend-production.up.railway.app'; 

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    } else {
        console.error("Error: loginForm element not found in index.html");
    }
});

async function handleLogin(event) {
    event.preventDefault();
    const pin = document.getElementById('pinInput').value;
    const messageDiv = document.getElementById('message');
    
    messageDiv.textContent = 'Logging in... Please wait.';
    messageDiv.style.color = '#f1faee'; // White/Default color

    if (pin.length !== 4) {
        messageDiv.textContent = 'PIN must be 4 digits.';
        messageDiv.style.color = '#e63946'; // Red
        return;
    }

    let success = false;
    let role = null;
    let username = null;

    // Helper function to send the POST request
    const sendLoginRequest = async (endpoint) => {
        return fetch(`${BACKEND_URL}${endpoint}`, {
            method: 'POST',
            // CRITICAL: Content-Type must be application/json
            headers: { 'Content-Type': 'application/json' }, 
            // CRITICAL: Key must be 'pin' to match server.js req.body.pin
            body: JSON.stringify({ pin: pin }) 
        });
    };

    // 1. Try MASTER ADMIN Login (Checks against Railway Env Var)
    try {
        const masterResponse = await sendLoginRequest('/api/master-login');
        
        if (masterResponse.ok) {
            const data = await masterResponse.json();
            if (data.role === 'master') {
                success = true;
                role = 'master';
                username = 'Master Admin'; 
                // Store PIN to be used as 'X-Master-Pin' header later
                localStorage.setItem('masterPin', pin); 
            }
        }
    } catch (e) {
        // Ignore specific error and proceed to regular login
        console.warn("Master Login attempt failed (could be network or invalid pin). Proceeding to user login.");
    }

    // 2. If not Master, try REGULAR User Login (Checks against PostgreSQL Database)
    if (!success) {
        try {
            const userResponse = await sendLoginRequest('/api/login');
            const data = await userResponse.json();

            if (userResponse.ok) {
                success = true;
                role = data.role;
                username = data.username;

                // Store credentials for the Inventory Dashboard
                localStorage.setItem('userRole', role);
                localStorage.setItem('username', username);
                localStorage.setItem('userPin', pin); // Using PIN as simple session key
            } else {
                // Handle 401 Unauthorized or other server-side errors
                messageDiv.textContent = data.message || 'Invalid PIN or unknown error.';
                messageDiv.style.color = '#e63946'; // Red
            }
        } catch (e) {
            // Handle true Network/CORS/502 errors
            messageDiv.textContent = 'Network Error! Check if backend is running at the correct URL.';
            messageDiv.style.color = '#e63946'; // Red
            console.error("Login Network Error:", e);
        }
    }

    // 3. Handle Navigation
    if (success) {
        messageDiv.textContent = `Login Successful! Welcome, ${username}.`;
        messageDiv.style.color = '#64ffda'; // Success color
        
        // Wait a moment for visual confirmation before navigating
        await new Promise(r => setTimeout(r, 500)); 

        if (role === 'master') {
            window.location.href = 'user_management.html';
        } else {
            // Go to the main inventory page
            window.location.href = 'inventory_dashboard.html'; 
        }
    }
}
