import { memo, useCallback, useMemo, useState } from "react";
import Editor from "@monaco-editor/react";
import {
  ChevronDown,
  ChevronRight,
  FileCode2,
  FileText,
  Folder,
  MessageCircle,
  PanelLeft,
  Play,
  Plus,
} from "lucide-react";
import LivePreview from "../preview/LivePreview";
import ChallengeChat from "./ChallengeChat";
import { handleApplicationError } from "../../../utils/safeLogger";

const jsExtensions = [".jsx", ".js", ".tsx", ".ts"];

const editorLanguageForFile = (path) => {
  if (path.endsWith(".css")) return "css";
  if (path.endsWith(".json")) return "json";
  if (path.endsWith(".html")) return "html";
  if (jsExtensions.some((extension) => path.endsWith(extension))) return "javascript";
  return "plaintext";
};

const getDisplayName = (path) => path.split("/").pop();
const getFolderName = (path) => path.split("/").filter(Boolean).pop() || path;

const buildFileTree = (paths) => {
  const root = {};
  paths.forEach((path) => {
    const parts = path.split("/");
    let cursor = root;
    parts.forEach((part, index) => {
      const isFile = index === parts.length - 1;
      if (!cursor[part]) {
        cursor[part] = isFile ? { type: "file", path } : { type: "folder", children: {} };
      }
      if (!isFile) cursor = cursor[part].children;
    });
  });
  return root;
};

const sortTreeEntries = (entries) =>
  entries.sort(([nameA, nodeA], [nameB, nodeB]) => {
    if (nodeA.type !== nodeB.type) return nodeA.type === "folder" ? -1 : 1;
    return nameA.localeCompare(nameB);
  });

const defaultOpenFolders = (paths) => {
  const folders = {};
  paths.forEach((path) => {
    const parts = path.split("/");
    parts.slice(0, -1).reduce((prefix, part) => {
      const next = prefix ? `${prefix}/${part}` : part;
      folders[next] = true;
      return next;
    }, "");
  });
  return folders;
};

