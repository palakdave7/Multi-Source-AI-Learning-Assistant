"use client";
import { useState, useRef, useEffect } from "react";
import { Send, BookOpen, Loader2 } from "lucide-react";

const API = `${process.env.NEXT_PUBLIC_API_URL}/api/chat`;

interface Message {
  role: "user" | "assistant";
  content: string;
  refs?: string[];
}

interface Props {
  sessionId: string;
  sources: any[];
}

export default function ChatPanel({ sessionId, sources }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [quizMode, setQuizMode] = useState(false);
  const [quiz, setQuiz] = useState("");
  const [quizLoading, setQuizLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, quiz]);

  async function sendMessage() {
    if (!input.trim() || streaming || !sessionId) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setStreaming(true);

    const assistantIdx = messages.length + 1;
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const res = await fetch(`${API}/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, message: userMsg }),
      });

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let refs: string[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const json = JSON.parse(line.slice(6));
          if (json.token) {
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = {
                ...updated[updated.length - 1],
                content: updated[updated.length - 1].content + json.token,
              };
              return updated;
            });
          }
          if (json.done) refs = json.refs || [];
        }
      }

      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { ...updated[updated.length - 1], refs };
        return updated;
      });
    } catch (e) {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1].content = "Error getting response.";
        return updated;
      });
    } finally {
      setStreaming(false);
    }
  }

  async function loadQuiz() {
    setQuizLoading(true);
    setQuizMode(true);
    try {
      const res = await fetch(`${API}/quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      });
      const data = await res.json();
      setQuiz(data.quiz);
    } finally {
      setQuizLoading(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0f1117]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
        <div>
          <h2 className="text-white font-semibold">Learning Assistant</h2>
          <p className="text-xs text-slate-400">
            {sources.length === 0
              ? "Add sources from the left panel to begin"
              : `${sources.length} source${sources.length > 1 ? "s" : ""} loaded`}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setQuizMode(false);
              setQuiz("");
            }}
            className={`text-xs px-3 py-1.5 rounded-lg transition ${!quizMode ? "bg-indigo-600 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"}`}
          >
            Chat
          </button>
          <button
            onClick={loadQuiz}
            disabled={sources.length === 0}
            className={`text-xs px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${quizMode ? "bg-indigo-600 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"} disabled:opacity-40`}
          >
            <BookOpen size={12} /> Quiz Me
          </button>
        </div>
      </div>

      {/* Messages / Quiz */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-4 space-y-4">
        {quizMode ? (
          <div className="bg-slate-800 rounded-xl p-4">
            {quizLoading ? (
              <div className="flex items-center gap-2 text-indigo-400">
                <Loader2 size={14} className="animate-spin" /> Generating
                quiz...
              </div>
            ) : (
              <pre className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                {quiz}
              </pre>
            )}
          </div>
        ) : (
          <>
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-20">
                <div className="text-4xl">🧠</div>
                <p className="text-slate-400 text-sm max-w-xs">
                  {sources.length === 0
                    ? "Add a YouTube video, PDF, PPTX, or webpage to get started."
                    : "Ask anything about your loaded sources!"}
                </p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-800 text-slate-200"
                  }`}
                >
                  {msg.content ||
                    (streaming && i === messages.length - 1 && (
                      <span className="flex items-center gap-1 text-slate-400">
                        <Loader2 size={12} className="animate-spin" />{" "}
                        Thinking...
                      </span>
                    ))}
                  {msg.refs && msg.refs.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {msg.refs.map((ref, j) => (
                        <span
                          key={j}
                          className="text-xs bg-slate-700 text-indigo-300 px-2 py-0.5 rounded-full"
                        >
                          {ref}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {!quizMode && (
        <div className="px-6 py-4 border-t border-slate-700">
          <div className="flex gap-3 items-end">
            <textarea
              className="flex-1 bg-slate-800 text-white text-sm rounded-xl px-4 py-3 border border-slate-600 focus:outline-none focus:border-indigo-500 resize-none"
              placeholder={
                sources.length === 0
                  ? "Add a source first..."
                  : "Ask a question..."
              }
              rows={1}
              value={input}
              disabled={sources.length === 0 || streaming}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || streaming || sources.length === 0}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white p-3 rounded-xl transition"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
