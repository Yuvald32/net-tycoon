import { create } from 'zustand'

export type ShopItem = 'PC' | 'Switch' | 'Router' | 'Cat6 Cable'

export const ITEM_PRICES: Record<ShopItem, number> = {
  PC: 50,
  Switch: 150,
  Router: 300,
  'Cat6 Cable': 5,
}

interface InventoryState {
  items: Record<ShopItem, number>
  addItem: (item: ShopItem, quantity?: number) => void
  removeItem: (item: ShopItem, quantity?: number) => boolean
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  items: {
    PC: 0,
    Switch: 0,
    Router: 0,
    'Cat6 Cable': 0,
  },

  addItem: (item, quantity = 1) =>
    set((state) => ({
      items: { ...state.items, [item]: state.items[item] + quantity },
    })),

  removeItem: (item, quantity = 1) => {
    if (get().items[item] >= quantity) {
      set((state) => ({
        items: { ...state.items, [item]: state.items[item] - quantity },
      }))
      return true
    }
    return false
  },
}))
