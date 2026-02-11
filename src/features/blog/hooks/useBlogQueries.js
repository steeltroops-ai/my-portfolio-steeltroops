import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import {
  getPublishedPosts,
  getAllPosts,
  getPostBySlug,
  getPostById,
  getAllTags,
  createPost,
  updatePost,
  deletePost,
  togglePostPublished,
  getDataSourceInfo,
} from "../services/HybridBlogService";

// Query keys for consistent caching
export const blogQueryKeys = {
  all: ["blog"],
  posts: () => [...blogQueryKeys.all, "posts"],
  publishedPosts: (options) => [...blogQueryKeys.posts(), "published", options],
  allPosts: (options) => [...blogQueryKeys.posts(), "all", options],
  post: (id) => [...blogQueryKeys.posts(), "post", id],
  postBySlug: (slug) => [...blogQueryKeys.posts(), "slug", slug],
  tags: () => [...blogQueryKeys.all, "tags"],
};

// Helper to get cached data from localStorage
const getLocalStorageCache = (key) => {
  if (typeof window === "undefined") return null;
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    const { data, timestamp } = JSON.parse(cached);

    // Validate data structure before using it
    if (!data || typeof data !== "object") return null;
    if (!data.data || !Array.isArray(data.data)) return null;
    if (typeof data.count !== "number") return null;

    // Return cached data if less than 5 minutes old
    if (Date.now() - timestamp < 5 * 60 * 1000) {
      return data;
    }

    // Clear expired cache
    localStorage.removeItem(key);
  } catch (e) {
    // Clear corrupted cache
    try {
      localStorage.removeItem(key);
    } catch {}
    return null;
  }
  return null;
};

// Helper to save data to localStorage
const setLocalStorageCache = (key, data) => {
  if (typeof window === "undefined") return;
  try {
    // Only save valid data
    if (!data || typeof data !== "object") return;
    if (!data.data || !Array.isArray(data.data)) return;
    if (typeof data.count !== "number") return;

    localStorage.setItem(
      key,
      JSON.stringify({
        data,
        timestamp: Date.now(),
      })
    );
  } catch (e) {
    // Ignore localStorage errors (quota exceeded, etc)
  }
};

// Hook for fetching published posts (public blog) - now with hybrid support and persistence
export const usePublishedPosts = (options = {}) => {
  const cacheKey = `blog-posts-${JSON.stringify(options)}`;
  const cachedData = getLocalStorageCache(cacheKey);

  return useQuery({
    queryKey: blogQueryKeys.publishedPosts(options),
    queryFn: async () => {
      const data = await getPublishedPosts(options);
      setLocalStorageCache(cacheKey, data);
      return data;
    },
    initialData: cachedData, // Load from localStorage immediately
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 1, // Reduced retry for faster fallback
    placeholderData: keepPreviousData, // Keep previous data while fetching new page
    refetchInterval: 60000, // 1 minute auto-refresh
    select: (data) => ({
      posts: data.data || [],
      count: data.count || 0,
      error: data.error,
    }),
  });
};

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
      error: data.error,
    }),
  });
};

// Hook for fetching a single post by slug
export const usePostBySlug = (slug, includeUnpublished = false) => {
  return useQuery({
    queryKey: blogQueryKeys.postBySlug(slug),
    queryFn: () => getPostBySlug(slug, includeUnpublished),
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    enabled: !!slug,
    retry: 2,
    select: (data) => data.data,
  });
};

// Hook for fetching a single post by ID (admin)
export const usePostById = (id) => {
  return useQuery({
    queryKey: blogQueryKeys.post(id),
    queryFn: () => getPostById(id),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!id,
    retry: 2,
    select: (data) => data.data,
  });
};

// Hook for fetching all tags
export const useTags = () => {
  return useQuery({
    queryKey: blogQueryKeys.tags(),
    queryFn: getAllTags,
    staleTime: 15 * 60 * 1000, // 15 minutes (tags don't change often)
    cacheTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    retry: 2,
    select: (data) => data.data || [],
  });
};

