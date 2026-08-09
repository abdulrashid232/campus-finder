import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, X, Send, Navigation, Calendar, Loader2, Bot } from 'lucide-react';
import apiClient from '../api/client';

interface Action {
  type: 'navigate' | 'show_timetable' | 'none';
  building_code?: string;
  room_id?: number;
  label?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  action?: Action;
}

const QUICK_CHIPS = [
  { label: 'Where is my next class?', message: 'Where is my next class?' },
  { label: 'Show my timetable', message: 'Show me my timetable' },
  { label: 'What buildings are on campus?', message: 'What buildings are on campus?' },
];

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;

    const userMsg: Message = {
      id: `${Date.now()}-u`,
      role: 'user',
      content: text.trim(),
    };

    const currentMessages = [...messages, userMsg];
    setMessages(currentMessages);
    setInput('');
    setLoading(true);

    // Pass the conversation history (excluding the just-added user message)
    const history = messages.slice(-10).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const res = await apiClient.post('chat/', {
        message: text.trim(),
        history,
      });

      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-a`,
          role: 'assistant',
          content: res.data.message ?? 'No response.',
          action: res.data.action,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-e`,
          role: 'assistant',
          content: "Sorry, I'm having trouble connecting right now. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleAction(action: Action) {
    if (action.type === 'navigate' && action.building_code) {
      const url = action.room_id
        ? `/map?target=${action.building_code}&room=${action.room_id}`
        : `/map?target=${action.building_code}`;
      navigate(url);
      setOpen(false);
    } else if (action.type === 'show_timetable') {
      navigate('/timetable');
      setOpen(false);
    }
  }

  return (
    <>
      {/* ── Chat panel ─────────────────────────────────────────────────────── */}
      <div
        className={`fixed z-[1001] transition-all duration-300 ease-out
          bottom-[72px] left-2 right-2
          md:bottom-24 md:left-auto md:right-6 md:w-96
          ${open
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-4 pointer-events-none'
          }`}
      >
        <div
          className="bg-white rounded-3xl shadow-2xl shadow-slate-900/15 border border-slate-100 flex flex-col overflow-hidden"
          style={{ maxHeight: '72vh' }}
        >
          {/* Header */}
          <div className="bg-brand-500 px-5 py-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                <Bot size={20} className="text-white" />
              </div>
              <div>
                <p className="text-white font-bold text-sm leading-tight">Campus Assistant</p>
                <p className="text-white/65 text-xs">Powered by AbdelAI</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
            {messages.length === 0 && (
              <div className="flex flex-col items-center text-center pt-2 pb-1">
                <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center mb-3 mt-2">
                  <Bot size={28} className="text-brand-500" />
                </div>
                <p className="text-sm font-semibold text-slate-900 mb-1">Hi! I'm your campus guide.</p>
                <p className="text-xs text-slate-500 mb-5 max-w-[220px]">
                  Ask me to find your class, get directions, or check your schedule.
                </p>
                <div className="flex flex-col gap-2 w-full">
                  {QUICK_CHIPS.map((chip) => (
                    <button
                      key={chip.label}
                      onClick={() => sendMessage(chip.message)}
                      className="w-full text-left text-sm px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-brand-50 hover:text-brand-700 text-slate-700 font-medium border border-slate-100 hover:border-brand-100 transition-colors"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  {/* Bubble */}
                  <div
                    className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-brand-500 text-white rounded-br-sm'
                        : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                    }`}
                  >
                    {msg.content}
                  </div>

                  {/* Action button */}
                  {msg.action && msg.action.type !== 'none' && (
                    <button
                      onClick={() => handleAction(msg.action!)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-brand-200 text-brand-600 text-xs font-semibold rounded-xl hover:bg-brand-50 transition-colors shadow-sm"
                    >
                      {msg.action.type === 'navigate' ? (
                        <>
                          <Navigation size={12} />
                          {msg.action.label ?? 'Take me there'}
                        </>
                      ) : (
                        <>
                          <Calendar size={12} />
                          View Timetable
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-100 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2">
                  <Loader2 size={13} className="animate-spin text-slate-400" />
                  <span className="text-xs text-slate-400">Thinking…</span>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input bar */}
          <div className="p-3 border-t border-slate-100 flex-shrink-0">
            <form
              onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
              className="flex items-center gap-2 bg-slate-50 rounded-2xl px-4 py-2.5 border border-slate-100 focus-within:border-brand-300 focus-within:bg-white transition-colors"
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask something…"
                className="flex-1 bg-transparent text-sm text-slate-900 placeholder-slate-400 outline-none min-w-0"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-xl bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
              >
                <Send size={14} />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ── Floating toggle button ──────────────────────────────────────────── */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Toggle campus assistant"
        className={`fixed z-[1001] bottom-[72px] right-4 md:bottom-6 md:right-6
          w-14 h-14 rounded-2xl shadow-xl flex items-center justify-center
          transition-all duration-200 active:scale-95
          ${open
            ? 'bg-slate-700 shadow-slate-700/25 hover:bg-slate-800'
            : 'bg-brand-500 shadow-brand-500/30 hover:bg-brand-600'
          }`}
      >
        {open
          ? <X size={22} className="text-white" />
          : <MessageCircle size={22} className="text-white" />
        }
      </button>
    </>
  );
}
