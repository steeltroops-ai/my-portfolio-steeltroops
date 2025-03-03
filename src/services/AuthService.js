// Get admin credentials from environment variables
const ADMIN_CREDENTIALS = {
  username: 'steeltroops',
  password: 'steel#123'
};

export const login = (username, password) => {
  if (!username || !password) {
    console.error('Login failed: Missing credentials');
    return false;
  }

  const trimmedUsername = username.trim();
  const trimmedPassword = password.trim();

  if (trimmedUsername === ADMIN_CREDENTIALS.username && trimmedPassword === ADMIN_CREDENTIALS.password) {
    const token = 'mock-jwt-token'; // In production, generate proper JWT tokens
    localStorage.setItem('adminToken', token);
    return true;
  }
  
  console.error('Login failed: Invalid credentials');
  return false;
};

export const logout = () => {
  localStorage.removeItem('adminToken');
};

export const isAuthenticated = () => {
  return localStorage.getItem('adminToken') !== null;
};