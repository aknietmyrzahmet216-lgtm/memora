/**
 * MEMORA — UI Controller & DOM Rendering Engine
 * Implements pure semantic HTML generation, Same-Document View Transitions,
 * 4-Step Editorial Wizard, Theatrical AI Processing, Memory View,
 * and Time Capsule Side-by-Side Comparison.
 */

import { store } from './store.js';
import { MOOD_CONFIG } from './themes.js';
import { SOUNDTRACK_PRESETS, audioEngine } from './audioEngine.js';
import { CURATED_ANALOG_PRESETS, ImageCompressor } from './imageCompressor.js';
import { AIEngine } from './aiEngine.js';

export class UIEngine {
  constructor() {
    this.audioTimer = null;
    this.audioProgress = 0;
  }

  /**
   * Safely transitions view updates using the View Transitions API if supported
   * Includes mandatory accessibility routing: shifting focus programmatically
   */
  transition(callback, focusTargetSelector = 'h1') {
    if (!document.startViewTransition) {
      callback();
      const target = document.querySelector(focusTargetSelector);
      if (target) {
        target.setAttribute('tabindex', '-1');
        target.focus();
      }
      return;
    }

    try {
      const vt = document.startViewTransition(() => {
        callback();
      });

      vt.finished
        .then(() => {
          const target = document.querySelector(focusTargetSelector);
          if (target) {
            target.setAttribute('tabindex', '-1');
            target.focus();
          }
        })
        .catch(() => {
          // Gracefully swallow AbortError if transition was interrupted by rapid navigation
        });
    } catch (err) {
      callback();
    }
  }

  /**
   * Main App View Dispatcher
   */
  render() {
    const state = store.getState();
    if (state.activeView === 'memory-view' && state.activeMemoryId) {
      this.renderMemoryView(state.activeMemoryId);
    } else {
      this.renderHome();
    }
  }

