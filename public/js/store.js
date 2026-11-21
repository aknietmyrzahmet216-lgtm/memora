/**
 * MEMORA — Centralized State Store
 * Features:
 * - Reactive Pub/Sub pattern
 * - LocalStorage persistence with resilient initial seed
 * - Pre-loaded 3 Demo Scenarios & Reset Demo Data functionality
 * - Advanced Archive Filtering: Keyword search, Mood filters, Time Capsules, and Date sorting
 * - Multiple layout modes: Editorial Grid, Folder Grid, and Chronological Timeline
 */

import { INITIAL_MEMORIES, INITIAL_TIME_CAPSULES } from './mockData.js';

const STORAGE_KEY = 'memora_chronicles_store_v3';

class MemoryStore {
  constructor() {
    this._subscribers = new Set();
    this._state = this._loadInitialState();
  }

  _loadInitialState() {
    try {
      const persisted = localStorage.getItem(STORAGE_KEY);
      if (persisted) {
        const parsed = JSON.parse(persisted);
        return {
          memories: Array.isArray(parsed.memories) && parsed.memories.length > 0 
            ? parsed.memories 
            : INITIAL_MEMORIES,
          folders: Array.isArray(parsed.folders) ? parsed.folders : this._extractDefaultFolders(INITIAL_MEMORIES),
          timeCapsules: parsed.timeCapsules || INITIAL_TIME_CAPSULES,
          currentMood: parsed.currentMood || 'happy-sunny',
          activeFilter: 'all',
          searchQuery: '',
          archiveLayout: parsed.archiveLayout || 'grid', // 'grid', 'folder-grid', 'timeline'
          sortBy: 'newest', // 'newest' | 'oldest'
          activeView: parsed.activeView || 'home',
          activeMemoryId: parsed.activeMemoryId || null,
          selectedMemoryId: parsed.selectedMemoryId || 'mem-day-1',
          audioPlayingId: null,
          isAudioPlaying: false,
          wizardDraft: {
            step: 1,
            storyText: '',
            photos: [],
            soundtrack: null
          }
        };
      }
    } catch (e) {
      console.warn('[MEMORA Store] LocalStorage reading error, fallback to mock data:', e);
    }

    return {
      memories: INITIAL_MEMORIES,
      folders: this._extractDefaultFolders(INITIAL_MEMORIES),
      timeCapsules: INITIAL_TIME_CAPSULES,
      currentMood: 'happy-sunny',
      activeFilter: 'all',
      searchQuery: '',
      archiveLayout: 'grid',
      sortBy: 'newest',
      activeView: 'home',
      activeMemoryId: null,
      selectedMemoryId: 'mem-day-1',
      audioPlayingId: null,
      isAudioPlaying: false,
      wizardDraft: {
        step: 1,
        storyText: '',
        photos: [],
        soundtrack: null
      }
    };
  }

  _extractDefaultFolders(memories) {
    return memories.map(m => m.folder || `📁 Nov 20 — ${m.title}`);
  }

