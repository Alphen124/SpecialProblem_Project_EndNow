// ========================================
// Authentication & API Management
// ========================================

const API_BASE_URL = 'http://localhost:3001';

// ========================================
// Auth Helper Functions
// ========================================

function getAuthToken() {
    return localStorage.getItem('access_token');
}

function getRefreshToken() {
    return localStorage.getItem('refresh_token');
}

function getUserData() {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
}

function saveAuthData(accessToken, refreshToken, user) {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
}

function clearAuthData() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
}

function isAuthenticated() {
    return !!getAuthToken();
}

// ========================================
// API Functions
// ========================================

async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = getAuthToken();

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (token && !options.skipAuth) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(url, {
            ...options,
            headers
        });

        const data = await response.json();

        if (!response.ok) {
            // ถ้า token หมดอายุ และไม่ได้อยู่ในโหมด skipRefresh
            if (response.status === 401 && !options.skipRefresh) {
                const refreshed = await refreshAccessToken();
                if (refreshed) {
                    // ลองใหม่อีกครั้งด้วย token ใหม่
                    return apiRequest(endpoint, { ...options, skipRefresh: true });
                } else {
                    // Refresh ไม่สำเร็จ ให้ logout
                    logout();
                    throw new Error('Session expired. Please login again.');
                }
            }
            throw new Error(data.message || 'API request failed');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

async function refreshAccessToken() {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return false;

    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken })
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('access_token', data.data.access_token);
            return true;
        }
    } catch (error) {
        console.error('Token refresh failed:', error);
    }
    return false;
}

// ========================================
// Auth API Calls
// ========================================

async function login(email, password) {
    const data = await apiRequest('/api/auth/login', {
        method: 'POST',
        skipAuth: true,
        body: JSON.stringify({ email, password })
    });

    if (data.success) {
        const { access_token, refresh_token, user } = data.data;
        saveAuthData(access_token, refresh_token, user);
        return { success: true, user };
    }

    throw new Error(data.message || 'Login failed');
}

async function register(email, password, fname, lname, tel = '') {
    // Validate required fields
    if (!email || !password || !fname || !lname || !tel) {
        throw new Error('All fields are required');
    }
    
    // Validate phone number format
    if (!/^[0-9]{9,10}$/.test(tel)) {
        throw new Error('Phone number must be 9-10 digits');
    }
    
    const userData = {
        email: email.toLowerCase().trim(),
        password: password,
        fname: fname.trim(),
        lname: lname.trim(),
        tel: tel.trim()
    };
    
    console.log('Sending registration data:', userData);
    
    const data = await apiRequest('/api/auth/register', {
        method: 'POST',
        skipAuth: true,
        body: JSON.stringify(userData)
    });

    if (data.success) {
        return { success: true, data: data.data, message: data.message };
    }

    throw new Error(data.message || 'Registration failed');
}

async function getProfile() {
    const data = await apiRequest('/api/auth/profile', {
        method: 'GET'
    });

    if (data.success) {
        // Update user data in localStorage
        localStorage.setItem('user', JSON.stringify(data.data));
        return data.data;
    }

    throw new Error(data.message || 'Failed to fetch profile');
}

function logout() {
    clearAuthData();
    window.location.href = '/login.html';
}

// ========================================
// UI Helper Functions
// ========================================

function updateHeaderForAuth() {
    const headerActions = document.querySelector('.header-actions');
    if (!headerActions) return;

    if (isAuthenticated()) {
        const user = getUserData();
        const userName = user ? (user.fname || user.email.split('@')[0]) : 'User';
        headerActions.innerHTML = `
            <div class="user-menu">
                <button class="btn btn-ghost user-dropdown-btn" id="userMenuBtn" onclick="toggleUserMenu(event)">
                    <span class="user-avatar">${userName.charAt(0).toUpperCase()}</span>
                    <span class="user-name">${userName}</span>
                    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" style="margin-left:6px;vertical-align:middle;"><path d="M5 8l5 5 5-5" stroke="#4F9CF9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </button>
                <div class="user-popup-card hidden" id="userPopupCard">
                    <div class="user-popup-avatar">${userName.charAt(0).toUpperCase()}</div>
                    <div class="user-popup-name">${userName}</div>
                    <div class="user-popup-actions">
                        <a href="#" onclick="logout(); return false;">ออกจากระบบ</a>
                    </div>
                </div>
            </div>
        `;
    } else {
        headerActions.innerHTML = `
            <a href="/login.html" class="btn btn-primary">เข้าสู่ระบบ</a>
            <a href="/register.html" class="btn btn-outline">สมัครสมาชิก</a>
        `;
    }
}

function toggleUserMenu(e) {
    e && e.stopPropagation();
    const popup = document.getElementById('userPopupCard');
    if (popup) {
        popup.classList.toggle('hidden');
        if (!popup.classList.contains('hidden')) {
            setTimeout(() => {
                document.addEventListener('click', closeUserMenuOnClick);
            }, 0);
        } else {
            document.removeEventListener('click', closeUserMenuOnClick);
        }
    }
}

function closeUserMenuOnClick(event) {
    const popup = document.getElementById('userPopupCard');
    const btn = document.getElementById('userMenuBtn');
    if (popup && !popup.classList.contains('hidden')) {
        if (!popup.contains(event.target) && !btn.contains(event.target)) {
            popup.classList.add('hidden');
            document.removeEventListener('click', closeUserMenuOnClick);
        }
    }
}

function viewProfile() {
    // Navigate to profile page or show modal
    alert('Profile feature coming soon!');
}

// ========================================
// Page Protection
// ========================================

const NoteLetAuth = {
    // Check if user is logged in
    isAuthenticated: isAuthenticated,
    
    // Redirect to login if not authenticated
    requireAuth: function() {
        if (!isAuthenticated()) {
            window.location.href = '/login.html';
            return false;
        }
        return true;
    },
    
    // Redirect to home if already authenticated
    redirectIfAuthenticated: function() {
        if (isAuthenticated()) {
            window.location.href = '/index.html';
            return true;
        }
        return false;
    },
    
    // Auth functions
    login: login,
    register: register,
    logout: logout,
    getProfile: getProfile,
    
    // User data
    getUser: getUserData,
    getToken: getAuthToken,
    
    // API request
    api: apiRequest
};

// Auto-update header on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateHeaderForAuth);
} else {
    updateHeaderForAuth();
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    const userMenu = document.querySelector('.user-menu');
    const dropdown = document.getElementById('userDropdown');
    
    if (userMenu && dropdown && !userMenu.contains(event.target)) {
        dropdown.style.display = 'none';
    }
});