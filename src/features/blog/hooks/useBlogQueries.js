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
import { cacheManager } from "@/lib/cacheManager";

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

// Hook for fetching published posts (public blog) - now with smart cache manager
export const usePublishedPosts = (options = {}) => {
  const cacheKey = `blog-posts-${JSON.stringify(options)}`;
  const cachedData = cacheManager.get(cacheKey, "blogList");

  return useQuery({
    queryKey: blogQueryKeys.publishedPosts(options),
    queryFn: async () => {
      const data = await getPublishedPosts(options);
      // Save to smart cache (auto-syncs across tabs)
      cacheManager.set(cacheKey, data, "blogList");
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

// Hook for fetching all posts (admin) - with persistent smart cache
export const useAllPosts = (options = {}) => {
  const cacheKey = `blog-all-posts-${JSON.stringify(options)}`;
  const cachedData = cacheManager.get(cacheKey, "blogList");

  return useQuery({
    queryKey: blogQueryKeys.allPosts(options),
    queryFn: async () => {
      const data = await getAllPosts(options);

      // If there's a critical error (not just a warning), throw so React Query handles it
      if (data?.error && data.error.type === "error") {
        throw new Error(data.error.message || "Failed to fetch posts");
      }

      // Save to smart cache ONLY if valid response
      if (data?.data && !data.error) {
        cacheManager.set(cacheKey, data, "blogList");
      }
      return data;
    },
    initialData: cachedData, // Load from localStorage immediately
    staleTime: 0, // Always refresh in background to ensure data is fresh
    cacheTime: 24 * 60 * 60 * 1000, // 24 hours
    refetchOnWindowFocus: true, // Refresh when user comes back to the tab
    retry: 3,
    refetchInterval: (query) => {
      // If error (backend down), poll every 10s to recover
      if (query.state.status === "error") return 10000;
      return false;
    },
    select: (data) => ({
      posts: data.data || [],
      count: data.count || 0,
      error: data.error,
    }),
  });
};

// Hook for fetching a single post by slug - with smart cache
export const usePostBySlug = (slug, includeUnpublished = false) => {
  const cacheKey = `blog-post-${slug}`;
  const cachedData = cacheManager.get(cacheKey, "blogPost");

  return useQuery({
    queryKey: blogQueryKeys.postBySlug(slug),
    queryFn: async () => {
      const data = await getPostBySlug(slug, includeUnpublished);
      // Save to smart cache
      if (data?.data) {
        cacheManager.set(cacheKey, data.data, "blogPost");
      }
      return data;
    },
    initialData: cachedData ? { data: cachedData } : undefined,
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

// Hook for fetching all tags - with smart cache
export const useTags = () => {
  const cacheKey = "blog-tags";
  const cachedData = cacheManager.get(cacheKey, "tags");

  return useQuery({
    queryKey: blogQueryKeys.tags(),
    queryFn: async () => {
      const data = await getAllTags();
      // Save to smart cache
      if (data?.data) {
        cacheManager.set(cacheKey, data.data, "tags");
      }
      return data;
    },
    initialData: cachedData ? { data: cachedData } : undefined,
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
