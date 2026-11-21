/**
 * MEMORA — UI Controller & DOM Rendering Engine
 * Implements pure semantic HTML generation, Same-Document View Transitions,
 * 4-Step Editorial Wizard, Theatrical AI Processing, Memory View,
 * and Time Capsule Side-by-Side Comparison.
 */

import { store, FIGURINE_AVATARS } from './store.js';
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
   * Gracefully handles concurrent/interrupted transitions without unhandled promise rejections
   */
  transition(callback, focusTargetSelector = 'h1') {
    if (!document.startViewTransition) {
      callback();
      const target = document.querySelector(focusTargetSelector);
      if (target) {
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      }
      return;
    }

    // If a View Transition is already animating, perform DOM update directly to prevent collisions
    if (this._activeTransition) {
      try {
        callback();
        const target = document.querySelector(focusTargetSelector);
        if (target) {
          target.setAttribute('tabindex', '-1');
          target.focus({ preventScroll: true });
        }
      } catch (e) {
        // Ignored
      }
      return;
    }

    try {
      const vt = document.startViewTransition(() => {
        callback();
      });

      this._activeTransition = vt;

      // Handle all rejection states to prevent unhandled AbortError in browser console
      if (vt.ready) {
        vt.ready.catch(() => {});
      }
      if (vt.updateCallbackDone) {
        vt.updateCallbackDone.catch(() => {});
      }

      vt.finished
        .then(() => {
          const target = document.querySelector(focusTargetSelector);
          if (target) {
            target.setAttribute('tabindex', '-1');
            target.focus({ preventScroll: true });
          }
        })
        .catch(() => {
          // Gracefully swallow AbortError if transition was skipped by rapid navigation
        })
        .finally(() => {
          if (this._activeTransition === vt) {
            this._activeTransition = null;
          }
        });
    } catch (err) {
      this._activeTransition = null;
      callback();
    }
  }

  /**
   * Main App View Dispatcher
   */
  render() {
    const state = store.getState();
    const userProfile = state.userProfile || { name: 'Alika', hasCompletedIntro: false };

    // 1. If intro not completed, display full-screen Intro / Onboarding (Screenshot 1)
    if (!userProfile.hasCompletedIntro) {
      this.renderIntroScreen(userProfile);
      return;
    }

    // 2. Memory Detail View
    if (state.activeView === 'memory-view' && state.activeMemoryId) {
      this.renderMemoryView(state.activeMemoryId);
      return;
    }

    // 3. Tab Navigation (Screenshot 2 Spec: Home, Archive, Capsule, Profile)
    switch (state.activeTab) {
      case 'archive':
        this.renderArchiveScreen(state);
        break;
      case 'capsule':
        this.renderTimeCapsuleScreen(state);
        break;
      case 'profile':
        this.renderProfileScreen(state);
        break;
      case 'home':
      default:
        this.renderHomeScreen(state);
        break;
    }
  }

  /**
   * Desktop Navigation Header Bar (Displayed on Laptop/Desktop Screens >= 768px)
   */
  _renderDesktopHeader(activeTab, userProfile) {
    const avatar = userProfile?.avatarUrl || 'assets/avatars/avatar_blossom.svg';
    const name = userProfile?.name || 'Alika';

    return `
      <header class="desktop-header-bar" role="banner">
        <div class="desktop-brand-group">
          <div class="desktop-brand-title" data-action="nav-tab" data-tab="home" title="Memora Sanctuary">
            <span>MEMORA</span>
            <span style="font-size: 16px; color: #C9827B;">✦</span>
          </div>
          <div class="desktop-brand-subtitle">a garden of your memories</div>
        </div>

        <nav class="desktop-nav-pills" role="navigation" aria-label="Desktop Navigation">
          <button class="desktop-nav-pill-btn ${activeTab === 'home' ? 'active' : ''}" data-action="nav-tab" data-tab="home">
            <span>🏠</span>
            <span>Home</span>
          </button>
          <button class="desktop-nav-pill-btn ${activeTab === 'archive' ? 'active' : ''}" data-action="nav-tab" data-tab="archive">
            <span>📖</span>
            <span>Archive</span>
          </button>
          <button class="desktop-nav-pill-btn ${activeTab === 'capsule' ? 'active' : ''}" data-action="nav-tab" data-tab="capsule">
            <span>⏳</span>
            <span>Time Capsule</span>
          </button>
          <button class="desktop-nav-pill-btn ${activeTab === 'profile' ? 'active' : ''}" data-action="nav-tab" data-tab="profile">
            <span>👤</span>
            <span>Profile</span>
          </button>
        </nav>

        <div style="display: flex; align-items: center; gap: 12px; flex-shrink: 0;">
          <button class="badge-chip" data-action="open-wizard" style="background: rgba(255,255,255,0.85); font-weight: 600; padding: 8px 18px; white-space: nowrap;">
            <span style="font-size: 16px; line-height: 1;">+</span>
            <span>New Memory</span>
          </button>
          <div class="desktop-user-pill" data-action="nav-tab" data-tab="profile" title="View Profile & Stats">
            <img class="desktop-user-avatar" src="${avatar}" alt="${name}" />
            <span class="desktop-user-name">${name}</span>
          </div>
        </div>
      </header>
    `;
  }

  /**
   * Render Animated Intro Splash Screen (Screenshot 1 Spec)
   * Step 1: Atmospheric cinematic intro with drifting petals, shimmering title & arrow button
   * Step 2: Clicking arrow reveals the sleek frosted glass onboarding modal to enter name & figurine avatar
   */
  renderIntroScreen(userProfile) {
    const appEl = document.getElementById('app');
    if (!appEl) return;

    const currentAvatar = userProfile?.avatarUrl || 'assets/avatars/avatar_blossom.svg';

    // 16 Ambient falling cherry blossom petals
    const petalsHtml = Array.from({ length: 16 }).map((_, i) => {
      const left = ((i * 6.3 + (i % 3) * 3) % 94 + 3).toFixed(1);
      const delay = (i * 0.4).toFixed(2);
      const duration = (6.5 + (i % 5) * 1.4).toFixed(1);
      const size = 14 + (i % 4) * 6;
      const opacity = (0.55 + (i % 4) * 0.1).toFixed(2);
      return `<div class="drifting-petal" style="left: ${left}%; width: ${size}px; height: ${size * 1.3}px; animation-delay: ${delay}s; animation-duration: ${duration}s; opacity: ${opacity};"></div>`;
    }).join('');

    appEl.innerHTML = `
      <div class="intro-screen-overlay" role="dialog" aria-modal="true" aria-label="Welcome to Memora">
        <!-- 1. Ambient Drifting Blossom Petals -->
        <div class="intro-drifting-petals">
          ${petalsHtml}
        </div>

        <div></div>

        <!-- 2. Pure Minimal Intro Center Content (Screenshot 1 Exact Vibe) -->
        <div class="intro-center-content animate-fade-in" style="z-index: 2;">
          <div class="intro-sparkle">✦</div>
          <h1 class="intro-brand-title shimmer-text">MEMORA</h1>
          <div class="intro-subtitle">a garden of your memories</div>

          <button class="intro-enter-circle-btn" data-action="open-intro-modal" aria-label="Enter garden" title="Step into your Garden">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </div>

        <div style="font-size: 11px; color: #7A6662; opacity: 0.85; letter-spacing: 0.04em; z-index: 2; margin-bottom: 20px;">
          Tap the arrow to step into your sanctuary
        </div>

        <!-- 3. Elegant Frosted Glass Onboarding Modal (pops up on arrow click) -->
        <div id="intro-onboarding-modal-backdrop" class="intro-modal-backdrop" style="display: none;">
          <div class="intro-onboarding-modal" role="dialog" aria-labelledby="intro-modal-title">
            <div class="intro-modal-sparkle">🌸</div>
            <h2 id="intro-modal-title" class="intro-modal-title">Welcome to Memora</h2>
            <p class="intro-modal-sub">Create your sanctuary presence</p>

            <div class="intro-modal-field">
              <label for="intro-user-name" class="intro-name-label">What should we call you?</label>
              <input type="text" id="intro-user-name" class="intro-name-input" 
                     placeholder="e.g. Grisha" 
                     value="${userProfile.name !== 'Alika' ? userProfile.name : ''}" 
                     autocomplete="name" maxlength="32" />
            </div>

            <div class="intro-figurine-heading">Choose your garden figurine</div>
            <div class="intro-figurine-row">
              ${FIGURINE_AVATARS.map(f => `
                <button class="figurine-select-btn ${f.url === currentAvatar ? 'selected' : ''}" 
                        data-action="pick-intro-avatar" 
                        data-url="${f.url}" 
                        data-name="${f.name}" 
                        title="${f.name} — ${f.meaning}">
                  <img src="${f.url}" alt="${f.name}" class="figurine-select-img" />
                  <span class="figurine-select-label">${f.tag}</span>
                </button>
              `).join('')}
            </div>

            <button class="intro-confirm-btn" data-action="submit-intro">
              <span>Step into your Garden</span>
              <span>🌸</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render Home Screen (Screenshot 2 Spec - 2-Column Kinfolk Editorial on Desktop)
   */
  renderHomeScreen(state) {
    const appEl = document.getElementById('app');
    if (!appEl) return;

    const hero = store.getHeroMemory();
    const userProfile = state.userProfile || { name: 'Alika', avatarUrl: 'assets/avatars/avatar_blossom.svg' };
    const hour = new Date().getHours();
    const salutation = hour < 12 ? 'Good morning' : (hour < 18 ? 'Good afternoon' : 'Good evening');
    
    // Format date e.g. "Nov 21, Sat"
    const todayFormatted = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      weekday: 'short'
    }).format(new Date());

    const isPlaying = state.isAudioPlaying && state.audioPlayingId === hero.id;

    let moodFriendly = 'Happy & Calm';
    if (state.currentMood === 'happy-sunny') moodFriendly = 'Happy & Radiant';
    else if (state.currentMood === 'calm-peaceful') moodFriendly = 'Sage & Grounded';
    else if (state.currentMood === 'nostalgic-emotional') moodFriendly = 'Tender & Nostalgic';

    appEl.innerHTML = `
      <div class="garden-app-shell animate-fade-in">
        <!-- Desktop Header Bar (Laptops & Desktops) -->
        ${this._renderDesktopHeader('home', userProfile)}

        <!-- Mobile Top Greeting Pill (< 768px) -->
        <div class="glass-greeting-pill mobile-only-greeting">
          <div class="greeting-left">
            <span class="greeting-salutation">${salutation},</span>
            <span class="greeting-name">${userProfile.name} ♡</span>
          </div>
          <img class="greeting-avatar" src="${userProfile.avatarUrl}" alt="${userProfile.name}" data-action="nav-tab" data-tab="profile" title="View Profile & Stats" />
        </div>

        <!-- 2-Column Editorial Grid on Desktop, 1-Column on Mobile -->
        <div class="home-desktop-grid">
          <!-- Left Column: Featured Memory + Create Memory CTA -->
          <div class="home-col-left">
            <div class="glass-todays-memory-card" data-action="view-full-memory" data-id="${hero.id}">
              <div class="todays-memory-header">
                <span class="todays-label">Today's Memory</span>
                <span class="todays-date">${todayFormatted}</span>
              </div>
              <div class="todays-photo-box" style="height: 310px;">
                <img class="todays-photo" src="${hero.photoUrl}" alt="${hero.title}" />
                <div class="todays-photo-overlay">
                  <div class="todays-meta-left">
                    <div class="todays-title">${hero.title}</div>
                    <div class="todays-excerpt">${hero.excerpt}</div>
                  </div>
                  <button class="todays-play-circle ${isPlaying ? 'is-playing' : ''}" data-action="toggle-audio" data-id="${hero.id}" data-preset="${hero.soundtrackPresetId || 'golden-afternoon'}" data-preview-url="${hero.soundtrack?.previewUrl || ''}" aria-label="${isPlaying ? 'Pause' : 'Play'} memory soundtrack">
                    <svg class="audio-play-icon" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                      ${isPlaying ? '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>' : '<polygon points="6 4 20 12 6 20 6 4"/>'}
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <!-- Create New Memory Pill Button -->
            <button class="glass-create-btn" data-action="open-wizard">
              <span class="plus-icon">+</span>
              <span>Create New Memory</span>
            </button>
          </div>

          <!-- Right Column: Mood of the Day + Recent Chronicles in Garden -->
          <div class="home-col-right">
            <!-- Mood of the Day Card -->
            <div class="glass-mood-card" data-action="nav-tab" data-tab="archive">
              <img class="mood-tulip-art" src="assets/holographic_flower.svg" alt="Holographic flower" />
              <div class="mood-card-info">
                <div class="mood-card-title">Mood of the Day</div>
                <div class="mood-card-sub">${moodFriendly}</div>
              </div>
            </div>

            <!-- Recent Chronicles in Your Garden -->
            <div style="margin-top: 24px; padding-bottom: 20px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; padding: 0 4px;">
                <span style="font-size: 14px; font-weight: 600; color: #3D2E2B; letter-spacing: -0.01em;">Recent in Your Garden</span>
                <button class="btn-link" data-action="nav-tab" data-tab="archive" style="font-size: 12px; color: #C9827B; font-weight: 600; background: none; border: none; cursor: pointer;">View All →</button>
              </div>
              <div style="display: flex; flex-direction: column; gap: 12px;">
                ${state.memories.slice(1, 4).map(m => `
                  <div class="glass-mood-card" style="margin-top: 0; padding: 12px 16px; gap: 14px;" data-action="view-full-memory" data-id="${m.id}">
                    <img src="${m.photoUrl}" style="width: 52px; height: 52px; border-radius: 14px; object-fit: cover;" alt="${m.title}" />
                    <div style="overflow: hidden; flex: 1;">
                      <div style="font-family: 'Playfair Display', Georgia, serif; font-size: 15px; font-weight: 600; color: #3D2E2B; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${m.title}</div>
                      <div style="font-size: 11.5px; color: #7A6662; margin-top: 2px;">${m.dateFormatted} · ${m.moodLabel}</div>
                    </div>
                    ${m.hasAudio ? `
                      <button class="todays-play-circle ${state.isAudioPlaying && state.audioPlayingId === m.id ? 'is-playing' : ''}" style="width: 36px; height: 36px; margin-left: auto;" data-action="toggle-audio" data-id="${m.id}" data-preset="${m.soundtrackPresetId || 'golden-afternoon'}" data-preview-url="${m.soundtrack?.previewUrl || ''}">
                        <svg class="audio-play-icon" viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
                          ${state.isAudioPlaying && state.audioPlayingId === m.id ? '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>' : '<polygon points="6 4 20 12 6 20 6 4"/>'}
                        </svg>
                      </button>
                    ` : ''}
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>

        ${this._renderBottomNav('home')}
      </div>
    `;
  }

  /**
   * Render Archive Screen with Frosted Glass Badges and Multi-column Desktop Grid
   */
  renderArchiveScreen(state) {
    const appEl = document.getElementById('app');
    if (!appEl) return;

    const filtered = store.getFilteredMemories();
    const userProfile = state.userProfile || { name: 'Alika', avatarUrl: 'assets/avatars/avatar_blossom.svg' };

    appEl.innerHTML = `
      <div class="garden-app-shell animate-fade-in">
        <!-- Desktop Header Bar -->
        ${this._renderDesktopHeader('archive', userProfile)}

        <!-- Mobile Top Greeting Pill -->
        <div class="glass-greeting-pill mobile-only-greeting" style="margin-bottom: 16px;">
          <div class="greeting-left">
            <span class="greeting-salutation">Memory Vault</span>
            <span class="greeting-name">Garden Archive 🌸</span>
          </div>
          <button class="badge-chip" data-action="open-wizard" style="padding: 6px 14px; font-size: 12px;">+ Add</button>
        </div>

        <!-- Search input -->
        <div style="position: relative; margin-bottom: 14px;">
          <input type="search" class="intro-name-input archive-search-input" 
                 placeholder="Search memories, locations, thoughts..." 
                 value="${state.searchQuery || ''}" 
                 data-action="archive-search" style="text-align: left; padding-left: 20px; font-size: 14px;" />
        </div>

        <!-- Frosted Glass Filter Pills (Fixes Screenshot 1 unstyled buttons) -->
        <div class="archive-filters-row scroll-pills">
          <button class="badge-chip ${state.activeFilter === 'all' ? 'active' : ''}" data-action="filter-mood" data-filter="all">All</button>
          <button class="badge-chip ${state.activeFilter === 'happy-sunny' ? 'active' : ''}" data-action="filter-mood" data-filter="happy-sunny">☀️ Radiant</button>
          <button class="badge-chip ${state.activeFilter === 'calm-peaceful' ? 'active' : ''}" data-action="filter-mood" data-filter="calm-peaceful">🌿 Calm</button>
          <button class="badge-chip ${state.activeFilter === 'nostalgic-emotional' ? 'active' : ''}" data-action="filter-mood" data-filter="nostalgic-emotional">🍂 Sepia</button>
        </div>

        <!-- Multi-Column Cards Grid: 1 Col on Mobile, 2 on Tablet, 3 on Laptop/Desktop -->
        ${filtered.length === 0 ? `
          <div class="profile-card-glass" style="padding: 40px 20px;">
            <p style="color: #7A6662; font-size: 14px;">No memories found in this garden corner.</p>
          </div>
        ` : `
          <div class="archive-cards-grid">
            ${filtered.map(m => `
              <div class="glass-todays-memory-card" style="margin-top: 0; padding: 14px;" data-action="view-full-memory" data-id="${m.id}">
                <div class="todays-memory-header" style="margin-bottom: 10px;">
                  <span class="todays-label">${m.title}</span>
                  <span class="todays-date">${m.dateFormatted}</span>
                </div>
                <div class="todays-photo-box" style="height: 200px;">
                  <img class="todays-photo" src="${m.photoUrl}" alt="${m.title}" loading="lazy" />
                  <div class="todays-photo-overlay">
                    <div class="todays-meta-left" style="max-width: 75%;">
                      <div class="todays-excerpt" style="font-size: 12px;">${m.excerpt}</div>
                    </div>
                    ${m.hasAudio ? `
                      <button class="todays-play-circle ${state.isAudioPlaying && state.audioPlayingId === m.id ? 'is-playing' : ''}" style="width: 38px; height: 38px;" data-action="toggle-audio" data-id="${m.id}" data-preset="${m.soundtrackPresetId || 'golden-afternoon'}" data-preview-url="${m.soundtrack?.previewUrl || ''}">
                        <svg class="audio-play-icon" viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                          ${state.isAudioPlaying && state.audioPlayingId === m.id ? '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>' : '<polygon points="6 4 20 12 6 20 6 4"/>'}
                        </svg>
                      </button>
                    ` : ''}
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        `}

        ${this._renderBottomNav('archive')}
      </div>
    `;
  }

  /**
   * Render Time Capsule Screen with Glassmorphism
   */
  renderTimeCapsuleScreen(state) {
    const appEl = document.getElementById('app');
    if (!appEl) return;

    const capsules = Object.entries(state.timeCapsules || {});
    const userProfile = state.userProfile || { name: 'Alika', avatarUrl: 'assets/avatars/avatar_blossom.svg' };

    appEl.innerHTML = `
      <div class="garden-app-shell animate-fade-in">
        <!-- Desktop Header Bar -->
        ${this._renderDesktopHeader('capsule', userProfile)}

        <!-- Mobile Top Greeting Pill -->
        <div class="glass-greeting-pill mobile-only-greeting" style="margin-bottom: 16px;">
          <div class="greeting-left">
            <span class="greeting-salutation">Digital Vault</span>
            <span class="greeting-name">Time Capsules 🔒</span>
          </div>
        </div>

        <div class="glass-mood-card" style="margin-top: 0; margin-bottom: 20px;">
          <div style="font-size: 32px;">🕰️</div>
          <div>
            <div class="mood-card-title">Letters to the Future</div>
            <div class="mood-card-sub">Seal memories with reflection prompts to unlock in 1, 3, or 12 months.</div>
          </div>
        </div>

        <div class="archive-cards-grid">
          ${capsules.length === 0 ? `
            <div class="profile-card-glass" style="grid-column: 1 / -1;">
              <p style="color: #7A6662; font-size: 14px;">No sealed capsules yet. Open any memory and tap "Seal in Time Capsule" to create one.</p>
            </div>
          ` : capsules.map(([memId, cap]) => {
            const mem = state.memories.find(m => m.id === memId);
            if (!mem) return '';
            return `
              <div class="glass-mood-card" style="margin-top: 0; padding: 16px; flex-direction: column; align-items: flex-start; gap: 10px;">
                <div style="display: flex; justify-content: space-between; width: 100%; align-items: center;">
                  <span style="font-family: 'Playfair Display', Georgia, serif; font-weight: 600; font-size: 16px; color: #3D2E2B;">${mem.title}</span>
                  <span style="font-size: 11px; padding: 3px 10px; border-radius: 9999px; background: rgba(201,130,123,0.18); color: #C9827B; font-weight: 600;">
                    ${cap.isSealed ? '🔒 Locked' : '🔓 Unlocked'}
                  </span>
                </div>
                <div style="font-size: 12px; color: #7A6662;">
                  Unlocks: ${cap.unlockDateFormatted || 'Simulated Future'}
                </div>
                <div style="display: flex; gap: 8px; margin-top: 6px; width: 100%;">
                  <button class="badge-chip" style="flex: 1; padding: 8px 12px; font-size: 12px; justify-content: center;" data-action="simulate-time-travel" data-id="${memId}">
                    Simulate Time Travel 🚀
                  </button>
                  <button class="badge-chip" style="padding: 8px 14px; font-size: 12px; background: #3D2E2B; color: #FFF;" data-action="view-full-memory" data-id="${memId}">
                    View
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        ${this._renderBottomNav('capsule')}
      </div>
    `;
  }

  /**
   * Render Profile Screen with Figurine Avatar Companion Selector and Statistics Dashboard
   */
  renderProfileScreen(state) {
    const appEl = document.getElementById('app');
    if (!appEl) return;

    const profile = state.userProfile || { name: 'Alika', avatarUrl: 'assets/avatars/avatar_blossom.svg' };
    const stats = store.getGardenStats();
    const currentAvatar = profile.avatarUrl || 'assets/avatars/avatar_blossom.svg';

    appEl.innerHTML = `
      <div class="garden-app-shell animate-fade-in">
        <!-- Desktop Header Bar -->
        ${this._renderDesktopHeader('profile', profile)}

        <!-- Mobile Top Greeting Pill -->
        <div class="glass-greeting-pill mobile-only-greeting" style="margin-bottom: 16px;">
          <div class="greeting-left">
            <span class="greeting-salutation">Sanctuary Profile</span>
            <span class="greeting-name">${profile.name} 👤</span>
          </div>
        </div>

        <!-- 2-Column Dashboard on Desktop -->
        <div class="profile-desktop-grid">
          <!-- Left Column: User Profile Card & Quick Actions -->
          <div style="display: flex; flex-direction: column;">
            <div class="profile-card-glass">
              <img class="profile-avatar-large" src="${profile.avatarUrl}" alt="${profile.name}" />
              <h2 class="profile-user-name">${profile.name}</h2>
              <span class="profile-badge">🌸 Master Gardener</span>
              <div style="font-size: 12px; color: #7A6662; margin-bottom: 16px;">Member since ${profile.joinedDate || 'November 2026'}</div>

              <!-- Edit Name Input -->
              <div style="display: flex; justify-content: center; gap: 8px; margin-bottom: 8px;">
                <input type="text" id="edit-profile-name-input" class="intro-name-input" 
                       value="${profile.name}" style="max-width: 170px; padding: 7px 14px; font-size: 13.5px;" placeholder="Your name..." />
                <button class="badge-chip" data-action="save-profile-name" style="padding: 7px 16px; font-size: 12px; background: #3D2E2B; color: #FFF;">Save</button>
              </div>
            </div>

            <!-- Quick Actions Column -->
            <div class="profile-actions-column">
              <button class="badge-chip" data-action="replay-intro" style="width: 100%; justify-content: center; padding: 12px 18px; font-size: 13.5px;">
                <span>✨</span>
                <span>Replay Memora Animated Intro</span>
              </button>
              
              <button class="badge-chip" data-action="reset-demo-data" style="width: 100%; justify-content: center; padding: 12px 18px; font-size: 13.5px; color: #8C5A5A;">
                <span>🔄</span>
                <span>Reset Demo Garden</span>
              </button>
            </div>
          </div>

          <!-- Right Column: Stats + Emotional Flora + Figurine Avatar Selector -->
          <div style="display: flex; flex-direction: column;">
            <!-- 2x2 Stats Grid -->
            <div class="stats-grid-2x2" style="margin-top: 0;">
              <div class="stat-box-glass">
                <div class="stat-box-val">${stats.total}</div>
                <div class="stat-box-lbl">Memories Seeded</div>
              </div>
              <div class="stat-box-glass">
                <div class="stat-box-val">${stats.withAudio}</div>
                <div class="stat-box-lbl">Harmonized Songs</div>
              </div>
              <div class="stat-box-glass">
                <div class="stat-box-val">${stats.sealedCapsules}</div>
                <div class="stat-box-lbl">Capsules Sealed</div>
              </div>
              <div class="stat-box-glass">
                <div class="stat-box-val">${stats.total + 3}</div>
                <div class="stat-box-lbl">Reflection Days</div>
              </div>
            </div>

            <!-- Emotional Flora Breakdown -->
            <div class="flora-breakdown-card">
              <div class="flora-breakdown-title">
                <span>🌿</span>
                <span>Emotional Flora Distribution</span>
              </div>

              <div class="flora-bar-wrapper">
                <div class="flora-bar-sunny" style="width: ${stats.happyPct}%" title="Radiant Warmth (${stats.happyPct}%)"></div>
                <div class="flora-bar-calm" style="width: ${stats.calmPct}%" title="Sage Calm (${stats.calmPct}%)"></div>
                <div class="flora-bar-nostalgic" style="width: ${stats.nostalgicPct}%" title="Sepia Longing (${stats.nostalgicPct}%)"></div>
              </div>

              <div class="flora-legend-row">
                <div class="flora-legend-item">
                  <span class="flora-legend-dot flora-bar-sunny"></span>
                  <span>Radiant: ${stats.happyPct}%</span>
                </div>
                <div class="flora-legend-item">
                  <span class="flora-legend-dot flora-bar-calm"></span>
                  <span>Calm: ${stats.calmPct}%</span>
                </div>
                <div class="flora-legend-item">
                  <span class="flora-legend-dot flora-bar-nostalgic"></span>
                  <span>Nostalgic: ${stats.nostalgicPct}%</span>
                </div>
              </div>
            </div>

            <!-- Figurine Avatar Companion Selector -->
            <div class="profile-figurines-container">
              <div class="profile-figurines-header">
                <span>🗿</span>
                <span>Choose Your Garden Figurine Companion</span>
              </div>
              <div class="profile-figurines-sub">Tactile 3D artisanal figurines representing your presence in the sanctuary.</div>

              <div class="profile-figurines-grid">
                ${FIGURINE_AVATARS.map(f => `
                  <div class="profile-figurine-card ${f.url === currentAvatar ? 'selected' : ''}" 
                       data-action="select-profile-avatar" 
                       data-url="${f.url}" 
                       title="${f.name}">
                    <img src="${f.url}" alt="${f.name}" class="profile-figurine-img" />
                    <div class="profile-figurine-name">${f.name}</div>
                    <div class="profile-figurine-tag">${f.tag}</div>
                    <div class="profile-figurine-meaning">${f.meaning}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>

        ${this._renderBottomNav('profile')}
      </div>
    `;
  }

  /**
   * Fixed Glass Bottom Navigation Bar (Screenshot 2 Spec)
   */
  _renderBottomNav(activeTab) {
    return `
      <nav class="glass-bottom-nav" role="navigation" aria-label="Main Navigation">
        <button class="nav-tab-item ${activeTab === 'home' ? 'active' : ''}" data-action="nav-tab" data-tab="home">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          <span>Home</span>
        </button>

        <button class="nav-tab-item ${activeTab === 'archive' ? 'active' : ''}" data-action="nav-tab" data-tab="archive">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2"/>
            <line x1="2" y1="10" x2="22" y2="10"/>
          </svg>
          <span>Archive</span>
        </button>

        <button class="nav-tab-item ${activeTab === 'capsule' ? 'active' : ''}" data-action="nav-tab" data-tab="capsule">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          <span>Time Capsule</span>
        </button>

        <button class="nav-tab-item ${activeTab === 'profile' ? 'active' : ''}" data-action="nav-tab" data-tab="profile">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          <span>Profile</span>
        </button>
      </nav>
    `;
  }

  /**
   * Legacy Home View Fallback
   */
  renderHome() {
    this.render();
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
                <button type="button" class="btn ${audioEngine.isPlaying && audioEngine.currentPlayingId === selectedTrack.id ? 'btn-primary is-playing' : 'btn-secondary'}" style="padding: 4px 10px; font-size: var(--text-caption);" data-action="preview-itunes-stream" data-stream-url="${selectedTrack.previewUrl}" data-song-id="${selectedTrack.id}">
                  ${audioEngine.isPlaying && audioEngine.currentPlayingId === selectedTrack.id ? '⏸ Pause' : '▶ Play Preview'}
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
                    <button type="button" class="soundtrack-preview-btn ${isPlaying ? 'is-playing' : ''}" data-action="preview-soundtrack" data-id="${preset.id}">
                      ${isPlaying ? '⏸ Pause' : '▶ Listen Preview'}
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

      ${this._renderBottomNav('home')}
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
