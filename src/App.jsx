import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import Setup from './screens/Setup'
import GettingReady from './screens/GettingReady'
import Hunt from './screens/Hunt'
import Postcard from './screens/Postcard'
import { buildHunt } from './lib/buildHunt'

function App() {
  // setup → ready → hunt → postcard (Home comes later)
  const [screen, setScreen] = useState('setup')
  const [choices, setChoices] = useState(null) // what they picked on Setup
  const [hunt, setHunt] = useState([])         // the items to find
  const [photos, setPhotos] = useState([])     // found photos, for the postcard

  function handleStart(picked) {
    const items = buildHunt({
      who: picked.who,
      region: picked.region,
      month: new Date().getMonth() + 1, // getMonth() is 0-11
      size: picked.size,
    })
    setChoices(picked)
    setHunt(items)
    setScreen('ready')
  }

  function playAgain() {
    setPhotos([])
    setHunt([])
    setScreen('setup')
  }

  return (
    <main className="app">
      {screen === 'setup' && <Setup onStart={handleStart} />}

      {screen === 'ready' && <GettingReady onReady={() => setScreen('hunt')} />}

      {screen === 'hunt' && (
        <Hunt
          items={hunt}
          onDone={(picked) => {
            setPhotos(picked)
            setScreen('postcard')
          }}
        />
      )}

      {screen === 'postcard' && (
        <Postcard
          photos={photos}
          items={hunt}
          choices={choices}
          onPlayAgain={playAgain}
        />
      )}
    </main>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)