import { useState } from 'react'

export default function Challenged({ challenge, onStart, onSkip }) {
    const [names, setNames] = useState('')
    const [dog, setDog] = useState(false)

    function start(e) {
        e.preventDefault()
        onStart({ names: names.trim(), dog })
    }

    return (
        <section className="screen">
            <h1>You've been challenged! 🍁</h1>
            {challenge.from && <p>From <strong>{challenge.from}</strong></p>}
            <p>Can you find all {challenge.items.length} of these?</p>

            <ul className="item-list">
                {challenge.items.map((item) => (
                    <li key={item.id} className="item-card">
                        <span className="item-emoji">{item.emoji}</span>
                        <span className="item-label">{item.label}</span>
                    </li>
                ))}
            </ul>

            <form onSubmit={start}>
                <label className="field">
                    <span>Your names for the postcard</span>
                    <input
                        type="text"
                        value={names}
                        onChange={(e) => setNames(e.target.value)}
                        placeholder="Who's going?"
                    />
                </label>

                <label className="choice">
                    <input type="checkbox" checked={dog} onChange={(e) => setDog(e.target.checked)} />
                    <span>🐕 Bringing a dog</span>
                </label>

                <button className="big-button" type="submit">Accept the challenge!</button>
            </form>

            <button type="button" className="link-button" onClick={onSkip}>
                No thanks, make my own hunt
            </button>
        </section>
    )
}