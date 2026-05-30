const rateStore = new Map();

const WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS) || 10 * 60 * 1000;
const MAX_PER_WINDOW = Number(process.env.RATE_LIMIT_MAX_PER_WINDOW) || 5;
const LOCKOUT_MS = Number(process.env.RATE_LIMIT_LOCKOUT_MS) || 30 * 60 * 1000;

const getHeaders = (request) => {
  if (!request) return {};
  if (typeof request.headers?.get === "function") return request.headers;
  return request.headers || {};
};

export const getClientIp = (request) => {
  const headers = getHeaders(request);
  const forwarded = headers.get?.("x-forwarded-for") || headers["x-forwarded-for"] || "";
  if (forwarded) return String(forwarded).split(",")[0].trim();
  const realIp = headers.get?.("x-real-ip") || headers["x-real-ip"];
  if (realIp) return String(realIp).trim();
  if (request?.ip) return String(request.ip);
  return "unknown";
};

const getKey = (request, extraKey = "") => {
  const ip = getClientIp(request);
  return extraKey ? `${ip}:${extraKey}` : ip;
};

export const checkRateLimit = (request, extraKey = "") => {
  const key = getKey(request, extraKey);
  const now = Date.now();
  const entry = rateStore.get(key) || { count: 0, firstAt: now, lockedUntil: 0 };

  if (now < entry.lockedUntil) {
    return { allowed: false, retryAfterMs: entry.lockedUntil - now };
  }

  if (now - entry.firstAt > WINDOW_MS) {
    entry.count = 0;
    entry.firstAt = now;
    entry.lockedUntil = 0;
  }

  entry.count += 1;
  if (entry.count > MAX_PER_WINDOW) {
    entry.lockedUntil = now + LOCKOUT_MS;
    rateStore.set(key, entry);
    return { allowed: false, retryAfterMs: LOCKOUT_MS };
  }

  rateStore.set(key, entry);
  return {
    allowed: true,
    remaining: MAX_PER_WINDOW - entry.count,
    resetInMs: WINDOW_MS - (now - entry.firstAt),
  };
};

export const resetRateLimit = (request, extraKey = "") => {
  const key = getKey(request, extraKey);
  rateStore.delete(key);
};
