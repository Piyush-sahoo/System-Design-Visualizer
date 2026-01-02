import { Loader2, MessageCircle, Send, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
    generateDesignFromChat,
    getInitialMessage,
    sendChatMessage,
} from "../services/conversationService";

const ChatBuilder = ({ onDesignGenerated, onCancel, apiKey, provider }) => {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isReadyToGenerate, setIsReadyToGenerate] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Initialize with AI greeting
    useEffect(() => {
        const initialMsg = getInitialMessage();
        setMessages([initialMsg]);
    }, []);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Focus input after AI responds
    useEffect(() => {
        if (!isLoading && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isLoading]);

    const handleSend = async () => {
        if (!inputValue.trim() || isLoading) return;

        const userMessage = inputValue.trim();
        setInputValue("");
        setIsLoading(true);

        // Add user message
        const newMessages = [...messages, { role: "user", content: userMessage }];
        setMessages(newMessages);

        try {
            const response = await sendChatMessage(newMessages, userMessage, apiKey, provider);
            setMessages([
                ...newMessages,
                { role: "assistant", content: response.message },
            ]);
            setIsReadyToGenerate(response.isReadyToGenerate);
        } catch (error) {
            console.error("Chat error:", error);
            setMessages([
                ...newMessages,
                {
                    role: "assistant",
                    content:
                        "Sorry, I encountered an error. Let's try again - what were you saying?",
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const design = await generateDesignFromChat(messages, apiKey, provider);
            onDesignGenerated(design);
        } catch (error) {
            console.error("Generation error:", error);
            setMessages([
                ...messages,
                {
                    role: "assistant",
                    content:
                        "Sorry, I had trouble generating the design. Let me try again...",
                },
            ]);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div
            className="w-full max-w-4xl mx-auto h-[calc(100vh-120px)] flex flex-col rounded-xl overflow-hidden"
            style={{
                backgroundColor: "var(--bg-secondary)",
                border: "1px solid var(--border-secondary)",
            }}
        >
            {/* Header */}
            <div
                className="px-6 py-4 flex items-center justify-between"
                style={{
                    borderBottom: "1px solid var(--border-secondary)",
                    backgroundColor: "var(--bg-tertiary)",
                }}
            >
                <div className="flex items-center gap-3">
                    <div
                        className="p-2 rounded-lg"
                        style={{
                            backgroundColor: "var(--accent-blue-glow)",
                            border: "1px solid var(--accent-blue)",
                        }}
                    >
                        <MessageCircle
                            className="w-5 h-5"
                            style={{ color: "var(--accent-blue)" }}
                        />
                    </div>
                    <div>
                        <h2
                            className="text-lg font-bold"
                            style={{ color: "var(--text-primary)" }}
                        >
                            Design Builder
                        </h2>
                        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                            Tell me about your project
                        </p>
                    </div>
                </div>
                <button
                    onClick={onCancel}
                    className="px-4 py-1.5 rounded-lg text-sm transition-all"
                    style={{
                        backgroundColor: "var(--interactive-bg)",
                        color: "var(--text-secondary)",
                        border: "1px solid var(--border-primary)",
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "var(--interactive-hover)";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "var(--interactive-bg)";
                    }}
                >
                    Cancel
                </button>
            </div>

            {/* Messages */}
            <div
                className="flex-1 overflow-y-auto p-6 space-y-4"
                style={{ backgroundColor: "var(--bg-primary)" }}
            >
                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                        <div
                            className={`max-w-[80%] px-4 py-3 rounded-2xl ${msg.role === "user" ? "rounded-br-md" : "rounded-bl-md"
                                }`}
                            style={{
                                backgroundColor:
                                    msg.role === "user"
                                        ? "var(--accent-blue)"
                                        : "var(--bg-tertiary)",
                                color:
                                    msg.role === "user" ? "white" : "var(--text-primary)",
                                border:
                                    msg.role === "user"
                                        ? "none"
                                        : "1px solid var(--border-secondary)",
                            }}
                        >
                            <p className="text-sm whitespace-pre-wrap leading-relaxed">
                                {msg.content.split("**").map((part, i) =>
                                    i % 2 === 1 ? (
                                        <strong key={i}>{part}</strong>
                                    ) : (
                                        <span key={i}>{part}</span>
                                    )
                                )}
                            </p>
                        </div>
                    </div>
                ))}

                {/* Typing Indicator */}
                {isLoading && (
                    <div className="flex justify-start">
                        <div
                            className="px-4 py-3 rounded-2xl rounded-bl-md"
                            style={{
                                backgroundColor: "var(--bg-tertiary)",
                                border: "1px solid var(--border-secondary)",
                            }}
                        >
                            <div className="flex items-center gap-1.5">
                                <div
                                    className="w-2 h-2 rounded-full animate-bounce"
                                    style={{
                                        backgroundColor: "var(--text-muted)",
                                        animationDelay: "0ms",
                                    }}
                                />
                                <div
                                    className="w-2 h-2 rounded-full animate-bounce"
                                    style={{
                                        backgroundColor: "var(--text-muted)",
                                        animationDelay: "150ms",
                                    }}
                                />
                                <div
                                    className="w-2 h-2 rounded-full animate-bounce"
                                    style={{
                                        backgroundColor: "var(--text-muted)",
                                        animationDelay: "300ms",
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div
                className="p-4"
                style={{
                    borderTop: "1px solid var(--border-secondary)",
                    backgroundColor: "var(--bg-secondary)",
                }}
            >
                {/* Generate Button (shows when ready) */}
                {isReadyToGenerate && (
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="w-full mb-3 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                        style={{
                            backgroundColor: "var(--accent-emerald)",
                            color: "white",
                            boxShadow: "0 0 20px rgba(16, 185, 129, 0.3)",
                        }}
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Generating your design...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-5 h-5" />
                                Generate System Design
                            </>
                        )}
                    </button>
                )}

                {/* Message Input */}
                <div
                    className="flex items-center gap-3 p-2 rounded-xl"
                    style={{
                        backgroundColor: "var(--bg-tertiary)",
                        border: "1px solid var(--border-primary)",
                    }}
                >
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type your answer..."
                        disabled={isLoading || isGenerating}
                        className="flex-1 bg-transparent px-3 py-2 text-sm outline-none disabled:opacity-50"
                        style={{ color: "var(--text-primary)" }}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!inputValue.trim() || isLoading || isGenerating}
                        className="p-2.5 rounded-lg transition-all disabled:opacity-30"
                        style={{
                            backgroundColor: inputValue.trim()
                                ? "var(--accent-blue)"
                                : "var(--interactive-bg)",
                            color: inputValue.trim() ? "white" : "var(--text-muted)",
                        }}
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatBuilder;
