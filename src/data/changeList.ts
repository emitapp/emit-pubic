type changeList = Array<{
    timestamp: number, //in millis
    change: string
}>

// This supports markdown!
// Ideally, the timestamps should be Dates, but Dates are very inconsistent in 
// since Android uses an incomplete JS core, not all of their functionality 
// is supported.
// https://stackoverflow.com/questions/56943813/using-intl-properly-in-android-react-native-app
// https://stackoverflow.com/questions/48798794/running-variable-is-nan-but-debugging-variable-isnt-nan-why/48799918
// https://stackoverflow.com/questions/3367415/get-epoch-for-a-specific-date-using-javascript
// https://moment.github.io/luxon/#/
// We'll fix this eventually.

/**
 * Arranged such that the most recent change comes first in the array. 
 */
const changes : changeList = [
    {
        timestamp: 1630373735000,
        change: "Once you confirm your email, you can now send flares only other verified students in your college can see! 🗝️",
    },
    {
        timestamp: 1630268531000,
        change: "It's now possible to edit and delete public flares! ✏️",
    },
    {
        timestamp: 1628695869300,
        change: "Users can now verify their school email addresses to get **school badges**! This is a precursor to school-specific flares, coming soon! 🎓",
    },
    {
        timestamp: 1627248025084,
        change: "Adding location tags to flares is now much easier with **location autocomplete** while you type! 🗺️",
    },
    {
        timestamp: 1625443200000,
        change: "We added **user avatars**! Now, users can set their profile pictures to fun Emit avatars. 🎭",
    },
    {
        timestamp: 1625443200000,
        change: "You asked for it, we added it! **Recurring flares** are now possible! Thanks to everyone for the feedback. ⏲️",
    },
    {
        timestamp: 1625443200000,
        change: "You can now **edit and delete flares**! This is supported for normal flares, support for public flares is upcoming! ✏️",
    },
].sort((a, b) => b.timestamp - a.timestamp) 

export default changes
