export const API_BASE = (() => {
  // 1) Explicit env override takes priority
  if (typeof process !== 'undefined') {
    const env = (process.env.NEXT_PUBLIC_API_URL || '').trim();
    if (env) {
      // Guard against accidentally pointing to the frontend dev port
      if (/^https?:\/\/localhost:3000/i.test(env)) return env.replace(':3000', ':3001');
      return env;
    }
  }

  // 2) Infer from runtime host
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:3001';
    }
    if (/netlify\.app$/i.test(host)) {
      return 'https://ai-agent-system-backend-ai-logic-1.onrender.com';
    }
  }

  // 3) Fallback to local dev backend
  return 'http://localhost:3001';
})();

export function api(path: string) {
  return `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
}
