# Animation Portfolio

A personal motion-design portfolio built with React and Vite. It combines animated typography, an interactive gallery, smooth scrolling, and GSAP-based entrance animations.

**Live demo:** https://animation-portfolio-inky.vercel.app/

## Features

- Animated hero typography
- Interactive gallery with drag gestures
- Smooth scrolling and entrance animations
- Subscriber-count data loaded from a JSON file
- Responsive frontend built with custom CSS

## Tech stack

- React and Vite
- GSAP and Lenis
- Three.js and @use-gesture/react
- Plain CSS

## Run locally

    cd Frontend
    npm install
    npm run dev

## Build

    npm run build
    npm run preview

Vite writes the production build to Frontend/dist/.

## Subscriber count updater

The repository includes scripts/update-subscribers.js, which attempts to retrieve a YouTube channel's subscriber count and writes the result to Frontend/data/subscribers.json.

    YOUTUBE_CHANNEL_ID="YOUR_CHANNEL_ID" node scripts/update-subscribers.js

This script depends on YouTube page markup and may need maintenance if that markup changes. Do not treat the displayed count as live unless the updater is run successfully.

## Deployment

The live demo is hosted on Vercel. For a new Vercel project, set Frontend as the root directory and use npm run build as the build command.