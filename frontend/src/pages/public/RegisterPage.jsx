import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Code2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  UserRound,
} from "lucide-react";
import api from "../../api/axiosInstance";
import { notify } from "../../utils/notifications";
import { validateEmail } from "../../validators/loginValidation";
import "../../styles/public/LoginPage.css";

const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

const RegisterPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const isSubmitDisabled = useMemo(
    () => isLoading || !form.fullName || !form.email || !form.password || !form.confirmPassword,
    [form, isLoading],
  );

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.fullName.trim()) nextErrors.fullName = "Full name is required.";
    if (!validateEmail(form.email)) nextErrors.email = "Enter a valid email address.";
    if (!form.password) {
      nextErrors.password = "Password is required.";
    } else if (!passwordPattern.test(form.password)) {
      nextErrors.password = "Use 8+ characters with uppercase, lowercase, number, and special character.";
    }
    if (form.confirmPassword !== form.password) nextErrors.confirmPassword = "Passwords must match.";
    return nextErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      notify.validation(Object.values(nextErrors)[0]);
      return;
    }

    setIsLoading(true);
    try {
      await api.post("/auth/register", {
        full_name: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password,
        confirm_password: form.confirmPassword,
      });
      notify.success("Registration successful. Please log in.");
      navigate("/login");
    } catch (error) {
      notify.apiError(error, "Registration could not be completed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page login-page--modern auth-page--register">
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
            <p className="login-eyebrow">Create your workspace</p>
            <h2 className="login-brand-title">Start building momentum.</h2>
            <p className="login-brand-copy">Register with your email and continue into guided coding challenges.</p>
          </div>
          <ul className="login-brand-points">
            <li>Practice HTML, CSS, JavaScript, and React</li>
            <li>Build a personal progress trail</li>
            <li>Access learner tools instantly</li>
          </ul>
          <p className="login-brand-note">New accounts start with learner access.</p>
        </aside>

        <div className="login-card-wrap">
          <div className="login-card">
            <div className="login-card-header">
              <span className="login-badge">
                <LockKeyhole size={13} />
                Secure registration
              </span>
              <h1>Create account</h1>
              <p>Use your details to join CodeQuest.</p>
            </div>

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="full-name">Full Name</label>
                <div className="input-field">
                  <UserRound aria-hidden="true" />
                  <input
                    type="text"
                    id="full-name"
                    autoComplete="name"
                    placeholder="Your full name"
                    value={form.fullName}
                    onChange={(event) => updateField("fullName", event.target.value)}
                    aria-invalid={Boolean(errors.fullName)}
                    required
                  />
                </div>
                {errors.fullName ? <p className="auth-field-error">{errors.fullName}</p> : null}
              </div>

              <div className="form-group">
                <label htmlFor="register-email">Email</label>
                <div className="input-field">
                  <Mail aria-hidden="true" />
                  <input
                    type="email"
                    id="register-email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={(event) => updateField("email", event.target.value)}
                    aria-invalid={Boolean(errors.email)}
                    required
                  />
                </div>
                {errors.email ? <p className="auth-field-error">{errors.email}</p> : null}
              </div>

              <div className="form-group">
                <label htmlFor="register-password">Password</label>
                <div className="input-field password-field">
                  <LockKeyhole aria-hidden="true" />
                  <input
                    type={showPassword ? "text" : "password"}
                    id="register-password"
                    autoComplete="new-password"
                    placeholder="Create a strong password"
                    value={form.password}
                    onChange={(event) => updateField("password", event.target.value)}
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

              <div className="form-group">
                <label htmlFor="confirm-password">Confirm Password</label>
                <div className="input-field password-field">
                  <LockKeyhole aria-hidden="true" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirm-password"
                    autoComplete="new-password"
                    placeholder="Repeat your password"
                    value={form.confirmPassword}
                    onChange={(event) => updateField("confirmPassword", event.target.value)}
                    aria-invalid={Boolean(errors.confirmPassword)}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword((value) => !value)}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    title={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
                {errors.confirmPassword ? <p className="auth-field-error">{errors.confirmPassword}</p> : null}
              </div>

              <button type="submit" className={`login-btn ${isLoading ? "loading" : ""}`} disabled={isSubmitDisabled}>
                <span>{isLoading ? "Creating account" : "Create account"}</span>
                {!isLoading ? <ArrowRight size={18} aria-hidden="true" /> : null}
                {isLoading ? <span className="login-btn-spinner" aria-hidden="true" /> : null}
              </button>

              <p className="auth-switch-copy">
                Already have an account? <Link to="/login">Login</Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
