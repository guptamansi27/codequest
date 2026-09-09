import { useEffect, useRef, useState } from "react";
import { Bot, Send } from "lucide-react";
import aiService from "../../../services/aiService";
import { SkeletonBlock } from "../../ui/PremiumSkeleton";

const welcomeMessage = {
  role: "assistant",
  content: "Ask me for hints, debugging help, or concept explanations. I will guide you without giving away the full solution.",
};

const normalizeMessages = (messages = []) =>
  messages.length
    ? messages.map((message) =>
        typeof message === "string" ? { role: "assistant", content: message } : message
      )
    : [welcomeMessage];

export default function ChallengeChat({
  challenge,
  code,
  messages,
  setMessages,
}) {
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const messageListRef = useRef(null);

  const normalizedMessages = normalizeMessages(messages);

  useEffect(() => {
    if (!messages.length) {
      setMessages([welcomeMessage]);
    }
  }, [messages.length, setMessages]);

  useEffect(() => {
    const node = messageListRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [normalizedMessages.length, isLoading]);

  const sendMessage = async () => {
    const message = draft.trim();
    if (!message || isLoading) return;

    const userMessage = { role: "user", content: message };
    setMessages((current) => [...normalizeMessages(current), userMessage]);
    setDraft("");
    setError("");
    setIsLoading(true);

    try {
      const response = await aiService.challengeChat({
        challengeId: challenge.backendId,
        message,
        currentCode: code,
      });

      if (!response.success || !response.reply) {
        throw new Error("Ask Bot could not respond right now.");
      }

      setMessages((current) => [
        ...normalizeMessages(current),
        { role: "assistant", content: response.reply },
      ]);
    } catch (err) {
      const messageText = err.response?.data?.error || err.response?.data?.detail || err.message || "Ask Bot is unavailable right now.";
      setError(messageText);
      setMessages((current) => [
        ...normalizeMessages(current),
        { role: "assistant", content: "I could not answer that request. Try asking a smaller, more specific question." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="workspace-chatbot">
      <header className="bot-chat-header">
        <span><Bot /> CodeQuest Galaxy AI</span>
      </header>

      <div className="bot-message-list" ref={messageListRef}>
        {normalizedMessages.map((message, index) => (
          <div
            className={`bot-chat-message ${message.role === "user" ? "is-user" : "is-assistant"}`}
            key={`${message.role}-${index}-${message.content.slice(0, 16)}`}
          >
            <span>{message.role === "user" ? "You" : "Ask Bot"}</span>
            <p>{message.content}</p>
          </div>
        ))}
        {isLoading && (
          <div className="bot-chat-message is-assistant is-loading">
            <span>Ask Bot</span>
            <div className="bot-chat-loading-surface">
              <div className="bot-chat-skeleton" role="status" aria-live="polite" aria-label="AI assistant is preparing a response">
                <SkeletonBlock className="cq-skel-avatar" rounded="full" />
                <div>
                  <SkeletonBlock className="cq-skel-line cq-skel-line--lg" />
                  <SkeletonBlock className="cq-skel-line" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {error && <div className="bot-chat-error" role="status">{error}</div>}

      <form className="bot-input-row" onSubmit={(event) => {
        event.preventDefault();
        sendMessage();
      }}>
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask for a hint, explain an error, or describe where you are stuck..."
          rows={3}
          disabled={isLoading}
        />
        <button type="submit" className="bot-send-button" disabled={isLoading || !draft.trim()}>
          <Send />
          Send
        </button>
      </form>
    </div>
  );
}
