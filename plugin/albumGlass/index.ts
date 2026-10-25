/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Baselhesham
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/*
 * AlbumGlass — the Liquid Glass theme follows your Spotify album art:
 *   • Kawarp fluid background (WebGL Kawase blur + domain warp, like Apple Music) from the album cover
 *   • the WHOLE theme recolours: panels, glass tint, text, borders, hovers, accents
 *   • stronger frosted glass on every panel
 *   • side visualizers (beat-synced, fade out when paused)
 *
 * Background renderer: @kawarp/core by Better Lyrics (MIT) — see kawarp.js / KAWARP-LICENSE.txt
 */

import { definePluginSettings } from "@api/Settings";
import definePlugin, { OptionType } from "@utils/types";
import { findStoreLazy } from "@webpack";
import { UserStore } from "@webpack/common";

import { Kawarp } from "./kawarp.js";

const PresenceStore = findStoreLazy("PresenceStore");

/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */

const settings = definePluginSettings({
    recolorTheme: {
        type: OptionType.BOOLEAN,
        description: "Recolour the whole theme (panels, text, borders, accents) from the album",
        default: true,
        onChange: () => applyThemeColors()
    },
    glassStrength: {
        type: OptionType.SLIDER,
        description: "Glass see-through amount (higher = more of the moving background shows through)",
        markers: [0, 0.25, 0.5, 0.75, 1],
        default: 0.6,
        stickToMarkers: false,
        onChange: () => applyThemeColors()
    },
    blur: {
        type: OptionType.SLIDER,
        description: "Frosted blur on panels (px)",
        markers: [0, 20, 40, 60, 80],
        default: 40,
        stickToMarkers: false,
        onChange: () => applyThemeColors()
    },
    warp: {
        type: OptionType.SLIDER,
        description: "Background warp / swirl strength",
        markers: [0, 0.25, 0.5, 0.75, 1],
        default: 0.8,
        stickToMarkers: false,
        onChange: () => applyKawarpOptions()
    },
    motionSpeed: {
        type: OptionType.SLIDER,
        description: "Background motion speed",
        markers: [0.25, 0.5, 1, 1.5, 2, 3],
        default: 1,
        stickToMarkers: false,
        onChange: () => applyKawarpOptions()
    },
    saturation: {
        type: OptionType.SLIDER,
        description: "Background colour boost",
        markers: [0.8, 1, 1.5, 2, 2.5],
        default: 1.6,
        stickToMarkers: false,
        onChange: () => applyKawarpOptions()
    },
    dim: {
        type: OptionType.SLIDER,
        description: "Darken the background (higher = darker, easier to read)",
        markers: [0, 0.2, 0.35, 0.5, 0.7],
        default: 0.3,
        stickToMarkers: false,
        onChange: () => applyStaticVars()
    },
    quality: {
        type: OptionType.SELECT,
        description: "Background render quality (lower = less GPU, looks almost the same because it's blurred)",
        options: [
            { label: "Low (0.35x)", value: 0.35 },
            { label: "Balanced (0.5x)", value: 0.5, default: true },
            { label: "High (1x)", value: 1 }
        ],
        onChange: () => layout()
    },
    autoBrighten: {
        type: OptionType.BOOLEAN,
        description: "Brighten dark album covers so the background is always colourful",
        default: true,
        onChange: () => applyBrightness()
    },
    beatPulse: {
        type: OptionType.BOOLEAN,
        description: "Background breathes slightly on the beat",
        default: true
    },
    visualizer: {
        type: OptionType.BOOLEAN,
        description: "Show the side visualizers",
        default: false,
        onChange: () => layout()
    },
    visualizerSide: {
        type: OptionType.SELECT,
        description: "Which side(s) the visualizer bars come from",
        options: [
            { label: "Both sides", value: "both", default: true },
            { label: "Left only", value: "left" },
            { label: "Right only", value: "right" }
        ],
        onChange: () => layout()
    },
    visualizerLayer: {
        type: OptionType.SELECT,
        description: "Behind the glass = soft glow through the panels. In front = sharp bars on the window edges",
        options: [
            { label: "Behind the glass", value: "behind", default: true },
            { label: "In front (window edges)", value: "front" }
        ],
        onChange: () => layout()
    },
    visualizerWidth: {
        type: OptionType.SLIDER,
        description: "How far the bars reach in from the edge (px)",
        markers: [60, 100, 160, 220, 300],
        default: 160,
        stickToMarkers: false,
        onChange: () => layout()
    },
    bpm: {
        type: OptionType.SLIDER,
        description: "Beat speed of the visualizer (BPM)",
        markers: [70, 90, 110, 120, 130, 150, 170],
        default: 120,
        stickToMarkers: false
    },
    intensity: {
        type: OptionType.SLIDER,
        description: "Visualizer intensity",
        markers: [0.3, 0.6, 1, 1.4, 1.8],
        default: 1,
        stickToMarkers: false
    }
});

