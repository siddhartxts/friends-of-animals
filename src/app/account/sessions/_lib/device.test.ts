import { describe, expect, it } from "vitest";

import { describeDevice } from "./device";

describe("describeDevice", () => {
  it.each([
    [
      "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36",
      { browser: "Chrome", os: "Android" },
    ],
    [
      "Mozilla/5.0 (iPhone; CPU iPhone OS 16_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.1 Mobile/15E148 Safari/604.1",
      { browser: "Safari", os: "iOS" },
    ],
    [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0",
      { browser: "Edge", os: "Windows" },
    ],
    [
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 14.1; rv:132.0) Gecko/20100101 Firefox/132.0",
      { browser: "Firefox", os: "macOS" },
    ],
    [
      "Mozilla/5.0 (Linux; Android 13; SM-A515F) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/23.0 Chrome/115.0.0.0 Mobile Safari/537.36",
      { browser: "Samsung Internet", os: "Android" },
    ],
    [
      "Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      { browser: "Chrome", os: "ChromeOS" },
    ],
  ])("names %s", (userAgent, expected) => {
    expect(describeDevice(userAgent)).toEqual(expected);
  });

  it("names nothing it doesn't recognise", () => {
    expect(describeDevice("curl/8.4.0")).toEqual({ browser: null, os: null });
    expect(describeDevice(null)).toEqual({ browser: null, os: null });
  });
});
