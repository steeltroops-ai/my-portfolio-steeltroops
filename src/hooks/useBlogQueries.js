import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getPublishedPosts,
  getAllPosts,
  getPostBySlug,
  getPostById,
  getAllTags,
  createPost,
  updatePost,
  deletePost,
  togglePostPublished
} from '../services/SupabaseBlogService'

// Query keys for consistent caching
export const blogQueryKeys = {
  all: ['blog'],
  posts: () => [...blogQueryKeys.all, 'posts'],
  publishedPosts: (options) => [...blogQueryKeys.posts(), 'published', options],
  allPosts: (options) => [...blogQueryKeys.posts(), 'all', options],
  post: (id) => [...blogQueryKeys.posts(), 'post', id],
  postBySlug: (slug) => [...blogQueryKeys.posts(), 'slug', slug],
  tags: () => [...blogQueryKeys.all, 'tags']
}

// Hook for fetching published posts (public blog)
export const usePublishedPosts = (options = {}) => {
  return useQuery({
    queryKey: blogQueryKeys.publishedPosts(options),
    queryFn: () => getPublishedPosts(options),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 2,
    select: (data) => ({
      posts: data.data || [],
      count: data.count || 0,
      error: data.error
    })
  })
}

// Hook for fetching all posts (admin)
export const useAllPosts = (options = {}) => {
  return useQuery({
    queryKey: blogQueryKeys.allPosts(options),
    queryFn: () => getAllPosts(options),
    staleTime: 2 * 60 * 1000, // 2 minutes (shorter for admin)
    cacheTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 2,
    select: (data) => ({
      posts: data.data || [],
      count: data.count || 0,
      error: data.error
    })
  })
}

// Hook for fetching a single post by slug
export const usePostBySlug = (slug, includeUnpublished = false) => {
  return useQuery({
    queryKey: blogQueryKeys.postBySlug(slug),
    queryFn: () => getPostBySlug(slug, includeUnpublished),
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    enabled: !!slug,
    retry: 2,
    select: (data) => data.data
  })
}

// Hook for fetching a single post by ID (admin)
export const usePostById = (id) => {
  return useQuery({
    queryKey: blogQueryKeys.post(id),
    queryFn: () => getPostById(id),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!id,
    retry: 2,
    select: (data) => data.data
  })
}

// Hook for fetching all tags
export const useTags = () => {
  return useQuery({
    queryKey: blogQueryKeys.tags(),
    queryFn: getAllTags,
    staleTime: 15 * 60 * 1000, // 15 minutes (tags don't change often)
    cacheTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    retry: 2,
    select: (data) => data.data || []
  })
}

// Mutation hook for creating posts
export const useCreatePost = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: createPost,
    onSuccess: (data) => {
      // Invalidate and refetch posts
      queryClient.invalidateQueries({ queryKey: blogQueryKeys.posts() })
      queryClient.invalidateQueries({ queryKey: blogQueryKeys.tags() })
      
      // Add the new post to the cache
      if (data.data) {
        queryClient.setQueryData(
          blogQueryKeys.post(data.data.id),
          { data: data.data, error: null }
        )
      }
    },
    onError: (error) => {
      console.error('Error creating post:', error)
    }
  })
}

// Mutation hook for updating posts
export const useUpdatePost = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, postData }) => updatePost(id, postData),
    onSuccess: (data, variables) => {
      // Invalidate and refetch posts
      queryClient.invalidateQueries({ queryKey: blogQueryKeys.posts() })
      queryClient.invalidateQueries({ queryKey: blogQueryKeys.tags() })
      
      // Update the specific post in cache
      if (data.data) {
        queryClient.setQueryData(
          blogQueryKeys.post(variables.id),
          { data: data.data, error: null }
        )
        
        // Also update by slug if available
        if (data.data.slug) {
          queryClient.setQueryData(
            blogQueryKeys.postBySlug(data.data.slug),
            { data: data.data, error: null }
          )
        }
      }
    },
    onError: (error) => {
      console.error('Error updating post:', error)
    }
  })
}

// Mutation hook for deleting posts
export const useDeletePost = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: deletePost,
    onSuccess: (data, postId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: blogQueryKeys.post(postId) })
      
      // Invalidate posts lists
      queryClient.invalidateQueries({ queryKey: blogQueryKeys.posts() })
      queryClient.invalidateQueries({ queryKey: blogQueryKeys.tags() })
    },
    onError: (error) => {
      console.error('Error deleting post:', error)
    }
  })
}

// Mutation hook for toggling post published status
export const useTogglePostPublished = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: togglePostPublished,
    onSuccess: (data, postId) => {
      // Invalidate posts lists to reflect the change
      queryClient.invalidateQueries({ queryKey: blogQueryKeys.posts() })
      
      // Update the specific post in cache if we have the updated data
      if (data.data) {
        queryClient.setQueryData(
          blogQueryKeys.post(postId),
          { data: data.data, error: null }
        )
      }
    },
    onError: (error) => {
      console.error('Error toggling post status:', error)
    }
  })
}

// Utility hook for prefetching posts
export const usePrefetchPost = () => {
  const queryClient = useQueryClient()
  
  const prefetchPostBySlug = (slug) => {
    queryClient.prefetchQuery({
      queryKey: blogQueryKeys.postBySlug(slug),
      queryFn: () => getPostBySlug(slug),
      staleTime: 10 * 60 * 1000
    })
  }
  
  return { prefetchPostBySlug }
}

// Hook for optimistic updates
export const useOptimisticPostUpdate = () => {
  const queryClient = useQueryClient()
  
  const optimisticUpdate = (postId, updates) => {
    queryClient.setQueryData(
      blogQueryKeys.post(postId),
      (old) => {
        if (!old?.data) return old
        return {
          ...old,
          data: { ...old.data, ...updates }
        }
      }
    )
  }
  
  return { optimisticUpdate }
}
