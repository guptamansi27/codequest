import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

const MotionSpan = motion.span;

function joinClasses(...values) {
  return values.filter(Boolean).join(" ");
}

/**
 * Compact dock rail item: children show only the icon/control; `label` is shown in a custom floating pill (no native tooltip).
 */
export default function DockNavItem({ label, children, className = "" }) {
  const wrapRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const reduceMotion = useReducedMotion();

  useLayoutEffect(() => {
    if (!open || !wrapRef.current) return;
    const r = wrapRef.current.getBoundingClientRect();
    setPos({ top: r.top + r.height / 2, left: r.right + 12 });
  }, [open]);

  useLayoutEffect(() => {
    if (!open) return;
    const onScroll = () => {
      const el = wrapRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setPos({ top: r.top + r.height / 2, left: r.right + 12 });
    };
    window.addEventListener("scroll", onScroll, true);
    return () => window.removeEventListener("scroll", onScroll, true);
  }, [open]);

  const duration = reduceMotion ? 0 : 0.22;

  return (
    <div
      ref={wrapRef}
      className={joinClasses("cq-dock-nav-item", className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
      }}
    >
      {children}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence mode="wait">
            {open ? (
              <MotionSpan
                key={label}
                className="cq-dock-floating-label"
                aria-hidden="true"
                style={{
                  position: "fixed",
                  top: pos.top,
                  left: pos.left,
                  zIndex: 10050,
                  pointerEvents: "none",
                  translateY: "-50%",
                  willChange: "transform, opacity",
                }}
                initial={reduceMotion ? false : { opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, x: -8 }}
                transition={{ duration, ease: [0.22, 1, 0.36, 1] }}
              >
                {label}
              </MotionSpan>
            ) : null}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}
