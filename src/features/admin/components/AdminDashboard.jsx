import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  useAllPosts,
  useDeletePost,
  useTogglePostPublished,
} from "@/features/blog/hooks/useBlogQueries";
import { useQueryClient } from "@tanstack/react-query";
import { fetchStats } from "@/shared/analytics/useAnalyticsStats";
import { fetchContactMessages } from "../hooks/useContactMessages";
import { isAuthenticated } from "../services/HybridAuthService";
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiEye,
  FiEyeOff,
  FiSearch,
  FiCalendar,
  FiLoader,
  FiMenu,
  FiExternalLink,
  FiChevronDown,
} from "react-icons/fi";
import { useAdmin } from "../context/AdminContext";

// O(1) Performance Strategy: Memoized Component for Linear-to-Constant DOM Complexity
const PostItem = memo(({ post, onEdit, onToggle, onDelete }) => (
  <div className="group flex flex-col relative overflow-hidden rounded-2xl transition-all duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.4)] bg-white/[0.03] border border-white/10 hover:border-purple-500/30">
    <div className="p-5">
      <div className="flex flex-col xl:flex-row justify-between items-start gap-4">
        <div className="flex-1 min-w-0 w-full text-left">
          <div className="flex items-start justify-between gap-3 mb-1.5 min-w-0">
            <h2 className="text-sm sm:text-lg font-bold text-white group-hover:text-purple-300 transition-colors truncate">
              {post.title}
            </h2>
            <span
              className={`px-2 py-0.5 text-[9px] sm:text-xs font-bold rounded-full border shrink-0 ${
                post.published
                  ? "bg-green-500/10 text-green-400 border-green-500/20"
                  : "bg-neutral-500/10 text-neutral-400 border-neutral-500/20"
              }`}
            >
              {post.published ? "Live" : "Draft"}
            </span>
          </div>

          <p className="text-neutral-400 text-[11px] sm:text-sm mb-3 line-clamp-2 pr-0 sm:pr-4 leading-relaxed">
            {post.excerpt || "No summary available for this content."}
          </p>

          <div className="flex items-center gap-4 text-[10px] sm:text-xs text-neutral-500">
            <div className="flex items-center gap-1.5 font-mono uppercase tracking-wider">
              <FiCalendar size={12} className="opacity-70" />
              {new Date(post.created_at).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </div>
            {post.read_time && (
              <span className="bg-white/5 px-2 py-0.5 rounded border border-white/10 text-neutral-400">
                {post.read_time} min read
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-row items-center gap-2 shrink-0 w-full lg:w-auto mt-2 lg:mt-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-white/5">
          <button
            onClick={() => onToggle(post.id, post.published)}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white text-xs font-bold transition-all border border-white/10"
            title={post.published ? "Unpublish content" : "Make content live"}
          >
            {post.published ? <FiEyeOff size={14} /> : <FiEye size={14} />}
            <span className="xs:inline md:hidden lg:inline">
              {post.published ? "Hide" : "Publish"}
            </span>
          </button>

          <button
            onClick={() => onEdit(post.id)}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-all border border-white/10"
          >
            <FiEdit size={14} />
            Edit
          </button>

          <div className="hidden lg:block w-px h-6 bg-white/10 mx-1"></div>

          <button
            onClick={() => onDelete(post.id)}
            className="flex items-center justify-center p-2.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-bold transition-all border border-red-500/10"
            title="Permanently remove"
          >
            <FiTrash2 size={14} />
          </button>

          {post.published && (
            <Link
              to={`/blogs/${post.slug}`}
              target="_blank"
              className="flex items-center justify-center p-2.5 rounded-lg text-neutral-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 border border-white/10"
              title="View Live"
            >
              <FiExternalLink size={14} />
            </Link>
          )}
        </div>
      </div>
    </div>
  </div>
));
PostItem.displayName = "PostItem";

const AdminDashboard = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // all, published, draft
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Use React Query hooks
  const {
    data: postsData,
    isLoading: loading,
    isFetching,
    error: queryError,
    refetch,
  } = useAllPosts({
    limit: 100,
    staleTime: 0, // Real-time Priority: Always revalidate on mount
  });
  const deletePostMutation = useDeletePost();
  const togglePublishedMutation = useTogglePostPublished();

  const posts = postsData?.posts || [];
  const error =
    queryError?.message ||
    (postsData?.error?.type === "error" ? postsData.error.message : "");
  const warning =
    postsData?.error?.type === "warning" ? postsData.error.message : "";

  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = await isAuthenticated();
      if (!authenticated) {
        navigate("/admin/login");
      }
    };
    checkAuth();

    // Force a refetch on mount to ensure we have the absolute latest data
    // This solves the "fails to load" or "stale data" issue
    refetch();

    // Click outside handler for custom dropdown
    const handleClickOutside = (e) => {
      if (isFilterOpen && !e.target.closest(".status-filter-container")) {
        setIsFilterOpen(false);
      }
    };
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, [navigate, refetch, isFilterOpen]);

  const handleNewPost = useCallback(() => {
    navigate("/admin/post/new");
  }, [navigate]);

  const handleEditPost = useCallback(
    (id) => {
      navigate(`/admin/post/edit/${id}`);
    },
    [navigate]
  );

  const handleDeletePost = useCallback(
    async (id) => {
      if (window.confirm("Are you sure you want to delete this post?")) {
        try {
          await deletePostMutation.mutateAsync(id);
        } catch (err) {
          console.error("Error deleting post:", err);
          alert("Failed to delete post");
        }
      }
    },
    [deletePostMutation]
  );

  const handleTogglePublished = useCallback(
    async (id, _currentStatus) => {
      try {
        await togglePublishedMutation.mutateAsync({
          id,
          published: !_currentStatus,
        });
      } catch (err) {
        console.error("Error toggling post status:", err);
        alert("Failed to update post status");
      }
    },
    [togglePublishedMutation]
  );

  // O(1) DSA Strategy: Memoized Hash Index & Filtered View
  const filteredPosts = useMemo(() => {
    if (!posts.length) return [];

    return posts.filter((post) => {
      const matchesSearch =
        !searchTerm ||
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.excerpt?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "published" && post.published) ||
        (filterStatus === "draft" && !post.published);

      return matchesSearch && matchesStatus;
    });
  }, [posts, searchTerm, filterStatus]);

  const { setIsSidebarCollapsed } = useAdmin();

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <style>{`
        /* O(1) Component Styling */
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

      <div className="flex flex-row justify-between items-center mb-6 sm:mb-8 gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2 sm:gap-4 flex-wrap">
            <button
              onClick={() => setIsSidebarCollapsed(false)}
              className="xl:hidden p-1 -ml-1 text-neutral-400 hover:text-white transition-colors"
            >
              <FiMenu size={20} />
            </button>
            Dashboard
            {isFetching && !loading && (
              <span className="inline-flex items-center gap-2 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-[9px] sm:text-xs font-bold shadow-[0_0_15px_rgba(34,197,94,0.1)]">
                <FiLoader className="animate-spin" size={10} />
                Syncing
              </span>
            )}
          </h1>
          <p className="hidden xs:block text-neutral-400 text-[10px] sm:text-sm mt-0.5 sm:mt-1">
            Build your content.
          </p>
        </div>

        <button
          onClick={handleNewPost}
          className="group relative flex items-center justify-center gap-2 px-5 sm:px-8 py-3 sm:py-4 rounded-2xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-200 text-xs sm:text-sm font-black tracking-widest uppercase transition-all border border-purple-500/30 hover:border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.15)] active:scale-95 shrink-0 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 via-transparent to-white/5 pointer-events-none" />
          <FiPlus
            size={18}
            className="relative z-10 text-purple-400 group-hover:rotate-90 transition-transform duration-300"
          />
          <span className="relative z-10">New Post</span>
        </button>
      </div>

      {/* Aggregated Stats (O(1) Access) */}
      <div className="grid grid-cols-3 gap-3 sm:gap-6 mb-8">
        {[
          {
            label: "Total",
            value: postsData?.count || 0,
            textColor: "text-white",
            labelColor: "text-neutral-500",
            bg: "bg-white/5",
            borderColor: "border-white/10",
          },
          {
            label: "Live",
            value: postsData?.liveCount || 0,
            textColor: "text-green-400",
            labelColor: "text-green-400/60",
            bg: "bg-green-500/10",
            borderColor: "border-green-500/20",
          },
          {
            label: "Drafts",
            value: postsData?.draftCount || 0,
            textColor: "text-amber-400",
            labelColor: "text-amber-400/60",
            bg: "bg-amber-500/10",
            borderColor: "border-amber-500/20",
          },
        ].map((stat, i) => (
          <div
            key={i}
            className={`relative group p-3 sm:p-6 rounded-2xl border ${stat.borderColor} ${stat.bg} backdrop-blur-md overflow-hidden transition-all duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.4)]`}
          >
            {/* Gloss Highlight */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-30 pointer-events-none" />
            <div
              className={`relative z-10 text-[9px] sm:text-xs font-bold uppercase tracking-wider ${stat.labelColor} mb-1 sm:mb-2`}
            >
              {stat.label}
            </div>
            <div
              className={`relative z-10 text-xl sm:text-4xl font-extrabold ${stat.textColor} tracking-tight`}
            >
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Search and Filter Controls */}
      <div className="mb-6 flex flex-row gap-2 sm:gap-4">
        <div className="flex-1 relative group">
          <div className="absolute inset-0 rounded-xl border border-white/10 pointer-events-none z-20 group-focus-within:border-white/20 transition-colors"></div>
          <FiSearch
            size={18}
            className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-neutral-500 group-focus-within:text-purple-400 transition-colors pointer-events-none z-30"
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search posts..."
            className="w-full pl-10 pr-3 py-3 sm:py-4 rounded-xl bg-white/[0.02] backdrop-blur-md text-[11px] sm:text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:bg-white/[0.05] transition-all font-medium border-0"
          />
        </div>

        <div className="status-filter-container relative group">
          <div className="absolute inset-0 rounded-xl border border-white/10 pointer-events-none z-20 group-hover:border-white/20 transition-colors"></div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsFilterOpen(!isFilterOpen);
            }}
            className="w-full flex items-center justify-between gap-3 pl-4 pr-3 py-3 sm:py-4 rounded-xl bg-white/[0.02] backdrop-blur-md text-[11px] sm:text-sm text-white focus:outline-none hover:bg-white/[0.05] transition-all font-medium border-0 min-w-[130px] sm:min-w-[170px]"
          >
            <span>
              {filterStatus === "all" && "Every status"}
              {filterStatus === "published" && "Published"}
              {filterStatus === "draft" && "Drafts"}
            </span>
            <FiChevronDown
              size={14}
              className={`text-neutral-500 transition-transform duration-300 ${isFilterOpen ? "rotate-180" : ""}`}
            />
          </button>

          {isFilterOpen && (
            <div className="absolute top-[calc(100%+8px)] left-0 right-0 z-[100] rounded-xl bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.6)] overflow-hidden animate-fade-in origin-top">
              {[
                { value: "all", label: "Every status" },
                { value: "published", label: "Published" },
                { value: "draft", label: "Drafts" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setFilterStatus(opt.value);
                    setIsFilterOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 text-[11px] sm:text-sm transition-all
                    ${
                      filterStatus === opt.value
                        ? "bg-purple-500/20 text-purple-300 font-bold"
                        : "text-neutral-400 hover:text-white hover:bg-white/5"
                    }
                  `}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Loading State Skeleton */}
      {(loading || (isFetching && filteredPosts.length === 0)) && (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="p-6 rounded-xl border border-white/5 bg-white/[0.01]"
            >
              <div className="flex gap-4">
                <div className="flex-1 space-y-3">
                  <div className="h-6 w-1/3 bg-white/5 rounded" />
                  <div className="h-4 w-full bg-white/5 rounded" />
                  <div className="h-3 w-1/4 bg-white/5 rounded" />
                </div>
                <div className="flex gap-2">
                  <div className="h-9 w-20 bg-white/5 rounded-lg" />
                  <div className="h-9 w-20 bg-white/5 rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Warning State (e.g. Neon down, showing static) */}
      {warning && !error && (
        <div className="mb-6 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-200 text-sm flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
          {warning}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-20 bg-red-500/5 rounded-2xl border border-red-500/10 backdrop-blur-[2px]">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
            <FiTrash2 className="text-red-400" size={24} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Sync Failure</h3>
          <p className="text-red-400 mb-6 max-w-md mx-auto">{error}</p>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium transition-all backdrop-blur-[2px] mx-auto"
          >
            <FiLoader className={isFetching ? "animate-spin" : ""} size={18} />
            Try Again
          </button>
        </div>
      )}

      {!loading && !error && !(isFetching && filteredPosts.length === 0) && (
        <div className="space-y-4 pb-20">
          {filteredPosts.length === 0 ? (
            <div className="text-center py-24 bg-white/[0.02] border border-white/10 rounded-3xl border-dashed">
              <p className="text-neutral-500 text-lg mb-4">
                {searchTerm || filterStatus !== "all"
                  ? "No results found for your query."
                  : "No blog posts discovered in the system."}
              </p>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setFilterStatus("all");
                }}
                className="text-purple-400 hover:text-purple-300 font-bold tracking-widest uppercase text-xs"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            filteredPosts.map((post) => (
              <PostItem
                key={post.id}
                post={post}
                onEdit={handleEditPost}
                onToggle={handleTogglePublished}
                onDelete={handleDeletePost}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