function ReactWorkspace({
  botMessages,
  challenge,
  files,
  onFilesChange,
  previewRef,
  setBotMessages,
}) {
  const [activeFile, setActiveFile] = useState(files["src/App.jsx"] !== undefined ? "src/App.jsx" : Object.keys(files)[0]);
  const [newFileName, setNewFileName] = useState("");
  const [activeSidePanel, setActiveSidePanel] = useState("preview");
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [leftPanelView, setLeftPanelView] = useState("files");
  const [openFolders, setOpenFolders] = useState(() => defaultOpenFolders(Object.keys(files)));
  const showBot = Boolean(challenge.chatbotEnabled);
  const paths = useMemo(() => Object.keys(files).sort(), [files]);
  const fileTree = useMemo(() => buildFileTree(paths), [paths]);
  const previewChallenge = useMemo(
    () => ({ ...challenge, galaxy: "react", technology: "react" }),
    [challenge],
  );
  const previewCode = useMemo(() => ({ files }), [files]);
  const handlePreviewError = useCallback(() => handleApplicationError("React preview runtime error"), []);

  const updateFile = (value) => {
    onFilesChange((current) => ({
      ...current,
      [activeFile]: value || "",
    }));
  };

  const addComponent = () => {
    const cleanName = newFileName.trim().replace(/[^A-Za-z0-9]/g, "");
    if (!cleanName) return;
    const fileName = `src/components/${cleanName}.jsx`;
    onFilesChange((current) => ({
      ...current,
      [fileName]: current[fileName] || `export default function ${cleanName}() {\n  return <div className="${cleanName.toLowerCase()}">${cleanName}</div>;\n}\n`,
    }));
    setOpenFolders((current) => ({ ...current, src: true, "src/components": true }));
    setActiveFile(fileName);
    setNewFileName("");
  };

  const toggleFolder = (path) => {
    setOpenFolders((current) => ({ ...current, [path]: !current[path] }));
  };

  const renderTree = (tree, parentPath = "", depth = 0) =>
    sortTreeEntries(Object.entries(tree)).map(([name, node]) => {
      const path = parentPath ? `${parentPath}/${name}` : name;
      if (node.type === "folder") {
        const isOpen = openFolders[path] ?? true;
        return (
          <div className="react-tree-group" key={path}>
            <button
              type="button"
              className="react-tree-folder"
              onClick={() => toggleFolder(path)}
              style={{ "--tree-depth": depth }}
              title={path}
            >
              {isOpen ? <ChevronDown /> : <ChevronRight />}
              <Folder />
              <span>{getFolderName(path)}</span>
            </button>
            {isOpen && <div className="react-tree-children">{renderTree(node.children, path, depth + 1)}</div>}
          </div>
        );
      }

      return (
        <button
          type="button"
          key={path}
          className={`react-tree-file ${activeFile === node.path ? "is-active" : ""}`}
          onClick={() => setActiveFile(node.path)}
          style={{ "--tree-depth": depth }}
          title={node.path}
        >
          <FileCode2 />
          <span>{getDisplayName(node.path)}</span>
        </button>
      );
    });

  const showLeftPanel = !leftPanelCollapsed;
  const openLeftPanel = (panel) => {
    setLeftPanelView(panel);
    setLeftPanelCollapsed(false);
  };

  return (
    <div className={`react-workspace-layout ${leftPanelCollapsed ? "left-collapsed" : ""}`}>
      <nav className="react-activity-bar" aria-label="React workspace panels">
        <button
          type="button"
          className={showLeftPanel ? "is-active" : ""}
          title={showLeftPanel ? "Hide side panel" : "Show side panel"}
          onClick={() => setLeftPanelCollapsed((current) => !current)}
        >
          <PanelLeft />
        </button>
        <button
          type="button"
          className={showLeftPanel && leftPanelView === "question" ? "is-active" : ""}
          title="Question description"
          onClick={() => openLeftPanel("question")}
        >
          <FileText />
        </button>
        <button
          type="button"
          className={showLeftPanel && leftPanelView === "files" ? "is-active" : ""}
          title="Folder structure"
          onClick={() => openLeftPanel("files")}
        >
          <Folder />
        </button>
      </nav>

      {showLeftPanel && (
        <aside className="react-side-panel">
          {leftPanelView === "question" ? (
            <section className="react-question-panel">
              <div className="react-question-header">
                <span>Question</span>
                <h2>{challenge.title}</h2>
                <div className="react-question-meta">
                  <span>{challenge.difficulty}</span>
                  <span>{challenge.xpPoints} XP</span>
                </div>
              </div>
              <div className="react-question-body">
                <p>{challenge.description || "Build the requested React interface and satisfy the visible checks."}</p>
              </div>
            </section>
          ) : (
            <section className="react-file-explorer">
              <div className="react-file-explorer-title">
                <Folder />
                <span>Workspace</span>
              </div>
              <div className="react-file-list">
                {renderTree(fileTree)}
              </div>
              <div className="react-new-file">
                <input
                  value={newFileName}
                  onChange={(event) => setNewFileName(event.target.value)}
                  placeholder="ComponentName"
                />
                <button type="button" onClick={addComponent} title="Add component">
                  <Plus />
                </button>
              </div>
            </section>
          )}
        </aside>
      )}

      <main className="react-editor-panel">
        <div className="editor-language-tabs react-file-tabs">
          <button type="button" className="is-active">{activeFile}</button>
        </div>
        <div className="monaco-shell workspace-monaco-shell">
          <Editor
            height="100%"
            language={editorLanguageForFile(activeFile)}
            theme="vs-dark"
            value={files[activeFile] || ""}
            onChange={updateFile}
            loading={<div className="cq-skel-monaco-boot" aria-hidden />}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: "on",
              wordWrap: "on",
              smoothScrolling: true,
              tabSize: 2,
              padding: { top: 16 },
              scrollBeyondLastLine: false,
              automaticLayout: true,
            }}
          />
        </div>
      </main>

      <aside className="react-preview-panel workspace-preview-pane">
        <div className={`workspace-panel-tabs ${showBot ? "" : "single-tab"}`}>
          <button
            type="button"
            className={activeSidePanel === "preview" ? "is-active" : ""}
            onClick={() => setActiveSidePanel("preview")}
          >
            <Play />
            Live Preview
          </button>
          {showBot && (
            <button
              type="button"
              className={activeSidePanel === "bot" ? "is-active" : ""}
              onClick={() => setActiveSidePanel("bot")}
            >
              <MessageCircle />
              Ask Bot
            </button>
          )}
        </div>
        <div className={`workspace-panel-surface ${activeSidePanel === "preview" ? "is-active" : ""}`} aria-hidden={activeSidePanel !== "preview"}>
          <LivePreview
            challenge={previewChallenge}
            code={previewCode}
            onError={handlePreviewError}
            ref={previewRef}
            testCases={challenge.validationRules}
          />
        </div>
        {showBot && (
          <div className={`workspace-panel-surface ${activeSidePanel === "bot" ? "is-active" : ""}`} aria-hidden={activeSidePanel !== "bot"}>
            <ChallengeChat
              challenge={challenge}
              code={files}
              messages={botMessages}
              setMessages={setBotMessages}
            />
          </div>
        )}
      </aside>
    </div>
  );
}

export default memo(ReactWorkspace);
