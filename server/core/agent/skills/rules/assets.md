---
name: assets
description: Importing images, videos, audio, and fonts into Remotion
metadata:
  tags: assets, staticFile, images, fonts, public, uploads, logo
---

# Importing assets in Remotion

## The public folder

Place assets in the `public/` folder at your project root.

```
remotion/
├─ public/
│  ├─ logo.png
│  ├─ uploads/           <- Uploaded brand assets (logos, images)
│  │  └─ logo-abc123.png
│  ├─ fonts/
│  └─ videos/
├─ src/
```

## Using staticFile()

You MUST use `staticFile()` to reference files from the `public/` folder:

```tsx
import {Img, staticFile} from 'remotion';

export const MyComposition = () => {
  return <Img src={staticFile('logo.png')} />;
};
```

The function returns an encoded URL that works correctly when deploying to subdirectories.

## Using uploaded brand assets

Brand assets (like logos) are uploaded to `public/uploads/` with unique filenames.
The path provided includes the `uploads/` folder:

```tsx
import {Img, staticFile} from 'remotion';

// If the brand context provides logoPath = "uploads/logo-abc123.png"
export const BrandLogo: React.FC = () => {
  return <Img src={staticFile("uploads/logo-abc123.png")} />;
};
```

## Using with components

**Images:**

```tsx
import {Img, staticFile} from 'remotion';

<Img src={staticFile('photo.png')} />;
<Img src={staticFile('uploads/logo-abc123.png')} />; // Uploaded asset
```

**Videos:**

```tsx
import {Video} from '@remotion/media';
import {staticFile} from 'remotion';

<Video src={staticFile('clip.mp4')} />;
```

**Audio:**

```tsx
import {Audio} from '@remotion/media';
import {staticFile} from 'remotion';

<Audio src={staticFile('music.mp3')} />;
```

**Fonts:**

```tsx
import {staticFile} from 'remotion';

const fontFamily = new FontFace('MyFont', `url(${staticFile('font.woff2')})`);
await fontFamily.load();
document.fonts.add(fontFamily);
```

## Remote URLs

Remote URLs can be used directly without `staticFile()`:

```tsx
<Img src="https://example.com/image.png" />
<Video src="https://remotion.media/video.mp4" />
```

## Important notes

- Remotion components (`<Img>`, `<Video>`, `<Audio>`) ensure assets are fully loaded before rendering
- Special characters in filenames (`#`, `?`, `&`) are automatically encoded
- Uploaded assets are in the `uploads/` subfolder - always include this in the path
