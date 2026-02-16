import { HomePage } from './pages/HomePage'
import { WelcomeScreen } from './components/WelcomeScreen'
import { useNetworkStore } from './stores/networkStore'

function App() {
  const gameMode = useNetworkStore((s) => s.gameMode)

  return (
    <>
      <HomePage />
      {gameMode === 'MENU' && <WelcomeScreen />}
    </>
  )
}

export default App
