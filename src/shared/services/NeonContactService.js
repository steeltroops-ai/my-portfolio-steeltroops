// Neon Contact Service - For contact form integration
import { contactApi } from '@/lib/neon';

/**
 * Submit a contact message
 */
export const submitContactMessage = async (messageData) => {
  try {
    const result = await contactApi.sendMessage(messageData);
    return { data: result.data, success: true, error: null };
  } catch (error) {
    console.error('Error submitting contact message:', error);
    return { data: null, success: false, error };
  }
};

/**
 * Get all contact messages (admin only)
 */
export const getContactMessages = async (options = {}) => {
  try {
    const result = await contactApi.getMessages(options);
    return { data: result.data || [], count: result.count || 0, error: null };
  } catch (error) {
    console.error('Error fetching contact messages:', error);
    return { data: [], count: 0, error };
  }
};

/**
 * Mark message as read
 */
export const markMessageAsRead = async (id) => {
  try {
    const result = await contactApi.markAsRead(id);
    return { data: result.data, error: null };
  } catch (error) {
    console.error('Error marking message as read:', error);
    return { data: null, error };
  }
};

/**
 * Mark message as replied
 */
export const markMessageAsReplied = async (id, notes = null) => {
  try {
    const result = await contactApi.markAsReplied(id, notes);
    return { data: result.data, error: null };
  } catch (error) {
    console.error('Error marking message as replied:', error);
    return { data: null, error };
  }
};

/**
 * Archive message
 */
export const archiveMessage = async (id) => {
  try {
    const result = await contactApi.archiveMessage(id);
    return { data: result.data, error: null };
  } catch (error) {
    console.error('Error archiving message:', error);
    return { data: null, error };
  }
};

/**
 * Delete contact message
 */
export const deleteContactMessage = async (id) => {
  try {
    await contactApi.deleteMessage(id);
    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting contact message:', error);
    return { success: false, error };
  }
};
