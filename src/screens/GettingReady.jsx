import { useEffect, useState } from 'react'
import { loadVision } from '../lib/vision'

export default function GettingReady({ onReady }) {
    const [progress, setProgress] = useState(0)
    const [failed, setFailed] = useState(false)
    const [attempt, setAttempt] = useState(0) // bump to retry

    useEffect(() => {
        let active = true // ignore results if this screen has closed
        setFailed(false)

        loadVision((p) => active && setProgress(Math.round(p)))
            .then(() => active && onReady())
            .catch(() => active && setFailed(true))

        return () => {
            active = false
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [attempt])

    if (failed) {
        return (
            <section className="screen">
                <h2>Couldn't get ready</h2>
                <p>Check your internet connection and try again.</p>
                <button className="big-button" onClick={() => setAttempt((a) => a + 1)}>
                    Try again
                </button>
            </section>
        )
    }

    return (
        <section className="screen">
            <h2>Getting your hunt ready…</h2>
            <p>
                The first time takes a minute or two, so Wi-Fi is best. Nothing gets installed,
                and it's saved in your browser so next time is quicker.
            </p>

            <div className="progress" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
                <div className="progress-bar" style={{ width: `${progress}%` }} />
            </div>

            <p>{progress < 100 ? `${progress}%` : 'Almost ready…'}</p>
        </section>
    )
}