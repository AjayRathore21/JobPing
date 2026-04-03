import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Input,
  Button,
  Avatar,
  Typography,
  Tooltip,
  Tag,
  Modal,
  message as antdMessage,
  type InputRef,
} from "antd";
import axios from "axios";
import { useUserStore } from "../../store/userStore";
import {
  SendOutlined,
  RobotOutlined,
  UserOutlined,
  ClearOutlined,
  ThunderboltOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  StopOutlined,
} from "@ant-design/icons";
import "./JobSearchPage.scss";

const { Text } = Typography;

// --- Types ---
interface Message {
  id: string;
  role: "user" | "agent";
  content: string;
  timestamp: Date;
  isTyping?: boolean;
}

// --- Mock Conversation ---
const MOCK_INITIAL_MESSAGES: Message[] = [
  {
    id: "1",
    role: "agent",
    content:
      "👋 Hi! I'm your AI Job Search Agent. Tell me what kind of role you're looking for — include your skills, preferred location, and experience level — and I'll find the best opportunities for you.",
    timestamp: new Date(Date.now() - 60000),
  },
];

const SUGGESTED_PROMPTS = [
  "Find Senior React Developer roles in US, remote",
  "Show me backend Python jobs at startups",
  "Machine learning engineer roles, $150k+",
  "Product manager roles at FAANG companies",
];

