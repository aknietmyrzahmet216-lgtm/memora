# MEMORA — Emotional AI-Powered Digital Chronicle & Sanctuary

> An editorial analog-digital diary inspired by *Kinfolk* magazine, tactile photo albums, and Dieter Rams' functional minimalism. Built with pure semantic HTML5, modular CSS3, vanilla ES6+ JavaScript, and a lightweight Node.js Express backend powered by Google's multimodal Gemini AI, Web Audio synthesizer pads, and real iTunes music streaming.

---

## 🌸 Overview

**MEMORA** is a sanctuary for memories designed as an antidote to ephemeral social media feeds and sterile note-taking apps. It captures fleeting daily moments, pairs them with photographs and real music, and synthesizes them into lasting emotional chronicles.

Each memory is treated as a tangible archival artifact—complete with physical film contact sheets, custom color palettes, analog tape warmth, and time capsules sealed for future reflection.

---

## ✨ Key Features

### 1. 🌿 Tactile Onboarding & Artisanal Figurine Companions
- **Animated Floral Intro:** A cinematic, ethereal welcome introducing the philosophy of *"a garden of your memories"*.
- **Tactile 3D Figurine Avatars:** Replace generic profile avatars with artisanal companions (Origami Crane, Ceramic Rabbit, Ethereal Blossom, Zen Teacup).
- **Personalized Sanctuary Greeting:** Displays dynamic time-of-day greetings tailored to the user.

### 2. 📖 4-Step Editorial Creation Wizard
- **Step 1 (Story):** Borderless auto-expanding textarea with a live AI sentiment detector that subtly shifts ambiance as you write. Includes tactile error validation.
- **Step 2 (Moments):** Drag-and-drop photo upload supporting up to 5 photographs. Automatic client-side canvas compression ensures memories remain compact and load instantly.
- **Step 3 (Soundtrack):**
  - **iTunes Music Catalog:** Search real songs with album artwork and stream 30-second audio previews directly in the browser.
  - **Web Audio API Ambient Synthesizer:** 4 handcrafted analog synthesizer pads (Golden Afternoon, Stillness in Rain, Echoes of 1994, Morning Light).
- **Step 4 (Review & Synthesis):** Theatrical multimodal AI synthesis screen tracking emotional undertones, color extraction, tempo matching, and memory composition.

### 3. 🔮 Multimodal Gemini AI & Resilient Local Fallbacks
- Powered by Google's official `@google/genai` SDK using `gemini-2.5-flash`.
- Concurrently analyzes narrative text and image aesthetics to generate poetic titles, resonant 2–3 sentence summaries, 4-swatch harmonic color palettes, and structured folder taxonomies.
- **Guaranteed Offline Reliability:** If `GEMINI_API_KEY` is not provided or network requests are interrupted, MEMORA automatically engages an intelligent local rule-based heuristic engine, ensuring zero crashes.

### 4. ⏳ Time Capsules & "Then vs. Today" Reflections
- Seal memories in digital time capsules with unlock horizons (1 Month, 6 Months, 1 Year).
- **Simulated Time Travel:** Test the unsealing experience immediately to unlock a side-by-side comparison screen pairing the historical moment with modern reflections.

### 5. 💎 Memora Blossom Plus Membership (₸ KZT Currency Simulation)
- Designed with Kazakhstan's native currency (Kazakhstani Tenge — ₸ / KZT):
  - **🌱 Free Sanctuary Tier:** ₸0 / month — 15 memories, standard ambient presets, up to 3 time capsules.
  - **🌸 Memora Blossom Plus:** 
    - **₸1,990** / month (ай)
    - **₸18,900** / year (жыл) with a 21% annual savings discount.
  - **Perks:** Unlimited memory storage, full iTunes music catalog, infinite time capsules, exclusive figurine companions, and golden profile aura.
  - **Payment Simulation:** Interactive mock checkout supporting Kaspi Pay / QR and Bank Card (Visa/Mastercard) with celebratory activation.

### 6. 🎨 Dynamic Mood Theme Engine
The interface seamlessly morphs its mood and typography via semantic CSS data attributes:
- **`happy-sunny` (Golden Hour Warmth):** Apricot `#E87A3E` radiance, sunlit canvas `#FFF7EB`, expressive editorial serifs.
- **`calm-peaceful` (Sage Mist Silence):** Muted Sage `#4A7C6F`, misty wash `#F0F4F2`, serene clean typography.
- **`nostalgic-emotional` (Vintage Sepia & Reverie):** Dusty Rose `#8C5A5A`, aged paper `#F3ECE8`, poetic italic serifs.

