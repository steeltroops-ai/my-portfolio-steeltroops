import { Component } from "react";
import PropTypes from "prop-types";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiHome,
  FiRefreshCw,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";
import errorTracker from "@/utils/errorTracking";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(_error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);

    errorTracker.captureException(error, {
      errorBoundary: true,
      componentStack: errorInfo.componentStack,
      errorInfo: errorInfo,
    });

    this.setState({
      error: error,
      errorInfo: errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="overflow-x-hidden antialiased text-neutral-300 selection:bg-cyan-300 selection:text-cyan-900 min-h-screen relative">
          {/* Background */}
          <div className="fixed top-0 w-full h-full -z-10">
            <div className="relative w-full h-full bg-black">
              <div className="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
              <div className="absolute left-0 right-0 top-[-10%] h-[1000px] w-[1000px] rounded-full bg-[radial-gradient(circle_400px_at_50%_300px,#fbfbfb36,#000)]"></div>
            </div>
          </div>

          {/* Content */}
          <div className="container px-4 sm:px-6 lg:px-8 mx-auto max-w-7xl min-h-screen flex flex-col items-center justify-center py-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center space-y-8 w-full max-w-2xl"
            >
              {/* Error Header */}
              <motion.h1
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 100 }}
                className="text-7xl sm:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-purple-500 to-pink-400"
              >
                ERROR
              </motion.h1>

              {/* Message */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="space-y-3 px-4"
              >
                <h2 className="text-2xl sm:text-3xl font-light text-white">
                  Something went wrong
                </h2>
                <p className="text-neutral-400 max-w-md mx-auto leading-relaxed">
                  The application encountered an unexpected glitch. We've been
                  notified and are looking into it.
                </p>
              </motion.div>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-col sm:flex-row gap-4 justify-center pt-4"
              >
                <button
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/50 hover:bg-purple-500/30 hover:border-purple-400/70 transition-all duration-300 backdrop-blur-md shadow-lg"
                >
                  <FiRefreshCw className="w-4 h-4" />
                  Refresh System
                </button>
                <button
                  onClick={() => (window.location.href = "/")}
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-neutral-800/50 text-neutral-300 border border-neutral-700/50 hover:bg-neutral-700/50 hover:border-neutral-600/50 transition-all duration-300 backdrop-blur-md"
                >
                  <FiHome className="w-4 h-4" />
                  Return Base
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
                        className="mt-6 text-left"
                      >
                        <div className="relative p-6 rounded-2xl bg-neutral-900/50 border border-white/10 backdrop-blur-xl overflow-hidden group">
                          <div className="absolute inset-0 bg-red-500/[0.02] pointer-events-none" />
                          <div className="relative font-mono text-[10px] sm:text-xs space-y-4 max-h-[40vh] overflow-y-auto custom-scrollbar">
                            <div className="text-red-400/90 font-bold border-b border-red-900/30 pb-2">
                              {this.state.error.toString()}
                            </div>
                            <div className="text-neutral-500 whitespace-pre-wrap leading-relaxed">
                              {this.state.errorInfo?.componentStack}
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
              className="absolute bottom-8 text-center text-[10px] uppercase tracking-widest text-neutral-600 px-4"
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
