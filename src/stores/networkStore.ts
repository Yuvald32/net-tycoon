import { create } from 'zustand'
import type { Device, Cable, Connection, ConnectionState } from '../types/network'

interface NetworkState {
  devices: Device[]
  cables: Cable[]
  connections: Connection[]
  connectionState: ConnectionState
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
}

export const useNetworkStore = create<NetworkState>((set, get) => ({
  devices: [],
  cables: [],
  connections: [],
  connectionState: { isConnecting: false, sourceDeviceId: null },

  addDevice: (device) =>
    set((state) => ({ devices: [...state.devices, device] })),

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
}))
