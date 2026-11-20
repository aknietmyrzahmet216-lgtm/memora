/**
 * MEMORA — Main Application Entry Point
 * Orchestrates global Event Delegation, Store Subscriptions,
 * 4-Step Editorial Wizard, Instant Search & Layout Switching, and Time Capsule flows.
 */

import { store } from './store.js';
import { ThemeEngine } from './themes.js';
import { ui } from './ui.js';
import { SOUNDTRACK_PRESETS, audioEngine } from './audioEngine.js';
import { ImageCompressor, CURATED_ANALOG_PRESETS } from './imageCompressor.js';

class App {
  constructor() {
    this.themeEngine = new ThemeEngine(store);
    this.itunesDebounce = null;
  }

  init() {
    console.log('[MEMORA] Initializing Editorial Analog-Digital Diary...');

    // 1. Initialize Dynamic Theme Engine
    this.themeEngine.init();

    // 2. Initial Render based on active view
    ui.render();

    // 3. Setup Global Event Delegation & Drag-Drop listeners
    this._setupEventDelegation();

    // 4. Subscribe to Store Updates
    store.subscribe((state, eventName) => {
      if (eventName === 'SEARCH_CHANGED') {
        // Targeted live update to keep search input focused
        this._updateArchiveResultsOnly(state);
      } else if (eventName === 'MOOD_CHANGED' || eventName === 'FILTER_CHANGED' || 
          eventName === 'LAYOUT_CHANGED' || eventName === 'SORT_CHANGED' ||
          eventName === 'MEMORY_ADDED' || eventName === 'MEMORY_DELETED' || 
          eventName === 'VIEW_CHANGED' || eventName === 'TIME_CAPSULE_SEALED' ||
          eventName === 'TIME_CAPSULE_UNSEALED' || eventName === 'CAPSULE_REFLECTION_SAVED' ||
          eventName === 'DEMO_DATA_RESET') {
        ui.transition(() => {
          ui.render();
        });
      } else if (eventName === 'AUDIO_TOGGLED') {
        ui.render();
      }
    });

    console.log('[MEMORA] Application Ready.');
  }

  _updateArchiveResultsOnly(state) {
    const section = document.querySelector('.archive-section');
    if (!section) return;

    const filtered = store.getFilteredMemories();
    const existingContent = section.querySelector('.memory-grid, .folder-grid, .timeline-view, .archive-empty-state');
    if (existingContent) {
      const temp = document.createElement('div');
      temp.innerHTML = filtered.length === 0 
        ? ui._renderEmptyState(state) 
        : ui._renderArchiveLayout(filtered, state);
      
      existingContent.replaceWith(temp.firstElementChild);
    }
  }