// Mutation hook for creating posts
export const useCreatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPost,
    onSuccess: (data) => {
      // Invalidate and refetch posts
      queryClient.invalidateQueries({ queryKey: blogQueryKeys.posts() });
      queryClient.invalidateQueries({ queryKey: blogQueryKeys.tags() });

      // Add the new post to the cache
      if (data.data) {
        queryClient.setQueryData(blogQueryKeys.post(data.data.id), {
          data: data.data,
          error: null,
        });
      }
    },
    onError: (error) => {
      console.error("Error creating post:", error);
    },
  });
};

// Mutation hook for updating posts
export const useUpdatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, postData }) => updatePost(id, postData),
    onSuccess: (data, variables) => {
      // Invalidate and refetch posts
      queryClient.invalidateQueries({ queryKey: blogQueryKeys.posts() });
      queryClient.invalidateQueries({ queryKey: blogQueryKeys.tags() });

      // Update the specific post in cache
      if (data.data) {
        queryClient.setQueryData(blogQueryKeys.post(variables.id), {
          data: data.data,
          error: null,
        });

        // Also update by slug if available
        if (data.data.slug) {
          queryClient.setQueryData(blogQueryKeys.postBySlug(data.data.slug), {
            data: data.data,
            error: null,
          });
        }
      }
    },
    onError: (error) => {
      console.error("Error updating post:", error);
    },
  });
};

// Mutation hook for deleting posts
export const useDeletePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePost,
    onSuccess: (data, postId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: blogQueryKeys.post(postId) });

      // Invalidate posts lists
      queryClient.invalidateQueries({ queryKey: blogQueryKeys.posts() });
      queryClient.invalidateQueries({ queryKey: blogQueryKeys.tags() });
    },
    onError: (error) => {
      console.error("Error deleting post:", error);
    },
  });
};

// Mutation hook for toggling post published status
export const useTogglePostPublished = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId) => {
      // Get the current post from cache or fetch it
      let currentPost = queryClient.getQueryData(blogQueryKeys.post(postId));

      // If not in cache, check the allPosts cache
      if (!currentPost?.data) {
        const allPostsData = queryClient.getQueryData(
          blogQueryKeys.allPosts({})
        );
        if (allPostsData?.data) {
          const foundPost = allPostsData.data.find((p) => p.id === postId);
          if (foundPost) {
            currentPost = { data: foundPost };
          }
        }
      }

      // If still not found, fetch it
      if (!currentPost?.data) {
        currentPost = await getPostById(postId);
      }

      const currentPublished = currentPost?.data?.published ?? false;

      // Toggle the published state
      return togglePostPublished(postId, !currentPublished);
    },
    onSuccess: (data, postId) => {
      // Invalidate posts lists to reflect the change
      queryClient.invalidateQueries({ queryKey: blogQueryKeys.posts() });

      // Update the specific post in cache if we have the updated data
      if (data.data) {
        queryClient.setQueryData(blogQueryKeys.post(postId), {
          data: data.data,
          error: null,
        });
      }
    },
    onError: (error) => {
      console.error("Error toggling post status:", error);
    },
  });
};

// Utility hook for prefetching posts
export const usePrefetchPost = () => {
  const queryClient = useQueryClient();

  const prefetchPostBySlug = (slug) => {
    queryClient.prefetchQuery({
      queryKey: blogQueryKeys.postBySlug(slug),
      queryFn: () => getPostBySlug(slug),
      staleTime: 10 * 60 * 1000,
    });
  };

  return { prefetchPostBySlug };
};

// Hook for optimistic updates
export const useOptimisticPostUpdate = () => {
  const queryClient = useQueryClient();

  const optimisticUpdate = (postId, updates) => {
    queryClient.setQueryData(blogQueryKeys.post(postId), (old) => {
      if (!old?.data) return old;
      return {
        ...old,
        data: { ...old.data, ...updates },
      };
    });
  };

  return { optimisticUpdate };
};

// Hook for getting data source information
export const useDataSourceInfo = () => {
  return useQuery({
    queryKey: [...blogQueryKeys.all, "dataSource"],
    queryFn: getDataSourceInfo,
    staleTime: 30 * 60 * 1000, // 30 minutes
    cacheTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false,
    retry: 1,
  });
};
