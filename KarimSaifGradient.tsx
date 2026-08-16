/**
 * Karim Saif Gradient
 * Made with 💛 by Karim Saif
 * https://x.com/karimsaif0
 */

import { useEffect, useRef, useState, useId, type CSSProperties } from "react"
import { addPropertyControls, ControlType, useIsStaticRenderer } from "framer"

export type GradientMode = "Bars" | "Peaked" | "Dodge"

export type GradientPreset =
    | "Signature"
    | "Aurora"
    | "Sunset"
    | "Neon"
    | "Spectrum"
    | "Ember"
    | "Ocean"
    | "Minimal"
    | "Custom"

export type AnimationEasing = "smooth" | "snappy" | "gentle" | "linear"

type Stop = { offset: number; color: string }

interface PresetConfig {
    mode: GradientMode
    bars?: number
    overlap?: number
    blur?: number
    peak?: number
    valley?: number
    pointiness?: number
    spread?: number
    intensity?: number
    opacity?: number
    colors?: string[]
}

const EASING_MAP: Record<AnimationEasing, string> = {
    smooth: "cubic-bezier(0.16, 1, 0.3, 1)",
    snappy: "cubic-bezier(0.05, 0.9, 0.1, 1)",
    gentle: "cubic-bezier(0.4, 0, 0.2, 1)",
    linear: "linear",
}

const DEFAULT_STOPS: Stop[] = [
    { offset: 0, color: "#340B05" },
    { offset: 0.1827, color: "#0358F7" },
    { offset: 0.2837, color: "#5092C7" },
    { offset: 0.4135, color: "#E1ECFE" },
    { offset: 0.5866, color: "#FFD400" },
    { offset: 0.6827, color: "#FA3D1D" },
    { offset: 0.8029, color: "#FD02F5" },
    { offset: 1, color: "rgba(255, 192, 253, 0)" },
]

const DEFAULT_PEAK_COLORS = [
    "#E1ECFE",
    "#FFD400",
    "#FA3D1D",
    "#FD02F5",
    "#0358F7",
    "#340B05",
]

const DEFAULT_DODGE_COLORS = [
    "#FF0000",
    "#FFFF00",
    "#00FF00",
    "#00FFFF",
    "#0000FF",
    "#FF00FF",
]

const PRESET_CONFIGS: Record<Exclude<GradientPreset, "Custom">, PresetConfig> = {
    Signature: { mode: "Bars", bars: 9, overlap: 23, blur: 15, peak: 0.98, valley: 0.55, spread: 1.0, intensity: 100, opacity: 1 },
    Aurora: { mode: "Bars", bars: 11, overlap: 30, blur: 24, peak: 0.92, valley: 0.4, spread: 1.1, intensity: 110, opacity: 0.85 },
    Sunset: { mode: "Peaked", colors: ["#FFF275", "#FF8C42", "#FF3C38", "#A23B72", "#2E1A47"], blur: 22, peak: 0.94, pointiness: 0.5, spread: 1.0, intensity: 100, opacity: 1 },
    Neon: { mode: "Peaked", colors: ["#00FFFF", "#00FF66", "#FF007F", "#7928CA", "#11002C"], blur: 18, peak: 0.95, pointiness: 0.65, spread: 0.9, intensity: 125, opacity: 1 },
    Spectrum: { mode: "Dodge", colors: ["#FF0000", "#FFFF00", "#00FF00", "#00FFFF", "#0000FF", "#FF00FF"], intensity: 100, opacity: 1 },
    Ember: { mode: "Peaked", colors: ["#FFDE59", "#FF914D", "#FF5757", "#C81D25", "#210103"], blur: 20, peak: 0.9, pointiness: 0.45, spread: 1.05, intensity: 105, opacity: 1 },
    Ocean: { mode: "Peaked", colors: ["#E0F7FA", "#4DD0E1", "#0288D1", "#01579B", "#001026"], blur: 24, peak: 0.92, pointiness: 0.55, spread: 1.15, intensity: 95, opacity: 0.9 },
    Minimal: { mode: "Bars", bars: 7, overlap: 15, blur: 18, peak: 0.72, valley: 0.65, spread: 0.95, intensity: 80, opacity: 0.45 },
}

const VBW = 1271
const VBH = 599

