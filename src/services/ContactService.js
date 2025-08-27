import { supabase } from "../lib/supabase.js";

export class ContactService {
  /**
   * Submit a new contact message
   * @param {Object} messageData - The contact message data
   * @param {string} messageData.name - Sender's name
   * @param {string} messageData.email - Sender's email
   * @param {string} messageData.subject - Message subject
   * @param {string} messageData.message - Message content
   * @returns {Promise<Object>} Result object with success status and data/error
   */
  static async submitMessage(messageData) {
    try {
      // Validate required fields
      const { name, email, subject, message } = messageData;

      if (!name || !email || !subject || !message) {
        throw new Error("All fields are required");
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error("Please enter a valid email address");
      }

      // Get client information for tracking
      const clientInfo = {
        ip_address: null, // Will be handled by Supabase
        user_agent:
          typeof navigator !== "undefined" ? navigator.userAgent : null,
      };

      // Insert the message
      const { data, error } = await supabase
        .from("contact_messages")
        .insert([
          {
            name: name.trim(),
            email: email.trim().toLowerCase(),
            subject: subject.trim(),
            message: message.trim(),
            status: "unread",
            ...clientInfo,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("Error submitting contact message:", error);

        // Handle specific database table not found error
        if (
          error.code === "PGRST205" &&
          error.message.includes("contact_messages")
        ) {
          // Fallback: Send email directly or show helpful message
          return {
            success: false,
            error:
              "Contact form is currently being set up. Please email me directly at steeltroops.ai@gmail.com or try again later.",
            fallback: true,
          };
        }

        throw error;
      }

      return {
        success: true,
        data,
        message:
          "Your message has been sent successfully! I'll get back to you soon.",
      };
    } catch (error) {
      console.error("ContactService.submitMessage error:", error);
      return {
        success: false,
        error: error.message || "Failed to send message. Please try again.",
        data: null,
      };
    }
  }

  /**
   * Get all contact messages (admin only)
   * @param {Object} options - Query options
   * @param {number} options.limit - Number of messages to fetch
   * @param {number} options.offset - Offset for pagination
   * @param {string} options.status - Filter by status
   * @param {string} options.search - Search term
   * @returns {Promise<Object>} Result object with messages and count
   */
  static async getMessages(options = {}) {
    try {
      const { limit = 20, offset = 0, status, search } = options;

      let query = supabase
        .from("contact_messages")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });

      // Apply filters
      if (status && status !== "all") {
        query = query.eq("status", status);
      }

      if (search) {
        query = query.or(
          `name.ilike.%${search}%,email.ilike.%${search}%,subject.ilike.%${search}%,message.ilike.%${search}%`
        );
      }

      // Apply pagination
      if (limit > 0) {
        query = query.range(offset, offset + limit - 1);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error("Error fetching contact messages:", error);
        throw error;
      }

      return {
        success: true,
        data: data || [],
        count: count || 0,
        error: null,
      };
    } catch (error) {
      console.error("ContactService.getMessages error:", error);
      return {
        success: false,
        data: [],
        count: 0,
        error: error.message || "Failed to fetch messages",
      };
    }
  }

  /**
   * Update message status (admin only)
   * @param {string} messageId - Message ID
   * @param {string} status - New status
   * @param {string} adminNotes - Optional admin notes
   * @returns {Promise<Object>} Result object
   */
  static async updateMessageStatus(messageId, status, adminNotes = null) {
    try {
      const updateData = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (adminNotes) {
        updateData.admin_notes = adminNotes;
      }

      if (status === "replied") {
        updateData.replied_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from("contact_messages")
        .update(updateData)
        .eq("id", messageId)
        .select()
        .single();

      if (error) {
        console.error("Error updating message status:", error);
        throw error;
      }

      return {
        success: true,
        data,
        message: `Message marked as ${status}`,
      };
    } catch (error) {
      console.error("ContactService.updateMessageStatus error:", error);
      return {
        success: false,
        error: error.message || "Failed to update message status",
        data: null,
      };
    }
  }

  /**
   * Delete a contact message (admin only)
   * @param {string} messageId - Message ID
   * @returns {Promise<Object>} Result object
   */
  static async deleteMessage(messageId) {
    try {
      const { error } = await supabase
        .from("contact_messages")
        .delete()
        .eq("id", messageId);

      if (error) {
        console.error("Error deleting contact message:", error);
        throw error;
      }

      return {
        success: true,
        message: "Message deleted successfully",
      };
    } catch (error) {
      console.error("ContactService.deleteMessage error:", error);
      return {
        success: false,
        error: error.message || "Failed to delete message",
      };
    }
  }

  /**
   * Get contact message statistics (admin only)
   * @returns {Promise<Object>} Statistics object
   */
  static async getMessageStats() {
    try {
      const { data, error } = await supabase.rpc("get_contact_message_stats");

      if (error) {
        console.error("Error fetching message stats:", error);
        throw error;
      }

      return {
        success: true,
        data: data || {},
        error: null,
      };
    } catch (error) {
      console.error("ContactService.getMessageStats error:", error);
      return {
        success: false,
        data: {},
        error: error.message || "Failed to fetch statistics",
      };
    }
  }

  /**
   * Validate contact form data
   * @param {Object} formData - Form data to validate
   * @returns {Object} Validation result
   */
  static validateContactForm(formData) {
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
  }
}
