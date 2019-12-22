//Modified from 
//https://italonascimento.github.io/applying-a-timeout-to-your-promises/

/**
 * Wraps a promise in a timeout using promise.race
 * If the promise is timed out, it rejects and returns 'Timed out'
 * @param {*} promise The promise to time
 * @param {*} ms The timeout in ms
 */
export const timedPromise = (promise, ms) => {

    // Create a promise that rejects in <ms> milliseconds
    let timeout = new Promise((resolve, reject) => {
      setTimeout(() => reject('Timed out'),
        ms)
    })
  
    // Returns a race between our timeout and the passed in promise
    return Promise.race([
      promise,
      timeout
    ])
  }