function bellHeights(n: number, peak: number, valley: number): number[] {
    const out: number[] = []
    const mid = (n - 1) / 2
    for (let i = 0; i < n; i++) {
        const t = mid === 0 ? 0 : Math.abs(i - mid) / mid
        const eased = 1 - Math.pow(t, 1.24)
        out.push(peak * VBH * (valley + (1 - valley) * eased))
    }
    return out
}

function peakPath(widthFrac: number, heightFrac: number, pointiness: number): string {
    const w = widthFrac * VBW
    const startX = (VBW - w) / 2
    const endX = startX + w
    const peakX = VBW / 2
    const peakY = VBH - heightFrac * VBH
    const spreadOffset = (1 - pointiness) * (w / 2)
    const ext = VBH * 0.6
    return [
        `M ${startX} ${VBH}`,
        `Q ${peakX - spreadOffset} ${peakY}, ${peakX} ${peakY}`,
        `Q ${peakX + spreadOffset} ${peakY}, ${endX} ${VBH}`,
        `L ${endX} ${VBH + ext}`,
        `L ${startX} ${VBH + ext}`,
        "Z",
    ].join(" ")
}

export interface KarimSaifGradientProps {
    preset?: GradientPreset
    mode?: GradientMode
    bars?: number
    overlap?: number
    blur?: number
    peak?: number
    valley?: number
    pointiness?: number
    spread?: number
    intensity?: number
    opacity?: number
    riseMs?: number
    easing?: AnimationEasing
    reveal?: "mount" | "scroll" | "none"
    colors?: string[]
    ariaLabel?: string
    style?: CSSProperties
    className?: string
}