  _setupEventDelegation() {
    // Single centralized click listener
    document.addEventListener('click', (e) => {
      // Light-dismiss if user clicked on modal backdrop itself
      if (e.target && e.target.classList && e.target.classList.contains('modal-backdrop')) {
        audioEngine.stop();
        ui.closeModal();
        return;
      }

      const actionEl = e.target.closest('[data-action]');
      if (!actionEl) return;

      const action = actionEl.getAttribute('data-action');

      switch (action) {
        // Navigation & Views
        case 'nav-home': {
          e.preventDefault();
          store.setView('home');
          window.scrollTo({ top: 0, behavior: 'smooth' });
          break;
        }

        case 'nav-archive': {
          e.preventDefault();
          if (store.getState().activeView !== 'home') {
            store.setView('home');
            setTimeout(() => {
              document.getElementById('archive-heading')?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
          } else {
            document.getElementById('archive-heading')?.scrollIntoView({ behavior: 'smooth' });
          }
          break;
        }

        case 'nav-reflections': {
          e.preventDefault();
          if (store.getState().activeView !== 'home') {
            store.setView('home');
            setTimeout(() => {
              document.querySelector('.mood-status-card')?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
          } else {
            document.querySelector('.mood-status-card')?.scrollIntoView({ behavior: 'smooth' });
          }
          break;
        }

        case 'view-full-memory': {
          e.preventDefault();
          const memoryId = actionEl.getAttribute('data-id') || actionEl.closest('[data-id]')?.getAttribute('data-id');
          if (memoryId) {
            store.selectMemory(memoryId);
            store.setView('memory-view', memoryId);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
          break;
        }

        case 'delete-memory': {
          e.preventDefault();
          const memoryId = actionEl.getAttribute('data-id');
          if (memoryId && confirm('Do you wish to archive and remove this memory from your chronicle?')) {
            store.deleteMemory(memoryId);
          }
          break;
        }

        // Layout switching & Sorting
        case 'toggle-archive-layout': {
          e.preventDefault();
          const layout = actionEl.getAttribute('data-layout');
          if (layout) {
            store.setArchiveLayout(layout);
          }
          break;
        }

        case 'toggle-sort': {
          e.preventDefault();
          const currentSort = store.getState().sortBy;
          store.setSortBy(currentSort === 'newest' ? 'oldest' : 'newest');
          break;
        }

        case 'clear-search': {
          e.preventDefault();
          store.setSearchQuery('');
          const searchInput = document.querySelector('.archive-search-input');
          if (searchInput) searchInput.value = '';
          break;
        }

        case 'clear-all-filters': {
          e.preventDefault();
          store.setFilter('all');
          store.setSearchQuery('');
          break;
        }

        case 'reset-demo-data': {
          e.preventDefault();
          if (confirm('Re-seed the 3 curated demo chronicles ("Golden Hours", "Quiet Morning Rain", "Faded Postcards")?')) {
            store.resetDemoData();
          }
          break;
        }

        // Theme / Filter
        case 'set-mood': {
          e.preventDefault();
          const targetMood = actionEl.getAttribute('data-mood-target');
          if (targetMood) {
            store.setMood(targetMood);
          }
          break;
        }

        case 'filter-mood': {
          e.preventDefault();
          const filter = actionEl.getAttribute('data-filter');
          if (filter) {
            store.setFilter(filter);
          }
          break;
        }

        // Audio controls
        case 'toggle-audio': {
          e.preventDefault();
          e.stopPropagation();
          const trackId = actionEl.getAttribute('data-id');
          const presetId = actionEl.getAttribute('data-preset') || 'golden-afternoon';
          const previewUrl = actionEl.getAttribute('data-preview-url');
          
          if (trackId) {
            store.toggleAudio(trackId);
            if (previewUrl && previewUrl !== 'undefined') {
              audioEngine.toggleStream(previewUrl, trackId);
            } else {
              audioEngine.toggle(presetId);
            }
          }
          break;
        }

        // iTunes Real Music Search Selection & Preview
        case 'select-itunes-song': {
          e.preventDefault();
          const id = actionEl.getAttribute('data-song-id') || `itunes-${Date.now()}`;
          const title = actionEl.getAttribute('data-track-name') || 'Song Track';
          const artist = actionEl.getAttribute('data-artist-name') || 'Artist';
          const album = actionEl.getAttribute('data-album-name') || '';
          const previewUrl = actionEl.getAttribute('data-preview-url') || '';
          const artwork = actionEl.getAttribute('data-artwork') || '';

          store.updateWizardDraft({
            soundtrack: {
              id,
              title,
              artist,
              album,
              previewUrl,
              artwork,
              mood: 'calm-peaceful',
              tag: 'iTunes Catalog'
            }
          });
          ui.openWizardModal(3);
          break;
        }

        case 'preview-itunes-stream': {
          e.preventDefault();
          e.stopPropagation();
          const url = actionEl.getAttribute('data-stream-url');
          const id = actionEl.getAttribute('data-song-id');
          if (url) {
            audioEngine.toggleStream(url, id);
            ui.openWizardModal(3);
          }
          break;
        }

        // 4-Step Editorial Wizard
        case 'open-wizard': {
          e.preventDefault();
          const step = parseInt(actionEl.getAttribute('data-step') || '1', 10);
          ui.openWizardModal(step);
          break;
        }

        case 'wizard-next': {
          e.preventDefault();
          const currentStep = parseInt(actionEl.getAttribute('data-step'), 10);
          this._handleWizardNext(currentStep);
          break;
        }

        case 'wizard-prev': {
          e.preventDefault();
          const currentStep = parseInt(actionEl.getAttribute('data-step'), 10);
          ui.openWizardModal(Math.max(1, currentStep - 1));
          break;
        }

        case 'remove-photo': {
          e.preventDefault();
          e.stopPropagation();
          const idx = parseInt(actionEl.getAttribute('data-index'), 10);
          const currentPhotos = [...store.getState().wizardDraft.photos];
          currentPhotos.splice(idx, 1);
          store.updateWizardDraft({ photos: currentPhotos });
          ui.openWizardModal(2);
          break;
        }

        case 'add-preset-photo': {
          e.preventDefault();
          const url = actionEl.getAttribute('data-url');
          const currentPhotos = [...store.getState().wizardDraft.photos];
          if (currentPhotos.length < 5) {
            currentPhotos.push(url);
            store.updateWizardDraft({ photos: currentPhotos });
            ui.openWizardModal(2);
          } else {
            alert('A maximum of 5 photographs can be attached to one chronicle.');
          }
          break;
        }

        case 'select-soundtrack': {
          e.preventDefault();
          const presetId = actionEl.getAttribute('data-id');
          const preset = SOUNDTRACK_PRESETS.find(p => p.id === presetId);
          if (preset) {
            store.updateWizardDraft({ soundtrack: preset });
            ui.openWizardModal(3);
          }
          break;
        }

        case 'preview-soundtrack': {
          e.preventDefault();
          e.stopPropagation();
          const presetId = actionEl.getAttribute('data-id');
          if (presetId) {
            audioEngine.toggle(presetId);
            ui.openWizardModal(3);
          }
          break;
        }

        case 'trigger-ai-synthesis': {
          e.preventDefault();
          const draft = store.getState().wizardDraft;
          if (!draft.storyText || draft.storyText.trim().length === 0) {
            draft.storyText = "The afternoon sun spilled across the wooden floorboards. We sat listening to the quiet murmur of the kettle, noticing how light shifts when you finally stop rushing.";
            store.updateWizardDraft({ storyText: draft.storyText });
          }
          if (!draft.soundtrack) {
            store.updateWizardDraft({ soundtrack: SOUNDTRACK_PRESETS[0] });
          }

          ui.showTheatricalAIScreen(store.getState().wizardDraft, (newMemory) => {
            store.setView('memory-view', newMemory.id);
          });
          break;
        }

        // Time Capsule
        case 'open-capsule': {
          e.preventDefault();
          const memoryId = actionEl.getAttribute('data-id');
          if (memoryId) {
            ui.openTimeCapsuleModal(memoryId);
          }
          break;
        }

        case 'seal-capsule': {
          e.preventDefault();
          const memoryId = actionEl.getAttribute('data-id');
          const months = parseInt(actionEl.getAttribute('data-months') || '1', 10);
          
          const unlock = new Date();
          unlock.setMonth(unlock.getMonth() + months);
          const unlockIso = unlock.toISOString().split('T')[0];
          const unlockFormatted = new Intl.DateTimeFormat('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
          }).format(unlock);

          store.sealTimeCapsule(memoryId, unlockIso, unlockFormatted);
          ui.closeModal();
          break;
        }

        case 'simulate-time-travel': {
          e.preventDefault();
          const memoryId = actionEl.getAttribute('data-id');
          if (memoryId) {
            store.unsealTimeCapsule(memoryId, true);
            ui.closeModal();
            store.setView('memory-view', memoryId);
          }
          break;
        }

        // Modal Close
        case 'close-modal': {
          e.preventDefault();
          audioEngine.stop();
          ui.closeModal();
          break;
        }

        default:
          break;
      }
    });

    // Real-time Text Input & Live Sentiment Detection in Wizard Step 1 & Live Search
    document.addEventListener('input', (e) => {
      if (e.target && e.target.id === 'wizard-story-input') {
        const text = e.target.value;
        store.updateWizardDraft({ storyText: text });
        this._updateLiveSentimentBadge(text);
      } else if (e.target && e.target.classList && e.target.classList.contains('archive-search-input')) {
        store.setSearchQuery(e.target.value);
      } else if (e.target && e.target.id === 'itunes-music-search-input') {
        clearTimeout(this.itunesDebounce);
        const query = e.target.value.trim();
        this.itunesDebounce = setTimeout(() => {
          this._handleItunesSearch(query);
        }, 320);
      } else if (e.target && (e.target.id === 'custom-track-title' || e.target.id === 'custom-track-artist')) {
        const title = document.getElementById('custom-track-title')?.value.trim() || 'Custom Ambient Reflection';
        const artist = document.getElementById('custom-track-artist')?.value.trim() || 'Personal Soundtrack';
        store.updateWizardDraft({
          soundtrack: {
            id: 'custom-track',
            title,
            artist,
            mood: 'calm-peaceful',
            desc: 'Custom soundtrack input by author',
            tag: 'Author Selected'
          }
        });
      }
    });

    // File input change in Step 2
    document.addEventListener('change', async (e) => {
      if (e.target && e.target.id === 'wizard-file-input') {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const currentPhotos = [...store.getState().wizardDraft.photos];
        const remainingSlots = 5 - currentPhotos.length;
        const filesToProcess = files.slice(0, remainingSlots);

        for (const file of filesToProcess) {
          try {
            const compressed = await ImageCompressor.compressFile(file, 900, 0.72);
            currentPhotos.push(compressed);
          } catch (err) {
            console.warn('[MEMORA] Could not compress file:', err);
          }
        }

        store.updateWizardDraft({ photos: currentPhotos });
        ui.openWizardModal(2);
      }
    });

    // Drag and drop in Step 2
    document.addEventListener('dragover', (e) => {
      const dropZone = e.target.closest('#photo-drop-zone');
      if (dropZone) {
        e.preventDefault();
        dropZone.classList.add('dragover');
      }
    });

    document.addEventListener('dragleave', (e) => {
      const dropZone = e.target.closest('#photo-drop-zone');
      if (dropZone) {
        dropZone.classList.remove('dragover');
      }
    });

    document.addEventListener('drop', async (e) => {
      const dropZone = e.target.closest('#photo-drop-zone');
      if (dropZone) {
        e.preventDefault();
        dropZone.classList.remove('dragover');

        const files = Array.from(e.dataTransfer?.files || []);
        if (files.length === 0) return;

        const currentPhotos = [...store.getState().wizardDraft.photos];
        const remainingSlots = 5 - currentPhotos.length;
        const filesToProcess = files.slice(0, remainingSlots);

        for (const file of filesToProcess) {
          try {
            const compressed = await ImageCompressor.compressFile(file, 900, 0.72);
            currentPhotos.push(compressed);
          } catch (err) {
            console.warn('[MEMORA] Could not compress dropped file:', err);
          }
        }

        store.updateWizardDraft({ photos: currentPhotos });
        ui.openWizardModal(2);
      }
    });

    // Time Capsule Reflection form submit
    document.addEventListener('submit', (e) => {
      if (e.target && e.target.id === 'comparison-reflection-form') {
        e.preventDefault();
        const memoryId = e.target.getAttribute('data-id');
        const text = e.target.querySelector('#comparison-reflection-text')?.value.trim();
        if (memoryId && text) {
          store.saveCapsuleReflection(memoryId, text, store.getState().currentMood);
        }
      }
    });

    // Keyboard support: Escape closes modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        audioEngine.stop();
        ui.closeModal();
      }
    });
  }

  _handleWizardNext(step) {
    const draft = store.getState().wizardDraft;

    if (step === 1) {
      const storyInput = document.getElementById('wizard-story-input');
      const text = storyInput ? storyInput.value.trim() : draft.storyText;
      
      // Inline validation shake if user tries to advance with empty text
      if (!text || text.length === 0) {
        if (storyInput) {
          storyInput.classList.remove('shake-error');
          void storyInput.offsetWidth; // Trigger reflow for animation restart
          storyInput.classList.add('shake-error');
          storyInput.placeholder = 'Please write a fleeting thought or memory before proceeding...';
          storyInput.focus();
          setTimeout(() => storyInput.classList.remove('shake-error'), 450);
        }
        return;
      }

      store.updateWizardDraft({ storyText: text });
      ui.openWizardModal(2);
    } else if (step === 2) {
      if (draft.photos.length === 0) {
        store.updateWizardDraft({ photos: [CURATED_ANALOG_PRESETS[0].url] });
      }
      ui.openWizardModal(3);
    } else if (step === 3) {
      if (!draft.soundtrack) {
        store.updateWizardDraft({ soundtrack: SOUNDTRACK_PRESETS[0] });
      }
      ui.openWizardModal(4);
    }
  }

  _updateLiveSentimentBadge(text) {
    const badge = document.getElementById('wizard-sentiment-badge');
    const textEl = document.getElementById('wizard-sentiment-text');
    const dotEl = badge?.querySelector('.live-sentiment-dot');
    if (!badge || !textEl || !dotEl) return;

    const lower = text.toLowerCase();
    if (text.trim().length === 0) {
      textEl.textContent = 'Waiting for words...';
      dotEl.style.backgroundColor = 'var(--color-ink-300)';
    } else if (lower.includes('sun') || lower.includes('warm') || lower.includes('joy') || lower.includes('laugh') || lower.includes('gold')) {
      textEl.textContent = 'Detected: Radiance & Warmth';
      dotEl.style.backgroundColor = '#E87A3E';
    } else if (lower.includes('old') || lower.includes('letter') || lower.includes('rain') || lower.includes('miss') || lower.includes('past')) {
      textEl.textContent = 'Detected: Bittersweet Sepia';
      dotEl.style.backgroundColor = '#8C5A5A';
    } else if (lower.includes('quiet') || lower.includes('peace') || lower.includes('fog') || lower.includes('tea') || lower.includes('still')) {
      textEl.textContent = 'Detected: Sage Stillness';
      dotEl.style.backgroundColor = '#4A7C6F';
    } else {
      textEl.textContent = `Observant presence (${text.length} chars)`;
      dotEl.style.backgroundColor = '#7D7063';
    }
  }

  async _handleItunesSearch(query) {
    const resultsContainer = document.getElementById('itunes-search-results');
    if (!resultsContainer) return;

    if (!query || query.length < 2) {
      resultsContainer.innerHTML = '';
      return;
    }

    resultsContainer.innerHTML = `
      <div style="font-size: var(--text-xs); color: var(--color-ink-400); padding: 8px;">
        Searching iTunes catalog for "${query}"...
      </div>
    `;

    try {
      let songs = [];
      // Try backend proxy first
      try {
        const res = await fetch(`/api/music-search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          songs = data.results || [];
        }
      } catch (e) {
        // Fallback directly to public iTunes Search API
        const itunesDirect = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=4`;
        const resDirect = await fetch(itunesDirect);
        if (resDirect.ok) {
          const data = await resDirect.json();
          songs = (data.results || []).map(item => ({
            id: `itunes-${item.trackId}`,
            title: item.trackName,
            artist: item.artistName,
            album: item.collectionName,
            artwork: item.artworkUrl100,
            previewUrl: item.previewUrl
          }));
        }
      }

      if (songs.length === 0) {
        resultsContainer.innerHTML = `
          <div style="font-size: var(--text-xs); color: var(--color-ink-400); padding: 8px;">
            No songs found for "${query}". Try another artist or song title.
          </div>
        `;
        return;
      }

      const currentSoundtrack = store.getState().wizardDraft.soundtrack;
      resultsContainer.innerHTML = songs.map(song => {
        const isSelected = currentSoundtrack?.id === song.id;
        const isPlaying = audioEngine.isPlaying && audioEngine.currentPlayingId === song.id;

        return `
          <div class="itunes-song-card ${isSelected ? 'selected' : ''}" 
               data-action="select-itunes-song" 
               data-song-id="${song.id}" 
               data-track-name="${song.title.replace(/"/g, '&quot;')}" 
               data-artist-name="${song.artist.replace(/"/g, '&quot;')}" 
               data-album-name="${(song.album || '').replace(/"/g, '&quot;')}" 
               data-preview-url="${song.previewUrl || ''}" 
               data-artwork="${song.artwork || ''}">
            <div class="itunes-song-left">
              <img class="itunes-artwork" src="${song.artwork || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=100&q=80'}" alt="" />
              <div class="itunes-meta-info">
                <div class="itunes-song-title">${song.title}</div>
                <div class="itunes-song-artist">${song.artist} ${song.album ? `· ${song.album}` : ''}</div>
              </div>
            </div>
            <div class="itunes-actions">
              ${song.previewUrl ? `
                <button type="button" class="btn btn-secondary" style="padding: 4px 10px; font-size: var(--text-caption);" 
                        data-action="preview-itunes-stream" data-stream-url="${song.previewUrl}" data-song-id="${song.id}">
                  ${isPlaying ? '■ Stop' : '▶ 30s'}
                </button>
              ` : ''}
              <span class="card-tag" style="background: ${isSelected ? 'var(--mood-accent)' : 'var(--color-paper-200)'}; color: ${isSelected ? '#fff' : 'inherit'};">
                ${isSelected ? 'Selected' : 'Choose'}
              </span>
            </div>
          </div>
        `;
      }).join('');
    } catch (err) {
      console.warn('[MEMORA UI] iTunes search failed:', err);
      resultsContainer.innerHTML = `
        <div style="font-size: var(--text-xs); color: var(--color-ink-400); padding: 8px;">
          Could not search iTunes at this time. You can choose an ambient preset or manually type a song below.
        </div>
      `;
    }
  }
}

// Boot application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new App().init());
} else {
  new App().init();
}
