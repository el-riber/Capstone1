
"use client";

import { useEffect, useRef, useState } from "react";
import { Brain, SendHorizonal } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type ChatRow = {
  role: "user" | "assistant";
  content: string;
  created_at?: string; 
};

type ChatPageProps = {
  
  threadId?: string;
  
  showHeader?: boolean;
  
  backHref?: string;
  
  title?: string;
  
  backendSavesAssistant?: boolean;
};

const DEFAULT_GREETING =
  "Hi! I'm your mental wellness companion. I can listen like a friend and share evidence-informed tips. How are you feeling today?";

export default function ChatPage({
  threadId = "default",
  showHeader = true,
  backHref = "/dashboard",
  title = "SymptoCare Assistant",
  backendSavesAssistant = true,
}: ChatPageProps) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data, error } = await supabase
        .from("chat_messages")
        .select("role, content, created_at")
        .eq("user_id", user.id)
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Load chat history error:", error);
        return;
      }

      const rows = (data as ChatRow[]) ?? [];
      if (!rows.length) {
        setMessages([{ role: "assistant", content: DEFAULT_GREETING }]);
        
        const { error: greetErr } = await supabase.from("chat_messages").insert({
          user_id: user.id,
          role: "assistant",
          content: DEFAULT_GREETING,
          thread_id: threadId,
        });
        if (greetErr) console.error("Seed greeting error:", greetErr);
      } else {
        setMessages(rows);
      }
    })();
  }, [threadId]);

  
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  
  const getMoodContext = async () => {
    if (!userId) return null;

    const { data: enhanced } = await supabase
      .from("enhanced_mood_entries")
      .select(
        "mood,mood_emoji,sleep_hours,sleep_quality,energy_level,social_interaction,medication_taken,triggers,reflection,created_at"
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5);

    if (enhanced?.length) return enhanced;

    const { data: simple } = await supabase
      .from("mood_entries")
      .select("mood,emoji,reflection,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5);

    return simple || [];
  };

  const sendMessage = async () => {
    if (!input.trim() || !userId || loading) return;

    const text = input.trim();
    setInput("");
    setLoading(true);

    
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    const { error: userInsertErr } = await supabase.from("chat_messages").insert({
      user_id: userId,
      role: "user",
      content: text,
      thread_id: threadId,
    });
    if (userInsertErr) console.error("Persist user message error:", userInsertErr);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      
      const configured = process.env.NEXT_PUBLIC_BACKEND_URL ?? "";
      const base = configured ? configured.replace(/\/+$/, "") : "";
      const endpoint = base ? `${base}/chat` : "/api/chat";

      const recentMoods = await getMoodContext(); 
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
         
          Authorization: `Bearer ${session?.access_token ?? ""}`,
        },
        body: JSON.stringify({
          question: text,
          thread_id: threadId,
          context: { recent_moods: recentMoods },
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const reply: string =
        data?.reply ||
        "I'm here with you. Could you share a little more about what’s on your mind?";

      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);

      
      if (!backendSavesAssistant) {
        const { error: asstErr } = await supabase.from("chat_messages").insert({
          user_id: userId,
          role: "assistant",
          content: reply,
          thread_id: threadId,
        });
        if (asstErr) console.error("Persist assistant message error:", asstErr);
      }
    } catch (e) {
      console.error("Chat error:", e);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I'm sorry—I'm having trouble connecting right now. Please try again shortly.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl">
      {/* Header */}
      {showHeader && (
        <nav className="bg-white shadow-md p-4 flex items-center justify-between rounded-t-xl">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full p-2">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-blue-900">{title}</h1>
          </div>
          {backHref && (
            <Link
              href={backHref}
              className="text-blue-600 hover:text-blue-800 hover:underline text-sm font-medium"
            >
              ← Back
            </Link>
          )}
        </nav>
      )}

      {/* Messages */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`p-4 px-5 rounded-2xl shadow-sm max-w-md text-sm whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-blue-500 text-white ml-12"
                  : "bg-white text-gray-800 mr-12 border border-gray-100"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-800 p-4 px-5 rounded-2xl shadow-sm max-w-md border border-gray-100 mr-12">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  />
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  />
                </div>
                <span className="text-sm text-gray-500">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage();
        }}
        className="bg-white p-4 border-t border-gray-200 shadow-lg rounded-b-xl"
      >
        <div className="flex items-center gap-3 max-w-4xl mx-auto">
          <input
            className="flex-1 border border-gray-300 rounded-full px-5 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500"
            placeholder="Ask about your mood, get wellness tips, or just reflect..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-full transition-colors duration-200 flex items-center justify-center min-w-[50px]"
            aria-label="Send message"
            title="Send"
          >
            <SendHorizonal size={20} />
          </button>
        </div>
      </form>
    </div>
  );
}
