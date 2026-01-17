import { Suspense, lazy, StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "@/App.jsx";
import { ErrorBoundary } from "@/shared";
import "@/index.css";

// Lazy load non-critical shared components
const FloatingChatButton = lazy(() => import("@/shared/components/ui/FloatingChatButton"));
const MobileNav = lazy(() => import("@/shared/components/layout/MobileNav"));

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

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
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
const AdminDashboard = lazy(() => import("@/features/admin/components/AdminDashboard"));
const ProtectedRoute = lazy(() => import("@/features/admin/components/ProtectedRoute"));

const NotFound = lazy(() => import("@/shared/components/feedback/NotFound"));

// Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen bg-black flex items-center justify-center">
    <div className="flex flex-col items-center space-y-4">
      <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-neutral-400 text-sm">Loading...</p>
    </div>
  </div>
);

// Minimal fallback for non-critical floating components
const MinimalFallback = () => null;

ReactDOM.createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <HelmetProvider>
          <Router>
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                <Route
                  path="/"
                  element={
                    <>
                      <App />
                      <Suspense fallback={<MinimalFallback />}>
                        <FloatingChatButton />
                        <MobileNav />
                      </Suspense>
                    </>
                  }
                />
                <Route path="/blogs" element={<Blog />} />
                <Route path="/blogs/:slug" element={<BlogPost />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route
                  path="/admin/dashboard"
                  element={
                    <ProtectedRoute>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/post/new"
                  element={
                    <ProtectedRoute>
                      <BlogEditor />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/post/edit/:id"
                  element={
                    <ProtectedRoute>
                      <BlogEditor />
                    </ProtectedRoute>
                  }
                />
                {/* 404 Not Found - Must be last */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </Router>
        </HelmetProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>
);
