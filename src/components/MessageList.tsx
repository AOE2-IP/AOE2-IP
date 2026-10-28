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

function MetaTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs text-amber-950 bg-amber-800/20 px-2 py-0.5 rounded font-heading font-semibold whitespace-nowrap">
      {children}
    </span>
  );
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
      {/* Header line: [暱稱] [版本] [人數] [強度] */}
      <div className="flex items-center gap-2 flex-wrap mb-2">
        <span className="font-heading font-bold text-amber-950 text-base sm:text-lg truncate">
          {msg.nickname}
        </span>
        <MetaTag>{msg.version}</MetaTag>
        <MetaTag>{msg.playerCount}</MetaTag>
        <MetaTag>{msg.skillLevel}</MetaTag>
      </div>

      {/* Content line (字體放大至 text-base / text-lg) */}
      <div className="text-base sm:text-lg font-body font-semibold leading-relaxed break-words py-1" style={{ color: msg.color }}>
        <ContentWithIPs content={msg.content} />
      </div>

      {/* Footer line: poster IP + game IP info + timestamp at the end */}
      <div className="mt-3 pt-2 border-t border-amber-900/20 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2.5 flex-wrap">
          {msg.posterIP && (
            <span className="text-xs text-amber-900/70 font-body">
              來自: <span className="font-semibold text-amber-950">{msg.posterIP}</span>
            </span>
          )}
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
                    複製 IP
                  </>
                )}
              </button>
            </>
          )}
        </div>
        <span className="flex items-center gap-1 text-xs text-amber-900/70 font-body whitespace-nowrap ml-auto">
          <Clock size={12} />
          {formatTime(msg.timestamp)}
        </span>
      </div>
    </div>
  );
}

export default function MessageList({ messages }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="parchment-dark-bg rounded-lg border border-amber-800/40 p-8 text-center">
        <p className="font-medieval text-amber-900/70 text-lg">
          大廳空無一人…成為第一位出徵的將領吧！
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
