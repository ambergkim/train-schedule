// Pretend database
const db = {}

/**
 * @description Sets a new key into our database for new train lines. Train lines keys shoudl start with 'line-'. May initialize a 'time-multi' key as well once we have information to add to it.
 * @param {string} key Database key. Only handles keys starting with 'line-'
 * @param {*} value Any value we want to put into the key at this time.
 * @returns Empty object if things go well. object.error if there is an error with the request.
 */
module.exports.set = (key, value) => {
  if (db[key]) return { error: "key already exists" }

  // if there is no time-multi key, add it
  if (!db['time-multi']) db['time-multi'] = []

  // Set the schedule for the train line
  db[key] = value

  // If the set is for a new line, add to the multi
  if (key.startsWith('line-')) {
    for (const time of value) {

      if (!db['time-multi'][time]) {
        db['time-multi'][time] = 1
        continue
      }

      db['time-multi'][time] = db['time-multi'][time] + 1
    }
  }
  return {}
}

/**
 * @description Retrieves a key from teh database
 * @param {string} key The key name
 * @returns 
 */
module.exports.fetch = key => {
  return db[key]
}

/**
 * @description Retrieves all the keys available from our database
 * @returns {Array} Array of keys available.
 */
module.exports.keys = () => {
  return Object.keys(db)
}