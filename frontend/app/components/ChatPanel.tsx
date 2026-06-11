"use client";
import { useState, useRef, useEffect } from "react";
import {
  Send,
  BookOpen,
  Loader2,
  Trash2,
  Copy,
  RefreshCw,
  Check,
  Layers,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSkeleton } from "./SkeletonLoader";

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

function FlashcardsView({
  flashcards,
  loading,
  onRegenerate,
}: {
  flashcards: { front: string; back: string }[];
  loading: boolean;
  onRegenerate: () => void;
}) {
  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    setFlipped(false);
  }, [current]);

  useEffect(() => {
    setCurrent(0);
    setFlipped(false);
    setFinished(false);
  }, [flashcards]);

  if (loading)
    return (
      <div className="flex items-center gap-2 text-indigo-400 py-10 justify-center">
        <Loader2 size={16} className="animate-spin" /> Generating flashcards...
      </div>
    );

  if (flashcards.length === 0)
    return (
      <div className="text-center text-slate-400 py-10">
        No flashcards generated yet.
      </div>
    );

  if (finished)
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4 py-10"
      >
        <div className="text-5xl">🎉</div>
        <h3 className="text-white text-xl font-bold">All cards reviewed!</h3>
        <p className="text-slate-400 text-sm">
          Great job studying these concepts.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setCurrent(0);
              setFlipped(false);
              setFinished(false);
            }}
            className="bg-slate-700 hover:bg-slate-600 text-white text-sm px-4 py-2 rounded-lg transition"
          >
            Review Again
          </button>
          <button
            onClick={onRegenerate}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-lg transition flex items-center gap-2"
          >
            <RefreshCw size={14} /> New Set
          </button>
        </div>
      </motion.div>
    );

  const card = flashcards[current];

  return (
    <div className="max-w-2xl mx-auto space-y-4 py-4">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>
          Card {current + 1} of {flashcards.length}
        </span>
        <button
          onClick={onRegenerate}
          className="flex items-center gap-1 hover:text-slate-200 transition"
        >
          <RefreshCw size={11} /> New set
        </button>
      </div>
      <div className="w-full bg-slate-700 rounded-full h-1.5">
        <div
          className="bg-indigo-500 h-1.5 rounded-full transition-all"
          style={{
            width: `${((current + 1) / flashcards.length) * 100}%`,
          }}
        />
      </div>

      <motion.div
        key={`${current}-${flipped}`}
        initial={{ opacity: 0, rotateY: 90 }}
        animate={{ opacity: 1, rotateY: 0 }}
        transition={{ duration: 0.2 }}
        onClick={() => setFlipped(!flipped)}
        className="cursor-pointer bg-slate-800 border border-slate-700 hover:border-indigo-500 rounded-2xl p-8 min-h-[200px] flex flex-col items-center justify-center text-center transition-colors"
      >
        <p className="text-xs text-slate-500 mb-3 uppercase tracking-wider">
          {flipped ? "Answer" : "Question — click to reveal"}
        </p>
        <p className="text-white text-base leading-relaxed">
          {flipped ? card.back : card.front}
        </p>
      </motion.div>

      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          disabled={current === 0}
          className="bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-white text-sm px-4 py-2 rounded-lg transition"
        >
          ← Previous
        </button>
        <p className="text-xs text-slate-500">Click card to flip</p>
        <button
          onClick={() => {
            if (current + 1 >= flashcards.length) setFinished(true);
            else setCurrent((c) => c + 1);
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-lg transition"
        >
          {current + 1 >= flashcards.length ? "Finish ✓" : "Next →"}
        </button>
      </div>
    </div>
  );
}

function QuizView({
  quiz,
  loading,
  onRegenerate,
}: {
  quiz: string;
  loading: boolean;
  onRegenerate: () => void;
}) {
  const [questions, setQuestions] = useState<any[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (!quiz) return;
    const parsed = parseQuiz(quiz);
    setQuestions(parsed);
    setCurrent(0);
    setSelected(null);
    setScore(0);
    setFinished(false);
  }, [quiz]);

  function parseQuiz(raw: string) {
    const blocks = raw.split(/\n(?=Q\d+\.)/);
    return blocks
      .map((block) => {
        const lines = block.trim().split("\n").filter(Boolean);
        const question = lines[0].replace(/^Q\d+\.\s*/, "").trim();
        const options: { key: string; text: string }[] = [];
        let answer = "";
        for (const line of lines.slice(1)) {
          const optMatch = line.match(/^([a-d])\)\s*(.+)/i);
          if (optMatch)
            options.push({
              key: optMatch[1].toLowerCase(),
              text: optMatch[2].trim(),
            });
          const ansMatch = line.match(/^Answer:\s*([a-d])/i);
          if (ansMatch) answer = ansMatch[1].toLowerCase();
        }
        return { question, options, answer };
      })
      .filter((q) => q.options.length > 0);
  }

  if (loading)
    return (
      <div className="flex items-center gap-2 text-indigo-400 py-10 justify-center">
        <Loader2 size={16} className="animate-spin" /> Generating quiz...
      </div>
    );

  if (questions.length === 0)
    return (
      <div className="text-center text-slate-400 py-10">
        No quiz generated yet.
      </div>
    );

  if (finished)
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4 py-10"
      >
        <div className="text-5xl">
          {score === questions.length
            ? "🏆"
            : score >= questions.length / 2
              ? "👍"
              : "📚"}
        </div>
        <h3 className="text-white text-xl font-bold">Quiz Complete!</h3>
        <p className="text-slate-400">
          You scored{" "}
          <span className="text-indigo-400 font-bold">
            {score}/{questions.length}
          </span>
        </p>
        <button
          onClick={onRegenerate}
          className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-lg transition flex items-center gap-2"
        >
          <RefreshCw size={14} /> New Quiz
        </button>
      </motion.div>
    );

  const q = questions[current];

  return (
    <div className="max-w-2xl mx-auto space-y-4 py-4">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>
          Question {current + 1} of {questions.length}
        </span>
        <span>
          Score: {score}/{current}
        </span>
      </div>
      <div className="w-full bg-slate-700 rounded-full h-1.5">
        <div
          className="bg-indigo-500 h-1.5 rounded-full transition-all"
          style={{ width: `${(current / questions.length) * 100}%` }}
        />
      </div>

      <motion.div
        key={current}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-slate-800 rounded-xl p-5"
      >
        <p className="text-white font-medium text-base leading-relaxed">
          {q.question}
        </p>
      </motion.div>

      <div className="space-y-2">
        {q.options.map((opt: { key: string; text: string }) => {
          let style =
            "bg-slate-800 border-slate-700 text-slate-200 hover:border-indigo-500";
          if (selected) {
            if (opt.key === q.answer)
              style = "bg-green-900 border-green-500 text-green-200";
            else if (opt.key === selected)
              style = "bg-red-900 border-red-500 text-red-200";
            else style = "bg-slate-800 border-slate-700 text-slate-500";
          }
          return (
            <motion.button
              key={opt.key}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              disabled={!!selected}
              onClick={() => {
                setSelected(opt.key);
                if (opt.key === q.answer) setScore((s) => s + 1);
              }}
              className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition ${style}`}
            >
              <span className="font-mono font-bold mr-2">
                {opt.key.toUpperCase()})
              </span>{" "}
              {opt.text}
            </motion.button>
          );
        })}
      </div>

      {selected && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <p
            className={`text-sm font-medium ${
              selected === q.answer ? "text-green-400" : "text-red-400"
            }`}
          >
            {selected === q.answer
              ? "✓ Correct!"
              : `✗ Correct answer: ${q.answer.toUpperCase()}) ${
                  q.options.find(
                    (o: { key: string; text: string }) => o.key === q.answer,
                  )?.text
                }`}
          </p>
          <button
            onClick={() => {
              if (current + 1 >= questions.length) setFinished(true);
              else {
                setCurrent((c) => c + 1);
                setSelected(null);
              }
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-lg transition"
          >
            {current + 1 >= questions.length ? "See Results" : "Next →"}
          </button>
        </motion.div>
      )}
    </div>
  );
}

export default function ChatPanel({ sessionId, sources }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [quizMode, setQuizMode] = useState(false);
  const [quiz, setQuiz] = useState("");
  const [quizLoading, setQuizLoading] = useState(false);
  const [flashcardMode, setFlashcardMode] = useState(false);
  const [flashcards, setFlashcards] = useState<
    { front: string; back: string }[]
  >([]);
  const [flashcardLoading, setFlashcardLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastUserMessage = useRef<string>("");

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, quiz]);

  async function sendMessage(overrideMessage?: string) {
    const userMsg = overrideMessage || input.trim();
    if (!userMsg || streaming || !sessionId) return;
    if (!overrideMessage) setInput("");
    if (!overrideMessage) {
      setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    }
    lastUserMessage.current = userMsg;
    setStreaming(true);
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
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          refs,
        };
        return updated;
      });
    } catch (e) {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1].content =
          "Error getting response. Please try again.";
        return updated;
      });
      toast.error("Failed to get response");
    } finally {
      setStreaming(false);
    }
  }

  async function regenerate() {
    if (!lastUserMessage.current) return;
    setMessages((prev) => prev.slice(0, -1));
    await sendMessage(lastUserMessage.current);
  }

  async function copyMessage(content: string, idx: number) {
    await navigator.clipboard.writeText(content);
    setCopiedIdx(idx);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedIdx(null), 2000);
  }

  async function loadQuiz() {
    setQuizLoading(true);
    setQuizMode(true);
    setFlashcardMode(false);
    try {
      const res = await fetch(`${API}/quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      });
      const data = await res.json();
      setQuiz(data.quiz);
    } catch {
      toast.error("Failed to generate quiz");
    } finally {
      setQuizLoading(false);
    }
  }

  async function loadFlashcards() {
    setFlashcardLoading(true);
    setFlashcardMode(true);
    setQuizMode(false);
    try {
      const res = await fetch(`${API}/flashcards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      });
      const data = await res.json();
      setFlashcards(data.flashcards);
    } catch {
      toast.error("Failed to generate flashcards");
    } finally {
      setFlashcardLoading(false);
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
              : `${sources.length} source${
                  sources.length > 1 ? "s" : ""
                } loaded — ask anything`}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <button
            onClick={() => {
              setQuizMode(false);
              setQuiz("");
              setFlashcardMode(false);
            }}
            className={`text-xs px-3 py-1.5 rounded-lg transition ${
              !quizMode && !flashcardMode
                ? "bg-indigo-600 text-white"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            Chat
          </button>
          <button
            onClick={loadQuiz}
            disabled={sources.length === 0}
            className={`text-xs px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
              quizMode
                ? "bg-indigo-600 text-white"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            } disabled:opacity-40`}
          >
            <BookOpen size={12} /> Quiz Me
          </button>
          <button
            onClick={loadFlashcards}
            disabled={sources.length === 0}
            className={`text-xs px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
              flashcardMode
                ? "bg-indigo-600 text-white"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            } disabled:opacity-40`}
          >
            <Layers size={12} /> Flashcards
          </button>
          <button
            onClick={() => {
              setMessages([]);
              toast.success("Chat cleared");
            }}
            className="text-xs px-3 py-1.5 rounded-lg bg-slate-700 text-slate-300 hover:bg-red-900 hover:text-red-300 transition flex items-center gap-1"
          >
            <Trash2 size={12} /> Clear
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-4 space-y-4">
        {flashcardMode ? (
          <FlashcardsView
            flashcards={flashcards}
            loading={flashcardLoading}
            onRegenerate={loadFlashcards}
          />
        ) : quizMode ? (
          <QuizView quiz={quiz} loading={quizLoading} onRegenerate={loadQuiz} />
        ) : (
          <>
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center justify-center h-full text-center gap-3 py-20"
              >
                <div className="text-5xl">🧠</div>
                <h3 className="text-white font-semibold text-lg">
                  {sources.length === 0
                    ? "Add a source to get started"
                    : "Ready to help you learn!"}
                </h3>
                <p className="text-slate-400 text-sm max-w-sm">
                  {sources.length === 0
                    ? "Upload a PDF, PPTX, paste a YouTube URL or webpage link from the left panel."
                    : `Ask anything about your ${sources.length} loaded source${sources.length > 1 ? "s" : ""}. Try: "explain this in simple terms" or "summarize the key points"`}
                </p>
                {sources.length > 0 && (
                  <div className="flex flex-wrap gap-2 justify-center mt-2">
                    {[
                      "Summarize the key points",
                      "Explain in simple terms",
                      "What are the main topics?",
                    ].map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => sendMessage(suggestion)}
                        className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-full border border-slate-600 transition"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div className="max-w-[75%] space-y-1">
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-800 text-slate-200"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      msg.content ? (
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            p: ({ children }) => (
                              <p className="mb-2 last:mb-0">{children}</p>
                            ),
                            ul: ({ children }) => (
                              <ul className="list-disc pl-4 mb-2 space-y-1">
                                {children}
                              </ul>
                            ),
                            ol: ({ children }) => (
                              <ol className="list-decimal pl-4 mb-2 space-y-1">
                                {children}
                              </ol>
                            ),
                            li: ({ children }) => (
                              <li className="text-sm">{children}</li>
                            ),
                            code: ({ children }) => (
                              <code className="bg-slate-700 px-1 py-0.5 rounded text-xs font-mono">
                                {children}
                              </code>
                            ),
                            strong: ({ children }) => (
                              <strong className="font-semibold text-white">
                                {children}
                              </strong>
                            ),
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      ) : (
                        streaming &&
                        i === messages.length - 1 && <MessageSkeleton />
                      )
                    ) : (
                      msg.content
                    )}
                  </div>

                  {msg.role === "assistant" && msg.content && (
                    <div className="flex items-center gap-2 px-1 flex-wrap">
                      <button
                        onClick={() => copyMessage(msg.content, i)}
                        className="text-slate-500 hover:text-slate-300 transition flex items-center gap-1 text-xs"
                      >
                        {copiedIdx === i ? (
                          <Check size={11} className="text-green-400" />
                        ) : (
                          <Copy size={11} />
                        )}
                        {copiedIdx === i ? "Copied" : "Copy"}
                      </button>
                      {i === messages.length - 1 && (
                        <button
                          onClick={regenerate}
                          disabled={streaming}
                          className="text-slate-500 hover:text-slate-300 transition flex items-center gap-1 text-xs disabled:opacity-40"
                        >
                          <RefreshCw size={11} /> Regenerate
                        </button>
                      )}
                      {msg.refs && msg.refs.length > 0 && (
                        <div className="flex flex-wrap gap-1 ml-1">
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
                  )}
                </div>
              </motion.div>
            ))}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {!quizMode && !flashcardMode && (
        <div className="px-6 py-4 border-t border-slate-700">
          <div className="flex gap-3 items-end">
            <textarea
              className="flex-1 bg-slate-800 text-white text-sm rounded-xl px-4 py-3 border border-slate-600 focus:outline-none focus:border-indigo-500 resize-none"
              placeholder={
                sources.length === 0
                  ? "Add a source first..."
                  : "Ask a question... (Enter to send, Shift+Enter for new line)"
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
              onClick={() => sendMessage()}
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
