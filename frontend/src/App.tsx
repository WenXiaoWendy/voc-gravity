import { useIsMobile } from './hooks/useIsMobile'
import MobileGravityScreen from './components/MobileGravityScreen'
import VocabularyGravityScreen from './components/VocabularyGravityScreen'

function App() {
  const isMobile = useIsMobile()
  return isMobile ? <MobileGravityScreen /> : <VocabularyGravityScreen />
}

export default App
