import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Code2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
} from "lucide-react";
import api from "../../api/axiosInstance";
import { notify } from "../../utils/notifications";
import { validateEmail, validateLoginPassword } from "../../validators/loginValidation";
import "../../styles/public/LoginPage.css";

const LoginPage = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedEmail = email.trim();
    const nextErrors = {};

    if (!validateEmail(trimmedEmail)) {
      nextErrors.email = "Enter a valid email address.";
      notify.validation("Enter a valid email address.", undefined, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }

    if (!validateLoginPassword(password)) {
      nextErrors.password = "Password is required.";
      notify.validation(
        "Password is required.",
        undefined,
        {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        }
      );
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post("/auth/login/", { email: trimmedEmail, password });

      localStorage.setItem("access", response.data.access);
      localStorage.setItem("refresh", response.data.refresh);
      localStorage.setItem("email", response.data.email || trimmedEmail);
      localStorage.setItem("fullName", response.data.full_name || "");
      const role = (response.data.role || "USER").toLowerCase();
      localStorage.setItem("role", role);

      setIsLoading(false);

      if (response.status == 200) {
        notify.success(`Login successful. Welcome back, ${role.toUpperCase()}!`, {
          position: "top-right",
          autoClose: 3000,
        });

        if (role === "admin") {
          navigate("/admin");
        } else if (role === "sme") {
          navigate("/sme");
        } else {
          navigate("/user");
        }
        setEmail("");
        setPassword("");
      }
    } catch (error) {
      notify.apiError(error, "Invalid email or password.", {
        position: "top-right",
        autoClose: 5000,
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page login-page--modern">
      <div className="login-page-bg" aria-hidden="true" />
      <div className="login-shell">
        <aside className="login-brand" aria-hidden="true">
          <div className="login-brand-topline">
            <div className="login-brand-mark">
              <Code2 size={28} strokeWidth={2.2} />
            </div>
            <span>CodeQuest</span>
          </div>
          <div className="login-brand-copyblock">
            <p className="login-eyebrow">Secure workspace access</p>
            <h2 className="login-brand-title">Welcome to your workspace.</h2>
            <p className="login-brand-copy">Sign in with your credentials to continue.</p>
          </div>
          <ul className="login-brand-points">
            <li>Continue coding challenges</li>
            <li>Track learning progress</li>
            <li>Access role-based dashboards</li>
          </ul>
          <p className="login-brand-note">Role-based access for CodeQuest users.</p>
        </aside>

        <div className="login-card-wrap">
          <div className="login-card">
            <div className="login-card-header">
              <span className="login-badge">
                <LockKeyhole size={13} />
                Secure CodeQuest login
              </span>
              <h1>Welcome back</h1>
              <p>Your workspace is one step away.</p>
            </div>

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <div className="input-field">
                  <Mail aria-hidden="true" />
                  <input
                    type="email"
                    id="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrors((current) => ({ ...current, email: "" }));
                    }}
                    aria-invalid={Boolean(errors.email)}
                    required
                  />
                </div>
                {errors.email ? <p className="auth-field-error">{errors.email}</p> : null}
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="input-field password-field">
                  <LockKeyhole aria-hidden="true" />
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrors((current) => ({ ...current, password: "" }));
                    }}
                    aria-invalid={Boolean(errors.password)}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
                {errors.password ? <p className="auth-field-error">{errors.password}</p> : null}
              </div>

              <button
                type="submit"
                className={`login-btn ${isLoading ? "loading" : ""}`}
                disabled={!email || !password || isLoading}
              >
                <span>{isLoading ? "Signing in" : "Continue"}</span>
                {!isLoading ? <ArrowRight size={18} aria-hidden="true" /> : null}
                {isLoading ? <span className="login-btn-spinner" aria-hidden="true" /> : null}
              </button>
              <p className="auth-switch-copy">
                New to CodeQuest? <Link to="/register">Create an Account</Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
