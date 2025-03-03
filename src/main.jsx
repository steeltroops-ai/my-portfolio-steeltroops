import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import Blog from './components/Blog'
import BlogPost from './components/BlogPost'
import AdminLogin from './components/AdminLogin'
import AdminDashboard from './components/AdminDashboard'
import BlogEditor from './components/BlogEditor'
import FloatingChatButton from './components/FloatingChatButton'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<><App /><FloatingChatButton /></>} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:id" element={<BlogPost />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/post/new" element={<BlogEditor />} />
        <Route path="/admin/post/edit/:id" element={<BlogEditor />} />
      </Routes>
    </Router>
  </React.StrictMode>,
)
