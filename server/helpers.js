/**
 * @description Converts one time value into minutes
 * @param {string} time Time in format hh:mmAM
 * @returns {integer} The nuber of minutes of that time from midnight.
 */
const convertOneToMinutes = time => {
  let minutesSum = 0

  const hour = parseInt(time.substring(0,2))

  minutesSum += hour * 60

  const minutes = parseInt(time.substring(3,5))

  const ampm = time.substring(5,7)

  minutesSum += minutes

  if (ampm.toLowerCase() === 'pm') minutesSum += 12 * 60

  return minutesSum
}

/**
 * @description Converts a string or an array of time values into
 * minutes
 * @param {string/Array} time A string of time or an array of time values formatted in hh:mmAM
 * @returns {object} object.result will include either a string or array of the converted times. object.error will include an error message.
 */
module.exports.toMinutes = time => {
  if (typeof time === 'string') {
    return { result: convertOneToMinutes(time) }
  }

  if (Array.isArray(time)) {
    const convertedSchedule = []

    for (const t of time) {
      convertedSchedule.push(convertOneToMinutes(t))
    }

    return { result: convertedSchedule }
  }

  return { error: 'Not supported' }
}

/**
 * @description Converts a minute time into a human readable
 * time in format hh:mmAM
 * @param {integer} timeInMinutes 
 * @returns {string} hh:mmAM
 */
module.exports.toReadableTime = (timeInMinutes) => {
  let readable = ""

  const hours = timeInMinutes / 60

  if (hours <= 12) {
    let newHour =  Math.floor(hours).toString()

    if (newHour.length < 2) newHour = "0" + newHour
    readable += newHour
  } else {
    let newHour = (Math.floor(hours) - 12).toString()

    if (newHour.length < 2) newHour = "0" + newHour
    readable += newHour
  }

  const minutes = timeInMinutes % 60

  readable += ':'

  let newMinutes = minutes.toString()
  if (newMinutes.length < 2) newMinutes = "0" + newMinutes
  readable += newMinutes

  if (hours <= 12) {
    readable += "AM"
  } else {
    readable += "PM"
  }

  return readable
}

/**
 * Helps us to parse a request body from the http request
 * we receive.
 * @param {*} request 
 * @returns Promise
 */
module.exports.parseBody = (request) => {
  let body = ''
  return new Promise((resolve, reject) => {
    request.on('data', chunk => {
      body += chunk.toString()
    })
    request.on('end', () => {
      resolve(body)
    })
  })
}