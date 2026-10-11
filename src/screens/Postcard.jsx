import { useEffect, useState } from 'react'
import { drawPostcard } from '../lib/postcard'
import { sharePostcard, savePostcard, shareLink, isIOS } from '../lib/share'
import { challengeUrl } from '../lib/challenge'

export default function Postcard({ photos, items, choices, onPlayAgain }) {
    const [title, setTitle] = useState('')
    const [blob, setBlob] = useState(null)       // the finished postcard image
    const [previewUrl, setPreviewUrl] = useState(null)
    const [making, setMaking] = useState(false)
    const [message, setMessage] = useState('')

    const dog = choices?.who.includes('dog')      // 🐾 stamp if Tucker came
    const names = choices?.names || ''
    // share.js may export isIOS as a function or a true/false value; handle both
    const onIPhone = typeof isIOS === 'function' ? isIOS() : isIOS

    // Free the old preview image when it's replaced or the screen closes
    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl)
        }
    }, [previewUrl])

    // Draw the postcard BEFORE any share button is tapped.
    // Browsers only allow sharing right after a tap, so the image must already be ready.
    async function makePostcard(e) {
        e.preventDefault()
        setMaking(true)
        setMessage('')
        try {
            const result = await drawPostcard({ photos, title: title.trim(), names, dog })
            setBlob(result)
            setPreviewUrl(URL.createObjectURL(result))
        } catch {
            setMessage("Couldn't make the postcard. Try again?")
        } finally {
            setMaking(false)
        }
    }

    // Turn what share.js reports into a friendly message
    function report(outcome) {
        const messages = {
            shared: 'Shared! 🎉',
            downloaded: 'Saved to your downloads.',
            copied: 'Link copied. Paste it to a friend!',
            cancelled: '',
        }
        setMessage(messages[outcome] ?? '')
    }

    async function handleSave() {
        report(await savePostcard(blob, { title: title || 'Postcards from Outside' }))
    }

    async function handleShare() {
        report(
            await sharePostcard(blob, {
                title: title || 'Postcards from Outside',
                text: 'We went outside and found all these! 🍂',
            })
        )
    }

    async function handleChallenge() {
        const url = challengeUrl(items, names || undefined)
        report(await shareLink(url, 'Can you find these? 🍁'))
    }

    // Step 1: name the postcard
    if (!blob) {
        return (
            <section className="screen">
                <h1>You did it! 🎉</h1>
                <p>You found {photos.length} things. Let's make your postcard.</p>

                <form onSubmit={makePostcard}>
                    <label className="field">
                        <span>Give it a title</span>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Fall Walk with Tucker"
                            maxLength={60}
                        />
                    </label>
                    <button className="big-button" type="submit" disabled={making}>
                        {making ? 'Making your postcard…' : 'Make my postcard 📮'}
                    </button>
                </form>

                {message && <p className="hint">{message}</p>}
            </section>
        )
    }

    // Step 2: show it, then save / share / challenge
    return (
        <section className="screen">
            <h1>Your postcard</h1>
            <img src={previewUrl} alt={`Postcard: ${title || 'Postcards from Outside'}`} className="postcard-preview" />

            <button className="big-button" onClick={handleSave}>
                Save to my phone
            </button>
            {onIPhone && <p className="hint">On iPhone, tap "Save Image" in the menu that opens.</p>}

            <button className="big-button" onClick={handleShare}>
                Share
            </button>

            {/* <button className="big-button" onClick={handleChallenge}>
                Challenge a friend
            </button>
            <p className="hint">Sends a link with the same list, so they can go find them too.</p> */}

            {message && <p className="hint">{message}</p>}

            <p>
                <button type="button" className="link-button" onClick={() => setBlob(null)}>
                    Change the title
                </button>
                {' · '}
                <button type="button" className="link-button" onClick={onPlayAgain}>
                    Start a new hunt
                </button>
            </p>
        </section>
    )
}