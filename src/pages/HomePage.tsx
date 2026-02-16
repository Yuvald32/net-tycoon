import { useState, useCallback } from 'react'
import { RotateCcw, Send } from 'lucide-react'
import { Store } from '../components/Store'
import { NetworkCanvas } from '../components/NetworkCanvas'
import { MissionBriefingModal } from '../components/MissionBriefingModal'
import { VictoryModal } from '../components/VictoryModal'
import { TutorialBubble } from '../components/TutorialBubble'
import { useNetworkStore } from '../stores/networkStore'
import { getLevel } from '../data/levels'

export function HomePage() {
  const resetGame = useNetworkStore((s) => s.resetGame)
  const undoLastAction = useNetworkStore((s) => s.undoLastAction)
  const canUndo = useNetworkStore((s) => s.actionHistory.length > 0)
  const currentLevelId = useNetworkStore((s) => s.currentLevelId)
  const gameMode = useNetworkStore((s) => s.gameMode)
  const checkWinCondition = useNetworkStore((s) => s.checkWinCondition)

  const level = getLevel(currentLevelId)

  const [toast, setToast] = useState<string | null>(null)

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }, [])

  function handleReset() {
    if (window.confirm(`Reset level? Your board will be cleared and budget reset to $${level?.budget ?? 1000}.`)) {
      resetGame()
    }
  }

  function handleSubmit() {
    const result = checkWinCondition()
    if (!result.passed) {
      showToast(result.message)
    }
  }

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white p-4 gap-4 relative">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Net Tycoon</h1>
          {level && (
            <p className="text-gray-400 text-sm">
              Level {level.id}: {level.title} — <span className="text-gray-500">{level.description}</span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {gameMode === 'PLAYING' && (
            <button
              onClick={handleSubmit}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded text-sm font-medium bg-green-700 hover:bg-green-600 text-white border border-green-600 transition-colors cursor-pointer"
            >
              <Send size={14} />
              Submit Network
            </button>
          )}
          <button
            onClick={undoLastAction}
            disabled={!canUndo}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium border transition-colors ${
              canUndo
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white border-gray-700 cursor-pointer'
                : 'bg-gray-800/50 text-gray-600 border-gray-800 cursor-not-allowed'
            }`}
          >
            <RotateCcw size={14} />
            Undo
          </button>
          <button
            onClick={handleReset}
            className="px-3 py-1.5 rounded text-sm font-medium bg-red-900/50 text-red-400 hover:bg-red-900 hover:text-red-300 border border-red-800/50 transition-colors cursor-pointer"
          >
            Reset Level
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 gap-4 min-h-0 relative">
        <Store />
        <div className="relative flex-1 flex">
          <NetworkCanvas />
          {gameMode === 'PLAYING' && <TutorialBubble />}
        </div>
      </div>

      {/* Overlays */}
      {gameMode === 'BRIEFING' && <MissionBriefingModal />}
      {gameMode === 'VICTORY' && <VictoryModal />}

      {/* Toast */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] bg-red-900/90 text-red-200 text-sm px-5 py-2.5 rounded-lg shadow-lg border border-red-800/50">
          {toast}
        </div>
      )}
    </div>
  )
}
