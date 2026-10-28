import { useState, useEffect, useCallback, useRef } from 'react';
import { Castle, BookOpen, Trash2, Swords, ScrollText } from 'lucide-react';
import type { ShoutMessage } from '@/types';
import { TTL_HOURS } from '@/types';
import { loadMessages, saveMessages } from '@/utils/storage';
import MessageForm from '@/components/MessageForm';
import MessageList from '@/components/MessageList';
import TutorialModal from '@/components/TutorialModal';

/** Remove messages older than TTL. Returns filtered list. */
function filterExpired(msgs: ShoutMessage[]): ShoutMessage[] {
  const now = Date.now();
  const ttlMs = TTL_HOURS * 60 * 60 * 1000;
  return msgs.filter((m) => now - m.timestamp < ttlMs);
}

export default function App() {
  const [messages, setMessages] = useState<ShoutMessage[]>([]);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [onlineCount, setOnlineCount] = useState(1);
  const cleanupRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setMessages(filterExpired(loadMessages()));
  }, []);

  useEffect(() => {
    saveMessages(messages);
  }, [messages]);

  useEffect(() => {
    cleanupRef.current = setInterval(() => {
      setMessages((prev) => {
        const filtered = filterExpired(prev);
        return filtered.length !== prev.length ? filtered : prev;
      });
    }, 60_000);
    return () => {
      if (cleanupRef.current) clearInterval(cleanupRef.current);
    };
  }, []);

  useEffect(() => {
    const base = 3 + Math.floor(Math.random() * 8);
    setOnlineCount(base);
    const interval = setInterval(() => {
      setOnlineCount((c) => {
        const delta = Math.random() > 0.5 ? 1 : -1;
        return Math.max(1, Math.min(15, c + delta));
      });
    }, 15_000);
    return () => clearInterval(interval);
  }, []);

  const handleSend = useCallback((msg: ShoutMessage) => {
    setMessages((prev) => [msg, ...prev].slice(0, 200));
  }, []);

  const handleClear = useCallback(() => {
    if (window.confirm('確定要清空所有留言紀錄嗎？此操作無法復原。')) {
      setMessages([]);
    }
  }, []);

  const activeCount = messages.length;

  return (
    <div className="min-h-screen wood-bg flex flex-col">
      {/* ── Header ── */}
      <header className="wood-panel border-b-2 border-amber-900/60 sticky top-0 z-30 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <Castle
              size={28}
              className="text-amber-500 shrink-0 animate-flicker"
              strokeWidth={1.5}
            />
            <div className="min-w-0">
              <h1 className="font-medieval gold-text-glow text-lg sm:text-2xl truncate leading-tight">
                世紀帝國 II 約戰大廳
              </h1>
              <p className="text-[10px] sm:text-xs text-amber-200/50 font-body truncate">
                IP 連線留言板 · 骨灰級玩家專屬
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-green-900/30 border border-green-700/40">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse-gold" />
              <span className="text-xs text-green-300 font-body">
                {onlineCount} 位將領線上
              </span>
            </div>
            <button
              onClick={() => setTutorialOpen(true)}
              className="btn-medieval rounded px-3 py-1.5 text-xs font-heading flex items-center gap-1.5"
            >
              <BookOpen size={14} />
              <span className="hidden sm:inline">連線教學</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Main content (messages) ── */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-5 pb-2">
        {/* Status bar */}
        <div className="flex items-center justify-between gap-2 flex-wrap mb-4">
          <div className="flex items-center gap-3 text-amber-200/70 text-xs font-body">
            <span className="flex items-center gap-1.5">
              <ScrollText size={14} className="text-amber-500" />
              {activeCount} 則留言
            </span>
            <span className="text-amber-200/30">|</span>
            <span className="flex items-center gap-1.5">
              <Swords size={14} className="text-red-400" />
              自動清理 {TTL_HOURS} 小時前留言
            </span>
          </div>
          {activeCount > 0 && (
            <button
              onClick={handleClear}
              className="text-xs text-red-400/70 hover:text-red-400 font-body flex items-center gap-1 transition-colors"
            >
              <Trash2 size={12} />
              清空紀錄
            </button>
          )}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 py-1 mb-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-700/40 to-transparent" />
          <span className="font-heading text-xs gold-text tracking-widest">
            約 戰 動 態
          </span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-700/40 to-transparent" />
        </div>

        {/* Messages */}
        <MessageList messages={messages} />
      </main>

      {/* ── Input area (bottom, chat-style) ── */}
      <div className="sticky bottom-0 z-20 px-4 pb-4 pt-2 bg-gradient-to-t from-[#1a0f08] via-[#1a0f08]/95 to-transparent">
        <div className="max-w-4xl mx-auto">
          <MessageForm onSend={handleSend} />
          <p className="text-center mt-2 text-[10px] text-amber-200/30 font-body">
            留言暫存於瀏覽器 LocalStorage · 每 15 秒發言冷卻 · 每 12 小時自動清理
          </p>
        </div>
      </div>

      {/* ── Mobile online indicator ── */}
      <div className="sm:hidden fixed bottom-[200px] right-3 z-10">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-900/40 border border-green-700/40 backdrop-blur-sm">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse-gold" />
          <span className="text-xs text-green-300 font-body">
            {onlineCount} 線上
          </span>
        </div>
      </div>

      {/* ── Tutorial Modal ── */}
      <TutorialModal
        open={tutorialOpen}
        onClose={() => setTutorialOpen(false)}
      />
    </div>
  );
}