export default function KarimSaifGradient(props: KarimSaifGradientProps) {
    const {
        preset = "Signature", mode = "Bars", bars = 9, overlap = 23, blur = 15,
        peak = 0.98, valley = 0.55, pointiness = 0.5, spread = 1.0,
        intensity = 100, opacity = 1, riseMs = 1100, easing = "smooth",
        reveal = "mount", colors = DEFAULT_PEAK_COLORS,
        ariaLabel = "Karim Saif Gradient Glow", style, className,
    } = props

    const isCustom = preset === "Custom"
    const p = !isCustom && PRESET_CONFIGS[preset] ? PRESET_CONFIGS[preset] : null
    const activeMode = isCustom ? mode : (p?.mode ?? mode)
    const activeBars = isCustom ? bars : (p?.bars ?? bars)
    const activeOverlap = isCustom ? overlap : (p?.overlap ?? overlap)
    const activeBlur = isCustom ? blur : (p?.blur ?? blur)
    const activePeak = isCustom ? peak : (p?.peak ?? peak)
    const activeValley = isCustom ? valley : (p?.valley ?? valley)
    const activePointiness = isCustom ? pointiness : (p?.pointiness ?? pointiness)
    const activeSpread = isCustom ? spread : (p?.spread ?? spread)
    const activeIntensity = isCustom ? intensity : (p?.intensity ?? intensity)
    const activeOpacity = isCustom ? opacity : (p?.opacity ?? 1)
    const activeColors = isCustom ? colors : (p?.colors ?? colors)

    const isStatic = useIsStaticRenderer()
    const rawId = useId()
    const safeId = rawId.replace(/:/g, "-")
    const gradId = `karim-grad-${safeId}`
    const blurId = `karim-blur-${safeId}`
    const wrapRef = useRef<HTMLDivElement>(null)
    const [scaleY, setScaleY] = useState(isStatic || reveal === "none" ? 1 : 0)

    useEffect(() => {
        if (isStatic) { setScaleY(1); return }
        if (typeof window === "undefined") return
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
        if (reveal === "none" || reduced) { setScaleY(1); return }
        if (reveal === "mount") {
            let firstFrame = 0, secondFrame = 0
            setScaleY(0)
            firstFrame = requestAnimationFrame(() => { secondFrame = requestAnimationFrame(() => setScaleY(1)) })
            return () => { cancelAnimationFrame(firstFrame); cancelAnimationFrame(secondFrame) }
        }
        if (reveal === "scroll") {
            let ticking = false, frame = 0
            const measure = () => {
                ticking = false
                const el = wrapRef.current
                if (!el) return
                const r = el.getBoundingClientRect()
                const vh = window.innerHeight || 1
                const progress = (vh - r.top) / (vh - vh * 0.2)
                setScaleY(Math.max(0, Math.min(1, progress)))
            }
            const onScroll = () => {
                if (!ticking) { ticking = true; frame = requestAnimationFrame(measure) }
            }
            measure()
            window.addEventListener("scroll", onScroll, { passive: true })
            window.addEventListener("resize", onScroll, { passive: true })
            return () => {
                cancelAnimationFrame(frame)
                window.removeEventListener("scroll", onScroll)
                window.removeEventListener("resize", onScroll)
            }
        }
    }, [reveal, isStatic])

    const transitionEasing = EASING_MAP[easing] || EASING_MAP.smooth
    const intensityFilter = activeIntensity !== 100
        ? `brightness(${activeIntensity / 100}) saturate(${Math.max(0.2, activeIntensity / 100)})`
        : undefined
    const wrapperStyle: CSSProperties = {
        position: "relative", width: "100%", height: "100%", overflow: "hidden",
        opacity: activeOpacity, filter: intensityFilter, transformOrigin: "bottom",
        transform: `scaleY(${scaleY})`,
        transition: reveal === "mount" && !isStatic ? `transform ${riseMs}ms ${transitionEasing}` : undefined,
        willChange: "transform", ...style,
    }

    if (activeMode === "Dodge") {
        const palette = Array.isArray(activeColors) && activeColors.length > 0 ? activeColors : DEFAULT_DODGE_COLORS
        const band = palette.concat(palette[0] ?? DEFAULT_DODGE_COLORS[0])
        const backgroundStyle = "linear-gradient(0deg, #000000 0%, #f7f7f7 100%), " + `linear-gradient(90deg, ${band.join(", ")})`
        return <div ref={wrapRef} aria-label={ariaLabel || undefined} role={ariaLabel ? "img" : undefined} aria-hidden={ariaLabel ? undefined : true} className={className} style={wrapperStyle}>
            <div style={{ height: "100%", width: "100%", background: backgroundStyle, backgroundBlendMode: "color-dodge, normal", WebkitMaskImage: "radial-gradient(75% 170% at 50% 100%, #000 38%, transparent 78%)", maskImage: "radial-gradient(75% 170% at 50% 100%, #000 38%, transparent 78%)" }} />
        </div>
    }

    if (activeMode === "Peaked") {
        const palette = Array.isArray(activeColors) && activeColors.length > 0 ? activeColors : DEFAULT_PEAK_COLORS
        const layers = palette.slice().reverse().map((color, i, arr) => {
            const t = arr.length === 1 ? 1 : i / (arr.length - 1)
            const heightFrac = activePeak * (0.55 + 0.45 * t)
            const widthFrac = activeSpread * (1.05 - 0.45 * t)
            return { color, d: peakPath(widthFrac, heightFrac, activePointiness) }
        })
        return <div ref={wrapRef} aria-label={ariaLabel || undefined} role={ariaLabel ? "img" : undefined} aria-hidden={ariaLabel ? undefined : true} className={className} style={wrapperStyle}>
            <svg style={{ width: "100%", height: "100%" }} viewBox={`0 0 ${VBW} ${VBH}`} preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs><filter id={blurId} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation={activeBlur} /></filter></defs>
                <g filter={`url(#${blurId})`}>{layers.map((l, i) => <path key={i} d={l.d} fill={l.color} />)}</g>
            </svg>
        </div>
    }

    const safeBarCount = Math.max(3, Math.min(25, activeBars))
    const heights = bellHeights(safeBarCount, activePeak, activeValley)
    const colW = (VBW * activeSpread) / safeBarCount
    const startOffsetX = (VBW - VBW * activeSpread) / 2
    const overlapMultiplier = 1 + activeOverlap / 100
    return <div ref={wrapRef} aria-label={ariaLabel || undefined} role={ariaLabel ? "img" : undefined} aria-hidden={ariaLabel ? undefined : true} className={className} style={wrapperStyle}>
        <svg style={{ width: "100%", height: "100%" }} viewBox={`0 0 ${VBW} ${VBH}`} preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id={gradId} x1="0" y1="1" x2="0" y2="0">{DEFAULT_STOPS.map((s, i) => <stop key={i} offset={s.offset} stopColor={s.color} />)}</linearGradient>
                <filter id={blurId} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation={activeBlur} /></filter>
            </defs>
            {heights.map((h, i) => <g key={i} filter={`url(#${blurId})`}><rect x={startOffsetX + i * colW} y={VBH - h} width={colW * overlapMultiplier} height={h} fill={`url(#${gradId})`} /></g>)}
        </svg>
    </div>
}

