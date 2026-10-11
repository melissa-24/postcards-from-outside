import { useRef, useState } from 'react'
import { checkPhoto } from '../lib/vision'

export default function Hunt({ items, onDone }) {
    const cameraRef = useRef(null)                 // hidden input: opens the camera
    const libraryRef = useRef(null)                // NEW: hidden input: opens the photo library
    const [active, setActive] = useState(null)     // the item being photographed
    const [choosing, setChoosing] = useState(false) // NEW: showing "Take or Choose?"
    const [found, setFound] = useState({})         // { [itemId]: { file, url, how } }
    const [checking, setChecking] = useState(false)
    const [result, setResult] = useState(null)     // { item, file, found, top, error }

    // CHANGED: tap a card → ask "take a photo or choose one?"
    function openChooser(item) {
        setActive(item)
        setResult(null)
        setChoosing(true)
    }

    // NEW: the two choices. These run straight from a tap, which browsers require.
    function takePhoto() {
        setChoosing(false)
        cameraRef.current.click()
    }

    function choosePhoto() {
        setChoosing(false)
        libraryRef.current.click()
    }

    // A photo was taken or picked (both inputs land here)
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
            {/* NEW: tip for the "walk first, attach later" style */}
            <p className="hint">
                Tip: get close so the thing fills most of the photo. You can snap with your camera as
                you walk and add the photos later.
            </p>

            {/* CHANGED: two hidden inputs, one for the camera, one for the photo library */}
            <input
                ref={cameraRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhoto}
                hidden
            />
            <input
                ref={libraryRef}
                type="file"
                accept="image/*"
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
                                onClick={() => openChooser(item)}  // CHANGED
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

            {/* NEW: "Take or choose?" sheet */}
            {choosing && active && (
                <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="choose-title">
                    <h2 id="choose-title">{active.emoji} {active.label}</h2>
                    <button className="big-button" onClick={takePhoto}>📷 Take a photo</button>
                    <button className="big-button" onClick={choosePhoto}>🖼️ Choose from my photos</button>
                    <button type="button" className="link-button" onClick={() => setChoosing(false)}>
                        Cancel
                    </button>
                </div>
            )}

            {/* Checking overlay */}
            {checking && (
                <div className="sheet" role="status">
                    <div className="spinner" aria-hidden="true" />
                    <p>Checking your photo…</p>
                </div>
            )}

            {/* Result: found / not sure / couldn't check */}
            {result && !checking && (
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
                            {/* CHANGED: Try again offers take-or-choose too */}
                            <button className="big-button" onClick={() => openChooser(result.item)}>Try again</button>
                            <button onClick={countAnyway}>Count it anyway</button>
                        </>
                    )}

                    {result.error && (
                        <>
                            <h2>Couldn't check that one</h2>
                            <p>Something went wrong, but you can still count it.</p>
                            <button className="big-button" onClick={countAnyway}>Count it anyway</button>
                            <button onClick={() => openChooser(result.item)}>Try again</button>
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