/**
 * MEMORA — Dynamic Mood Engine
 * Maps emotional mood states to CSS Custom Properties, layout traits, and typography
 */

export const MOOD_CONFIG = {
  'calm-peaceful': {
    id: 'calm-peaceful',
    label: 'Calm & Contemplative',
    subtitle: 'Muted sage mist · Restorative silence',
    accentColor: '#4A7C6F',
    canvasBg: '#F0F4F2',
    surfaceBg: '#F9FBFA',
    inkColor: '#142420',
    resonance: '94% Equanimity',
    photoFilter: 'saturate(0.96) contrast(1.01) brightness(1.02)'
  },
  'happy-sunny': {
    id: 'happy-sunny',
    label: 'Golden Hour & Warmth',
    subtitle: 'Warm apricot · Sunlight on stone',
    accentColor: '#E87A3E',
    canvasBg: '#FFF7EB',
    surfaceBg: '#FFFDF9',
    inkColor: '#2C1808',
    resonance: '92% Radiance',
    photoFilter: 'contrast(1.04) saturate(1.18) sepia(0.08) brightness(1.03)'
  },
  'nostalgic-emotional': {
    id: 'nostalgic-emotional',
    label: 'Vintage Sepia & Longing',
    subtitle: 'Dusty rose · Polaroid tilt & tape hiss',
    accentColor: '#8C5A5A',
    canvasBg: '#F3ECE8',
    surfaceBg: '#FAF6F4',
    inkColor: '#261617',
    resonance: '96% Deep Reverie',
    photoFilter: 'sepia(0.24) contrast(0.98) brightness(0.98) saturate(0.92)'
  },
  'default': {
    id: 'default',
    label: 'Neutral Alabaster',
    subtitle: 'Pure paper & charcoal ink',
    accentColor: '#7D7063',
    canvasBg: '#F7F5F0',
    surfaceBg: '#FFFFFF',
    inkColor: '#1C1B19',
    resonance: '90% Centered',
    photoFilter: 'contrast(1.02) saturate(1.02)'
  }
};

export class ThemeEngine {
  constructor(store) {
    this.store = store;
    this.currentMood = 'calm-peaceful';
  }

  init() {
    const initialState = this.store.getState();
    this.applyMood(initialState.currentMood || 'calm-peaceful');

    // Subscribe to store updates
    this.store.subscribe((state, eventName) => {
      if (eventName === 'MOOD_CHANGED' || eventName === 'MEMORY_SELECTED' || eventName === 'MEMORY_ADDED') {
        this.applyMood(state.currentMood);
      }
    });
  }

  applyMood(moodId) {
    const validMood = MOOD_CONFIG[moodId] ? moodId : 'calm-peaceful';
    this.currentMood = validMood;
    
    // Set attribute on body
    document.body.setAttribute('data-mood', validMood);

    // Update active swatch state in navigation
    this._updateSwatchUI(validMood);
    this._updateMoodPulseUI(validMood);
  }

  _updateSwatchUI(activeMood) {
    const swatches = document.querySelectorAll('.mood-swatch-btn');
    swatches.forEach(btn => {
      const target = btn.getAttribute('data-mood-target');
      if (target === activeMood) {
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
      } else {
        btn.classList.remove('active');
        btn.setAttribute('aria-pressed', 'false');
      }
    });
  }

  _updateMoodPulseUI(activeMood) {
    const meta = MOOD_CONFIG[activeMood] || MOOD_CONFIG['calm-peaceful'];
    const titleEl = document.querySelector('.mood-status-title');
    const subEl = document.querySelector('.mood-status-sub');
    
    if (titleEl) titleEl.textContent = meta.label;
    if (subEl) subEl.textContent = `${meta.resonance} · ${meta.subtitle}`;
  }

  getMeta(moodId) {
    return MOOD_CONFIG[moodId] || MOOD_CONFIG['default'];
  }
}
