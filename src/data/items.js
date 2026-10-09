// Who can come along. The Setup screen builds its checkboxes from this.
export const WHO = [
    { id: "kids", label: "Kids", emoji: "👧" },
    { id: "dog", label: "Walking the dog", emoji: "🐕" },
    { id: "easy", label: "Easy pace", emoji: "🧓" },
    { id: "adults", label: "Just adults", emoji: "🥾" },
];

// Rough latitude bands (see region.js). "anywhere" means it works with no location.
export const REGIONS = ["north", "middle", "south", "anywhere"];

// Month groups (Northern Hemisphere)
const ALL_YEAR = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const FALL = [9, 10, 11];
const WINTER = [12, 1, 2];
const SPRING = [3, 4, 5];
const SUMMER = [6, 7, 8];

// Hand-written list of things to find. Filtered and shuffled by buildHunt.js.
export const ITEMS = [
    {
        id: "red-leaf",
        label: "A red leaf",
        emoji: "🍁",
        who: ["kids", "adults", "easy", "dog"],
        regions: ["north", "middle"],
        months: FALL,
        match: "a red leaf",
        decoys: ["a green leaf", "a yellow leaf"],
    },
    {
        id: "squirrel",
        label: "A squirrel",
        emoji: "🐿️",
        who: ["kids", "adults", "easy", "dog"],
        regions: ["anywhere"],
        months: ALL_YEAR,
        match: "a squirrel",
        decoys: ["a chipmunk", "a cat", "a bird"],
    },
    {
        id: "bird",
        label: "A bird",
        emoji: "🐦",
        who: ["kids", "adults", "easy", "dog"],
        regions: ["anywhere"],
        months: ALL_YEAR,
        match: "a bird",
        decoys: ["a butterfly", "a bug"],
    },
    {
        id: "feather",
        label: "A feather",
        emoji: "🪶",
        who: ["kids", "adults"],
        regions: ["anywhere"],
        months: ALL_YEAR,
        match: "a feather",
        decoys: ["a leaf", "a stick"],
    },
    {
        id: "smooth-rock",
        label: "A smooth rock",
        emoji: "🪨",
        who: ["kids", "adults", "dog"],
        regions: ["anywhere"],
        months: ALL_YEAR,
        match: "a smooth rock",
        decoys: ["a pinecone", "a piece of bark"],
    },
    {
        id: "stick",
        label: "A stick",
        emoji: "🪵",
        who: ["kids", "dog"],
        regions: ["anywhere"],
        months: ALL_YEAR,
        match: "a stick",
        decoys: ["a root", "a snake"],
    },
    {
        id: "cloud",
        label: "A cloud",
        emoji: "☁️",
        who: ["kids", "adults", "easy", "dog"],
        regions: ["anywhere"],
        months: ALL_YEAR,
        match: "a cloud",
        decoys: ["blue sky", "a plane", "a bird"],
    },
    {
        id: "park-bench",
        label: "A park bench",
        emoji: "🪑",
        who: ["kids", "easy", "dog"],
        regions: ["anywhere"],
        months: ALL_YEAR,
        match: "a park bench",
        decoys: ["swings", "a light post"],
    },
    {
        id: "mailbox",
        label: "A mailbox",
        emoji: "📫",
        who: ["kids", "easy", "dog"],
        regions: ["anywhere"],
        months: ALL_YEAR,
        match: "a mailbox",
        decoys: ["a trashcan", "a birdhouse", "a solar light"],
    },
    {
        id: "another-dog",
        label: "Another dog",
        emoji: "🐶",
        who: ["kids", "dog"],
        regions: ["anywhere"],
        months: ALL_YEAR,
        match: "another dog",
        decoys: ["a chipmunk", "a cat", "a squirrel"],
    },
    {
        id: "flower",
        label: "A flower",
        emoji: "🌼",
        who: ["kids", "easy",],
        regions: ["anywhere"],
        months: [...SPRING, ...FALL, ...SUMMER],
        match: "a flower",
        decoys: ["a leaf", "a stick"],
    },
    {
        id: "acorn",
        label: "An acorn",
        emoji: "🌰",
        who: ["adults", "dog"],
        regions: ["north", "middle"],
        months: FALL,
        match: "an acorn",
        decoys: ["a pinecone", "a black walnut"],
    },
    {
        id: "pinecone",
        label: "A pinecone",
        emoji: "🌲",
        who: ["kids", "adults","dog"],
        regions: ["north", "middle"],
        months: [...FALL, ...WINTER],
        match: "a pinecone",
        decoys: ["a acorn", "a piece of bark", "a stick"],
    },
    {
        id: "pumpkin",
        label: "A pumpkin",
        emoji: "🎃",
        who: ["kids", "adults", "easy", "dog"],
        regions: ["north", "middle"],
        months: [9,10],
        match: "a pumpkin",
        decoys: ["a squash", "a orange ball", "a basketball"],
    },
];

// Dev-only: warn about missing fields and typos in who/regions
if (import.meta.env.DEV) {
    const whoIds = WHO.map((w) => w.id);
    const required = ["id", "label", "emoji", "who", "regions", "months", "match", "decoys"];

    for (const item of ITEMS) {
        const missing = required.filter((key) => item[key] === undefined);
        if (missing.length) {
            console.warn(`items.js: "${item.id}" is missing ${missing.join(", ")}`);
            continue; // skip the other checks for this item
        }

        for (const w of item.who) {
            if (!whoIds.includes(w)) console.warn(`items.js: "${item.id}" has unknown who "${w}"`);
        }
        for (const r of item.regions) {
            if (!REGIONS.includes(r)) console.warn(`items.js: "${item.id}" has unknown region "${r}"`);
        }
    }
}