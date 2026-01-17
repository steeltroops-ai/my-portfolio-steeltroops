import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as NeonContactService from "@/shared/services/NeonContactService";

// Query keys for consistent caching
export const contactQueryKeys = {
  all: ["contact"],
  messages: () => [...contactQueryKeys.all, "messages"],
  messagesList: (options) => [...contactQueryKeys.messages(), "list", options],
  stats: () => [...contactQueryKeys.all, "stats"],
};

/**
 * Hook to submit a contact message
 */
export const useSubmitContactMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: NeonContactService.submitContactMessage,
    onSuccess: (_data) => {
      // Invalidate contact messages list for admin
      queryClient.invalidateQueries({ queryKey: contactQueryKeys.messages() });
      queryClient.invalidateQueries({ queryKey: contactQueryKeys.stats() });
    },
    onError: (error) => {
      console.error("Failed to submit contact message:", error);
    },
  });
};

/**
 * Hook to get contact messages (admin only)
 */
export const useContactMessages = (options = {}) => {
  return useQuery({
    queryKey: contactQueryKeys.messagesList(options),
    queryFn: () => NeonContactService.getContactMessages(options),
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000, // 5 minutes
    enabled: true,
    select: (data) =>
      !data.error ? data : { data: [], count: 0, error: data.error },
  });
};

/**
 * Hook to update message status (admin only)
 */
export const useUpdateMessageStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ messageId, status, adminNotes }) => {
      if (status === 'read') return NeonContactService.markMessageAsRead(messageId);
      if (status === 'replied') return NeonContactService.markMessageAsReplied(messageId, adminNotes);
      if (status === 'archived') return NeonContactService.archiveMessage(messageId);
      throw new Error(`Unknown status: ${status}`);
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch messages list
      queryClient.invalidateQueries({ queryKey: contactQueryKeys.messages() });
      queryClient.invalidateQueries({ queryKey: contactQueryKeys.stats() });

      // Update specific message in cache if possible
      const { messageId, status } = variables;
      queryClient.setQueriesData(
        { queryKey: contactQueryKeys.messages() },
        (oldData) => {
          if (!oldData?.data) return oldData;

          return {
            ...oldData,
            data: oldData.data.map((message) =>
              message.id === messageId
                ? { ...message, status, updated_at: new Date().toISOString() }
                : message
            ),
          };
        }
      );
    },
    onError: (error) => {
      console.error("Failed to update message status:", error);
    },
  });
};

/**
 * Hook to delete a contact message (admin only)
 */
export const useDeleteContactMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: NeonContactService.deleteContactMessage,
    onSuccess: (data, messageId) => {
      // Invalidate and refetch messages list
      queryClient.invalidateQueries({ queryKey: contactQueryKeys.messages() });
      queryClient.invalidateQueries({ queryKey: contactQueryKeys.stats() });

      // Remove message from cache
      queryClient.setQueriesData(
        { queryKey: contactQueryKeys.messages() },
        (oldData) => {
          if (!oldData?.data) return oldData;

          return {
            ...oldData,
            data: oldData.data.filter((message) => message.id !== messageId),
            count: oldData.count - 1,
          };
        }
      );
    },
    onError: (error) => {
      console.error("Failed to delete contact message:", error);
    },
  });
};

/**
 * Validate contact form data
 */
const validateContactForm = (formData) => {
  const errors = {};
  const { name, email, subject, message } = formData;

  // Name validation
  if (!name || name.trim().length < 2) {
    errors.name = "Name must be at least 2 characters long";
  } else if (name.trim().length > 100) {
    errors.name = "Name must be less than 100 characters";
  }

  // Email validation
  if (!email || email.trim().length === 0) {
    errors.email = "Email is required";
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      errors.email = "Please enter a valid email address";
    } else if (email.trim().length > 255) {
      errors.email = "Email must be less than 255 characters";
    }
  }

  // Subject validation
  if (!subject || subject.trim().length < 5) {
    errors.subject = "Subject must be at least 5 characters long";
  } else if (subject.trim().length > 200) {
    errors.subject = "Subject must be less than 200 characters";
  }

  // Message validation
  if (!message || message.trim().length < 10) {
    errors.message = "Message must be at least 10 characters long";
  } else if (message.trim().length > 2000) {
    errors.message = "Message must be less than 2000 characters";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Hook for form validation
 */
export const useContactFormValidation = () => {
  return {
    validateForm: validateContactForm,
  };
};
