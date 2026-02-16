import { useBankStore } from '../stores/bankStore'
import { useNetworkStore } from '../stores/networkStore'
import type { DeviceType, Device } from '../types/network'
import { ITEM_PRICES, type ShopItem } from '../stores/inventoryStore'

const DEVICE_TYPES: Set<string> = new Set(['PC', 'Switch', 'Router'])

const DEVICE_ITEMS: { name: ShopItem; icon: string }[] = [
  { name: 'PC', icon: '🖥️' },
  { name: 'Switch', icon: '🔀' },
  { name: 'Router', icon: '📡' },
]

function createDevice(type: DeviceType): Device {
  const id = crypto.randomUUID()
  const portCount = type === 'PC' ? 1 : type === 'Switch' ? 4 : 2
  const ports = Array.from({ length: portCount }, (_, i) => ({
    id: `${id}-port-${i}`,
    status: 'down' as const,
    speed: 1000,
    connectedCableId: null,
  }))

  return {
    id,
    name: `${type}-${id.slice(0, 4)}`,
    type,
    ports,
    configuration: { ip: '0.0.0.0', subnetMask: '255.255.255.0' },
    position: { x: 100, y: 100 },
  }
}

export function Store() {
  const money = useBankStore((s) => s.money)
  const spend = useBankStore((s) => s.spend)
  const addDevice = useNetworkStore((s) => s.addDevice)
  const isConnecting = useNetworkStore((s) => s.connectionState.isConnecting)
  const setConnecting = useNetworkStore((s) => s.setConnecting)

  const cablePrice = ITEM_PRICES['Cat6 Cable']
  const canAffordCable = money >= cablePrice

  function handleBuyDevice(item: ShopItem) {
    const price = ITEM_PRICES[item]
    if (!spend(price)) return
    if (DEVICE_TYPES.has(item)) {
      addDevice(createDevice(item as DeviceType))
    }
  }

  function handleCableClick() {
    if (isConnecting) {
      setConnecting(false)
    } else {
      setConnecting(true)
    }
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 w-80 shrink-0">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white">Store</h2>
        <span className="text-green-400 font-mono text-lg">${money}</span>
      </div>

      <div className="space-y-3">
        {DEVICE_ITEMS.map(({ name, icon }) => {
          const price = ITEM_PRICES[name]
          const canAfford = money >= price

          return (
            <div
              key={name}
              className="flex items-center justify-between bg-gray-700 rounded-md p-3"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{icon}</span>
                <div>
                  <p className="text-white font-medium">{name}</p>
                  <p className="text-gray-400 text-sm">${price}</p>
                </div>
              </div>

              <button
                onClick={() => handleBuyDevice(name)}
                disabled={!canAfford}
                className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
                  canAfford
                    ? 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                Buy
              </button>
            </div>
          )
        })}

        {/* Cable / Connection Mode toggle */}
        <div
          className={`flex items-center justify-between rounded-md p-3 ${
            isConnecting ? 'bg-yellow-900/50 border border-yellow-600' : 'bg-gray-700'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔌</span>
            <div>
              <p className="text-white font-medium">Cat6 Cable</p>
              <p className="text-gray-400 text-sm">${cablePrice}/use</p>
            </div>
          </div>

          <button
            onClick={handleCableClick}
            disabled={!canAffordCable && !isConnecting}
            className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
              isConnecting
                ? 'bg-yellow-600 hover:bg-yellow-500 text-white cursor-pointer'
                : canAffordCable
                  ? 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isConnecting ? 'Cancel' : 'Connect'}
          </button>
        </div>

        {isConnecting && (
          <p className="text-yellow-400 text-xs text-center">
            Click a device to start, then click another to connect. Press Esc to cancel.
          </p>
        )}
      </div>
    </div>
  )
}
