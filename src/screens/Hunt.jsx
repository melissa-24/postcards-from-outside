import { useRef, useState } from 'react'
import { checkPhoto } from '../lib/vision'

export default function Hunt({ items, onDone }) {
    const cameraRef = useRef(null)                 // the hidden camera input
    const [active, setActive] = useState(null)     // the item being photographed
    const [found, setFound] = useState({})         // { [itemId]: { file, url, how } }
    const [checking, setChecking] = useState(false)
    const [result, setResult] = useState(null)     // { item, file, found, top, error }

    // Tap a card → open the camera for that item
    function openCamera(item) {
        setActive(item)
        setResult(null)
        cameraRef.current.click()
    }

    // A photo was taken (or picked)
    async function handlePhoto(e) {
        const file = e.target.files[0]
        e.target.value = '' // so picking the same photo again still triggers onChange
        if (!file || !active) return

        setChecking(true)
        try {
            const r = await checkPhoto(file, active)
            setResult({ item: active, file, found: r.found, top: r.top })
            if (r.found) keep(active, file, 'found')
        } catch {
            setResult({ item: active, file, error: true })
        } finally {
            setChecking(false)
        }
    }

    // Save a photo for the postcard ("found" by the AI, or "counted" by the person)
    function keep(item, file, how) {
        setFound((prev) => {
            if (prev[item.id]) URL.revokeObjectURL(prev[item.id].url) // replacing a retake
            return { ...prev, [item.id]: { file, url: URL.createObjectURL(file), how } }
        })
    }

    function countAnyway() {
        keep(result.item, result.file, 'counted')
        setResult(null)
    }

    function finish() {
        // Photos in hunt order, for the postcard
        const photos = items.filter((item) => found[item.id]).map((item) => found[item.id].file)
        onDone(photos)
    }

    const foundCount = Object.keys(found).length
    const allFound = foundCount === items.length

    return (
        <section className="screen">
            <h1>Go find these!</h1>
            <p>{foundCount} of {items.length} found</p>

            {/* Hidden input: opens the back camera on phones, a file picker on laptops */}
            <input
                ref={cameraRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhoto}
                hidden
            />

            <ul className="item-list">
                {items.map((item) => {
                    const done = found[item.id]
                    return (
                        <li key={item.id}>
                            <button
                                className={`item-card ${done ? 'done' : ''}`}
                                onClick={() => openCamera(item)}
                                disabled={checking}
                            >
                                {done ? (
                                    <img src={done.url} alt="" className="thumb" />
                                ) : (
                                    <span className="item-emoji">{item.emoji}</span>
                                )}
                                <span className="item-label">{item.label}</span>
                                <span className="item-status">{done ? '✅' : '📷'}</span>
                            </button>
                        </li>
                    )
                })}
            </ul>

            {/* Checking overlay */}
            {checking && (
                // CHANGED: role="status" so screen readers announce "Checking…"
                <div className="sheet" role="status">
                    <div className="spinner" aria-hidden="true" />
                    <p>Checking your photo…</p>
                </div>
            )}

            {/* Result: found / not sure / couldn't check */}
            {result && !checking && (
                // CHANGED: "found" class turns the heading green; dialog roles for screen readers
                <div className={`sheet ${result.found ? 'found' : ''}`} role="dialog" aria-modal="true">
                    {result.found && (
                        <>
                            <h2>Found it! 🎉</h2>
                            <p>{result.item.emoji} {result.item.label}</p>
                            <button className="big-button" onClick={() => setResult(null)}>Keep going</button>
                        </>
                    )}

                    {!result.found && !result.error && (
                        <>
                            <h2>Hmm, not sure that's it</h2>
                            <p>
                                Looking for: {result.item.emoji} {result.item.label}
                                {result.top && result.top !== result.item.match && (
                                    <><br /><small>It looked more like {result.top}.</small></>
                                )}
                            </p>
                            <button className="big-button" onClick={() => openCamera(result.item)}>Try again</button>
                            <button onClick={countAnyway}>Count it anyway</button>
                        </>
                    )}

                    {result.error && (
                        <>
                            <h2>Couldn't check that one</h2>
                            <p>Something went wrong, but you can still count it.</p>
                            <button className="big-button" onClick={countAnyway}>Count it anyway</button>
                            <button onClick={() => openCamera(result.item)}>Try again</button>
                        </>
                    )}
                </div>
            )}

            {/* Finish: when everything's found, or early if they've had enough */}
            {foundCount > 0 && (
                <button className={allFound ? 'big-button' : 'link-button'} onClick={finish}>
                    {allFound ? 'Make our postcard! 📮' : "We're done, make the postcard"}
                </button>
            )}
        </section>
    )
}