import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const accessToken = localStorage.getItem("access");
  const role = localStorage.getItem("role")?.toLowerCase();
  const normalizedAllowedRoles = allowedRoles.map((allowedRole) => allowedRole.toLowerCase());

  if (!accessToken || !role) {
    return <Navigate to="/login" replace />;
  }

  if (!normalizedAllowedRoles.includes(role)) {
    if (role === "admin") {
      return <Navigate to="/admin" replace />;
    }
    if (role === "sme") {
      return <Navigate to="/sme" replace />;
    }
    if (role === "user") {
      return <Navigate to="/user" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
