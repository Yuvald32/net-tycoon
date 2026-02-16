export type DeviceType = 'Router' | 'Switch' | 'PC'

export type PortStatus = 'up' | 'down'

export interface Port {
  id: string
  status: PortStatus
  speed: number
  connectedCableId: string | null
}

export interface DeviceConfiguration {
  ip: string
  subnetMask: string
  gateway?: string
}

export interface Device {
  id: string
  name: string
  type: DeviceType
  ports: Port[]
  configuration: DeviceConfiguration
  position: { x: number; y: number }
}

export interface Cable {
  id: string
  portA: { deviceId: string; portId: string }
  portB: { deviceId: string; portId: string }
}

export interface Connection {
  id: string
  sourceDeviceId: string
  targetDeviceId: string
  type: 'copper'
}

export interface ConnectionState {
  isConnecting: boolean
  sourceDeviceId: string | null
}
