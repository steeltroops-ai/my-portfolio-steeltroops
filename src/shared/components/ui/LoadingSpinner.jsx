const LoadingSpinner = ({ fullScreen = false, message = "Loading..." }) => {
  return (
    <div
      className={`
        flex items-center justify-center
        ${fullScreen ? "min-h-screen" : "w-full py-20"}
      `}
    >
      <div className="flex flex-col items-center space-y-4">
        {/* Simple purple spinner */}
        <div className="w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full animate-spin"></div>

        {/* Loading text */}
        {message && <p className="text-neutral-400 text-sm">{message}</p>}
      </div>
    </div>
  );
};

export default LoadingSpinner;
