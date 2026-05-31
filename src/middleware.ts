import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

/* ────────────── Rate limiting ────────────── */

const rateStore = new Map<string, { count: number; firstAt: number }>();

interface RateLimitConfig {
  max: number;
  windowMs: number;
}

type RateLimitRule = RateLimitConfig & { prefix: string; methods: string[] };

const RATE_LIMIT_RULES: RateLimitRule[] = [
  { prefix: "/api/client/register", methods: ["POST"], max: 3, windowMs: 10 * 60 * 1000 },
  { prefix: "/api/client/register_mobile", methods: ["POST"], max: 3, windowMs: 10 * 60 * 1000 },
  { prefix: "/api/client/login_mobile", methods: ["POST"], max: 5, windowMs: 10 * 60 * 1000 },
  { prefix: "/api/client/userExist", methods: ["POST"], max: 5, windowMs: 10 * 60 * 1000 },
  { prefix: "/api/client/addOrder", methods: ["POST"], max: 5, windowMs: 30 * 60 * 1000 },
  { prefix: "/api/client/apply_promo_code", methods: ["POST"], max: 10, windowMs: 10 * 60 * 1000 },
  { prefix: "/api/client/change-password", methods: ["POST"], max: 3, windowMs: 10 * 60 * 1000 },
  { prefix: "/api/newsletter/subscribe", methods: ["POST"], max: 3, windowMs: 10 * 60 * 1000 },
  { prefix: "/api/client/addProduct_in_cart_client", methods: ["POST"], max: 20, windowMs: 10 * 60 * 1000 },
  { prefix: "/api/client/update_cart_quantite", methods: ["PUT"], max: 30, windowMs: 10 * 60 * 1000 },
  { prefix: "/api/client/delete_item_cart", methods: ["DELETE"], max: 30, windowMs: 10 * 60 * 1000 },
  { prefix: "/api/client/clear_cart", methods: ["DELETE"], max: 10, windowMs: 10 * 60 * 1000 },
  { prefix: "/api/client/delete_cart_client", methods: ["DELETE"], max: 30, windowMs: 10 * 60 * 1000 },
  { prefix: "/api/client/add_commante", methods: ["POST"], max: 5, windowMs: 10 * 60 * 1000 },
  { prefix: "/api/admin/addProduct", methods: ["POST"], max: 30, windowMs: 10 * 60 * 1000 },
  { prefix: "/api/admin/register", methods: ["POST"], max: 5, windowMs: 10 * 60 * 1000 },
];

const getClientIp = (request: NextRequest): string => {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
};

const findMatchingRule = (method: string, pathname: string): RateLimitRule | undefined => {
  return RATE_LIMIT_RULES.find(
    (rule) => rule.methods.includes(method) && pathname.startsWith(rule.prefix),
  );
};

const applyRateLimit = (request: NextRequest): NextResponse | null => {
  const method = request.method;
  const pathname = request.nextUrl.pathname;

  const rule = findMatchingRule(method, pathname);
  if (!rule) return null;

  const ip = getClientIp(request);
  const key = `${ip}:${method}:${rule.prefix}`;
  const now = Date.now();
  const entry = rateStore.get(key) || { count: 0, firstAt: now };

  if (now - entry.firstAt > rule.windowMs) {
    entry.count = 0;
    entry.firstAt = now;
  }

  entry.count += 1;
  rateStore.set(key, entry);

  if (entry.count > rule.max) {
    const retryAfter = Math.ceil((entry.firstAt + rule.windowMs - now) / 1000);
    return NextResponse.json(
      { error: "Trop de requêtes. Réessayez plus tard.", retryAfterSeconds: retryAfter },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(rule.max),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil((entry.firstAt + rule.windowMs) / 1000)),
        },
      },
    );
  }

  return null;
};

/* ────────────── CORS ────────────── */

const getAllowedOrigins = (): string[] => {
  const origins = new Set<string>();
  const envOrigins = [
    process.env.NEXTAUTH_URL,
    process.env.NEXT_PUBLIC_MY_URL,
  ];
  for (const val of envOrigins) {
    if (val) origins.add(val.replace(/\/$/, ""));
  }
  origins.add("http://localhost:3000");
  origins.add("http://localhost:3001");
  return [...origins];
};

const isOriginAllowed = (origin: string): boolean => {
  const allowed = getAllowedOrigins();
  return allowed.some(
    (a) => a === origin || a === origin.replace(/\/$/, ""),
  );
};

const corsCheck = (request: NextRequest): NextResponse | null => {
  const origin = request.headers.get("origin");
  if (!origin) return null;

  if (!isOriginAllowed(origin)) {
    return NextResponse.json(
      { error: "Origine non autorisée" },
      {
        status: 403,
        headers: {
          "Access-Control-Allow-Origin": "null",
          Vary: "Origin",
        },
      },
    );
  }

  return null;
};

const corsHeaders = (request: NextRequest): HeadersInit | undefined => {
  if (request.method === "OPTIONS") return undefined;
  const origin = request.headers.get("origin");
  if (!origin || !isOriginAllowed(origin)) return undefined;
  return {
    "Access-Control-Allow-Origin": origin,
    Vary: "Origin",
  };
};

/* ────────────── Main middleware ────────────── */

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  /* OPTIONS preflight */
  if (request.method === "OPTIONS" && pathname.startsWith("/api/")) {
    const origin = request.headers.get("origin");
    if (origin && !isOriginAllowed(origin)) {
      return NextResponse.json(
        { error: "Origine non autorisée" },
        { status: 403 },
      );
    }
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": origin || "*",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,PATCH,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
        "Access-Control-Max-Age": "86400",
        Vary: "Origin",
      },
    });
  }

  /* CORS check for API routes */
  if (pathname.startsWith("/api/")) {
    const corsBlock = corsCheck(request);
    if (corsBlock) return corsBlock;
  }

  /* Rate limit for API routes */
  if (pathname.startsWith("/api/")) {
    const blockResponse = applyRateLimit(request);
    if (blockResponse) return blockResponse;

    const extraHeaders = corsHeaders(request);
    const res = NextResponse.next();
    if (extraHeaders) {
      for (const [key, val] of Object.entries(extraHeaders)) {
        res.headers.set(key, val);
      }
    }
    return res;
  }

  if (pathname.startsWith("/admin/login")) {
    return NextResponse.next();
  }

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  if (pathname.startsWith("/admin")) {
    if (!token || token.role !== "admin") {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  if (pathname.startsWith("/account")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/account/:path*", "/api/:path*"],
};
