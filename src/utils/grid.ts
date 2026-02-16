import type { Device } from '../types/network'

export const GRID_SIZE = 100

export function snapToGrid(x: number, y: number): { x: number; y: number } {
  return {
    x: Math.round(x / GRID_SIZE) * GRID_SIZE,
    y: Math.round(y / GRID_SIZE) * GRID_SIZE,
  }
}

function isOccupied(x: number, y: number, devices: Device[], excludeId?: string): boolean {
  return devices.some(
    (d) => d.id !== excludeId && d.position.x === x && d.position.y === y
  )
}

export function findNextFreePosition(devices: Device[], maxWidth = 800, maxHeight = 600): { x: number; y: number } {
  let x = GRID_SIZE
  let y = GRID_SIZE

  while (isOccupied(x, y, devices)) {
    x += GRID_SIZE
    if (x >= maxWidth) {
      x = GRID_SIZE
      y += GRID_SIZE
      if (y >= maxHeight) {
        // Fallback: just return this position even if occupied
        break
      }
    }
  }

  return { x, y }
}

export function findNearestFreePosition(
  targetX: number,
  targetY: number,
  devices: Device[],
  excludeId: string,
  maxWidth: number,
  maxHeight: number
): { x: number; y: number } {
  const snapped = snapToGrid(targetX, targetY)

  // Clamp to canvas bounds
  snapped.x = Math.max(0, Math.min(Math.floor(maxWidth / GRID_SIZE) * GRID_SIZE, snapped.x))
  snapped.y = Math.max(0, Math.min(Math.floor(maxHeight / GRID_SIZE) * GRID_SIZE, snapped.y))

  if (!isOccupied(snapped.x, snapped.y, devices, excludeId)) {
    return snapped
  }

  // Spiral search outward from snapped position
  for (let radius = 1; radius < 20; radius++) {
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) continue // only check perimeter
        const cx = snapped.x + dx * GRID_SIZE
        const cy = snapped.y + dy * GRID_SIZE
        if (cx < 0 || cy < 0 || cx > maxWidth || cy > maxHeight) continue
        if (!isOccupied(cx, cy, devices, excludeId)) {
          return { x: cx, y: cy }
        }
      }
    }
  }

  return snapped // fallback
}
