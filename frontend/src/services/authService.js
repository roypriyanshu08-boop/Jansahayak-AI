import api from './api';

const DEFAULT_USERS = [
  {
    id: 'usr-citizen-default',
    name: 'JanSahayak Citizen',
    email: 'citizen@jansahayak.gov.in',
    phone: '9876543210',
    password: 'password123',
    role: 'citizen',
    has_logged_in_before: true,
    hasLoggedInBefore: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'usr-admin-default',
    name: 'JanSahayak Administrator',
    email: 'admin@jansahayak.gov.in',
    phone: '9999999999',
    password: 'admin123',
    role: 'admin',
    has_logged_in_before: true,
    hasLoggedInBefore: true,
    created_at: new Date().toISOString()
  }
];

const getStoredUsers = () => {
  try {
    const data = localStorage.getItem('jansahayak_registered_users');
    if (!data) {
      localStorage.setItem('jansahayak_registered_users', JSON.stringify(DEFAULT_USERS));
      return DEFAULT_USERS;
    }
    return JSON.parse(data);
  } catch (e) {
    return DEFAULT_USERS;
  }
};

const saveStoredUser = (newUser) => {
  const users = getStoredUsers();
  users.push(newUser);
  localStorage.setItem('jansahayak_registered_users', JSON.stringify(users));
};

export const authService = {
  register: async (userData) => {
    const cleanEmail = (userData.email || '').trim().toLowerCase();
    const cleanName = (userData.name || '').trim();
    const cleanPassword = userData.password || '';

    if (!cleanName) throw new Error('Full name is required.');
    if (!cleanEmail || !cleanEmail.includes('@')) throw new Error('Please enter a valid email address.');
    if (!cleanPassword || cleanPassword.length < 6) throw new Error('Password must be at least 6 characters long.');

    // Try backend registration API first
    try {
      const response = await api.post('/auth/register', userData);
      const uniqueId = response.data.id || `usr-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      const registeredUserRecord = {
        id: uniqueId,
        name: cleanName,
        email: cleanEmail,
        phone: userData.phone || '',
        password: cleanPassword,
        role: userData.role || 'citizen',
        has_logged_in_before: false,
        hasLoggedInBefore: false,
        created_at: new Date().toISOString()
      };
      saveStoredUser(registeredUserRecord);
      return response.data;
    } catch (err) {
      // Check if backend returned specific error like email already exists
      if (err.response?.data?.detail) {
        throw new Error(err.response.data.detail);
      }

      // Backend offline fallback - check local persistence for duplicate email
      const users = getStoredUsers();
      const existing = users.find(u => u.email.toLowerCase() === cleanEmail);
      if (existing) {
        throw new Error('An account with this email address already exists. Please login.');
      }

      const uniqueId = `usr-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      const newUser = {
        id: uniqueId,
        name: cleanName,
        email: cleanEmail,
        phone: userData.phone || '',
        password: cleanPassword,
        role: userData.role || 'citizen',
        has_logged_in_before: false,
        hasLoggedInBefore: false,
        created_at: new Date().toISOString()
      };

      saveStoredUser(newUser);
      return newUser;
    }
  },

  login: async (credentials) => {
    const cleanEmail = (credentials.email || '').trim().toLowerCase();
    const cleanPassword = credentials.password || '';

    if (!cleanEmail) throw new Error('Email address is required.');
    if (!cleanPassword) throw new Error('Password is required.');

    // Check locally registered user record for has_logged_in_before state tracking
    const localUsers = getStoredUsers();
    let localMatchedUser = localUsers.find(u => u.email.toLowerCase() === cleanEmail);

    // Attempt backend API login first
    try {
      const response = await api.post('/auth/login', credentials);
      if (response.data?.access_token) {
        localStorage.setItem('jansahayak_token', response.data.access_token);
      }
      if (response.data?.user) {
        localStorage.setItem('jansahayak_user', JSON.stringify(response.data.user));
      }

      // Update local storage record if it exists
      if (localMatchedUser) {
        localMatchedUser.has_logged_in_before = true;
        localMatchedUser.hasLoggedInBefore = true;
        localStorage.setItem('jansahayak_registered_users', JSON.stringify(localUsers));
      }

      return response.data;
    } catch (err) {
      // If backend returned a clear 404 or 401 response, respect backend's exact message
      if (err.response) {
        const detail = err.response.data?.detail || 'Invalid email or password.';
        throw new Error(detail);
      }

      // Backend offline fallback check against locally stored registered users
      if (!localMatchedUser) {
        throw new Error('Account not found. Please register first.');
      }

      if (localMatchedUser.password !== cleanPassword) {
        throw new Error('Incorrect email or password.');
      }

      const wasLoggedInBefore = localMatchedUser.has_logged_in_before === true || localMatchedUser.hasLoggedInBefore === true;

      // Update user account record in persistent storage to true for future logins
      localMatchedUser.has_logged_in_before = true;
      localMatchedUser.hasLoggedInBefore = true;
      localStorage.setItem('jansahayak_registered_users', JSON.stringify(localUsers));

      const userSession = {
        id: localMatchedUser.id,
        name: localMatchedUser.name,
        email: localMatchedUser.email,
        phone: localMatchedUser.phone || '',
        role: localMatchedUser.role || 'citizen',
        has_logged_in_before: wasLoggedInBefore,
        hasLoggedInBefore: wasLoggedInBefore,
        created_at: localMatchedUser.created_at
      };

      const mockToken = `mock-jwt-token-${localMatchedUser.id}-${Date.now()}`;
      localStorage.setItem('jansahayak_token', mockToken);
      localStorage.setItem('jansahayak_user', JSON.stringify(userSession));

      return {
        access_token: mockToken,
        token_type: 'bearer',
        user: userSession
      };
    }
  },

  getCurrentUser: async () => {
    const token = localStorage.getItem('jansahayak_token');
    if (!token) return null;

    try {
      const response = await api.get('/auth/me');
      if (response.data) {
        localStorage.setItem('jansahayak_user', JSON.stringify(response.data));
        return response.data;
      }
    } catch (err) {
      // If server returned 401, token is invalid
      if (err.response?.status === 401) {
        localStorage.removeItem('jansahayak_token');
        localStorage.removeItem('jansahayak_user');
        return null;
      }
    }

    // Return stored user object if available
    try {
      const stored = localStorage.getItem('jansahayak_user');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      // ignore
    }

    return null;
  },

  logout: () => {
    localStorage.removeItem('jansahayak_token');
    localStorage.removeItem('jansahayak_user');
  },
};

