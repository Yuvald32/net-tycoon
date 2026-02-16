import { useRef, useCallback, useState, useEffect } from 'react'
import { Monitor, Network, Router } from 'lucide-react'
import { useNetworkStore } from '../stores/networkStore'
import { useBankStore } from '../stores/bankStore'
import { ITEM_PRICES } from '../stores/inventoryStore'
import type { DeviceType } from '../types/network'

const ICON_SIZE = 40
const DEVICE_W = 80
const DEVICE_H = 64

const DEVICE_ICON: Record<DeviceType, typeof Monitor> = {
  PC: Monitor,
  Switch: Network,
  Router: Router,
}

export function NetworkCanvas() {
  const devices = useNetworkStore((s) => s.devices)
  const connections = useNetworkStore((s) => s.connections)
  const connectionState = useNetworkStore((s) => s.connectionState)
  const updateDevicePosition = useNetworkStore((s) => s.updateDevicePosition)
  const setConnecting = useNetworkStore((s) => s.setConnecting)
  const setConnectionSource = useNetworkStore((s) => s.setConnectionSource)
  const addConnection = useNetworkStore((s) => s.addConnection)
  const spend = useBankStore((s) => s.spend)

  const containerRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState<{
    id: string
    offsetX: number
    offsetY: number
  } | null>(null)

  const [toast, setToast] = useState<string | null>(null)

  // Show toast message
  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }, [])

  // Esc to cancel connection mode
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && connectionState.isConnecting) {
        setConnecting(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [connectionState.isConnecting, setConnecting])

  const handleDeviceClick = useCallback(
    (deviceId: string) => {
      if (!connectionState.isConnecting) return

      if (!connectionState.sourceDeviceId) {
        // First click — set source
        setConnectionSource(deviceId)
      } else {
        // Second click — attempt connection, charge cable cost
        const cablePrice = ITEM_PRICES['Cat6 Cable']
        if (!spend(cablePrice)) {
          showToast('Not enough money for a cable')
          setConnecting(false)
          return
        }

        const error = addConnection(connectionState.sourceDeviceId, deviceId)
        if (error) {
          // Refund since connection failed
          useBankStore.getState().earn(cablePrice)
          showToast(error)
          setConnecting(false)
        }
        // On success, addConnection already resets connectionState
      }
    },
    [connectionState, setConnectionSource, addConnection, spend, setConnecting, showToast]
  )

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, deviceId: string, pos: { x: number; y: number }) => {
      // In connecting mode, clicks select devices — don't drag
      if (connectionState.isConnecting) {
        handleDeviceClick(deviceId)
        return
      }

      e.preventDefault()
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      setDragging({
        id: deviceId,
        offsetX: e.clientX - rect.left - pos.x,
        offsetY: e.clientY - rect.top - pos.y,
      })
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    },
    [connectionState.isConnecting, handleDeviceClick]
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const x = Math.max(0, Math.min(rect.width - DEVICE_W, e.clientX - rect.left - dragging.offsetX))
      const y = Math.max(0, Math.min(rect.height - DEVICE_H, e.clientY - rect.top - dragging.offsetY))
      updateDevicePosition(dragging.id, x, y)
    },
    [dragging, updateDevicePosition]
  )

  const handlePointerUp = useCallback(() => {
    setDragging(null)
  }, [])

  // Build a lookup for device positions by id
  const deviceMap = new Map(devices.map((d) => [d.id, d]))

  return (
    <div
      ref={containerRef}
      className={`relative flex-1 bg-gray-950 border border-gray-800 rounded-lg overflow-hidden select-none ${
        connectionState.isConnecting ? 'cursor-crosshair' : ''
      }`}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* SVG connection lines — behind devices */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {connections.map((conn) => {
          const source = deviceMap.get(conn.sourceDeviceId)
          const target = deviceMap.get(conn.targetDeviceId)
          if (!source || !target) return null
          const sx = source.position.x + DEVICE_W / 2
          const sy = source.position.y + ICON_SIZE / 2
          const tx = target.position.x + DEVICE_W / 2
          const ty = target.position.y + ICON_SIZE / 2
          return (
            <line
              key={conn.id}
              x1={sx}
              y1={sy}
              x2={tx}
              y2={ty}
              stroke="#4b5563"
              strokeWidth={2}
              strokeDasharray="6 3"
            />
          )
        })}
      </svg>

      {devices.length === 0 && (
        <p className="absolute inset-0 flex items-center justify-center text-gray-600 text-sm">
          Buy devices from the store to get started
        </p>
      )}

      {devices.map((device) => {
        const Icon = DEVICE_ICON[device.type]
        const isSource = connectionState.sourceDeviceId === device.id
        return (
          <div
            key={device.id}
            className={`absolute flex flex-col items-center gap-1 ${
              connectionState.isConnecting
                ? 'cursor-crosshair'
                : 'cursor-grab active:cursor-grabbing'
            } ${isSource ? 'ring-2 ring-yellow-400 rounded-lg' : ''}`}
            style={{ left: device.position.x, top: device.position.y, width: DEVICE_W }}
            onPointerDown={(e) => handlePointerDown(e, device.id, device.position)}
          >
            <Icon size={ICON_SIZE} className={isSource ? 'text-yellow-400' : 'text-blue-400'} />
            <span className="text-gray-400 text-[10px] truncate max-w-full">
              {device.name}
            </span>
            <span className="text-gray-600 text-[9px]">
              {device.ports.length - connections.filter(
                (c) => c.sourceDeviceId === device.id || c.targetDeviceId === device.id
              ).length}/{device.ports.length} ports
            </span>
          </div>
        )
      })}

      {/* Toast */}
      {toast && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-900/90 text-red-200 text-sm px-4 py-2 rounded-lg shadow-lg">
          {toast}
        </div>
      )}
    </div>
  )
}
