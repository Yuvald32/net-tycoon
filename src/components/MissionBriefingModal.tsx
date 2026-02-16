import { useNetworkStore } from '../stores/networkStore'
import { getLevel } from '../data/levels'

export function MissionBriefingModal() {
  const currentLevelId = useNetworkStore((s) => s.currentLevelId)
  const resetGame = useNetworkStore((s) => s.resetGame)

  const level = getLevel(currentLevelId)
  if (!level) return null

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 max-w-lg w-full mx-4 shadow-2xl">
        <p className="text-green-400 text-sm font-mono mb-2">LEVEL {level.id}</p>
        <h1 className="text-3xl font-bold text-white mb-2">{level.title}</h1>
        <p className="text-gray-400 mb-6">{level.description}</p>

        <div className="bg-gray-900 rounded-md p-4 mb-6 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Budget</span>
            <span className="text-green-400 font-mono">${level.budget}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Tools</span>
            <span className="text-gray-300">{level.availableTools.join(', ')}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Objective</span>
            <span className="text-gray-300">{level.winCondition}</span>
          </div>
        </div>

        <button
          onClick={() => resetGame()}
          className="w-full py-3 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors cursor-pointer"
        >
          Start Mission
        </button>
      </div>
    </div>
  )
}
