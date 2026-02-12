import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import PropTypes from "prop-types";
import * as HybridAuthService from "../services/HybridAuthService";
import { getToken } from "@/lib/neon"; // Optimistic check helper

const ProtectedRoute = ({ children }) => {
  // Optimistic Initial State: Assume authenticated if token exists
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!getToken());
  const [isLoading, setIsLoading] = useState(!getToken()); // Only load if NO token present
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Double-check with full validation (async)
        const authenticated = await HybridAuthService.isAuthenticated();

        // If validation fails but we optimistically allowed access, correct it now
        if (!authenticated && isAuthenticated) {
          console.warn("Optimistic auth failed. Redirecting...");
        }
        setIsAuthenticated(authenticated);
      } catch (error) {
        console.error("Auth check failed:", error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Instead, if loading, we render nothing (or the optimistic content if valid token)
  if (isLoading) {
    return null; // Render nothing during initial check if token missing
  }

  if (!isAuthenticated && !isLoading) {
    // Redirect to login with return URL
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return children;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ProtectedRoute;
