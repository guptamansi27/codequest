import { Routes, Route, useNavigate, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./styles/shared/toasts.css";

import LandingPage from "./pages/public/LandingPage";
import LoginPage from "./pages/public/LoginPage";
import RegisterPage from "./pages/public/RegisterPage";
import UserDashboard from "./pages/user/UserDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import SMEDashboard from "./pages/sme/SMEDashboard";
import ProtectedRoute from "./auth/ProtectedRoute";
import NotFoundPage from "./pages/public/NotFoundPage";
import useIdleLogout from "./hooks/useIdleLogout";

const AppContent = () => {
  const navigate = useNavigate();
  useIdleLogout();

  const handleLoginClick = () => {
    navigate("/login");
  };

  return (
    <>
      <Routes>
        <Route
          path="/"
          element={
            localStorage.getItem("access") ? (
              localStorage.getItem("role") === "admin" ? (
                <Navigate to="/admin" replace />
              ) : localStorage.getItem("role") === "sme" ? (
                <Navigate to="/sme" replace />
              ) : (
                <Navigate to="/user" replace />
              )
            ) : (
              <LandingPage onLoginClick={handleLoginClick} />
            )
          }
        />

        <Route
          path="/login"
          element={
            localStorage.getItem("access") ? (
              <Navigate to="/" replace />
            ) : (
              <LoginPage />
            )
          }
        />

        <Route
          path="/register"
          element={
            localStorage.getItem("access") ? (
              <Navigate to="/" replace />
            ) : (
              <RegisterPage />
            )
          }
        />

        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/sme/*"
          element={
            <ProtectedRoute allowedRoles={["sme"]}>
              <SMEDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/user/*"
          element={
            <ProtectedRoute allowedRoles={["user"]}>
              <UserDashboard />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss={false}
        draggable
        pauseOnHover
        theme="colored"
      />
    </>
  );
};

const App = () => {
  return <AppContent />;
};

export default App;