/* ------------------------------------------------------------------ */
/* Colour helpers                                                      */
/* ------------------------------------------------------------------ */

interface HSL { h: number; s: number; l: number; }

function rgbToHsl(r: number, g: number, b: number): HSL {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const l = (max + min) / 2;
    let h = 0, s = 0;
    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
        else if (max === g) h = (b - r) / d + 2;
        else h = (r - g) / d + 4;
        h *= 60;
    }
    return { h, s, l };
}

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const hsl = (c: HSL, a = 1) =>
    `hsla(${c.h.toFixed(1)}, ${(c.s * 100).toFixed(1)}%, ${(c.l * 100).toFixed(1)}%, ${a.toFixed(3)})`;

// Default palette = the Liquid Glass theme's own colours (used when nothing is playing)
const DEFAULT_PALETTE: HSL[] = [
    { h: 248, s: 0.45, l: 0.45 },
    { h: 198, s: 0.75, l: 0.33 },
    { h: 326, s: 0.58, l: 0.38 },
    { h: 166, s: 0.70, l: 0.28 },
    { h: 262, s: 0.40, l: 0.35 }
];

function extractPalette(url: string): Promise<HSL[]> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onerror = () => reject(new Error("album art failed to load"));
        img.onload = () => {
            try {
                const size = 48;
                const canvas = document.createElement("canvas");
                canvas.width = canvas.height = size;
                const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
                ctx.drawImage(img, 0, 0, size, size);
                const { data } = ctx.getImageData(0, 0, size, size);

                const buckets = new Map<number, { r: number; g: number; b: number; n: number; }>();
                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i], g = data[i + 1], b = data[i + 2];
                    const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
                    const e = buckets.get(key);
                    if (e) { e.r += r; e.g += g; e.b += b; e.n++; }
                    else buckets.set(key, { r, g, b, n: 1 });
                }

                const ranked = [...buckets.values()]
                    .map(e => {
                        const r = e.r / e.n, g = e.g / e.n, b = e.b / e.n;
                        const c = rgbToHsl(r, g, b);
                        const lightOk = c.l > 0.1 && c.l < 0.92 ? 1 : 0.15;
                        return { r, g, b, c, score: e.n * (0.3 + c.s) * lightOk };
                    })
                    .sort((a, b) => b.score - a.score);

                const picked: typeof ranked = [];
                for (const cand of ranked) {
                    if (picked.every(p => Math.hypot(p.r - cand.r, p.g - cand.g, p.b - cand.b) > 55))
                        picked.push(cand);
                    if (picked.length === 5) break;
                }

                const palette = picked.map(p => p.c);
                const base = palette[0] ?? DEFAULT_PALETTE[0];
                while (palette.length < 5)
                    palette.push({ h: (base.h + palette.length * 38) % 360, s: Math.max(base.s, 0.25), l: base.l });

                resolve(palette);
            } catch (e) {
                reject(e);
            }
        };
        img.src = url;
    });
}

/* ------------------------------------------------------------------ */
/* State                                                               */
/* ------------------------------------------------------------------ */

let ambient: HTMLDivElement | null = null;
let warpCanvas: HTMLCanvasElement | null = null;
let kawarp: Kawarp | null = null;
let canvasL: HTMLCanvasElement | null = null;
let canvasR: HTMLCanvasElement | null = null;
let styleEl: HTMLStyleElement | null = null;
let pollTimer: ReturnType<typeof setInterval> | null = null;
let rafId = 0;

let currentArt: string | null = null;
let isPlaying = false;
let palette: HSL[] = DEFAULT_PALETTE;
let barColors: string[] = [];
let energy = 0;
let lastFrame = 0;
let lastPlayerEvent = 0;
const BARS = 44;
const values = new Float32Array(BARS * 2);
const phases = Array.from({ length: BARS * 2 }, () => Math.random() * Math.PI * 2);
const speeds = Array.from({ length: BARS * 2 }, () => 0.6 + Math.random() * 1.6);

