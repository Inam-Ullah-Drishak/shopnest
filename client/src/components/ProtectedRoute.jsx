import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

// Replaces the same twelve-line useEffect that was copied into every guarded
// page. Those ran *after* the first render, so the page mounted, fired its
// fetch, and only then redirected -- a flash of admin chrome and a request
// certain to come back 403. Deciding during render means the page never
// mounts for someone who shouldn't see it.
function ProtectedRoute({ adminOnly = false, children }) {
  const { userInfo } = useAuth();
  const location = useLocation();

  if (!userInfo) {
    // Remember where they were headed so signing in can finish the journey
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Signed in but not staff: send them home, not to a login form they have
  // already completed
  if (adminOnly && !userInfo.isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;