// --- Utility ---
const formatTime = (date: Date): string => {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const generateId = () => Math.random().toString(36).slice(2, 9);

// --- Typing Indicator Component ---
const TypingIndicator: React.FC = () => (
  <div className="typing-indicator">
    <span />
    <span />
    <span />
  </div>
);

// --- Message Bubble Component ---
const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
  const isUser = message.role === "user";

  const formatContent = (text: string) => {
    return text.split("\n").map((line, i) => {
      // Bold text wrapped in ** and [text](url) links
      const parts = line.split(/(\*\*.*?\*\*|\[.*?\]\(.*?\))/g);
      return (
        <span key={i}>
          {parts.map((part, j) => {
            if (part.startsWith("**") && part.endsWith("**")) {
              return <strong key={j}>{part.slice(2, -2)}</strong>;
            }
            if (part.startsWith("[") && part.includes("](")) {
              const match = part.match(/\[(.*?)\]\((.*?)\)/);
              if (match) {
                return (
                  <a
                    key={j}
                    href={match[2]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="chat-link"
                  >
                    {match[1]}
                  </a>
                );
              }
            }
            return part;
          })}
          {i < text.split("\n").length - 1 && <br />}
        </span>
      );
    });
  };

  return (
    <div className={`message-row ${isUser ? "message-row--user" : "message-row--agent"}`}>
      {!isUser && (
        <Avatar
          icon={<RobotOutlined />}
          className="message-avatar message-avatar--agent"
          size={36}
        />
      )}
      <div className="message-bubble-wrapper">
        <div className={`message-bubble ${isUser ? "message-bubble--user" : "message-bubble--agent"}`}>
          {message.isTyping ? (
            <TypingIndicator />
          ) : (
            <p className="message-text">{formatContent(message.content)}</p>
          )}
        </div>
        {!message.isTyping && (
          <Text className={`message-time ${isUser ? "message-time--user" : ""}`}>
            {formatTime(message.timestamp)}
          </Text>
        )}
      </div>
      {isUser && (
        <Avatar
          icon={<UserOutlined />}
          className="message-avatar message-avatar--user"
          size={36}
        />
      )}
    </div>
  );
};

// --- Main Page ---
const JobSearchPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>(MOCK_INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState("");
  const [isAgentTyping, setIsAgentTyping] = useState(false);
  const [backendUrl, setBackendUrl] = useState(() => localStorage.getItem("agent_backend_url") || "http://localhost:8000");
  const [isOnline, setIsOnline] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newBackendUrl, setNewBackendUrl] = useState(backendUrl);

  const user = useUserStore((state) => state.user);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<InputRef>(null);

  // --- Health Check ---
  useEffect(() => {
    const checkHealth = async () => {
      try {
        await axios.get(`${backendUrl}/health`, { timeout: 3000 });
        setIsOnline(true);
      } catch {
        setIsOnline(false);
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 10000); // Check every 10s
    return () => clearInterval(interval);
  }, [backendUrl]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isAgentTyping, scrollToBottom]);

  const getAgentResponse = useCallback(
    async (text: string) => {
      setIsAgentTyping(true);

      try {
        const response = await axios.post(`${backendUrl}/chat`, {
          message: text,
          thread_id: user?.id || "anonymous-user",
        }, {
          headers: {
            "Content-Type": "application/json",
          }
        });

        const agentReply = response.data?.response || "I'm sorry, I couldn't process that.";
        
        setMessages((prev: Message[]) => [
          ...prev,
          {
            id: generateId(),
            role: "agent",
            content: agentReply,
            timestamp: new Date(),
          },
        ]);
      } catch (axError) {
        console.error("Agent error:", axError);
        antdMessage.error("Failed to connect to the search agent.");
        setMessages((prev) => [
          ...prev,
          {
            id: generateId(),
            role: "agent",
            content: "⚠️ I'm having trouble connecting to my brain right now. Please check if the backend server is running.",
            timestamp: new Date(),
          },
        ]);
      } finally {
        setIsAgentTyping(false);
      }
    },
    [backendUrl, user?.id]
  );

  const handleSend = useCallback(() => {
    const text = inputValue.trim();
    if (!text || isAgentTyping) return;

    const userMsg: Message = {
      id: generateId(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev: Message[]) => [...prev, userMsg]);
    setInputValue("");
    getAgentResponse(text);
  }, [inputValue, isAgentTyping, getAgentResponse]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestedPrompt = (prompt: string) => {
    setInputValue(prompt);
    inputRef.current?.focus();
  };

  const handleClearChat = () => {
    setMessages(MOCK_INITIAL_MESSAGES);
    setIsAgentTyping(false);
  };

  const handleSaveSettings = () => {
    let url = newBackendUrl.trim();
    if (url && !url.startsWith("http")) url = "http://" + url;
    setBackendUrl(url);
    localStorage.setItem("agent_backend_url", url);
    setIsModalVisible(false);
    antdMessage.success("Backend URL updated");
  };

  return (
    <div className="job-search-page">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header__left">
          <div className={`agent-status-dot ${isOnline ? "agent-status-dot--online" : "agent-status-dot--offline"}`} />
          <div>
            <h2 className="chat-header__title">
              <ThunderboltOutlined className="chat-header__icon" /> Job Search Agent
            </h2>
            <Text className="chat-header__subtitle">
              Base URL: {backendUrl}
            </Text>
          </div>
        </div>
        <div className="chat-header__actions">
          <Tag 
            color={isOnline ? "green" : "red"} 
            icon={isOnline ? <CheckCircleOutlined /> : <StopOutlined />}
            className="status-tag"
          >
            {isOnline ? "Online" : "Offline"}
          </Tag>
          <Tooltip title="Agent Settings">
            <Button
              type="text"
              icon={<SettingOutlined />}
              onClick={() => {
                setNewBackendUrl(backendUrl);
                setIsModalVisible(true);
              }}
              className="settings-btn"
            />
          </Tooltip>
          <Tooltip title="Clear chat history">
            <Button
              type="text"
              icon={<ClearOutlined />}
              onClick={handleClearChat}
              className="clear-btn"
              id="clear-chat-btn"
            />
          </Tooltip>
        </div>
      </div>

      {/* Messages Area */}
      <div className="chat-messages" id="chat-messages-container">
        <div className="chat-messages__inner">
          {messages.map((msg: Message) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

          {isAgentTyping && (
            <div className="message-row message-row--agent">
              <Avatar
                icon={<RobotOutlined />}
                className="message-avatar message-avatar--agent"
                size={36}
              />
              <div className="message-bubble-wrapper">
                <div className="message-bubble message-bubble--agent">
                  <TypingIndicator />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Suggested Prompts */}
      {messages.length <= 2 && !isAgentTyping && (
        <div className="suggested-prompts">
          <Text className="suggested-prompts__label">Try asking:</Text>
          <div className="suggested-prompts__list">
            {SUGGESTED_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                className="prompt-chip"
                onClick={() => handleSuggestedPrompt(prompt)}
                id={`prompt-${prompt.slice(0, 20).replace(/\s+/g, "-").toLowerCase()}`}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="chat-input-area">
        <div className="chat-input-container">
          <Input
            ref={inputRef}
            id="job-search-input"
            className="chat-input"
            placeholder="Describe the job you're looking for..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isAgentTyping}
            maxLength={500}
            suffix={
              <Text className="char-counter">
                {inputValue.length}/500
              </Text>
            }
          />
          <Button
            id="send-message-btn"
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSend}
            disabled={!inputValue.trim() || isAgentTyping}
            className="send-btn"
            aria-label="Send message"
          />
        </div>
        <Text className="input-hint">
          Press <kbd>Enter</kbd> to send &middot; <kbd>Shift+Enter</kbd> for new line
        </Text>
      </div>

      {/* Settings Modal */}
      <Modal
        title={<span><SettingOutlined /> Agent Settings</span>}
        open={isModalVisible}
        onOk={handleSaveSettings}
        onCancel={() => setIsModalVisible(false)}
        okText="Save Changes"
        centered
        className="settings-modal"
      >
        <div style={{ padding: "10px 0" }}>
          <Text strong style={{ display: "block", marginBottom: 8 }}>
            Agent Backend URL
          </Text>
          <Input 
            placeholder="e.g. http://localhost:8000" 
            value={newBackendUrl}
            onChange={(e) => setNewBackendUrl(e.target.value)}
          />
          <Text type="secondary" style={{ fontSize: 12, marginTop: 8, display: "block" }}>
            The UI will attempt to connect to <code>{newBackendUrl || 'URL'}/chat</code> and <code>{newBackendUrl || 'URL'}/health</code>.
          </Text>
        </div>
      </Modal>
    </div>
  );
};

export default JobSearchPage;
