/**
 * Font Registry - Pre-loaded Google Fonts for Motion Design
 *
 * This module loads and registers all available fonts at startup.
 * AI-generated compositions can use these fonts by simply passing
 * the font name as a string to fontFamily props.
 *
 * Usage:
 *   <AnimatedText text="Hello" fontFamily="DM Sans" />
 *   <div style={{ fontFamily: "Bebas Neue" }}>HEADLINE</div>
 */

// Sans-serif fonts (Modern/Clean)
import { loadFont as loadDMSans } from "@remotion/google-fonts/DMSans";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadRoboto } from "@remotion/google-fonts/Roboto";
import { loadFont as loadMontserrat } from "@remotion/google-fonts/Montserrat";
import { loadFont as loadPoppins } from "@remotion/google-fonts/Poppins";
import { loadFont as loadSpaceGrotesk } from "@remotion/google-fonts/SpaceGrotesk";
import { loadFont as loadSora } from "@remotion/google-fonts/Sora";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";

// Display fonts (Bold/Impactful headlines)
import { loadFont as loadOswald } from "@remotion/google-fonts/Oswald";
import { loadFont as loadBebasNeue } from "@remotion/google-fonts/BebasNeue";

// Serif fonts (Elegant/Editorial)
import { loadFont as loadInstrumentSerif } from "@remotion/google-fonts/InstrumentSerif";
import { loadFont as loadPlayfairDisplay } from "@remotion/google-fonts/PlayfairDisplay";
import { loadFont as loadLora } from "@remotion/google-fonts/Lora";

// Monospace fonts (Technical/Code)
import { loadFont as loadRobotoMono } from "@remotion/google-fonts/RobotoMono";

/**
 * Initialize all fonts by calling their loaders.
 * Each loader returns an object with { fontFamily, ...styles }
 */
const loadedFonts = {
  // Sans-serif
  "DM Sans": loadDMSans(),
  Inter: loadInter(),
  Roboto: loadRoboto(),
  Montserrat: loadMontserrat(),
  Poppins: loadPoppins(),
  "Space Grotesk": loadSpaceGrotesk(),
  Sora: loadSora(),
  Manrope: loadManrope(),

  // Display
  Oswald: loadOswald(),
  "Bebas Neue": loadBebasNeue(),

  // Serif
  "Instrument Serif": loadInstrumentSerif(),
  "Playfair Display": loadPlayfairDisplay(),
  Lora: loadLora(),

  // Mono
  "Roboto Mono": loadRobotoMono(),
} as const;

/**
 * Font map - maps font names to their CSS fontFamily values
 * Use these values directly in style props
 */
export const fontMap: Record<string, string> = Object.fromEntries(
  Object.entries(loadedFonts).map(([name, { fontFamily }]) => [name, fontFamily])
);

/**
 * List of all available font names
 * AI can choose from this list when generating compositions
 */
export const availableFonts = Object.keys(fontMap);

/**
 * Fonts organized by category for semantic selection
 */
export const fontCategories = {
  /** Clean, modern sans-serif fonts - good for body text and UI */
  sans: [
    "DM Sans",
    "Inter",
    "Roboto",
    "Montserrat",
    "Poppins",
    "Space Grotesk",
    "Sora",
    "Manrope",
  ],
  /** Bold, impactful fonts - great for headlines and titles */
  display: ["Oswald", "Bebas Neue"],
  /** Elegant serif fonts - good for editorial and luxury brands */
  serif: ["Instrument Serif", "Playfair Display", "Lora"],
  /** Monospace fonts - for code, technical, or retro aesthetics */
  mono: ["Roboto Mono"],
} as const;

/**
 * Recommended font pairings for motion design
 */
export const fontPairings = {
  /** Bold headlines with clean body text */
  bold: { headline: "Bebas Neue", body: "DM Sans" },
  /** Elegant editorial style */
  elegant: { headline: "Playfair Display", body: "Inter" },
  /** Modern tech aesthetic */
  tech: { headline: "Space Grotesk", body: "Roboto Mono" },
  /** Corporate professional */
  corporate: { headline: "Montserrat", body: "Roboto" },
  /** Friendly and approachable */
  friendly: { headline: "Poppins", body: "DM Sans" },
  /** Minimal and clean */
  minimal: { headline: "Inter", body: "Inter" },
} as const;

/**
 * Get the CSS fontFamily value for a font name.
 * Returns system fallback if font is not found.
 *
 * @param name - The font name (e.g., "DM Sans", "Bebas Neue")
 * @returns The CSS fontFamily string
 */
export function getFont(name: string): string {
  return fontMap[name] ?? "system-ui, sans-serif";
}

/**
 * Check if a font is available in the registry
 *
 * @param name - The font name to check
 * @returns true if the font is pre-loaded and available
 */
export function isFontAvailable(name: string): boolean {
  return name in fontMap;
}

// Export type for font names
export type FontName = keyof typeof loadedFonts;
export type FontCategory = keyof typeof fontCategories;
export type FontPairing = keyof typeof fontPairings;
