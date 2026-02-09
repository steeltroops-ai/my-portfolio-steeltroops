import { useState, useMemo, useEffect } from "react";
import {
  FiMail,
  FiCheck,
  FiTrash2,
  FiSearch,
  FiCalendar,
  FiMessageSquare,
} from "react-icons/fi";
import { useContactMessages } from "../hooks/useContactMessages";
import { useUpdateMessageStatus } from "../hooks/useContactMessages";
import { useDeleteMessage } from "../hooks/useContactMessages";
import { toast } from "react-hot-toast";

const MessageCenter = () => {
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data, isLoading, error, refetch } = useContactMessages();
  const updateStatusMutation = useUpdateMessageStatus();
  const deleteMessageMutation = useDeleteMessage();

  const messages = data?.messages || [];

  // Group messages by email
  const threads = useMemo(() => {
    const grouped = messages.reduce((acc, message) => {
      const email = message.email;
      if (!acc[email]) {
        acc[email] = {
          email,
          name: message.name,
          messages: [],
          lastMessage: null,
          unreadCount: 0,
        };
      }
      acc[email].messages.push(message);
      if (message.status === "unread") {
        acc[email].unreadCount += 1;
      }
      return acc;
    }, {});

    // Sort messages within threads
    Object.values(grouped).forEach((thread) => {
      thread.messages.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
      thread.lastMessage = thread.messages[0];
    });

    // Sort threads by most recent message
    return Object.values(grouped).sort((a, b) => {
      return (
        new Date(b.lastMessage.created_at) - new Date(a.lastMessage.created_at)
      );
    });
  }, [messages]);

  // Filter threads
  const filteredThreads = threads.filter((thread) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      thread.name.toLowerCase().includes(searchLower) ||
      thread.email.toLowerCase().includes(searchLower) ||
      thread.messages.some((m) => m.message.toLowerCase().includes(searchLower))
    );
  });

  // Select first thread by default
  useEffect(() => {
    if (!selectedEmail && filteredThreads.length > 0 && !isLoading) {
      setSelectedEmail(filteredThreads[0].email);
    }
  }, [filteredThreads, isLoading, selectedEmail]);

  const activeThread = threads.find((t) => t.email === selectedEmail);

  // Sort for chat view (oldest to newest)
  const activeMessages = activeThread
    ? [...activeThread.messages].sort(
        (a, b) => new Date(a.created_at) - new Date(b.created_at)
      )
    : [];

  const handleStatusUpdate = async (id, status) => {
    try {
      await updateStatusMutation.mutateAsync({ id, status });
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this message?")) {
      try {
        await deleteMessageMutation.mutateAsync(id);
        toast.success("Message deleted");
      } catch (error) {
        toast.error("Failed to delete");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-140px)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-400 mb-4">Failed to load messages</p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 rounded-lg border border-white/10 backdrop-blur-[2px] bg-white/5 hover:bg-white/10 transition-all text-white"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-140px)] max-h-[800px] flex gap-6">
      {/* Left Sidebar: Thread List */}
      <div className="w-1/3 min-w-[320px] max-w-[400px] flex flex-col gap-4">
        {/* Search Header */}
        <div className="relative">
          <FiSearch
            size={18}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500"
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search messages..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/10 bg-white/5 backdrop-blur-[2px] text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all"
          />
        </div>

        {/* Thread List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2">
          {filteredThreads.map((thread) => (
            <button
              key={thread.email}
              onClick={() => setSelectedEmail(thread.email)}
              className={`w-full text-left p-4 rounded-xl border transition-all group ${
                selectedEmail === thread.email
                  ? "bg-white/10 border-white/20 shadow-lg shadow-purple-500/5"
                  : "bg-white/5 border-white/5 hover:bg-white/[0.07] hover:border-white/10"
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center border border-white/10 shrink-0">
                    <span className="text-xs font-bold text-white">
                      {thread.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span
                    className={`font-semibold truncate ${
                      selectedEmail === thread.email
                        ? "text-white"
                        : "text-neutral-300 group-hover:text-white"
                    }`}
                  >
                    {thread.name}
                  </span>
                </div>
                {thread.unreadCount > 0 && (
                  <span className="bg-purple-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-lg shadow-purple-500/20 shrink-0">
                    {thread.unreadCount}
                  </span>
                )}
              </div>
              <p className="text-sm text-neutral-400 truncate pl-10">
                {thread.lastMessage.message}
              </p>
              <div className="mt-2 pl-10 flex items-center gap-2 text-[10px] text-neutral-500">
                <FiCalendar size={10} />
                <span>
                  {new Date(thread.lastMessage.created_at).toLocaleDateString()}
                </span>
                <span className="w-1 h-1 rounded-full bg-neutral-600"></span>
                <span>
                  {new Date(thread.lastMessage.created_at).toLocaleTimeString(
                    [],
                    { hour: "2-digit", minute: "2-digit" }
                  )}
                </span>
              </div>
            </button>
          ))}
          {filteredThreads.length === 0 && (
            <div className="text-center py-10 text-neutral-500">
              No conversations found.
            </div>
          )}
        </div>
      </div>

      {/* Right Area: Chat View */}
      <div className="flex-1 flex flex-col rounded-2xl border border-white/10 bg-white/5 backdrop-blur-[2px] overflow-hidden shadow-2xl">
        {activeThread ? (
          <>
            {/* Active Header */}
            <div className="p-4 border-b border-white/10 bg-white/5 backdrop-blur-md flex justify-between items-center z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  {activeThread.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {activeThread.name}
                  </h2>
                  <div className="flex items-center gap-2 text-sm text-neutral-400">
                    <FiMail size={12} />
                    {activeThread.email}
                  </div>
                </div>
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
              {activeMessages.map((msg) => (
                <div
                  key={msg.id}
                  className="group flex flex-col gap-2 max-w-3xl"
                >
                  <div className="flex items-end gap-3">
                    {/* Message Bubble */}
                    <div
                      className={`p-4 rounded-2xl rounded-tl-none border backdrop-blur-sm transition-all ${
                        msg.status === "unread"
                          ? "bg-purple-500/10 border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.1)]"
                          : "bg-white/10 border-white/10"
                      }`}
                    >
                      <div className="flex justify-between items-start gap-4 mb-1">
                        <span className="text-xs font-semibold text-white/50">
                          {msg.subject || "No Subject"}
                        </span>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {msg.status !== "read" && (
                            <button
                              onClick={() => handleStatusUpdate(msg.id, "read")}
                              className="p-1 hover:bg-white/10 rounded text-neutral-400 hover:text-white"
                              title="Mark as Read"
                            >
                              <FiCheck size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(msg.id)}
                            className="p-1 hover:bg-red-500/20 rounded text-neutral-400 hover:text-red-400"
                            title="Delete Message"
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <p className="text-neutral-200 leading-relaxed whitespace-pre-wrap">
                        {msg.message}
                      </p>
                      <div className="mt-2 flex items-center justify-end gap-2 text-[10px] text-neutral-500">
                        <span>
                          {new Date(msg.created_at).toLocaleDateString()}{" "}
                          {new Date(msg.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {msg.status === "read" && (
                          <FiCheck size={12} className="text-green-500/50" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Input Area (Visual only for now, or for Notes) */}
            <div className="p-4 border-t border-white/10 bg-white/5 backdrop-blur-md">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Reply via email (coming soon)..."
                  disabled
                  className="w-full p-4 pr-12 rounded-xl bg-black/20 border border-white/10 text-neutral-500 cursor-not-allowed"
                />
                <button
                  disabled
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-white/5 text-neutral-600"
                >
                  <FiMessageSquare size={18} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-neutral-500">
            <FiMessageSquare size={48} className="mb-4 text-white/10" />
            <p>Select a conversation to view details</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageCenter;
