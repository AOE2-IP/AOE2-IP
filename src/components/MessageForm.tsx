import { useState, useEffect, useRef } from 'react';
import { Send, Lock, Palette, ChevronDown } from 'lucide-react';
import {
  GAME_VERSIONS,
  PLAYER_COUNTS,
  SKILL_LEVELS,
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

// 模擬 Word 風格的豐富色票表 (佈景主題色、階層色、標準色)
const WORD_COLOR_PALETTE = [
  // 頂部標準/基本色
  { label: '純白', value: '#ffffff' },
  { label: '深黑', value: '#111111' },
  { label: '經典金', value: '#ffd700' },
  { label: '琥珀黃', value: '#ffaa00' },
  { label: '烈焰紅', value: '#ff4500' },
  { label: '翠綠色', value: '#00ff7f' },
  { label: '天空藍', value: '#00bfff' },
  { label: '帝國藍', value: '#1e90ff' },
  { label: '亮紫色', value: '#da70d6' },
  { label: '粉紅色', value: '#ff69b4' },

  // 色階與佈景主題色彩仿真
  { label: '淺灰白', value: '#e2e8f0' },
  { label: '石墨灰', value: '#64748b' },
  { label: '深褐灰', value: '#334155' },
  { label: '暗夜藍', value: '#0f172a' },
  { label: '血腥紅', value: '#991b1b' },
  { label: '磚塊紅', value: '#dc2626' },
  { label: '鮮黃色', value: '#facc15' },
  { label: '萊姆綠', value: '#84cc16' },
  { label: '森林綠', value: '#15803d' },
  { label: '青藍色', value: '#06b6d4' },
  { label: '寶藍色', value: '#2563eb' },
  { label: '靛紫色', value: '#7c3aed' },
  { label: '紫紅色', value: '#db2777' },
  { label: '巧克力', value: '#78350f' },
];

const DEFAULT_COLOR = '#ffd700'; // 預設經典金

export default function MessageForm({ onSend }: MessageFormProps) {
  const [nickname, setNickname] = useState('');
  const [version, setVersion] = useState('');
  const [playerCount, setPlayerCount] = useState('');
  const [skillLevel, setSkillLevel] = useState('');
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [content, setContent] = useState('');
  const [posterIP, setPosterIP] = useState('');
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  
  // 控制 Word 風格色彩下拉選單的開關
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setNickname(loadNickname());
    setVersion(loadVersion() || (GAME_VERSIONS[0] as string));
    setPlayerCount(loadPlayerCount() || (PLAYER_COUNTS[0] as string));
    setSkillLevel(loadSkillLevel() || (SKILL_LEVELS[1] as string));
    setColor(loadColor() || DEFAULT_COLOR);
  }, []);

  // 點擊外部自動關閉色票選單
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
        setIsColorPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
      color: color || DEFAULT_COLOR,
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
  const currentColorObj = WORD_COLOR_PALETTE.find((c) => c.value === color) || { label: '自選色', value: color };

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
            <label htmlFor="shoutbox-nickname" className="font-heading text-[10px] gold-text block mb-0.5 tracking-wide">
              暱稱
            </label>
            <input
              id="shoutbox-nickname"
              name="nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={MAX_NICKNAME_LENGTH}
              placeholder="將領名號…"
              className="input-parchment w-full rounded px-2.5 py-1.5 text-sm font-body"
            />
          </div>
          <div>
            <label htmlFor="shoutbox-version" className="font-heading text-[10px] gold-text block mb-0.5 tracking-wide">
              版本
            </label>
            <select
              id="shoutbox-version"
              name="version"
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
            <label htmlFor="shoutbox-player-count" className="font-heading text-[10px] gold-text block mb-0.5 tracking-wide">
              人數
            </label>
            <select
              id="shoutbox-player-count"
              name="playerCount"
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
            <label htmlFor="shoutbox-skill-level" className="font-heading text-[10px] gold-text block mb-0.5 tracking-wide">
              強度
            </label>
            <select
              id="shoutbox-skill-level"
              name="skillLevel"
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

        {/* Row 2: Word Style Color Dropdown Grid (Word 風格色表下拉選單) */}
        <div className="relative inline-block" ref={colorPickerRef}>
          <label htmlFor="shoutbox-color-picker" className="font-heading text-[10px] gold-text block mb-0.5 tracking-wide">
            <Palette size={11} className="inline mr-1 -mt-0.5" />
            字體顏色
          </label>
          <button
            id="shoutbox-color-picker"
            type="button"
            onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
            className="input-parchment flex items-center justify-between gap-3 px-3 py-1.5 rounded text-sm font-body w-44 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span
                className="w-4 h-4 rounded-sm border border-black/50 shadow-inner"
                style={{ backgroundColor: color }}
              />
              <span className="font-medium truncate" style={{ color: color === '#ffffff' ? '#cbd5e1' : color }}>
                {currentColorObj.label}
              </span>
            </div>
            <ChevronDown size={14} className="text-amber-200/70" />
          </button>

          {/* Word 風格彈出色票網格面板 */}
          {isColorPickerOpen && (
            <div className="absolute left-0 mt-1 z-50 bg-[#1e150c] border-2 border-amber-600/70 rounded-md shadow-2xl p-3 w-64 backdrop-blur-md">
              <div className="text-[11px] font-heading text-amber-200/80 mb-2 border-b border-amber-900/50 pb-1">
                標準與主題色彩 (Word Style)
              </div>
              <div className="grid grid-cols-6 gap-1.5">
                {WORD_COLOR_PALETTE.map((c) => {
                  const isSelected = color === c.value;
                  return (
                    <button
                      key={c.value}
                      type="button"
                      title={c.label}
                      onClick={() => {
                        setColor(c.value);
                        setIsColorPickerOpen(false);
                      }}
                      className={`w-7 h-7 rounded transition-transform ${
                        isSelected
                          ? 'ring-2 ring-amber-300 scale-110 z-10 shadow-lg'
                          : 'hover:scale-110 hover:border-white border border-black/40'
                      }`}
                      style={{ backgroundColor: c.value }}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Row 3: Content + Submit */}
        <div className="flex flex-col sm:flex-row gap-2.5 items-end">
          <div className="flex-1 w-full">
            <label htmlFor="shoutbox-content" className="font-heading text-[10px] gold-text block mb-0.5 tracking-wide">
              留言內容（可填入 IP:Port 約戰）
            </label>
            <textarea
              id="shoutbox-content"
              name="content"
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