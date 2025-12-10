import { create } from 'zustand'

export type TabId = 'brand-design' | 'assets' | 'content' | 'products' | 'forms' | 'reviews'

type EventCallback = () => void

interface TabActivityStore {
  activeTab: TabId | null
  listeners: Map<string, Set<EventCallback>>
  
  // Actions
  setActiveTab: (tab: TabId) => void
  on: (event: string, callback: EventCallback) => () => void
  emit: (event: string) => void
  clearListeners: () => void
}

export const useTabActivityStore = create<TabActivityStore>((set, get) => ({
  activeTab: null,
  listeners: new Map(),
  
  setActiveTab: (tab) => {
    set({ activeTab: tab })
    // Emit tab activation event
    get().emit(`tab-activated:${tab}`)
  },
  
  on: (event, callback) => {
    const { listeners } = get()
    if (!listeners.has(event)) {
      listeners.set(event, new Set())
    }
    listeners.get(event)!.add(callback)
    
    // Return unsubscribe function
    return () => {
      const currentListeners = get().listeners
      currentListeners.get(event)?.delete(callback)
      // Clean up empty event sets
      if (currentListeners.get(event)?.size === 0) {
        currentListeners.delete(event)
      }
    }
  },
  
  emit: (event) => {
    const { listeners } = get()
    const callbacks = listeners.get(event)
    if (callbacks) {
      // Call all callbacks for this event
      callbacks.forEach(callback => {
        try {
          callback()
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error)
        }
      })
    }
  },
  
  clearListeners: () => {
    set({ listeners: new Map() })
  },
}))

