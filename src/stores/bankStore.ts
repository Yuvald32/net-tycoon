import { create } from 'zustand'

interface BankState {
  money: number
  earn: (amount: number) => void
  spend: (amount: number) => boolean
}

export const useBankStore = create<BankState>((set, get) => ({
  money: 1000,

  earn: (amount) => set((state) => ({ money: state.money + amount })),

  spend: (amount) => {
    if (get().money >= amount) {
      set((state) => ({ money: state.money - amount }))
      return true
    }
    return false
  },
}))
