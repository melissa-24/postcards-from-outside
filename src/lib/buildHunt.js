import { ITEMS } from '../data/items';

// Shuffle a copy of an array (Fisher-Yates), so the original list isn't changed
function shuffle(list) {
    const copy = [...list];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1)); // random index from 0 to i
        [copy[i], copy[j]] = [copy[j], copy[i]];        // swap the two items
    }
    return copy;
}

/**
 * Build a hunt from the item list.
 * who:    array of company ids, e.g. ["adults", "easy", "dog"]
 *         (empty means "no preference": every item counts as a fit)
 * region: "north" | "middle" | "south", or null if they skipped location
 * month:  1-12. Note: Date.getMonth() is 0-11, so pass new Date().getMonth() + 1
 * size:   how many items (5 or 8). May return fewer if the season/region pool is small.
 */
export function buildHunt({ who, region, month, size }, items = ITEMS) {
    // 1. Season: keep items findable this month
    const inSeason = items.filter((item) => item.months.includes(month));

    // 2. Region: "anywhere" items always pass; regional items only if they match
    const inRegion = inSeason.filter(
        (item) =>
            item.regions.includes("anywhere") ||
            (region && item.regions.includes(region))
    );

    // 3. Who is a preference, not a filter. Three tiers:
    //    items that suit everyone, then items that suit someone, then anything else in season.
    const forEveryone = inRegion.filter((item) =>
        who.every((id) => item.who.includes(id))
    );

    const forSomeone = inRegion.filter(
        (item) =>
            !forEveryone.includes(item) &&
            who.some((id) => item.who.includes(id))
    );

    const everythingElse = inRegion.filter(
        (item) => !forEveryone.includes(item) && !forSomeone.includes(item)
    );

    // 4. Shuffle each tier, keep the order, take as many as needed
    return [
        ...shuffle(forEveryone),
        ...shuffle(forSomeone),
        ...shuffle(everythingElse),
    ].slice(0, size);
}