// theme variables this plugin overrides (removed again on stop)
const THEME_VARS = [
    "--bg-1", "--bg-2", "--bg-3", "--bg-4", "--bg-floating", "--lg-solid",
    "--hover", "--active", "--active-2", "--message-hover",
    "--text-1", "--text-2", "--text-3", "--text-4", "--text-5",
    "--border-light", "--border", "--border-hover", "--button-border",
    "--lg-highlight", "--blur-amount",
    "--accent-1", "--accent-2", "--accent-3", "--accent-4", "--accent-5", "--accent-new"
];

/* ------------------------------------------------------------------ */
/* Styles                                                              */
/* ------------------------------------------------------------------ */

const CSS = `
@property --ag-c1 { syntax: '<color>'; inherits: true; initial-value: #3b2f7a; }
@property --ag-c2 { syntax: '<color>'; inherits: true; initial-value: #145a78; }
@property --ag-c3 { syntax: '<color>'; inherits: true; initial-value: #7a1f55; }
@property --ag-c4 { syntax: '<color>'; inherits: true; initial-value: #146e5c; }

/* let the moving background show: the theme's own wallpaper layers go transparent */
/* no html class needed: Discord resets <html> classes, which turned this off after a second */
:root, :root body, :root #app-mount {
    background: transparent !important;
}

#ag-ambient {
    position: fixed; inset: 0; z-index: -1; overflow: hidden; pointer-events: none;
    background: #07080f;
}
/* CSS fallback if WebGL is unavailable */
#ag-ambient .ag-fallback {
    position: absolute; inset: -10%;
    background:
        radial-gradient(circle at 20% 25%, var(--ag-c1) 0%, transparent 55%),
        radial-gradient(circle at 80% 20%, var(--ag-c2) 0%, transparent 50%),
        radial-gradient(circle at 75% 80%, var(--ag-c3) 0%, transparent 55%),
        radial-gradient(circle at 20% 85%, var(--ag-c4) 0%, transparent 50%);
    filter: blur(40px);
    transition: --ag-c1 2s ease, --ag-c2 2s ease, --ag-c3 2s ease, --ag-c4 2s ease;
    animation: ag-drift 40s ease-in-out infinite alternate;
}
#ag-ambient.webgl .ag-fallback { display: none; }
#ag-warp {
    position: absolute; inset: -4%; width: 108%; height: 108%;
    transform-origin: center; will-change: transform;
    transition: filter 1.6s ease;
}
#ag-ambient .ag-dim {
    position: absolute; inset: 0;
    background:
        radial-gradient(ellipse at center, transparent 40%, rgba(0, 0, 0, 0.4) 100%),
        rgba(3, 4, 8, var(--ag-dim, 0.3));
}
@keyframes ag-drift {
    from { transform: translate(-3%, -2%) rotate(0deg) scale(1.05); }
    to   { transform: translate(3%, 2%) rotate(8deg) scale(1.15); }
}

/* ---------- stronger liquid glass (only while the plugin is on) ---------- */
:root [class*="sidebar_"]:not([class*="sidebarList"]),
:root main[class*="chatContent_"],
:root [class*="membersWrap_"],
:root [class*="panels_"],
:root section[class*="title_"][class*="container_"],
:root [class*="guilds_"],
:root [class*="channelTextArea_"] [class*="scrollableContainer_"] {
    backdrop-filter: blur(var(--blur-amount, 40px)) saturate(160%) !important;
    -webkit-backdrop-filter: blur(var(--blur-amount, 40px)) saturate(160%) !important;
    box-shadow:
        inset 0 1px 0 var(--lg-highlight),
        inset 0 -1px 0 hsla(0, 0%, 100%, 0.04),
        inset 1px 0 0 hsla(0, 0%, 100%, 0.05),
        0 12px 40px rgba(0, 0, 0, 0.35) !important;
}

.ag-viz { position: fixed; top: 0; height: 100vh; pointer-events: none; }
.ag-viz.left { left: 0; }
.ag-viz.right { right: 0; }
.ag-viz.behind { z-index: -1; }
.ag-viz.front { z-index: 10000; mix-blend-mode: screen; opacity: 0.85; }

@media (prefers-reduced-motion: reduce) {
    #ag-ambient .ag-fallback { animation: none !important; }
}
`;

