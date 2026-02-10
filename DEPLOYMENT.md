# Deployment Guide

This application requires a **Split Deployment Strategy** because it consists of two distinct parts with different infrastructure needs:

1.  **Frontend (React/Vite)**: Static assets + Client-side logic. Best deployed on **Vercel**.
2.  **Backend (Express + Remotion)**: Long-running server requiring specific system libraries (Chrome/FFmpeg). Best deployed on **Railway**, **Render**, or a **VPS**.

> **Why not Vercel for the backend?**
> Vercel is optimized for Serverless Functions, which have timeout limits (usually 10-60s) and file size limits. Rendering a video with Remotion often takes longer and requires a full Chrome instance and FFmpeg, which are difficult to run within standard serverless limits.

---

## Part 1: Deploy Backend (The Hard Part First)

You need a host that supports **Docker** or **Node.js** with system libraries. **Railway** is recommended as it's the easiest to set up with Chrome/FFmpeg.

### Option A: Deploy on Railway (Recommended)

1.  **Create a `Dockerfile`** in the root of your project:

    ```dockerfile
    FROM node:18-bullseye

    # Install system dependencies for Remotion (Chrome + FFmpeg)
    RUN apt-get update && apt-get install -y \
        wget \
        gnupg \
        libnss3 \
        libatk1.0-0 \
        libatk-bridge2.0-0 \
        libcups2 \
        libdrm2 \
        libxkbcommon0 \
        libxcomposite1 \
        libxdamage1 \
        libxrandr2 \
        libgbm1 \
        libasound2 \
        ffmpeg

    # Install Chrome Stable
    RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
        && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
        && apt-get update \
        && apt-get install -y google-chrome-stable --no-install-recommends \
        && rm -rf /var/lib/apt/lists/*

    WORKDIR /app

    COPY package*.json ./
    COPY remotion/package*.json ./remotion/

    # Install dependencies
    RUN npm ci

    COPY . .

    # Build the backend (and shared types if needed)
    RUN npm run build:server

    # Expose the API port
    EXPOSE 3001

    # Start the server
    CMD ["npm", "run", "server"]
    ```

    > **Note:** You may need to create a specific `build:server` script in your `package.json` that compiles the TS server files to JS, or just run `ts-node` in production (less optimized but easier).

2.  **Push code to GitHub.**

3.  **New Project on Railway:**
    *   Connect GitHub repo.
    *   Add variables: `GEMINI_API_KEY`, `REDIS_HOST`, etc.
    *   **IMPORTANT:** Set `PUPPETEER_EXECUTABLE_PATH` to `/usr/bin/google-chrome-stable` (or wherever it was installed in Docker).

4.  **Get the Public URL:** Railway will give you a URL like `https://agent-design-studio-production.up.railway.app`.

---

## Part 2: Deploy Frontend on Vercel

1.  **Create a `vercel.json`** in your root to handle rewrites (optional, but good for local-like behavior) or just configure env vars.

    Actually, for a split deployment, we **don't** want rewrites to local. We want the frontend to call the remote backend.

2.  **Update Environment Variables in Vercel:**
    *   Go to **Settings > Environment Variables**.
    *   Add `VITE_API_URL`.
    *   Value: `https://your-backend-url-on-railway.app` (The URL from Part 1).

3.  **Redeploy Frontend:**
    *   Go to Deployments.
    *   Redeploy to ensure the new env var is picked up.

---

## Troubleshooting

### "404 Not Found" on /api/...
*   **Cause:** The frontend is calling `https://frontend.vercel.app/api/...` but the backend isn't there.
*   **Fix:** Ensure `VITE_API_URL` is set in Vercel to your **Backend URL**.
*   **Verify:** Open the Network tab in browser dev tools. The request should go to `https://backend-app.railway.app/api/...`, NOT the Vercel URL.

### CORS Errors
*   **Cause:** Your backend is rejecting requests from your Vercel frontend.
*   **Fix:** In `server/index.ts`, update your CORS configuration:
    ```typescript
    app.use(cors({
      origin: [
        'http://localhost:3000',
        'https://your-vercel-app.vercel.app' // Add your production frontend URL
      ],
      credentials: true
    }));
    ```
