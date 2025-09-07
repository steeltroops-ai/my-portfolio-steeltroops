import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  useAllPosts,
  useDeletePost,
  useTogglePostPublished,
} from "../hooks/useBlogQueries";
import { isAuthenticatedLegacy, logout } from "../services/SupabaseAuthService";
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiEye,
  FiEyeOff,
  FiSearch,
  FiCalendar,
} from "react-icons/fi";

const AdminDashboard = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // all, published, draft
  const navigate = useNavigate();

  // Use React Query hooks
  const {
    data: postsData,
    isLoading: loading,
    error: queryError,
    refetch,
  } = useAllPosts();
  const deletePostMutation = useDeletePost();
  const togglePublishedMutation = useTogglePostPublished();

  const posts = postsData?.posts || [];
  const error = queryError ? "Failed to load posts" : "";

  useEffect(() => {
    if (!isAuthenticatedLegacy()) {
      navigate("/admin/login");
      return;
    }
  }, [navigate]);

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  const handleNewPost = () => {
    navigate("/admin/post/new");
  };

  const handleEditPost = (id) => {
    navigate(`/admin/post/edit/${id}`);
  };

  const handleDeletePost = async (id) => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      try {
        await deletePostMutation.mutateAsync(id);
      } catch (err) {
        console.error("Error deleting post:", err);
        alert("Failed to delete post");
      }
    }
  };

  const handleTogglePublished = async (id, _currentStatus) => {
    try {
      await togglePublishedMutation.mutateAsync(id);
    } catch (err) {
      console.error("Error toggling post status:", err);
      alert("Failed to update post status");
    }
  };

  // Filter posts based on search term and status
  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.excerpt?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "published" && post.published) ||
      (filterStatus === "draft" && !post.published);

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
      <div className="absolute left-0 right-0 top-[-10%] h-[1000px] w-[1000px] rounded-full bg-[radial-gradient(circle_400px_at_50%_300px,#fbfbfb36,#000)]"></div>
      <div className="relative container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold">Blog Dashboard</h1>
          <div className="flex gap-4">
            <button
              onClick={handleNewPost}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded transition-colors"
            >
              <FiPlus />
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

        {/* Search and Filter Controls */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search posts..."
              className="w-full pl-10 pr-4 py-2 bg-neutral-800 border border-neutral-700 rounded text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-neutral-800 border border-neutral-700 rounded text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Posts</option>
            <option value="published">Published</option>
            <option value="draft">Drafts</option>
          </select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-neutral-900/50 p-4 rounded-lg border border-neutral-800">
            <h3 className="text-sm font-medium text-neutral-400">
              Total Posts
            </h3>
            <p className="text-2xl font-bold text-white">{posts.length}</p>
          </div>
          <div className="bg-neutral-900/50 p-4 rounded-lg border border-neutral-800">
            <h3 className="text-sm font-medium text-neutral-400">Published</h3>
            <p className="text-2xl font-bold text-green-400">
              {posts.filter((post) => post.published).length}
            </p>
          </div>
          <div className="bg-neutral-900/50 p-4 rounded-lg border border-neutral-800">
            <h3 className="text-sm font-medium text-neutral-400">Drafts</h3>
            <p className="text-2xl font-bold text-yellow-400">
              {posts.filter((post) => !post.published).length}
            </p>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-20">
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Posts Grid */}
        {!loading && !error && (
          <div className="space-y-4">
            {filteredPosts.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-neutral-400 text-lg mb-4">
                  {searchTerm || filterStatus !== "all"
                    ? "No posts match your filters."
                    : "No blog posts yet."}
                </p>
                {(searchTerm || filterStatus !== "all") && (
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setFilterStatus("all");
                    }}
                    className="text-cyan-400 hover:text-cyan-300"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              filteredPosts.map((post) => (
                <div
                  key={post.id}
                  className="p-6 rounded-xl border backdrop-blur-sm border-neutral-800 bg-neutral-900/30 hover:bg-neutral-900/50 transition-colors"
                >
                  <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-xl font-semibold">{post.title}</h2>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            post.published
                              ? "bg-green-900/30 text-green-400 border border-green-700"
                              : "bg-yellow-900/30 text-yellow-400 border border-yellow-700"
                          }`}
                        >
                          {post.published ? "Published" : "Draft"}
                        </span>
                      </div>

                      <p className="text-neutral-400 mb-3 line-clamp-2">
                        {post.excerpt}
                      </p>

                      {/* Tags */}
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {post.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="text-xs px-2 py-1 bg-neutral-800 text-neutral-400 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                          {post.tags.length > 3 && (
                            <span className="text-xs px-2 py-1 bg-neutral-800 text-neutral-400 rounded">
                              +{post.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-sm text-neutral-500">
                        <div className="flex items-center gap-1">
                          <FiCalendar />
                          {new Date(post.created_at).toLocaleDateString()}
                        </div>
                        {post.read_time && (
                          <span>{post.read_time} min read</span>
                        )}
                        {post.updated_at !== post.created_at && (
                          <span className="text-neutral-600">
                            Updated{" "}
                            {new Date(post.updated_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() =>
                          handleTogglePublished(post.id, post.published)
                        }
                        className={`flex items-center gap-1 px-3 py-2 rounded text-sm transition-colors ${
                          post.published
                            ? "bg-yellow-600 hover:bg-yellow-700 text-white"
                            : "bg-green-600 hover:bg-green-700 text-white"
                        }`}
                        title={post.published ? "Unpublish" : "Publish"}
                      >
                        {post.published ? <FiEyeOff /> : <FiEye />}
                        {post.published ? "Unpublish" : "Publish"}
                      </button>

                      <button
                        onClick={() => handleEditPost(post.id)}
                        className="flex items-center gap-1 px-3 py-2 bg-cyan-600 hover:bg-cyan-700 rounded text-sm transition-colors"
                      >
                        <FiEdit />
                        Edit
                      </button>

                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="flex items-center gap-1 px-3 py-2 bg-red-600 hover:bg-red-700 rounded text-sm transition-colors"
                      >
                        <FiTrash2 />
                        Delete
                      </button>

                      {post.published && (
                        <Link
                          to={`/blog/${post.slug}`}
                          target="_blank"
                          className="flex items-center gap-1 px-3 py-2 bg-neutral-700 hover:bg-neutral-600 rounded text-sm transition-colors"
                        >
                          <FiEye />
                          View
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
