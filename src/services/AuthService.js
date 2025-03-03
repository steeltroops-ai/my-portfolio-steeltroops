// Get admin credentials from environment variables
const ADMIN_CREDENTIALS = {
  username: import.meta.env.VITE_ADMIN_USERNAME || 'steeltroops',
  password: import.meta.env.VITE_ADMIN_PASSWORD || 'steel#123'
};

// Log the credentials for debugging (remove in production)
console.log('Admin credentials loaded:', {
  username: ADMIN_CREDENTIALS.username,
  envUsername: import.meta.env.VITE_ADMIN_USERNAME,
  hasPassword: !!ADMIN_CREDENTIALS.password,
  envHasPassword: !!import.meta.env.VITE_ADMIN_PASSWORD
});

export const login = (username, password) => {
  console.log('Login attempt:', { username, hasPassword: !!password });
  console.log('Comparing with:', { 
    storedUsername: ADMIN_CREDENTIALS.username,
    passwordMatch: password === ADMIN_CREDENTIALS.password
  });

  if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
    const token = 'mock-jwt-token'; // In production, generate proper JWT tokens
    localStorage.setItem('adminToken', token);
    console.log('Login successful');
    return true;
  }
  console.log('Login failed');
  return false;
};

export const logout = () => {
  localStorage.removeItem('adminToken');
};

export const isAuthenticated = () => {
  return localStorage.getItem('adminToken') !== null;
};