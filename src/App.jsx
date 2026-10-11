import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import Setup from './screens/Setup'
import Challenged from './screens/Challenged'
import GettingReady from './screens/GettingReady'
import Hunt from './screens/Hunt'
import Postcard from './screens/Postcard'
import { buildHunt } from './lib/buildHunt'
import { readChallenge, clearChallenge } from './lib/challenge'

function App() {
  // Check once on load: did they open a challenge link?
  const [challenge] = useState(() => readChallenge())

  // challenged/setup → ready → hunt → postcard
  const [screen, setScreen] = useState(challenge ? 'challenged' : 'setup')
  const [choices, setChoices] = useState(null) // names, who, etc. for the postcard
  const [hunt, setHunt] = useState([])         // the items to find
  const [photos, setPhotos] = useState([])     // found photos, for the postcard

  // Normal hunt from the Setup screen
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

  // Accepting a friend's challenge: same items they had
  function handleChallengeStart({ names, dog }) {
    setChoices({
      who: dog ? ['dog'] : [],
      names,
      region: null,
      place: null,
      size: challenge.items.length,
    })
    setHunt(challenge.items)
    setScreen('ready')
  }

  function skipChallenge() {
    clearChallenge() // remove #challenge=... from the address bar
    setScreen('setup')
  }

  function playAgain() {
    clearChallenge()
    setPhotos([])
    setHunt([])
    setScreen('setup')
  }

  return (
    <main className="app">
      {screen === 'challenged' && (
        <Challenged challenge={challenge} onStart={handleChallengeStart} onSkip={skipChallenge} />
      )}

      {screen === 'setup' && <Setup onStart={handleStart} />}

      {screen === 'ready' && <GettingReady onReady={() => setScreen('hunt')} />}

      {screen === 'hunt' && (
        <Hunt
          items={hunt}
          onDone={(picked) => {
            clearChallenge() // finished, so a refresh won't restart the challenge
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