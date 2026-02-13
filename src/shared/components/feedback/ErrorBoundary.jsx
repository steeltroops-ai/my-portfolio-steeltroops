import { Component } from "react";
import PropTypes from "prop-types";
import { motion, AnimatePresence } from "framer-motion";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";
import {
  RiRefreshLine,
  RiHome5Line,
  RiFileCopyLine,
  RiCheckLine,
} from "react-icons/ri";
import errorTracker from "@/utils/errorTracking";

class ErrorBoundary extends Component {
  // Error Classification System
  static ERROR_CATEGORIES = {
    HTTP_CLIENT: { color: "orange", label: "Client Error" },
    HTTP_SERVER: { color: "red", label: "Server Error" },
    RUNTIME: { color: "purple", label: "Runtime Error" },
    NETWORK: { color: "yellow", label: "Network Error" },
    AUTH: { color: "cyan", label: "Authentication Error" },
    DATA: { color: "pink", label: "Data Error" },
    UNKNOWN: { color: "neutral", label: "Unknown Error" },
  };

  static HTTP_STATUS_MESSAGES = {
    400: "Bad Request - Invalid data sent to server",
    401: "Unauthorized - Authentication required",
    403: "Forbidden - Access denied to this resource",
    404: "Not Found - The requested resource does not exist",
    500: "Internal Server Error - Something went wrong on our end",
    502: "Bad Gateway - Server communication failed",
    503: "Service Unavailable - Server is temporarily down",
  };

  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      copied: false,
      recoveryCount: 0,
      errorCategory: null,
      errorCode: null,
      errorMessage: null,
    };
    this.copyTimer = null;
  }

  // Classify and extract error information
  classifyError(error) {
    let code = null;
    let category = "UNKNOWN";
    let message = "An unexpected error occurred";

    // Check for HTTP status codes
    if (error.status || error.code) {
      code = error.status || error.code;

      if (code >= 400 && code < 500) {
        category = "HTTP_CLIENT";
        if (code === 401) category = "AUTH";
      } else if (code >= 500) {
        category = "HTTP_SERVER";
      }

      message =
        ErrorBoundary.HTTP_STATUS_MESSAGES[code] || `HTTP Error ${code}`;
    }
    // Check for JavaScript runtime errors
    else if (error.name) {
      switch (error.name) {
        case "ReferenceError":
          code = "REF_ERR";
          category = "RUNTIME";
          message = "Variable or function not found";
          break;
        case "TypeError":
          code = "TYPE_ERR";
          category = "RUNTIME";
          message = "Invalid data type or operation";
          break;
        case "SyntaxError":
          code = "SYNTAX_ERR";
          category = "RUNTIME";
          message = "Code syntax error detected";
          break;
        case "RangeError":
          code = "RANGE_ERR";
          category = "RUNTIME";
          message = "Value out of valid range";
          break;
        default:
          // Handle generic Error or unknown error types
          if (error.name === "Error") {
            code = "RUNTIME";
            category = "RUNTIME";
            message = error.message || "Runtime exception occurred";
          } else {
            // For custom error types, create a clean code
            const cleanName = error.name.replace(/Error$/i, "");
            code = cleanName ? cleanName.toUpperCase() : "RUNTIME";
            category = "RUNTIME";
            message = error.message || "Runtime exception occurred";
          }
      }
    }
    // Check for React-specific errors
    else if (error.message) {
      if (error.message.includes("hook")) {
        code = "HOOK_ERR";
        category = "RUNTIME";
        message = "React Hook rules violated";
      } else if (error.message.includes("render")) {
        code = "RENDER_ERR";
        category = "RUNTIME";
        message = "Component rendering failed";
      } else if (
        error.message.includes("network") ||
        error.message.includes("fetch")
      ) {
        code = "NET_ERR";
        category = "NETWORK";
        message = "Network connection failed";
      } else if (
        error.message.includes("auth") ||
        error.message.includes("token")
      ) {
        code = "AUTH_ERR";
        category = "AUTH";
        message = "Authentication failed";
      } else if (
        error.message.includes("JSON") ||
        error.message.includes("parse")
      ) {
        code = "DATA_ERR";
        category = "DATA";
        message = "Invalid data format received";
      } else {
        code = "RUNTIME_ERR";
        category = "RUNTIME";
        message = error.message;
      }
    }

    return { code, category, message };
  }

  static getDerivedStateFromError(error) {
    // Catch errors during the render phase for immediate UI response
    return {
      hasError: true,
      error: error,
    };
  }

  componentDidCatch(error, errorInfo) {
    // Secondary capture for lifecycle/async errors and logging
    console.error("Critical System Breach:", error, errorInfo);

    // Classify the error
    const { code, category, message } = this.classifyError(error);

    errorTracker.captureException(error, {
      componentStack: errorInfo.componentStack,
      isFatal: true,
      recovered: false,
      errorCode: code,
      errorCategory: category,
    });

    this.setState({
      errorInfo,
      errorCode: code,
      errorCategory: category,
      errorMessage: message,
    });
  }

  componentWillUnmount() {
    // Prevent memory leaks from the copy animation timer
    if (this.copyTimer) clearTimeout(this.copyTimer);
  }

  resetError = () => {
    // Attempt to recover without a full page reload if possible
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    });
  };

  handleRefresh = () => {
    if (this.state.recoveryCount === 0) {
      // First attempt: Instant Soft Reset
      this.setState((prev) => ({ recoveryCount: prev.recoveryCount + 1 }));
      this.resetError();
    } else {
      // Second attempt: Full System Reload
      window.location.reload();
    }
  };

  handleCopy = async () => {
    const errorMsg = this.state.error?.message || String(this.state.error);
    const stack =
      this.state.errorInfo?.componentStack || "No stack trace available.";
    const report = `SYSTEM ERROR REPORT\n${"-".repeat(20)}\nError: ${errorMsg}\n\nStack:\n${stack}`;

    try {
      await navigator.clipboard.writeText(report);
      this.setState({ copied: true });
      if (this.copyTimer) clearTimeout(this.copyTimer);
      this.copyTimer = setTimeout(() => this.setState({ copied: false }), 2000);
    } catch (err) {
      console.warn("Clipboard access denied:", err);
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          aria-live="assertive"
          className="overflow-x-hidden antialiased text-neutral-300 selection:bg-cyan-300 selection:text-cyan-900 min-h-screen relative"
        >
          {/* Background */}
          <div className="fixed top-0 w-full h-full -z-10">
            <div className="relative w-full h-full bg-black">
              <div className="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
              <div className="absolute left-0 right-0 top-[-10%] h-[1000px] w-[1000px] rounded-full bg-[radial-gradient(circle_400px_at_50%_300px,#fbfbfb36,#000)]"></div>
            </div>
          </div>

          {/* Content */}
          <div className="container px-4 sm:px-6 lg:px-8 mx-auto max-w-7xl min-h-screen flex flex-col items-center justify-center py-12 sm:py-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center space-y-8 sm:space-y-10 w-full max-w-2xl"
            >
              {/* Error Header */}
              <div className="space-y-3 sm:space-y-4">
                <motion.h1
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 100 }}
                  className="text-6xl sm:text-7xl md:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-purple-500 to-pink-400 leading-none"
                >
                  ERROR
                </motion.h1>
                {this.state.errorCode && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-3xl sm:text-4xl md:text-5xl font-mono font-black text-white/20 tracking-[0.15em] sm:tracking-[0.2em]"
                  >
                    {this.state.errorCode}
                  </motion.div>
                )}
              </div>

              {/* Message */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="space-y-3 sm:space-y-4 px-4"
              >
                <h2 className="text-xl sm:text-2xl md:text-3xl font-light text-white leading-tight">
                  {this.state.errorMessage || "Something went wrong"}
                </h2>
                <p className="text-sm sm:text-base text-neutral-400 max-w-md sm:max-w-lg mx-auto leading-relaxed">
                  {this.state.errorCategory === "HTTP_SERVER"
                    ? "Our servers encountered an issue. Please try again in a moment."
                    : this.state.errorCategory === "NETWORK"
                      ? "Unable to connect to the server. Please check your internet connection."
                      : this.state.errorCategory === "AUTH"
                        ? "Your session may have expired. Please try logging in again."
                        : "The application encountered an unexpected error. We've been notified and are looking into it."}
                </p>
              </motion.div>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center pt-4 w-full"
              >
                <button
                  onClick={this.handleRefresh}
                  className="group relative inline-flex items-center justify-center gap-2.5 w-full max-w-xs sm:w-48 py-2.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/50 hover:bg-purple-500/30 hover:border-purple-400/70 transition-all duration-300 backdrop-blur-md shadow-lg overflow-hidden"
                >
                  <RiRefreshLine className="w-4 h-4 group-hover:rotate-180 transition-transform duration-700 ease-in-out flex-shrink-0" />
                  <span className="text-sm font-medium tracking-wide whitespace-nowrap">
                    {this.state.recoveryCount > 0
                      ? "Hard Reload"
                      : "Refresh System"}
                  </span>
                </button>
                <button
                  onClick={() => (window.location.href = "/")}
                  className="group inline-flex items-center justify-center gap-2.5 w-full max-w-xs sm:w-48 py-2.5 rounded-full bg-neutral-800/50 text-neutral-300 border border-neutral-700/50 hover:bg-neutral-700/50 hover:border-neutral-600/50 transition-all duration-300 backdrop-blur-md"
                >
                  <RiHome5Line className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform duration-300 flex-shrink-0" />
                  <span className="text-sm font-medium tracking-wide whitespace-nowrap">
                    Return Base
                  </span>
                </button>
              </motion.div>

              {/* Error Details (Development Only) */}
              {this.state.error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="pt-8"
                >
                  <button
                    onClick={() =>
                      this.setState({ showDetails: !this.state.showDetails })
                    }
                    className="group inline-flex items-center gap-2 text-xs text-neutral-500 hover:text-neutral-300 transition-colors uppercase tracking-widest"
                  >
                    {this.state.showDetails ? (
                      <FiChevronUp />
                    ) : (
                      <FiChevronDown />
                    )}
                    {this.state.showDetails ? "Hide" : "Show"} Forensic Details
                  </button>

                  <AnimatePresence>
                    {this.state.showDetails && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-6 text-left px-2 sm:px-0"
                      >
                        <div className="relative rounded-2xl bg-neutral-900/50 border border-white/10 backdrop-blur-xl overflow-hidden group">
                          {/* Forensic Header - Sticky (Mac-style shallow height) */}
                          <div className="sticky top-0 z-30 flex items-center justify-between gap-2 py-2 px-2 sm:px-4 bg-neutral-900/90 backdrop-blur-xl border-b border-white/5">
                            <div className="flex items-center gap-2 sm:gap-2.5 overflow-hidden min-w-0">
                              <div className="flex gap-1.5 shrink-0">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/40" />
                                <div className="w-2.5 h-2.5 rounded-full bg-neutral-700/40" />
                                <div className="w-2.5 h-2.5 rounded-full bg-neutral-700/40" />
                              </div>
                              <span className="text-[9px] sm:text-[10px] font-mono text-red-400/80 font-medium truncate ml-1 sm:ml-2">
                                {this.state.error.message ||
                                  this.state.error.toString()}
                              </span>
                            </div>
                            <button
                              onClick={this.handleCopy}
                              className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-400 hover:text-white transition-all duration-200 shrink-0"
                            >
                              {this.state.copied ? (
                                <>
                                  <RiCheckLine className="w-3 h-3 text-green-400" />
                                  <span className="text-[9px] uppercase tracking-wider hidden sm:inline">
                                    Copied
                                  </span>
                                </>
                              ) : (
                                <>
                                  <RiFileCopyLine className="w-3 h-3" />
                                  <span className="text-[9px] uppercase tracking-wider hidden sm:inline">
                                    Copy
                                  </span>
                                </>
                              )}
                            </button>
                          </div>

                          {/* Forensic Body - Scrollable */}
                          <div className="relative max-h-[45vh] overflow-y-auto overflow-x-hidden">
                            <div className="absolute inset-0 bg-red-500/[0.01] pointer-events-none" />

                            {/* Current Trace Section */}
                            <div className="p-3 sm:p-6 pt-3 sm:pt-4 space-y-3 sm:space-y-4">
                              <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                                <span className="text-[10px] uppercase tracking-tighter text-red-400/60 font-bold">
                                  Current Trace
                                </span>
                              </div>
                              <div className="font-mono text-[10px] sm:text-xs text-neutral-500 whitespace-pre-wrap break-words leading-relaxed bg-red-500/5 p-3 sm:p-4 rounded-xl border border-red-500/10 overflow-hidden">
                                {this.state.errorInfo?.componentStack ||
                                  "No component stack available."}
                              </div>

                              {/* Historical Events (Session Log) */}
                              {errorTracker.getErrors().length > 1 && (
                                <div className="space-y-3 pt-4">
                                  <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                                    <span className="text-[10px] uppercase tracking-tighter text-neutral-500 font-bold">
                                      Session Event Log
                                    </span>
                                  </div>
                                  <div className="space-y-2">
                                    {errorTracker
                                      .getErrors()
                                      .map((err, idx) => (
                                        <div
                                          key={idx}
                                          className="flex gap-3 text-[9px] sm:text-[10px] font-mono leading-tight border-l border-white/5 pl-3 py-1"
                                        >
                                          <span className="text-neutral-600 shrink-0">
                                            [
                                            {new Date(
                                              err.timestamp
                                            ).toLocaleTimeString([], {
                                              hour12: false,
                                            })}
                                            ]
                                          </span>
                                          <span className="text-neutral-400 shrink-0 uppercase">
                                            [{err.type}]
                                          </span>
                                          <span className="text-neutral-500 truncate">
                                            {err.message}
                                          </span>
                                        </div>
                                      ))}
                                  </div>
                                </div>
                              )}

                              {/* Debug Context */}
                              <div className="pt-6 border-t border-white/5 space-y-1.5 opacity-50">
                                <div className="flex justify-between text-[8px] sm:text-[9px] font-mono uppercase tracking-widest text-neutral-500">
                                  <span>System Identity</span>
                                  <span>{new Date().toISOString()}</span>
                                </div>
                                <div className="text-[8px] sm:text-[9px] font-mono text-neutral-600 truncate">
                                  PATH: {window.location.pathname}
                                  {window.location.search}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </motion.div>

            {/* Decorative Footer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              transition={{ delay: 1 }}
              className="absolute bottom-4 sm:bottom-8 text-center text-[10px] uppercase tracking-widest text-neutral-600 px-4"
            >
              Critical system failure contained. Integrity stabilized.
            </motion.div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ErrorBoundary;
