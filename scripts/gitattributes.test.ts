import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const root = new URL("../", import.meta.url);

/** The lines of .gitattributes, without comments and blank lines. */
function attributeLines(): string[] {
  const file = new URL(".gitattributes", root);
  if (!existsSync(file)) return [];
  return readFileSync(file, "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "" && !line.startsWith("#"));
}

describe(".gitattributes", () => {
  // Every schema ticket adds one `export *` line to each barrel. With
  // merge=union, two branches' lines merge without a conflict.
  it.each(["src/server/db/schema/index.ts", "src/server/seed/index.ts"])(
    "merges %s with union",
    (barrel) => {
      expect(attributeLines()).toContain(`${barrel} merge=union`);
      expect(existsSync(new URL(barrel, root))).toBe(true);
    }
  );
});