/* ------------------------------------------------------------------ */
/* DOM                                                                 */
/* ------------------------------------------------------------------ */

function buildDom() {
    styleEl = document.createElement("style");
    styleEl.id = "ag-style";
    styleEl.textContent = CSS;
    document.head.appendChild(styleEl);

    ambient = document.createElement("div");
    ambient.id = "ag-ambient";

    const fallback = document.createElement("div");
    fallback.className = "ag-fallback";
    ambient.appendChild(fallback);

    warpCanvas = document.createElement("canvas");
    warpCanvas.id = "ag-warp";
    ambient.appendChild(warpCanvas);

    const dim = document.createElement("div");
    dim.className = "ag-dim";
    ambient.appendChild(dim);
    document.body.prepend(ambient);

    try {
        kawarp = new Kawarp(warpCanvas, {
            blurPasses: 8,
            transitionDuration: 1600,
            tintIntensity: 0.12,
            dithering: 0.01
        });
        ambient.classList.add("webgl");
        warpCanvas.addEventListener("webglcontextlost", ev => {
            ev.preventDefault();
            console.warn("[AlbumGlass] WebGL context lost, showing CSS background until it comes back");
            ambient?.classList.remove("webgl");
        });
        warpCanvas.addEventListener("webglcontextrestored", () => recreateKawarp());
    } catch (e) {
        console.warn("[AlbumGlass] WebGL not available, using CSS background", e);
        kawarp = null;
        warpCanvas.remove();
        warpCanvas = null;
    }

    canvasL = document.createElement("canvas");
    canvasR = document.createElement("canvas");
    document.body.append(canvasL, canvasR);

    document.documentElement.classList.add("ag-active");
    window.addEventListener("resize", layout);
    layout();
    applyStaticVars();
    applyKawarpOptions();
    applyPalette(DEFAULT_PALETTE);
    showDefaultBackground();
    kawarp?.start();
}

function recreateKawarp() {
    if (!warpCanvas) return;
    try { kawarp?.dispose(); } catch { /* ignore */ }
    try {
        kawarp = new Kawarp(warpCanvas, { blurPasses: 8, transitionDuration: 1600, tintIntensity: 0.12, dithering: 0.01 });
        ambient?.classList.add("webgl");
        applyKawarpOptions();
        if (currentArt) kawarp.loadImage(currentArt).catch(() => showDefaultBackground());
        else showDefaultBackground();
        kawarp.start();
    } catch (e) {
        console.warn("[AlbumGlass] could not restart WebGL", e);
        kawarp = null;
    }
}

function destroyDom() {
    window.removeEventListener("resize", layout);
    try { kawarp?.dispose(); } catch { /* already gone */ }
    kawarp = null;
    ambient?.remove(); canvasL?.remove(); canvasR?.remove(); styleEl?.remove();
    ambient = null; warpCanvas = null; canvasL = null; canvasR = null; styleEl = null;
    document.documentElement.classList.remove("ag-active");
    clearThemeColors();
}

function layout() {
    if (warpCanvas && kawarp) {
        const q = Number(settings.store.quality) || 0.5;
        const w = Math.max(64, Math.round(window.innerWidth * 1.08 * q));
        const h = Math.max(64, Math.round(window.innerHeight * 1.08 * q));
        if (warpCanvas.width !== w || warpCanvas.height !== h) {
            warpCanvas.width = w;
            warpCanvas.height = h;
            kawarp.resize();
        }
    }

    if (!canvasL || !canvasR) return;
    const { visualizer, visualizerSide, visualizerLayer, visualizerWidth } = settings.store;
    const dpr = window.devicePixelRatio || 1;
    for (const [cv, side] of [[canvasL, "left"], [canvasR, "right"]] as const) {
        const show = visualizer && (visualizerSide === "both" || visualizerSide === side);
        cv.className = `ag-viz ${side} ${visualizerLayer}`;
        cv.style.display = show ? "block" : "none";
        cv.style.width = `${visualizerWidth}px`;
        cv.width = Math.round(visualizerWidth * dpr);
        cv.height = Math.round(window.innerHeight * dpr);
    }
    ensureLoop();
}

function applyStaticVars() {
    ambient?.style.setProperty("--ag-dim", String(settings.store.dim));
}

