// Get admin credentials from environment variables
const ADMIN_CREDENTIALS = {
  username: import.meta.env.VITE_ADMIN_USERNAME,
  password: import.meta.env.VITE_ADMIN_PASSWORD
};

export const login = (username, password) => {
  if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
    const token = 'mock-jwt-token'; // In production, generate proper JWT tokens
    localStorage.setItem('adminToken', token);
    return true;
  }
  return false;
};

export const logout = () => {
  localStorage.removeItem('adminToken');
};

export const isAuthenticated = () => {
  return localStorage.getItem('adminToken') !== null;
};