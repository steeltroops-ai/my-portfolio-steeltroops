import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const API_URL = import.meta.env.VITE_API_URL || "";

// Get auth token from localStorage - must match neon.js TOKEN_KEY
const getAuthToken = () => {
  return localStorage.getItem("neon_auth_token");
};

// Fetch all contact messages
export const useContactMessages = (status = "all") => {
  return useQuery({
    queryKey: ["contactMessages", status],
    queryFn: async () => {
      const token = getAuthToken();
      if (!token) throw new Error("Not authenticated");

      const params = new URLSearchParams();
      if (status && status !== "all") {
        params.set("status", status);
      }
      params.set("limit", "100");

      const response = await fetch(`${API_URL}/api/contact?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch messages");
      }

      const data = await response.json();
      return data;
    },
    staleTime: 30000, // 30 seconds
  });
};

// Get unread count for badge
export const useUnreadCount = () => {
  return useQuery({
    queryKey: ["contactMessages", "unread", "count"],
    queryFn: async () => {
      const token = getAuthToken();
      if (!token) return { count: 0 };

      const response = await fetch(
        `${API_URL}/api/contact?status=unread&limit=100`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
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
    staleTime: 60000, // 1 minute
  });
};

// Update message status
export const useUpdateMessageStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, action, notes }) => {
      const token = getAuthToken();
      if (!token) throw new Error("Not authenticated");

      const response = await fetch(
        `${API_URL}/api/contact?id=${id}&action=${action}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contactMessages"] });
    },
  });
};

// Delete message
export const useDeleteMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const token = getAuthToken();
      if (!token) throw new Error("Not authenticated");

      const response = await fetch(`${API_URL}/api/contact?id=${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete message");
      }

      return response.json();
    },
    onSuccess: () => {
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
      const token = getAuthToken();
      if (!token) throw new Error("Not authenticated");

      const response = await fetch(`${API_URL}/api/contact/reply`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
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
