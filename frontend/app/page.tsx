"use client";
import { useState, useEffect } from "react";
import SourcePanel from "./components/SourcePanel";
import ChatPanel from "./components/ChatPanel";
import { PanelLeftOpen, PanelLeftClose } from "lucide-react";

export default function Home() {
  const [sessionId, setSessionId] = useState<string>("");
  const [sources, setSources] = useState<any[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ingest/new-session`, {
      method: "POST",
    })
      .then((r) => r.json())
      .then((d) => setSessionId(d.session_id));
  }, []);

  return (
    <main className="flex h-screen overflow-hidden relative">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-10 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed md:relative z-20 h-full transition-transform duration-300
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}
      >
        <SourcePanel
          sessionId={sessionId}
          sources={sources}
          setSources={setSources}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      {/* Main chat */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-slate-700 bg-[#161b27]">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-slate-400 hover:text-white transition"
          >
            {sidebarOpen ? (
              <PanelLeftClose size={20} />
            ) : (
              <PanelLeftOpen size={20} />
            )}
          </button>
          <span className="text-white font-semibold text-sm">
            📚 Samasocial AI
          </span>
          {sources.length > 0 && (
            <span className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full">
              {sources.length} source{sources.length > 1 ? "s" : ""}
            </span>
          )}
        </div>

        <ChatPanel sessionId={sessionId} sources={sources} />
      </div>
    </main>
  );
}
