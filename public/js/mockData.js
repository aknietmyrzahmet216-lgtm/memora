/**
 * MEMORA — 3 Curated Demo Scenarios & Simulated AI Emotional Analysis Engine
 * Features:
 * - Day 1: "Golden Hours" (happy-sunny)
 * - Day 2: "Quiet Morning Rain" (calm-peaceful)
 * - Day 3: "Faded Postcards" (nostalgic-emotional, pre-sealed Time Capsule)
 */

export const INITIAL_MEMORIES = [
  {
    id: "mem-day-1",
    title: "Golden Hours",
    folder: "📁 November 20 — Golden Hours",
    date: "2026-11-20",
    dateFormatted: "Friday, November 20, 2026",
    time: "05:14 PM",
    location: "West Ridge Meadow, Ojai",
    camera: "Leica M6 · Cinestill 50D · 50mm f/1.4",
    mood: "happy-sunny",
    moodLabel: "Golden Hour Warmth",
    quote: "The finest hours demand nothing in return but an open heart and comfortable boots.",
    excerpt: "Walking along the dry ridge with Julian and Maya at sunset. The low sun poured liquid apricot light through the silhouettes of old oak branches. Someone made an absurd joke about our university days and we burst into spontaneous, uncontrollable laughter.",
    fullContent: `Walking along the dry ridge with Julian and Maya at sunset. The low sun poured liquid apricot light through the silhouettes of old oak branches. Someone made an absurd joke about our university days and we burst into spontaneous, uncontrollable laughter, the sound carrying down the golden canyon.\n\nWe sat on the sun-baked sandstone ledge until the hills turned violet. There was a lightness to the air that felt completely unhurried. No deadlines, no notifications pinging in pockets—just three friends sharing warm cider from a thermos, watching the amber light surrender gently to the first evening stars.`,
    photoUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
    photos: [
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80"
    ],
    palette: [
      { hex: '#E87A3E', name: 'Golden Hour Apricot' },
      { hex: '#FAD49F', name: 'Sunlit Canvas' },
      { hex: '#A85A2E', name: 'Warm Terracotta' },
      { hex: '#2C1808', name: 'Burnt Charcoal' }
    ],
    hasAudio: true,
    audioDuration: "02:40",
    audioTitle: "Golden Afternoon — The Paper Kites & Ambient Acoustic",
    soundtrackPresetId: "golden-afternoon",
    tags: ["Sunset", "Friends", "Laughter", "Autumn", "GoldenHour"],
    aiStory: "A radiant study in emotional lightness. The AI detected elevated serotonin markers, sensory warmth, and an effortless suspension of time catalyzed by shared human kinship.",
    aiResonance: {
      score: 96,
      tone: "Radiant Joy & Openhearted Presence",
      summary: "AI detected vibrant communal connection, golden spectrum lighting, and profound gratitude.",
      prompt: "Who shared this warmth with you, and how can you preserve this lightness into tomorrow?"
    },
    isHero: true
  },
  {
    id: "mem-day-2",
    title: "Quiet Morning Rain",
    folder: "📁 November 19 — Quiet Morning Rain",
    date: "2026-11-19",
    dateFormatted: "Thursday, November 19, 2026",
    time: "07:35 AM",
    location: "Studio Loft, North Mews",
    camera: "Contax T2 · Kodak Portra 400 · 38mm f/2.8",
    mood: "calm-peaceful",
    moodLabel: "Sage Mist Silence",
    quote: "Sometimes the quietest hour of the morning holds the entire architecture of peace.",
    excerpt: "Slow pour-over coffee by the misted window. Soft steady rain tapping rhythmically against the double-hung glass sash while reading Mary Oliver poems. The kettle steam rises quietly in amber horizontal stripes.",
    fullContent: `Slow pour-over coffee by the misted window. Soft steady rain tapping rhythmically against the double-hung glass sash while reading Mary Oliver poems. The kettle steam rises quietly in amber horizontal stripes across the cedar floorboards.\n\nI sat on the wooden bench with a heavy ceramic mug warmed between both hands. In this restorative silence, the mind ceases running forward into the day's obligations and settles into the physical weight of being present. The city outside is hushed—a solitary cyclist in a yellow poncho, wet leaves clinging to basalt curbstones. It feels like an analog sanctuary preserved in glass.`,
    photoUrl: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80",
    photos: [
      "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80"
    ],
    palette: [
      { hex: '#4A7C6F', name: 'Muted Sage Mist' },
      { hex: '#BED6CF', name: 'Coastal Lichen' },
      { hex: '#2C4E46', name: 'Damp Pine Needle' },
      { hex: '#142420', name: 'Basalt Charcoal' }
    ],
    hasAudio: true,
    audioDuration: "03:15",
    audioTitle: "Stillness in Rain — Brian Eno & Ambient Mist",
    soundtrackPresetId: "stillness-rain",
    tags: ["Rain", "Coffee", "Stillness", "Poetry", "Sanctuary"],
    aiStory: "A serene meditation on solitude and acoustic shelter. The prose strips away digital noise, anchoring attention to the tactile warmth of hot porcelain and raindrops against cool glass.",
    aiResonance: {
      score: 94,
      tone: "Restorative Stillness & Clarity",
      summary: "AI recognized deep mindfulness, sensory decompression, and centered spatial awareness.",
      prompt: "What quiet sanctuary can you return to when the noise of the world feels deafening?"
    },
    isHero: false
  },
  {
    id: "mem-day-3",
    title: "Faded Postcards",
    folder: "📁 November 18 — Faded Postcards",
    date: "2026-11-18",
    dateFormatted: "Wednesday, November 18, 2026",
    time: "10:48 PM",
    location: "Attic Library, Cedar Haven",
    camera: "Polaroid SX-70 · Color 600 Film",
    mood: "nostalgic-emotional",
    moodLabel: "Dusty Rose Sepia",
    quote: "To reread handwriting from ten years ago is to inhabit a ghost that looks like yourself.",
    excerpt: "Found the vintage tin biscuit box tucked beneath the linen trunk. Childhood postcards, dried lavender sprigs, and fountain pen scrawls. Playing an old Bill Evans vinyl late at night, the gentle crackle matching the rain.",
    fullContent: `Found the vintage tin biscuit box tucked beneath the linen trunk. Childhood postcards, dried lavender sprigs, and fountain pen scrawls from university days. Playing an old Bill Evans vinyl late at night, the gentle crackle matching the rain outside.\n\nThere is a bittersweet tenderness in touching handwriting from people whose voices haven't been heard in over a decade. They wrote with such fearless confidence about the future—the future that has now quietly become our everyday present. A wave of grateful tears, honoring every step that led to who I am tonight.`,
    photoUrl: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1200&q=80",
    photos: [
      "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=800&q=80"
    ],
    palette: [
      { hex: '#8C5A5A', name: 'Dusty Rose Sepia' },
      { hex: '#D6B4B4', name: 'Faded Paper Linen' },
      { hex: '#5A3838', name: 'Vintage Mahogany' },
      { hex: '#261617', name: 'Deep Espresso Ink' }
    ],
    hasAudio: true,
    audioDuration: "02:50",
    audioTitle: "Echoes of 1994 — Ryuichi Sakamoto & Warm Tape",
    soundtrackPresetId: "echoes-1994",
    tags: ["Polaroid", "Letters", "Vinyl", "Nostalgia", "Childhood"],
    aiStory: "A tender, poetic journey into temporal longing and reconciliation. The AI recognized deep reflective memory retrieval and gratitude for the passage of time.",
    aiResonance: {
      score: 97,
      tone: "Tender Bittersweet Longing",
      summary: "AI sensed profound temporal reflection, nostalgic self-reconciliation, and poetic tenderness.",
      prompt: "What would the author of those old letters admire most about who you have become today?"
    },
    isHero: false,
    isCapsuleSealed: true,
    capsuleUnlockDate: "2026-12-20",
    capsuleUnlockFormatted: "December 20, 2026"
  }
];

/**
 * Initial time capsules state to pre-seed
 */
export const INITIAL_TIME_CAPSULES = {
  "mem-day-3": {
    isSealed: true,
    sealedAt: "2026-11-18T22:48:00.000Z",
    unlockDate: "2026-12-20",
    unlockDateFormatted: "December 20, 2026",
    isSimulatedUnlock: false,
    reflection: null
  }
};
