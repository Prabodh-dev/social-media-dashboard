// app.js - placeholder for future interactivity 

// Modal logic
const registerBtn = document.getElementById('registerBtn');
const loginBtn = document.getElementById('loginBtn');
const registerModal = document.getElementById('registerModal');
const loginModal = document.getElementById('loginModal');
const closeRegister = document.getElementById('closeRegister');
const closeLogin = document.getElementById('closeLogin');

registerBtn.onclick = () => {
  registerModal.style.display = 'flex';
};
loginBtn.onclick = () => {
  loginModal.style.display = 'flex';
};
closeRegister.onclick = () => {
  registerModal.style.display = 'none';
};
closeLogin.onclick = () => {
  loginModal.style.display = 'none';
};
window.onclick = function(event) {
  if (event.target === registerModal) registerModal.style.display = 'none';
  if (event.target === loginModal) loginModal.style.display = 'none';
};

// Placeholder for form submission
const registerForm = document.getElementById('registerForm');
const loginForm = document.getElementById('loginForm');

const API_BASE = 'http://localhost:4000/api/users';
const POSTS_API = 'http://localhost:4000/api/posts';

registerForm.onsubmit = async (e) => {
  e.preventDefault();
  const username = document.getElementById('registerUsername').value.trim();
  const password = document.getElementById('registerPassword').value;
  const errorDiv = document.getElementById('registerError');
  errorDiv.textContent = '';
  try {
    const res = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Registration failed');
    // Save token and username
    localStorage.setItem('token', data.token);
    localStorage.setItem('username', data.username);
    registerModal.style.display = 'none';
    showWelcome();
  } catch (err) {
    errorDiv.textContent = err.message;
  }
};

loginForm.onsubmit = async (e) => {
  e.preventDefault();
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;
  const errorDiv = document.getElementById('loginError');
  errorDiv.textContent = '';
  try {
    const res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Login failed');
    // Save token and username
    localStorage.setItem('token', data.token);
    localStorage.setItem('username', data.username);
    loginModal.style.display = 'none';
    showWelcome();
  } catch (err) {
    errorDiv.textContent = err.message;
  }
};

function showWelcome() {
  const username = localStorage.getItem('username');
  document.querySelector('.main-content').innerHTML = `
    <h1 class="welcome-title">Welcome, <span style=\"color:#3578e5\">${username}</span>!</h1>
    <button id="logoutBtn" class="platform-btn" style="margin-top:30px;">Logout</button>
    <button id="createPostBtn" class="platform-btn" style="margin-top:30px; margin-left:10px;">Create Post</button>
    <div id="dashboard"></div>
    <!-- Create/Edit Post Modal -->
    <div id="postModal" class="modal">
      <div class="modal-content">
        <span class="close" id="closePostModal">&times;</span>
        <h2 id="postModalTitle">Create Post</h2>
        <form id="postForm">
          <textarea id="postContent" placeholder="What's on your mind?" required style="width:100%;height:80px;resize:vertical;"></textarea>
          <button type="submit">Save</button>
        </form>
        <div id="postError" class="error-message"></div>
      </div>
    </div>
  `;
  document.getElementById('logoutBtn').onclick = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    location.reload();
  };
  document.getElementById('createPostBtn').onclick = () => openPostModal();
  setupPostModal();
  loadPosts(1);
}

function setupPostModal() {
  const postModal = document.getElementById('postModal');
  const closePostModal = document.getElementById('closePostModal');
  closePostModal.onclick = () => postModal.style.display = 'none';
  window.onclick = function(event) {
    if (event.target === postModal) postModal.style.display = 'none';
  };
}

let editingPostId = null;

function openPostModal(content = '', postId = null) {
  editingPostId = postId;
  document.getElementById('postModalTitle').textContent = postId ? 'Edit Post' : 'Create Post';
  document.getElementById('postContent').value = content;
  document.getElementById('postError').textContent = '';
  document.getElementById('postModal').style.display = 'flex';
}

document.addEventListener('submit', async function(e) {
  if (e.target && e.target.id === 'postForm') {
    e.preventDefault();
    const content = document.getElementById('postContent').value.trim();
    const errorDiv = document.getElementById('postError');
    errorDiv.textContent = '';
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      let res, data;
      if (editingPostId) {
        res = await fetch(`${POSTS_API}/${editingPostId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
          },
          body: JSON.stringify({ content })
        });
      } else {
        res = await fetch(POSTS_API, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
          },
          body: JSON.stringify({ content })
        });
      }
      data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save post');
      document.getElementById('postModal').style.display = 'none';
      loadPosts(1);
    } catch (err) {
      errorDiv.textContent = err.message;
    }
  }
});

async function loadPosts(page = 1) {
  const token = localStorage.getItem('token');
  if (!token) return;
  const dashboard = document.getElementById('dashboard');
  dashboard.innerHTML = '<div style="text-align:center;">Loading posts...</div>';
  try {
    const res = await fetch(`${POSTS_API}?page=${page}&limit=3`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to load posts');
    renderPosts(data.posts, data.page, data.totalPages);
  } catch (err) {
    dashboard.innerHTML = `<div class="error-message">${err.message}</div>`;
  }
}

function renderPosts(posts, page, totalPages) {
  const username = localStorage.getItem('username');
  let html = '';
  if (!posts.length) {
    html = '<div style="text-align:center;">No posts yet.</div>';
  } else {
    html = posts.map(post => `
      <div class="post-card">
        <div class="post-content">${escapeHtml(post.content)}</div>
        <div class="post-meta">
          <span>by <b>${escapeHtml(post.author.username || 'User')}</b></span>
          ${post.author.username === username ? `
            <button class="edit-btn" data-id="${post._id}" data-content="${escapeHtml(post.content)}">Edit</button>
            <button class="delete-btn" data-id="${post._id}">Delete</button>
          ` : ''}
        </div>
      </div>
    `).join('');
  }
  // Pagination
  html += '<div class="pagination">';
  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="page-btn" data-page="${i}"${i === page ? ' disabled' : ''}>${i}</button>`;
  }
  html += '</div>';
  document.getElementById('dashboard').innerHTML = html;

  // Add event listeners for edit/delete
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.onclick = () => openPostModal(btn.getAttribute('data-content'), btn.getAttribute('data-id'));
  });
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.onclick = () => deletePost(btn.getAttribute('data-id'));
  });
  document.querySelectorAll('.page-btn').forEach(btn => {
    btn.onclick = () => loadPosts(Number(btn.getAttribute('data-page')));
  });
}

async function deletePost(postId) {
  if (!confirm('Are you sure you want to delete this post?')) return;
  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`${POSTS_API}/${postId}`, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to delete post');
    loadPosts(1);
  } catch (err) {
    alert(err.message);
  }
}

function escapeHtml(text) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// Auto-show welcome if already logged in
if (localStorage.getItem('token') && localStorage.getItem('username')) {
  showWelcome();
} 