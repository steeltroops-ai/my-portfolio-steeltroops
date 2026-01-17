// Neon Database API Client
// Replaces the Supabase client with direct API calls to Netlify serverless functions

const API_BASE = '/api';

// Token management
const TOKEN_KEY = 'neon_auth_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const removeToken = () => localStorage.removeItem(TOKEN_KEY);

// API request helper
async function apiRequest(endpoint, options = {}) {
  const token = getToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `HTTP error! status: ${response.status}`);
  }

  return data;
}

// ============================================
// AUTH API
// ============================================

export const authApi = {
  async login(email, password) {
    const result = await apiRequest('/auth?action=login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (result.success && result.token) {
      setToken(result.token);
    }
    
    return result;
  },

  async register(email, password, displayName) {
    return apiRequest('/auth?action=register', {
      method: 'POST',
      body: JSON.stringify({ email, password, displayName }),
    });
  },

  async logout() {
    try {
      await apiRequest('/auth?action=logout', { method: 'POST' });
    } finally {
      removeToken();
    }
  },

  async getCurrentUser() {
    return apiRequest('/auth?action=me', { method: 'GET' });
  },

  async verifyToken() {
    return apiRequest('/auth?action=verify', { method: 'GET' });
  },

  isAuthenticated() {
    return !!getToken();
  },
};

// ============================================
// POSTS API
// ============================================

export const postsApi = {
  async getPublishedPosts(options = {}) {
    const params = new URLSearchParams();
    if (options.limit) params.set('limit', options.limit);
    if (options.offset) params.set('offset', options.offset);
    if (options.search) params.set('search', options.search);
    if (options.tags) params.set('tags', options.tags.join(','));
    
    return apiRequest(`/posts?${params.toString()}`);
  },

  async getAllPosts(options = {}) {
    const params = new URLSearchParams({ all: 'true' });
    if (options.limit) params.set('limit', options.limit);
    if (options.offset) params.set('offset', options.offset);
    
    return apiRequest(`/posts?${params.toString()}`);
  },

  async getPostBySlug(slug, includeUnpublished = false) {
    const params = new URLSearchParams({ slug });
    if (includeUnpublished) params.set('all', 'true');
    
    return apiRequest(`/posts?${params.toString()}`);
  },

  async getPostById(id) {
    return apiRequest(`/posts?id=${id}`);
  },

  async createPost(postData) {
    return apiRequest('/posts', {
      method: 'POST',
      body: JSON.stringify(postData),
    });
  },

  async updatePost(id, postData) {
    return apiRequest(`/posts?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(postData),
    });
  },

  async deletePost(id) {
    return apiRequest(`/posts?id=${id}`, { method: 'DELETE' });
  },

  async togglePostPublished(id, published) {
    return apiRequest(`/posts?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify({ published }),
    });
  },
};

// ============================================
// COMMENTS API
// ============================================

export const commentsApi = {
  async getPostComments(postId) {
    return apiRequest(`/comments?post_id=${postId}`);
  },

  async getAllComments(options = {}) {
    const params = new URLSearchParams({ all: 'true' });
    if (options.status) params.set('status', options.status);
    if (options.limit) params.set('limit', options.limit);
    if (options.offset) params.set('offset', options.offset);
    
    return apiRequest(`/comments?${params.toString()}`);
  },

  async createComment(commentData) {
    return apiRequest('/comments', {
      method: 'POST',
      body: JSON.stringify(commentData),
    });
  },

  async approveComment(id) {
    return apiRequest(`/comments?id=${id}&action=approve`, { method: 'PUT' });
  },

  async rejectComment(id) {
    return apiRequest(`/comments?id=${id}&action=reject`, { method: 'PUT' });
  },

  async markAsSpam(id) {
    return apiRequest(`/comments?id=${id}&action=spam`, { method: 'PUT' });
  },

  async deleteComment(id) {
    return apiRequest(`/comments?id=${id}`, { method: 'DELETE' });
  },
};

// ============================================
// CONTACT API
// ============================================

export const contactApi = {
  async getMessages(options = {}) {
    const params = new URLSearchParams();
    if (options.status) params.set('status', options.status);
    if (options.limit) params.set('limit', options.limit);
    if (options.offset) params.set('offset', options.offset);
    
    return apiRequest(`/contact?${params.toString()}`);
  },

  async sendMessage(messageData) {
    return apiRequest('/contact', {
      method: 'POST',
      body: JSON.stringify(messageData),
    });
  },

  async markAsRead(id) {
    return apiRequest(`/contact?id=${id}&action=read`, { method: 'PUT' });
  },

  async markAsReplied(id, notes = null) {
    return apiRequest(`/contact?id=${id}&action=replied`, {
      method: 'PUT',
      body: JSON.stringify({ notes }),
    });
  },

  async archiveMessage(id) {
    return apiRequest(`/contact?id=${id}&action=archive`, { method: 'PUT' });
  },

  async deleteMessage(id) {
    return apiRequest(`/contact?id=${id}`, { method: 'DELETE' });
  },
};

// ============================================
// TAGS API
// ============================================

export const tagsApi = {
  async getAllTags() {
    return apiRequest('/tags');
  },
};

// ============================================
// CATEGORIES API
// ============================================

export const categoriesApi = {
  async getAllCategories() {
    return apiRequest('/categories');
  },

  async createCategory(categoryData) {
    return apiRequest('/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    });
  },

  async deleteCategory(id) {
    return apiRequest(`/categories?id=${id}`, { method: 'DELETE' });
  },
};

// ============================================
// HELPER FUNCTIONS (same as before)
// ============================================

export const generateSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-');
};

export const estimateReadingTime = (content) => {
  const wordsPerMinute = 200;
  const words = content.split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
};

export const extractExcerpt = (content, maxLength = 160) => {
  const plainText = content
    .replace(/#{1,6}\s+/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/\n+/g, ' ')
    .trim();

  return plainText.length > maxLength
    ? plainText.substring(0, maxLength) + '...'
    : plainText;
};

// Default export for compatibility
export default {
  auth: authApi,
  posts: postsApi,
  comments: commentsApi,
  contact: contactApi,
  tags: tagsApi,
  categories: categoriesApi,
};
