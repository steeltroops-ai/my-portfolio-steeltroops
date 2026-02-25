import React, { Suspense, lazy, StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { ReactLenis } from "lenis/react";
import App from "@/App.jsx";
import { blogQueryKeys } from "@/features/blog/hooks/useBlogQueries";
import { SocketProvider } from "@/shared/context/SocketContext";
import { getPublishedPosts } from "@/features/blog/services/HybridBlogService";
import ErrorBoundary from "@/shared/components/feedback/ErrorBoundary";
import "@/index.css";
import AnalyticsTracker from "@/shared/analytics/AnalyticsTracker";
import { LazyMotion } from "framer-motion";

// Critical shared components - loaded immediately
import FloatingChatButton from "@/shared/components/ui/FloatingChatButton";
import MobileNav from "@/shared/components/layout/MobileNav";

// Add error logging for production debugging
window.addEventListener("error", (event) => {
  console.error("Global error:", event.error);
  console.error("Error details:", {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
  });
});

window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason);
});

// Fix for "This document requires 'TrustedHTML' assignment" error is now handled in index.html
// to ensure it runs before any bundled code starts.

// Listen for self-destructing service worker's cache clear signal
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.addEventListener("message", (event) => {
    if (event.data?.type === "SW_CACHE_CLEARED") {
      console.log(
        "Service worker caches cleared -- reloading for fresh content."
      );
      window.location.reload();
    }
  });
}

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
      staleTime: 3 * 60 * 1000, // 3 minutes (aligned with cacheManager TTL)
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
    mutations: {
      retry: 1,
    },
  },
});

// Lazy load feature components for code splitting
const Blog = lazy(() => import("@/features/blog/components/Blog"));
const BlogPost = lazy(() => import("@/features/blog/components/BlogPost"));
const BlogEditor = lazy(() => import("@/features/blog/components/BlogEditor"));

const AdminLogin = lazy(() => import("@/features/admin/components/AdminLogin"));
const AdminDashboard = lazy(
  () => import("@/features/admin/components/AdminDashboard")
);
const ProtectedRoute = lazy(
  () => import("@/features/admin/components/ProtectedRoute")
);
const AIBlogGenerator = lazy(
  () => import("@/features/admin/components/AIBlogGenerator")
);
const MessageCenter = lazy(
  () => import("@/features/admin/components/MessageCenter")
);
const Analytics = lazy(() => import("@/features/admin/components/Analytics"));

const AdminLayout = lazy(() => import("@/features/admin/layouts/AdminLayout"));

const NotFound = lazy(() => import("@/shared/components/feedback/NotFound"));

// Import global loading spinner
import LoadingSpinner from "@/shared/components/ui/LoadingSpinner";

// Minimal fallback for non-critical floating components
const MinimalFallback = () => null;

const loadFeatures = () =>
  import("framer-motion").then((res) => res.domAnimation);

import { useOnlineStatus, useFocusRefetch } from "@/hooks/useNetworkStatus";

// Prefetch Component - loads blog data AFTER home page is ready
const PrefetchBlogData = ({ children }) => {
  const queryClient = useQueryClient();
  const [prefetched, setPrefetched] = React.useState(false);

  // Enable online/offline detection with auto-refetch
  useOnlineStatus();
  useFocusRefetch();

  React.useEffect(() => {
    if (!prefetched) {
      // Wait 800ms for critical home page render, then prefetch blogs
      const timer = setTimeout(async () => {
        try {
          const options = { limit: 6, offset: 0, search: "", tags: [] };

          // Prefetch page 1 using EXACT same query as Blog.jsx
          await queryClient.prefetchQuery({
            queryKey: blogQueryKeys.publishedPosts(options),
            queryFn: () => getPublishedPosts(options),
            staleTime: 5 * 60 * 1000,
          });

          setPrefetched(true);
        } catch (error) {
          console.warn("Blog prefetch failed:", error);
          setPrefetched(true);
        }
      }, 800); // Shorter delay for faster prefetch

      return () => clearTimeout(timer);
    }
  }, [queryClient, prefetched]);

  return children;
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SocketProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "#333",
                color: "#fff",
              },
            }}
          />
          <HelmetProvider>
            <ReactLenis
              root
              options={{
                lerp: 0.1,
                duration: 1.2,
                smoothWheel: true,
                wheelMultiplier: 1.0,
                touchMultiplier: 1.5,
              }}
            >
              <LazyMotion features={loadFeatures} strict>
                <PrefetchBlogData>
                  <Router
                    future={{
                      v7_startTransition: true,
                      v7_relativeSplatPath: true,
                    }}
                  >
                    <AnalyticsTracker />
                    <Suspense fallback={null}>
                      <Routes>
                        <Route
                          path="/"
                          element={
                            <>
                              <App />
                              <FloatingChatButton />
                              <MobileNav />
                            </>
                          }
                        />
                        <Route path="/blogs" element={<Blog />} />
                        <Route path="/blogs/:slug" element={<BlogPost />} />
                        <Route path="/admin/login" element={<AdminLogin />} />

                        {/* Admin Routes with Layout */}
                        <Route
                          element={
                            <ProtectedRoute>
                              <AdminLayout />
                            </ProtectedRoute>
                          }
                        >
                          <Route
                            path="/admin/dashboard"
                            element={<AdminDashboard />}
                          />
                          <Route
                            path="/admin/post/new"
                            element={<BlogEditor />}
                          />
                          <Route
                            path="/admin/post/edit/:id"
                            element={<BlogEditor />}
                          />
                          <Route
                            path="/admin/ai-generator"
                            element={<AIBlogGenerator />}
                          />
                          <Route
                            path="/admin/messages"
                            element={<MessageCenter />}
                          />
                          <Route
                            path="/admin/analytics"
                            element={<Analytics />}
                          />
                        </Route>
                        {/* 404 Not Found - Must be last */}
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Suspense>
                  </Router>
                </PrefetchBlogData>
              </LazyMotion>
            </ReactLenis>
          </HelmetProvider>
        </SocketProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>
);
