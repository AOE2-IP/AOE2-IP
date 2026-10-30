import { useState, useCallback } from 'react';
import { Copy, Check, Clock } from 'lucide-react';
import type { ShoutMessage } from '@/types';
import { extractIPs, copyToClipboard } from '@/utils/ip';

interface MessageListProps {
  messages: ShoutMessage[];
}

/** Render message content, highlighting detected IPs as badges. */
function ContentWithIPs({ content }: { content: string }) {
  const ips = extractIPs(content);
  if (ips.length === 0) {
    return <span>{content}</span>;
  }

  const parts: (string | { ip: string; port?: string; full: string })[] = [];
  let lastIdx = 0;
  const ipRe = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(?::\d{1,5})?\b/g;
  let match: RegExpExecArray | null;
  ipRe.lastIndex = 0;
  while ((match = ipRe.exec(content)) !== null) {
    const parts2 = match[0].split(':')[0].split('.').map(Number);
    if (!parts2.every((p) => p >= 0 && p <= 255)) continue;
    if (match.index > lastIdx) {
      parts.push(content.slice(lastIdx, match.index));
    }
    const detected = ips.find((d) => d.full === match![0]);
    if (detected) parts.push(detected);
    lastIdx = match.index + match[0].length;
  }
  if (lastIdx < content.length) {
    parts.push(content.slice(lastIdx));
  }

  return (
    <>
      {parts.map((part, i) => {
        if (typeof part === 'string') return <span key={i}>{part}</span>;
        return (
          <span key={i} className="ip-badge mx-0.5 px-1.5 py-0.5 bg-amber-950/20 rounded font-bold">
            {part.full}
          </span>
        );
      })}
    </>
  );
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function MessageItem({ msg }: { msg: ShoutMessage }) {
  const [copied, setCopied] = useState(false);
  const ips = extractIPs(msg.content);

  const handleCopy = useCallback(async () => {
    const ipText = ips.map((d) => (d.port ? `${d.ip}:${d.port}` : d.ip)).join(', ');
    const ok = await copyToClipboard(ipText);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [ips]);

  const ipString = ips.map((d) => (d.port ? `${d.ip}:${d.port}` : d.ip)).join(', ');

  return (
    <div className="parchment-bg rounded border-2 border-amber-800/60 p-4 shadow-lg animate-msg-in">
      {/* Header line: 玩家暱稱 */}
      <div className="flex items-center gap-2 flex-wrap mb-1">
        <span className="font-heading font-bold text-amber-950 text-base sm:text-lg truncate">
          {msg.nickname}
        </span>
      </div>

      {/* Content line: 將「版本」、「人數」、「強度」標籤顯示在留言內容最前面 */}
      <div 
        className="text-base sm:text-lg font-body font-semibold leading-relaxed break-words py-1 flex items-center gap-1.5 flex-wrap" 
        style={{ color: msg.color }}
      >
        {/* 1. 版本標籤 */}
        {msg.version && (
          <span className="text-xs bg-amber-900/20 text-amber-950 border border-amber-800/40 px-2 py-0.5 rounded font-heading font-bold select-none shrink-0">
            {msg.version}
          </span>
        )}

        {/* 2. 人數標籤 */}
        {msg.playerCount && (
          <span className="text-xs bg-amber-900/20 text-amber-950 border border-amber-800/40 px-2 py-0.5 rounded font-heading font-bold select-none shrink-0">
            {msg.playerCount}
          </span>
        )}

        {/* 3. 強度標籤 */}
        {msg.skillLevel && (
          <span className="text-xs bg-amber-900/20 text-amber-950 border border-amber-800/40 px-2 py-0.5 rounded font-heading font-bold select-none shrink-0">
            {msg.skillLevel}
          </span>
        )}

        {/* 4. 留言內容本文（包含 IP 高亮） */}
        <span className="ml-1">
          <ContentWithIPs content={msg.content} />
        </span>
      </div>

      {/* Footer line: 遊戲 IP 複製按鈕與發文者資訊 */}
      <div className="mt-3 pt-2 border-t border-amber-900/20 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2.5 flex-wrap">
          {ips.length > 0 && (
            <>
              <span className="text-xs text-amber-900/80 font-body">
                IP: <span className="font-bold text-amber-950">{ipString}</span>
              </span>
              <button
                onClick={handleCopy}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-heading border transition-all ${
                  copied
                    ? 'bg-green-800 border-green-600 text-green-100'
                    : 'bg-blue-900 border-blue-700 text-blue-100 hover:bg-blue-800 shadow'
                }`}
              >
                {copied ? (
                  <>
                    <Check size={13} />
                    已複製！
                  </>
                ) : (
                  <>
                    <Copy size={13} />
                    複製連線IP
                  </>
                )}
              </button>
            </>
          )}
        </div>

        <div className="flex items-center gap-3 ml-auto flex-wrap">
          {msg.posterIP && (
            <span className="text-xs text-amber-900/70 font-body">
              來自: <span className="font-semibold text-amber-950">{msg.posterIP}</span>
            </span>
          )}
          <span className="flex items-center gap-1 text-xs text-amber-900/70 font-body whitespace-nowrap">
            <Clock size={12} />
            {formatTime(msg.timestamp)}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function MessageList({ messages }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="parchment-dark-bg rounded-lg border border-amber-800/40 p-8 text-center">
        <p className="font-medieval text-amber-900/70 text-lg">
          目前尚無留言，成為第一個發布約戰資訊的玩家吧！
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((msg) => (
        <MessageItem key={msg.id} msg={msg} />
      ))}
    </div>
  );
}