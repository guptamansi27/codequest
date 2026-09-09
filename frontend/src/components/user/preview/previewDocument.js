import babelSource from "../../../../node_modules/@babel/standalone/babel.min.js?raw";
import reactSource from "../../../../node_modules/react/umd/react.development.js?raw";
import reactDomSource from "../../../../node_modules/react-dom/umd/react-dom.development.js?raw";

const escapeScript = (source) => source.replace(/<\/script/gi, "<\\/script");

const sandboxRuntime = `
(() => {
  const state = {
    seq: 0,
    root: null,
    logs: [],
    moduleCache: new Map(),
    styleNodes: new Map(),
    messageQueue: Promise.resolve(),
    timers: new Set(),
    intervals: new Set(),
    rafs: new Set(),
    listeners: [],
    runStartedAt: 0,
    guardCount: 0,
    trackUserListeners: false,
  };

  const EXECUTION_TIMEOUT_MS = 4500;
  const TESTCASE_TIMEOUT_MS = 2500;
  const MAX_GUARD_STEPS = 120000;
  const TIMEOUT_MESSAGE = "Execution timed out. Possible infinite loop or excessive re-render detected.";

  const post = (type, payload = {}, seq = state.seq) => {
    parent.postMessage({ source: "codequest-preview", type, seq, ...payload }, "*");
  };

  const serialize = (value) => {
    try {
      if (value instanceof Error) return value.stack || value.message;
      if (typeof value === "string") return value;
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  };

  const makeError = (phase, message, details = {}) => ({
    phase,
    message: message || "Preview error",
    stack: details.stack || "",
    file: details.file || "",
    line: details.line || details.loc?.line,
    column: details.column || details.loc?.column,
  });

  const reportError = (phase, error, details = {}) => {
    if (error && typeof error === "object") error.__codeQuestReported = true;
    const payload = makeError(phase, error?.message || serialize(error), {
      ...details,
      stack: error?.stack || details.stack,
      loc: error?.loc,
    });
    post("runtime-error", { error: payload }, details.seq);
    post("console", { entry: { level: "error", message: formatError(payload), phase } }, details.seq);
  };

  const createTimeoutError = () => {
    const error = new Error(TIMEOUT_MESSAGE);
    error.name = "CodeQuestTimeoutError";
    return error;
  };

  window.__cqGuard = () => {
    state.guardCount += 1;
    if (!state.runStartedAt) state.runStartedAt = performance.now();
    if (state.guardCount > MAX_GUARD_STEPS || performance.now() - state.runStartedAt > EXECUTION_TIMEOUT_MS) {
      throw createTimeoutError();
    }
  };

  const formatError = (error) => {
    const location = error.file ? " in " + error.file + (error.line ? ":" + error.line : "") : "";
    return "[" + error.phase + "] " + error.message + location;
  };

  ["log", "info", "warn", "error"].forEach((level) => {
    const original = console[level].bind(console);
    console[level] = (...args) => {
      const entry = { level, message: args.map(serialize).join(" ") };
      state.logs.push(entry);
      post("console", { entry });
      original(...args);
    };
  });

  const nativeSetTimeout = window.setTimeout.bind(window);
  const nativeClearTimeout = window.clearTimeout.bind(window);
  const nativeSetInterval = window.setInterval.bind(window);
  const nativeClearInterval = window.clearInterval.bind(window);
  const nativeRequestAnimationFrame = window.requestAnimationFrame.bind(window);
  const nativeCancelAnimationFrame = window.cancelAnimationFrame.bind(window);
  const nativeAddEventListener = EventTarget.prototype.addEventListener;
  const nativeRemoveEventListener = EventTarget.prototype.removeEventListener;

  window.setTimeout = (handler, delay, ...args) => {
    const id = nativeSetTimeout((...callbackArgs) => {
      state.timers.delete(id);
      if (typeof handler === "function") return handler(...callbackArgs);
      return new Function(String(handler || ""))();
    }, delay, ...args);
    state.timers.add(id);
    return id;
  };

  window.clearTimeout = (id) => {
    state.timers.delete(id);
    nativeClearTimeout(id);
  };

  window.setInterval = (handler, delay, ...args) => {
    const id = nativeSetInterval((...callbackArgs) => {
      window.__cqGuard();
      if (typeof handler === "function") return handler(...callbackArgs);
      return new Function(String(handler || ""))();
    }, delay, ...args);
    state.intervals.add(id);
    return id;
  };

  window.clearInterval = (id) => {
    state.intervals.delete(id);
    nativeClearInterval(id);
  };

  window.requestAnimationFrame = (callback) => {
    const id = nativeRequestAnimationFrame((time) => {
      state.rafs.delete(id);
      window.__cqGuard();
      callback(time);
    });
    state.rafs.add(id);
    return id;
  };

  window.cancelAnimationFrame = (id) => {
    state.rafs.delete(id);
    nativeCancelAnimationFrame(id);
  };

  EventTarget.prototype.addEventListener = function patchedAddEventListener(type, listener, options) {
    if (state.trackUserListeners) {
      state.listeners.push({ target: this, type, listener, options });
    }
    return nativeAddEventListener.call(this, type, listener, options);
  };

  EventTarget.prototype.removeEventListener = function patchedRemoveEventListener(type, listener, options) {
    state.listeners = state.listeners.filter((entry) =>
      entry.target !== this || entry.type !== type || entry.listener !== listener
    );
    return nativeRemoveEventListener.call(this, type, listener, options);
  };

  window.addEventListener("error", (event) => {
    reportError("runtime", event.error || new Error(event.message), {
      line: event.lineno,
      column: event.colno,
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    reportError("runtime", event.reason);
  });

  const normalizeFileMap = (files = {}) => {
    const normalized = {};
    Object.entries(files || {}).forEach(([path, source]) => {
      const cleanPath = String(path).replace(/^\\/+/, "").replace(/\\\\/g, "/");
      normalized[cleanPath] = String(source ?? "");
    });
    return normalized;
  };

  const extractImportNames = (source) => {
    const names = new Set();
    const importPattern = /import\\s+([^;]+?)\\s+from\\s+["'][^"']+["']/g;
    let match;
    while ((match = importPattern.exec(source))) {
      const clause = match[1].trim();
      const defaultMatch = clause.match(/^([A-Za-z_$][\\w$]*)/);
      if (defaultMatch && !clause.startsWith("{") && !clause.startsWith("*")) names.add(defaultMatch[1]);
      const namespaceMatch = clause.match(/\\*\\s+as\\s+([A-Za-z_$][\\w$]*)/);
      if (namespaceMatch) names.add(namespaceMatch[1]);
      const namedMatch = clause.match(/\\{([^}]+)\\}/);
      if (namedMatch) {
        namedMatch[1].split(",").forEach((part) => {
          const clean = part.trim();
          if (!clean) return;
          const alias = clean.match(/\\bas\\s+([A-Za-z_$][\\w$]*)$/);
          names.add(alias ? alias[1] : clean.split(/\\s+/)[0]);
        });
      }
    }
    return names;
  };

  const assertJsxComponentsDeclared = (path, source) => {
    const used = new Set();
    const declared = new Set(["React", "Fragment"]);
    extractImportNames(source).forEach((name) => declared.add(name));

    const declarationPattern = /\\b(?:function|class|const|let|var)\\s+([A-Za-z_$][\\w$]*)/g;
    let declaration;
    while ((declaration = declarationPattern.exec(source))) declared.add(declaration[1]);

    const jsxPattern = /<\\s*([A-Z][A-Za-z0-9_$]*(?:\\.[A-Za-z0-9_$]+)?)/g;
    let jsx;
    while ((jsx = jsxPattern.exec(source))) used.add(jsx[1].split(".")[0]);

    const missing = Array.from(used).filter((name) => !declared.has(name));
    if (missing.length) {
      throw new Error(
        path + ": " + missing[0] + " is not defined. Import or declare " + missing[0] + " before using <" + missing[0] + " />."
      );
    }
  };

  const dirname = (path) => path.split("/").slice(0, -1).join("/");

  const normalizeSegments = (path) => {
    const stack = [];
    path.split("/").forEach((part) => {
      if (!part || part === ".") return;
      if (part === "..") stack.pop();
      else stack.push(part);
    });
    return stack.join("/");
  };

  const resolveFile = (request, fromFile, files) => {
    if (request === "react") return "npm:react";
    if (request === "react-dom") return "npm:react-dom";
    if (request === "react-dom/client") return "npm:react-dom/client";
    if (request === "react/jsx-runtime") return "npm:react/jsx-runtime";

    if (!request.startsWith(".") && !request.startsWith("/")) {
      throw new Error('Cannot resolve package "' + request + '". Only react and local files are available.');
    }

    const base = request.startsWith("/")
      ? normalizeSegments(request)
      : normalizeSegments(dirname(fromFile) + "/" + request);

    const candidates = [
      base,
      base + ".jsx",
      base + ".js",
      base + ".tsx",
      base + ".ts",
      base + ".css",
      base + "/index.jsx",
      base + "/index.js",
      base + "/index.css",
    ];

    const match = candidates.find((candidate) => Object.prototype.hasOwnProperty.call(files, candidate));
    if (!match) {
      throw new Error('Cannot resolve import "' + request + '" from "' + fromFile + '".');
    }
    return match;
  };

  const appendStyle = (path, css) => {
    let style = state.styleNodes.get(path);
    if (!style) {
      style = document.createElement("style");
      style.dataset.codequestStyle = path;
      document.head.appendChild(style);
      state.styleNodes.set(path, style);
    }
    style.textContent = css || "";
  };

  const cssModuleExports = (css) => {
    const classes = {};
    String(css || "").replace(/\\.([_a-zA-Z]+[_a-zA-Z0-9-]*)/g, (_, className) => {
      classes[className] = className;
      return "";
    });
    return { __esModule: true, default: classes, ...classes };
  };

  const clearRuntime = () => {
    if (state.root?.unmount) {
      try {
        state.root.unmount();
      } catch {}
    }
    state.timers.forEach((id) => nativeClearTimeout(id));
    state.intervals.forEach((id) => nativeClearInterval(id));
    state.rafs.forEach((id) => nativeCancelAnimationFrame(id));
    state.listeners.forEach(({ target, type, listener, options }) => {
      try {
        nativeRemoveEventListener.call(target, type, listener, options);
      } catch {}
    });
    state.timers.clear();
    state.intervals.clear();
    state.rafs.clear();
    state.listeners = [];
    state.runStartedAt = performance.now();
    state.guardCount = 0;
    state.root = null;
    state.moduleCache.clear();
    state.styleNodes.forEach((node) => node.remove());
    state.styleNodes.clear();
    document.body.innerHTML = '<div id="root"></div>';
  };

  const getReactJsxRuntime = () => {
    const build = (type, props, key) => React.createElement(type, key == null ? props : { ...props, key });
    return {
      __esModule: true,
      Fragment: React.Fragment,
      jsx: build,
      jsxs: build,
      default: { Fragment: React.Fragment, jsx: build, jsxs: build },
    };
  };

  const getPackage = (id) => {
    if (id === "npm:react") return { __esModule: true, default: React, ...React };
    if (id === "npm:react-dom") return { __esModule: true, default: ReactDOM, ...ReactDOM };
    if (id === "npm:react-dom/client") return { __esModule: true, default: ReactDOM, createRoot: ReactDOM.createRoot };
    if (id === "npm:react/jsx-runtime") return getReactJsxRuntime();
    throw new Error("Unknown package " + id);
  };

  const loopGuardPlugin = ({ types: t }) => ({
    visitor: {
      "WhileStatement|ForStatement|DoWhileStatement": (path) => {
        const guard = t.expressionStatement(t.callExpression(t.identifier("__cqGuard"), []));
        if (t.isBlockStatement(path.node.body)) {
          path.node.body.body.unshift(guard);
        } else {
          path.node.body = t.blockStatement([guard, path.node.body]);
        }
      },
      Function: (path) => {
        if (!t.isBlockStatement(path.node.body)) return;
        path.node.body.body.unshift(t.expressionStatement(t.callExpression(t.identifier("__cqGuard"), [])));
      },
    },
  });

  const transformModule = (path, source, seq) => {
    try {
      return Babel.transform(source, {
        filename: path,
        sourceType: "module",
        presets: [
          ["env", { modules: "commonjs", targets: { esmodules: true } }],
          ["react", { runtime: "automatic", importSource: "react" }],
        ],
        plugins: [loopGuardPlugin, "transform-class-properties", "transform-object-rest-spread"],
      }).code;
    } catch (error) {
      reportError(error?.name === "SyntaxError" ? "syntax" : "transpile", error, { file: path, seq });
      throw error;
    }
  };

  const createRequire = (fromFile, files, seq) => (request) => {
    const resolved = resolveFile(request, fromFile, files);
    if (resolved.startsWith("npm:")) return getPackage(resolved);
    return loadModule(resolved, files, seq);
  };

  function loadModule(path, files, seq) {
    if (path.endsWith(".css")) {
      appendStyle(path, files[path]);
      return path.endsWith(".module.css") ? cssModuleExports(files[path]) : {};
    }

    if (state.moduleCache.has(path)) return state.moduleCache.get(path).exports;
    if (!Object.prototype.hasOwnProperty.call(files, path)) {
      throw new Error('Module "' + path + '" does not exist.');
    }

    const module = { exports: {} };
    state.moduleCache.set(path, module);

    assertJsxComponentsDeclared(path, files[path]);
    const compiled = transformModule(path, files[path], seq);
    try {
      const run = new Function("require", "module", "exports", compiled + "\\n//# sourceURL=" + path);
      run(createRequire(path, files, seq), module, module.exports);
      return module.exports;
    } catch (error) {
      reportError("runtime", error, { file: path, seq });
      throw error;
    }
  }

  class CodeQuestErrorBoundary extends React.Component {
    constructor(props) {
      super(props);
      this.state = { error: null };
    }

    static getDerivedStateFromError(error) {
      return { error };
    }

    componentDidCatch(error) {
      reportError("render", error);
    }

    render() {
      if (this.state.error) {
        return React.createElement(
          "pre",
          {
            style: {
              color: "#b42318",
              background: "#fff4f2",
              border: "1px solid #fecdca",
              borderRadius: "8px",
              margin: "16px",
              padding: "12px",
              whiteSpace: "pre-wrap",
            },
          },
          this.state.error.message || String(this.state.error)
        );
      }
      return this.props.children;
    }
  }

  const findEntry = (files) => {
    const candidates = ["src/App.jsx", "src/App.js", "App.jsx", "App.js", "src/main.jsx", "src/main.js"];
    return candidates.find((path) => Object.prototype.hasOwnProperty.call(files, path));
  };

  const renderReactFiles = async (fileMap, seq) => {
    const files = normalizeFileMap(fileMap);
    const entry = findEntry(files);
    if (!entry) throw new Error("Missing React entry file. Create src/App.jsx or App.jsx.");

    Object.entries(files)
      .filter(([path]) => path.endsWith(".css"))
      .forEach(([path, css]) => appendStyle(path, css));

    const entryExports = loadModule(entry, files, seq);
    const Component = entryExports.default || entryExports.App;
    if (typeof Component !== "function") {
      throw new Error(entry + " must export a React component as default.");
    }

    const rootElement = document.getElementById("root");
    state.root = ReactDOM.createRoot(rootElement);
    state.root.render(React.createElement(CodeQuestErrorBoundary, null, React.createElement(Component)));
    await stabilizeReactRender();
  };

  const createFetchResponse = (payload, status = 200) => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload,
    text: async () => typeof payload === "string" ? payload : JSON.stringify(payload),
  });

  window.fetch = async (url) => {
    const mocks = window.__CODEQUEST_FETCH_MOCKS__ || {};
    const key = String(url || "");
    if (Object.prototype.hasOwnProperty.call(mocks, key)) {
      return createFetchResponse(mocks[key]);
    }
    return createFetchResponse({});
  };

  const transformClassicScript = (source) => {
    try {
      return Babel.transform(String(source || ""), {
        filename: "script.js",
        sourceType: "script",
        presets: [["env", { modules: false, targets: { esmodules: true } }]],
        plugins: [loopGuardPlugin, "transform-class-properties", "transform-object-rest-spread"],
      }).code;
    } catch (error) {
      reportError(error?.name === "SyntaxError" ? "syntax" : "transpile", error, { file: "script.js" });
      throw error;
    }
  };

  const executeClassicScript = (source) => {
    const script = document.createElement("script");
    script.textContent = transformClassicScript(source);
    document.body.appendChild(script);
    script.remove();
  };

  const renderClassic = async (code) => {
    document.body.innerHTML = code.html || "";
    if (code.css) appendStyle("classic.css", code.css);
    if (code.javascript) executeClassicScript(code.javascript);
    await new Promise((resolve) => requestAnimationFrame(() => resolve()));
  };

  const render = async ({ code, framework }, seq) => {
    state.logs = [];
    clearRuntime();
    state.trackUserListeners = true;

    try {
      if (framework === "react") {
        await renderReactFiles(code.files || code, seq);
      } else {
        await renderClassic(code || {});
      }
      await stabilizeReactRender();
      post("rendered", { logs: state.logs }, seq);
    } catch (error) {
      if (!error.__codeQuestReported) {
        reportError("runtime", error, { seq });
      }
    } finally {
      state.trackUserListeners = false;
    }
  };

  const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => resolve()));
  const nextTask = () => new Promise((resolve) => setTimeout(resolve, 0));

  const stabilizeReactRender = async () => {
    window.__cqGuard();
    await Promise.resolve();
    await nextFrame();
    window.__cqGuard();
    await Promise.resolve();
    await nextTask();
    await nextFrame();
    window.__cqGuard();
  };

  const pass = (message = "") => ({ passed: true, message });
  const fail = (message) => ({ passed: false, message });

  const describeTarget = (rule) => rule.selector || "document body";
  const describeActionTarget = (rule) => rule.buttonSelector || rule.inputSelector || rule.selector || "control";

  const getText = (rule) => String(rule.text || rule.expected || "").trim();
  const getTargetSelector = (rule) => rule.targetSelector || rule.target || rule.selector || "";
  const getActionSelector = (rule) => rule.buttonSelector || rule.inputSelector || rule.selector || "";
  const getAttributeName = (rule) => rule.attribute || rule.property || "";

  const setNativeValue = (element, value) => {
    const prototype = Object.getPrototypeOf(element);
    const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");
    if (descriptor?.set) descriptor.set.call(element, value);
    else element.value = value;
  };

  const textMatches = (actual, expected, rule) => {
    const actualText = rule.caseSensitive === false ? actual.toLowerCase() : actual;
    const expectedText = rule.caseSensitive === false ? expected.toLowerCase() : expected;
    return rule.matchMode === "exact" ? actualText === expectedText : actualText.includes(expectedText);
  };

  const visible = (element) => {
    if (!element) return false;
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity) !== 0 && rect.width > 0 && rect.height > 0;
  };

  const validators = {
    elementExists: (rule) => {
      const element = document.querySelector(rule.selector);
      return element ? pass() : fail('Expected element "' + describeTarget(rule) + '" was not found.');
    },
    hasClass: (rule) => {
      const element = document.querySelector(rule.selector);
      const expected = rule.className || rule.expected;
      if (!element) return fail('Expected element "' + describeTarget(rule) + '" was not found.');
      return element.classList.contains(expected)
        ? pass()
        : fail('Expected "' + describeTarget(rule) + '" to have class "' + expected + '".');
    },
    hasText: (rule) => {
      const target = rule.selector ? document.querySelector(rule.selector) : document.body;
      const expected = getText(rule);
      const actual = String(target?.textContent || "").trim();
      if (!target) return fail('Expected text target "' + describeTarget(rule) + '" was not found.');
      if (!expected) return pass();
      return textMatches(actual, expected, rule)
        ? pass()
        : fail('Expected text "' + expected + '" missing from "' + describeTarget(rule) + '".');
    },
    textExists: (rule) => validators.hasText(rule),
    textContentEquals: (rule) => {
      const target = rule.selector ? document.querySelector(rule.selector) : document.body;
      const expected = getText(rule);
      if (!target) return fail('Expected text target "' + describeTarget(rule) + '" was not found.');
      const actual = String(target.textContent || "").trim();
      return textMatches(actual, expected, { ...rule, matchMode: "exact" })
        ? pass()
        : fail('Expected "' + describeTarget(rule) + '" text to equal "' + expected + '", received "' + actual + '".');
    },
    hasAttribute: (rule) => {
      const element = document.querySelector(rule.selector);
      const attribute = getAttributeName(rule);
      if (!element) return fail('Expected element "' + describeTarget(rule) + '" was not found.');
      if (!attribute) return fail("Expected attribute name was not configured.");
      if (!element.hasAttribute(attribute)) return fail('Expected "' + describeTarget(rule) + '" to include attribute "' + attribute + '".');
      const expected = String(rule.expected || "").trim();
      if (!expected) return pass();
      const actual = element.getAttribute(attribute) || "";
      return textMatches(actual, expected, rule)
        ? pass()
        : fail('Expected attribute "' + attribute + '" on "' + describeTarget(rule) + '" to include "' + expected + '", received "' + actual + '".');
    },
    styleMatches: (rule) => {
      const element = document.querySelector(rule.selector);
      if (!element) return fail('Expected element "' + describeTarget(rule) + '" was not found.');
      if (!rule.property) return fail("Expected CSS property was not configured.");
      const actual = getComputedStyle(element).getPropertyValue(rule.property).trim();
      return actual.includes(String(rule.expected).trim())
        ? pass()
        : fail('Expected "' + rule.property + '" on "' + describeTarget(rule) + '" to include "' + rule.expected + '", received "' + actual + '".');
    },
    isResponsive: (rule) => {
      const element = rule.selector ? document.querySelector(rule.selector) : document.body;
      if (!element) return fail('Expected responsive target "' + describeTarget(rule) + '" was not found.');
      const rect = element.getBoundingClientRect();
      return rect.width <= window.innerWidth && rect.right <= window.innerWidth && rect.left >= 0
        ? pass()
        : fail('Expected "' + describeTarget(rule) + '" to fit inside the preview viewport.');
    },
    isVisible: (rule) => {
      const element = document.querySelector(rule.selector);
      return visible(element) ? pass() : fail('Expected "' + describeTarget(rule) + '" to be visible.');
    },
    isClickable: async (rule) => {
      const element = document.querySelector(rule.selector);
      if (!visible(element)) return fail('Expected clickable element "' + describeTarget(rule) + '" was not found or visible.');
      element.click();
      await stabilizeReactRender();
      return pass();
    },
    handlesEvent: async (rule) => {
      const element = document.querySelector(rule.selector);
      if (!element) return fail('Expected event target "' + describeTarget(rule) + '" was not found.');
      const before = document.body.innerHTML;
      element.dispatchEvent(new Event(rule.event || "click", { bubbles: true, cancelable: true }));
      await stabilizeReactRender();
      const expected = getText(rule);
      if (expected) {
        return textMatches(document.body.textContent || "", expected, rule)
          ? pass()
          : fail('Expected text "' + expected + '" after ' + (rule.event || "click") + ' on "' + describeTarget(rule) + '".');
      }
      return before !== document.body.innerHTML
        ? pass()
        : fail('Expected "' + describeTarget(rule) + '" to update the rendered DOM after ' + (rule.event || "click") + ".");
    },
    attributeChanges: async (rule) => {
      const action = document.querySelector(getActionSelector(rule));
      const target = document.querySelector(getTargetSelector(rule) || getActionSelector(rule));
      const attribute = getAttributeName(rule);
      if (!action) return fail('Button or event target "' + describeActionTarget(rule) + '" was not found.');
      if (!target) return fail('Attribute target "' + (getTargetSelector(rule) || describeActionTarget(rule)) + '" was not found.');
      if (!attribute) return fail("Expected changed attribute name was not configured.");
      action.dispatchEvent(new Event(rule.event || "click", { bubbles: true, cancelable: true }));
      await stabilizeReactRender();
      const actual = target.getAttribute(attribute) || "";
      const expected = String(rule.expected || "").trim();
      return expected ? (
        textMatches(actual, expected, rule)
          ? pass()
          : fail('Expected attribute "' + attribute + '" to include "' + expected + '" after interaction, received "' + actual + '".')
      ) : (
        target.hasAttribute(attribute)
          ? pass()
          : fail('Expected attribute "' + attribute + '" to exist after interaction.')
      );
    },
    domUpdatesAfterClick: async (rule) => {
      const button = document.querySelector(getActionSelector(rule));
      if (!button) return fail('Button "' + describeActionTarget(rule) + '" was not found.');
      button.click();
      await stabilizeReactRender();
      const target = getTargetSelector(rule) ? document.querySelector(getTargetSelector(rule)) : document.body;
      if (!target) return fail('Expected DOM update target "' + getTargetSelector(rule) + '" was not found.');
      const expected = getText(rule);
      if (!expected) return pass();
      const actual = String(target.textContent || "").trim();
      return textMatches(actual, expected, rule)
        ? pass()
        : fail('Expected text "' + expected + '" after click on "' + describeActionTarget(rule) + '", received "' + actual + '".');
    },
    buttonClickUpdatesText: async (rule) => {
      const buttonSelector = rule.buttonSelector || rule.selector || "button";
      const targetSelector = getTargetSelector(rule);
      const button = document.querySelector(buttonSelector);
      if (!button) return fail('Button "' + buttonSelector + '" was not found.');
      if (!visible(button)) return fail('Button "' + buttonSelector + '" is not visible.');
      button.click();
      await stabilizeReactRender();
      const target = targetSelector ? document.querySelector(targetSelector) : document.body;
      if (!target) return fail('Expected text target "' + targetSelector + '" was not found after click.');
      const expected = getText(rule);
      const actual = String(target.textContent || "").trim();
      return textMatches(actual, expected, { ...rule, matchMode: "exact" })
        ? pass()
        : fail('Expected ' + (targetSelector || "page") + ' text "' + expected + '" after click, received "' + actual + '".');
    },
    inputUpdatesState: async (rule) => {
      const inputSelector = rule.inputSelector || rule.selector || "input";
      const input = document.querySelector(inputSelector);
      if (!input) return fail('Input "' + inputSelector + '" was not found.');
      const value = String(rule.value || rule.inputValue || rule.expected || "CodeQuest");
      input.focus();
      if (input.type === "checkbox" || input.type === "radio") {
        input.checked = value === "true" || value === "checked" || value === "on";
        input.dispatchEvent(new Event("click", { bubbles: true, cancelable: true }));
      } else {
        setNativeValue(input, value);
        input.dispatchEvent(new Event("input", { bubbles: true, cancelable: true }));
        input.dispatchEvent(new Event("change", { bubbles: true, cancelable: true }));
      }
      await stabilizeReactRender();
      const target = getTargetSelector(rule) ? document.querySelector(getTargetSelector(rule)) : document.body;
      if (!target) return fail('Expected state-driven target "' + getTargetSelector(rule) + '" was not found.');
      const expected = getText(rule) || value;
      const actual = String(target.textContent || target.value || "").trim();
      return textMatches(actual, expected, rule)
        ? pass()
        : fail('Expected UI to show "' + expected + '" after typing into "' + inputSelector + '", received "' + actual + '".');
    },
    rendersComponent: (rule) => validators.elementExists({ ...rule, selector: rule.selector || "#root > *" }),
    componentExists: (rule) => validators.rendersComponent(rule),
    childComponentRenders: (rule) => validators.elementExists(rule),
    nestedComponentVisible: (rule) => validators.isVisible(rule),
    rendersPropValue: (rule) => validators.hasText(rule),
    rendersDynamicProps: (rule) => validators.hasText(rule),
    conditionallyRendersFromProps: (rule) => validators.hasText(rule),
    conditionallyRenders: async (rule) => validators.domUpdatesAfterClick(rule),
    togglesElementVisibility: async (rule) => {
      const button = document.querySelector(getActionSelector(rule));
      if (!button) return fail('Button "' + describeActionTarget(rule) + '" was not found.');
      button.click();
      await stabilizeReactRender();
      const target = document.querySelector(getTargetSelector(rule));
      return visible(target) ? pass() : fail('Expected "' + getTargetSelector(rule) + '" to become visible after click.');
    },
    stateChangesDOM: async (rule) => validators.domUpdatesAfterClick(rule),
    listRenders: (rule) => {
      const selector = rule.selector || "li";
      const items = Array.from(document.querySelectorAll(selector));
      if (!items.length) return fail('Expected list items matching "' + selector + '" were not found.');
      const expectedCount = Number(rule.expectedCount || rule.count || 0);
      if (expectedCount && items.length < expectedCount) {
        return fail('Expected at least ' + expectedCount + ' list items, received ' + items.length + ".");
      }
      const expected = getText(rule);
      if (!expected) return pass();
      const actual = items.map((item) => item.textContent || "").join(" ");
      return textMatches(actual, expected, rule)
        ? pass()
        : fail('Expected rendered list to include "' + expected + '".');
    },
    rendersList: (rule) => validators.listRenders(rule),
    rendersMappedItems: (rule) => validators.listRenders(rule),
    rendersDynamicListLength: (rule) => validators.listRenders(rule),
    formSubmitsSuccessfully: async (rule) => {
      const form = document.querySelector(rule.selector || "form");
      if (!form) return fail('Form "' + (rule.selector || "form") + '" was not found.');
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      await stabilizeReactRender();
      const expected = getText(rule);
      if (!expected) return pass();
      return textMatches(document.body.textContent || "", expected, rule)
        ? pass()
        : fail('Expected form submission to render "' + expected + '".');
    },
    validationMessageAppears: async (rule) => {
      const form = document.querySelector(rule.selector || "form");
      if (form) form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      await stabilizeReactRender();
      return validators.hasText({ ...rule, selector: rule.targetSelector || "" });
    },
    loadingIndicatorVisible: (rule) => validators.hasText(rule),
    asyncContentRenders: async (rule) => {
      const timeout = Number(rule.timeout || 3000);
      const expected = getText(rule);
      const selector = rule.selector || "";
      const start = Date.now();
      while (Date.now() - start < timeout) {
        const target = selector ? document.querySelector(selector) : document.body;
        const actual = String(target?.textContent || "").trim();
        if (target && (!expected || textMatches(actual, expected, rule))) return pass();
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      return fail('Expected async content "' + expected + '" did not render in time.');
    },
    delayedStateUpdate: async (rule) => validators.asyncContentRenders(rule),
    updatesState: async (rule) => validators.domUpdatesAfterClick(rule),
    useEffectRuns: async (rule) => validators.asyncContentRenders(rule),
    togglesVisibility: async (rule) => validators.togglesElementVisibility(rule),
    parentChildCommunication: async (rule) => validators.domUpdatesAfterClick(rule),
    controlledInput: async (rule) => validators.inputUpdatesState(rule),
    rendersDynamicData: (rule) => validators.hasText(rule),
    passesProps: (rule) => validators.rendersPropValue(rule),
    updatesAfterAsyncAction: async (rule) => {
      if (getActionSelector(rule)) {
        const action = document.querySelector(getActionSelector(rule));
        if (!action) return fail('Button "' + describeActionTarget(rule) + '" was not found.');
        action.click();
      }
      return validators.asyncContentRenders({ ...rule, selector: getTargetSelector(rule) || rule.selector });
    },
    rendersMappedArray: (rule) => validators.listRenders(rule),
    statePersists: async (rule) => validators.domUpdatesAfterClick(rule),
    hookUsageValidation: async (rule) => validators.domUpdatesAfterClick(rule),
    customHookUsage: async (rule) => validators.domUpdatesAfterClick(rule),
    multipleStateUpdates: async (rule) => validators.domUpdatesAfterClick(rule),
    derivedStateRendering: (rule) => validators.hasText(rule),
    classExists: (rule) => validators.hasClass(rule),
    attributeExists: (rule) => validators.hasAttribute(rule),
    matchesLayout: (rule) => {
      const element = document.querySelector(rule.selector);
      if (!element) return fail('Expected layout target "' + describeTarget(rule) + '" was not found.');
      const rect = element.getBoundingClientRect();
      const expected = rule.expected || {};
      const mismatch = Object.entries(expected).find(([key, value]) => Math.round(rect[key]) !== Number(value));
      return mismatch
        ? fail('Expected layout "' + mismatch[0] + '" to equal "' + mismatch[1] + '".')
        : pass();
    },
  };

  const evaluate = async (rules, seq) => {
    const results = [];
    state.runStartedAt = performance.now();
    state.guardCount = 0;
    await stabilizeReactRender();
    for (const rule of rules || []) {
      window.__cqGuard();
      const fn = validators[rule.type] || validators.hasText;
      try {
        await stabilizeReactRender();
        const timeout = Math.min(Number(rule.timeout || TESTCASE_TIMEOUT_MS), TESTCASE_TIMEOUT_MS);
        const outcome = await Promise.race([
          Promise.resolve(fn(rule)),
          new Promise((resolve) => setTimeout(() => resolve(false), timeout)),
        ]);
        const normalized = typeof outcome === "object" && outcome !== null
          ? outcome
          : outcome
            ? pass()
            : fail(rule.message || rule.name || "Validation failed.");
        results.push({
          ...rule,
          passed: Boolean(normalized.passed),
          message: normalized.passed ? rule.message : normalized.message || rule.message || rule.name,
          actual: normalized.actual,
        });
      } catch (error) {
        results.push({ ...rule, passed: false, error: serialize(error), message: error?.message || rule.message || rule.name });
      }
    }
    post("evaluation", { results }, seq);
  };

  window.addEventListener("message", async (event) => {
    if (event.data?.source !== "codequest-host") return;
    const request = event.data;
    state.messageQueue = state.messageQueue
      .catch(() => {})
      .then(async () => {
        state.seq = request.seq;
        try {
          if (request.type === "render") await render(request.payload, request.seq);
          if (request.type === "evaluate") await evaluate(request.payload.rules, request.seq);
        } catch (error) {
          if (!error.__codeQuestReported) reportError("runtime", error, { seq: request.seq });
        }
      });
  });

  post("ready");
})();
`;

export const createPreviewDocument = () => `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      html, body { min-height: 100%; margin: 0; font-family: system-ui, sans-serif; }
      *, *::before, *::after { box-sizing: border-box; }
    </style>
  </head>
  <body>
    <script>${escapeScript(babelSource)}</script>
    <script>${escapeScript(reactSource)}</script>
    <script>${escapeScript(reactDomSource)}</script>
    <script>${escapeScript(sandboxRuntime)}</script>
  </body>
</html>`;
