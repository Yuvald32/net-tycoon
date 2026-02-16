import type { Device, Cable } from '../types/network'

function ipToInt(ip: string): number {
  return ip
    .split('.')
    .reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0)
}

function getNetworkAddress(ip: string, subnetMask: string): number {
  return ipToInt(ip) & ipToInt(subnetMask)
}

function isSameSubnet(a: Device, b: Device): boolean {
  return (
    getNetworkAddress(a.configuration.ip, a.configuration.subnetMask) ===
    getNetworkAddress(b.configuration.ip, b.configuration.subnetMask)
  )
}

function getConnectedDeviceId(
  deviceId: string,
  cables: Cable[],
  devices: Device[]
): string[] {
  const neighborIds: string[] = []
  for (const cable of cables) {
    const port = devices
      .find((d) => d.id === deviceId)
      ?.ports.find((p) => p.connectedCableId === cable.id)
    if (!port) continue

    if (cable.portA.deviceId === deviceId) {
      neighborIds.push(cable.portB.deviceId)
    } else if (cable.portB.deviceId === deviceId) {
      neighborIds.push(cable.portA.deviceId)
    }
  }
  return neighborIds
}

function findPath(
  sourceId: string,
  destId: string,
  devices: Device[],
  cables: Cable[]
): Device[] | null {
  const visited = new Set<string>()
  const queue: Device[][] = []

  const source = devices.find((d) => d.id === sourceId)
  if (!source) return null

  queue.push([source])
  visited.add(sourceId)

  while (queue.length > 0) {
    const path = queue.shift()!
    const current = path[path.length - 1]

    if (current.id === destId) return path

    const neighborIds = getConnectedDeviceId(current.id, cables, devices)
    for (const neighborId of neighborIds) {
      if (visited.has(neighborId)) continue
      visited.add(neighborId)

      const neighbor = devices.find((d) => d.id === neighborId)
      if (!neighbor) continue

      queue.push([...path, neighbor])
    }
  }

  return null
}

export function ping(
  source: Device,
  destination: Device,
  devices: Device[],
  cables: Cable[]
): boolean {
  console.log(`PING ${source.name} (${source.configuration.ip}) -> ${destination.name} (${destination.configuration.ip})`)

  if (source.id === destination.id) {
    console.log('  -> Pinging self: Success (loopback)')
    return true
  }

  const path = findPath(source.id, destination.id, devices, cables)

  if (!path) {
    console.log('  -> No physical path found. Request timed out.')
    return false
  }

  const pathStr = path.map((d) => `${d.name}(${d.type})`).join(' -> ')
  console.log(`  -> Path: ${pathStr}`)

  if (isSameSubnet(source, destination)) {
    // Same subnet: need a path through switches (no router required)
    const intermediates = path.slice(1, -1)
    const invalidHop = intermediates.find(
      (d) => d.type !== 'Switch' && d.type !== 'Router'
    )
    if (invalidHop) {
      console.log(`  -> Failed: cannot route through ${invalidHop.name} (${invalidHop.type})`)
      return false
    }
    console.log('  -> Same subnet, direct path via switch: Success')
    return true
  }

  // Different subnets: need a router with correct gateway
  const routers = path.filter((d) => d.type === 'Router')

  if (routers.length === 0) {
    console.log('  -> Different subnets but no router in path. Destination unreachable.')
    return false
  }

  // Check that source has gateway pointing to a router
  if (!source.configuration.gateway) {
    console.log(`  -> ${source.name} has no gateway configured. Destination unreachable.`)
    return false
  }

  const gatewayRouter = routers.find(
    (r) => r.configuration.ip === source.configuration.gateway
  )

  if (!gatewayRouter) {
    console.log(`  -> Gateway ${source.configuration.gateway} not reachable. Destination unreachable.`)
    return false
  }

  console.log(`  -> Routed via ${gatewayRouter.name} (${gatewayRouter.configuration.ip}): Success`)
  return true
}
