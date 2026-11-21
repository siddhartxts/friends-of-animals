// A readable name for the device a session started on, from its user agent,
// so people can tell their sessions apart ("Chrome on Android"). Only the
// common browsers and systems; anything else is unnamed.

type Rule = [pattern: RegExp, name: string];

// Order matters: Edge, Samsung Internet and Opera also say "Chrome", and
// Chrome also says "Safari".
const BROWSERS: Rule[] = [
  [/\bEdgi?A?\//, "Edge"],
  [/\bSamsungBrowser\//, "Samsung Internet"],
  [/\bOPR\//, "Opera"],
  [/\b(Firefox|FxiOS)\//, "Firefox"],
  [/\b(Chrome|CriOS)\//, "Chrome"],
  [/\bVersion\/[\d.]+.*\bSafari\//, "Safari"],
];

const SYSTEMS: Rule[] = [
  [/\bAndroid\b/, "Android"],
  [/\b(iPhone|iPod)\b/, "iOS"],
  [/\biPad\b/, "iPadOS"],
  [/\bCrOS\b/, "ChromeOS"],
  [/\bWindows\b/, "Windows"],
  [/\bMac OS X\b/, "macOS"],
  [/\bLinux\b/, "Linux"],
];

function first(rules: Rule[], text: string): string | null {
  return rules.find(([pattern]) => pattern.test(text))?.[1] ?? null;
}

export function describeDevice(userAgent: string | null): {
  browser: string | null;
  os: string | null;
} {
  const text = userAgent ?? "";
  return { browser: first(BROWSERS, text), os: first(SYSTEMS, text) };
}
