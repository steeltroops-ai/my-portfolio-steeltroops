import { useState, useEffect } from 'react';

const ProductionDebug = () => {
  const [debugInfo, setDebugInfo] = useState({});
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show in production for debugging
    if (import.meta.env.PROD) {
      setDebugInfo({
        mode: import.meta.env.MODE,
        prod: import.meta.env.PROD,
        dev: import.meta.env.DEV,
        baseUrl: import.meta.env.BASE_URL,
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        supabaseUrl: import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Not Set',
        supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Not Set',
      });
    }
  }, []);

  // Show debug info when pressing Ctrl+Shift+D
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setIsVisible(!isVisible);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isVisible]);

  if (!import.meta.env.PROD || !isVisible) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 bg-black/90 text-white p-4 rounded-lg text-xs max-w-md">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-cyan-400">Production Debug Info</h3>
        <button 
          onClick={() => setIsVisible(false)}
          className="text-red-400 hover:text-red-300"
        >
          ✕
        </button>
      </div>
      <div className="space-y-1">
        {Object.entries(debugInfo).map(([key, value]) => (
          <div key={key} className="flex justify-between">
            <span className="text-neutral-400">{key}:</span>
            <span className="text-white ml-2">{String(value)}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 text-xs text-neutral-500">
        Press Ctrl+Shift+D to toggle
      </div>
    </div>
  );
};

export default ProductionDebug;
