import { createClient } from "@supabase/supabase-js";

// Get environment variables with fallbacks
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug logging for production troubleshooting
if (!import.meta.env.PROD) {
  console.log("Environment check:", {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    urlType: typeof supabaseUrl,
    keyType: typeof supabaseAnonKey,
    mode: import.meta.env.MODE,
    prod: import.meta.env.PROD,
  });
}

// Create a fallback client if environment variables are missing
let supabase;

if (
  !supabaseUrl ||
  !supabaseAnonKey ||
  supabaseUrl === "undefined" ||
  supabaseAnonKey === "undefined"
) {
  if (!import.meta.env.PROD) {
    console.warn(
      "Missing or invalid Supabase environment variables - using fallback client",
      { supabaseUrl, hasKey: !!supabaseAnonKey }
    );
  }

  // Create a minimal mock client that won't cause errors
  supabase = {
    from: (table) => ({
      select: (columns) =>
        Promise.resolve({
          data: [],
          error: { message: "Supabase not configured" },
          count: 0,
        }),
      insert: (data) =>
        Promise.resolve({
          data: null,
          error: { message: "Supabase not configured" },
        }),
      update: (data) =>
        Promise.resolve({
          data: null,
          error: { message: "Supabase not configured" },
        }),
      delete: () =>
        Promise.resolve({
          data: null,
          error: { message: "Supabase not configured" },
        }),
      eq: function (column, value) {
        return this;
      },
      neq: function (column, value) {
        return this;
      },
      gt: function (column, value) {
        return this;
      },
      gte: function (column, value) {
        return this;
      },
      lt: function (column, value) {
        return this;
      },
      lte: function (column, value) {
        return this;
      },
      like: function (column, pattern) {
        return this;
      },
      ilike: function (column, pattern) {
        return this;
      },
      is: function (column, value) {
        return this;
      },
      in: function (column, values) {
        return this;
      },
      contains: function (column, value) {
        return this;
      },
      containedBy: function (column, value) {
        return this;
      },
      overlaps: function (column, value) {
        return this;
      },
      or: function (filters) {
        return this;
      },
      and: function (filters) {
        return this;
      },
      order: function (column, options) {
        return this;
      },
      limit: function (count) {
        return this;
      },
      range: function (from, to) {
        return this;
      },
      single: function () {
        return this;
      },
    }),
    auth: {
      signInWithPassword: () =>
        Promise.resolve({
          data: { user: null, session: null },
          error: { message: "Supabase not configured" },
        }),
      signOut: () => Promise.resolve({ error: null }),
      getSession: () =>
        Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: (callback) => ({
        data: { subscription: { unsubscribe: () => {} } },
      }),
      signUp: () =>
        Promise.resolve({
          data: { user: null, session: null },
          error: { message: "Supabase not configured" },
        }),
    },
    storage: {
      from: (bucket) => ({
        upload: () =>
          Promise.resolve({
            data: null,
            error: { message: "Supabase not configured" },
          }),
        getPublicUrl: (path) => ({ data: { publicUrl: "" } }),
        remove: () =>
          Promise.resolve({
            data: null,
            error: { message: "Supabase not configured" },
          }),
      }),
    },
  };

  if (!import.meta.env.PROD) {
    console.warn(
      "Using mock Supabase client - database operations will fail gracefully"
    );
  }
} else {
  try {
    if (!import.meta.env.PROD) {
      console.log("Creating real Supabase client with URL:", supabaseUrl);
    }
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });
    if (!import.meta.env.PROD) {
      console.log("Supabase client created successfully");
    }
  } catch (error) {
    console.error("Failed to create Supabase client:", error);
    // Fall back to mock client
    supabase = {
      from: () => ({
        select: () =>
          Promise.resolve({
            data: [],
            error: { message: "Supabase initialization failed" },
          }),
        insert: () =>
          Promise.resolve({
            data: null,
            error: { message: "Supabase initialization failed" },
          }),
        update: () =>
          Promise.resolve({
            data: null,
            error: { message: "Supabase initialization failed" },
          }),
        delete: () =>
          Promise.resolve({
            data: null,
            error: { message: "Supabase initialization failed" },
          }),
      }),
      auth: {
        signInWithPassword: () =>
          Promise.resolve({
            data: null,
            error: { message: "Supabase initialization failed" },
          }),
        signOut: () => Promise.resolve({ error: null }),
        getSession: () =>
          Promise.resolve({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({
          data: { subscription: { unsubscribe: () => {} } },
        }),
      },
      storage: {
        from: () => ({
          upload: () =>
            Promise.resolve({
              data: null,
              error: { message: "Supabase initialization failed" },
            }),
          getPublicUrl: () => ({ data: { publicUrl: "" } }),
        }),
      },
    };
  }
}

export { supabase };

// Helper function to generate slug from title
export const generateSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .trim("-"); // Remove leading/trailing hyphens
};

// Helper function to estimate reading time
export const estimateReadingTime = (content) => {
  const wordsPerMinute = 200;
  const words = content.split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
};

// Helper function to extract excerpt from content
export const extractExcerpt = (content, maxLength = 160) => {
  // Remove markdown formatting for excerpt
  const plainText = content
    .replace(/#{1,6}\s+/g, "") // Remove headers
    .replace(/\*\*(.*?)\*\*/g, "$1") // Remove bold
    .replace(/\*(.*?)\*/g, "$1") // Remove italic
    .replace(/`(.*?)`/g, "$1") // Remove inline code
    .replace(/\[(.*?)\]\(.*?\)/g, "$1") // Remove links
    .replace(/\n+/g, " ") // Replace newlines with spaces
    .trim();

  return plainText.length > maxLength
    ? plainText.substring(0, maxLength) + "..."
    : plainText;
};
