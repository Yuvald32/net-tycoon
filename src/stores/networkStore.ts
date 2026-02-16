import { create } from 'zustand'
import type { Device, Cable, Connection, ConnectionState } from '../types/network'
import { ITEM_PRICES } from './inventoryStore'
import { useBankStore } from './bankStore'
import { getLevel } from '../data/levels'
import { validateLevel } from '../utils/validateLevel'

interface BuyDeviceAction {
  type: 'BUY_DEVICE'
  deviceId: string
  cost: number
}

type UndoableAction = BuyDeviceAction

export type GameMode = 'MENU' | 'BRIEFING' | 'PLAYING' | 'VICTORY'

interface NetworkState {
  devices: Device[]
  cables: Cable[]
  connections: Connection[]
  connectionState: ConnectionState
  actionHistory: UndoableAction[]
  currentLevelId: number
  gameMode: GameMode
  tutorialStep: number
  addDevice: (device: Device) => void
  removeDevice: (id: string) => void
  updateDevice: (id: string, updates: Partial<Device>) => void
  updateDevicePosition: (id: string, x: number, y: number) => void
  addCable: (cable: Cable) => void
  removeCable: (id: string) => void
  setConnecting: (isConnecting: boolean) => void
  setConnectionSource: (deviceId: string | null) => void
  addConnection: (sourceId: string, targetId: string) => string | null
  getFreePorts: (deviceId: string) => number
  sellDevice: (deviceId: string) => void
  resetGame: () => void
  undoLastAction: () => void
  startLevel: (levelId: number) => void
  checkWinCondition: () => { passed: boolean; message: string }
  advanceTutorial: () => void
  dismissTutorial: () => void
}

