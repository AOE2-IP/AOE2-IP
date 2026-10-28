/** IPv4 regex — matches standalone IPs optionally with :port */
const IPV4_RE = /\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(?::(\d{1,5}))?\b/g;

export interface DetectedIP {
  ip: string;
  port?: string;
  full: string;
}

/** Extract all valid IPv4 addresses (with optional ports) from a string. */
export function extractIPs(text: string): DetectedIP[] {
  const results: DetectedIP[] = [];
  let match: RegExpExecArray | null;
  IPV4_RE.lastIndex = 0;
  while ((match = IPV4_RE.exec(text)) !== null) {
    const parts = match[1].split('.').map(Number);
    const valid = parts.every((p) => p >= 0 && p <= 255);
    if (!valid) continue;
    let port: string | undefined;
    if (match[2]) {
      const portNum = Number(match[2]);
      if (portNum < 0 || portNum > 65535) continue;
      port = match[2];
    }
    results.push({
      ip: match[1],
      port,
      full: match[0],
    });
  }
  return results;
}

/** Fetch the user's public IP address. Returns empty string on failure. */
export async function fetchPublicIP(): Promise<string> {
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    if (!res.ok) return '';
    const data = await res.json();
    return typeof data.ip === 'string' ? data.ip : '';
  } catch {
    return '';
  }
}

/** Check whether the text contains http/https URLs. */
export function containsURL(text: string): boolean {
  return /\bhttps?:\/\/\S+/i.test(text) || /\bwww\.\S+/i.test(text);
}

/** Copy text to clipboard, returns true on success. */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to legacy */
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}
