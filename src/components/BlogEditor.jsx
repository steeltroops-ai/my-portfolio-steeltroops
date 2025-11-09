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
import { FiEdit3, FiEye, FiType } from "react-icons/fi";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

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
  const [showPreview, setShowPreview] = useState(false);
  const [editorMode, setEditorMode] = useState("write"); // "write", "preview", "rich"

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
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">
              {id ? "Edit Post" : "Create New Post"}
            </h1>
            <div className="flex gap-3">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className={`px-4 py-2 rounded-lg border backdrop-blur-md transition-all ${showPreview
                  ? "bg-yellow-500/20 border-yellow-400/30 text-yellow-200 shadow-lg shadow-yellow-500/10"
                  : "bg-yellow-500/10 border-yellow-400/20 text-yellow-300/70 hover:bg-yellow-500/15 hover:border-yellow-400/25"
                  }`}
              >
                {showPreview ? "Hide Preview" : "Live Preview"}
              </button>
              <button
                onClick={() => navigate("/admin/dashboard")}
                className="px-4 py-2 rounded-lg border border-red-500/30 backdrop-blur-md bg-red-500/10 hover:bg-red-500/20 hover:border-red-500/50 text-red-300/80 hover:text-red-300 transition-all"
              >
                Back to Dashboard
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-lg border border-red-500/30 backdrop-blur-md bg-red-500/10 text-red-400">
              {error}
            </div>
          )}

          <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
            {/* Left Column - Content Editor or Preview (2/3 width) */}
            <div className="lg:col-span-2 space-y-4">
              {showPreview ? (
                /* Full Blog Post Preview */
                <div className="p-8 rounded-xl border border-white/10 backdrop-blur-[2px] bg-white/5 shadow-xl">
                  {/* Featured Image Preview */}
                  {post.featured_image_url && (
                    <div className="mb-8 overflow-hidden rounded-xl aspect-video">
                      <img
                        src={post.featured_image_url}
                        alt={post.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Article Header */}
                  <header className="mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-6">
                      {post.title || "Untitled Post"}
                    </h1>

                    {/* Meta Info */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-400 mb-6">
                      <span>{new Date().toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}</span>
                      <span>•</span>
                      <span>{post.author || "Author"}</span>
                    </div>

                    {/* Tags */}
                    {tagInput && (
                      <div className="flex flex-wrap gap-2 mb-6">
                        {tagInput.split(",").map((tag, index) => {
                          const trimmedTag = tag.trim();
                          return trimmedTag ? (
                            <span
                              key={index}
                              className="px-3 py-1 text-xs rounded-full bg-purple-500/10 text-purple-300/70 border border-purple-400/20"
                            >
                              {trimmedTag}
                            </span>
                          ) : null;
                        })}
                      </div>
                    )}

                    {/* Excerpt */}
                    {post.excerpt && (
                      <p className="text-lg text-neutral-400 leading-relaxed">
                        {post.excerpt}
                      </p>
                    )}
                  </header>

                  {/* Article Content */}
                  <div className="prose prose-lg prose-invert prose-cyan max-w-none prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-p:text-neutral-300 prose-p:leading-relaxed prose-a:text-cyan-400 prose-a:no-underline hover:prose-a:underline prose-strong:text-white prose-code:text-cyan-300 prose-pre:bg-neutral-900 prose-pre:border prose-pre:border-neutral-800">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeHighlight]}
                      components={{
                        h1: ({ children, ...props }) => (
                          <h1 className="text-3xl font-bold text-white mt-8 mb-4 first:mt-0" {...props}>
                            {children}
                          </h1>
                        ),
                        h2: ({ children, ...props }) => (
                          <h2 className="text-2xl font-bold text-white mt-8 mb-4" {...props}>
                            {children}
                          </h2>
                        ),
                        h3: ({ children, ...props }) => (
                          <h3 className="text-xl font-bold text-white mt-6 mb-3" {...props}>
                            {children}
                          </h3>
                        ),
                        p: ({ children, ...props }) => (
                          <p className="text-lg leading-relaxed text-neutral-300 mb-6" {...props}>
                            {children}
                          </p>
                        ),
                        code({ node, inline, className, children, ...props }) {
                          const match = /language-(\w+)/.exec(className || "");
                          return !inline && match ? (
                            <div className="my-6">
                              <div className="bg-neutral-900 rounded-t-lg px-4 py-2 text-sm text-neutral-400 border-b border-neutral-700">
                                {match[1]}
                              </div>
                              <pre className="bg-neutral-800 rounded-b-lg p-4 overflow-x-auto">
                                <code className={className} {...props}>
                                  {children}
                                </code>
                              </pre>
                            </div>
                          ) : (
                            <code className="bg-neutral-800 px-2 py-1 rounded text-sm text-cyan-300" {...props}>
                              {children}
                            </code>
                          );
                        },
                        blockquote: ({ children, ...props }) => (
                          <blockquote className="border-l-4 border-cyan-500 pl-6 py-2 my-6 italic text-neutral-300 bg-neutral-900/30 rounded-r-lg" {...props}>
                            {children}
                          </blockquote>
                        ),
                        ul: ({ children, ...props }) => (
                          <ul className="list-disc list-inside space-y-2 text-neutral-300 mb-6" {...props}>
                            {children}
                          </ul>
                        ),
                        ol: ({ children, ...props }) => (
                          <ol className="list-decimal list-inside space-y-2 text-neutral-300 mb-6" {...props}>
                            {children}
                          </ol>
                        ),
                        li: ({ children, ...props }) => (
                          <li className="text-lg leading-relaxed" {...props}>
                            {children}
                          </li>
                        ),
                        a: ({ children, href, ...props }) => (
                          <a href={href} className="text-cyan-400 hover:text-cyan-300 underline transition-colors" target="_blank" rel="noopener noreferrer" {...props}>
                            {children}
                          </a>
                        ),
                        img: ({ src, alt, ...props }) => (
                          <img src={src} alt={alt} className="rounded-lg my-6 w-full" {...props} />
                        ),
                        table: ({ children, ...props }) => (
                          <div className="overflow-x-auto my-6">
                            <table className="min-w-full border border-neutral-700 rounded-lg" {...props}>
                              {children}
                            </table>
                          </div>
                        ),
                        th: ({ children, ...props }) => (
                          <th className="border border-neutral-700 px-4 py-3 bg-neutral-800 text-left font-semibold text-white" {...props}>
                            {children}
                          </th>
                        ),
                        td: ({ children, ...props }) => (
                          <td className="border border-neutral-700 px-4 py-3 text-neutral-300" {...props}>
                            {children}
                          </td>
                        ),
                        hr: ({ ...props }) => (
                          <hr className="border-neutral-700 my-8" {...props} />
                        ),
                      }}
                    >
                      {post.content || "*No content yet. Start writing to see the preview.*"}
                    </ReactMarkdown>
                  </div>
                </div>
              ) : (
                /* Editor Mode */
                <>
                  {/* Title, Slug, and Meta Description */}
                  <div className="p-6 rounded-xl border border-white/10 backdrop-blur-[2px] bg-white/5 shadow-xl space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-2">
                          Title *
                        </label>
                        <input
                          type="text"
                          value={post.title}
                          onChange={(e) => handleInputChange("title", e.target.value)}
                          className="w-full p-3 rounded-lg border border-white/10 backdrop-blur-[2px] bg-white/5 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400/50 transition-all shadow-lg"
                          placeholder="Enter post title..."
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-2">
                          Slug
                          <button
                            type="button"
                            onClick={generateSlugFromTitle}
                            className="ml-2 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                          >
                            Generate
                          </button>
                        </label>
                        <input
                          type="text"
                          value={post.slug}
                          onChange={(e) => handleInputChange("slug", e.target.value)}
                          className="w-full p-3 rounded-lg border border-white/10 backdrop-blur-[2px] bg-white/5 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400/50 transition-all shadow-lg"
                          placeholder="post-url-slug"
                        />
                      </div>
                    </div>

                    {/* Meta Description */}
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-2">
                        Meta Description (SEO)
                      </label>
                      <textarea
                        value={post.meta_description}
                        onChange={(e) =>
                          handleInputChange("meta_description", e.target.value)
                        }
                        className="w-full p-3 rounded-lg border border-white/10 backdrop-blur-[2px] bg-white/5 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400/50 transition-all shadow-lg resize-none"
                        rows="2"
                        maxLength="160"
                        placeholder="SEO meta description (max 160 characters)..."
                      />
                      <p className="text-xs text-white/40 mt-1.5">
                        {post.meta_description.length}/160 characters
                      </p>
                    </div>
                  </div>

                  {/* Content Editor */}
                  <div className="space-y-4">
                    {/* Editor Mode Tabs - Sleek Floating Design */}
                    <div className="flex items-center gap-2 p-1.5 rounded-xl border border-white/10 backdrop-blur-[2px] bg-white/5 shadow-lg w-fit">
                      <button
                        type="button"
                        onClick={() => setEditorMode("write")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${editorMode === "write"
                          ? "bg-purple-500/30 text-white shadow-lg shadow-purple-500/20"
                          : "text-white/50 hover:text-white/80 hover:bg-white/5"
                          }`}
                      >
                        <FiEdit3 className="w-4 h-4" />
                        <span>Write</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditorMode("preview")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${editorMode === "preview"
                          ? "bg-purple-500/30 text-white shadow-lg shadow-purple-500/20"
                          : "text-white/50 hover:text-white/80 hover:bg-white/5"
                          }`}
                      >
                        <FiEye className="w-4 h-4" />
                        <span>Preview</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditorMode("rich")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${editorMode === "rich"
                          ? "bg-purple-500/30 text-white shadow-lg shadow-purple-500/20"
                          : "text-white/50 hover:text-white/80 hover:bg-white/5"
                          }`}
                      >
                        <FiType className="w-4 h-4" />
                        <span>Rich</span>
                      </button>
                    </div>

                    {/* Editor Content */}
                    <div className="rounded-xl border border-white/10 backdrop-blur-[2px] bg-white/5 shadow-xl overflow-hidden">
                      {editorMode === "write" && (
                        <MarkdownEditor
                          value={post.content}
                          onChange={(content) => handleInputChange("content", content)}
                          height="500px"
                        />
                      )}

                      {editorMode === "preview" && (
                        <div className="prose prose-invert prose-sm max-w-none min-h-[500px] p-4 rounded-lg border border-white/10 backdrop-blur-[2px] bg-white/5">
                          {post.content ? (
                            <div dangerouslySetInnerHTML={{ __html: post.content }} />
                          ) : (
                            <p className="text-white/40 text-center py-20">No content to preview yet...</p>
                          )}
                        </div>
                      )}

                      {editorMode === "rich" && (
                        <div className="min-h-[500px] p-4 rounded-lg border border-white/10 backdrop-blur-[2px] bg-white/5">
                          <textarea
                            value={post.content}
                            onChange={(e) => handleInputChange("content", e.target.value)}
                            className="w-full h-[500px] p-4 rounded-lg border border-white/10 backdrop-blur-[2px] bg-white/5 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400/50 transition-all shadow-lg resize-none font-mono text-sm"
                            placeholder="Write your content here..."
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Right Column - Metadata Sidebar (1/3 width) */}
            <div className="space-y-4">
              <form className="space-y-4">

                {/* Unified Excerpt & Tags Card */}
                <div className="p-5 rounded-xl border border-white/10 backdrop-blur-[2px] bg-white/5 shadow-xl space-y-4">
                  {/* Excerpt Section */}
                  <div>
                    <label className="block text-xs font-semibold text-white/80 mb-2.5 uppercase tracking-wider">
                      Excerpt
                    </label>
                    <textarea
                      value={post.excerpt}
                      onChange={(e) => handleInputChange("excerpt", e.target.value)}
                      className="w-full p-3 text-sm rounded-lg border border-white/10 backdrop-blur-[2px] bg-black/20 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400/50 transition-all shadow-inner resize-none"
                      rows="3"
                      placeholder="Brief description of your post..."
                    />
                  </div>

                  {/* Divider */}
                  <div className="border-t border-white/10"></div>

                  {/* Tags Section */}
                  <div>
                    <label className="block text-xs font-semibold text-white/80 mb-2.5 uppercase tracking-wider">
                      Tags
                    </label>
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      className="w-full p-3 text-sm rounded-lg border border-white/10 backdrop-blur-[2px] bg-black/20 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400/50 transition-all shadow-inner"
                      placeholder="react, javascript, tutorial..."
                    />
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {[
                        "react",
                        "javascript",
                        "tutorial",
                        "web-dev",
                        "css",
                      ].map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => addTag(tag)}
                          className="text-[10px] px-2.5 py-1 rounded-full border border-cyan-400/20 backdrop-blur-[2px] bg-cyan-500/10 hover:bg-cyan-500/20 hover:border-cyan-400/40 text-cyan-300/70 hover:text-cyan-300 transition-all font-medium"
                        >
                          + {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Featured Image Upload */}
                <div className="p-5 rounded-xl border border-white/10 backdrop-blur-[2px] bg-white/5 shadow-xl">
                  <label className="block text-xs font-semibold text-white/80 mb-3 uppercase tracking-wider">
                    Featured Image
                  </label>
                  <div className="space-y-3">
                    <ImageUpload
                      onImageUploaded={handleImageUploaded}
                      folder="featured"
                      showPreview={false}
                    />
                    <input
                      type="text"
                      value={post.featured_image_url}
                      onChange={(e) =>
                        handleInputChange("featured_image_url", e.target.value)
                      }
                      className="w-full p-3 text-sm rounded-lg border border-white/10 backdrop-blur-[2px] bg-black/20 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400/50 transition-all shadow-inner"
                      placeholder="Or paste image URL..."
                    />
                    {post.featured_image_url && (
                      <div className="aspect-video rounded-lg overflow-hidden border border-white/10 backdrop-blur-[2px] bg-black/20 shadow-inner">
                        <img
                          src={post.featured_image_url}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3 p-5 rounded-xl border border-white/10 backdrop-blur-[2px] bg-white/5 shadow-xl">
                  <button
                    type="button"
                    onClick={(e) => handleSubmit(e, true)}
                    disabled={saving}
                    className="w-full px-5 py-3.5 text-sm rounded-lg border border-purple-400/30 backdrop-blur-[2px] bg-purple-500/20 hover:bg-purple-500/30 hover:border-purple-400/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-500/10 font-semibold text-white"
                  >
                    {saving
                      ? "Publishing..."
                      : id
                        ? "Update & Publish"
                        : "Publish Post"}
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleSubmit(e, false)}
                    disabled={saving}
                    className="w-full px-5 py-3 text-sm rounded-lg border border-white/10 backdrop-blur-[2px] bg-black/20 hover:bg-white/10 hover:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-inner font-medium"
                  >
                    {saving ? "Saving..." : "Save Draft"}
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate("/admin/dashboard")}
                    className="w-full px-5 py-2.5 text-sm rounded-lg border border-red-500/30 backdrop-blur-[2px] bg-red-500/10 hover:bg-red-500/20 hover:border-red-500/50 transition-all shadow-inner text-red-300/80 hover:text-red-300 font-medium"
                  >
                    Cancel
                  </button>
                </div>

              </form>
            </div>
          </div>

          {/* Remove old preview section */}
          {false && showPreview && (
            <div className="lg:sticky lg:top-8 h-fit">
              <div className="p-6 rounded-xl border border-white/10 backdrop-blur-md bg-white/5">
                <h2 className="text-xl font-bold text-white mb-4 pb-4 border-b border-white/10">
                  Live Preview
                </h2>

                {/* Preview Card */}
                <div className="space-y-4">
                  {/* Featured Image Preview */}
                  {post.featured_image_url && (
                    <div className="relative w-full overflow-hidden rounded-lg aspect-video">
                      <img
                        src={post.featured_image_url}
                        alt="Preview"
                        className="object-cover w-full h-full"
                      />
                    </div>
                  )}

                  {/* Title Preview */}
                  <h3 className="text-2xl font-bold text-white">
                    {post.title || "Untitled Post"}
                  </h3>

                  {/* Excerpt Preview */}
                  {post.excerpt && (
                    <p className="text-sm text-white/60">
                      {post.excerpt}
                    </p>
                  )}

                  {/* Tags Preview */}
                  {tagInput && (
                    <div className="flex flex-wrap gap-2">
                      {tagInput.split(",").map((tag, index) => {
                        const trimmedTag = tag.trim();
                        return trimmedTag ? (
                          <span
                            key={index}
                            className="px-2 py-1 text-xs rounded-full backdrop-blur-md bg-cyan-500/10 text-cyan-400/80 border border-cyan-400/20"
                          >
                            {trimmedTag}
                          </span>
                        ) : null;
                      })}
                    </div>
                  )}

                  {/* Meta Info Preview */}
                  <div className="flex items-center justify-between pt-4 text-xs border-t text-white/40 border-white/10">
                    <div className="flex items-center gap-2">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                      {new Date().toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                    <span className="font-medium">Preview</span>
                  </div>

                  {/* Content Preview */}
                  {post.content && (
                    <div className="pt-4 mt-4 border-t border-white/10">
                      <h4 className="text-sm font-medium text-white/70 mb-2">Content Preview:</h4>
                      <div className="text-sm text-white/50 line-clamp-6">
                        {post.content.substring(0, 300)}...
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BlogEditor;
