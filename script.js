const BACKEND_URL = 'https://masterbackendpcu-production.up.railway.app';
const masterPin = localStorage.getItem('masterPin');

const userListBody = document.querySelector('#userList tbody');
const addMessageDiv = document.getElementById('addMessage');
const listMessageDiv = document.getElementById('listMessage');
const addUserForm = document.getElementById('addUserForm');

if (!masterPin) {
  alert('Unauthorized Access. Please login as Master Admin.');
  window.location.href = 'index.html';
}

function baseUrl() { return BACKEND_URL.replace(/\/$/, ''); }
async function safeJson(res) { try { return await res.json(); } catch(e) { return null; } }

async function fetchUsers() {
  if (listMessageDiv) listMessageDiv.textContent = 'Loading users...';
  if (userListBody) userListBody.innerHTML = '';

  try {
    const res = await fetch(`${baseUrl()}/api/users`, { method: 'GET', headers: { 'x-master-pin': masterPin } });
    if (res.status === 403) { if (listMessageDiv) listMessageDiv.textContent = 'AUTHORIZATION FAILED: Master PIN rejected.'; return; }
    if (!res.ok) { const err = await safeJson(res); throw new Error((err && (err.message || err.error)) || res.statusText); }
    const users = await safeJson(res) || [];
    if (listMessageDiv) listMessageDiv.textContent = users.length === 0 ? 'No users found.' : '';
    users.forEach(user => {
      const row = userListBody.insertRow();
      row.insertCell(0).textContent = user.id;
      row.insertCell(1).textContent = user.username;
      row.insertCell(2).textContent = String(user.role).toUpperCase();
      const actionCell = row.insertCell(3);
      const removeBtn = document.createElement('button');
      removeBtn.textContent = 'Remove';
      removeBtn.className = 'btn btn-sm btn-danger';
      removeBtn.onclick = () => removeUser(user.username);
      actionCell.appendChild(removeBtn);
    });
  } catch (err) {
    console.error('fetchUsers error:', err);
    if (listMessageDiv) listMessageDiv.textContent = `Error loading users: ${err.message}`;
  }
}

addUserForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (addMessageDiv) { addMessageDiv.textContent = 'Adding user...'; addMessageDiv.className = ''; }
  const username = (document.getElementById('newUsername') || {}).value?.trim() || '';
  const password = (document.getElementById('newPassword') || {}).value || '';
  const role = (document.getElementById('newRole') || {}).value || '';
  if (!username || !password || !role) { if (addMessageDiv) { addMessageDiv.textContent = 'Please fill all fields.'; addMessageDiv.className='text-danger'; } return; }
  if (password.length < 8) { if (addMessageDiv) { addMessageDiv.textContent = 'Password must be at least 8 characters.'; addMessageDiv.className='text-danger'; } return; }

  try {
    const res = await fetch(`${baseUrl()}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-master-pin': masterPin },
      body: JSON.stringify({ username, role, password })
    });
    const data = await safeJson(res);
    if (res.ok) { if (addMessageDiv) { addMessageDiv.textContent = `User ${username} created successfully!`; addMessageDiv.className='text-success'; } addUserForm.reset(); fetchUsers(); }
    else if (res.status === 409) { if (addMessageDiv) { addMessageDiv.textContent = `Error: Username '${username}' already exists.`; addMessageDiv.className='text-danger'; } }
    else { const errMsg = (data && (data.error || data.message)) || res.statusText; if (addMessageDiv) { addMessageDiv.textContent = `Failed to add user: ${errMsg}`; addMessageDiv.className='text-danger'; } }
  } catch (err) { console.error('addUser error:', err); if (addMessageDiv) { addMessageDiv.textContent = 'Network Error! Failed to connect to backend.'; addMessageDiv.className='text-danger'; } }
});

async function removeUser(username) {
  if (!confirm(`Are you sure you want to remove the user: ${username}?`)) return;
  if (listMessageDiv) { listMessageDiv.textContent = `Attempting to remove user ${username}...`; listMessageDiv.className=''; }
  try {
    const res = await fetch(`${baseUrl()}/api/users/${encodeURIComponent(username)}`, { method: 'DELETE', headers: { 'x-master-pin': masterPin } });
    if (res.ok || res.status === 204) { if (listMessageDiv) { listMessageDiv.textContent = `User ${username} successfully removed.`; listMessageDiv.className='text-success'; } fetchUsers(); }
    else if (res.status === 404) { if (listMessageDiv) { listMessageDiv.textContent = `User ${username} not found.`; listMessageDiv.className='text-warning'; } }
    else { const data = await safeJson(res); const errMsg = (data && (data.error || data.message)) || res.statusText; if (listMessageDiv) { listMessageDiv.textContent = `Deletion failed: ${errMsg}`; listMessageDiv.className='text-danger'; } }
  } catch (err) { console.error('removeUser error:', err); if (listMessageDiv) { listMessageDiv.textContent = 'Network or Server Error during deletion.'; listMessageDiv.className='text-danger'; } }
}

// initial
fetchUsers();