function applyKawarpOptions() {
    if (!kawarp) return;
    const s = settings.store;
    kawarp.setOptions({
        warpIntensity: s.warp,
        saturation: s.saturation,
        // keeps flowing slowly while paused, full speed while playing
        animationSpeed: (s.motionSpeed || 1) * (isPlaying ? 1 : 0.35)
    });
}

function showDefaultBackground() {
    kawarp?.loadGradient(DEFAULT_PALETTE.slice(0, 4).map(c => hsl({ h: c.h, s: c.s, l: c.l + 0.05 })), 135);
}

/* ------------------------------------------------------------------ */
/* Theme recolouring                                                   */
/* ------------------------------------------------------------------ */

function clearThemeColors() {
    const b = document.body?.style;
    if (!b) return;
    for (const v of THEME_VARS) b.removeProperty(v);
}

// Dark covers (night photos, black artwork) would give an almost black background.
// Lift them based on how bright the album's colours are.
function applyBrightness() {
    if (!warpCanvas) return;
    if (!settings.store.autoBrighten) { warpCanvas.style.filter = ""; return; }
    const top = [...palette].sort((a, b) => b.s - a.s).slice(0, 3);
    const avgL = top.reduce((n, c) => n + c.l, 0) / top.length;
    const avgS = top.reduce((n, c) => n + c.s, 0) / top.length;
    const bright = clamp(0.42 / Math.max(avgL, 0.08), 1, 2.4);
    const sat = clamp(0.55 / Math.max(avgS, 0.1), 1, 1.8);
    warpCanvas.style.filter = bright > 1.02 || sat > 1.02
        ? `brightness(${bright.toFixed(2)}) saturate(${sat.toFixed(2)})`
        : "";
}

function applyPalette(p: HSL[]) {
    palette = p;
    applyBrightness();

    if (ambient) {
        p.slice(0, 4).forEach((c, i) =>
            ambient!.style.setProperty(`--ag-c${i + 1}`, hsl({ h: c.h, s: clamp(Math.max(c.s, 0.35), 0, 0.9), l: clamp(c.l, 0.3, 0.55) })));
    }

    barColors = [];
    for (let i = 0; i < BARS; i++) {
        const t = (i / (BARS - 1)) * (p.length - 1);
        const a = p[Math.floor(t)], b = p[Math.min(p.length - 1, Math.ceil(t))], f = t % 1;
        let dh = b.h - a.h;
        if (dh > 180) dh -= 360;
        if (dh < -180) dh += 360;
        barColors.push(hsl({
            h: (a.h + dh * f + 360) % 360,
            s: clamp(Math.max(a.s + (b.s - a.s) * f, 0.45), 0, 0.95),
            l: clamp(a.l + (b.l - a.l) * f, 0.55, 0.72)
        }, 1));
    }
    applyThemeColors();
}

