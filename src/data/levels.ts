import type { ShopItem } from '../stores/inventoryStore'

export interface Level {
  id: number
  title: string
  description: string
  budget: number
  availableTools: ShopItem[]
  winCondition: string
  tutorialSteps: string[]
}

export const LEVELS: Level[] = [
  {
    id: 1,
    title: 'Hello World',
    description: 'Buy 2 PCs and connect them directly.',
    budget: 150,
    availableTools: ['PC', 'Cat6 Cable'],
    winCondition: '2 PCs connected to each other',
    tutorialSteps: [
      'Welcome to Net Tycoon!',
      'To start, buy two PCs from the store.',
      'Now select the Cable and click each PC to connect them.',
    ],
  },
  {
    id: 2,
    title: 'The Hub',
    description: 'Connect 3 PCs together using a Switch.',
    budget: 400,
    availableTools: ['PC', 'Switch', 'Cat6 Cable'],
    winCondition: '3 PCs each connected to a Switch',
    tutorialSteps: [],
  },
]

export function getLevel(id: number): Level | undefined {
  return LEVELS.find((l) => l.id === id)
}