### 7. 🖥️ Responsive Multi-Layout Sanctuary Architecture
- **Desktop & Laptop Experience:** 2-column editorial dashboard with a floating frosted navigation pill bar, stats grid, and emotional flora distribution.
- **Mobile Experience:** Compact glass cards with bottom tab navigation optimized for one-handed thumb interaction.
- **Archive Views:** Seamlessly toggle between Bespoke Cards Grid, Manila Folders, and a Chronological Timeline.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend Core** | Pure Semantic HTML5, Vanilla JavaScript (ES6+ Modules, Zero Build Step, Zero Framework Bloat) |
| **Styling & Effects** | Modern CSS3, CSS Custom Properties (Variables), Cascade Layers (`@layer`), Frosted Glassmorphism (`backdrop-filter`) |
| **Audio Processing** | Web Audio API (Analog Polyphonic Synthesizer), HTML5 Audio Streaming |
| **Image Compression** | HTML5 Canvas Client-Side Compression (< 80KB per photo) |
| **Backend & APIs** | Node.js, Express 4, Apple iTunes Search Proxy |
| **Artificial Intelligence** | Google Gemini API via `@google/genai` (`gemini-2.5-flash`) |
| **Deployment & Hosting** | Vercel Serverless Functions (`api/index.js`, `vercel.json`) |

---

## 🚀 Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18.x or later)
- npm (version 9.x or later)

### 1. Clone the repository
```bash
git clone https://github.com/aknietmyrzahmet216-lgtm/memora.git
cd memora
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables (Optional)
```bash
cp .env.example .env
```
Open `.env` in any editor:
```env
PORT=8080
GEMINI_API_KEY=your_gemini_api_key_here
```
> **Note:** If `GEMINI_API_KEY` is omitted, MEMORA seamlessly runs on its intelligent local heuristic engine.

### 4. Start the application
```bash
npm start
```
Open [http://localhost:8080](http://localhost:8080) in your browser.

---

## ☁️ Deployment on Vercel

MEMORA is optimized for instantaneous deployment on **Vercel** as a zero-config serverless application:

### Deploy via Vercel Dashboard (Recommended)
1. Push your repository to **GitHub**.
2. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Import your `memora` GitHub repository.
4. Leave Framework Preset as **Other** (Vercel automatically detects `api/index.js` and `vercel.json`).
5. (Optional) In the **Environment Variables** section, add:
   - `GEMINI_API_KEY`: Your Google Gemini API Key.
6. Click **Deploy**. Your digital sanctuary will be live in seconds!

### Configuration Details (`vercel.json`)
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/api/index.js" }
  ]
}
```

---

## 📁 Project Structure

```
memora/
├── api/
│   └── index.js                 # Vercel serverless entrypoint exporting Express app
├── public/
│   ├── index.html               # Semantic HTML5 shell, preconnect fonts, meta tags
│   ├── assets/
│   │   ├── avatars/             # Artisanal SVG figurine models (Blossom, Crane, Teacup, Rabbit)
│   │   └── holographic_flower.svg
│   ├── css/
│   │   ├── variables.css        # Cascade layers, mood color tokens, fluid typography
│   │   ├── base.css             # Resets, typography, custom scrollbars, SVG film grain
│   │   ├── components.css       # Cards, modals, audio widget, membership, nav pills
│   │   └── animations.css       # Page transitions, vinyl spin, aperture pulse
│   └── js/
│       ├── app.js               # Application orchestration, search debounce, event delegation
│       ├── ui.js                # DOM rendering, 4-step wizard, subscription modal, profile
│       ├── store.js             # Reactive Pub/Sub state store with LocalStorage persistence
│       ├── themes.js            # Mood engine & dynamic color swatches
│       ├── audioEngine.js       # Web Audio API ambient synthesizer & iTunes preview engine
│       ├── aiEngine.js          # Heuristic sentiment fallback & synthesis helpers
│       ├── imageCompressor.js   # Client-side HTML5 canvas photo compressor
│       └── mockData.js          # Preloaded memories & time capsule seed data
├── server.js                    # Express application (multimodal AI route & iTunes proxy)
├── package.json                 # Project dependencies & scripts
├── vercel.json                  # Modern Vercel rewrites configuration
├── .env.example                 # Environment variables blueprint
└── README.md                    # Project documentation
```

---

## ⌨️ Keyboard Shortcuts & Gestures

- `Escape`: Closes any open modal (Creation Wizard, Memory Detail, Subscription).
- `Enter` (in Profile name input): Instantly saves user name.
- Click outside modal backdrop: Gracefully dismisses view.
- Drag & Drop: Drag photos directly onto Step 2 of the creation wizard.

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