function applyThemeColors() {
    const b = document.body?.style;
    if (!b) return;
    const s = settings.store;

    b.setProperty("--blur-amount", `${Math.round(s.blur)}px`);

    if (!s.recolorTheme) {
        for (const v of THEME_VARS) if (v !== "--blur-amount") b.removeProperty(v);
        return;
    }

    // base hue = dominant colour, accent = most colourful readable colour
    const base = palette[0];
    const accent = [...palette].sort((x, y) =>
        (y.s * (y.l > 0.15 ? 1 : 0.2)) - (x.s * (x.l > 0.15 ? 1 : 0.2)))[0];
    const H = base.h;
    const S = clamp(base.s, 0.15, 0.55); // keep surfaces tasteful, never neon
    const AH = accent.h;
    const AS = clamp(Math.max(accent.s, 0.45), 0, 0.85);

    // glass: higher glassStrength = more transparent panels
    const g = clamp(s.glassStrength, 0, 1);
    const panel = 0.62 - g * 0.4; // 0.62 .. 0.22
    const gap = 0.32 - g * 0.3; // 0.32 .. 0.02

    const set = (k: string, v: string) => b.setProperty(k, v);

    // surfaces (smoked glass tinted with the album colour)
    set("--bg-4", hsl({ h: H, s: S, l: 0.07 }, panel));
    set("--bg-3", hsl({ h: H, s: S, l: 0.05 }, gap));
    set("--bg-2", hsl({ h: H, s: S, l: 0.16 }, panel * 0.9));
    set("--bg-1", hsl({ h: H, s: S, l: 0.24 }, panel));
    set("--bg-floating", hsl({ h: H, s: S, l: 0.07 }, 0.86));
    set("--lg-solid", hsl({ h: H, s: S, l: 0.06 }, 0.9));

    // interaction states
    set("--hover", hsl({ h: AH, s: 0.5, l: 0.75 }, 0.08));
    set("--active", hsl({ h: AH, s: 0.5, l: 0.75 }, 0.14));
    set("--active-2", hsl({ h: AH, s: 0.5, l: 0.75 }, 0.2));
    set("--message-hover", hsl({ h: AH, s: 0.5, l: 0.8 }, 0.045));

    // text, lightly tinted so it belongs to the album but stays readable
    set("--text-1", hsl({ h: H, s: 0.45, l: 0.96 }));
    set("--text-2", hsl({ h: H, s: 0.3, l: 0.8 }));
    set("--text-3", hsl({ h: H, s: 0.22, l: 0.7 }));
    set("--text-4", hsl({ h: H, s: 0.16, l: 0.52 }));
    set("--text-5", hsl({ h: H, s: 0.14, l: 0.36 }));

    // glass edges
    set("--border-light", hsl({ h: AH, s: 0.6, l: 0.85 }, 0.06));
    set("--border", hsl({ h: AH, s: 0.6, l: 0.85 }, 0.11));
    set("--border-hover", hsl({ h: AH, s: 0.6, l: 0.85 }, 0.22));
    set("--button-border", hsl({ h: AH, s: 0.6, l: 0.85 }, 0.13));
    set("--lg-highlight", hsl({ h: AH, s: 0.5, l: 0.92 }, 0.2));

    // accents
    [0.8, 0.74, 0.68, 0.62, 0.56].forEach((l, i) =>
        set(`--accent-${i + 1}`, hsl({ h: AH, s: AS, l })));
    set("--accent-new", "var(--accent-2)");
}

/* ------------------------------------------------------------------ */
/* Spotify tracking                                                    */
/* ------------------------------------------------------------------ */

async function onTrack(art: string | null, playing: boolean) {
    const wasPlaying = isPlaying;
    isPlaying = playing;
    if (wasPlaying !== playing) applyKawarpOptions();
    ensureLoop();

    if (art === currentArt) return;
    currentArt = art;

    if (!art) {
        showDefaultBackground();
        applyPalette(DEFAULT_PALETTE);
        return;
    }

    kawarp?.loadImage(art).catch(e => console.warn("[AlbumGlass] background image failed", e));
    try {
        const p = await extractPalette(art);
        if (art === currentArt) applyPalette(p);
    } catch (e) {
        console.warn("[AlbumGlass] could not read album colours", e);
    }
}

// Keep our layers alive if Discord re-renders the page
function ensureDom() {
    if (styleEl && !styleEl.isConnected) document.head.appendChild(styleEl);
    if (ambient && !ambient.isConnected) document.body.prepend(ambient);
    if (canvasL && !canvasL.isConnected) document.body.append(canvasL);
    if (canvasR && !canvasR.isConnected) document.body.append(canvasR);
}

function pollPresence() {
    ensureDom();
    try {
        const me = UserStore.getCurrentUser()?.id;
        if (!me) return;
        const acts: any[] = PresenceStore.getActivities?.(me) ?? [];
        const sp = acts.find(a => a?.type === 2 && (a.name === "Spotify" || a.party?.id?.startsWith?.("spotify:")));
        const img: string | undefined = sp?.assets?.large_image;
        if (sp && img?.startsWith("spotify:")) {
            onTrack(`https://i.scdn.co/image/${img.slice(8)}`, true);
        } else if (!sp && lastPlayerEvent < Date.now() - 15000) {
            onTrack(currentArt, false);
        }
    } catch { /* store not ready yet */ }
}

/* ------------------------------------------------------------------ */
/* Visualizer + beat                                                   */
/* ------------------------------------------------------------------ */

function ensureLoop() {
    if (!rafId && (canvasL || canvasR)) {
        lastFrame = performance.now();
        rafId = requestAnimationFrame(frame);
    }
}

