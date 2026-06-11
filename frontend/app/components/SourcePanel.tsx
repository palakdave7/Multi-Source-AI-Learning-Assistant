"use client";
import { useState } from "react";
import {
  Play,
  FileText,
  Presentation,
  Globe,
  Loader2,
  CheckCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const API = `${process.env.NEXT_PUBLIC_API_URL}/api/ingest`;

interface Props {
  sessionId: string;
  sources: any[];
  setSources: (s: any[]) => void;
}

export default function SourcePanel({ sessionId, sources, setSources }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [webUrl, setWebUrl] = useState("");
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  async function ingestYoutube() {
    if (!youtubeUrl.trim()) return;
    await ingest("youtube", { session_id: sessionId, url: youtubeUrl });
    setYoutubeUrl("");
  }

  async function ingestUrl() {
    if (!webUrl.trim()) return;
    await ingest("url", { session_id: sessionId, url: webUrl });
    setWebUrl("");
  }

  async function ingestFile(file: File, type: "pdf" | "pptx") {
    setLoading(true);
    setError("");
    const form = new FormData();
    form.append("session_id", sessionId);
    form.append("file", file);
    try {
      const res = await fetch(`${API}/${type}`, { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed");
      setSources([...sources, data.source]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function ingest(type: string, body: Record<string, string>) {
    setLoading(true);
    setError("");
    try {
      const form = new URLSearchParams(body);
      const res = await fetch(`${API}/${type}`, {
        method: "POST",
        body: form,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed");
      setSources([...sources, data.source]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const sourceIcon = (type: string) => {
    if (type === "youtube") return <Play size={14} className="text-red-400" />;
    if (type === "pdf") return <FileText size={14} className="text-blue-400" />;
    if (type === "pptx")
      return <Presentation size={14} className="text-orange-400" />;
    return <Globe size={14} className="text-green-400" />;
  };

  return (
    <aside className="w-80 min-w-[280px] bg-[#161b27] border-r border-slate-700 flex flex-col h-full">
      <div className="p-4 border-b border-slate-700">
        <h1 className="text-lg font-bold text-white">📚 Samasocial AI</h1>
        <p className="text-xs text-slate-400 mt-1">
          Add sources to start learning
        </p>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4">
        {/* YouTube */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Play size={12} className="text-red-400" /> YouTube URL
          </label>
          <input
            className="w-full bg-slate-800 text-sm text-white rounded-lg px-3 py-2 border border-slate-600 focus:outline-none focus:border-indigo-500"
            placeholder="https://youtube.com/watch?v=..."
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && ingestYoutube()}
          />
          <button
            onClick={ingestYoutube}
            disabled={loading || !youtubeUrl.trim()}
            className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-sm rounded-lg py-2 transition"
          >
            Add Video
          </button>
        </div>

        {/* Web URL */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Globe size={12} className="text-green-400" /> Webpage URL
          </label>
          <input
            className="w-full bg-slate-800 text-sm text-white rounded-lg px-3 py-2 border border-slate-600 focus:outline-none focus:border-indigo-500"
            placeholder="https://example.com/article"
            value={webUrl}
            onChange={(e) => setWebUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && ingestUrl()}
          />
          <button
            onClick={ingestUrl}
            disabled={loading || !webUrl.trim()}
            className="w-full bg-green-700 hover:bg-green-800 disabled:opacity-40 text-white text-sm rounded-lg py-2 transition"
          >
            Add Webpage
          </button>
        </div>

        {/* PDF */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <FileText size={12} className="text-blue-400" /> PDF File
          </label>
          <label className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-dashed border-slate-600 rounded-lg py-3 cursor-pointer transition text-sm text-slate-300">
            <FileText size={14} /> Click to upload PDF
            <input
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) =>
                e.target.files?.[0] && ingestFile(e.target.files[0], "pdf")
              }
            />
          </label>
        </div>

        {/* PPTX */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Presentation size={12} className="text-orange-400" /> PowerPoint
          </label>
          <label className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-dashed border-slate-600 rounded-lg py-3 cursor-pointer transition text-sm text-slate-300">
            <Presentation size={14} /> Click to upload PPTX
            <input
              type="file"
              accept=".pptx"
              className="hidden"
              onChange={(e) =>
                e.target.files?.[0] && ingestFile(e.target.files[0], "pptx")
              }
            />
          </label>
        </div>

        {/* Loading */}
        {loading && (
          <div className="bg-indigo-950 border border-indigo-700 rounded-lg p-3 space-y-1">
            <div className="flex items-center gap-2 text-indigo-400 text-sm font-medium">
              <Loader2 size={14} className="animate-spin" /> Processing
              source...
            </div>
            <p className="text-xs text-indigo-300 opacity-70">
              Extracting content, building embeddings. This may take ~30s.
            </p>
          </div>
        )}

        {/* Error */}
        {error && <p className="text-red-400 text-xs">{error}</p>}
      </div>

      {/* Loaded Sources */}
      {sources.length > 0 && (
        <div className="border-t border-slate-700 p-4 space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Loaded Sources
          </p>
          {sources.map((s, i) => (
            <div key={i} className="bg-slate-800 rounded-lg p-2">
              <button
                className="w-full flex items-center justify-between gap-2 text-left"
                onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
              >
                <span className="flex items-center gap-1 text-xs text-white font-medium truncate">
                  {sourceIcon(s.type)} {s.label}
                </span>
                <span className="text-slate-400 flex-shrink-0">
                  {expandedIdx === i ? (
                    <ChevronUp size={12} />
                  ) : (
                    <ChevronDown size={12} />
                  )}
                </span>
              </button>
              {expandedIdx === i && s.summary && (
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  {s.summary}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}
