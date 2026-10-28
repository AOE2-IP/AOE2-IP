import { X, BookOpen, Network, Shield, Wifi, Copy, Check } from 'lucide-react';
import { useState, useCallback } from 'react';
import { copyToClipboard } from '@/utils/ip';

interface TutorialModalProps {
  open: boolean;
  onClose: () => void;
}

interface Step {
  icon: typeof Network;
  title: string;
  body: string;
}

const steps: Step[] = [
  {
    icon: Network,
    title: '一、確認你的 IP 位址',
    body:
      '主機玩家請先到「命令提示字元」輸入 ipconfig，記下 IPv4 位址（例如 114.32.xx.xx）。這就是你給對手連線的 IP。',
  },
  {
    icon: Shield,
    title: '二、開放 Port 24150（UDP + TCP）',
    body:
      '世紀帝國 II 預設使用 Port 24150。請至路由器設定「通訊埠轉發 (Port Forwarding)」，將 24150 的 TCP 與 UDP 都指向你的內部 IP。若防火牆擋住，也需在 Windows 防火牆新增允許規則。',
  },
  {
    icon: Wifi,
    title: '三、遊戲內建立連線',
    body:
      '主機在遊戲主選單選「 multiplayer → Internet TCP/IP Connection → Create Game」。對手選同一項目後「Show Games」，輸入主機 IP 即可看到遊戲並加入。',
  },
  {
    icon: BookOpen,
    title: '四、在大廳貼上 IP 約戰',
    body:
      '回到本大廳留言板，輸入你的 IP（可含 :24150），送出後系統會自動標示 IP，對手可點「複製 IP」直接貼到遊戲中連線。',
  },
];

const commonPorts = [
  { port: '24150', desc: '世紀帝國 II 預設連線 Port' },
  { port: '2300-2400', desc: 'DirectPlay 使用的範圍（舊版 CD）' },
  { port: '47624', desc: 'DirectPlay 主機查詢 Port' },
];

function CopyChip({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handle = useCallback(async () => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }, [text]);
  return (
    <button
      onClick={handle}
      className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded border border-amber-700/50 bg-amber-900/20 text-amber-800 hover:bg-amber-800/30 transition-colors"
    >
      {copied ? <Check size={11} /> : <Copy size={11} />}
      {text}
    </button>
  );
}

export default function TutorialModal({ open, onClose }: TutorialModalProps) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 modal-backdrop flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="parchment-bg rounded-lg gold-border max-w-2xl w-full max-h-[85vh] overflow-y-auto scroll-medieval animate-modal-in relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="wood-panel sticky top-0 z-10 flex items-center justify-between px-5 py-3 border-b-2 border-amber-900/40">
          <h2 className="font-heading font-bold gold-text text-base sm:text-lg flex items-center gap-2">
            <BookOpen size={20} />
            IP 連線與 Port 24150 開放教學
          </h2>
          <button
            onClick={onClose}
            className="btn-medieval rounded p-1.5"
            aria-label="關閉"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div
                key={i}
                className="flex gap-3 pb-4 border-b border-amber-800/20 last:border-0"
              >
                <div className="shrink-0 w-10 h-10 rounded-full bg-amber-900/20 border border-amber-700/50 flex items-center justify-center text-amber-800">
                  <Icon size={20} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-heading font-bold text-amber-950 text-sm mb-1">
                    {step.title}
                  </h3>
                  <p className="text-amber-950/80 text-sm font-body leading-relaxed">
                    {step.body}
                  </p>
                </div>
              </div>
            );
          })}

          {/* Port reference */}
          <div className="bg-amber-900/15 rounded-lg border border-amber-700/30 p-4">
            <h3 className="font-heading font-bold text-amber-950 text-sm mb-2">
              常用 Port 速查
            </h3>
            <div className="space-y-2">
              {commonPorts.map((p) => (
                <div
                  key={p.port}
                  className="flex items-center justify-between gap-2"
                >
                  <span className="text-amber-950/80 text-sm font-body">
                    {p.desc}
                  </span>
                  <CopyChip text={p.port} />
                </div>
              ))}
            </div>
          </div>

          {/* Tip */}
          <div className="bg-red-900/15 rounded-lg border border-red-700/30 p-4">
            <p className="text-red-900 text-sm font-body leading-relaxed">
              <strong className="font-heading">小提示：</strong>
              若連線失敗，請確認雙方遊戲版本一致（如皆為 UserPatch 1.5）。使用 Voobly 或 DE 版本的玩家，連線方式可能不同，請改用各平台的內建連線功能。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
