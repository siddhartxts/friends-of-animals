# Friends of Animals logo assets

The FOA logo is a **registered mark**. Use these files as they are. Don't recolour, re-font, crop, stretch or rearrange them. Scale them only. The only other versions allowed are the two FOA approved in [#17](https://github.com/siddhartxts/friends-of-animals/issues/17) (see [Uses FOA approved](#uses-foa-approved)), and they're already in this folder.

## Files

| File | Size | Use |
|------|------|-----|
| `foa-logo.svg` | vector, 294.23 × 169.62 viewBox | **The master.** Use it wherever SVG works: the site header, certificates, print. Every other file is generated from it. |
| `foa-logo-256.png` | 256 × 148 | Logo on white, for places that need a PNG (emails, documents, third-party profiles). |
| `foa-logo-512.png` | 512 × 295 | Logo on white. |
| `foa-logo-1024.png` | 1024 × 590 | Logo on white. |
| `foa-logo-2048.png` | 2048 × 1181 | Logo on white, for print and large displays. |
| `foa-logo-white.svg` | vector, transparent | All-white logo for dark backgrounds. The letters and paw are cut out, so the background shows through. The site header uses it in dark mode. |
| `foa-logo-black.svg` | vector, transparent | All-black logo with the letters and paw cut out. Suggested use: one-colour printing. |
| `foa-logo-watermark.png` | 1024 × 590, transparent | Full-colour watermark for stamping onto artwork photos (`StampSettings.logoAssetId`). Use it on light or mid-tone areas, because the wordmark is black. |
| `foa-logo-watermark-white.png` | 1024 × 590, transparent | All-white watermark for dark photos. |
| `foa-logo-watermark-black.png` | 1024 × 590, transparent | All-black watermark. Suggested use: very light photos. |
| `favicon.svg` | vector, square | Browser tab icon for modern browsers: the tiles alone on a white square. |
| `favicon.ico` | 16, 32, 48 px | Browser tab icon fallback, the tiles alone. A copy sits at `/favicon.ico` because browsers and crawlers ask for that path. |
| `apple-touch-icon.png` | 180 × 180 | iOS / iPadOS home-screen icon: the tiles alone on white. |
| `foa-social-1200x630.png` | 1200 × 630 | Open Graph / Twitter preview image (`og:image`), the full logo. |
| `foa-logo-source.png` | 368 × 219 | The original screenshot that the master was traced from. Kept for reference. Don't use it on the site. |

## Colours

Sampled from the source (the most common value in each tile):

| Element | Hex | RGB |
|---------|-----|-----|
| F tile (red) | `#C92827` | 201, 40, 39 |
| O tile (green) | `#07AC06` | 7, 172, 6 |
| A tile (blue) | `#2B41F0` | 43, 65, 240 |
| Letters, ring and paw | `#FFFFFF` | 255, 255, 255 |
| Wordmark | `#000000` | 0, 0, 0 |

Single-colour versions use one colour only, either `#FFFFFF` or `#000000`, for the tiles and the wordmark. The letters, ring and paw are holes, not a second colour.

## How the master was made

The only source is a 368 × 219 screenshot (`foa-logo-source.png`). The 5 px dark strip on its left is screenshot chrome and was cropped away. Each part was traced as the simplest exact shape that fits the source's sub-pixel edges:

- **Tiles:** three rectangles. The screenshot shows them with slightly different widths (91.3, 102.4 and 94.7 units) and heights, and the green tile 0.5 units lower. FOA confirmed these are screenshot artefacts (#17), so the master evens them out:
  - The tiles are now 96.13 × 139.57 each, all at the top, with 2.92-unit gaps, across the same 294.23-unit width.
  - Each letter moved with its tile's centre (F +2.43, O and paw +1.80, A −0.70), so it sits in its tile exactly as before.
- **F and A:** straight-edged polygons fitted to the letter edges.
- **O:** two superellipses: the outer one is rotated −1.1°.
- **Paw:** the four toes are ellipses. The pad and the cupped hands are a bitmap trace (potrace) of the source, upsampled 8×.
- **Wordmark:** Helvetica letterforms (outlines from URW Nimbus Sans, a Helvetica clone). Each letter is fitted to the source for position, width and weight, with one shared cap height (21.37) and x-height (13.82). The source's x-height is lower than standard Helvetica's, so it was traced as it is.

[`docs/brand/trace-diff.png`](../../docs/brand/trace-diff.png) shows the trace before the tiles were evened out, rasterised at the source's scale and overlaid on it. That trace differs from the source only along edges: every pixel off by more than 16/255 lies on an edge, and nothing inside a shape changes.

FOA has no original artwork file (AI, CDR, EPS or PDF) and doesn't know the wordmark's font (#17), so this trace is the master. If an original turns up, replace `foa-logo.svg` with an export of it and regenerate the rest.

## Regenerating

Every PNG and ICO, the favicon SVG and the single-colour SVGs are derived from `foa-logo.svg`:

```bash
pnpm brand:assets      # scripts/brand-assets.ts, renders with resvg
```

The derivations live in `scripts/brand-logo.ts`, and `scripts/brand-logo.test.ts` checks them:

- `fullLogo`: the master, scaled only.
- `tilesOnly`: the master without the wordmark, cropped to the tiles.
- `singleColour`: tiles and wordmark in one colour, with the letters and paw cut out by an SVG mask.

## Uses FOA approved

FOA answered in [#17](https://github.com/siddhartxts/friends-of-animals/issues/17):

1. **The three F-O-A tiles may appear alone, without the "Friends of Animals" wordmark, at small sizes.** The favicons and the apple-touch-icon use the tiles alone. Everywhere else uses the full logo. A single tile on its own (for example, the O with the paw) hasn't been approved.
2. **An all-white and an all-black version are allowed.** They are for dark backgrounds and photos, where the black wordmark disappears, and for one-colour printing. The site header uses the white version in dark mode.
