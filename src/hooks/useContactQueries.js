import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ContactService } from '../services/ContactService';

// Query keys for consistent caching
export const contactQueryKeys = {
  all: ['contact'],
  messages: () => [...contactQueryKeys.all, 'messages'],
  messagesList: (options) => [...contactQueryKeys.messages(), 'list', options],
  stats: () => [...contactQueryKeys.all, 'stats'],
};

/**
 * Hook to submit a contact message
 */
export const useSubmitContactMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ContactService.submitMessage,
    onSuccess: (data) => {
      // Invalidate contact messages list for admin
      queryClient.invalidateQueries({ queryKey: contactQueryKeys.messages() });
      queryClient.invalidateQueries({ queryKey: contactQueryKeys.stats() });
    },
    onError: (error) => {
      console.error('Failed to submit contact message:', error);
    }
  });
};

/**
 * Hook to get contact messages (admin only)
 */
export const useContactMessages = (options = {}) => {
  return useQuery({
    queryKey: contactQueryKeys.messagesList(options),
    queryFn: () => ContactService.getMessages(options),
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000, // 5 minutes
    enabled: true, // Only enable if user is admin (you might want to add auth check here)
    select: (data) => data.success ? data : { data: [], count: 0, error: data.error }
  });
};

/**
 * Hook to update message status (admin only)
 */
export const useUpdateMessageStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ messageId, status, adminNotes }) => 
      ContactService.updateMessageStatus(messageId, status, adminNotes),
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
            data: oldData.data.map(message => 
              message.id === messageId 
                ? { ...message, status, updated_at: new Date().toISOString() }
                : message
            )
          };
        }
      );
    },
    onError: (error) => {
      console.error('Failed to update message status:', error);
    }
  });
};

/**
 * Hook to delete a contact message (admin only)
 */
export const useDeleteContactMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ContactService.deleteMessage,
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
            data: oldData.data.filter(message => message.id !== messageId),
            count: oldData.count - 1
          };
        }
      );
    },
    onError: (error) => {
      console.error('Failed to delete contact message:', error);
    }
  });
};

/**
 * Hook to get contact message statistics (admin only)
 */
export const useContactMessageStats = () => {
  return useQuery({
    queryKey: contactQueryKeys.stats(),
    queryFn: ContactService.getMessageStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    enabled: true, // Only enable if user is admin
    select: (data) => data.success ? data.data : {}
  });
};

/**
 * Hook for form validation
 */
export const useContactFormValidation = () => {
  return {
    validateForm: ContactService.validateContactForm
  };
};
