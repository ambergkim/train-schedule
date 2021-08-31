const db = require('./db')
const { parseBody, toMinutes, toReadableTime } = require('./helpers')

/**
 * @description The controller/handler for the sever route at /line
 * @param {*} request 
 * @param {*} response 
 */
module.exports.line = async (request, response) => {
  const body = await parseBody(request)
  const json = await JSON.parse(body)
  const { line: lineName, schedule } = json

  // Check that we have the information that we need.
  if (!lineName || !schedule) {
    console.error(`ERROR: Bad Request.`)
    response.statusCode = 400
    response.end(JSON.stringify({ status: 'Bad Request.'}))
    return
  }

  // Check that the line name matches requirements
  if (lineName.length > 4 || !lineName.match(/^[0-9a-zA-Z]+$/)) {
    console.error(`ERROR: line name invalid.`)
    response.statusCode = 400
    response.end(JSON.stringify({ status: 'Line name is invalid.'}))

    return
  }

  // Convert the passed in schedule into minutes
  const { result: convertedSchedule, error: conversionError } = toMinutes(schedule)
  if (conversionError) {
    console.error(`ERROR: ${conversionError}`)
    response.statusCode = 400
    response.end(JSON.stringify({ status: 'Error processing schedule.'}))
    return
  }

  // Build the database key for the line.
  const lineKey = `line-${lineName.toLowerCase()}`

  // Save to our database
  const { error: dbError } = db.set(lineKey, convertedSchedule)

  // If there is an error saving to the databse
  if (dbError) {
    console.error(`ERROR: ${dbError}`)
    response.statusCode = 400
    response.end(JSON.stringify({ status: 'Error saving schedule.'}))
    return
  }

  // Send back a status to the client
  response.writeHead(200, { 'Content-Type': 'application/json' })
  response.end(JSON.stringify({ status: 'Schedule saved.'}))

  return
}

/**
 * @description Checks a list of time in minutes from the time
 * provided.
 * @param {integer} timeMinutes 
 * @param {Array} multiList Array of integers
 * @returns the first index found that has an integer of 2 or more.
 */
const checkAfterQueryTime = (timeMinutes, multiList) => {
  for (let i = timeMinutes + 1; i < multiList.length; i++) {
    const current = multiList[i]

    if (!current || current < 2) continue

    return i
  }
}

/**
 * @description Checks that a list of time in minutes from up to
 * the time provided
 * @param {integer} timeMinutes 
 * @param {Array} multiList 
 * @returns the first index found that has an integer of 2 or more.
 */
const checkBeforeQueryTime = (timeMinutes, multiList) => {
  for (let i = 0; i <= timeMinutes; i++) {
    const current = multiList[i]

    if (!current || current < 2) continue

    return i
  }
}

/**
 * @description The controller/handler for the route /next?time=<a time>
 * @param {*} request 
 * @param {*} response 
 */
module.exports.nextMulti = async (request, response) => {
  // Check that the query has the necessary info we need
  if (!request.queries || !request.queries.time) {
    console.error(`ERROR: Missing query.`)
    response.statusCode = 400
    response.end(JSON.stringify({ status: 'Missing Query.'}))

    return
  }

  // Convert the query time we get into minutes
  const { result: timeMinutes } = toMinutes(request.queries.time)
  
  let foundTime = null

  // Grab the time counts from the database
  const multiList = db.fetch('time-multi')

  // Check the last half of the db multi
  foundTime = checkAfterQueryTime(timeMinutes, multiList)
  
  if (!foundTime) {
    // Check the first half of the db multi
    foundTime = checkBeforeQueryTime(timeMinutes, multiList)
  }

  // Return no results if we can't find a time
  if (!foundTime) {
    console.info(`Next time not found.`)
    response.statusCode = 200
    response.end(JSON.stringify({ result: ''}))

    return
  }

  // If we find a time, return a human readable version of the time.
  const readableFoundTime = toReadableTime(foundTime)

  console.info(`Found the next time: ${readableFoundTime}`)
  response.statusCode = 200
  response.end(JSON.stringify({ result: readableFoundTime}))

  return
}