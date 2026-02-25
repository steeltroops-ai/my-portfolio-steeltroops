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

// ---- Query Keys ----

export const blogQueryKeys = {
  all: ["blog"],
  posts: () => [...blogQueryKeys.all, "posts"],
  publishedPosts: (options) => [...blogQueryKeys.posts(), "published", options],
  allPosts: (options) => [...blogQueryKeys.posts(), "all", options],
  post: (id) => [...blogQueryKeys.posts(), "post", id],
  postBySlug: (slug) => [...blogQueryKeys.posts(), "slug", slug],
  tags: () => [...blogQueryKeys.all, "tags"],
};

// ---- Query Hooks (Public) ----

/**
 * Published posts (public blog page).
 *
 * Caching strategy:
 *   - React Query in-memory: staleTime 3 min, gcTime 10 min
 *   - localStorage (cacheManager): 3 min TTL, used ONLY for cold-start hydration
 *   - No refetchInterval -- useSmartSync handles background invalidation
 */
export const usePublishedPosts = (options = {}) => {
  const cacheKey = `blog-posts-${JSON.stringify(options)}`;
  const cachedData = cacheManager.get(cacheKey, "blogList");

  return useQuery({
    queryKey: blogQueryKeys.publishedPosts(options),
    queryFn: async () => {
      try {
        const data = await getPublishedPosts(options);
        // Persist to localStorage for cold-start next visit
        if (data && !data.error) {
          cacheManager.set(cacheKey, data, "blogList");
        }
        return data || { data: [], count: 0, error: null };
      } catch (err) {
        console.error("Error in usePublishedPosts:", err);
        return { data: [], count: 0, error: err };
      }
    },
    initialData: cachedData || undefined,
    staleTime: 3 * 60 * 1000, // 3 min
    gcTime: 10 * 60 * 1000, // 10 min (replaces deprecated cacheTime)
    refetchOnWindowFocus: false, // useSmartSync handles this
    retry: 1,
    placeholderData: keepPreviousData,
    select: (data) => ({
      posts: data?.data || [],
      count: data?.count || 0,
      error: data?.error,
    }),
  });
};

// ---- Query Hooks (Admin) ----

/**
 * All posts (admin page).
 * staleTime: 0 so it always refetches in background when the query is used.
 */
export const useAllPosts = (options = {}) => {
  const cacheKey = `blog-all-posts-${JSON.stringify(options)}`;
  const cachedData = cacheManager.get(cacheKey, "adminData");

  return useQuery({
    queryKey: blogQueryKeys.allPosts(options),
    queryFn: async () => {
      const data = await getAllPosts(options);
      if (data?.error && (data.error.type === "error" || !data.error.type)) {
        throw new Error(
          data.error.message ||
            (typeof data.error === "string"
              ? data.error
              : "Failed to fetch posts")
        );
      }
      if (data?.data && !data.error) {
        cacheManager.set(cacheKey, data, "adminData");
      }
      return data;
    },
    initialData: cachedData || undefined,
    staleTime: options.staleTime ?? 60000, // 1 min default
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: true,
    retry: 3,
    refetchInterval: (query) => {
      if (query.state.status === "error") return 10000;
      return false;
    },
    select: (data) => ({
      posts: data?.data || [],
      count: data?.count || 0,
      liveCount: data?.liveCount || 0,
      draftCount: data?.draftCount || 0,
      error: data?.error,
    }),
  });
};

/**
 * Single post by slug (public blog post page).
 */
export const usePostBySlug = (slug, includeUnpublished = false) => {
  const cacheKey = `blog-post-${slug}`;
  const cachedData = cacheManager.get(cacheKey, "blogPost");

  return useQuery({
    queryKey: blogQueryKeys.postBySlug(slug),
    queryFn: async () => {
      try {
        const data = await getPostBySlug(slug, includeUnpublished);
        if (data?.data) {
          cacheManager.set(cacheKey, data.data, "blogPost");
        }
        return data || { data: null, error: null };
      } catch (err) {
        console.error("Error in usePostBySlug:", err);
        return { data: null, error: err };
      }
    },
    initialData: cachedData ? { data: cachedData } : undefined,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    enabled: !!slug,
    retry: 2,
    select: (data) => ({ data: data?.data, error: data?.error }),
  });
};

/**
 * Single post by ID (admin editor).
 */
export const usePostById = (id) => {
  return useQuery({
    queryKey: blogQueryKeys.post(id),
    queryFn: () => getPostById(id),
    staleTime: 3 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: !!id,
    retry: 2,
    select: (data) => data.data,
  });
};

/**
 * All tags (sidebar/filter).
 */
export const useTags = () => {
  const cacheKey = "blog-tags";
  const cachedData = cacheManager.get(cacheKey, "tags");

  return useQuery({
    queryKey: blogQueryKeys.tags(),
    queryFn: async () => {
      const data = await getAllTags();
      if (data?.data) {
        cacheManager.set(cacheKey, data.data, "tags");
      }
      return data;
    },
    initialData: cachedData ? { data: cachedData } : undefined,
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
    select: (data) => data.data || [],
  });
};

// ---- Mutation Hooks ----

