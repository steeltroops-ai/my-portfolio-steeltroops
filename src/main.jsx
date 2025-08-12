import React, { Suspense, lazy } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App.jsx'
import FloatingChatButton from './components/FloatingChatButton'
import ErrorBoundary from './components/ErrorBoundary'
import errorTracker from './utils/errorTracking'
import './index.css'

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
})

// Lazy load components for code splitting
const Blog = lazy(() => import('./components/Blog'))
const BlogPost = lazy(() => import('./components/BlogPost'))
const AdminLogin = lazy(() => import('./components/AdminLogin'))
const AdminDashboard = lazy(() => import('./components/AdminDashboard'))
const BlogEditor = lazy(() => import('./components/BlogEditor'))

// Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen bg-black flex items-center justify-center">
    <div className="flex flex-col items-center space-y-4">
      <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-neutral-400 text-sm">Loading...</p>
    </div>
  </div>
)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <HelmetProvider>
          <Router>
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                <Route path="/" element={<><App /><FloatingChatButton /></>} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:slug" element={<BlogPost />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/post/new" element={<BlogEditor />} />
                <Route path="/admin/post/edit/:id" element={<BlogEditor />} />
              </Routes>
            </Suspense>
          </Router>
        </HelmetProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
