/**
 * MEMORA — Editorial Analog-Digital Diary Express Server
 * Serves the static frontend from ./public and provides multimodal AI analysis
 * via Google Gemini API (@google/genai, model gemini-2.5-flash) with graceful local fallback.
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware for parsing JSON with generous limit for base64 photos
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Serve static frontend assets from ./public
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Smart Local Rule-based Fallback Generator
 * Used when GEMINI_API_KEY is not configured or if API requests fail
 */
function generateFallbackAnalysis({ story = '', songTitle = '', songArtist = '' }) {
  const text = (story || '').trim();
  const lower = text.toLowerCase();
  const track = songTitle ? `${songTitle}${songArtist ? ` by ${songArtist}` : ''}` : 'an ambient melody';

  let mood = 'calm-peaceful';
  let palette = ['#4A7C6F', '#BED6CF', '#2C4E46', '#142420'];
  let defaultTitle = 'The Silence of Boiling Water';
  let aiStory = `A profoundly quiet study in spatial mindfulness set to the gentle cadence of ${track}. The narrative lingers on the physical warmth of porcelain, steam rising against cool glass, and an architecture of peaceful attention.`;

  const sunnyKeywords = ['sun', 'laugh', 'joy', 'smile', 'warm', 'light', 'gold', 'friend', 'bright', 'summer', 'autumn', 'bread', 'table', 'love', 'dance'];
  const nostalgicKeywords = ['remember', 'old', 'letter', 'tape', 'past', 'miss', 'childhood', 'rain', 'lost', 'years', 'cassette', 'faded', 'photograph', 'hiss', 'vinyl'];

  let sunnyCount = sunnyKeywords.filter(k => lower.includes(k)).length;
  let nostalgicCount = nostalgicKeywords.filter(k => lower.includes(k)).length;

  if (sunnyCount > nostalgicCount && sunnyCount > 0) {
    mood = 'happy-sunny';
    palette = ['#E87A3E', '#FAD49F', '#A85A2E', '#2C1808'];
    defaultTitle = 'Amber Light Across the Pine Floor';
    aiStory = `A luminous afternoon captured in warm amber hues, accompanied by ${track}. The narrative reveals an effortless lightness—where the weight of ordinary time dissolved into shared laughter and radiant presence.`;
  } else if (nostalgicCount > sunnyCount && nostalgicCount > 0) {
    mood = 'nostalgic-emotional';
    palette = ['#8C5A5A', '#D6B4B4', '#5A3838', '#261617'];
    defaultTitle = 'Postcards in the Unopened Cedar Box';
    aiStory = `An evocative reflection through the tender ache of memory, breathing alongside ${track}. Time here is felt as something textured and physical, akin to worn stationery and vintage tape hiss.`;
  }

  // Derive a 3-5 word title from the user's first sentence if available
  let title = defaultTitle;
  if (text.length > 0) {
    const firstClause = text.split(/[.?!,\n]/)[0].trim();
    const words = firstClause.split(/\s+/).slice(0, 5).join(' ');
    if (words.length > 8 && words.length < 42) {
      title = words.replace(/\b\w/g, l => l.toUpperCase());
    }
  }

  const now = new Date();
  const monthDay = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(now);
  const folderName = `📁 ${monthDay} — ${title}`;

  return {
    title,
    aiStory,
    mood,
    palette,
    folderName
  };
}

/**
 * POST /api/analyze
 * Multimodal AI Analysis with Google Gemini API & Structured Output
 */
