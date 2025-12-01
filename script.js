// ==========================================
// PCU INVENTORY FRONTEND SCRIPT (V2)
// ==========================================

// Back-end URL එක ඔබේ Railway Deployment URL එක විය යුතුයි
const BACKEND_URL = 'https://pcu-inventory-backend-production.up.railway.app'; 

document.getElementById('loginForm').addEventListener('submit', handleLogin);

async function handleLogin(event) {
    event.preventDefault();
    const pin = document.getElementById('pinInput').value;
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = 'Logging in...';
    messageDiv.style.color = '#f1faee'; // White/Default color

    if (pin.length !== 4) {
        messageDiv.textContent = 'PIN must be 4 digits.';
        messageDiv.style.color = '#e63946'; // Red
        return;
    }

    let success = false;
    let role = null;
    let username = null;

    // 1. Try MASTER ADMIN Login first (to access user management page)
    try {
        const masterResponse = await fetch(`${BACKEND_URL}/api/master-login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pin: pin })
        });
        
        const data = await masterResponse.json();
        if (masterResponse.ok && data.role === 'master') {
            success = true;
            role = 'master';
            username = 'Master Admin'; 
            // Save the PIN temporarily for masterAuth check on the next page
            localStorage.setItem('masterPin', pin); 
        }
    } catch (e) {
        // Network Error for master login (ignore, proceed to regular login)
    }

    // 2. If not master, try REGULAR User Login (Admin/User)
    if (!success) {
        try {
            const userResponse = await fetch(`${BACKEND_URL}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pin: pin })
            });

            const data = await userResponse.json();

            if (userResponse.ok) {
                success = true;
                role = data.role;
                username = data.username;

                // Save user credentials (for fetching items/transactions)
                localStorage.setItem('userRole', role);
                localStorage.setItem('username', username);
                localStorage.setItem('userPin', pin); // Using PIN as simple session key for now
            } else {
                messageDiv.textContent = data.message || 'Invalid PIN or Network Error.';
                messageDiv.style.color = '#e63946'; // Red
            }
        } catch (e) {
            messageDiv.textContent = 'Network Error. Check if backend is running.';
            messageDiv.style.color = '#e63946'; // Red
        }
    }

    // 3. Handle Navigation
    if (success) {
        messageDiv.textContent = `Login Successful! Welcome, ${username}.`;
        messageDiv.style.color = '#64ffda'; // Success color

        if (role === 'master') {
            // Master Admin is directed to the user management page
            window.location.href = 'user_management.html';
        } else {
            // Regular Admin/User is directed to the main inventory dashboard
            // NOTE: You will need to create 'inventory_dashboard.html' later.
            window.location.href = 'inventory_dashboard.html'; 
        }
    }
}
