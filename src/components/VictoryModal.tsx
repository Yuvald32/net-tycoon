import { useNetworkStore } from '../stores/networkStore'
import { getLevel, LEVELS } from '../data/levels'

export function VictoryModal() {
  const currentLevelId = useNetworkStore((s) => s.currentLevelId)
  const startLevel = useNetworkStore((s) => s.startLevel)

  const level = getLevel(currentLevelId)
  const hasNextLevel = LEVELS.some((l) => l.id === currentLevelId + 1)
  if (!level) return null

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 max-w-lg w-full mx-4 text-center shadow-2xl">
        <p className="text-green-400 text-sm font-mono mb-2">LEVEL {level.id} COMPLETE</p>
        <h1 className="text-3xl font-bold text-white mb-2">{level.title}</h1>
        <p className="text-gray-400 mb-8">Network objective achieved!</p>

        <div className="flex gap-3 justify-center">
          <button
            onClick={() => startLevel(currentLevelId)}
            className="px-6 py-3 rounded-lg text-sm font-medium bg-gray-700 hover:bg-gray-600 text-white transition-colors cursor-pointer"
          >
            Replay
          </button>
          {hasNextLevel && (
            <button
              onClick={() => startLevel(currentLevelId + 1)}
              className="px-6 py-3 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors cursor-pointer"
            >
              Next Level
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