  /**
   * Render the complete Home View
   */
  renderHome() {
    const appEl = document.getElementById('app');
    if (!appEl) return;

    const hero = store.getHeroMemory();
    const filteredMemories = store.getFilteredMemories();
    const state = store.getState();
    const moodMeta = MOOD_CONFIG[state.currentMood] || MOOD_CONFIG['calm-peaceful'];

    appEl.innerHTML = `
      <!-- Fixed Tactile Grain Overlay -->
      <div class="film-grain" aria-hidden="true"></div>

      <!-- Site Header -->
      <header class="site-header" role="banner">
        <div class="container header-inner">
          <div class="brand-group">
            <a href="#" class="brand-title" data-action="nav-home">MEMORA</a>
            <span class="brand-edition">VOL. IV · NO. 28 · NOVEMBER 2026</span>
          </div>

          <nav class="site-nav" aria-label="Main Navigation">
            <button class="nav-btn ${state.activeView === 'home' ? 'active' : ''}" data-action="nav-home">Today</button>
            <button class="nav-btn" data-action="nav-archive">Archive</button>
            <button class="nav-btn" data-action="nav-reflections">Reflections</button>
          </nav>

          <div class="header-actions">
            <!-- Dynamic Mood Theme Swatches -->
            <div class="mood-picker-wrapper" title="Switch Emotional Atmosphere">
              <span class="mood-picker-label">Mood:</span>
              <div class="mood-swatch-list" role="radiogroup" aria-label="Theme Moods">
                <button class="mood-swatch-btn ${state.currentMood === 'calm-peaceful' ? 'active' : ''}" 
                        data-action="set-mood" data-mood-target="calm-peaceful" 
                        title="Calm & Peaceful (Sage)" aria-label="Calm & Peaceful mood"></button>
                <button class="mood-swatch-btn ${state.currentMood === 'happy-sunny' ? 'active' : ''}" 
                        data-action="set-mood" data-mood-target="happy-sunny" 
                        title="Happy & Sunny (Apricot)" aria-label="Happy & Sunny mood"></button>
                <button class="mood-swatch-btn ${state.currentMood === 'nostalgic-emotional' ? 'active' : ''}" 
                        data-action="set-mood" data-mood-target="nostalgic-emotional" 
                        title="Nostalgic & Emotional (Vintage Sepia)" aria-label="Nostalgic & Emotional mood"></button>
              </div>
            </div>

            <button class="btn btn-primary" data-action="open-wizard">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              <span>Record Memory</span>
            </button>
          </div>
        </div>
      </header>

      <!-- Main Chronicle Content -->
      <main id="main-content" class="container">
        <!-- Hero Preface & Mood of the Day Indicator -->
        <section class="hero-preface" aria-labelledby="today-heading">
          <div>
            <div class="date-stamp">${hero.dateFormatted}</div>
            <h1 id="today-heading" class="edition-headline">Chronicle of the Present</h1>
          </div>

          <!-- Emotional Mood Indicator -->
          <div class="mood-status-card" role="status" aria-live="polite">
            <span class="mood-pulse-dot" aria-hidden="true"></span>
            <div class="mood-status-meta">
              <span class="mood-status-title">${moodMeta.label}</span>
              <span class="mood-status-sub">${moodMeta.resonance} · ${moodMeta.subtitle}</span>
            </div>
          </div>
        </section>

        <!-- "Today's Memory" Hero Card Spread -->
        <article class="hero-memory-spread" data-mood="${hero.mood}" aria-labelledby="hero-title">
          <!-- Left Photo Presentation -->
          <div class="hero-photo-wrapper">
            <img class="hero-photo" src="${hero.photoUrl}" alt="${hero.title}" loading="eager" />
            
            <div class="photo-mood-pill">
              <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:currentColor"></span>
              <span>${hero.moodLabel}</span>
            </div>

            <div class="photo-analog-tag">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
              <span>${hero.camera}</span>
            </div>
          </div>

          <!-- Right Editorial Story -->
          <div class="hero-story-content">
            <div class="story-header">
              <div class="story-location-date">
                <span>${hero.time}</span>
                <span>•</span>
                <span>${hero.location}</span>
                ${hero.folder ? `<span>•</span> <span style="font-family:var(--font-mono);">${hero.folder}</span>` : ''}
              </div>
              <h2 id="hero-title" class="story-title">${hero.title}</h2>
              <p class="story-excerpt">${hero.excerpt}</p>

              <!-- Editorial Quote Callout -->
              <div class="story-quote-block">
                <p class="story-quote-text">“${hero.quote}”</p>
              </div>

              <!-- AI Emotional Resonance Banner -->
              <div class="ai-resonance-banner">
                <div class="ai-resonance-title">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="m10 15 5-3-5-3v6Z"/>
                  </svg>
                  <span>AI Insight: ${hero.aiResonance.tone}</span>
                </div>
                <span class="ai-resonance-metric">Score ${hero.aiResonance.score}%</span>
              </div>

              <!-- Dieter Rams Minimal Audio Widget -->
              ${hero.hasAudio ? this._renderAudioWidget(hero, state) : ''}
            </div>

            <div class="story-footer-actions">
              <button class="btn btn-primary" data-action="view-full-memory" data-id="${hero.id}">
                <span>Open Chronicle</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>

              <button class="btn btn-tactile" data-action="open-capsule" data-id="${hero.id}">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <span>Time Capsule</span>
              </button>
            </div>
          </div>
        </article>

        <!-- Tactile "Create New Memory" CTA Banner -->
        <section class="create-memory-banner" aria-label="Journal Invitation">
          <div class="banner-icon-mark" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 20h9"/>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
          </div>
          <div>
            <h2 class="banner-title">Capture an Unspoken Fragment</h2>
            <p class="banner-subtitle">Record a fleeting thought, an ambient soundscape, or an analog snapshot before the light changes.</p>
          </div>
          <div class="banner-quick-actions">
            <button class="btn btn-secondary" data-action="open-wizard" data-step="1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              <span>Tell Your Story</span>
            </button>
            <button class="btn btn-secondary" data-action="open-wizard" data-step="2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              <span>Add Photos (1-5)</span>
            </button>
            <button class="btn btn-secondary" data-action="open-wizard" data-step="3">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/>
                <polygon points="10 8 16 12 10 16 10 8"/>
              </svg>
              <span>Atmospheric Soundtrack</span>
            </button>
          </div>
        </section>

        <!-- Memory Archive Section & Advanced Controls -->
        <section class="archive-section" aria-labelledby="archive-heading">
          <div class="archive-header">
            <div class="archive-title-group">
              <h2 id="archive-heading">Chronicles & Folders</h2>
              <p>Curated repository of moments, analog frames, and voice memos</p>
            </div>

            <!-- Layout Mode Switcher & Date Sort Controls -->
            <div class="archive-view-toggles">
              <div class="layout-toggle-group" role="group" aria-label="Archive Layout Style">
                <button class="layout-toggle-btn ${state.archiveLayout === 'grid' ? 'active' : ''}" 
                        data-action="toggle-archive-layout" data-layout="grid" title="Editorial Cards View">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                    <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                  </svg>
                  <span>Cards</span>
                </button>
                <button class="layout-toggle-btn ${state.archiveLayout === 'folder-grid' ? 'active' : ''}" 
                        data-action="toggle-archive-layout" data-layout="folder-grid" title="Folder Grid View">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                  </svg>
                  <span>Folders</span>
                </button>
                <button class="layout-toggle-btn ${state.archiveLayout === 'timeline' ? 'active' : ''}" 
                        data-action="toggle-archive-layout" data-layout="timeline" title="Chronological Timeline View">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="2" x2="12" y2="22"/>
                    <circle cx="12" cy="6" r="3"/><circle cx="12" cy="18" r="3"/>
                  </svg>
                  <span>Timeline</span>
                </button>
              </div>

              <!-- Sort Order Toggle -->
              <button class="sort-toggle-btn" data-action="toggle-sort" title="Toggle Chronological Sort Order">
                <span>${state.sortBy === 'oldest' ? 'Date: Oldest ↑' : 'Date: Newest ↓'}</span>
              </button>
            </div>
          </div>

          <!-- Controls Bar: Search & Mood Filter Pills -->
          <div class="archive-controls-bar">
            <div class="archive-search-row">
              <div class="archive-search-wrapper">
                <svg class="search-icon-adornment" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input type="search" class="archive-search-input" 
                       placeholder="Search title, story prose, songs, or tags..." 
                       value="${state.searchQuery || ''}" 
                       data-action="search-archive-input" aria-label="Search memories" />
                ${state.searchQuery ? `
                  <button class="clear-search-btn" data-action="clear-search" aria-label="Clear search query">&times;</button>
                ` : ''}
              </div>

              <!-- Filter Pills -->
              <div class="filter-chips-list" role="tablist" aria-label="Filter memories by mood">
                <button class="filter-chip ${state.activeFilter === 'all' ? 'active' : ''}" 
                        data-action="filter-mood" data-filter="all" role="tab" aria-selected="${state.activeFilter === 'all'}">
                  <span>All (${state.memories.length})</span>
                </button>
                <button class="filter-chip ${state.activeFilter === 'happy-sunny' ? 'active' : ''}" 
                        data-action="filter-mood" data-filter="happy-sunny" role="tab" aria-selected="${state.activeFilter === 'happy-sunny'}">
                  <span style="width:6px; height:6px; border-radius:50%; background:#E87A3E"></span>
                  <span>Golden Hour</span>
                </button>
                <button class="filter-chip ${state.activeFilter === 'calm-peaceful' ? 'active' : ''}" 
                        data-action="filter-mood" data-filter="calm-peaceful" role="tab" aria-selected="${state.activeFilter === 'calm-peaceful'}">
                  <span style="width:6px; height:6px; border-radius:50%; background:#4A7C6F"></span>
                  <span>Sage Mist</span>
                </button>
                <button class="filter-chip ${state.activeFilter === 'nostalgic-emotional' ? 'active' : ''}" 
                        data-action="filter-mood" data-filter="nostalgic-emotional" role="tab" aria-selected="${state.activeFilter === 'nostalgic-emotional'}">
                  <span style="width:6px; height:6px; border-radius:50%; background:#8C5A5A"></span>
                  <span>Vintage Sepia</span>
                </button>
                <button class="filter-chip ${state.activeFilter === 'time-capsule' ? 'active' : ''}" 
                        data-action="filter-mood" data-filter="time-capsule" role="tab" aria-selected="${state.activeFilter === 'time-capsule'}">
                  <span>🔒 Time Capsules</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Dynamic Archive Content (Cards Grid vs Folder Grid vs Timeline vs Empty State) -->
          ${filteredMemories.length === 0 ? this._renderEmptyState(state) : this._renderArchiveLayout(filteredMemories, state)}
        </section>
      </main>

      <!-- Editorial Footer -->
      <footer class="site-footer" role="contentinfo">
        <div class="container footer-inner">
          <div>
            <strong>MEMORA</strong> — An Emotional AI Digital Chronicle.
            <span>Designed with Kinfolk aesthetics & Dieter Rams minimalism.</span>
          </div>
          <div style="display: flex; align-items: center; gap: var(--space-4);">
            <button class="btn-reset-demo" data-action="reset-demo-data" title="Re-seed 3 demo scenarios">
              ↻ Reset Demo Data
            </button>
            <span>Pure HTML5 · Modular CSS3 · Vanilla ES6+</span>
          </div>
        </div>
      </footer>
    `;
  }

