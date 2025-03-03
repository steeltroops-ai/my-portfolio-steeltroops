import { BLOG_POSTS } from '../constants/blogPosts';

// Use the imported blog posts as the data source
let blogPosts = [...BLOG_POSTS];

export const getAllPosts = () => {
  return [...blogPosts];
};

export const getPostById = (id) => {
  return blogPosts.find(post => post.id === parseInt(id));
};

export const createPost = (postData) => {
  const newPost = {
    id: blogPosts.length + 1,
    ...postData,
    date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  };
  blogPosts.push(newPost);
  return newPost;
};

export const updatePost = (id, postData) => {
  const index = blogPosts.findIndex(post => post.id === parseInt(id));
  if (index === -1) return null;
  
  blogPosts[index] = {
    ...blogPosts[index],
    ...postData,
    id: parseInt(id)
  };
  return blogPosts[index];
};

export const deletePost = (id) => {
  const index = blogPosts.findIndex(post => post.id === parseInt(id));
  if (index === -1) return false;
  
  blogPosts = blogPosts.filter(post => post.id !== parseInt(id));
  return true;
};