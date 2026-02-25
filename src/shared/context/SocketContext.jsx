import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import { io } from "socket.io-client";

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined || context === null) {
    // Return a safe fallback to prevent destructuring crashes
    return {
      socket: null,
      isConnected: false,
      isAuthorized: false,
      emit: () => {},
    };
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const socketRef = useRef(null);
  const reconnectAttempts = useRef(0);

  useEffect(() => {
    // Prevent double connection in Strict Mode
    if (socketRef.current) return;

    // Leverage the Vite proxy in development (connect to same origin)
    const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;

    const newSocket = io(socketUrl, {
      reconnectionAttempts: 20,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    socketRef.current = newSocket;

    newSocket.on("connect", () => {
      console.log("  [Pulse] Intelligence Uplink Active");
      setIsConnected(true);
      setIsAuthorized(true);
      reconnectAttempts.current = 0;
    });

    newSocket.on("disconnect", (reason) => {
      console.log(`  [Pulse] Uplink Severed: ${reason}`);
      setIsConnected(false);
      setIsAuthorized(false);
    });

    newSocket.on("connect_error", (error) => {
      console.warn("  [Pulse] Connection Auth Failure:", error.message);
      setIsConnected(false);
      setIsAuthorized(false);
    });

    setSocket(newSocket);

    return () => {
      // Small timeout or check to prevent "closed before established" error in Dev
      if (socketRef.current) {
        const s = socketRef.current;
        socketRef.current = null;
        // In Socket.io 4.x, calling disconnect on a connecting socket is safe,
        // but can trigger warnings in some browser/proxy setups.
        // Only disconnect if fully connected to avoid "closed before established" error
        if (s.connected) {
          s.disconnect();
        }
      }
    };
  }, []);

  // Helper function to emit events
  const emit = (event, data) => {
    if (socket && isConnected) {
      socket.emit(event, data);
    }
  };

  const value = {
    socket,
    isConnected,
    isAuthorized,
    emit,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};
