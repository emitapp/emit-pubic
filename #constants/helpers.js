/**
 * Wraps a promise in a timeout using promise.race
 * If the promise is timed out, it rejects and returns 'Timed out'
 * @param {*} promise The promise to time
 * @param {*} ms The timeout in ms
 */
//https://italonascimento.github.io/applying-a-timeout-to-your-promises/
export const timedPromise = (promise, ms) => {

  // Create a promise that rejects in <ms> milliseconds
  let timeout = new Promise((resolve, reject) => {
    setTimeout(() => reject({
      code: "timeout",
      message: `Your Promise timed out after ${ms} milliseconds`
    }),
      ms)
  })

  // Returns a race between our timeout and the passed in promise
  return Promise.race([
    promise,
    timeout
  ])
}


export const SHORT_TIMEOUT = 3000
export const MEDIUM_TIMEOUT = 5000
export const LONG_TIMEOUT = 10000


/**
 * Determines is a string is only whitespace
 * @param {*} str The stirng
 */
//https://stackoverflow.com/questions/10261986/how-to-detect-string-which-contains-only-spaces/50971250
export const isOnlyWhitespace = (str) => {
  return str.replace(/\s/g, '').length == 0
}

/**
 * Converts epoch timestamps to date strings
 * @param {*} epochMillis The epoch timestamp
 */
export const epochToDateString = (epochMillis) =>
{
  return new Date(epochMillis).toString()
}

export const MIN_BROADCAST_WINDOW = 2 //2 minutes
export const MAX_BROADCAST_WINDOW = 2879 //48 hours - 1 minute