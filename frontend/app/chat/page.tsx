"use client";

import { useEffect, useRef, useState } from "react";
import { SendHorizonal } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";

type ChatRow = { role: "user" | "assistant"; content: string; created_at?: string };

const GREETING =
  "Hi! I'm your mental wellness companion. I can listen like a friend and share evidence-informed tips. How are you feeling today?";

export default function ChatPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [threadId, setThreadId] = useState<string>(""); 
  const bottomRef = useRef<HTMLDivElement>(null);

  
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const freshId = `session-${Date.now()}`;
      setThreadId(freshId);

      
      setMessages([{ role: "assistant", content: GREETING }]);

      
      await supabase.from("chat_messages").insert({
        user_id: user.id,
        role: "assistant",
        content: GREETING,
        thread_id: freshId,
      });
    })();
  }, []);

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
    if (!input.trim() || !userId || !threadId || loading) return;

    const text = input.trim();
    setInput("");
    setLoading(true);

    
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    await supabase.from("chat_messages").insert({
      user_id: userId,
      role: "user",
      content: text,
      thread_id: threadId,
    });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token ?? "";

      const configured = process.env.NEXT_PUBLIC_BACKEND_URL ?? "";
      const base = configured ? configured.replace(/\/+$/, "") : "";
      const endpoint = base ? `${base}/chat` : "/api/chat";

      const moodContext = await getMoodContext();

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          question: text,
          thread_id: threadId,
          context: { recent_moods: moodContext },
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const reply = data?.reply || "I'm here with you. Tell me more.";

      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);

    
    } catch (e) {
      console.error(e);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry—having trouble connecting. Try again soon." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      
      <NavBar />

     
      <main className="min-h-[calc(100vh-160px)] bg-sky-100 px-4 py-10 pt-24">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Chat Card */}
          <div className="bg-white rounded-2xl shadow-md border p-4 sm:p-6">
            <h1 className="text-2xl font-semibold text-blue-900 mb-4">SymptoCare Assistant</h1>

            {/* Messages */}
            <div className="h-[50vh] sm:h-[60vh] overflow-y-auto pr-1 space-y-4">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`p-4 px-5 rounded-2xl shadow-sm max-w-md text-sm whitespace-pre-wrap ${
                      m.role === "user"
                        ? "bg-blue-500 text-white ml-12"
                        : "bg-gray-50 text-gray-800 mr-12 border border-gray-200"
                    }`}
                  >
                    <p className="leading-relaxed">{m.content}</p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-gray-50 text-gray-800 p-4 px-5 rounded-2xl shadow-sm max-w-md border border-gray-200 mr-12">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                      </div>
                      <span className="text-sm text-gray-500">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

           
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              className="mt-4"
            >
              <div className="flex items-center gap-3">
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
                >
                  <SendHorizonal size={20} />
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      
      <Footer />
    </>
  );
}