  /**
   * Renders a single Memory Card in the Archive Grid
   */
  _renderMemoryCard(memory, state) {
    const isPlaying = state.isAudioPlaying && state.audioPlayingId === memory.id;
    const capsule = store.getTimeCapsule(memory.id);

    return `
      <article class="memory-card" data-mood="${memory.mood}" data-id="${memory.id}" data-action="view-full-memory" tabindex="0" role="button" aria-label="Open chronicle: ${memory.title}">
        <div class="card-photo-wrapper">
          <img class="card-photo" src="${memory.photoUrl}" alt="${memory.title}" loading="lazy" />
          <span class="card-mood-badge">${memory.moodLabel}</span>
          ${capsule && capsule.isSealed ? `
            <span class="card-mood-badge" style="left:auto; right:10px; background:rgba(28,27,25,0.85); color:#FAF8F5;">
              🔒 Sealed
            </span>
          ` : ''}
        </div>

        <div class="card-body">
          <div class="card-meta-row">
            <span>${memory.dateFormatted}</span>
            <span>${memory.location.split(',')[0]}</span>
          </div>

          <h3 class="card-title">${memory.title}</h3>
          <p class="card-excerpt">${memory.excerpt}</p>

          <div class="card-footer">
            <div class="card-tags">
              ${memory.tags.slice(0, 3).map(tag => `<span class="card-tag">#${tag}</span>`).join('')}
            </div>

            ${memory.hasAudio ? `
              <div class="card-has-audio" title="Audio voice note attached">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                </svg>
                <span>${memory.audioDuration}</span>
              </div>
            ` : ''}
          </div>
        </div>
      </article>
    `;
  }

  _renderArchiveLayout(filteredMemories, state) {
    if (state.archiveLayout === 'folder-grid') {
      return `
        <div class="folder-grid">
          ${filteredMemories.map(m => this._renderFolderCard(m, state)).join('')}
        </div>
      `;
    }

    if (state.archiveLayout === 'timeline') {
      return `
        <div class="timeline-view">
          ${filteredMemories.map(m => this._renderTimelineItem(m, state)).join('')}
        </div>
      `;
    }

    // Default: 'grid'
    return `
      <div class="memory-grid">
        ${filteredMemories.map(memory => this._renderMemoryCard(memory, state)).join('')}
      </div>
    `;
  }

  _renderFolderCard(memory, state) {
    const capsule = store.getTimeCapsule(memory.id);

    return `
      <article class="folder-card" data-mood="${memory.mood}" data-id="${memory.id}" data-action="view-full-memory" tabindex="0" role="button" aria-label="Open folder: ${memory.folder || memory.title}">
        <div class="folder-tab"></div>
        <div class="folder-accent-bar"></div>

        <div>
          <div class="folder-name-row">
            <span>${memory.folder || `📁 Nov 20 — ${memory.title}`}</span>
            ${capsule && capsule.isSealed ? `<span style="font-size:12px;" title="Time Capsule Sealed">🔒</span>` : ''}
          </div>

          <div class="folder-inner-sheet">
            <img class="folder-photo-peek" src="${memory.photoUrl}" alt="${memory.title}" loading="lazy" />
            <div class="folder-text-preview">
              <div class="folder-memory-title">${memory.title}</div>
              <div class="folder-memory-excerpt">${memory.excerpt}</div>
              <div style="font-size: var(--text-caption); color: var(--mood-accent); font-weight: 600; margin-top: 4px;">
                ${memory.moodLabel}
              </div>
            </div>
          </div>
        </div>

        <div class="folder-footer-meta">
          <span>${memory.dateFormatted.split(',')[1] || memory.dateFormatted}</span>
          <span>${memory.photos ? memory.photos.length : 1} Photo(s) · ${memory.hasAudio ? 'Soundtrack' : 'Journal'}</span>
        </div>
      </article>
    `;
  }

  _renderTimelineItem(memory, state) {
    const isPlaying = state.isAudioPlaying && state.audioPlayingId === memory.id;
    const capsule = store.getTimeCapsule(memory.id);

    return `
      <div class="timeline-item" data-mood="${memory.mood}">
        <span class="timeline-node-dot" aria-hidden="true"></span>
        <div class="timeline-date-label">${memory.dateFormatted} · ${memory.time}</div>

        <article class="memory-card" style="margin-top: 4px;" data-mood="${memory.mood}" data-id="${memory.id}" data-action="view-full-memory" tabindex="0" role="button" aria-label="Open chronicle: ${memory.title}">
          <div style="display: grid; grid-template-columns: 100px 1fr; gap: var(--space-4); padding: var(--space-3);">
            <div style="border-radius: var(--radius-sm); overflow: hidden; aspect-ratio: 1; height: 100%;">
              <img src="${memory.photoUrl}" alt="${memory.title}" style="width: 100%; height: 100%; object-fit: cover; filter: var(--mood-photo-filter);" />
            </div>

            <div style="display: flex; flex-direction: column; justify-content: space-between;">
              <div>
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
                  <span class="card-tag" style="margin:0;">${memory.moodLabel}</span>
                  ${capsule && capsule.isSealed ? `<span style="font-size: 11px;">🔒 Sealed</span>` : ''}
                </div>
                <h3 class="card-title" style="font-size: var(--text-body-lg); margin-bottom: 4px;">${memory.title}</h3>
                <p class="card-excerpt" style="font-size: var(--text-xs); margin: 0;">${memory.excerpt}</p>
              </div>

              <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 8px; font-size: var(--text-caption); color: var(--color-ink-400);">
                <span>${memory.location}</span>
                <span>${memory.folder || ''}</span>
              </div>
            </div>
          </div>
        </article>
      </div>
    `;
  }

  _renderEmptyState(state) {
    return `
      <div class="archive-empty-state" role="status">
        <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <h3 class="empty-state-title">No Chronicles Discovered</h3>
        <p class="empty-state-text">
          ${state.searchQuery ? `No entries found matching "<strong>${state.searchQuery}</strong>".` : 'No chronicles match the selected mood filter.'}
          Clear your filters to browse the complete archive.
        </p>
        <button class="btn btn-secondary" data-action="clear-all-filters" style="margin-top: var(--space-2);">
          <span>Reset Search & Filters</span>
        </button>
      </div>
    `;
  }

  /**
   * Renders the minimal Dieter Rams Audio Player Widget
   */
  _renderAudioWidget(memory, state) {
    const isPlaying = state.isAudioPlaying && state.audioPlayingId === memory.id;
    const previewUrl = memory.soundtrack?.previewUrl || '';

    return `
      <div class="audio-player-widget ${isPlaying ? 'is-playing' : ''}" role="region" aria-label="Voice Memo Player" data-duration="${memory.audioDuration || '02:40'}">
        <button class="audio-play-btn" data-action="toggle-audio" data-id="${memory.id}" data-preset="${memory.soundtrackPresetId || 'golden-afternoon'}" data-preview-url="${previewUrl}" aria-label="${isPlaying ? 'Pause' : 'Play'} soundtrack reflection">
          <svg class="audio-play-icon" viewBox="0 0 24 24">
            ${isPlaying ? `
              <rect x="6" y="4" width="4" height="16"/>
              <rect x="14" y="4" width="4" height="16"/>
            ` : `
              <polygon points="5 3 19 12 5 21 5 3"/>
            `}
          </svg>
        </button>

        <div class="audio-waveform-container">
          <div class="audio-info-row">
            <span>${memory.audioTitle || 'Atmospheric Soundscape'}</span>
            <span class="audio-status-label">${isPlaying ? (previewUrl ? 'Streaming 30s Preview' : 'Playing Ambient Synth') : (memory.audioDuration || '02:40')}</span>
          </div>

          <div class="audio-waveform-bars" aria-hidden="true">
            <div class="waveform-bar played" style="height: 35%"></div>
            <div class="waveform-bar played" style="height: 65%"></div>
            <div class="waveform-bar played" style="height: 80%"></div>
            <div class="waveform-bar" style="height: 45%"></div>
            <div class="waveform-bar" style="height: 90%"></div>
            <div class="waveform-bar" style="height: 60%"></div>
            <div class="waveform-bar" style="height: 75%"></div>
            <div class="waveform-bar" style="height: 40%"></div>
            <div class="waveform-bar" style="height: 55%"></div>
            <div class="waveform-bar" style="height: 30%"></div>
          </div>
        </div>
      </div>
    `;
  }

  /* ==========================================================================
     4-Step Editorial Wizard
     ========================================================================== */
  openWizardModal(step = 1) {
    store.updateWizardDraft({ step });
    const modalContainer = document.getElementById('modal-container');
    if (!modalContainer) return;

    modalContainer.innerHTML = `
      <div class="modal-backdrop is-open" role="dialog" aria-modal="true" aria-labelledby="wizard-step-title">
        <div class="wizard-modal animate-page-turn">
          <button class="modal-close-btn" data-action="close-modal" aria-label="Close wizard">&times;</button>

          <!-- Stepper Indicator -->
          <div class="wizard-stepper" role="navigation" aria-label="Wizard Steps">
            <div class="stepper-item ${step === 1 ? 'active' : (step > 1 ? 'completed' : '')}">
              <span class="stepper-num">${step > 1 ? '✓' : '1'}</span>
              <span>1. Story</span>
            </div>
            <div class="stepper-item ${step === 2 ? 'active' : (step > 2 ? 'completed' : '')}">
              <span class="stepper-num">${step > 2 ? '✓' : '2'}</span>
              <span>2. Moments</span>
            </div>
            <div class="stepper-item ${step === 3 ? 'active' : (step > 3 ? 'completed' : '')}">
              <span class="stepper-num">${step > 3 ? '✓' : '3'}</span>
              <span>3. Soundtrack</span>
            </div>
            <div class="stepper-item ${step === 4 ? 'active' : ''}">
              <span class="stepper-num">4</span>
              <span>4. Create</span>
            </div>
          </div>

          <!-- Wizard Step Content Container -->
          <div id="wizard-step-content">
            ${this._renderWizardStepContent(step)}
          </div>
        </div>
      </div>
    `;

    document.body.style.overflow = 'hidden';
  }

  _renderWizardStepContent(step) {
    const draft = store.getState().wizardDraft;

    switch (step) {
      case 1:
        return `
          <div class="wizard-step-header">
            <h2 id="wizard-step-title" class="wizard-step-title">How was your day?</h2>
            <p class="wizard-step-desc">Write without self-censorship. Let thoughts flow naturally across the page.</p>
          </div>

          <textarea id="wizard-story-input" class="editorial-textarea" 
                    placeholder="Describe the light, an unhurried conversation, the scent of woodsmoke, or a fleeting feeling..." 
                    autofocus>${draft.storyText}</textarea>

          <div class="step-footer-bar">
            <div class="live-sentiment-indicator" id="wizard-sentiment-badge">
              <span class="live-sentiment-dot"></span>
              <span id="wizard-sentiment-text">${draft.storyText.length > 10 ? 'Analyzing emotional resonance...' : 'Waiting for words...'}</span>
            </div>

            <button class="btn btn-primary" data-action="wizard-next" data-step="1">
              <span>Next: Capture Moments</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        `;

      case 2:
        return `
          <div class="wizard-step-header">
            <h2 id="wizard-step-title" class="wizard-step-title">Capture your moment</h2>
            <p class="wizard-step-desc">Add 1 to 5 photos. They are compressed client-side to preserve delicate analog textures.</p>
          </div>

          <!-- Drag and Drop Zone -->
          <div class="photo-drop-zone" id="photo-drop-zone">
            <input type="file" id="wizard-file-input" multiple accept="image/*" />
            <svg class="drop-zone-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            <p style="font-weight: 600; color: var(--color-ink-900); margin-bottom: 4px;">Drag & Drop 1 to 5 Photographs</p>
            <p style="font-size: var(--text-xs); color: var(--color-ink-500); margin: 0;">or click to browse your analog rolls (JPEG, PNG, HEIC)</p>
          </div>

          <!-- Filmstrip Contact Sheet Preview -->
          <div class="filmstrip-container">
            <div class="filmstrip-sprockets">
              ${Array.from({ length: 12 }).map(() => '<span class="sprocket-hole"></span>').join('')}
            </div>

            <div class="filmstrip-thumbnails" id="filmstrip-thumbnails">
              ${draft.photos.length === 0 ? `
                <div style="color: rgba(255,255,255,0.4); font-size: var(--text-xs); padding: 24px; text-align: center; width: 100%;">
                  No photos loaded yet. Drop photos above or pick a sample roll below.
                </div>
              ` : draft.photos.map((url, i) => `
                <div class="filmstrip-thumb-card" data-index="${i}">
                  <img src="${url}" alt="Moment ${i + 1}" />
                  <button class="remove-thumb-btn" data-action="remove-photo" data-index="${i}" aria-label="Remove photo">&times;</button>
                </div>
              `).join('')}
            </div>

            <div class="filmstrip-sprockets" style="margin-top: 10px; margin-bottom: 0;">
              ${Array.from({ length: 12 }).map(() => '<span class="sprocket-hole"></span>').join('')}
            </div>
          </div>

          <!-- Quick Analog Archive Presets for immediate testing -->
          <div class="preset-photos-picker">
            <span style="font-size: var(--text-xs); color: var(--color-ink-400);">Sample rolls:</span>
            ${CURATED_ANALOG_PRESETS.map((p, i) => `
              <button class="btn btn-secondary" style="padding: 4px 10px; font-size: var(--text-caption);" data-action="add-preset-photo" data-url="${p.url}">
                + ${p.caption}
              </button>
            `).join('')}
          </div>

          <div class="step-footer-bar">
            <button class="btn btn-secondary" data-action="wizard-prev" data-step="2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              <span>Back</span>
            </button>

            <button class="btn btn-primary" data-action="wizard-next" data-step="2">
              <span>Next: Choose Soundtrack</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        `;

      case 3:
        const selectedTrack = draft.soundtrack;
        return `
          <div class="wizard-step-header">
            <h2 id="wizard-step-title" class="wizard-step-title">Choose your soundtrack</h2>
            <p class="wizard-step-desc">Search any real song on iTunes for a 30-second audio preview, or choose a curated ambient synth preset.</p>
          </div>

          <!-- Real iTunes Search Input -->
          <div class="form-group" style="margin-bottom: var(--space-4);">
            <label for="itunes-music-search-input" class="form-label">Search iTunes Music Catalog</label>
            <div style="position: relative;">
              <input type="search" id="itunes-music-search-input" class="form-input" 
                     placeholder="Search any artist or song (e.g. Bon Iver, Norah Jones, Ludovico Einaudi, Coldplay)..." 
                     autocomplete="off" />
            </div>
            <!-- Live Search Results Container -->
            <div id="itunes-search-results" class="itunes-results-grid" style="margin-top: 8px;"></div>
          </div>

          <!-- Currently Selected Soundtrack Banner (if selected) -->
          ${selectedTrack ? `
            <div id="selected-soundtrack-banner" style="background-color: var(--color-paper-200); border: 1px solid var(--mood-accent); border-radius: var(--radius-md); padding: 10px 14px; margin-bottom: var(--space-4); display: flex; align-items: center; justify-content: space-between;">
              <div style="display: flex; align-items: center; gap: 10px; overflow: hidden;">
                ${selectedTrack.artwork ? `<img src="${selectedTrack.artwork}" style="width: 38px; height: 38px; border-radius: 4px; object-fit: cover;" alt="" />` : `
                  <div class="vinyl-disc" style="width: 32px; height: 32px;"></div>
                `}
                <div style="overflow: hidden;">
                  <div style="font-size: var(--text-sm); font-weight: 600; color: var(--color-ink-900); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    Selected: ${selectedTrack.title}
                  </div>
                  <div style="font-size: var(--text-caption); color: var(--color-ink-500); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    ${selectedTrack.artist}
                  </div>
                </div>
              </div>

              ${selectedTrack.previewUrl ? `
                <button type="button" class="btn btn-secondary" style="padding: 4px 10px; font-size: var(--text-caption);" data-action="preview-itunes-stream" data-stream-url="${selectedTrack.previewUrl}" data-song-id="${selectedTrack.id}">
                  ${audioEngine.isPlaying && audioEngine.currentPlayingId === selectedTrack.id ? '■ Stop' : '▶ Play Preview'}
                </button>
              ` : ''}
            </div>
          ` : ''}

          <p style="font-size: var(--text-xs); color: var(--color-ink-400); text-transform: uppercase; letter-spacing: var(--tracking-wide); margin-block: var(--space-3) var(--space-2);">
            Or Select an Atmospheric Web Audio Synth Preset
          </p>

          <!-- 4 Curated Atmospheric Presets -->
          <div class="soundtrack-presets-grid">
            ${SOUNDTRACK_PRESETS.map(preset => {
              const isSelected = selectedTrack?.id === preset.id;
              const isPlaying = audioEngine.isPlaying && audioEngine.currentPlayingId === preset.id;

              return `
                <div class="soundtrack-card ${isSelected ? 'selected' : ''} ${isPlaying ? 'is-playing' : ''}" 
                     data-action="select-soundtrack" data-id="${preset.id}">
                  <div class="soundtrack-header">
                    <div class="vinyl-disc">
                      <div style="width: 10px; height: 10px; border-radius: 50%; background: #FAF8F5;"></div>
                    </div>
                    <div>
                      <div class="soundtrack-meta-title">${preset.title}</div>
                      <div class="soundtrack-meta-artist">${preset.artist}</div>
                    </div>
                  </div>

                  <p class="soundtrack-card-desc">${preset.desc}</p>

                  <div style="display: flex; align-items: center; justify-content: space-between; margin-top: auto;">
                    <span class="card-tag" style="background: var(--color-paper-200);">${preset.tag}</span>
                    <button type="button" class="soundtrack-preview-btn" data-action="preview-soundtrack" data-id="${preset.id}">
                      ${isPlaying ? '■ Stop Synth' : '▶ Listen Preview'}
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          <!-- Custom Track Inputs (Accordion/Optional) -->
          <details style="margin-top: var(--space-4); font-size: var(--text-xs); color: var(--color-ink-500);">
            <summary style="cursor: pointer; padding-block: 4px; font-weight: 500;">Or manually type song title & artist...</summary>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); margin-top: var(--space-2);">
              <div class="form-group" style="margin-bottom:0;">
                <label for="custom-track-title" class="form-label">Song Title</label>
                <input type="text" id="custom-track-title" class="form-input" 
                       placeholder="e.g. Holocene" 
                       value="${draft.soundtrack?.title || ''}" />
              </div>
              <div class="form-group" style="margin-bottom:0;">
                <label for="custom-track-artist" class="form-label">Artist / Ensemble</label>
                <input type="text" id="custom-track-artist" class="form-input" 
                       placeholder="e.g. Bon Iver" 
                       value="${draft.soundtrack?.artist || ''}" />
              </div>
            </div>
          </details>

          <div class="step-footer-bar">
            <button class="btn btn-secondary" data-action="wizard-prev" data-step="3">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              <span>Back</span>
            </button>

            <button class="btn btn-primary" data-action="wizard-next" data-step="3">
              <span>Next: Review & Synthesize</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        `;

      case 4:
        return `
          <div class="wizard-step-header">
            <h2 id="wizard-step-title" class="wizard-step-title">Create my memory</h2>
            <p class="wizard-step-desc">Ready to synthesize emotional undertones, color harmonies, and compose your memory folder.</p>
          </div>

          <div class="review-summary-card">
            <div class="review-item-row">
              <span style="color: var(--color-ink-400);">Story Fragment:</span>
              <span style="font-weight: 500; max-width: 60%; text-align: right; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                "${draft.storyText.slice(0, 50)}..."
              </span>
            </div>
            <div class="review-item-row">
              <span style="color: var(--color-ink-400);">Analog Photographs:</span>
              <span style="font-weight: 500;">${draft.photos.length > 0 ? `${draft.photos.length} Photo(s) Attached` : '1 Default Studio Film Photo'}</span>
            </div>
            <div class="review-item-row">
              <span style="color: var(--color-ink-400);">Atmospheric Soundtrack:</span>
              <span style="font-weight: 500;">${draft.soundtrack ? `${draft.soundtrack.title} — ${draft.soundtrack.artist}` : 'Golden Afternoon (Ambient Acoustic)'}</span>
            </div>
          </div>

          <div style="text-align: center; margin-block: var(--space-8);">
            <button class="btn btn-create-memory" data-action="trigger-ai-synthesis">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
              </svg>
              <span>Synthesize & Create Memory</span>
            </button>
          </div>

          <div class="step-footer-bar">
            <button class="btn btn-secondary" data-action="wizard-prev" data-step="4">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              <span>Back</span>
            </button>
            <span style="font-size: var(--text-xs); color: var(--color-ink-400);">Step 4 of 4</span>
          </div>
        `;

      default:
        return '';
    }
  }

  /* ==========================================================================
     Theatrical AI Processing Screen
     ========================================================================== */
  async showTheatricalAIScreen(wizardData, onComplete) {
    audioEngine.stop();
    const modalContainer = document.getElementById('modal-container');
    if (!modalContainer) return;

    modalContainer.innerHTML = `
      <div class="theatrical-ai-overlay" role="alert" aria-live="polite">
        <div class="ai-aperture-container">
          <div class="ai-aperture-ring"></div>
          <div class="ai-aperture-core"></div>
        </div>

        <h2 class="ai-theatrical-title">Synthesizing Memory Atmosphere</h2>
        <p class="ai-theatrical-sub">Our emotional AI engine is composing your multi-modal chronicle...</p>

        <div class="ai-stages-list">
          <div class="ai-stage-item active" id="stage-1">
            <span class="ai-stage-dot"></span>
            <span>1. Reading emotional undertones in your story...</span>
          </div>
          <div class="ai-stage-item" id="stage-2">
            <span class="ai-stage-dot"></span>
            <span>2. Extracting color harmony & lighting from your photos...</span>
          </div>
          <div class="ai-stage-item" id="stage-3">
            <span class="ai-stage-dot"></span>
            <span>3. Matching tempo and mood with ${wizardData.soundtrack?.title || 'Golden Afternoon'}...</span>
          </div>
          <div class="ai-stage-item" id="stage-4">
            <span class="ai-stage-dot"></span>
            <span>4. Composing your memory atmosphere...</span>
          </div>
        </div>
      </div>
    `;

    // Start fetching from backend /api/analyze in parallel with theatrical animation
    const analysisPromise = (async () => {
      try {
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            story: wizardData.storyText,
            imageBase64: wizardData.photos?.[0] || null,
            songTitle: wizardData.soundtrack?.title || '',
            songArtist: wizardData.soundtrack?.artist || ''
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (data && data.title) {
            const moodLabels = {
              'happy-sunny': 'Golden Hour Warmth',
              'calm-peaceful': 'Sage Mist Silence',
              'nostalgic-emotional': 'Dusty Rose Sepia'
            };

            const defaultPaletteNames = ['Amber Glaze', 'Sunlit Linen', 'Terracotta Dust', 'Deep Charcoal'];
            const formattedPalette = Array.isArray(data.palette)
              ? data.palette.map((item, idx) => {
                  if (typeof item === 'string') {
                    return { hex: item, name: defaultPaletteNames[idx] || `Atmosphere Tone ${idx + 1}` };
                  }
                  return item;
                })
              : null;

            return {
              title: data.title,
              aiStory: data.aiStory,
              mood: data.mood,
              moodLabel: moodLabels[data.mood] || 'Calm & Contemplative',
              quote: `“${data.title}”—a moment captured in time.`,
              palette: formattedPalette,
              folder: data.folderName,
              resonance: {
                score: 95,
                tone: data.mood === 'happy-sunny' ? 'Radiant Joy' : (data.mood === 'nostalgic-emotional' ? 'Tender Bittersweet Longing' : 'Restorative Stillness'),
                summary: data.aiStory,
                prompt: 'What about this moment do you wish to carry forward?'
              }
            };
          }
        }
      } catch (err) {
        console.warn('[MEMORA UI] Backend analysis fetch error, using client engine:', err);
      }
      // Client-side fallback if backend request fails
      return AIEngine.analyze(wizardData);
    })();

    // Progressive stage progression simulation
    setTimeout(() => {
      document.getElementById('stage-1')?.classList.remove('active');
      document.getElementById('stage-1')?.classList.add('completed');
      document.getElementById('stage-2')?.classList.add('active');
    }, 600);

    setTimeout(() => {
      document.getElementById('stage-2')?.classList.remove('active');
      document.getElementById('stage-2')?.classList.add('completed');
      document.getElementById('stage-3')?.classList.add('active');
    }, 1200);

    setTimeout(() => {
      document.getElementById('stage-3')?.classList.remove('active');
      document.getElementById('stage-3')?.classList.add('completed');
      document.getElementById('stage-4')?.classList.add('active');
    }, 1800);

    const [_, aiResult] = await Promise.all([
      new Promise(resolve => setTimeout(resolve, 2400)),
      analysisPromise
    ]);

    const newMemory = store.addMemoryFromAI(aiResult, wizardData);

    // If soundtrack has an iTunes previewUrl, play the 30s preview stream!
    if (wizardData.soundtrack?.previewUrl) {
      audioEngine.playStream(wizardData.soundtrack.previewUrl, newMemory.id);
      store.setAudioState(newMemory.id, true);
    } else if (newMemory.soundtrackPresetId) {
      audioEngine.play(newMemory.soundtrackPresetId);
      store.setAudioState(newMemory.id, true);
    }

    this.closeModal();
    if (onComplete) onComplete(newMemory);
  }

  /* ==========================================================================
     Generated Memory View
     ========================================================================== */
  renderMemoryView(memoryId) {
    const memory = store.getState().memories.find(m => m.id === memoryId) || store.getActiveMemory();
    if (!memory) {
      store.setView('home');
      return;
    }

    const state = store.getState();
    const capsule = store.getTimeCapsule(memory.id);
    const appEl = document.getElementById('app');
    if (!appEl) return;

    appEl.innerHTML = `
      <div class="film-grain" aria-hidden="true"></div>

      <!-- Site Header -->
      <header class="site-header" role="banner">
        <div class="container header-inner">
          <div class="brand-group">
            <a href="#" class="brand-title" data-action="nav-home">MEMORA</a>
            <span class="brand-edition">VOL. IV · CHRONICLE VIEW</span>
          </div>

          <div class="header-actions">
            <button class="btn btn-secondary" data-action="nav-home">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              <span>Back to Journal</span>
            </button>

            <button class="btn btn-primary" data-action="open-wizard">
              <span>+ Record New</span>
            </button>
          </div>
        </div>
      </header>

      <!-- Main Memory Chronicle Article -->
      <main class="container memory-view-container" data-mood="${memory.mood}">
        <!-- Top Navigation / Folder / Actions Bar -->
        <div class="memory-view-topbar">
          <div style="display: flex; align-items: center; gap: var(--space-3); flex-wrap: wrap;">
            <span class="folder-badge-pill">${memory.folder || `📁 Nov 20 — ${memory.title}`}</span>
            <span class="photo-mood-pill" style="position: static;">${memory.moodLabel}</span>
          </div>

          <div style="display: flex; align-items: center; gap: var(--space-2);">
            <button class="btn btn-tactile" data-action="open-capsule" data-id="${memory.id}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <span>${capsule && capsule.isSealed ? '🔒 Time Capsule Locked' : 'Seal in Time Capsule'}</span>
            </button>

            <button class="btn btn-secondary" data-action="delete-memory" data-id="${memory.id}" title="Remove Chronicle">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Sealed Time Capsule Banner (if sealed) -->
        ${capsule && capsule.isSealed ? `
          <div class="time-capsule-sealed-banner">
            <div class="sealed-capsule-info">
              <div class="wax-seal-icon">🔒</div>
              <div>
                <strong>Sealed in Digital Time Capsule</strong>
                <p style="font-size: var(--text-xs); color: var(--color-ink-500); margin: 0;">
                  Set to unlock on ${capsule.unlockDateFormatted}
                </p>
              </div>
            </div>

            <button class="btn btn-secondary" data-action="simulate-time-travel" data-id="${memory.id}">
              <span>Demo: Simulate Time Travel</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        ` : ''}

        <!-- Side-by-Side Comparison if Time Capsule is opened/simulated -->
        ${capsule && (capsule.isSimulatedUnlock || !capsule.isSealed && capsule.reflection) ? this._renderComparisonSpread(memory, capsule) : ''}

        <!-- Memory Title & Metadata Header -->
        <header style="margin-bottom: var(--space-6);">
          <div class="story-location-date">
            <span>${memory.dateFormatted}</span>
            <span>•</span>
            <span>${memory.time}</span>
            <span>•</span>
            <span>${memory.location}</span>
          </div>

          <h1 class="edition-headline" style="font-size: var(--text-hero); margin-block: var(--space-3);">${memory.title}</h1>

          <!-- 4-Color Visual Palette Swatches -->
          ${memory.palette && memory.palette.length > 0 ? `
            <div class="palette-swatches-row" role="group" aria-label="Extracted Color Palette">
              <span style="font-size: var(--text-caption); text-transform: uppercase; letter-spacing: var(--tracking-wide); color: var(--color-ink-400);">Atmospheric Palette:</span>
              ${memory.palette.map(color => `
                <div class="palette-swatch-chip" title="${color.name} (${color.hex})">
                  <span class="swatch-color-circle" style="background-color: ${color.hex};"></span>
                  <span>${color.name}</span>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </header>

        <!-- Multi-photo Contact Sheet / Gallery -->
        <div class="memory-gallery-grid">
          ${(memory.photos && memory.photos.length > 0 ? memory.photos : [memory.photoUrl]).map((url, idx) => `
            <div class="gallery-photo-item">
              <img src="${url}" alt="Memory photo ${idx + 1}" loading="lazy" />
            </div>
          `).join('')}
        </div>

        <!-- Dieter Rams Minimal Audio Player Widget -->
        ${memory.hasAudio ? this._renderAudioWidget(memory, state) : ''}

        <!-- Editorial Pull Quote -->
        <div class="story-quote-block" style="margin-block: var(--space-8);">
          <p class="story-quote-text" style="font-size: var(--text-h3);">“${memory.quote}”</p>
        </div>

        <!-- Story Content Spread -->
        <div style="display: grid; grid-template-columns: 1fr; gap: var(--space-8); margin-block: var(--space-8);">
          <!-- Original Story Prose -->
          <div>
            <h3 style="font-family: var(--font-sans); font-size: var(--text-xs); text-transform: uppercase; letter-spacing: var(--tracking-widest); color: var(--color-ink-400); margin-bottom: var(--space-3);">
              Original Journal Entry
            </h3>
            <div style="font-size: var(--text-body-lg); line-height: var(--leading-loose); color: var(--mood-ink); white-space: pre-line;">
              ${memory.fullContent}
            </div>
          </div>

          <!-- AI Editorial Story Synthesis -->
          <div style="background-color: var(--mood-surface-secondary); padding: var(--space-6); border-radius: var(--radius-md); border: 1px solid var(--border-color-hairline);">
            <h3 style="font-family: var(--font-sans); font-size: var(--text-xs); text-transform: uppercase; letter-spacing: var(--tracking-widest); color: var(--mood-accent); margin-bottom: var(--space-3);">
              AI Emotional Synthesis & Atmosphere
            </h3>
            <p style="font-size: var(--text-body); line-height: var(--leading-editorial); color: var(--mood-ink); margin-bottom: var(--space-4);">
              ${memory.aiStory || memory.aiResonance.summary}
            </p>
            <div style="padding-top: var(--space-4); border-top: 1px dashed var(--border-color-subtle); font-style: italic; font-size: var(--text-sm); color: var(--mood-secondary);">
              <strong>Journal Prompt:</strong> ${memory.aiResonance.prompt}
            </div>
          </div>
        </div>
      </main>

      <!-- Footer -->
      <footer class="site-footer" role="contentinfo">
        <div class="container footer-inner">
          <div><strong>MEMORA</strong> — An Emotional AI Digital Chronicle.</div>
          <div>Pure HTML5 · Modular CSS3 · Vanilla ES6+</div>
        </div>
      </footer>
    `;
  }

  /**
   * Renders Side-by-Side Comparison View ("Then vs. Today")
   */
  _renderComparisonSpread(memory, capsule) {
    const existingReflection = capsule.reflection;

    return `
      <section class="comparison-spread" aria-labelledby="comparison-title">
        <div class="comparison-column">
          <span class="comparison-header-badge">THEN · ${memory.dateFormatted}</span>
          <h3 style="font-family: var(--font-serif); font-size: var(--text-h2);">${memory.title}</h3>
          
          <div style="border-radius: var(--radius-sm); overflow: hidden; max-height: 200px;">
            <img src="${memory.photoUrl}" alt="${memory.title}" style="width: 100%; height: 100%; object-fit: cover; filter: var(--mood-photo-filter);" />
          </div>

          <p style="font-size: var(--text-sm); line-height: var(--leading-editorial); color: var(--color-ink-700); font-style: italic;">
            "${memory.excerpt}"
          </p>
          <div class="card-tag" style="align-self: flex-start;">Original Mood: ${memory.moodLabel}</div>
        </div>

        <div class="comparison-column">
          <span class="comparison-header-badge" style="color: #4A7C6F;">TODAY · PRESENCE & EVOLUTION</span>
          <h3 id="comparison-title" style="font-family: var(--font-serif); font-size: var(--text-h2);">How has your perspective evolved?</h3>

          ${existingReflection ? `
            <div style="background-color: var(--color-paper-50); border: 1px solid var(--border-color-hairline); border-radius: var(--radius-md); padding: var(--space-4);">
              <p style="font-size: var(--text-sm); color: var(--mood-ink); line-height: var(--leading-editorial); margin-bottom: var(--space-2);">
                ${existingReflection.text}
              </p>
              <div style="font-size: var(--text-caption); color: var(--color-ink-400);">
                Saved on ${existingReflection.savedAtFormatted}
              </div>
            </div>
          ` : `
            <form id="comparison-reflection-form" data-id="${memory.id}">
              <textarea id="comparison-reflection-text" class="form-textarea" 
                        placeholder="Looking back from today, what has changed? What wisdom or gratitude did this experience give you?" 
                        style="min-height: 120px;" required></textarea>
              <div style="display: flex; justify-content: flex-end; margin-top: var(--space-3);">
                <button type="submit" class="btn btn-primary">
                  <span>Save Reflection</span>
                </button>
              </div>
            </form>
          `}
        </div>
      </section>
    `;
  }

  /**
   * Time Capsule Modal
   */
  openTimeCapsuleModal(memoryId) {
    const memory = store.getState().memories.find(m => m.id === memoryId);
    if (!memory) return;

    const modalContainer = document.getElementById('modal-container');
    if (!modalContainer) return;

    modalContainer.innerHTML = `
      <div class="modal-backdrop is-open" role="dialog" aria-modal="true" aria-labelledby="capsule-modal-title">
        <div class="editorial-modal-content">
          <button class="modal-close-btn" data-action="close-modal" aria-label="Close modal">&times;</button>

          <div class="date-stamp">Digital Preservation</div>
          <h2 id="capsule-modal-title" class="story-title" style="margin-block: var(--space-2)">Seal in Time Capsule</h2>
          <p style="font-size: var(--text-sm); color: var(--color-ink-500); margin-bottom: var(--space-5);">
            Choose when this memory will unlock. Until then, its contents remain sealed from casual reading.
          </p>

          <div style="display: flex; flex-direction: column; gap: var(--space-3); margin-bottom: var(--space-6);">
            <button class="btn btn-secondary" data-action="seal-capsule" data-id="${memory.id}" data-months="1">
              <span>In 1 Month (Winter Solstice)</span>
            </button>
            <button class="btn btn-secondary" data-action="seal-capsule" data-id="${memory.id}" data-months="6">
              <span>In 6 Months (Spring Equinox)</span>
            </button>
            <button class="btn btn-secondary" data-action="seal-capsule" data-id="${memory.id}" data-months="12">
              <span>In 1 Year (Next November)</span>
            </button>
          </div>

          <div style="padding-top: var(--space-4); border-top: 1px dashed var(--border-color-subtle); display: flex; align-items: center; justify-content: space-between;">
            <span style="font-size: var(--text-xs); color: var(--color-ink-500);">Interactive Product Demonstration:</span>
            <button class="btn btn-tactile" data-action="simulate-time-travel" data-id="${memory.id}">
              <span>Demo: Simulate Time Travel</span>
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.style.overflow = 'hidden';
  }

  closeModal() {
    audioEngine.stop();
    const modalContainer = document.getElementById('modal-container');
    if (modalContainer) {
      modalContainer.innerHTML = '';
    }
    document.body.style.overflow = '';
  }
}

export const ui = new UIEngine();