  _persist() {
    try {
      const stateToSave = {
        memories: this._state.memories,
        folders: this._state.folders,
        timeCapsules: this._state.timeCapsules,
        currentMood: this._state.currentMood,
        archiveLayout: this._state.archiveLayout,
        activeView: this._state.activeView,
        activeMemoryId: this._state.activeMemoryId,
        selectedMemoryId: this._state.selectedMemoryId
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (e) {
      console.warn('[MEMORA Store] LocalStorage saving error:', e);
    }
  }

  subscribe(callback) {
    this._subscribers.add(callback);
    return () => this._subscribers.delete(callback);
  }

  _notify(eventName, payload) {
    for (const callback of this._subscribers) {
      try {
        callback(this._state, eventName, payload);
      } catch (err) {
        console.error('[MEMORA Store] Error in subscriber callback:', err);
      }
    }
  }

  getState() {
    return { ...this._state };
  }

  setState(partialState, eventName = 'STATE_CHANGED') {
    this._state = { ...this._state, ...partialState };
    this._persist();
    this._notify(eventName, partialState);
  }

  // Navigation / View state
  setView(view, memoryId = null) {
    this.setState({
      activeView: view,
      activeMemoryId: memoryId || this._state.activeMemoryId
    }, 'VIEW_CHANGED');
  }

  // Wizard state management
  updateWizardDraft(partial) {
    this.setState({
      wizardDraft: { ...this._state.wizardDraft, ...partial }
    }, 'WIZARD_DRAFT_UPDATED');
  }

  resetWizardDraft() {
    this.setState({
      wizardDraft: {
        step: 1,
        storyText: '',
        photos: [],
        soundtrack: null
      }
    }, 'WIZARD_RESET');
  }

  setMood(newMood) {
    if (this._state.currentMood === newMood) return;
    this.setState({ currentMood: newMood }, 'MOOD_CHANGED');
  }

  setFilter(filter) {
    this.setState({ activeFilter: filter }, 'FILTER_CHANGED');
  }

  setSearchQuery(query) {
    this.setState({ searchQuery: query }, 'SEARCH_CHANGED');
  }

  setArchiveLayout(layout) {
    this.setState({ archiveLayout: layout }, 'LAYOUT_CHANGED');
  }

  setSortBy(sort) {
    this.setState({ sortBy: sort }, 'SORT_CHANGED');
  }

  selectMemory(memoryId) {
    const memory = this._state.memories.find(m => m.id === memoryId);
    if (memory) {
      this.setState({
        selectedMemoryId: memoryId,
        activeMemoryId: memoryId,
        currentMood: memory.mood
      }, 'MEMORY_SELECTED');
    }
  }

  toggleAudio(memoryId) {
    const isSameTrack = this._state.audioPlayingId === memoryId;
    const nextPlayingState = isSameTrack ? !this._state.isAudioPlaying : true;
    
    this.setState({
      audioPlayingId: nextPlayingState ? memoryId : null,
      isAudioPlaying: nextPlayingState
    }, 'AUDIO_TOGGLED');
  }

  setAudioState(memoryId, isPlaying) {
    this.setState({
      audioPlayingId: isPlaying ? memoryId : null,
      isAudioPlaying: Boolean(isPlaying)
    }, 'AUDIO_TOGGLED');
  }

  stopAudio() {
    if (this._state.isAudioPlaying || this._state.audioPlayingId) {
      this.setState({
        audioPlayingId: null,
        isAudioPlaying: false
      }, 'AUDIO_TOGGLED');
    }
  }

  /**
   * Reset all demo data to pristine initial state
   */
  resetDemoData() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      // Ignored
    }

    this._state = {
      memories: INITIAL_MEMORIES,
      folders: this._extractDefaultFolders(INITIAL_MEMORIES),
      timeCapsules: INITIAL_TIME_CAPSULES,
      currentMood: 'happy-sunny',
      activeFilter: 'all',
      searchQuery: '',
      archiveLayout: 'grid',
      sortBy: 'newest',
      activeView: 'home',
      activeMemoryId: null,
      selectedMemoryId: 'mem-day-1',
      audioPlayingId: null,
      isAudioPlaying: false,
      wizardDraft: {
        step: 1,
        storyText: '',
        photos: [],
        soundtrack: null
      }
    };

    this._persist();
    this._notify('DEMO_DATA_RESET', this._state);
  }

  /**
   * Save a newly created memory synthesized by AI
   */
  addMemoryFromAI(aiResult, rawInput) {
    const now = new Date();
    const memoryId = `mem-${Date.now()}`;
    const dateFormatted = new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(now);
    const timeFormatted = new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(now);

    const photosList = Array.isArray(rawInput.photos) && rawInput.photos.length > 0
      ? rawInput.photos
      : ['https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80'];

    const newMemory = {
      id: memoryId,
      title: aiResult.title,
      folder: aiResult.folder,
      date: now.toISOString().split('T')[0],
      dateFormatted,
      time: timeFormatted,
      location: 'Personal Sanctuary',
      camera: 'Leica M6 · Analog 35mm',
      mood: aiResult.mood,
      moodLabel: aiResult.moodLabel,
      quote: aiResult.quote,
      excerpt: rawInput.storyText.length > 180 ? rawInput.storyText.slice(0, 180) + '...' : rawInput.storyText,
      fullContent: rawInput.storyText,
      aiStory: aiResult.aiStory,
      palette: aiResult.palette,
      photoUrl: photosList[0],
      photos: photosList,
      hasAudio: Boolean(rawInput.soundtrack),
      audioDuration: '02:40',
      audioTitle: rawInput.soundtrack ? `${rawInput.soundtrack.title} — ${rawInput.soundtrack.artist}` : null,
      soundtrackPresetId: rawInput.soundtrack?.id || null,
      soundtrack: rawInput.soundtrack,
      tags: ['Chronicle', aiResult.mood.split('-')[0], 'Personal'],
      aiResonance: aiResult.resonance,
      isHero: false
    };

    const updatedMemories = [newMemory, ...this._state.memories];
    const updatedFolders = [aiResult.folder, ...this._state.folders.filter(f => f !== aiResult.folder)];

    this.setState({
      memories: updatedMemories,
      folders: updatedFolders,
      currentMood: aiResult.mood,
      activeMemoryId: memoryId,
      activeView: 'memory-view'
    }, 'MEMORY_ADDED');

    this.resetWizardDraft();
    return newMemory;
  }

