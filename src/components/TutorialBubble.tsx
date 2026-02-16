import { useNetworkStore } from '../stores/networkStore'
import { getLevel } from '../data/levels'

export function TutorialBubble() {
  const currentLevelId = useNetworkStore((s) => s.currentLevelId)
  const tutorialStep = useNetworkStore((s) => s.tutorialStep)
  const advanceTutorial = useNetworkStore((s) => s.advanceTutorial)
  const dismissTutorial = useNetworkStore((s) => s.dismissTutorial)

  const level = getLevel(currentLevelId)
  if (!level || tutorialStep < 0 || tutorialStep >= level.tutorialSteps.length) return null

  const message = level.tutorialSteps[tutorialStep]
  const isLast = tutorialStep === level.tutorialSteps.length - 1

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-md w-full px-4">
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-xl">
        <p className="text-gray-300 text-sm mb-3">{message}</p>
        <div className="flex items-center justify-between">
          <span className="text-gray-600 text-xs">
            {tutorialStep + 1} / {level.tutorialSteps.length}
          </span>
          <div className="flex gap-2">
            <button
              onClick={dismissTutorial}
              className="px-3 py-1 rounded text-xs text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
            >
              Skip
            </button>
            <button
              onClick={advanceTutorial}
              className="px-4 py-1 rounded text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors cursor-pointer"
            >
              {isLast ? 'Got it' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
