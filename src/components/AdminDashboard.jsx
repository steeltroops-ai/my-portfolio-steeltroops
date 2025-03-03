import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllPosts, deletePost } from '../services/BlogService';
import { isAuthenticated, logout } from '../services/AuthService';

const AdminDashboard = () => {
  const [posts, setPosts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/admin/login');
      return;
    }
    loadPosts();
  }, [navigate]);

  const loadPosts = () => {
    const allPosts = getAllPosts();
    setPosts(allPosts);
  };

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const handleNewPost = () => {
    navigate('/admin/post/new');
  };

  const handleEditPost = (id) => {
    navigate(`/admin/post/edit/${id}`);
  };

  const handleDeletePost = async (id) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      const success = deletePost(id);
      if (success) {
        loadPosts();
      }
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
      <div className="absolute left-0 right-0 top-[-10%] h-[1000px] w-[1000px] rounded-full bg-[radial-gradient(circle_400px_at_50%_300px,#fbfbfb36,#000)]"></div>
      <div className="relative container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Blog Dashboard</h1>
          <div className="space-x-4">
            <button
              onClick={handleNewPost}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded transition-colors"
            >
              New Post
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 rounded transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="grid gap-6">
          {posts.map((post) => (
            <div
              key={post.id}
              className="p-6 rounded-xl border backdrop-blur-sm border-neutral-800 bg-neutral-900/30"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold mb-2">{post.title}</h2>
                  <p className="text-neutral-400 mb-4">{post.excerpt}</p>
                  <p className="text-sm text-neutral-500">{post.date}</p>
                </div>
                <div className="space-x-2">
                  <button
                    onClick={() => handleEditPost(post.id)}
                    className="px-3 py-1 bg-cyan-600 hover:bg-cyan-700 rounded text-sm transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeletePost(post.id)}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;