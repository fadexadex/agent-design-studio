---
name: images
description: Embedding images in Remotion using the <Img> component
metadata:
  tags: images, img, staticFile, png, jpg, svg, webp, logo, brand, uploads
---

# Using images in Remotion

## The `<Img>` component

Always use the `<Img>` component from `remotion` to display images:

```tsx
import { Img, staticFile } from "remotion";

export const MyComposition = () => {
  return <Img src={staticFile("photo.png")} />;
};
```

## Important restrictions

**You MUST use the `<Img>` component from `remotion`.** Do not use:

- Native HTML `<img>` elements
- Next.js `<Image>` component
- CSS `background-image`

The `<Img>` component ensures images are fully loaded before rendering, preventing flickering and blank frames during video export.

## Local images with staticFile()

Place images in the `public/` folder and use `staticFile()` to reference them:

```
my-video/
├─ public/
│  ├─ logo.png
│  ├─ uploads/           <- Uploaded brand assets go here
│  │  └─ logo-abc123.png
│  ├─ avatar.jpg
│  └─ icon.svg
├─ src/
├─ package.json
```

```tsx
import { Img, staticFile } from "remotion";

<Img src={staticFile("logo.png")} />
```

## Using uploaded brand assets

When a brand logo is uploaded, it's saved to `public/uploads/` with a unique filename.
The path is provided in the brand context (e.g., `uploads/logo-abc123.png`).

**IMPORTANT:** Use the exact path provided - it includes the `uploads/` folder:

```tsx
import { Img, staticFile } from "remotion";

// If logoPath is "uploads/logo-abc123.png"
export const BrandScene: React.FC<{ logoPath: string }> = ({ logoPath }) => {
  return (
    <Img 
      src={staticFile(logoPath)} 
      style={{ width: 200, height: 'auto' }}
    />
  );
};

// Or with hardcoded path from brand context
export const Scene1: React.FC = () => {
  return (
    <Img 
      src={staticFile("uploads/logo-abc123.png")} 
      style={{ width: 200, height: 'auto' }}
    />
  );
};
```

## Remote images

Remote URLs can be used directly without `staticFile()`:

```tsx
<Img src="https://example.com/image.png" />
```

Ensure remote images have CORS enabled.

For animated GIFs, use the `<Gif>` component from `@remotion/gif` instead.

## Sizing and positioning

Use the `style` prop to control size and position:

```tsx
<Img
  src={staticFile("photo.png")}
  style={{
    width: 500,
    height: 300,
    position: "absolute",
    top: 100,
    left: 50,
    objectFit: "cover",
  }}
/>
```

## Dynamic image paths

Use template literals for dynamic file references:

```tsx
import { Img, staticFile, useCurrentFrame } from "remotion";

const frame = useCurrentFrame();

// Image sequence
<Img src={staticFile(`frames/frame${frame}.png`)} />

// Selecting based on props
<Img src={staticFile(`avatars/${props.userId}.png`)} />

// Conditional images
<Img src={staticFile(`icons/${isActive ? "active" : "inactive"}.svg`)} />

// Using brand logo path from props
<Img src={staticFile(props.logoPath)} />
```

This pattern is useful for:

- Image sequences (frame-by-frame animations)
- User-specific avatars or profile images
- Theme-based icons
- State-dependent graphics
- Brand logos from uploaded assets

## Animating images

Combine with Remotion's animation helpers for animated logos:

```tsx
import { Img, staticFile, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

export const AnimatedLogo: React.FC<{ logoPath: string }> = ({ logoPath }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const opacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' });
  const scale = spring({ frame, fps, config: { damping: 12, stiffness: 80 } });
  
  return (
    <Img 
      src={staticFile(logoPath)}
      style={{
        width: 200,
        height: 'auto',
        opacity,
        transform: `scale(${scale})`,
      }}
    />
  );
};
```

## Getting image dimensions

Use `getImageDimensions()` to get the dimensions of an image:

```tsx
import { getImageDimensions, staticFile } from "remotion";

const { width, height } = await getImageDimensions(staticFile("photo.png"));
```

This is useful for calculating aspect ratios or sizing compositions:

```tsx
import { getImageDimensions, staticFile, CalculateMetadataFunction } from "remotion";

const calculateMetadata: CalculateMetadataFunction = async () => {
  const { width, height } = await getImageDimensions(staticFile("photo.png"));
  return {
    width,
    height,
  };
};
```