  deleteMemory(id) {
    const updatedMemories = this._state.memories.filter(m => m.id !== id);
    this.setState({
      memories: updatedMemories,
      activeView: this._state.activeMemoryId === id ? 'home' : this._state.activeView,
      activeMemoryId: this._state.activeMemoryId === id ? null : this._state.activeMemoryId
    }, 'MEMORY_DELETED');
  }

  /**
   * Time Capsule Management
   */
  sealTimeCapsule(memoryId, unlockDate, unlockDateFormatted) {
    const updatedCapsules = {
      ...this._state.timeCapsules,
      [memoryId]: {
        isSealed: true,
        sealedAt: new Date().toISOString(),
        unlockDate,
        unlockDateFormatted,
        isSimulatedUnlock: false,
        reflection: null
      }
    };

    this.setState({ timeCapsules: updatedCapsules }, 'TIME_CAPSULE_SEALED');
  }

  unsealTimeCapsule(memoryId, isSimulated = false) {
    const current = this._state.timeCapsules[memoryId];
    if (!current) return;

    const updatedCapsules = {
      ...this._state.timeCapsules,
      [memoryId]: {
        ...current,
        isSealed: !isSimulated,
        isSimulatedUnlock: isSimulated
      }
    };

    this.setState({ timeCapsules: updatedCapsules }, 'TIME_CAPSULE_UNSEALED');
  }

  saveCapsuleReflection(memoryId, reflectionText, todayMood = 'calm-peaceful') {
    const current = this._state.timeCapsules[memoryId] || {};
    const updatedCapsules = {
      ...this._state.timeCapsules,
      [memoryId]: {
        ...current,
        reflection: {
          text: reflectionText,
          savedAtFormatted: new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          }).format(new Date()),
          todayMood
        }
      }
    };

    this.setState({ timeCapsules: updatedCapsules }, 'CAPSULE_REFLECTION_SAVED');
  }

  getTimeCapsule(memoryId) {
    return this._state.timeCapsules[memoryId] || null;
  }

  getHeroMemory() {
    return this._state.memories.find(m => m.isHero) || this._state.memories[0];
  }

  getFilteredMemories() {
    const { memories, activeFilter, searchQuery, sortBy, timeCapsules } = this._state;
    
    // 1. Mood or Time Capsule filter
    let filtered = memories.filter(m => {
      if (activeFilter === 'all') return true;
      if (activeFilter === 'time-capsule') {
        const capsule = timeCapsules[m.id];
        return capsule && capsule.isSealed;
      }
      return m.mood === activeFilter;
    });

    // 2. Keyword Search filter across multiple fields
    if (searchQuery && searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(m => {
        const titleMatch = m.title.toLowerCase().includes(q);
        const contentMatch = (m.fullContent || '').toLowerCase().includes(q);
        const excerptMatch = (m.excerpt || '').toLowerCase().includes(q);
        const aiStoryMatch = (m.aiStory || '').toLowerCase().includes(q);
        const quoteMatch = (m.quote || '').toLowerCase().includes(q);
        const songMatch = (m.audioTitle || '').toLowerCase().includes(q);
        const locationMatch = (m.location || '').toLowerCase().includes(q);
        const tagsMatch = (m.tags || []).some(t => t.toLowerCase().includes(q));
        const folderMatch = (m.folder || '').toLowerCase().includes(q);

        return titleMatch || contentMatch || excerptMatch || aiStoryMatch || quoteMatch || songMatch || locationMatch || tagsMatch || folderMatch;
      });
    }

    // 3. Sorting by date
    filtered.sort((a, b) => {
      const dateA = new Date(a.date).getTime() || 0;
      const dateB = new Date(b.date).getTime() || 0;
      return sortBy === 'oldest' ? dateA - dateB : dateB - dateA;
    });

    return filtered;
  }

  getActiveMemory() {
    const { memories, activeMemoryId, selectedMemoryId } = this._state;
    return memories.find(m => m.id === (activeMemoryId || selectedMemoryId)) || memories[0];
  }
}

export const store = new MemoryStore();
