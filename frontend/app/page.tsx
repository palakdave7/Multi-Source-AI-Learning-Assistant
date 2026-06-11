"use client";
import { useState, useEffect } from "react";
import SourcePanel from "./components/SourcePanel";
import ChatPanel from "./components/ChatPanel";

export default function Home() {
  const [sessionId, setSessionId] = useState<string>("");
  const [sources, setSources] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ingest/new-session`, {
      method: "POST",
    })
      .then((r) => r.json())
      .then((d) => setSessionId(d.session_id));
  }, []);

  return (
    <main className="flex h-screen overflow-hidden">
      <SourcePanel
        sessionId={sessionId}
        sources={sources}
        setSources={setSources}
      />
      <ChatPanel sessionId={sessionId} sources={sources} />
    </main>
  );
}
