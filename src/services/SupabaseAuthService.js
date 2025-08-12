import { supabase } from '../lib/supabase'

// Admin email for proper authentication (should be set in environment)
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'admin@portfolio.com'

/**
 * Sign in with email and password (Supabase Auth)
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<{data: Object|null, error: any}>}
 */
export const signInWithEmail = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error signing in with email:', error)
    return { data: null, error }
  }
}

/**
 * Sign up with email and password (Supabase Auth)
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {Object} metadata - Additional user metadata
 * @returns {Promise<{data: Object|null, error: any}>}
 */
export const signUpWithEmail = async (email, password, metadata = {}) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    })

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error signing up with email:', error)
    return { data: null, error }
  }
}

/**
 * Sign out current user
 * @returns {Promise<{error: any}>}
 */
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut()
    
    // Also clear local storage for backward compatibility
    localStorage.removeItem('adminToken')
    
    if (error) throw error

    return { error: null }
  } catch (error) {
    console.error('Error signing out:', error)
    return { error }
  }
}

/**
 * Get current user session
 * @returns {Promise<{data: Object|null, error: any}>}
 */
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error) throw error

    return { data: user, error: null }
  } catch (error) {
    console.error('Error getting current user:', error)
    return { data: null, error }
  }
}

/**
 * Check if user is authenticated
 * @returns {Promise<boolean>}
 */
export const isAuthenticated = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    
    // Also check for legacy token for backward compatibility
    const legacyToken = localStorage.getItem('adminToken')
    
    return !!(session?.user || legacyToken)
  } catch (error) {
    console.error('Error checking authentication:', error)
    return false
  }
}

/**
 * Admin login with proper Supabase authentication
 * @param {string} email - Admin email
 * @param {string} password - Admin password
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const adminLogin = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error

    // Verify admin role (you should have an admin_profiles table)
    const { data: profile, error: profileError } = await supabase
      .from('admin_profiles')
      .select('role')
      .eq('user_id', data.user.id)
      .single()

    if (profileError || profile?.role !== 'admin') {
      await supabase.auth.signOut()
      throw new Error('Unauthorized: Admin access required')
    }

    // Set legacy token for backward compatibility
    localStorage.setItem('adminToken', data.session.access_token)

    return { success: true }
  } catch (error) {
    console.error('Admin login error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Legacy login function for backward compatibility (DEPRECATED)
 * @param {string} username - Admin username (treated as email)
 * @param {string} password - Admin password
 * @returns {Promise<boolean>}
 */
export const login = async (username, password) => {
  // Treat username as email for backward compatibility
  const email = username.includes('@') ? username : ADMIN_EMAIL
  const result = await adminLogin(email, password)
  return result.success
}

/**
 * Legacy logout function for backward compatibility
 */
export const logout = () => {
  localStorage.removeItem('adminToken')
  // Also sign out from Supabase
  supabase.auth.signOut()
}

/**
 * Enhanced authentication check
 * @returns {Promise<boolean>}
 */
export const isAuthenticatedLegacy = async () => {
  try {
    // Check for active Supabase session first
    const { data: { session } } = await supabase.auth.getSession()

    if (session?.user) {
      // Verify admin role
      const { data: profile } = await supabase
        .from('admin_profiles')
        .select('role')
        .eq('user_id', session.user.id)
        .single()

      if (profile?.role === 'admin') {
        // Update legacy token for backward compatibility
        localStorage.setItem('adminToken', session.access_token)
        return true
      }
    }

    // Fallback to legacy token check (will be phased out)
    const legacyToken = localStorage.getItem('adminToken')
    return legacyToken !== null
  } catch (error) {
    console.error('Authentication check error:', error)
    return false
  }
}

/**
 * Initialize admin user in Supabase (run once)
 * This should be called during setup to create the admin user
 * @param {string} email - Admin email
 * @param {string} password - Admin password
 * @returns {Promise<{data: Object|null, error: any}>}
 */
export const initializeAdminUser = async (email = 'admin@portfolio.com', password = 'admin123') => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: 'admin',
          username: 'admin'
        }
      }
    })

    if (error && error.message !== 'User already registered') {
      throw error
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error initializing admin user:', error)
    return { data: null, error }
  }
}

/**
 * Listen to authentication state changes
 * @param {Function} callback - Callback function to handle auth state changes
 * @returns {Function} Unsubscribe function
 */
export const onAuthStateChange = (callback) => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session)
  })

  return () => subscription.unsubscribe()
}

/**
 * Reset password
 * @param {string} email - User email
 * @returns {Promise<{data: Object|null, error: any}>}
 */
export const resetPassword = async (email) => {
  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error resetting password:', error)
    return { data: null, error }
  }
}

/**
 * Update password
 * @param {string} newPassword - New password
 * @returns {Promise<{data: Object|null, error: any}>}
 */
export const updatePassword = async (newPassword) => {
  try {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error updating password:', error)
    return { data: null, error }
  }
}
