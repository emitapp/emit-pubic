export interface Activity {
    name: string
    emoji: string
    info?: string
}

type ActivityList = Array<{
    sectionName: string,
    data: Activity[]
}>

export const getAllActivities = () : ActivityList => [
    {
        sectionName: "Featured",
        data: [
            { emoji: "🥳", name: "Party" },
            { emoji: "🟡", name: "Spikeball" },
            { emoji: "🥏", name: "Frisbee" },
            { emoji: "🧪", name: "COVID Test" },
            { emoji: "🛒", name: "Garage Sale"}
        ],
    },
    {
        sectionName: "Study",
        data: [
            { emoji: "📝", name: "Problem Sets" },
            { emoji: "📋", name: "Exam Prep" },
            { emoji: "📚", name: "Studying" },
            { emoji: "📓", name: "Project" },
        ],
    },
    {
        sectionName: "Entertainment",
        data: [
            { emoji: "🎬", name: "Netflix" },
            { emoji: "🎮", name: "Gaming" },
            { emoji: "🔫", name: "Call of Duty" },
            { emoji: "⚔️", name: "League of Legends" },
            { emoji: "🃏", name: "Poker" },
            { emoji: "⚽", name: "FIFA" },
            { emoji: "🥊", name: "Super Smash Bros." },
            { emoji: "🐉", name: "Yu-Gi-Oh!" },
            { emoji: "🐣", name: "Pokémon" },
            {
                emoji: "🏝️", name: "Catan",
                info: "A game based on gathering territory and recources to grow the most powerful empire.",
            },
            { emoji: "🧝🏼‍♀️", name: "Magic: The Gathering" },
            {
                emoji: "🦀", name: "Rocketcrab.com",
                info: "A place to play phone party games with others.",
            },
            { emoji: "🔎", name: "Among Us" },
            {
                emoji: "🏎️", name: "Rocket League",
                info: "A popular video game that combines rocket powered cars with soccer. Best for 2 to 8 people.",
            },
            { emoji: "♟️", name: "Chess" },
            { emoji: "♠️", name: "Cards" },
            {
                emoji: "🤭", name: "Cards Against Humanity",
            },
            {
                emoji: "🕵️", name: "Codenames",
                info: "A hint-based word guessing game.",
            },
            {
                emoji: "🦠", name: "Covidopoly",
                info: "\"An online, multiplayer, monopoly-deal inspired game\"",
            },
            {
                emoji: "🖌️", name: "Skribbl.io",
                info: "\"A free multiplayer drawing and guessing game\"",
            },
        ],
    },
    {
        sectionName: "Food",
        data: [
            { emoji: "🥞", name: "Breakfast" },
            { emoji: "🍲", name: "Dinner" },
            { emoji: "🌯", name: "Lunch" },
            { emoji: "🍻", name: "Drinks" },
            { emoji: "🧋", name: "Bubble Tea" },
            { emoji: "🥤", name: "Smoothie" },
            { emoji: "🍳", name: "Cooking" },
            { emoji: "🥧", name: "Baking" },
        ],
    },
    {
        sectionName: "Exercise",
        data: [
            { emoji: "🏃‍♀️", name: "Running" },
            { emoji: "🚶", name: "Walk" },
            { emoji: "🚴🏽", name: "Biking" },
            { emoji: "🧗", name: "Rock Climbing" },
            { emoji: "🎾", name: "Tennis" },
            { emoji: "💪", name: "Workout" },
            { emoji: "⚽️", name: "Soccer" },
            { emoji: "🏀", name: "Basketball" },
            { emoji: "🏈", name: "Football" },
        ],
    },
]
