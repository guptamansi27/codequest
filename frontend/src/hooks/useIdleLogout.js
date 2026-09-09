import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { notify } from "../utils/notifications";

const IDLE_LIMIT_MS = 10 * 60 * 1000;
const ACTIVITY_EVENTS = ["mousemove", "keydown", "scroll", "click", "pointerdown", "touchstart"];

const clearSession = () => {
  ["access", "refresh", "role", "email", "program_type", "user"].forEach((key) => localStorage.removeItem(key));
};

export default function useIdleLogout(timeoutMs = IDLE_LIMIT_MS) {
  const navigate = useNavigate();
  const location = useLocation();
  const timerRef = useRef(null);

  useEffect(() => {
    const resetTimer = () => {
      if (!localStorage.getItem("access")) return;
      window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        clearSession();
        notify.warning("Session expired due to inactivity");
        navigate("/login", { replace: true });
      }, timeoutMs);
    };

    ACTIVITY_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, resetTimer, { passive: true });
    });
    resetTimer();

    return () => {
      window.clearTimeout(timerRef.current);
      ACTIVITY_EVENTS.forEach((eventName) => window.removeEventListener(eventName, resetTimer));
    };
  }, [navigate, timeoutMs]);

  useEffect(() => {
    if (localStorage.getItem("access")) {
      window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        clearSession();
        notify.warning("Session expired due to inactivity");
        navigate("/login", { replace: true });
      }, timeoutMs);
    }
  }, [location.key, navigate, timeoutMs]);
}
