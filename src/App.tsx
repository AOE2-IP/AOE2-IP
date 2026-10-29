import { useState, useEffect, useCallback, useRef } from 'react';
import { Castle, Swords, ScrollText } from 'lucide-react';
import type { ShoutMessage } from '@/types';
import { TTL_HOURS } from '@/types';
import { supabase } from '@/lib/supabase';
import MessageForm from '@/components/MessageForm';
import MessageList from '@/components/MessageList';

/** Remove messages older than TTL. Returns filtered list. */
function filterExpired(msgs: ShoutMessage[]): ShoutMessage[] {
  const now = Date.now();
  const ttlMs = TTL_HOURS * 60 * 60 * 1000;
  return msgs.filter((m) => now - m.timestamp < ttlMs);
}

export default function App() {
  const [messages, setMessages] = useState<ShoutMessage[]>([]);
  const [onlineCount, setOnlineCount] = useState(1);
  const cleanupRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 1. 從 Supabase 載入留言
  const fetchMessagesFromSupabase = async () => {
    try {
      const { data, error } = await supabase
        .from('shoutbox_messages')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('載入 Supabase 留言失敗:', error.message);
        return;
      }

      if (data) {
        const validMsgs = filterExpired(data as ShoutMessage[]);
        setMessages(validMsgs);
      }
    } catch (err) {
      console.error('連線 Supabase 異常:', err);
    }
  };

  // 初始化時載入留言，並設定 Realtime 資料庫與 Presence 在線人數監聽
  useEffect(() => {
    fetchMessagesFromSupabase();

    // ── 留言板即時同步頻道 ──
    const msgChannel = supabase
      .channel('public:shoutbox_messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'shoutbox_messages' },
        (payload) => {
          const newMsg = payload.new as ShoutMessage;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return filterExpired([newMsg, ...prev]).slice(0, 200);
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'shoutbox_messages' },
        () => {
          fetchMessagesFromSupabase();
        }
      )
      .subscribe();

    // ── 精準在線人數統計 (Supabase Presence) ──
    const presenceChannel = supabase.channel('online-lobby', {
      config: {
        presence: {
          key: Math.random().toString(36).substring(2, 9), // 生成獨立連線 ID
        },
      },
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const count = Object.keys(state).length;
        setOnlineCount(Math.max(1, count));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({ onlineAt: new Date().toISOString() });
        }
      });

    return () => {
      supabase.removeChannel(msgChannel);
      supabase.removeChannel(presenceChannel);
    };
  }, []);

  // 定期清理過期留言
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

  // 2. 發送留言：寫入 Supabase 資料庫
  const handleSend = useCallback(async (msg: ShoutMessage) => {
    try {
      const { error } = await supabase
        .from('shoutbox_messages')
        .insert([msg]);

      if (error) {
        console.error('寫入 Supabase 失敗:', error.message);
        alert('發送留言失敗，請稍後再試。');
        return;
      }

      setMessages((prev) => filterExpired([msg, ...prev]).slice(0, 200));
    } catch (err) {
      console.error('送出留言異常:', err);
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
                世紀帝國 II：征服者入侵
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
                {onlineCount} 位骨灰級玩家在線上
              </span>
            </div>
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
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 py-1 mb-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-700/40 to-transparent" />
          <span className="font-heading text-xs gold-text tracking-widest">
            留 言 動 態
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
            每 15 秒發言冷卻 · 每 12 小時自動清理
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
    </div>
  );
}