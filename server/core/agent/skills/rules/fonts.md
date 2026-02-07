---
name: fonts
description: Pre-loaded Google Fonts available for motion design
metadata:
  tags: fonts, google-fonts, typography, text, pre-loaded
---

# Using Fonts in Remotion

## Pre-loaded Fonts (Ready to Use)

All fonts below are **pre-loaded globally** and can be used immediately by passing the font name as a string to `fontFamily` props. **DO NOT import from @remotion/google-fonts** - fonts are already loaded.

### Sans-serif (Modern/Clean)

| Font | Best For |
|------|----------|
| `"DM Sans"` | Primary brand font, friendly geometric, excellent for UI and body text |
| `"Inter"` | Highly legible, variable weights, versatile for all uses |
| `"Roboto"` | Industry standard, clean and professional |
| `"Montserrat"` | Bold geometric, excellent for headlines and titles |
| `"Poppins"` | Rounded geometric, friendly and modern |
| `"Space Grotesk"` | Technical, futuristic feel, great for tech brands |
| `"Sora"` | Contemporary, distinctive character |
| `"Manrope"` | Open and friendly, good for startups |

### Display (Bold/Impactful Headlines)

| Font | Best For |
|------|----------|
| `"Oswald"` | Condensed, bold impact, sports/news style |
| `"Bebas Neue"` | ALL CAPS display, very bold, classic motion design |

### Serif (Elegant/Editorial)

| Font | Best For |
|------|----------|
| `"Instrument Serif"` | Refined editorial, luxury brands |
| `"Playfair Display"` | High contrast, elegant headlines |
| `"Lora"` | Balanced serif, good for body text |

### Monospace (Technical/Code)

| Font | Best For |
|------|----------|
| `"Roboto Mono"` | Code snippets, technical content, retro aesthetics |

## Usage Examples

### With AnimatedText Component

```tsx
import { AnimatedText } from "@/components/AnimatedText";

// Simply pass the font name as a string
<AnimatedText
  text="Welcome to the Future"
  fontFamily="Bebas Neue"
  fontSize={120}
  fontWeight={700}
  animation="fadeUp"
/>

<AnimatedText
  text="Elegant typography for your brand"
  fontFamily="Instrument Serif"
  fontSize={48}
  animation="typewriter"
/>
```

### With Inline Styles

```tsx
<div style={{ fontFamily: "DM Sans", fontSize: 24 }}>
  Clean body text with DM Sans
</div>

<h1 style={{ fontFamily: "Montserrat", fontWeight: 800, fontSize: 72 }}>
  BOLD HEADLINE
</h1>
```

### Combining Fonts (Font Pairing)

```tsx
// Bold headline + clean body
<div>
  <h1 style={{ fontFamily: "Bebas Neue", fontSize: 96 }}>
    MAIN HEADLINE
  </h1>
  <p style={{ fontFamily: "DM Sans", fontSize: 24 }}>
    Supporting body text with a clean, readable font.
  </p>
</div>

// Elegant editorial style
<div>
  <h1 style={{ fontFamily: "Playfair Display", fontSize: 72 }}>
    Elegant Title
  </h1>
  <p style={{ fontFamily: "Inter", fontSize: 20 }}>
    Body text using Inter for readability.
  </p>
</div>

// Tech/Modern style
<div>
  <h1 style={{ fontFamily: "Space Grotesk", fontSize: 64 }}>
    Future Tech
  </h1>
  <code style={{ fontFamily: "Roboto Mono", fontSize: 18 }}>
    const future = await loadTech();
  </code>
</div>
```

## Recommended Font Pairings

| Style | Headline Font | Body Font |
|-------|---------------|-----------|
| **Bold/Impact** | Bebas Neue | DM Sans |
| **Elegant/Editorial** | Playfair Display | Inter |
| **Tech/Modern** | Space Grotesk | Roboto Mono |
| **Corporate** | Montserrat | Roboto |
| **Friendly** | Poppins | DM Sans |
| **Minimal** | Inter | Inter |

## Important Notes

1. **DO NOT import from @remotion/google-fonts** - all fonts are pre-loaded globally via `@/styles/fonts`

2. **Use exact font names** - Font names are case-sensitive. Use exactly as shown (e.g., `"DM Sans"`, not `"dm sans"`)

3. **Fallback behavior** - If a font name is not recognized, it will silently fall back to `system-ui, sans-serif`

4. **Font weights** - All fonts support common weights (400, 500, 600, 700). Display fonts like Bebas Neue work best at their default weight.

5. **Available fonts list**:
   - DM Sans
   - Inter
   - Roboto
   - Montserrat
   - Poppins
   - Space Grotesk
   - Sora
   - Manrope
   - Oswald
   - Bebas Neue
   - Instrument Serif
   - Playfair Display
   - Lora
   - Roboto Mono