app.post('/api/analyze', async (req, res) => {
  const { story = '', imageBase64 = null, songTitle = '', songArtist = '' } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  // Check if real Gemini API key is present
  if (apiKey && apiKey !== 'your_key_here' && apiKey.trim().length > 10) {
    try {
      console.log('[MEMORA API] Calling Gemini 2.5 Flash for multimodal analysis...');
      const ai = new GoogleGenAI({ apiKey });

      const contents = [];

      // Add image if base64 data URI is provided
      if (imageBase64 && typeof imageBase64 === 'string') {
        const mimeMatch = imageBase64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
        if (mimeMatch) {
          contents.push({
            inlineData: {
              mimeType: mimeMatch[1],
              data: mimeMatch[2]
            }
          });
        }
      }

      const systemPrompt = `You are a Senior Editorial Writer and Emotional AI Curator for MEMORA, an analog-digital diary inspired by Kinfolk magazine and Dieter Rams minimalism.
Analyze the user's journal story, analog photograph (if provided), and soundtrack.
Extract emotional undertones and produce structured JSON with:
1. title: A poetic, evocative 3 to 6 word title capturing the soul of the memory.
2. aiStory: A 2 to 3 sentence editorial, deeply human synthesis highlighting lighting, emotional textures, and sensory presence.
3. mood: Exactly one of ["happy-sunny", "calm-peaceful", "nostalgic-emotional"].
   - "happy-sunny": joy, golden hour light, laughter, gratitude, warmth.
   - "calm-peaceful": quiet, rain, morning tea, stillness, restorative silence.
   - "nostalgic-emotional": remembering the past, letters, childhood, vinyl, tender longing.
4. palette: An array of exactly 4 hex color strings (e.g. ["#E87A3E", "#FAD49F", "#A85A2E", "#2C1808"]) that match the visual and emotional harmony.
5. folderName: Formatted exactly as "📁 [Month Day] — [Title]" (e.g. "📁 Nov 21 — Amber Light on Cedar").`;

      const promptText = `Story: ${story || 'A quiet, unhurried moment in the afternoon.'}\nSoundtrack: ${songTitle || 'Ambient Reflection'}${songArtist ? ` by ${songArtist}` : ''}`;
      contents.push({ text: promptText });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              aiStory: { type: Type.STRING },
              mood: {
                type: Type.STRING,
                enum: ['happy-sunny', 'calm-peaceful', 'nostalgic-emotional']
              },
              palette: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              folderName: { type: Type.STRING }
            },
            required: ['title', 'aiStory', 'mood', 'palette', 'folderName']
          }
        }
      });

      const parsed = JSON.parse(response.text);
      console.log(`[MEMORA API] Gemini analysis complete: "${parsed.title}" [${parsed.mood}]`);

      return res.json({
        success: true,
        source: 'gemini',
        ...parsed
      });
    } catch (err) {
      console.warn('[MEMORA API] Gemini API request failed, falling back to local engine:', err.message);
    }
  } else {
    console.log('[MEMORA API] No GEMINI_API_KEY detected. Using local smart rule-based engine.');
  }

  // Graceful Local Fallback
  const fallbackResult = generateFallbackAnalysis({ story, songTitle, songArtist });
  return res.json({
    success: true,
    source: 'fallback',
    ...fallbackResult
  });
});

/**
 * GET /api/music-search?q=term
 * Proxy to free public iTunes Search API to avoid browser CORS/privacy blocking
 */
app.get('/api/music-search', async (req, res) => {
  const query = req.query.q || req.query.term || '';
  if (!query || query.trim().length === 0) {
    return res.json({ results: [] });
  }

  try {
    const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(query.trim())}&entity=song&limit=4`;
    const response = await fetch(itunesUrl);
    if (!response.ok) {
      throw new Error(`iTunes API responded with ${response.status}`);
    }
    const data = await response.json();

    const formatted = (data.results || []).map(item => ({
      id: `itunes-${item.trackId}`,
      title: item.trackName,
      artist: item.artistName,
      album: item.collectionName,
      artwork: item.artworkUrl100,
      previewUrl: item.previewUrl,
      duration: '00:30 Preview'
    }));

    res.json({ results: formatted });
  } catch (err) {
    console.warn('[MEMORA API] iTunes proxy search error:', err.message);
    res.json({ results: [], error: err.message });
  }
});

// Fallback all other routes to index.html for SPA routing
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`
  ══════════════════════════════════════════════════════
  ✦ MEMORA — Emotional AI Digital Chronicle
  ✦ Running at: http://localhost:${PORT}
  ✦ Static Assets: ./public
  ✦ Gemini API: ${process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_key_here' ? 'CONNECTED (gemini-2.5-flash)' : 'FALLBACK MODE (Set GEMINI_API_KEY in .env)'}
  ══════════════════════════════════════════════════════
  `);
});