function frame(now: number) {
    rafId = 0;
    if (!canvasL || !canvasR) return;

    const dt = Math.min(0.05, (now - lastFrame) / 1000);
    lastFrame = now;
    const s = settings.store;

    energy += ((isPlaying ? 1 : 0) - energy) * Math.min(1, dt * 3);

    const t = now / 1000;
    const beatPhase = (t * (s.bpm / 60)) % 1;
    const beat = Math.pow(1 - beatPhase, 4);
    const halfBeat = Math.pow(1 - ((t * (s.bpm / 60) * 2) % 1), 6) * 0.35;

    if (warpCanvas) {
        warpCanvas.style.transform = s.beatPulse && energy > 0.01
            ? `scale(${(1 + (beat * 0.025 + halfBeat * 0.01) * energy * s.intensity).toFixed(4)})`
            : "";
    }

    if (s.visualizer && !document.hidden) {
        for (let i = 0; i < BARS * 2; i++) {
            const k = i % BARS;
            const centre = 1 - Math.abs(k / (BARS - 1) - 0.5) * 1.1;
            const wobble = 0.5 + 0.5 * Math.sin(t * speeds[i] * 2.2 + phases[i]) * Math.sin(t * speeds[i] * 0.9 + phases[i] * 2);
            const kick = beat * (0.55 + 0.45 * Math.sin(k * 0.55 + t * 1.3));
            const target = energy * s.intensity * clamp(0.12 + wobble * 0.45 * centre + kick * 0.5 + halfBeat * 0.3 * wobble, 0, 1.25);
            const rate = target > values[i] ? 0.45 : 0.12;
            values[i] += (target - values[i]) * rate;
        }
        drawSide(canvasL, 0, false);
        drawSide(canvasR, BARS, true);
    }

    const idle = energy < 0.005 && values.every(v => v < 0.002);
    if (idle) {
        for (const cv of [canvasL, canvasR]) cv.getContext("2d")?.clearRect(0, 0, cv.width, cv.height);
        if (warpCanvas) warpCanvas.style.transform = "";
        return;
    }
    rafId = requestAnimationFrame(frame);
}

function drawSide(cv: HTMLCanvasElement, offset: number, mirror: boolean) {
    if (cv.style.display === "none") return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const W = cv.width, H = cv.height;
    ctx.clearRect(0, 0, W, H);

    const slot = H / BARS;
    const thick = Math.max(2, slot * 0.55);
    const radius = thick / 2;

    for (let k = 0; k < BARS; k++) {
        const v = values[offset + k];
        if (v < 0.01) continue;
        const len = Math.max(thick, v * W * 0.95);
        const y = k * slot + (slot - thick) / 2;
        const x = mirror ? W - len : 0;
        const color = barColors[k] ?? "white";

        const grad = ctx.createLinearGradient(mirror ? W : 0, 0, mirror ? W - len : len, 0);
        grad.addColorStop(0, color);
        grad.addColorStop(1, color.replace(/, 1\.000\)$/, ", 0)"));

        ctx.globalAlpha = clamp(0.35 + v * 0.65, 0, 1);
        ctx.shadowColor = color;
        ctx.shadowBlur = 12 * (window.devicePixelRatio || 1) * v;
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, y, len, thick, radius);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
}

/* ------------------------------------------------------------------ */
/* Plugin                                                              */
/* ------------------------------------------------------------------ */

export default definePlugin({
    name: "AlbumGlass",
    description: "Liquid Glass theme follows your Spotify album: Kawarp fluid background, full theme recolour, stronger glass, side visualizers.",
    authors: [{ name: "Baselhesham", id: 0n }],
    settings,

    flux: {
        SPOTIFY_PLAYER_STATE(e: any) {
            lastPlayerEvent = Date.now();
            const art: string | undefined = e?.track?.album?.image?.url;
            onTrack(art ?? currentArt, !!e?.isPlaying && !!e?.track);
        }
    },

    start() {
        buildDom();
        pollPresence();
        pollTimer = setInterval(pollPresence, 3000);
        document.addEventListener("visibilitychange", ensureLoop);
    },

    stop() {
        if (pollTimer) clearInterval(pollTimer);
        pollTimer = null;
        cancelAnimationFrame(rafId);
        rafId = 0;
        document.removeEventListener("visibilitychange", ensureLoop);
        destroyDom();
        currentArt = null;
        isPlaying = false;
        energy = 0;
        values.fill(0);
        palette = DEFAULT_PALETTE;
    }
});
