import {
  STORAGE_KEY,
  NICKNAME_KEY,
  VERSION_KEY,
  PLAYERCOUNT_KEY,
  SKILL_KEY,
  COLOR_KEY,
  LAST_POST_KEY,
  TTL_HOURS,
  type ShoutMessage,
} from '@/types';

/** Load messages from localStorage, filtering out expired ones (TTL). */
export function loadMessages(): ShoutMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: ShoutMessage[] = JSON.parse(raw);
    const now = Date.now();
    const ttlMs = TTL_HOURS * 60 * 60 * 1000;
    return parsed.filter((m) => now - m.timestamp < ttlMs);
  } catch {
    return [];
  }
}

export function saveMessages(messages: ShoutMessage[]): void {
  try {
    const now = Date.now();
    const ttlMs = TTL_HOURS * 60 * 60 * 1000;
    const fresh = messages.filter((m) => now - m.timestamp < ttlMs);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
  } catch {
    /* storage full or unavailable */
  }
}

export function loadNickname(): string {
  return localStorage.getItem(NICKNAME_KEY) ?? '';
}

export function saveNickname(name: string): void {
  localStorage.setItem(NICKNAME_KEY, name);
}

export function loadVersion(): string {
  return localStorage.getItem(VERSION_KEY) ?? '';
}

export function saveVersion(v: string): void {
  localStorage.setItem(VERSION_KEY, v);
}

export function loadPlayerCount(): string {
  return localStorage.getItem(PLAYERCOUNT_KEY) ?? '';
}

export function savePlayerCount(v: string): void {
  localStorage.setItem(PLAYERCOUNT_KEY, v);
}

export function loadSkillLevel(): string {
  return localStorage.getItem(SKILL_KEY) ?? '';
}

export function saveSkillLevel(v: string): void {
  localStorage.setItem(SKILL_KEY, v);
}

export function loadColor(): string {
  return localStorage.getItem(COLOR_KEY) ?? '';
}

export function saveColor(v: string): void {
  localStorage.setItem(COLOR_KEY, v);
}

export function loadLastPostTime(): number {
  const raw = localStorage.getItem(LAST_POST_KEY);
  return raw ? Number(raw) : 0;
}

export function saveLastPostTime(ts: number): void {
  localStorage.setItem(LAST_POST_KEY, String(ts));
}
