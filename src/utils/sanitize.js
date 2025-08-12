import DOMPurify from 'dompurify'

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param {string} html - HTML content to sanitize
 * @param {Object} options - DOMPurify options
 * @returns {string} - Sanitized HTML
 */
export const sanitizeHTML = (html, options = {}) => {
  if (!html || typeof html !== 'string') {
    return ''
  }

  const defaultOptions = {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'img',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'div', 'span', 'hr'
    ],
    ALLOWED_ATTR: [
      'href', 'title', 'alt', 'src', 'class', 'id',
      'target', 'rel', 'width', 'height'
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    ADD_ATTR: ['target'],
    FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input', 'button'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
    ...options
  }

  return DOMPurify.sanitize(html, defaultOptions)
}

/**
 * Sanitize blog post content with specific rules for blog posts
 * @param {string} content - Blog post content
 * @returns {string} - Sanitized content
 */
export const sanitizeBlogContent = (content) => {
  return sanitizeHTML(content, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'img',
      'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr'
    ],
    ALLOWED_ATTR: ['href', 'title', 'alt', 'src', 'target', 'rel'],
    TRANSFORM_TAGS: {
      'a': function(tagName, attribs) {
        // Add target="_blank" and rel="noopener noreferrer" to external links
        if (attribs.href && !attribs.href.startsWith('/') && !attribs.href.startsWith('#')) {
          attribs.target = '_blank'
          attribs.rel = 'noopener noreferrer'
        }
        return { tagName, attribs }
      }
    }
  })
}

/**
 * Sanitize user input (for forms, comments, etc.)
 * @param {string} input - User input to sanitize
 * @returns {string} - Sanitized input
 */
export const sanitizeUserInput = (input) => {
  if (!input || typeof input !== 'string') {
    return ''
  }

  return sanitizeHTML(input, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em'],
    ALLOWED_ATTR: [],
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed'],
    STRIP_COMMENTS: true
  })
}

/**
 * Sanitize markdown content before processing
 * @param {string} markdown - Markdown content
 * @returns {string} - Sanitized markdown
 */
export const sanitizeMarkdown = (markdown) => {
  if (!markdown || typeof markdown !== 'string') {
    return ''
  }

  // Remove potentially dangerous markdown patterns
  return markdown
    .replace(/<script[^>]*>.*?<\/script>/gis, '') // Remove script tags
    .replace(/<iframe[^>]*>.*?<\/iframe>/gis, '') // Remove iframe tags
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/data:text\/html/gi, '') // Remove data URLs with HTML
    .replace(/vbscript:/gi, '') // Remove vbscript: URLs
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
}

/**
 * Validate and sanitize image URLs
 * @param {string} url - Image URL to validate
 * @returns {string|null} - Sanitized URL or null if invalid
 */
export const sanitizeImageUrl = (url) => {
  if (!url || typeof url !== 'string') {
    return null
  }

  // Allow only HTTP(S) and data URLs for images
  const allowedProtocols = /^(https?:|data:image\/)/i
  
  if (!allowedProtocols.test(url)) {
    return null
  }

  // Remove any potential XSS in URL
  const sanitized = url.replace(/[<>"']/g, '')
  
  return sanitized
}

/**
 * Sanitize file names for upload
 * @param {string} filename - Original filename
 * @returns {string} - Sanitized filename
 */
export const sanitizeFilename = (filename) => {
  if (!filename || typeof filename !== 'string') {
    return 'untitled'
  }

  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars with underscore
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
    .toLowerCase()
}
