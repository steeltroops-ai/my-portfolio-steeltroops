import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cacheManager } from "@/lib/cacheManager";

const API_URL = import.meta.env.VITE_API_URL || "";

// Standalone fetch function for prefetching
export const fetchContactMessages = async (status = "all") => {
  const params = new URLSearchParams();
  if (status && status !== "all") {
    params.set("status", status);
  }
  params.set("limit", "100");

  const response = await fetch(`${API_URL}/api/contact?${params}`, {
    credentials: "include", // Use HttpOnly Cookie
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    if (response.status === 401) throw new Error("Not authenticated");
    throw new Error("Failed to fetch messages");
  }

  const data = await response.json();
  return data;
};

// Fetch all contact messages
export const useContactMessages = (status = "all") => {
  const cacheKey = `admin-messages-${status}`;
  const cachedData = cacheManager.get(cacheKey, "default");

  return useQuery({
    queryKey: ["contactMessages", status],
    queryFn: async () => {
      const data = await fetchContactMessages(status);
      if (data) {
        cacheManager.set(cacheKey, data, "default");
      }
      return data;
    },
    initialData: cachedData,
    staleTime: 0, // Always refresh in background
    refetchOnWindowFocus: true,
    retry: 3,
    refetchInterval: (query) => {
      // If error (backend down), poll every 10s to recover
      if (query.state.status === "error") return 10000;
      return false;
    },
  });
};

// Get unread count for badge
export const useUnreadCount = () => {
  return useQuery({
    queryKey: ["contactMessages", "unread", "count"],
    queryFn: async () => {
      const response = await fetch(
        `${API_URL}/api/contact?status=unread&limit=100`,
        {
          credentials: "include", // Use HttpOnly Cookie
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        return { count: 0 };
      }

      const data = await response.json();
      return { count: data.data?.length || 0 };
    },
    staleTime: 0,
    retry: 3,
    refetchInterval: (query) => {
      // If error, poll every 10s to recover
      if (query.state.status === "error") return 10000;
      return false;
    },
  });
};

// Update message status
export const useUpdateMessageStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, action, notes }) => {
      const response = await fetch(
        `${API_URL}/api/contact?id=${id}&action=${action}`,
        {
          method: "PUT",
          credentials: "include", // Use HttpOnly Cookie
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ notes }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update message");
      }

      return response.json();
    },
    onMutate: async ({ id, action }) => {
      await queryClient.cancelQueries({ queryKey: ["contactMessages"] });

      // Snapshot ALL active contactMessages query variants (e.g. "all", "unread", etc.)
      const allPreviousData = queryClient.getQueriesData({
        queryKey: ["contactMessages"],
      });

      // Optimistically update every cached variant that contains this message
      for (const [queryKey, queryData] of allPreviousData) {
        if (queryData?.data) {
          queryClient.setQueryData(queryKey, {
            ...queryData,
            data: queryData.data.map((m) =>
              m.id === id ? { ...m, status: action } : m
            ),
          });
        }
      }

      return { allPreviousData };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contactMessages"] });
    },
    onError: (err, variables, context) => {
      if (context?.allPreviousData) {
        for (const [queryKey, previousData] of context.allPreviousData) {
          queryClient.setQueryData(queryKey, previousData);
        }
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["contactMessages"] });
    },
  });
};

// Delete message
export const useDeleteMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const response = await fetch(`${API_URL}/api/contact?id=${id}`, {
        method: "DELETE",
        credentials: "include", // Use HttpOnly Cookie
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete message");
      }

      return response.json();
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["contactMessages"] });

      const allPreviousData = queryClient.getQueriesData({
        queryKey: ["contactMessages"],
      });

      for (const [queryKey, queryData] of allPreviousData) {
        if (queryData?.data) {
          queryClient.setQueryData(queryKey, {
            ...queryData,
            data: queryData.data.filter((m) => m.id !== id),
          });
        }
      }

      return { allPreviousData };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contactMessages"] });
    },
    onError: (err, variables, context) => {
      if (context?.allPreviousData) {
        for (const [queryKey, previousData] of context.allPreviousData) {
          queryClient.setQueryData(queryKey, previousData);
        }
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["contactMessages"] });
    },
  });
};

// Reply to message
export const useReplyMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      toEmail,
      subject,
      replyMessage,
      previousMessages,
    }) => {
      const response = await fetch(`${API_URL}/api/contact/reply`, {
        method: "POST",
        credentials: "include", // Use HttpOnly Cookie
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          toEmail,
          subject,
          replyMessage,
          previousMessages,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send reply");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contactMessages"] });
    },
  });
};
