import { supabase } from '../lib/supabase'
import { sanitizeFilename } from '../utils/sanitize'

/**
 * Upload an image to Supabase storage
 * @param {File} file - The image file to upload
 * @param {string} folder - The folder to upload to (e.g., 'featured', 'content')
 * @returns {Promise<{data: Object|null, error: any}>}
 */
export const uploadImage = async (file, folder = 'content') => {
  try {
    if (!file) {
      throw new Error('No file provided')
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.')
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB in bytes
    if (file.size > maxSize) {
      throw new Error('File size too large. Maximum size is 5MB.')
    }

    // Generate unique filename with sanitization
    const fileExt = file.name.split('.').pop()
    const baseName = sanitizeFilename(file.name.replace(/\.[^/.]+$/, ""))
    const fileName = `${folder}/${Date.now()}-${baseName}.${fileExt}`

    // Upload file to Supabase storage
    const { data, error } = await supabase.storage
      .from('blog-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) throw error

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('blog-images')
      .getPublicUrl(fileName)

    return {
      data: {
        path: data.path,
        fullPath: data.fullPath,
        publicUrl: urlData.publicUrl
      },
      error: null
    }
  } catch (error) {
    console.error('Error uploading image:', error)
    return { data: null, error }
  }
}

/**
 * Delete an image from Supabase storage
 * @param {string} path - The path of the image to delete
 * @returns {Promise<{success: boolean, error: any}>}
 */
export const deleteImage = async (path) => {
  try {
    if (!path) {
      throw new Error('No path provided')
    }

    const { error } = await supabase.storage
      .from('blog-images')
      .remove([path])

    if (error) throw error

    return { success: true, error: null }
  } catch (error) {
    console.error('Error deleting image:', error)
    return { success: false, error }
  }
}

/**
 * Get public URL for an image
 * @param {string} path - The path of the image
 * @returns {string} The public URL
 */
export const getImageUrl = (path) => {
  if (!path) return ''
  
  const { data } = supabase.storage
    .from('blog-images')
    .getPublicUrl(path)
  
  return data.publicUrl
}

/**
 * List all images in a folder
 * @param {string} folder - The folder to list images from
 * @returns {Promise<{data: Array, error: any}>}
 */
export const listImages = async (folder = '') => {
  try {
    const { data, error } = await supabase.storage
      .from('blog-images')
      .list(folder, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' }
      })

    if (error) throw error

    // Add public URLs to each image
    const imagesWithUrls = data.map(image => ({
      ...image,
      publicUrl: getImageUrl(`${folder}/${image.name}`)
    }))

    return { data: imagesWithUrls, error: null }
  } catch (error) {
    console.error('Error listing images:', error)
    return { data: [], error }
  }
}

/**
 * Upload multiple images
 * @param {FileList|Array} files - Array of files to upload
 * @param {string} folder - The folder to upload to
 * @returns {Promise<{data: Array, errors: Array}>}
 */
export const uploadMultipleImages = async (files, folder = 'content') => {
  const results = []
  const errors = []

  for (const file of files) {
    const result = await uploadImage(file, folder)
    if (result.error) {
      errors.push({ file: file.name, error: result.error })
    } else {
      results.push(result.data)
    }
  }

  return { data: results, errors }
}

/**
 * Resize and compress image before upload (client-side)
 * @param {File} file - The image file to process
 * @param {Object} options - Resize options
 * @returns {Promise<File>} Processed file
 */
export const processImage = async (file, options = {}) => {
  const {
    maxWidth = 1200,
    maxHeight = 800,
    quality = 0.8
  } = options

  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }
      
      if (height > maxHeight) {
        width = (width * maxHeight) / height
        height = maxHeight
      }

      // Set canvas dimensions
      canvas.width = width
      canvas.height = height

      // Draw and compress image
      ctx.drawImage(img, 0, 0, width, height)
      
      canvas.toBlob(
        (blob) => {
          const processedFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now()
          })
          resolve(processedFile)
        },
        file.type,
        quality
      )
    }

    img.src = URL.createObjectURL(file)
  })
}
