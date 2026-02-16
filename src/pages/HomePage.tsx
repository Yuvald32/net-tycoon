import { Store } from '../components/Store'
import { NetworkCanvas } from '../components/NetworkCanvas'

export function HomePage() {
  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white p-4 gap-4">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold">Net Tycoon</h1>
        <p className="text-gray-400 text-sm">Build your network empire</p>
      </div>

      <div className="flex flex-1 gap-4 min-h-0">
        <Store />
        <NetworkCanvas />
      </div>
    </div>
  )
}