/**
 * Create post -- invalidates all blog queries + localStorage.
 */
export const useCreatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPost,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: blogQueryKeys.posts() });
      queryClient.invalidateQueries({ queryKey: blogQueryKeys.tags() });
      cacheManager.invalidatePrefix("blog-");

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

/**
 * Update post -- invalidates all blog queries + localStorage.
 */
export const useUpdatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, postData }) => updatePost(id, postData),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: blogQueryKeys.posts() });
      queryClient.invalidateQueries({ queryKey: blogQueryKeys.tags() });
      cacheManager.invalidatePrefix("blog-");

      if (data.data) {
        queryClient.setQueryData(blogQueryKeys.post(variables.id), {
          data: data.data,
          error: null,
        });
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

/**
 * Delete post -- invalidates all blog queries + localStorage.
 */
export const useDeletePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePost,
    onMutate: async (postId) => {
      // 1. Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: blogQueryKeys.posts() });

      // 2. Snapshot the current state
      const previousPosts = queryClient.getQueryData(
        blogQueryKeys.allPosts({})
      );

      // 3. Optimistically patch the cache
      if (previousPosts?.posts) {
        const postToDelete = previousPosts.posts.find((p) => p.id === postId);
        const isLive = postToDelete?.published;

        queryClient.setQueryData(blogQueryKeys.allPosts({}), {
          ...previousPosts,
          posts: previousPosts.posts.filter((p) => p.id !== postId),
          count: previousPosts.count - 1,
          liveCount: isLive
            ? previousPosts.liveCount - 1
            : previousPosts.liveCount,
          draftCount: isLive
            ? previousPosts.draftCount
            : previousPosts.draftCount - 1,
        });
      }

      return { previousPosts };
    },
    onSuccess: (data, postId) => {
      queryClient.removeQueries({ queryKey: blogQueryKeys.post(postId) });
      queryClient.invalidateQueries({ queryKey: blogQueryKeys.posts() });
      queryClient.invalidateQueries({ queryKey: blogQueryKeys.tags() });
      cacheManager.invalidatePrefix("blog-");
    },
    onError: (error, postId, context) => {
      console.error("Error deleting post:", error);
      // Roll back to previous state
      if (context?.previousPosts) {
        queryClient.setQueryData(
          blogQueryKeys.allPosts({}),
          context.previousPosts
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: blogQueryKeys.posts() });
    },
  });
};

/**
 * Toggle published status.
 */
export const useTogglePostPublished = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId) => {
      let currentPost = queryClient.getQueryData(blogQueryKeys.post(postId));

      if (!currentPost?.data) {
        const allPostsData = queryClient.getQueryData(
          blogQueryKeys.allPosts({})
        );
        if (allPostsData?.posts) {
          const found = allPostsData.posts.find((p) => p.id === postId);
          if (found) currentPost = { data: found };
        }
      }

      if (!currentPost?.data) {
        currentPost = await getPostById(postId);
      }

      const currentPublished = currentPost?.data?.published ?? false;
      return togglePostPublished(postId, !currentPublished);
    },
    onMutate: async ({ id, published }) => {
      // 1. Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: blogQueryKeys.posts() });

      // 2. Snapshot the current state
      const previousPosts = queryClient.getQueryData(
        blogQueryKeys.allPosts({})
      );

      // 3. Optimistically patch the cache
      if (previousPosts?.posts) {
        queryClient.setQueryData(blogQueryKeys.allPosts({}), {
          ...previousPosts,
          posts: previousPosts.posts.map((p) =>
            p.id === id ? { ...p, published } : p
          ),
          liveCount: published
            ? previousPosts.liveCount + 1
            : previousPosts.liveCount - 1,
          draftCount: published
            ? previousPosts.draftCount - 1
            : previousPosts.draftCount + 1,
        });
      }

      return { previousPosts };
    },
    onSuccess: (data, { id }) => {
      queryClient.invalidateQueries({ queryKey: blogQueryKeys.posts() });
      cacheManager.invalidatePrefix("blog-");

      if (data.data) {
        queryClient.setQueryData(blogQueryKeys.post(id), {
          data: data.data,
          error: null,
        });
      }
    },
    onError: (error, variables, context) => {
      console.error("Error toggling post status:", error);
      // Roll back to the previous state on failure
      if (context?.previousPosts) {
        queryClient.setQueryData(
          blogQueryKeys.allPosts({}),
          context.previousPosts
        );
      }
    },
    onSettled: () => {
      // Always refetch after error or success to ensure sync
      queryClient.invalidateQueries({ queryKey: blogQueryKeys.posts() });
    },
  });
};

// ---- Utility Hooks ----

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

export const useOptimisticPostUpdate = () => {
  const queryClient = useQueryClient();

  const optimisticUpdate = (postId, updates) => {
    queryClient.setQueryData(blogQueryKeys.post(postId), (old) => {
      if (!old?.data) return old;
      return { ...old, data: { ...old.data, ...updates } };
    });
  };

  return { optimisticUpdate };
};

export const useDataSourceInfo = () => {
  return useQuery({
    queryKey: [...blogQueryKeys.all, "dataSource"],
    queryFn: getDataSourceInfo,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
};
