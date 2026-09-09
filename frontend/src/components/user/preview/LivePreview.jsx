import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { AlertTriangle, ChevronDown, ChevronUp, RefreshCw, Terminal, Trash2 } from "lucide-react";
import { createPreviewDocument } from "./previewDocument";
import { normalizeValidationRules, summarizeEvaluation } from "../../../challenge_engine/testRules";

const PREVIEW_EXECUTION_TIMEOUT_MS = 5000;
const TESTCASE_EXECUTION_TIMEOUT_MS = 8000;
const READY_TIMEOUT_MS = 5000;
const TIMEOUT_MESSAGE = "Execution timed out. Possible infinite loop or excessive re-render detected.";

const getFramework = (challenge) =>
  challenge?.galaxy === "react" || challenge?.technology === "react" ? "react" : "html";

const DEFAULT_CONSOLE_HEIGHT = 112;

const LivePreview = forwardRef(function LivePreview(
  { code, challenge, testCases = [], onConsole = () => {}, onError = () => {}, onEvaluation = () => {} },
  ref
) {
  const iframeRef = useRef(null);
  const livePreviewRef = useRef(null);
  const seqRef = useRef(1);
  const pendingRef = useRef(new Map());
  const readyWaitersRef = useRef([]);
  const readyRef = useRef(false);
  const latestPayloadRef = useRef(null);
  const scheduledRenderRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [runtimeError, setRuntimeError] = useState(null);
  const [frameKey, setFrameKey] = useState(0);
  const [consoleEntries, setConsoleEntries] = useState([]);
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [consoleHeight, setConsoleHeight] = useState(DEFAULT_CONSOLE_HEIGHT);
  const resizeStateRef = useRef(null);
  const documentMarkup = useMemo(() => createPreviewDocument(), []);
  const framework = getFramework(challenge);

  const resetFrameAfterTimeout = useCallback((message = TIMEOUT_MESSAGE) => {
    pendingRef.current.forEach((pending) => {
      window.clearTimeout(pending.timer);
      pending.reject(new Error(message));
    });
    pendingRef.current.clear();
    readyWaitersRef.current.forEach((waiter) => window.clearTimeout(waiter.timer));
    readyWaitersRef.current = [];
    readyRef.current = false;
    setReady(false);
    setRuntimeError(message);
    setConsoleEntries((entries) => [
      ...entries.slice(-99),
      { id: `${Date.now()}-timeout`, level: "error", message, phase: "timeout" },
    ]);
    onError({ phase: "timeout", message });
    setFrameKey((key) => key + 1);
  }, [onError]);

  const waitUntilReady = useCallback(
    () =>
      readyRef.current
        ? Promise.resolve()
        : new Promise((resolve, reject) => {
            const timer = window.setTimeout(() => {
              readyWaitersRef.current = readyWaitersRef.current.filter((waiter) => waiter.resolve !== resolve);
              reject(new Error("Preview frame did not become ready in time."));
            }, READY_TIMEOUT_MS);
            readyWaitersRef.current.push({ resolve, timer });
          }),
    []
  );

  const post = useCallback((type, payload, timeout = PREVIEW_EXECUTION_TIMEOUT_MS) => {
    const frame = iframeRef.current?.contentWindow;
    if (!frame) return Promise.reject(new Error("Preview frame is not ready."));
    const seq = seqRef.current++;
    frame.postMessage({ source: "codequest-host", type, seq, payload }, "*");

    return new Promise((resolve, reject) => {
      const timer = window.setTimeout(() => {
        pendingRef.current.delete(seq);
        reject(new Error(TIMEOUT_MESSAGE));
        resetFrameAfterTimeout();
      }, timeout);
      pendingRef.current.set(seq, { type, resolve, reject, timer });
    });
  }, [resetFrameAfterTimeout]);

  const renderNow = useCallback(
    async (nextCode = code, { throwOnError = false } = {}) => {
      latestPayloadRef.current = { code: nextCode, framework };
      setRuntimeError(null);
      if (!readyRef.current) return null;
      return post("render", latestPayloadRef.current, PREVIEW_EXECUTION_TIMEOUT_MS).catch((error) => {
        setRuntimeError(error.message);
        onError(error);
        if (throwOnError) throw error;
        return null;
      });
    },
    [code, framework, onError, post]
  );

  useEffect(() => {
    if (scheduledRenderRef.current) {
      window.clearTimeout(scheduledRenderRef.current);
    }
    scheduledRenderRef.current = window.setTimeout(() => {
      scheduledRenderRef.current = null;
      renderNow(code);
    }, 250);
    return () => {
      if (scheduledRenderRef.current) {
        window.clearTimeout(scheduledRenderRef.current);
        scheduledRenderRef.current = null;
      }
    };
  }, [code, renderNow]);

  useEffect(() => {
    const onMessage = (event) => {
      if (event.data?.source !== "codequest-preview") return;
      const { type, seq } = event.data;

      if (type === "ready") {
        readyRef.current = true;
        setReady(true);
        readyWaitersRef.current.forEach((waiter) => {
          window.clearTimeout(waiter.timer);
          waiter.resolve();
        });
        readyWaitersRef.current = [];
        return;
      }

      if (type === "console") {
        setConsoleEntries((entries) => [...entries.slice(-99), { ...event.data.entry, id: `${Date.now()}-${entries.length}` }]);
        onConsole(event.data.entry);
        return;
      }

      if (type === "runtime-error") {
        const error = event.data.error || {};
        const message = error.phase
          ? `[${error.phase}] ${error.message || "Runtime error"}${error.file ? ` (${error.file}${error.line ? `:${error.line}` : ""})` : ""}`
          : error.message || "Runtime error";
        setRuntimeError(message);
        setConsoleEntries((entries) => [
          ...entries.slice(-99),
          { id: `${Date.now()}-error`, level: "error", message, phase: error.phase },
        ]);
        onError(event.data.error);

        const pending = pendingRef.current.get(seq);
        if (pending) {
          window.clearTimeout(pending.timer);
          pendingRef.current.delete(seq);
          pending.reject(new Error(message));
        }
      }

      if (type === "timeout") {
        const message = event.data.message || TIMEOUT_MESSAGE;
        setRuntimeError(message);
        const pending = pendingRef.current.get(seq);
        if (pending) {
          window.clearTimeout(pending.timer);
          pendingRef.current.delete(seq);
          pending.reject(new Error(message));
        }
        resetFrameAfterTimeout(message);
        return;
      }

      const pending = pendingRef.current.get(seq);
      if (!pending) return;

      if (
        (pending.type === "render" && type === "rendered") ||
        (pending.type === "evaluate" && type === "evaluation")
      ) {
        window.clearTimeout(pending.timer);
        pendingRef.current.delete(seq);
        pending.resolve(event.data);
      }
    };

    const pendingRequests = pendingRef.current;
    window.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener("message", onMessage);
      pendingRequests.forEach((pending) => window.clearTimeout(pending.timer));
      pendingRequests.clear();
      if (scheduledRenderRef.current) {
        window.clearTimeout(scheduledRenderRef.current);
        scheduledRenderRef.current = null;
      }
      readyWaitersRef.current.forEach((waiter) => window.clearTimeout(waiter.timer));
      readyWaitersRef.current = [];
    };
  }, [onConsole, onError]);

  useEffect(() => {
    if (ready && latestPayloadRef.current) {
      post("render", latestPayloadRef.current, PREVIEW_EXECUTION_TIMEOUT_MS).catch(() => {});
    }
  }, [post, ready]);

  const runEvaluation = useCallback(
    async () => {
      if (scheduledRenderRef.current) {
        window.clearTimeout(scheduledRenderRef.current);
        scheduledRenderRef.current = null;
      }
      await waitUntilReady();
      await renderNow(code, { throwOnError: true });
      const rules = normalizeValidationRules(testCases);
      const response = await post("evaluate", { rules, framework }, TESTCASE_EXECUTION_TIMEOUT_MS);
      const summary = summarizeEvaluation(response.results || []);
      onEvaluation(summary);
      return summary;
    },
    [code, framework, onEvaluation, post, renderNow, testCases, waitUntilReady]
  );

  const refreshPreview = useCallback(() => {
    readyRef.current = false;
    setReady(false);
    setRuntimeError(null);
    pendingRef.current.forEach((pending) => window.clearTimeout(pending.timer));
    pendingRef.current.clear();
    latestPayloadRef.current = { code, framework };
    setFrameKey((key) => key + 1);
  }, [code, framework]);

  const startConsoleResize = useCallback((event) => {
    event.preventDefault();
    setConsoleOpen(true);
    resizeStateRef.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      startHeight: consoleHeight,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
    document.body.classList.add("workspace-console-resizing");
  }, [consoleHeight]);

  const toggleConsole = useCallback(() => {
    setConsoleOpen((current) => !current);
    setConsoleHeight((height) => Math.max(DEFAULT_CONSOLE_HEIGHT, height));
  }, []);

  const clampConsoleHeight = useCallback((height) => {
    const availableHeight = livePreviewRef.current?.getBoundingClientRect().height || 0;
    const maxHeight = availableHeight ? Math.max(120, availableHeight - 220) : 320;
    return Math.min(maxHeight, Math.max(96, height));
  }, []);

  const stopConsoleResize = useCallback(() => {
    resizeStateRef.current = null;
    document.body.classList.remove("workspace-console-resizing");
  }, []);

  useEffect(() => {
    const handlePointerMove = (event) => {
      const resizeState = resizeStateRef.current;
      if (!resizeState || event.pointerId !== resizeState.pointerId) return;
      const nextHeight = resizeState.startHeight + resizeState.startY - event.clientY;
      setConsoleHeight(clampConsoleHeight(nextHeight));
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopConsoleResize);
    window.addEventListener("pointercancel", stopConsoleResize);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopConsoleResize);
      window.removeEventListener("pointercancel", stopConsoleResize);
      document.body.classList.remove("workspace-console-resizing");
    };
  }, [clampConsoleHeight, stopConsoleResize]);

  const openInNewTab = useCallback(() => {
    const markup = iframeRef.current?.contentDocument?.documentElement?.outerHTML;
    if (!markup) return;
    const blob = new Blob([`<!doctype html>${markup}`], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const opened = window.open(url, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(url), opened ? 30000 : 1000);
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      render: renderNow,
      refresh: refreshPreview,
      openInNewTab,
      runVisibleTests: runEvaluation,
      runAllTests: runEvaluation,
    }),
    [openInNewTab, refreshPreview, renderNow, runEvaluation]
  );

  return (
    <div
      className="workspace-live-preview"
      ref={livePreviewRef}
      style={{ "--workspace-console-height": consoleOpen ? `${consoleHeight}px` : "0px" }}
    >
      <div className="workspace-preview-header">
        <div className="workspace-preview-tools">
          <button type="button" title="Refresh preview" onClick={refreshPreview}>
            <RefreshCw />
          </button>
          
        </div>
      </div>
      <div className="workspace-preview-frame-shell">
        <iframe
          key={frameKey}
          className="workspace-preview-frame"
          ref={iframeRef}
          sandbox="allow-scripts"
          srcDoc={documentMarkup}
          title="Live preview"
        />
      </div>
      {runtimeError && (
        <div className="workspace-runtime-error">
          <AlertTriangle />
          <span>{runtimeError}</span>
        </div>
      )}
      <div className="workspace-console-toggle-row">
        <button type="button" aria-expanded={consoleOpen} onClick={toggleConsole}>
          <Terminal />
          Console
          {consoleOpen ? <ChevronDown /> : <ChevronUp />}
        </button>
      </div>
      {consoleOpen && (
        <div className="workspace-console">
          <button
            type="button"
            className="workspace-console-resize-handle"
            aria-label="Resize console"
            onPointerDown={startConsoleResize}
          />
          <header>
            <strong>Console</strong>
            <button type="button" onClick={() => setConsoleEntries([])}>
              <Trash2 />
              Clear
            </button>
          </header>
          <div className="workspace-console-output">
            {consoleEntries.length ? consoleEntries.map((entry) => (
              <div key={entry.id} className={`console-line ${entry.level || "log"}`}>
                <span>{entry.level || "log"}</span>
                <code>{entry.message}</code>
              </div>
            )) : (
              <p>No console output yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

export default LivePreview;
