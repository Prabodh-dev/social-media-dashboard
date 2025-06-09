// app.js - placeholder for future interactivity 

// Modal logic
const registerModal = document.getElementById('registerModal');
const loginModal = document.getElementById('loginModal');
const closeRegister = document.getElementById('closeRegister');
const closeLogin = document.getElementById('closeLogin');
const fab = document.getElementById('createPostBtn');
const logoutBtn = document.getElementById('logoutBtn');
const homeNav = document.getElementById('homeNav');
const profileNav = document.getElementById('profileNav');

// Show login/register modals if not logged in
function showAuthModal() {
  showWelcomeScreen();
}

closeRegister.onclick = () => {
  registerModal.style.display = 'none';
  if (!localStorage.getItem('token')) {
    document.getElementById('welcomeScreen').style.display = 'flex';
  }
};
closeLogin.onclick = () => {
  loginModal.style.display = 'none';
  if (!localStorage.getItem('token')) {
    document.getElementById('welcomeScreen').style.display = 'flex';
  }
};
window.onclick = function(event) {
  if (event.target === registerModal) registerModal.style.display = 'none';
  if (event.target === loginModal) loginModal.style.display = 'none';
  const postModal = document.getElementById('postModal');
  if (postModal && event.target === postModal) postModal.style.display = 'none';
};

// Show register modal from login modal (optional, add a link if you want)
// document.getElementById('toRegister').onclick = () => {
//   loginModal.style.display = 'none';
//   registerModal.style.display = 'flex';
// };

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
    localStorage.setItem('token', data.token);
    localStorage.setItem('username', data.username);
    loginModal.style.display = 'none';
    showWelcome();
  } catch (err) {
    errorDiv.textContent = err.message;
  }
};

function showWelcomeScreen() {
  document.getElementById('welcomeScreen').style.display = 'flex';
  document.getElementById('dashboard').style.display = 'none';
  const sidebar = document.querySelector('.sidebar');
  if (sidebar) sidebar.style.display = 'none';
  // Hide nav avatar
  const navAvatar = document.getElementById('userAvatar');
  if (navAvatar) navAvatar.style.display = 'none';
  // Hide logout button
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.style.display = 'none';
}

function showDashboard() {
  document.getElementById('welcomeScreen').style.display = 'none';
  document.getElementById('dashboard').style.display = 'block';
  const sidebar = document.querySelector('.sidebar');
  if (sidebar) sidebar.style.display = '';
  // Show nav avatar and logout
  const navAvatar = document.getElementById('userAvatar');
  if (navAvatar) navAvatar.style.display = '';
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.style.display = '';
}

function showWelcome() {
  showDashboard();
  const username = localStorage.getItem('username');
  document.querySelector('.main-content').innerHTML = `
    <h1 class="welcome-title">Welcome, <span style=\"color:#5a95f5\">${username}</span>!</h1>
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
  // Inject user info in sidebar
  const userCard = document.getElementById('sidebarUserCard');
  if (userCard) {
    userCard.innerHTML = `
      <span class="user-avatar" style="display:block;margin:0 auto 8px auto;background-image:url('https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=3578e5&color=fff');background-size:cover;"></span>
      <div class="username">${username}</div>
    `;
  }
  // Set avatar in nav
  const navAvatar = document.getElementById('userAvatar');
  if (navAvatar) {
    navAvatar.style.backgroundImage = `url('https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=3578e5&color=fff')`;
    navAvatar.style.backgroundSize = 'cover';
  }
  setupPostModal();
  loadPosts();
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
      loadPosts();
    } catch (err) {
      errorDiv.textContent = err.message;
    }
  }
});

async function loadPosts() {
  const token = localStorage.getItem('token');
  if (!token) return;
  const dashboard = document.getElementById('dashboard');
  dashboard.innerHTML = '<div style="text-align:center;">Loading posts...</div>';
  try {
    const res = await fetch(`${POSTS_API}`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to load posts');
    renderPosts(data.posts, 1, 1, data.posts);
  } catch (err) {
    dashboard.innerHTML = `<div class="error-message">${err.message}</div>`;
  }
}

function renderPosts(posts, page, totalPages, allPosts = null) {
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
  document.getElementById('dashboard').innerHTML = html;

  // Add event listeners for edit/delete
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.onclick = () => openPostModal(btn.getAttribute('data-content'), btn.getAttribute('data-id'));
  });
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.onclick = () => deletePost(btn.getAttribute('data-id'));
  });

  // Update stats widget
  const stats = document.getElementById('userStats');
  if (stats) {
    let userPostsCount = 0;
    if (allPosts && Array.isArray(allPosts) && allPosts.length) {
      userPostsCount = allPosts.filter(post => post.author.username === username).length;
    } else {
      userPostsCount = posts.filter(post => post.author.username === username).length;
    }
    stats.innerHTML = `
      <div><b>Your Posts:</b> ${userPostsCount}</div>
      <div><b>Feed:</b> All Posts</div>
    `;
  }
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
    loadPosts();
  } catch (err) {
    alert(err.message);
  }
}

function escapeHtml(text) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// --- New: Floating button and nav logic ---
if (fab) {
  fab.onclick = () => {
    // Only allow if logged in
    if (!localStorage.getItem('token')) {
      showAuthModal();
      return;
    }
    // If post modal exists, show it; else, create it
    let postModal = document.getElementById('postModal');
    if (!postModal) {
      showWelcome();
      postModal = document.getElementById('postModal');
    }
    openPostModal();
  };
}

if (logoutBtn) {
  logoutBtn.onclick = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    showWelcomeScreen();
  };
}

if (homeNav) {
  homeNav.onclick = () => {
    if (localStorage.getItem('token')) {
      showWelcome();
    } else {
      showAuthModal();
    }
  };
}

if (profileNav) {
  profileNav.onclick = () => {
    alert('Profile page coming soon!');
  };
}

// Floating logout button logic
const logoutBtnFloating = document.getElementById('logoutBtnFloating');
if (logoutBtnFloating) {
  logoutBtnFloating.onclick = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    showWelcomeScreen();
  };
}

// On load, show welcome screen or dashboard
if (localStorage.getItem('token') && localStorage.getItem('username')) {
  showDashboard();
  showWelcome();
} else {
  showWelcomeScreen();
}

window.addEventListener('DOMContentLoaded', () => {
  const regBtn = document.getElementById('welcomeRegisterBtn');
  const logBtn = document.getElementById('welcomeLoginBtn');
  if (regBtn) regBtn.onclick = () => {
    console.log('Register button clicked');
    document.getElementById('welcomeScreen').style.display = 'none';
    const regModal = document.getElementById('registerModal');
    if (regModal) regModal.style.display = 'flex';
    else console.log('Register modal not found');
  };
  if (logBtn) logBtn.onclick = () => {
    console.log('Login button clicked');
    document.getElementById('welcomeScreen').style.display = 'none';
    const logModal = document.getElementById('loginModal');
    if (logModal) logModal.style.display = 'flex';
    else console.log('Login modal not found');
  };
}); 