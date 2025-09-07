import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  usePostById,
  useCreatePost,
  useUpdatePost,
} from "../hooks/useBlogQueries";
import { isAuthenticatedLegacy } from "../services/SupabaseAuthService";
import MarkdownEditor from "./MarkdownEditor";
import ImageUpload from "./ImageUpload";
import { generateSlug } from "../lib/supabase";

const BlogEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState({
    title: "",
    slug: "",
    content: "",
    excerpt: "",
    tags: [],
    featured_image_url: "",
    meta_description: "",
    published: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [tagInput, setTagInput] = useState("");

  // Use React Query hooks
  const {
    data: existingPost,
    isLoading: loading,
    error: queryError,
  } = usePostById(id);
  const createPostMutation = useCreatePost();
  const updatePostMutation = useUpdatePost();

  useEffect(() => {
    if (!isAuthenticatedLegacy()) {
      navigate("/admin/login");
      return;
    }
  }, [navigate]);

  useEffect(() => {
    if (existingPost) {
      setPost(existingPost);
      setTagInput(existingPost.tags ? existingPost.tags.join(", ") : "");
    }
  }, [existingPost]);

  useEffect(() => {
    if (queryError) {
      setError("Failed to load post");
    }
  }, [queryError]);

  const handleSubmit = async (e, shouldPublish = false) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      // Prepare post data
      const postData = {
        ...post,
        published: shouldPublish,
        tags: tagInput
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag),
        slug: post.slug || generateSlug(post.title),
      };

      if (id) {
        await updatePostMutation.mutateAsync({ id, postData });
      } else {
        await createPostMutation.mutateAsync(postData);
      }

      navigate("/admin/dashboard");
    } catch (err) {
      console.error("Error saving post:", err);
      setError(err.message || "Failed to save post");
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setPost((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleImageUploaded = (imageData) => {
    setPost((prev) => ({
      ...prev,
      featured_image_url: imageData.url,
    }));
  };

  const addTag = (tag) => {
    if (tag && !tagInput.includes(tag)) {
      const newTags = tagInput ? `${tagInput}, ${tag}` : tag;
      setTagInput(newTags);
    }
  };

  const generateSlugFromTitle = () => {
    if (post.title) {
      const slug = generateSlug(post.title);
      setPost((prev) => ({ ...prev, slug }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p>Loading post...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
      <div className="absolute left-0 right-0 top-[-10%] h-[1000px] w-[1000px] rounded-full bg-[radial-gradient(circle_400px_at_50%_300px,#fbfbfb36,#000)]"></div>

      <div className="relative container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">
              {id ? "Edit Post" : "Create New Post"}
            </h1>
            <button
              onClick={() => navigate("/admin/dashboard")}
              className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 rounded transition-colors"
            >
              Back to Dashboard
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-700 rounded text-red-400">
              {error}
            </div>
          )}
          <form className="space-y-8">
            {/* Title and Slug */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={post.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  className="w-full p-3 rounded bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus:border-cyan-500"
                  placeholder="Enter post title..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Slug
                  <button
                    type="button"
                    onClick={generateSlugFromTitle}
                    className="ml-2 text-xs text-cyan-400 hover:text-cyan-300"
                  >
                    Generate from title
                  </button>
                </label>
                <input
                  type="text"
                  value={post.slug}
                  onChange={(e) => handleInputChange("slug", e.target.value)}
                  className="w-full p-3 rounded bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus:border-cyan-500"
                  placeholder="post-url-slug"
                />
              </div>
            </div>

            {/* Excerpt */}
            <div>
              <label className="block text-sm font-medium mb-2">Excerpt</label>
              <textarea
                value={post.excerpt}
                onChange={(e) => handleInputChange("excerpt", e.target.value)}
                className="w-full p-3 rounded bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus:border-cyan-500"
                rows="3"
                placeholder="Brief description of the post..."
              />
              <p className="text-xs text-neutral-500 mt-1">
                Leave empty to auto-generate from content
              </p>
            </div>

            {/* Featured Image Upload */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Featured Image
              </label>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <ImageUpload
                    onImageUploaded={handleImageUploaded}
                    folder="featured"
                    showPreview={false}
                    className="mb-4"
                  />
                  <input
                    type="text"
                    value={post.featured_image_url}
                    onChange={(e) =>
                      handleInputChange("featured_image_url", e.target.value)
                    }
                    className="w-full p-3 rounded bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus:border-cyan-500"
                    placeholder="Or paste image URL..."
                  />
                </div>
                {post.featured_image_url && (
                  <div className="aspect-video rounded-lg overflow-hidden bg-neutral-800">
                    <img
                      src={post.featured_image_url}
                      alt="Featured image preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Content Editor */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Content *
              </label>
              <MarkdownEditor
                value={post.content}
                onChange={(content) => handleInputChange("content", content)}
                height="500px"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium mb-2">Tags</label>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                className="w-full p-3 rounded bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus:border-cyan-500"
                placeholder="Enter tags separated by commas (e.g., react, javascript, web-development)"
              />
              <div className="flex flex-wrap gap-2 mt-2">
                {[
                  "react",
                  "javascript",
                  "web-development",
                  "tutorial",
                  "guide",
                ].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => addTag(tag)}
                    className="text-xs px-2 py-1 bg-neutral-700 hover:bg-neutral-600 text-neutral-300 rounded transition-colors"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Meta Description */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Meta Description (SEO)
              </label>
              <textarea
                value={post.meta_description}
                onChange={(e) =>
                  handleInputChange("meta_description", e.target.value)
                }
                className="w-full p-3 rounded bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus:border-cyan-500"
                rows="2"
                maxLength="160"
                placeholder="SEO meta description (max 160 characters)..."
              />
              <p className="text-xs text-neutral-500 mt-1">
                {post.meta_description.length}/160 characters
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 pt-6 border-t border-neutral-700">
              <button
                type="button"
                onClick={(e) => handleSubmit(e, false)}
                disabled={saving}
                className="px-6 py-3 bg-neutral-700 hover:bg-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
              >
                {saving ? "Saving..." : "Save Draft"}
              </button>

              <button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                disabled={saving}
                className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
              >
                {saving
                  ? "Publishing..."
                  : id
                  ? "Update & Publish"
                  : "Publish Post"}
              </button>

              <button
                type="button"
                onClick={() => navigate("/admin/dashboard")}
                className="px-6 py-3 bg-red-700 hover:bg-red-600 rounded transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BlogEditor;
