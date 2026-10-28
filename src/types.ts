export interface ShoutMessage {
  id: string;
  nickname: string;
  version: string;
  playerCount: string;
  skillLevel: string;
  color: string;
  content: string;
  posterIP: string;
  timestamp: number;
}

export const GAME_VERSIONS = ['1.0', '1.0c'] as const;

export const PLAYER_COUNTS = ['1v1', '2v2', '3v3', '4v4'] as const;

export const SKILL_LEVELS = ['新手', '中手', '高手'] as const;

export const TEXT_COLORS = [
  { label: '經典金', value: '#c9a227' },
  { label: '鮮紅', value: '#cc2222' },
  { label: '亮綠', value: '#22aa22' },
  { label: '天藍', value: '#2266cc' },
  { label: '純白', value: '#ffffff' },
] as const;

export const COOLDOWN_SECONDS = 15;
export const TTL_HOURS = 12;
export const MAX_NICKNAME_LENGTH = 20;
export const MAX_CONTENT_LENGTH = 200;

export const STORAGE_KEY = 'aoe2-shoutbox-messages';
export const NICKNAME_KEY = 'aoe2-shoutbox-nickname';
export const VERSION_KEY = 'aoe2-shoutbox-version';
export const PLAYERCOUNT_KEY = 'aoe2-shoutbox-playercount';
export const SKILL_KEY = 'aoe2-shoutbox-skill';
export const COLOR_KEY = 'aoe2-shoutbox-color';
export const LAST_POST_KEY = 'aoe2-shoutbox-lastpost';
