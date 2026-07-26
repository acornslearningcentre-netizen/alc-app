# Design System: Acorns Learning Centre — v2 "Watercolor Glass"

A third-pass redesign produced via the `ui-ux-pro-max` skill. The skill's first recommendation (Data-Dense Dashboard with Fira Code) was rejected as too clinical for a Montessori context. From its style library we picked **Glassmorphism × Nature Distilled** — frosted vellum cards floating over a warm watercolor canvas.

Tonally opposite to the previous "Studio" pass: that one was hard-edged editorial with a serif and squared chips. This one is soft, rounded, atmospheric — humane school energy with premium tactility.

---

## 1. The idea in one line
> Frosted vellum cards floating on a warm watercolor wash. Friendly to families, calm enough for a working teacher, distinct from any SaaS dashboard.

## 2. Calibration
- **Creativity 9 · Variance 6 · Motion 6 · Density 5**
- Variance lower than Studio (more symmetric, calmer)
- Motion lifted slightly: a slow watercolor drift in the background carries the atmosphere

## 3. Color Palette & Roles
- **Canvas** `#F2EBDD` — warm cream base
- **Vellum** `rgba(251, 247, 236, 0.62)` — frosted glass surface (with `backdrop-filter: blur(14px) saturate(140%)`)
- **Vellum solid** `#FAF6EB` — opaque fallback
- **Ink** `#1A1F1B` — primary text
- **Mist** `#5C5A55` — secondary text
- **Pencil** `#8E8B85` — tertiary text, captions
- **Hairline** `rgba(26,31,27,0.08)` — borders
- **Glass top** `rgba(255,255,255,0.72)` — top highlight on glass surfaces
- **Moss** `#3F5C44` — single accent (CTAs, focus rings, links). Softer than Studio's saturated Tangerine
- **Terra** `#B85D38` — reserved state colour (errors, "Now"). Warmer than Tangerine, no glow

**Watercolor wash (background blobs, ~18% opacity):**
- Sage `#9FB39A`
- Ochre `#D9A441`
- Plum `#8E6E86`
- Sky `#7FA8C1`

The four colours bleed into each other on a fixed background layer; nothing decorative is in the foreground.

## 4. Typography
- **Display** — `Nunito` (already loaded), 800 / 900. Rounded humanist sans, warm and confident. Earned in this Montessori context where Studio's Fraunces felt too magazine-y.
- **Body** — `Geist` 400 / 500 / 600. Leading 1.55. Max line 60ch.
- **Mono** — `Geist Mono` 500. Numbers, timestamps, metadata.
- Hierarchy by weight + size, not weight + colour.

## 5. Layout
- **Canvas first** — every v2 surface lives over the watercolor wash. Cards never have a hard background; they are translucent.
- **Generous corners** — 24px on cards, 999px on chips and primary buttons.
- **Sidebar** — translucent vellum column with backdrop blur, no hard rule between it and content. Active item gets a Moss-tinted glass highlight.
- **Login** — single column, large Nunito greeting on the left, glass form panel floating on the right with a soft drop-shadow. No split-screen rule.
- **Teacher Today** — soft asymmetric grid: hero card spans 7/12, two stacked secondary cards on 5/12. AI brief sidecar floats with a glass blur and Moss tint.

## 6. Component stylings
- **Buttons** — pill (999px). Primary = Moss filled with a subtle vertical gradient overlay (lighter at top). Secondary = vellum glass with hairline border. Active state: `translateY(1px)`. No outer glow.
- **Cards** — frosted vellum with 1px top highlight (`inset 0 1px 0 rgba(255,255,255,0.7)`) and a soft tinted shadow. Hover lifts 2px and softens shadow.
- **Chips** — 999px pill. Glass tint by default. Role-coloured chips use existing soft tokens at low opacity.
- **Inputs** — rounded 16px, glass-tinted background, clear Moss focus ring.
- **Numerals** — Nunito 900, tabular nums, Moss colour for the hero stat.

## 7. Motion
- **Watercolor drift** — the four background blobs slowly translate (90s loop) — perceptible but never demanding attention. Disabled under `prefers-reduced-motion`.
- **Card hover** — `translateY(-2px)` + shadow soften, 240ms.
- **Spring curve** — `cubic-bezier(0.32, 0.72, 0, 1)`.
- **AI sparkle** — gentle pulse on a small Moss dot, 2.6s loop.
- **No** — number tickers, hairline draw-ins, marquee tracks (those were Studio).

## 8. What's different from v2-Studio
- **Soft over sharp** — pill buttons replace squared, 24px card corners replace 8px.
- **Watercolor over grid** — atmospheric background replaces dot grid + magazine masthead.
- **Sans over serif** — Nunito display replaces Fraunces.
- **One accent over two** — Moss only; Terra is state-reserved (Studio used Tangerine + Ultramarine equally).
- **Glass over hairline** — translucent cards replace bordered hairline sections.

## 9. Anti-patterns (banned)
- Pure black (`#000000`) — Ink is off-black with green undertone
- AI purple/blue neon
- Generic serifs (Times, Georgia, Garamond)
- Multi-accent decoration (Moss is the accent; Terra is state)
- Animating `top`, `left`, `width`, `height`, `box-shadow`
- Backdrop-filter values above 18px (perf)
- Decorative emojis
- Fabricated metrics
