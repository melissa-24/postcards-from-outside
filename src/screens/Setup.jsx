import { useState } from 'react'
import { WHO } from '../data/items'
import { lookupRegion } from '../lib/region'

export default function Setup({ onStart }) {
    const [who, setWho] = useState([])            // e.g. ["adults", "easy", "dog"]
    const [names, setNames] = useState('')        // for the postcard
    const [place, setPlace] = useState('')        // what they typed
    const [location, setLocation] = useState(null) // { region, latitude, name } after lookup
    const [lookup, setLookup] = useState('idle')  // idle | looking | notfound | error
    const [size, setSize] = useState(8)

    // Tick or untick a "who" checkbox
    function toggleWho(id) {
        setWho((current) =>
            current.includes(id) ? current.filter((w) => w !== id) : [...current, id]
        )
    }

    // Look up the place only when they press the button (Nominatim's rules)
    async function findPlace(e) {
        e.preventDefault()
        if (!place.trim()) return
        setLookup('looking')
        try {
            const result = await lookupRegion(place)
            if (result) {
                setLocation(result)
                setLookup('idle')
            } else {
                setLookup('notfound')
            }
        } catch {
            setLookup('error')
        }
    }

    function clearLocation() {
        setLocation(null)
        setPlace('')
        setLookup('idle')
    }

    function start() {
        onStart({
            who,
            names: names.trim(),
            region: location?.region ?? null, // null means "anywhere" items only
            place: location?.name ?? null,
            size,
        })
    }

    // Nominatim names are long ("Wappingers Falls, Town of Wappinger, Dutchess County, ...")
    const shortPlace = location?.name.split(',').slice(0, 3).join(',')

    return (
        <section className="screen">
            <h1>Set up your hunt</h1>

            {/* Who's coming */}
            <fieldset>
                <legend>Who's coming along?</legend>
                {WHO.map((w) => (
                    <label key={w.id} className="choice">
                        <input
                            type="checkbox"
                            checked={who.includes(w.id)}
                            onChange={() => toggleWho(w.id)}
                        />
                        <span>{w.emoji} {w.label}</span>
                    </label>
                ))}
            </fieldset>

            {/* Names for the postcard */}
            <label className="field">
                <span>Names for the postcard</span>
                <input
                    type="text"
                    value={names}
                    onChange={(e) => setNames(e.target.value)}
                    placeholder="Melissa, Mom & Tucker"
                />
            </label>

            {/* Optional location */}
            <fieldset>
                <legend>Where are you? <em>(optional)</em></legend>

                {location ? (
                    <p>
                        Using: <strong>{shortPlace}</strong>{' '}
                        <button type="button" className="link-button" onClick={clearLocation}>
                            Change
                        </button>
                    </p>
                ) : (
                    <form onSubmit={findPlace} className="inline-form">
                        <input
                            type="text"
                            value={place}
                            onChange={(e) => setPlace(e.target.value)}
                            placeholder="City, State or ZIP"
                        />
                        <button type="submit" disabled={lookup === 'looking' || !place.trim()}>
                            {lookup === 'looking' ? 'Looking…' : 'Look up'}
                        </button>
                    </form>
                )}

                {lookup === 'notfound' && <p className="hint">Couldn't find that place. Try a ZIP code, or skip it.</p>}
                {lookup === 'error' && <p className="hint">Couldn't look that up right now. You can skip it.</p>}

                <p className="hint">
                    Helps pick things that grow where you are this time of year. The lookup goes to
                    OpenStreetMap. Skip it and you'll get things found almost anywhere.
                    <br />
                    <small>Place search © OpenStreetMap contributors</small>
                </p>
            </fieldset>

            {/* Hunt size */}
            <fieldset>
                <legend>How long a hunt?</legend>
                <label className="choice">
                    <input type="radio" name="size" checked={size === 5} onChange={() => setSize(5)} />
                    <span>Quick (5 things)</span>
                </label>
                <label className="choice">
                    <input type="radio" name="size" checked={size === 8} onChange={() => setSize(8)} />
                    <span>Regular (8 things)</span>
                </label>
            </fieldset>

            <button className="big-button" onClick={start} disabled={who.length === 0}>
                Let's go!
            </button>
            {who.length === 0 && <p className="hint">Pick who's coming to start.</p>}
        </section>
    )
}