import type { RequestMeta } from "../actor";

/**
 * What a request says about its caller: the client IP (the first
 * x-forwarded-for entry, which Vercel sets) and the user agent.
 */
export function requestMeta(headers: Headers): RequestMeta {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return {
    ip: forwarded || "unknown",
    userAgent: headers.get("user-agent") ?? "",
  };
}

/** The headers Better Auth reads the caller from, rebuilt from `meta`. */
export function headersFor(meta: RequestMeta, cookie?: string): Headers {
  const headers = new Headers({
    "x-forwarded-for": meta.ip,
    "user-agent": meta.userAgent,
  });
  if (cookie) headers.set("cookie", cookie);
  return headers;
}
