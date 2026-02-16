import type { Device, Connection } from '../types/network'

export function validateLevel(
  levelId: number,
  devices: Device[],
  connections: Connection[]
): { passed: boolean; message: string } {
  if (levelId === 1) {
    const pcs = devices.filter((d) => d.type === 'PC')
    if (pcs.length < 2) {
      return { passed: false, message: `Need 2 PCs (have ${pcs.length})` }
    }
    const pcConnected = connections.some((c) => {
      const src = devices.find((d) => d.id === c.sourceDeviceId)
      const tgt = devices.find((d) => d.id === c.targetDeviceId)
      return src?.type === 'PC' && tgt?.type === 'PC'
    })
    if (!pcConnected) {
      return { passed: false, message: 'The 2 PCs must be connected to each other' }
    }
    return { passed: true, message: 'Level complete!' }
  }

  if (levelId === 2) {
    const pcs = devices.filter((d) => d.type === 'PC')
    const switches = devices.filter((d) => d.type === 'Switch')
    if (switches.length < 1) {
      return { passed: false, message: 'Need at least 1 Switch' }
    }
    if (pcs.length < 3) {
      return { passed: false, message: `Need 3 PCs (have ${pcs.length})` }
    }
    const pcsConnectedToSwitch = pcs.filter((pc) =>
      connections.some((c) => {
        const otherId =
          c.sourceDeviceId === pc.id ? c.targetDeviceId
            : c.targetDeviceId === pc.id ? c.sourceDeviceId
              : null
        if (!otherId) return false
        return switches.some((s) => s.id === otherId)
      })
    )
    if (pcsConnectedToSwitch.length < 3) {
      return { passed: false, message: `${pcsConnectedToSwitch.length}/3 PCs connected to a Switch` }
    }
    return { passed: true, message: 'Level complete!' }
  }

  return { passed: false, message: 'Unknown level' }
}
