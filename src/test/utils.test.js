import { describe, test, expect } from 'vitest'
import { sanitizeHTML, sanitizeBlogContent, sanitizeUserInput, sanitizeMarkdown, sanitizeImageUrl, sanitizeFilename } from '../utils/sanitize'

describe('Sanitization Utils', () => {
  describe('sanitizeHTML', () => {
    test('should remove script tags', () => {
      const input = '<p>Hello</p><script>alert("xss")</script>'
      const result = sanitizeHTML(input)
      expect(result).not.toContain('<script>')
      expect(result).toContain('<p>Hello</p>')
    })

    test('should allow safe HTML tags', () => {
      const input = '<p><strong>Bold</strong> and <em>italic</em> text</p>'
      const result = sanitizeHTML(input)
      expect(result).toContain('<strong>Bold</strong>')
      expect(result).toContain('<em>italic</em>')
    })

    test('should handle empty input', () => {
      expect(sanitizeHTML('')).toBe('')
      expect(sanitizeHTML(null)).toBe('')
      expect(sanitizeHTML(undefined)).toBe('')
    })
  })

  describe('sanitizeBlogContent', () => {
    test('should sanitize blog content', () => {
      const input = '<h1>Title</h1><p>Content</p><script>alert("xss")</script>'
      const result = sanitizeBlogContent(input)
      expect(result).toContain('<h1>Title</h1>')
      expect(result).toContain('<p>Content</p>')
      expect(result).not.toContain('<script>')
    })
  })

  describe('sanitizeUserInput', () => {
    test('should allow only basic formatting', () => {
      const input = '<p><strong>Bold</strong></p><script>alert("xss")</script>'
      const result = sanitizeUserInput(input)
      expect(result).toContain('<strong>Bold</strong>')
      expect(result).not.toContain('<script>')
    })
  })

  describe('sanitizeMarkdown', () => {
    test('should remove dangerous markdown patterns', () => {
      const input = '# Title\n\n<script>alert("xss")</script>\n\nNormal text'
      const result = sanitizeMarkdown(input)
      expect(result).toContain('# Title')
      expect(result).toContain('Normal text')
      expect(result).not.toContain('<script>')
    })

    test('should remove javascript: URLs', () => {
      const input = '[Link](javascript:alert("xss"))'
      const result = sanitizeMarkdown(input)
      expect(result).not.toContain('javascript:')
    })
  })

  describe('sanitizeImageUrl', () => {
    test('should allow valid HTTP URLs', () => {
      const url = 'https://example.com/image.jpg'
      const result = sanitizeImageUrl(url)
      expect(result).toBe(url)
    })

    test('should allow data URLs', () => {
      const url = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='
      const result = sanitizeImageUrl(url)
      expect(result).toBe(url)
    })

    test('should reject invalid protocols', () => {
      const url = 'javascript:alert("xss")'
      const result = sanitizeImageUrl(url)
      expect(result).toBeNull()
    })

    test('should handle empty input', () => {
      expect(sanitizeImageUrl('')).toBeNull()
      expect(sanitizeImageUrl(null)).toBeNull()
      expect(sanitizeImageUrl(undefined)).toBeNull()
    })
  })

  describe('sanitizeFilename', () => {
    test('should sanitize special characters', () => {
      const filename = 'my file!@#$%^&*().txt'
      const result = sanitizeFilename(filename)
      expect(result).toBe('my_file_.txt')
    })

    test('should handle empty input', () => {
      expect(sanitizeFilename('')).toBe('untitled')
      expect(sanitizeFilename(null)).toBe('untitled')
      expect(sanitizeFilename(undefined)).toBe('untitled')
    })

    test('should convert to lowercase', () => {
      const filename = 'MyFile.TXT'
      const result = sanitizeFilename(filename)
      expect(result).toBe('myfile.txt')
    })

    test('should remove leading/trailing underscores', () => {
      const filename = '___file___'
      const result = sanitizeFilename(filename)
      expect(result).toBe('file')
    })
  })
})

describe('Error Tracking Utils', () => {
  test('should be importable', async () => {
    const errorTracker = await import('../utils/errorTracking')
    expect(errorTracker.default).toBeDefined()
    expect(typeof errorTracker.trackAsyncOperation).toBe('function')
  })
})