addPropertyControls(KarimSaifGradient, {
    preset: { type: ControlType.Enum, title: "Preset", options: ["Signature", "Aurora", "Sunset", "Neon", "Spectrum", "Ember", "Ocean", "Minimal", "Custom"], defaultValue: "Signature", description: "Choose a curated aesthetic theme or select Custom to tweak all parameters." },
    mode: { type: ControlType.Enum, title: "Style", options: ["Bars", "Peaked", "Dodge"], optionTitles: ["Gradient Bars", "Layered Peak", "Color Dodge"], defaultValue: "Bars", description: "Rendering technique for the gradient shapes.", hidden(props) { return props.preset !== "Custom" } },
    bars: { type: ControlType.Number, title: "Bar Count", defaultValue: 9, min: 3, max: 25, step: 2, description: "Number of vertical gradient columns in the bell curve.", hidden(props) { return props.preset !== "Custom" || props.mode !== "Bars" } },
    overlap: { type: ControlType.Number, title: "Bar Overlap", defaultValue: 23, min: 0, max: 50, step: 1, unit: "%", description: "Horizontal overlap percentage between adjacent bars.", hidden(props) { return props.preset !== "Custom" || props.mode !== "Bars" } },
    peak: { type: ControlType.Number, title: "Peak Height", defaultValue: 0.98, min: 0.1, max: 1, step: 0.01, description: "Relative height of the central peak.", hidden(props) { return props.preset !== "Custom" || props.mode === "Dodge" } },
    valley: { type: ControlType.Number, title: "Edge Height", defaultValue: 0.55, min: 0.1, max: 1, step: 0.01, description: "Relative height of the outer edges.", hidden(props) { return props.preset !== "Custom" || props.mode !== "Bars" } },
    pointiness: { type: ControlType.Number, title: "Pointiness", defaultValue: 0.5, min: 0, max: 1, step: 0.05, description: "Sharpness of the arch.", hidden(props) { return props.preset !== "Custom" || props.mode !== "Peaked" } },
    spread: { type: ControlType.Number, title: "Spread", defaultValue: 1, min: 0.5, max: 1.5, step: 0.05, description: "Horizontal distribution width of the gradient geometry.", hidden(props) { return props.preset !== "Custom" || props.mode === "Dodge" } },
    blur: { type: ControlType.Number, title: "Blur", defaultValue: 15, min: 0, max: 50, step: 1, unit: "px", description: "Gaussian blur radius for smooth color blending.", hidden(props) { return props.preset !== "Custom" || props.mode === "Dodge" } },
    intensity: { type: ControlType.Number, title: "Intensity", defaultValue: 100, min: 0, max: 200, step: 5, unit: "%", description: "Brightness and saturation multiplier for glowing accents.", hidden(props) { return props.preset !== "Custom" } },
    opacity: { type: ControlType.Number, title: "Opacity", defaultValue: 1, min: 0, max: 1, step: 0.05, description: "Overall visual opacity for subtle background blending.", hidden(props) { return props.preset !== "Custom" } },
    colors: { type: ControlType.Array, title: "Colors", control: { type: ControlType.Color }, defaultValue: DEFAULT_PEAK_COLORS, description: "Layer palette for Peak and horizontal palette for Dodge.", hidden(props) { return props.preset !== "Custom" || props.mode === "Bars" } },
    reveal: { type: ControlType.Enum, title: "Reveal", options: ["mount", "scroll", "none"], optionTitles: ["On Load", "On Scroll", "None"], defaultValue: "mount", description: "Animation trigger for the bottom rise-up effect." },
    riseMs: { type: ControlType.Number, title: "Duration", defaultValue: 1100, min: 200, max: 4000, step: 50, unit: "ms", description: "Unfurl animation duration in milliseconds.", hidden(props) { return props.reveal !== "mount" } },
    easing: { type: ControlType.Enum, title: "Easing", options: ["smooth", "snappy", "gentle", "linear"], optionTitles: ["Smooth", "Snappy", "Gentle", "Linear"], defaultValue: "smooth", description: "Transition curve profile for the rise-up animation.", hidden(props) { return props.reveal !== "mount" } },
    ariaLabel: { type: ControlType.String, title: "Aria Label", defaultValue: "Karim Saif Gradient Glow", description: "Accessible name for screen readers. Leave empty if purely decorative." },
})
