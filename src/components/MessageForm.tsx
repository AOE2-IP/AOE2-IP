import { useState, useEffect, useRef } from 'react';
import { Send, Lock, Palette } from 'lucide-react';
import {
  GAME_VERSIONS,
  PLAYER_COUNTS,
  SKILL_LEVELS,
  TEXT_COLORS,
  COOLDOWN_SECONDS,
  MAX_NICKNAME_LENGTH,
  MAX_CONTENT_LENGTH,
  type ShoutMessage,
} from '@/types';
import { containsURL, fetchPublicIP } from '@/utils/ip';
import {
  loadNickname,
  saveNickname,
  loadVersion,
  saveVersion,
  loadPlayerCount,
  savePlayerCount,
  loadSkillLevel,
  saveSkillLevel,
  loadColor,
  saveColor,
  loadLastPostTime,
  saveLastPostTime,
} from '@/utils/storage';

interface MessageFormProps {
  onSend: (msg: ShoutMessage) => void;
}

export default function MessageForm({ onSend }: MessageFormProps) {
  const [nickname, setNickname] = useState('');
  const [version, setVersion] = useState('');
  const [playerCount, setPlayerCount] = useState('');
  const [skillLevel, setSkillLevel] = useState('');
  const [color, setColor] = useState('');
  const [content, setContent] = useState('');
  const [posterIP, setPosterIP] = useState('');
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setNickname(loadNickname());
    setVersion(loadVersion() || (GAME_VERSIONS[0] as string));
    setPlayerCount(loadPlayerCount() || (PLAYER_COUNTS[0] as string));
    setSkillLevel(loadSkillLevel() || (SKILL_LEVELS[1] as string));
    setColor(loadColor() || TEXT_COLORS[0].value);
  }, []);

  useEffect(() => {
    if (cooldown <= 0) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    timerRef.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          timerRef.current = null;
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [cooldown > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const last = loadLastPostTime();
    const elapsed = Math.floor((Date.now() - last) / 1000);
    const remaining = COOLDOWN_SECONDS - elapsed;
    if (remaining > 0) setCooldown(remaining);
  }, []);

  useEffect(() => {
    fetchPublicIP().then(setPosterIP);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (cooldown > 0) {
      setError(`請等待 ${cooldown} 秒後再發言。`);
      return;
    }

    const nick = nickname.trim();
    const text = content.trim();

    if (!nick) {
      setError('請輸入暱稱。');
      return;
    }
    if (nick.length > MAX_NICKNAME_LENGTH) {
      setError(`暱稱最多 ${MAX_NICKNAME_LENGTH} 字。`);
      return;
    }
    if (!text) {
      setError('請輸入留言內容。');
      return;
    }
    if (text.length > MAX_CONTENT_LENGTH) {
      setError(`留言最多 ${MAX_CONTENT_LENGTH} 字。`);
      return;
    }
    if (containsURL(text)) {
      setError('禁止發布外部網址 (http/https)，以防止廣告與釣魚連結。');
      return;
    }

    const msg: ShoutMessage = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      nickname: nick,
      version: version || (GAME_VERSIONS[0] as string),
      playerCount: playerCount || (PLAYER_COUNTS[0] as string),
      skillLevel: skillLevel || (SKILL_LEVELS[1] as string),
      color: color || TEXT_COLORS[0].value,
      content: text,
      posterIP,
      timestamp: Date.now(),
    };

    onSend(msg);
    saveNickname(nick);
    saveVersion(version);
    savePlayerCount(playerCount);
    saveSkillLevel(skillLevel);
    saveColor(color);
    saveLastPostTime(Date.now());
    setContent('');
    setCooldown(COOLDOWN_SECONDS);
  };

  const remaining = MAX_CONTENT_LENGTH - content.length;
  const disabled = cooldown > 0;

  return (
    <div className="wood-panel gold-border rounded-lg p-3 sm:p-4 relative">
      <div className="rivet absolute top-2 left-2" />
      <div className="rivet absolute top-2 right-2" />
      <div className="rivet absolute bottom-2 left-2" />
      <div className="rivet absolute bottom-2 right-2" />

      <form onSubmit={handleSubmit} className="space-y-2.5">
        {/* Row 1: Nickname + Version + PlayerCount + SkillLevel */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div>
            <label className="font-heading text-[10px] gold-text block mb-0.5 tracking-wide">
              暱稱
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={MAX_NICKNAME_LENGTH}
              placeholder="將領名號…"
              className="input-parchment w-full rounded px-2.5 py-1.5 text-sm font-body"
            />
          </div>
          <div>
            <label className="font-heading text-[10px] gold-text block mb-0.5 tracking-wide">
              版本
            </label>
            <select
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              className="input-parchment w-full rounded px-2.5 py-1.5 text-sm font-body cursor-pointer"
            >
              {GAME_VERSIONS.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="font-heading text-[10px] gold-text block mb-0.5 tracking-wide">
              人數
            </label>
            <select
              value={playerCount}
              onChange={(e) => setPlayerCount(e.target.value)}
              className="input-parchment w-full rounded px-2.5 py-1.5 text-sm font-body cursor-pointer"
            >
              {PLAYER_COUNTS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="font-heading text-[10px] gold-text block mb-0.5 tracking-wide">
              強度
            </label>
            <select
              value={skillLevel}
              onChange={(e) => setSkillLevel(e.target.value)}
              className="input-parchment w-full rounded px-2.5 py-1.5 text-sm font-body cursor-pointer"
            >
              {SKILL_LEVELS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: Color picker */}
        <div>
          <label className="font-heading text-[10px] gold-text block mb-1 tracking-wide">
            <Palette size={11} className="inline mr-1 -mt-0.5" />
            留言顏色
          </label>
          <div className="flex flex-wrap items-center gap-2">
            {TEXT_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setColor(c.value)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-heading border transition-all ${
                  color === c.value
                    ? 'border-amber-400 bg-amber-800/30 shadow-inner'
                    : 'border-amber-800/30 bg-amber-900/10 hover:bg-amber-800/20'
                }`}
              >
                <span
                  className="w-3.5 h-3.5 rounded-full border border-black/30"
                  style={{ backgroundColor: c.value }}
                />
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Row 3: Content + Submit */}
        <div className="flex flex-col sm:flex-row gap-2.5 items-end">
          <div className="flex-1 w-full">
            <label className="font-heading text-[10px] gold-text block mb-0.5 tracking-wide">
              留言內容（可填入 IP:Port 約戰）
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={MAX_CONTENT_LENGTH}
              rows={2}
              placeholder="例如：IP: 114.32.56.78:24150，快來！"
              className="input-parchment w-full rounded px-3 py-2 text-sm font-body resize-none scroll-medieval"
            />
            <div className="flex justify-between items-center mt-1">
              <span className="text-[10px] text-amber-200/50 font-body">
                {error ? (
                  <span className="text-red-400 font-semibold">{error}</span>
                ) : (
                  '禁止外部連結 · 每 15 秒限發一次'
                )}
              </span>
              <span
                className={`text-[10px] font-body ${
                  remaining < 20 ? 'text-red-400' : 'text-amber-200/40'
                }`}
              >
                {content.length} / {MAX_CONTENT_LENGTH}
              </span>
            </div>
          </div>
          <button
            type="submit"
            disabled={disabled}
            className="btn-medieval rounded px-5 py-2.5 font-heading text-sm flex items-center gap-2 justify-center whitespace-nowrap"
          >
            {disabled ? (
              <>
                <Lock size={16} />
                請等待 {cooldown} 秒…
              </>
            ) : (
              <>
                <Send size={16} />
                送出留言
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
