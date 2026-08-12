# Animation Portfolio

## Live demo: https://animation-portfolio-inky.vercel.app/

A personal motion portfolio showcasing kinetic motion design and short animated experiments. Built with Vite + React and featuring a few custom visual components and integrations:

- Hero title using a Shuffle text animation (pixel font).
- DomeGallery: 3D circular thumbnail gallery.
- Lenis smooth scrolling and GSAP-powered entrance animations.
- Dynamic subscriber count sourced from `Frontend/data/subscribers.json` (automated by `scripts/update-subscribers.js`).

## Tech stack
- React (Vite)
- GSAP, Lenis
- @use-gesture/react for gallery drag
- Plain CSS + custom components in `Frontend/src`
- React Blits (componnents)

## Quick start (development)

1. Install dependencies

```bash
cd Frontend
npm install
```

2. Run the dev server

```bash
npm run dev
```

3. Build for production

```bash
npm run build
```

## Subscriber count updater

The repository includes a small script at `scripts/update-subscribers.js` which scrapes YouTube channel pages to extract the subscriber count and writes it to `Frontend/data/subscribers.json`.

## Usage examples:

```bash
# Using a channel ID
YOUTUBE_CHANNEL_ID="UCxxxxxxx" node scripts/update-subscribers.js

# Using a channel URL
YOUTUBE_CHANNEL_URL="https://www.youtube.com/channel/UCxxxxxxx" node scripts/update-subscribers.js

# Override output path (optional)
SUBSCRIBERS_JSON_PATH="/absolute/path/to/Frontend/data/subscribers.json" YOUTUBE_CHANNEL_ID="UCxxxxxxx" node scripts/update-subscribers.js
```

## Notes
- The script will create the `Frontend/data` directory if it doesn't exist.
- If YouTube changes layout/markup, the script may need pattern adjustments (see `SUBSCRIBER_PATTERNS` in the script).

## Deployment
- The live site is hosted on Vercel (see the provided demo link). The project is ready for Vercel deployment from the `Frontend` folder—set the build command to `npm run build` and the output directory to `dist`.

## Project structure (important files)
- `Frontend/` — React app (entry point: `Frontend/src/App.jsx`)
- `scripts/update-subscribers.js` — subscriber updater script
- `Frontend/data/subscribers.json` — runtime subscriber value (generated)


## Credit

React Blits (for cool componnents)