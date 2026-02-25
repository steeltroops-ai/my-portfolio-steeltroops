import { useState, useMemo, useRef, useEffect, memo } from "react";
import {
  FiMail,
  FiCheck,
  FiTrash2,
  FiSearch,
  FiCalendar,
  FiMessageSquare,
  FiUser,
  FiInbox,
  FiCheckCircle,
  FiPlus,
  FiSend,
  FiLoader,
  FiChevronLeft,
  FiMoreVertical,
  FiMenu,
  FiFilter,
} from "react-icons/fi";
import { useAdmin } from "../context/AdminContext";
import { useContactMessages } from "../hooks/useContactMessages";
import { useUpdateMessageStatus } from "../hooks/useContactMessages";
import { useDeleteMessage } from "../hooks/useContactMessages";
import { useReplyMessage } from "../hooks/useContactMessages";
import { toast } from "react-hot-toast";

const MessageCenter = () => {
  const { isSidebarCollapsed, setIsSidebarCollapsed } = useAdmin();
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const chatEndRef = useRef(null);
  const parentRef = useRef(null);

  const [showSearch, setShowSearch] = useState(false);
  const searchInputRef = useRef(null);
  const [replyDepth, setReplyDepth] = useState(1); // 1 or 2 messages context

  // Focus input when search is opened
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  const { data, isLoading, isFetching, error, refetch } = useContactMessages();
  const updateStatusMutation = useUpdateMessageStatus();
  const deleteMessageMutation = useDeleteMessage();
  const replyMutation = useReplyMessage();
  const [replyText, setReplyText] = useState("");
  const textareaRef = useRef(null);

  useEffect(() => {
    refetch();
  }, [refetch]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + "px";
    }
  }, [replyText]);

  const messages = data?.data || [];

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
    const matchesSearch =
      thread.name.toLowerCase().includes(searchLower) ||
      thread.email.toLowerCase().includes(searchLower) ||
      thread.messages.some((m) =>
        m.message.toLowerCase().includes(searchLower)
      );

    const matchesFilter =
      filterType === "all" ||
      (filterType === "unread" && thread.unreadCount > 0);

    return matchesSearch && matchesFilter;
  });

  // Select first thread by default on Desktop
  useEffect(() => {
    const handleInitialSelection = () => {
      if (
        window.innerWidth >= 1024 &&
        !selectedEmail &&
        filteredThreads.length > 0 &&
        !isLoading
      ) {
        setSelectedEmail(filteredThreads[0].email);
      }
    };
    handleInitialSelection();
  }, [filteredThreads, isLoading, selectedEmail]);

  const activeThread = threads.find((t) => t.email === selectedEmail);

  // Sort for chat view (oldest to newest)
  const activeMessages = activeThread
    ? [...activeThread.messages].sort(
        (a, b) => new Date(a.created_at) - new Date(b.created_at)
      )
    : [];

  // Scroll to bottom of chat when messages change
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeMessages]);

  const handleStatusUpdate = async (id, status) => {
    try {
      await updateStatusMutation.mutateAsync({ id, action: status });
      toast.success(`Message marked as ${status}`);
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error("Failed to update status");
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

  const handleMarkAllRead = async () => {
    if (!activeThread) return;
    const unreadMessages = activeThread.messages.filter(
      (m) => m.status === "unread"
    );
    for (const msg of unreadMessages) {
      await updateStatusMutation.mutateAsync({ id: msg.id, action: "read" });
    }
    toast.success("All messages marked as read");
  };

  const handleOpenEmailClient = async () => {
    if (!activeThread) return;
    if (!replyText.trim()) return;

    try {
      // Get messages context (1 or 2)
      const contextMessages = activeThread.messages.slice(0, replyDepth);
      const subject = activeThread.messages[0]?.subject || "Reply";

      // Save reply to database first
      await replyMutation.mutateAsync({
        toEmail: activeThread.email,
        subject,
        replyMessage: replyText,
        previousMessages: contextMessages,
      });

      // Prepare email body with context
      let body = `${replyText}\n\n`;

      if (contextMessages.length > 0) {
        body += `-----------------------------------\n`;
        body += `Original Conversation:\n\n`;

        contextMessages.forEach((msg) => {
          const date = new Date(msg.created_at).toLocaleString();
          body += `On ${date}, ${msg.name || "User"} wrote:\n`;
          body += `> ${msg.message.replace(/\n/g, "\n> ")}\n\n`;
        });
      }

      const mailtoLink = `mailto:${activeThread.email}?subject=${encodeURIComponent(
        "Re: " + subject
      )}&body=${encodeURIComponent(body)}`;

      window.open(mailtoLink, "_blank");
      setReplyText("");
      toast.success("Reply saved and email client opened!");
    } catch (error) {
      console.error("Failed to save reply:", error);
      toast.error("Failed to save reply");
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !activeThread) return;

    try {
      // Get last 2 messages for context
      const previousMessages = activeThread.messages.slice(0, 2);
      const subject = activeThread.messages[0]?.subject || "Reply";

      await replyMutation.mutateAsync({
        toEmail: activeThread.email,
        subject,
        replyMessage: replyText,
        previousMessages,
      });

      setReplyText("");
      toast.success("Reply sent successfully");
    } catch (error) {
      console.error("Failed to send reply:", error);
      toast.error("Failed to send reply");
    }
  };

  // Stats (removed from UI, keeping calculation if needed later or removing if unused)
  // const totalMessages = messages.length;
  // const unreadMessages = messages.filter((m) => m.status === "unread").length;
  // const totalConversations = threads.length;

  if (isLoading) {
    return (
      <div className="flex h-screen bg-transparent animate-in fade-in duration-500">
        <div className="w-[380px] border-r border-white/10 bg-white/5 space-y-4 p-6">
          <div className="h-8 w-32 bg-white/5 rounded animate-pulse" />
          <div className="h-10 w-full bg-white/5 rounded-lg animate-pulse" />
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex gap-3 py-3">
              <div className="w-10 h-10 rounded-full bg-white/5 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-24 bg-white/5 rounded" />
                <div className="h-3 w-full bg-white/5 rounded" />
              </div>
            </div>
          ))}
        </div>
        <div className="flex-1 flex flex-col p-8 space-y-6">
          <div className="h-[60px] w-full bg-white/5 rounded-xl animate-pulse" />
          <div className="flex-1 bg-white/[0.02] rounded-2xl animate-pulse" />
          <div className="h-[80px] w-full bg-white/5 rounded-xl animate-pulse" />
        </div>
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
    <div className="flex h-full overflow-hidden bg-transparent relative">
      {/* Left Sidebar: Compact Contact List */}
      <div
        className={`
        ${selectedEmail ? "hidden xl:flex" : "flex"} 
        w-full xl:w-[380px] flex-col border-r border-white/10 shrink-0 bg-white/5 backdrop-blur-[2px] z-20
      `}
      >
        {/* Header & Search */}
        <div className="p-6 sticky top-0 z-10 bg-transparent backdrop-blur-md border-b border-white/10">
          <div className="flex justify-between items-start mb-0">
            <div>
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={() => setIsSidebarCollapsed(false)}
                  className="xl:hidden p-1 -ml-1 text-neutral-400 hover:text-white transition-colors"
                >
                  <FiMenu size={20} />
                </button>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Messages
                </h2>
                {isFetching && !isLoading && (
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-bold animate-pulse">
                    <FiLoader className="animate-spin" size={10} />
                    Syncing
                  </span>
                )}
              </div>
              <p className="text-neutral-400 text-xs mt-1">
                Recent conversations
              </p>
            </div>
            <div className="flex gap-1 bg-black/20 p-1 rounded-lg backdrop-blur-md border border-white/5 mt-1">
              <button
                onClick={() => {
                  setShowSearch(!showSearch);
                  if (!showSearch) setSearchTerm("");
                }}
                className={`p-1.5 rounded-md transition-all ${
                  showSearch
                    ? "bg-white/10 text-white shadow-sm"
                    : "text-neutral-400 hover:text-white hover:bg-white/5"
                }`}
                title="Search"
              >
                <FiSearch size={16} />
              </button>
              <div className="w-px bg-white/10 mx-0.5 my-1"></div>
              <button
                onClick={() => setFilterType("all")}
                className={`p-1.5 rounded-md transition-all ${
                  filterType === "all"
                    ? "bg-white/10 text-white shadow-sm"
                    : "text-neutral-400 hover:text-white hover:bg-white/5"
                }`}
                title="All Messages"
              >
                <FiMessageSquare size={16} />
              </button>
              <button
                onClick={() => setFilterType("unread")}
                className={`p-1.5 rounded-md transition-all ${
                  filterType === "unread"
                    ? "bg-white/10 text-white shadow-sm"
                    : "text-neutral-400 hover:text-white hover:bg-white/5"
                }`}
                title="Unread Messages"
              >
                <FiInbox size={16} />
              </button>
            </div>
          </div>

          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              showSearch
                ? "max-h-16 opacity-100 mt-4"
                : "max-h-0 opacity-0 mt-0"
            }`}
          >
            <div className="relative">
              <FiSearch
                size={16}
                className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-neutral-500 group-focus-within:text-white transition-colors pointer-events-none z-10"
              />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-white/10 bg-black/20 focus:bg-black/40 focus:border-purple-500/50 text-white placeholder:text-neutral-500 text-sm focus:outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Contact List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filteredThreads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-neutral-500">
              <p className="text-sm">No conversations found</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {filteredThreads.map((thread) => {
                const isActive = selectedEmail === thread.email;
                const lastMsgDate = new Date(thread.lastMessage.created_at);
                const dateStr = lastMsgDate.toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                });

                return (
                  <button
                    key={thread.email}
                    onClick={() => setSelectedEmail(thread.email)}
                    className={`w-full text-left px-4 py-3 hover:bg-white/10 transition-colors border-r-2 ${
                      isActive
                        ? "bg-white/10 border-purple-500"
                        : "border-transparent"
                    }`}
                  >
                    <div className="flex gap-3">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neutral-700 to-neutral-800 flex items-center justify-center shrink-0 border border-white/10 overflow-hidden">
                        <span className="text-sm font-medium text-white/80">
                          {thread.name.charAt(0).toUpperCase()}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-0.5">
                          <span className="font-bold text-white text-[15px] truncate mr-2">
                            {thread.name}
                          </span>
                          <span className="text-xs text-neutral-500 whitespace-nowrap">
                            {dateStr}
                          </span>
                        </div>
                        <p
                          className={`text-[13px] truncate leading-tight ${
                            thread.unreadCount > 0
                              ? "text-white font-medium"
                              : "text-neutral-500"
                          }`}
                        >
                          {thread.lastMessage.message}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Chat Window */}
      <div
        className={`
        ${!selectedEmail ? "hidden xl:flex" : "flex"} 
        flex-1 flex flex-col min-w-0 bg-transparent relative z-10
      `}
      >
        {activeThread ? (
          <>
            {/* Chat Header */}
            <div className="h-[60px] px-4 sm:px-6 border-b border-white/10 flex items-center justify-between backdrop-blur-[10px] bg-black/20 z-10 sticky top-0">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                {/* Back button for mobile */}
                <button
                  onClick={() => setSelectedEmail(null)}
                  className="xl:hidden p-2 -ml-2 text-neutral-400 hover:text-white transition-colors"
                >
                  <FiChevronLeft size={20} />
                </button>

                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-neutral-700 to-neutral-800 flex items-center justify-center border border-white/10 shrink-0">
                  <span className="text-xs sm:text-sm font-medium text-white/80">
                    {activeThread.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-white text-base sm:text-lg truncate block">
                    {activeThread.name}
                  </span>
                  <span className="text-[10px] text-neutral-500 truncate block lg:hidden">
                    {activeThread.email}
                  </span>
                </div>
              </div>
              <div className="text-neutral-400">
                {/* Info icon wrapper */}
                <div className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center cursor-pointer transition-colors">
                  <span className="font-bold text-lg">i</span>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div
              className="flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col bg-transparent"
              data-lenis-prevent
            >
              {/* Profile Hero Section */}
              <div className="flex flex-col items-center py-6 sm:py-8 border-b border-white/5 mb-6 hover:bg-white/[0.02] transition-colors cursor-pointer rounded-xl px-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-neutral-700 to-neutral-800 flex items-center justify-center text-xl sm:text-2xl font-medium text-white/80 mb-2 border border-white/10">
                  {activeThread.name.charAt(0).toUpperCase()}
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white text-center">
                  {activeThread.name}
                </h3>
                <p className="text-neutral-500 text-xs sm:text-sm mb-1 text-center truncate w-full">
                  {activeThread.email}
                </p>
                <p className="text-neutral-600 text-[10px] sm:text-xs mb-4">
                  Joined{" "}
                  {new Date(
                    activeThread.messages[0].created_at
                  ).toLocaleDateString()}
                </p>

                <button className="px-4 py-1.5 rounded-full bg-white/10 border border-white/10 text-white font-bold text-xs sm:text-sm hover:bg-white/20 transition-colors backdrop-blur-sm">
                  View Profile
                </button>
              </div>

              {/* Message Bubbles */}
              <div className="flex-1 space-y-1">
                {" "}
                {/* Reduced generic spacing, grouped visually */}
                {activeMessages.map((msg, idx) => {
                  // Determine if this is "my" message (for now assumes all are received, so left aligned)
                  // In a real app we'd check msg.sender === 'me'
                  const isMe = false; // Placeholder

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? "items-end" : "items-start"} mb-4`}
                    >
                      {/* Message Bubble */}
                      <div
                        className={`
                         max-w-[85%] sm:max-w-[70%] px-3 sm:px-4 py-2 sm:py-3 text-[14px] sm:text-[15px] leading-relaxed break-words whitespace-pre-wrap shadow-sm backdrop-blur-sm
                         ${
                           isMe
                             ? "bg-purple-600/80 text-white rounded-2xl rounded-tr-sm border border-purple-500/30"
                             : "bg-white/10 text-white rounded-2xl rounded-tl-sm border border-white/5"
                         }
                      `}
                      >
                        {msg.message}
                      </div>

                      {/* Timestamp & Meta */}
                      <div className="px-2 mt-1 flex gap-2 items-center">
                        <span className="text-[11px] text-neutral-500">
                          {new Date(msg.created_at).toLocaleTimeString([], {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                          {msg.status !== "read" && (
                            <span className="text-purple-400 ml-1">• New</span>
                          )}
                        </span>
                        {/* Action Buttons (Hover only) */}
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleDelete(msg.id)}
                            className="text-neutral-600 hover:text-red-400 p-1"
                          >
                            <FiTrash2 size={12} />
                          </button>
                          {msg.status !== "read" && (
                            <button
                              onClick={() => handleStatusUpdate(msg.id, "read")}
                              className="text-neutral-600 hover:text-green-400 p-1"
                            >
                              <FiCheck size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-white/10 bg-white/[0.02] backdrop-blur-[2px]">
              <div className="flex items-center gap-3 bg-white/5 backdrop-blur-[2px] p-2 rounded-[24px] border border-white/5 focus-within:border-purple-500/30 transition-all duration-200">
                {/* Media Icons */}
                <div className="flex items-center gap-1 pl-1">
                  <button
                    onClick={() => setReplyDepth((d) => (d === 1 ? 2 : 1))}
                    className={`p-2 rounded-full transition-all duration-200 flex items-center justify-center ${
                      replyDepth === 2
                        ? "bg-purple-500/20 text-purple-400"
                        : "text-neutral-400 hover:text-white hover:bg-white/5"
                    }`}
                    title={`Include last ${replyDepth} message(s) in reply context`}
                  >
                    <FiPlus size={20} />
                  </button>
                </div>

                {/* Input Field */}
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleOpenEmailClient();
                    }
                  }}
                  placeholder={
                    window.innerWidth < 640
                      ? "Type reply..."
                      : `Type your reply... (Including ${replyDepth === 1 ? "last message" : "last 2 messages"} as context)`
                  }
                  className="flex-1 bg-transparent border-none focus:ring-0 outline-none focus:outline-none text-white placeholder:text-neutral-500 px-2 py-1.5 text-sm resize-none max-h-32 overflow-y-auto scrollbar-none"
                  style={{ minHeight: "24px" }}
                />

                {/* Emoji / Send */}
                <div className="flex items-center gap-1 pr-2">
                  <button
                    onClick={handleOpenEmailClient}
                    className="p-2 rounded-full text-purple-400 hover:bg-purple-500/10 transition-colors disabled:opacity-50"
                    disabled={!replyText.trim()}
                    title="Open Email Client"
                  >
                    <FiSend size={18} />
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-neutral-500">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
              <FiMail size={40} className="text-neutral-600" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Select a message
            </h2>
            <p className="text-neutral-400 max-w-sm text-center">
              Choose from your existing conversations, start a new one, or just
              keep swimming.
            </p>
            <button className="mt-8 px-6 py-3 rounded-full bg-purple-600 text-white font-bold hover:bg-purple-700 transition-colors shadow-lg shadow-purple-600/20">
              New Message
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageCenter;
