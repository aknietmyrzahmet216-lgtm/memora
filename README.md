# MEMORA — Emotional AI-Powered Digital Chronicle

> An editorial analog-digital diary inspired by *Kinfolk* magazine, physical photo albums, and Dieter Rams functional minimalism. Built with pure semantic HTML5, modular CSS3, vanilla ES6+ JavaScript, and a lightweight Node.js Express backend powered by multimodal Gemini AI and real iTunes music streaming.

---

## 1. Quick Start (3 Steps)

Run MEMORA locally in seconds:

```bash
# 1. Install dependencies
npm install

# 2. Configure environment (Optional - intelligent fallback included!)
cp .env.example .env
# Open .env and add your GEMINI_API_KEY if desired:
# GEMINI_API_KEY=your_key_here

# 3. Launch server
npm start
```

Open **`http://localhost:8080`** in your browser.

> [!NOTE]
> If `GEMINI_API_KEY` is not provided or API calls fail, MEMORA automatically engages an intelligent local rule-based analysis engine so demos, creation flows, and color palettes work flawlessly offline without any crashes.

---

## 2. Architectural Philosophy & Anti-AI Aesthetic

MEMORA rejects generic AI SaaS clichés—there are no neon gradients, purple glow cards, harsh `#000`/`#fff` contrasts, or bloated third-party frontend frameworks. Instead, it embodies a quiet, physical tactile presence:

- **Base Color Palette:** Warm alabaster paper canvas (`#F7F5F0`), soft stone surfaces (`#EFECE6`), deep charcoal ink (`#1C1B19`), and muted taupe (`#6E6A63`) paired with hairlines (`rgba(28, 27, 25, 0.08)`).
- **Typography:** Refined editorial serifs (*Playfair Display*) paired with crisp neo-grotesque sans (*Plus Jakarta Sans*) and monospace analog camera metadata stamps.
- **Tactile Grain:** An inline SVG fractal noise overlay (`feTurbulence`) provides an authentic photographic paper grain.

---

## 3. Dynamic Mood Engine

The application dynamically shifts themes via `data-mood="..."` on the document and cards:

| Mood | Visual Atmosphere | Color Accents | Photo Filter & Typography |
| :--- | :--- | :--- | :--- |
| **`happy-sunny`** | Golden Hour Warmth | Apricot `#E87A3E` & Sunlit Canvas `#FFF7EB` | Warm contrast, amber radiance glow, expressive serif |
| **`calm-peaceful`** | Sage Mist Silence | Muted Sage `#4A7C6F` & Mist `#F0F4F2` | Desaturated greens, generous whitespace, serene sans |
| **`nostalgic-emotional`** | Vintage Sepia & Reverie | Dusty Rose `#8C5A5A` & Aged Paper `#F3ECE8` | Polaroid borders with subtle angular tilt, poetic italic serifs |

---

## 4. Backend & API Services (`server.js`)

MEMORA includes a lean, production-grade Express server:

### A. Multimodal AI Analysis (`POST /api/analyze`)
- Accepts `{ story, imageBase64, songTitle, songArtist }`.
- Integrates Google's official `@google/genai` SDK using `gemini-2.5-flash` with strict JSON schema constraints.
- Analyzes both image aesthetics and emotional text undertones to output:
  - `title`: Poetic 2–4 word title.
  - `aiStory`: Poetic 2–3 sentence memory narrative.
  - `mood`: `"happy-sunny"` | `"calm-peaceful"` | `"nostalgic-emotional"`.
  - `palette`: 4 complementary hex color swatches.
  - `folderName`: Formatted archive title (`📁 Month Day — Title`).
- **Resilient Fallback:** Automatically switches to heuristic color harmony and sentiment analysis if the API key is absent or network fails.

### B. iTunes Music Search Proxy (`GET /api/music-search?term=...`)
- Queries Apple's public iTunes Search API (`https://itunes.apple.com/search?term=...&entity=song&limit=4`).
- Returns real track titles, artists, high-res album covers, and 30-second audio stream URLs (`previewUrl`).
- Proxied through Express to avoid browser adblocker interference and CORS issues.

---

## 5. Core Features & User Flows

### A. 3 Pre-Loaded Demo Scenarios (`public/js/mockData.js`)
1. **Day 1 — "Golden Hours"** (`happy-sunny`):
   - Folder: `📁 November 20 — Golden Hours`
   - Story: Walking with friends at sunset along the ridge, spontaneous laughter, warm amber light.
   - Soundtrack: *Golden Afternoon* (The Paper Kites & Ambient Acoustic).
