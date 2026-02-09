import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  useAllPosts,
  useDeletePost,
  useTogglePostPublished,
} from "@/features/blog/hooks/useBlogQueries";
import { isAuthenticated } from "../services/HybridAuthService";
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
    const checkAuth = async () => {
      const authenticated = await isAuthenticated();
      if (!authenticated) {
        navigate("/admin/login");
      }
    };
    checkAuth();
  }, [navigate]);

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
    <>
      <style>{`
        select.glass-select option {
          background: rgba(0, 0, 0, 0.95);
          backdrop-filter: blur(10px);
          color: white;
          padding: 8px;
        }
        select.glass-select option:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        select.glass-select option:checked {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Dashboard
          </h1>
          <p className="text-neutral-400 text-sm mt-1">
            Manage your blog posts and content.
          </p>
        </div>

        <button
          onClick={handleNewPost}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 hover:border-purple-500/50 text-purple-100 font-medium transition-all backdrop-blur-[2px] shadow-lg shadow-purple-500/20"
        >
          <FiPlus size={20} />
          New Post
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="p-6 rounded-xl bg-white/5 border border-white/10 backdrop-blur-[2px] shadow-xl">
          <h3 className="text-sm font-medium text-neutral-400 mb-2">
            Total Posts
          </h3>
          <p className="text-3xl font-bold text-white">{posts.length}</p>
        </div>
        <div className="p-6 rounded-xl bg-green-500/10 border border-green-500/20 backdrop-blur-[2px] shadow-xl shadow-green-900/10">
          <h3 className="text-sm font-medium text-green-400/80 mb-2">
            Published
          </h3>
          <p className="text-3xl font-bold text-green-400">
            {posts.filter((post) => post.published).length}
          </p>
        </div>
        <div className="p-6 rounded-xl bg-yellow-500/10 border border-yellow-500/20 backdrop-blur-[2px] shadow-xl shadow-yellow-900/10">
          <h3 className="text-sm font-medium text-yellow-400/80 mb-2">
            Drafts
          </h3>
          <p className="text-3xl font-bold text-yellow-400">
            {posts.filter((post) => !post.published).length}
          </p>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative group">
          <FiSearch
            size={20}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500 group-focus-within:text-white transition-colors"
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search posts..."
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-white/10 bg-white/5 backdrop-blur-[2px] text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="glass-select px-4 py-3 rounded-lg border border-white/10 bg-white/5 backdrop-blur-[2px] text-white focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all cursor-pointer min-w-[150px]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' fill-opacity='0.5' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 1rem center",
            backgroundSize: "10px",
            paddingRight: "2.5rem",
            appearance: "none",
          }}
        >
          <option value="all">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Drafts</option>
        </select>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-20">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white transition-all backdrop-blur-[2px]"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Posts Grid */}
      {!loading && !error && (
        <div className="space-y-4">
          {filteredPosts.length === 0 ? (
            <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/5 border-dashed backdrop-blur-[2px]">
              <p className="text-neutral-400 text-lg mb-4">
                {searchTerm || filterStatus !== "all"
                  ? "No posts match your filters."
                  : "No blog posts yet."}
              </p>
              {searchTerm || filterStatus !== "all" ? (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setFilterStatus("all");
                  }}
                  className="text-white hover:underline font-medium"
                >
                  Clear filters
                </button>
              ) : (
                <button
                  onClick={handleNewPost}
                  className="text-white hover:underline font-medium"
                >
                  Create your first post
                </button>
              )}
            </div>
          ) : (
            filteredPosts.map((post) => (
              <div
                key={post.id}
                className="group p-5 rounded-xl border border-white/10 bg-white/5 backdrop-blur-[2px] hover:bg-white/[0.07] hover:border-white/20 transition-all duration-200"
              >
                <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h2 className="text-lg font-semibold text-white group-hover:text-white transition-colors truncate max-w-full">
                        {post.title}
                      </h2>
                      <span
                        className={`px-2.5 py-0.5 text-xs font-medium rounded-full border ${
                          post.published
                            ? "bg-green-500/10 text-green-400 border-green-500/20"
                            : "bg-neutral-500/10 text-neutral-400 border-neutral-500/20"
                        }`}
                      >
                        {post.published ? "Published" : "Draft"}
                      </span>
                    </div>

                    <p className="text-neutral-400 text-sm mb-3 line-clamp-2 pr-4">
                      {post.excerpt || "No excerpt provided."}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-neutral-500">
                      <div className="flex items-center gap-1.5">
                        <FiCalendar size={12} />
                        {new Date(post.created_at).toLocaleDateString()}
                      </div>
                      {post.read_time && <span>{post.read_time} min read</span>}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 shrink-0">
                    <button
                      onClick={() =>
                        handleTogglePublished(post.id, post.published)
                      }
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        post.published
                          ? "bg-white/5 hover:bg-white/10 text-neutral-300"
                          : "bg-white/5 hover:bg-white/10 text-neutral-300"
                      }`}
                      title={post.published ? "Unpublish" : "Publish"}
                    >
                      {post.published ? (
                        <FiEyeOff size={14} />
                      ) : (
                        <FiEye size={14} />
                      )}
                      {post.published ? "Unpublish" : "Publish"}
                    </button>

                    <button
                      onClick={() => handleEditPost(post.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-medium transition-all"
                    >
                      <FiEdit size={14} />
                      Edit
                    </button>

                    <div className="w-px h-6 bg-white/10 mx-1 hidden sm:block"></div>

                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium transition-all"
                    >
                      <FiTrash2 size={14} />
                    </button>

                    {post.published && (
                      <Link
                        to={`/blogs/${post.slug}`}
                        target="_blank"
                        className="flex items-center px-2 py-1.5 rounded-lg text-neutral-400 hover:text-white transition-colors"
                        title="View Live"
                      >
                        <FiEye size={16} />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </>
  );
};

export default AdminDashboard;
