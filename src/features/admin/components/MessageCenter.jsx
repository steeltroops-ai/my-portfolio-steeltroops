import { useState } from "react";
import {
  useContactMessages,
  useUpdateMessageStatus,
  useDeleteMessage,
} from "../hooks/useContactMessages";
import {
  FiMail,
  FiEye,
  FiCheck,
  FiTrash2,
  FiX,
  FiUser,
  FiClock,
  FiMessageCircle,
  FiFilter,
} from "react-icons/fi";

const MessageCenter = () => {
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [adminNotes, setAdminNotes] = useState("");

  const { data, isLoading, error, refetch } = useContactMessages(statusFilter);
  const updateStatusMutation = useUpdateMessageStatus();
  const deleteMutation = useDeleteMessage();

  const messages = data?.data || [];

  const handleMarkRead = async (id) => {
    try {
      await updateStatusMutation.mutateAsync({ id, action: "read" });
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const handleMarkReplied = async (id) => {
    try {
      await updateStatusMutation.mutateAsync({
        id,
        action: "replied",
        notes: adminNotes,
      });
      setSelectedMessage(null);
      setAdminNotes("");
    } catch (err) {
      console.error("Failed to mark as replied:", err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this message?")) {
      try {
        await deleteMutation.mutateAsync(id);
        setSelectedMessage(null);
      } catch (err) {
        console.error("Failed to delete:", err);
      }
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "unread":
        return <FiMail className="text-cyan-400" />;
      case "read":
        return <FiEye className="text-yellow-400" />;
      case "replied":
        return <FiCheck className="text-green-400" />;
      default:
        return <FiMail className="text-white/40" />;
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      unread: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
      read: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      replied: "bg-green-500/20 text-green-400 border-green-500/30",
      archived: "bg-white/10 text-white/50 border-white/20",
    };

    return (
      <span
        className={`px-2 py-1 text-xs rounded-full backdrop-blur-md border ${styles[status] || styles.archived}`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background Effects */}
      <div className="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
      <div className="absolute left-0 right-0 top-[-10%] h-[1000px] w-[1000px] rounded-full bg-[radial-gradient(circle_400px_at_50%_300px,#fbfbfb36,#000)]"></div>

      <div className="relative container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <FiMessageCircle className="text-cyan-400" />
              Message Center
            </h1>
            <p className="text-white/60 mt-1">
              View and manage contact form submissions
            </p>
          </div>

          {/* Filter */}
          <div className="flex items-center gap-3">
            <FiFilter className="text-white/40" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 rounded-lg border border-white/10 backdrop-blur-md bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50 transition-all"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' fill-opacity='0.5' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 0.75rem center",
                backgroundSize: "12px",
                paddingRight: "2.5rem",
                appearance: "none",
              }}
            >
              <option value="all">All Messages</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
              <option value="replied">Replied</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="p-4 rounded-lg border border-white/10 backdrop-blur-md bg-white/5">
            <h3 className="text-sm font-medium text-white/60">Total</h3>
            <p className="text-2xl font-bold text-white">{data?.count || 0}</p>
          </div>
          <div className="p-4 rounded-lg border border-cyan-500/20 backdrop-blur-md bg-cyan-500/10">
            <h3 className="text-sm font-medium text-cyan-400/70">Unread</h3>
            <p className="text-2xl font-bold text-cyan-400">
              {messages.filter((m) => m.status === "unread").length}
            </p>
          </div>
          <div className="p-4 rounded-lg border border-yellow-500/20 backdrop-blur-md bg-yellow-500/10">
            <h3 className="text-sm font-medium text-yellow-400/70">Read</h3>
            <p className="text-2xl font-bold text-yellow-400">
              {messages.filter((m) => m.status === "read").length}
            </p>
          </div>
          <div className="p-4 rounded-lg border border-green-500/20 backdrop-blur-md bg-green-500/10">
            <h3 className="text-sm font-medium text-green-400/70">Replied</h3>
            <p className="text-2xl font-bold text-green-400">
              {messages.filter((m) => m.status === "replied").length}
            </p>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-20">
            <p className="text-red-400 mb-4">Failed to load messages</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 rounded-lg border border-cyan-400/30 backdrop-blur-md bg-cyan-500/20 hover:bg-cyan-500/30 hover:border-cyan-400/50 transition-all shadow-lg shadow-cyan-500/10"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Messages List */}
        {!isLoading && !error && (
          <div className="space-y-3">
            {messages.length === 0 ? (
              <div className="text-center py-20">
                <FiMail className="mx-auto text-6xl text-white/20 mb-4" />
                <p className="text-white/40 text-lg">No messages yet</p>
                <p className="text-white/30 text-sm mt-2">
                  Messages from your contact form will appear here
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  onClick={() => {
                    setSelectedMessage(message);
                    setAdminNotes(message.admin_notes || "");
                    if (message.status === "unread") {
                      handleMarkRead(message.id);
                    }
                  }}
                  className={`p-5 rounded-xl border backdrop-blur-md cursor-pointer transition-all ${
                    message.status === "unread"
                      ? "border-cyan-400/30 bg-cyan-500/10 hover:bg-cyan-500/15"
                      : "border-white/10 bg-white/5 hover:bg-white/10"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      {getStatusIcon(message.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-semibold text-white truncate">
                          {message.name}
                        </span>
                        {getStatusBadge(message.status)}
                        <span className="text-white/40 text-sm flex items-center gap-1 ml-auto">
                          <FiClock className="text-xs" />
                          {formatDate(message.created_at)}
                        </span>
                      </div>
                      <p className="text-white/80 font-medium mb-1 truncate">
                        {message.subject}
                      </p>
                      <p className="text-white/50 text-sm line-clamp-2">
                        {message.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Message Detail Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-white/10 backdrop-blur-md bg-black/90 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-xl font-bold text-white">Message Details</h2>
              <button
                onClick={() => setSelectedMessage(null)}
                className="p-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-all"
              >
                <FiX />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Sender Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-white/40 text-sm">From</label>
                  <p className="text-white font-medium flex items-center gap-2">
                    <FiUser className="text-cyan-400" />
                    {selectedMessage.name}
                  </p>
                </div>
                <div>
                  <label className="text-white/40 text-sm">Email</label>
                  <p className="text-white font-medium">
                    <a
                      href={`mailto:${selectedMessage.email}`}
                      className="text-cyan-400 hover:underline"
                    >
                      {selectedMessage.email}
                    </a>
                  </p>
                </div>
              </div>

              <div>
                <label className="text-white/40 text-sm">Subject</label>
                <p className="text-white font-medium">
                  {selectedMessage.subject}
                </p>
              </div>

              <div>
                <label className="text-white/40 text-sm">Message</label>
                <div className="mt-2 p-4 rounded-lg border border-white/10 bg-white/5">
                  <p className="text-white whitespace-pre-wrap">
                    {selectedMessage.message}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-white/40 text-sm">Admin Notes</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about this message..."
                  className="w-full mt-2 p-3 rounded-lg border border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 transition-all resize-none"
                  rows={3}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-6 border-t border-white/10">
              <button
                onClick={() => handleDelete(selectedMessage.id)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-500/30 backdrop-blur-md bg-red-500/20 hover:bg-red-500/30 hover:border-red-500/50 text-red-400 transition-all"
              >
                <FiTrash2 />
                Delete
              </button>

              <div className="flex items-center gap-3">
                {selectedMessage.status !== "replied" && (
                  <button
                    onClick={() => handleMarkReplied(selectedMessage.id)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-green-400/30 backdrop-blur-md bg-green-500/20 hover:bg-green-500/30 hover:border-green-400/50 text-green-400 transition-all"
                  >
                    <FiCheck />
                    Mark as Replied
                  </button>
                )}
                <a
                  href={`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject}`}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-cyan-400/30 backdrop-blur-md bg-cyan-500/20 hover:bg-cyan-500/30 hover:border-cyan-400/50 text-cyan-400 transition-all"
                >
                  <FiMail />
                  Reply via Email
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageCenter;
