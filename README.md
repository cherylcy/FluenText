# FluenText

FluenText is an AI writing companion that runs entirely in the browser. It connects to
Google Chrome's experimental Prompt API to provide sentence-by-sentence guidance and a
full-draft polish without sending your words to a remote server.

## ✨ Features

- **Smart sentence splitting.** The draft is broken into sentences so each one can be
  analysed independently.
- **Level 1 – Grammar fixes.** Surface-level grammar and punctuation corrections to keep
  your sentences clean.
- **Level 2 – Natural rewrites.** Alternative phrasings that sound more idiomatic while
  respecting the tone you pick (neutral, friendly, formal, concise, or casual).
- **Level 3 – Draft polish.** Generate a fully polished version of your draft in the
  selected tone.
- **Fully client-side.** Suggestions come from Chrome's on-device models exposed through
  the Prompt API; no additional backend is required.
- **Responsive split-view editor.** Draft on the left, suggestions and polished output on
  the right using resizable panels.

## 🧩 Project structure

The app is built with [Vite](https://vite.dev/), [React](https://react.dev/), and
[TypeScript](https://www.typescriptlang.org/). Styling relies on Tailwind CSS via the
`@tailwindcss/vite` plugin and a small set of composable UI primitives located in
`src/components/ui`.

```
.
├── src/
│   ├── App.tsx              # Main layout and interaction logic
│   ├── utils.ts             # Prompt API integration and sentence utilities
│   ├── components/ui/       # Button, card, select, textarea, resizable, scroll area
│   └── ...
├── public/                  # Static assets served by Vite
├── vite.config.ts           # Vite configuration
└── package.json             # Scripts and dependencies
```

## 🚀 Getting started

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Run the dev server**

   ```bash
   npm run dev
   ```

3. **Open the app**

   Vite prints a local URL (default `http://localhost:5173`). Open it in a compatible
   Chrome build with the Prompt API enabled.

## 🧪 Enabling the Chrome Prompt API

The Prompt API currently ships behind experimental flags in Chrome-based browsers. To
try FluenText locally:

1. Install the latest [Chrome Canary](https://www.google.com/chrome/canary/) or a
   Chromium build that exposes the Prompt API.
2. Navigate to `chrome://flags/#prompt-api-for-gemini-nano` and set it to **Enabled**.
3. Restart the browser when prompted so the change takes effect.
4. Visit the app in that browser window and confirm the banner indicates "Prompt API
   ready" before requesting AI assistance.

## 💡 Usage tips

- Start typing in the draft area. Use the tone selector to guide rewrites and polishing.
- Click **Get suggestions** to fetch grammar corrections and natural variants for the
  current sentences. Refresh at any time to regenerate.
- Click **Generate polished draft** to produce a full rewritten draft. The polished panel
  appears below the sentence suggestions and can be closed when you want more space.