export const useNetworkStore = create<NetworkState>((set, get) => ({
  devices: [],
  cables: [],
  connections: [],
  connectionState: { isConnecting: false, sourceDeviceId: null },
  actionHistory: [],
  currentLevelId: 1,
  gameMode: 'MENU',
  tutorialStep: 0,

  addDevice: (device) =>
    set((state) => ({
      devices: [...state.devices, device],
      actionHistory: [
        ...state.actionHistory,
        {
          type: 'BUY_DEVICE' as const,
          deviceId: device.id,
          cost: ITEM_PRICES[device.type as keyof typeof ITEM_PRICES] ?? 0,
        },
      ],
    })),

  removeDevice: (id) =>
    set((state) => ({
      devices: state.devices.filter((d) => d.id !== id),
      cables: state.cables.filter(
        (c) => c.portA.deviceId !== id && c.portB.deviceId !== id
      ),
      connections: state.connections.filter(
        (c) => c.sourceDeviceId !== id && c.targetDeviceId !== id
      ),
    })),

  updateDevice: (id, updates) =>
    set((state) => ({
      devices: state.devices.map((d) =>
        d.id === id ? { ...d, ...updates } : d
      ),
    })),

  updateDevicePosition: (id, x, y) =>
    set((state) => ({
      devices: state.devices.map((d) =>
        d.id === id ? { ...d, position: { x, y } } : d
      ),
    })),

  addCable: (cable) =>
    set((state) => ({
      cables: [...state.cables, cable],
      devices: state.devices.map((d) => ({
        ...d,
        ports: d.ports.map((p) => {
          if (
            (d.id === cable.portA.deviceId && p.id === cable.portA.portId) ||
            (d.id === cable.portB.deviceId && p.id === cable.portB.portId)
          ) {
            return { ...p, connectedCableId: cable.id, status: 'up' as const }
          }
          return p
        }),
      })),
    })),

  removeCable: (id) =>
    set((state) => ({
      cables: state.cables.filter((c) => c.id !== id),
      devices: state.devices.map((d) => ({
        ...d,
        ports: d.ports.map((p) =>
          p.connectedCableId === id
            ? { ...p, connectedCableId: null, status: 'down' as const }
            : p
        ),
      })),
    })),

  setConnecting: (isConnecting) =>
    set({ connectionState: { isConnecting, sourceDeviceId: null } }),

  setConnectionSource: (deviceId) =>
    set((state) => ({
      connectionState: { ...state.connectionState, sourceDeviceId: deviceId },
    })),

  addConnection: (sourceId, targetId) => {
    if (sourceId === targetId) return 'Cannot connect a device to itself'

    const state = get()
    const sourceFreePorts = state.getFreePorts(sourceId)
    const targetFreePorts = state.getFreePorts(targetId)

    if (sourceFreePorts <= 0) {
      const dev = state.devices.find((d) => d.id === sourceId)
      return `${dev?.name ?? 'Device'} has no free ports`
    }
    if (targetFreePorts <= 0) {
      const dev = state.devices.find((d) => d.id === targetId)
      return `${dev?.name ?? 'Device'} has no free ports`
    }

    const connection: Connection = {
      id: crypto.randomUUID(),
      sourceDeviceId: sourceId,
      targetDeviceId: targetId,
      type: 'copper',
    }

    set((state) => ({
      connections: [...state.connections, connection],
      connectionState: { isConnecting: false, sourceDeviceId: null },
    }))

    return null
  },

  getFreePorts: (deviceId) => {
    const state = get()
    const device = state.devices.find((d) => d.id === deviceId)
    if (!device) return 0
    const usedPorts = state.connections.filter(
      (c) => c.sourceDeviceId === deviceId || c.targetDeviceId === deviceId
    ).length
    return device.ports.length - usedPorts
  },

  sellDevice: (deviceId) => {
    const device = get().devices.find((d) => d.id === deviceId)
    if (!device) return
    const price = ITEM_PRICES[device.type as keyof typeof ITEM_PRICES] ?? 0
    useBankStore.getState().earn(price)
    set((state) => ({
      devices: state.devices.filter((d) => d.id !== deviceId),
      connections: state.connections.filter(
        (c) => c.sourceDeviceId !== deviceId && c.targetDeviceId !== deviceId
      ),
      cables: state.cables.filter(
        (c) => c.portA.deviceId !== deviceId && c.portB.deviceId !== deviceId
      ),
      actionHistory: state.actionHistory.filter(
        (a) => !(a.type === 'BUY_DEVICE' && a.deviceId === deviceId)
      ),
    }))
  },

  resetGame: () => {
    const level = getLevel(get().currentLevelId)
    const budget = level?.budget ?? 1000
    useBankStore.setState({ money: budget })
    set({
      devices: [],
      cables: [],
      connections: [],
      connectionState: { isConnecting: false, sourceDeviceId: null },
      actionHistory: [],
      gameMode: 'PLAYING',
      tutorialStep: 0,
    })
  },

  undoLastAction: () => {
    const { actionHistory } = get()
    if (actionHistory.length === 0) return

    const last = actionHistory[actionHistory.length - 1]

    if (last.type === 'BUY_DEVICE') {
      useBankStore.getState().earn(last.cost)
      set((state) => ({
        devices: state.devices.filter((d) => d.id !== last.deviceId),
        connections: state.connections.filter(
          (c) => c.sourceDeviceId !== last.deviceId && c.targetDeviceId !== last.deviceId
        ),
        cables: state.cables.filter(
          (c) => c.portA.deviceId !== last.deviceId && c.portB.deviceId !== last.deviceId
        ),
        actionHistory: state.actionHistory.slice(0, -1),
      }))
    }
  },

  startLevel: (levelId) => {
    const level = getLevel(levelId)
    if (!level) return
    useBankStore.setState({ money: level.budget })
    set({
      devices: [],
      cables: [],
      connections: [],
      connectionState: { isConnecting: false, sourceDeviceId: null },
      actionHistory: [],
      currentLevelId: levelId,
      gameMode: 'BRIEFING',
      tutorialStep: 0,
    })
  },

  checkWinCondition: () => {
    const state = get()
    const result = validateLevel(state.currentLevelId, state.devices, state.connections)
    if (result.passed) {
      set({ gameMode: 'VICTORY' })
    }
    return result
  },

  advanceTutorial: () => {
    const { tutorialStep, currentLevelId } = get()
    const level = getLevel(currentLevelId)
    if (!level) return
    if (tutorialStep < level.tutorialSteps.length - 1) {
      set({ tutorialStep: tutorialStep + 1 })
    } else {
      set({ tutorialStep: -1 })
    }
  },

  dismissTutorial: () => {
    set({ tutorialStep: -1 })
  },
}))