2. **Day 2 — "Quiet Morning Rain"** (`calm-peaceful`):
   - Folder: `📁 November 19 — Quiet Morning Rain`
   - Story: Slow pour-over coffee by the window, reading poems as rain taps the glass.
   - Soundtrack: *Stillness in Rain* (Brian Eno & Ambient Mist).
3. **Day 3 — "Faded Postcards"** (`nostalgic-emotional`):
   - Folder: `📁 November 18 — Faded Postcards`
   - Story: Finding vintage photos and postcards in a cedar box, late-night vinyl crackle.
   - Pre-sealed in Time Capsule with demo simulation enabled.

### B. 4-Step Editorial Wizard (`public/js/ui.js`)
- **Step 1 (Story):** Borderless expanding textarea (`field-sizing: content`) with a live AI sentiment detector that analyzes emotional undertones in real-time as you write. Includes inline validation shake feedback.
- **Step 2 (Moments):** Drag-and-drop & native file picker supporting 1 to 5 photos. Uses HTML5 Canvas compression (`public/js/imageCompressor.js`) to scale images under 80KB so `localStorage` never overflows, displayed as tactile contact-sheet filmstrips with removable pins.
- **Step 3 (Soundtrack):** Search real music through the **iTunes Search API** with album covers and live 30-second audio stream previews, or pick from 4 curated ambient synthesizer presets powered by the browser's native **Web Audio API** (`public/js/audioEngine.js`).
- **Step 4 (Review & Create):** Summary card leading into the theatrical synthesis flow.

### C. Theatrical Multi-Modal AI Processing Screen
Hypnotic transition screen tracking 4 animated synthesis stages in parallel with server processing:
1. *Reading emotional undertones in your story...*
2. *Extracting color harmony & lighting from your photos...*
3. *Matching tempo and mood with your soundtrack...*
4. *Composing your memory atmosphere...*

Outputs a tailored mood theme, poetic title, 2–3 sentence AI narrative, extracted 4-color visual palette chips, and structured folder name `📁 [Month Day] — [Title]`.

### D. Time Capsule & "Then vs. Today" Comparison
- Seal memories with unlock durations (`In 1 Month`, `In 6 Months`, `In 1 Year`).
- **Interactive Time Travel Demo:** Unlocks a Side-by-Side Comparison View comparing the original entry with a present-day reflection prompt and form.

### E. Memory Archive & Multi-Layout System
- **View Switcher:**
  - **Cards Grid:** Bespoke editorial cards with Polaroid tilts and audio widgets.
  - **Folder Grid:** Physical manila archive folders with tabs, color bars, and photo peeks.
  - **Chronological Timeline:** Vertical editorial spine tracking time milestones.
- **Instant Client-Side Filtering:** Keyword search, mood pills, and date sorting (`Newest First` / `Oldest First`).
- **Demo Data Reset:** A subtle button in the footer to restore pristine demo data at any time.

---

## 6. Project Structure

```
/memora/
├── server.js                    # Express server (static hosting, Gemini AI & iTunes proxy)
├── package.json                 # Node dependencies & npm start script
├── .env.example                 # Environment template (GEMINI_API_KEY, PORT)
├── .gitignore                   # Ignore node_modules, .env, .DS_Store
├── README.md                    # System documentation and setup guide
└── public/
    ├── index.html               # Semantic markup, preconnect Google Fonts, ES6 module mount
    ├── css/
    │   ├── variables.css        # Cascade layers (@layer), design tokens, fluid typography, & mood tokens
    │   ├── base.css             # Layered resets, typography, custom scrollbars, and SVG film grain
    │   ├── components.css       # Header, Hero spread, audio player, folder grid, stepper, & modals
    │   └── animations.css       # View Transitions, vinyl rotation, aperture pulse, and reduced motion
    └── js/
        ├── mockData.js          # 3 rich demo chronicles & time capsule seed data
        ├── store.js             # Centralized state management (pub/sub, localStorage persistence)
        ├── themes.js            # Dynamic mood engine managing data-mood & theme swatches
        ├── audioEngine.js       # Web Audio API ambient synth & HTML5 streaming audio engine
        ├── aiEngine.js          # Client-side heuristic fallback & synthesis helpers
        ├── imageCompressor.js   # Client-side HTML5 canvas image compressor (under 80KB)
        ├── ui.js                # DOM rendering, 4-step wizard, memory view, & timeline layouts
        └── app.js               # Application entry point, search debouncing, & event delegation
```
