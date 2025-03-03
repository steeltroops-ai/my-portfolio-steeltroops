import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createPost, updatePost, getPostById } from '../services/BlogService';
import { isAuthenticated } from '../services/AuthService';

const BlogEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState({
    title: '',
    excerpt: '',
    content: [{ type: 'text', content: '' }],
    featuredImage: ''
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/admin/login');
      return;
    }

    if (id) {
      const existingPost = getPostById(id);
      if (existingPost) {
        setPost(existingPost);
      }
    }
  }, [id, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (id) {
      updatePost(id, post);
    } else {
      createPost(post);
    }
    navigate('/admin/dashboard');
  };

  const handleContentChange = (index, value) => {
    const newContent = [...post.content];
    newContent[index] = { ...newContent[index], content: value };
    setPost({ ...post, content: newContent });
  };

  const addContentBlock = (type) => {
    setPost({
      ...post,
      content: [...post.content, { type, content: type === 'text' ? '' : '', src: '', alt: '' }]
    });
  };

  const handleImageUpload = (index, e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newContent = [...post.content];
        newContent[index] = {
          type: 'image',
          src: reader.result,
          alt: file.name
        };
        setPost({ ...post, content: newContent });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
      <div className="absolute left-0 right-0 top-[-10%] h-[1000px] w-[1000px] rounded-full bg-[radial-gradient(circle_400px_at_50%_300px,#fbfbfb36,#000)]"></div>
      <div className="relative container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">{id ? 'Edit Post' : 'New Post'}</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Title</label>
            <input
              type="text"
              value={post.title}
              onChange={(e) => setPost({ ...post, title: e.target.value })}
              className="w-full p-2 rounded bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus:border-cyan-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Excerpt</label>
            <textarea
              value={post.excerpt}
              onChange={(e) => setPost({ ...post, excerpt: e.target.value })}
              className="w-full p-2 rounded bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus:border-cyan-500"
              rows="3"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Featured Image URL</label>
            <input
              type="text"
              value={post.featuredImage}
              onChange={(e) => setPost({ ...post, featuredImage: e.target.value })}
              className="w-full p-2 rounded bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus:border-cyan-500"
              required
            />
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-medium mb-2">Content</label>
            {post.content.map((block, index) => (
              <div key={index} className="space-y-2">
                {block.type === 'text' ? (
                  <textarea
                    value={block.content}
                    onChange={(e) => handleContentChange(index, e.target.value)}
                    className="w-full p-2 rounded bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus:border-cyan-500"
                    rows="4"
                  />
                ) : (
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(index, e)}
                      className="block w-full text-sm text-neutral-400
                        file:mr-4 file:py-2 file:px-4
                        file:rounded file:border-0
                        file:text-sm file:font-semibold
                        file:bg-cyan-600 file:text-white
                        hover:file:bg-cyan-700"
                    />
                    {block.src && (
                      <img
                        src={block.src}
                        alt={block.alt}
                        className="max-w-full h-auto rounded"
                      />
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => addContentBlock('text')}
              className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 rounded transition-colors"
            >
              Add Text Block
            </button>
            <button
              type="button"
              onClick={() => addContentBlock('image')}
              className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 rounded transition-colors"
            >
              Add Image Block
            </button>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 rounded transition-colors"
            >
              {id ? 'Update Post' : 'Create Post'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/dashboard')}
              className="px-6 py-2 bg-neutral-700 hover:bg-neutral-600 rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BlogEditor;